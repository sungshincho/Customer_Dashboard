import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartMappingRequest {
  import_id: string;
  id_columns: string[];
  foreign_key_columns: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { import_id, id_columns, foreign_key_columns } = await req.json() as SmartMappingRequest;

    console.log('🧠 Smart ontology mapping for import:', import_id);

    // 데이터 가져오기
    const { data: importData, error: fetchError } = await supabase
      .from('user_data_imports')
      .select('*')
      .eq('id', import_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !importData) {
      throw new Error('Import not found');
    }

    const rawData = importData.raw_data as any[];
    const columns = Object.keys(rawData[0] || {});
    const dataSample = rawData.slice(0, 10);

    // 기존 온톨로지 스키마 가져오기
    const { data: entityTypes } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', user.id);

    const { data: relationTypes } = await supabase
      .from('ontology_relation_types')
      .select('*')
      .eq('user_id', user.id);

    console.log(`📋 Existing: ${entityTypes?.length || 0} entity types, ${relationTypes?.length || 0} relation types`);

    // AI 기반 정교한 매핑
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const mappingPrompt = `당신은 온톨로지 설계 전문가입니다. 다음 데이터를 분석하고 완벽한 온톨로지 매핑을 생성하세요.

**데이터 정보:**
- 타입: ${importData.data_type}
- 파일: ${importData.file_name}
- 행 수: ${rawData.length}
- 컬럼: ${columns.join(', ')}

**식별된 ID 컬럼:** ${id_columns.join(', ')}
**외래 키 컬럼:** ${JSON.stringify(foreign_key_columns)}

**샘플 데이터 (10개):**
${JSON.stringify(dataSample, null, 2)}

**기존 엔티티 타입:**
${entityTypes?.map(et => `- ${et.name} (${et.label})`).join('\n') || '없음'}

**기존 관계 타입:**
${relationTypes?.map(rt => `- ${rt.name}: ${rt.source_entity_type} -> ${rt.target_entity_type}`).join('\n') || '없음'}

**매핑 지침:**
1. **엔티티 타입 결정**:
   - 기존 엔티티 타입을 최대한 재사용
   - 필요하면 새로운 엔티티 타입 생성 (create_new: true)
   - 각 엔티티에 모든 관련 properties 매핑

2. **Label 템플릿**:
   - ID 컬럼을 우선 사용
   - 의미 있는 이름 컬럼 사용
   - 예: {product_id}, {customer_name}, {store_code}

3. **Properties 매핑**:
   - **중요**: 모든 ID 컬럼은 반드시 properties에 포함
   - 외래 키 컬럼도 properties에 포함
   - 원본 컬럼명 그대로 사용

4. **관계 생성**:
   - 외래 키를 기반으로 관계 자동 생성
   - source_key와 target_key는 실제 컬럼명 사용
   - 기존 관계 타입 재사용, 없으면 생성

**응답 예시:**
entity_type_id가 기존 타입 ID면 재사용, "NEW"면 생성 필요`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: '온톨로지 설계 전문가로서 정확하고 완전한 매핑을 생성하세요. 모든 ID 컬럼과 외래 키를 properties에 반드시 포함시키세요.'
          },
          {
            role: 'user',
            content: mappingPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_ontology_mapping',
              description: '온톨로지 매핑을 생성합니다',
              parameters: {
                type: 'object',
                properties: {
                  entity_mappings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        entity_type_id: {
                          type: 'string',
                          description: '기존 엔티티 타입 ID 또는 "NEW"'
                        },
                        entity_type_name: { type: 'string' },
                        entity_type_label: { type: 'string' },
                        create_new: {
                          type: 'boolean',
                          description: '새 엔티티 타입 생성 여부'
                        },
                        properties_definition: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              type: { type: 'string' },
                              required: { type: 'boolean' }
                            }
                          },
                          description: '새 엔티티 타입의 속성 정의'
                        },
                        column_mappings: {
                          type: 'object',
                          description: '속성명 -> 컬럼명 매핑 (모든 ID 컬럼 포함!)'
                        },
                        label_template: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['entity_type_id', 'entity_type_name', 'column_mappings', 'label_template']
                    }
                  },
                  relation_mappings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        relation_type_id: {
                          type: 'string',
                          description: '기존 관계 타입 ID 또는 "NEW"'
                        },
                        relation_type_name: { type: 'string' },
                        relation_type_label: { type: 'string' },
                        create_new: { type: 'boolean' },
                        source_entity_type_id: { type: 'string' },
                        target_entity_type_id: { type: 'string' },
                        source_key: {
                          type: 'string',
                          description: '소스 엔티티의 ID 컬럼명'
                        },
                        target_key: {
                          type: 'string',
                          description: '타겟 엔티티를 참조하는 외래 키 컬럼명'
                        },
                        directionality: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['relation_type_id', 'source_entity_type_id', 'target_entity_type_id', 'source_key', 'target_key']
                    }
                  }
                },
                required: ['entity_mappings', 'relation_mappings']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_ontology_mapping' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI mapping error:', errorText);
      throw new Error(`AI mapping failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('AI did not return mapping results');
    }

    const mappingResult = JSON.parse(toolCall.function.arguments);
    console.log('✅ AI mapping generated');

    // 새로운 엔티티 타입 생성
    const createdEntityTypes: Record<string, string> = {};
    
    for (const entityMapping of mappingResult.entity_mappings) {
      if (entityMapping.create_new) {
        console.log(`🆕 Creating new entity type: ${entityMapping.entity_type_name}`);
        
        const { data: newEntityType, error } = await supabase
          .from('ontology_entity_types')
          .insert({
            name: entityMapping.entity_type_name,
            label: entityMapping.entity_type_label || entityMapping.entity_type_name,
            properties: entityMapping.properties_definition || [],
            user_id: user.id,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to create entity type:', error);
        } else if (newEntityType) {
          createdEntityTypes[entityMapping.entity_type_name] = newEntityType.id;
          entityMapping.entity_type_id = newEntityType.id;
          console.log(`✅ Created entity type: ${newEntityType.id}`);
        }
      }
    }

    // 새로운 관계 타입 생성
    const createdRelationTypes: Record<string, string> = {};
    
    for (const relationMapping of mappingResult.relation_mappings) {
      if (relationMapping.create_new) {
        console.log(`🆕 Creating new relation type: ${relationMapping.relation_type_name}`);
        
        // 소스/타겟 엔티티 타입 ID 확인
        const sourceEntityId = createdEntityTypes[relationMapping.source_entity_type_id] || relationMapping.source_entity_type_id;
        const targetEntityId = createdEntityTypes[relationMapping.target_entity_type_id] || relationMapping.target_entity_type_id;

        const { data: newRelationType, error } = await supabase
          .from('ontology_relation_types')
          .insert({
            name: relationMapping.relation_type_name,
            label: relationMapping.relation_type_label || relationMapping.relation_type_name,
            source_entity_type: sourceEntityId,
            target_entity_type: targetEntityId,
            directionality: relationMapping.directionality || 'directed',
            user_id: user.id,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to create relation type:', error);
        } else if (newRelationType) {
          createdRelationTypes[relationMapping.relation_type_name] = newRelationType.id;
          relationMapping.relation_type_id = newRelationType.id;
          console.log(`✅ Created relation type: ${newRelationType.id}`);
        }
      }
    }

    // 생성된 ID로 매핑 결과 업데이트
    mappingResult.entity_mappings.forEach((em: any) => {
      if (em.entity_type_id === 'NEW' && createdEntityTypes[em.entity_type_name]) {
        em.entity_type_id = createdEntityTypes[em.entity_type_name];
      }
    });

    mappingResult.relation_mappings.forEach((rm: any) => {
      if (rm.relation_type_id === 'NEW' && createdRelationTypes[rm.relation_type_name]) {
        rm.relation_type_id = createdRelationTypes[rm.relation_type_name];
      }
      if (rm.source_entity_type_id === 'NEW') {
        rm.source_entity_type_id = createdEntityTypes[rm.source_entity_type_id] || rm.source_entity_type_id;
      }
      if (rm.target_entity_type_id === 'NEW') {
        rm.target_entity_type_id = createdEntityTypes[rm.target_entity_type_id] || rm.target_entity_type_id;
      }
    });

    console.log(`✅ Mapping complete: ${mappingResult.entity_mappings.length} entities, ${mappingResult.relation_mappings.length} relations`);

    return new Response(
      JSON.stringify({
        success: true,
        entity_mappings: mappingResult.entity_mappings,
        relation_mappings: mappingResult.relation_mappings,
        created_entity_types: Object.keys(createdEntityTypes),
        created_relation_types: Object.keys(createdRelationTypes),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Smart mapping error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
