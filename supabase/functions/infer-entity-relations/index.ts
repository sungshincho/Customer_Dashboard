import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InferenceRequest {
  entity_id?: string; // 특정 엔티티만 처리
  batch_size?: number; // 한 번에 처리할 엔티티 수
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { entity_id, batch_size = 10 } = await req.json() as InferenceRequest;

    console.log(`🧠 Starting relation inference (batch_size: ${batch_size})`);

    // 처리할 엔티티 가져오기
    let query = supabase
      .from('ontology_relation_inference_queue')
      .select(`
        id,
        user_id,
        org_id,
        entity_id,
        retry_count,
        entity:graph_entities!ontology_relation_inference_queue_entity_id_fkey(
          id,
          label,
          properties,
          entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(name, label)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batch_size);

    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    }

    const { data: queueItems, error: queueError } = await query;

    if (queueError) throw queueError;
    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No pending entities to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Processing ${queueItems.length} entities`);

    let totalRelationsCreated = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const item of queueItems) {
      try {
        // 상태를 processing으로 업데이트
        await supabase
          .from('ontology_relation_inference_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        const entity = item.entity as any;
        if (!entity) {
          console.warn(`⚠️ Entity not found: ${item.entity_id}`);
          await supabase
            .from('ontology_relation_inference_queue')
            .update({
              status: 'failed',
              error_message: 'Entity not found',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          failureCount++;
          continue;
        }

        console.log(`\n🔍 Processing entity: ${entity.label} (${entity.entity_type?.name})`);

        // 같은 사용자의 다른 엔티티들 가져오기 (최대 100개)
        const { data: otherEntities, error: entitiesError } = await supabase
          .from('graph_entities')
          .select(`
            id,
            label,
            properties,
            entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(name, label)
          `)
          .eq('user_id', item.user_id)
          .neq('id', entity.id)
          .limit(100);

        if (entitiesError) throw entitiesError;
        if (!otherEntities || otherEntities.length === 0) {
          console.log('  ℹ️ No other entities found for relation inference');
          await supabase
            .from('ontology_relation_inference_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          successCount++;
          continue;
        }

        // AI 프롬프트 생성
        const prompt = `당신은 온톨로지 관계 추론 전문가입니다. 다음 엔티티와 다른 엔티티들 간의 잠재적인 관계를 분석하세요.

**대상 엔티티:**
- ID: ${entity.id}
- Label: ${entity.label}
- Type: ${entity.entity_type?.name || 'Unknown'}
- Properties: ${JSON.stringify(entity.properties, null, 2)}

**다른 엔티티들 (${otherEntities.length}개):**
${otherEntities.slice(0, 20).map((e: any) => `
- ${e.label} (${e.entity_type?.name || 'Unknown'})
  Properties: ${JSON.stringify(e.properties, null, 2).substring(0, 200)}...
`).join('\n')}

**분석 지침:**
1. 대상 엔티티와 관련이 있을 가능성이 높은 엔티티들을 식별하세요
2. 각 관계의 타입(예: purchased, located_in, belongs_to, similar_to)을 정의하세요
3. 관계의 방향성(directed/undirected)을 판단하세요
4. 신뢰도 점수(0.0-1.0)를 부여하세요
5. 중요: 신뢰도가 0.6 이상인 관계만 반환하세요

**관계 타입 예시:**
- purchased: 고객이 제품을 구매
- located_in: 제품이 매장에 위치
- belongs_to: 제품이 카테고리/브랜드에 속함
- similar_to: 유사한 제품/고객
- visited: 고객이 매장 방문
- works_at: 직원이 매장에서 근무`;

        console.log('  🤖 Calling AI for relation inference...');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: '온톨로지 관계 추론 전문가로서 데이터 간의 의미있는 관계를 분석하고 추천합니다.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'create_entity_relations',
                  description: '엔티티 간의 관계를 생성합니다',
                  parameters: {
                    type: 'object',
                    properties: {
                      relations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            target_entity_id: { 
                              type: 'string',
                              description: '관계 대상 엔티티 ID'
                            },
                            relation_type: {
                              type: 'string',
                              description: '관계 타입 (예: purchased, located_in, belongs_to)'
                            },
                            relation_label: {
                              type: 'string',
                              description: '관계 레이블 (사람이 읽기 쉬운 형태)'
                            },
                            directionality: {
                              type: 'string',
                              enum: ['directed', 'undirected'],
                              description: '관계의 방향성'
                            },
                            confidence: {
                              type: 'number',
                              description: '신뢰도 점수 (0.0-1.0), 최소 0.6 이상만 반환'
                            },
                            reasoning: {
                              type: 'string',
                              description: '이 관계를 추론한 근거'
                            }
                          },
                          required: ['target_entity_id', 'relation_type', 'relation_label', 'confidence']
                        }
                      }
                    },
                    required: ['relations']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'create_entity_relations' } }
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('  ❌ AI inference error:', errorText);
          throw new Error(`AI inference failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          console.log('  ℹ️ No relations inferred by AI');
          await supabase
            .from('ontology_relation_inference_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          successCount++;
          continue;
        }

        const inferenceResult = JSON.parse(toolCall.function.arguments);
        const relations = inferenceResult.relations || [];

        console.log(`  ✅ AI inferred ${relations.length} potential relations`);

        let relationsCreated = 0;

        for (const relation of relations) {
          try {
            if (relation.confidence < 0.6) {
              console.log(`    ⏭️ Skipping low confidence relation: ${relation.relation_type} (${relation.confidence})`);
              continue;
            }

            // 관계 타입 찾기 또는 생성
            let { data: relationType } = await supabase
              .from('ontology_relation_types')
              .select('id')
              .eq('user_id', item.user_id)
              .eq('name', relation.relation_type)
              .maybeSingle();

            if (!relationType) {
              const { data: newRelationType, error: rtError } = await supabase
                .from('ontology_relation_types')
                .insert({
                  user_id: item.user_id,
                  org_id: item.org_id,
                  name: relation.relation_type,
                  label: relation.relation_label || relation.relation_type,
                  source_entity_type: entity.entity_type?.name || 'Unknown',
                  target_entity_type: 'Any',
                  directionality: relation.directionality || 'directed',
                  description: relation.reasoning || 'AI-inferred relation',
                })
                .select()
                .single();

              if (rtError) {
                console.error('    ❌ Failed to create relation type:', rtError);
                continue;
              }
              relationType = newRelationType;
              console.log(`    🆕 Created relation type: ${relation.relation_type}`);
            }

            if (!relationType) {
              console.error('    ❌ Relation type is null, skipping');
              continue;
            }

            // 관계 생성
            const { error: relationError } = await supabase
              .from('graph_relations')
              .insert({
                user_id: item.user_id,
                org_id: item.org_id,
                relation_type_id: relationType.id,
                source_entity_id: entity.id,
                target_entity_id: relation.target_entity_id,
                weight: relation.confidence,
                properties: {
                  ai_inferred: true,
                  confidence: relation.confidence,
                  reasoning: relation.reasoning,
                  inferred_at: new Date().toISOString(),
                },
              });

            if (relationError) {
              // 중복 관계는 무시
              if (relationError.code !== '23505') {
                console.error('    ❌ Failed to create relation:', relationError);
              }
            } else {
              console.log(`    ✅ Created relation: ${relation.relation_type} (confidence: ${relation.confidence})`);
              relationsCreated++;
            }
          } catch (relError) {
            console.error('    ❌ Relation creation error:', relError);
          }
        }

        totalRelationsCreated += relationsCreated;

        // 큐 상태를 completed로 업데이트
        await supabase
          .from('ontology_relation_inference_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        successCount++;
        console.log(`  ✅ Completed: ${relationsCreated} relations created`);

      } catch (error: any) {
        console.error(`❌ Error processing entity ${item.entity_id}:`, error);

        // 실패 카운트 증가 및 상태 업데이트
        const currentRetryCount = (item as any).retry_count || 0;
        await supabase
          .from('ontology_relation_inference_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: currentRetryCount + 1,
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        failureCount++;
      }
    }

    console.log('\n🎉 Batch processing completed');
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Failures: ${failureCount}`);
    console.log(`  - Total relations created: ${totalRelationsCreated}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: queueItems.length,
        success_count: successCount,
        failure_count: failureCount,
        relations_created: totalRelationsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Inference error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
