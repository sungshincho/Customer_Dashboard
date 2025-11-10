import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoMapRequest {
  import_id: string;
  data_sample: any[];
  columns: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { import_id, data_sample, columns } = await req.json() as AutoMapRequest;

    console.log('🤖 Auto-mapping ETL for import:', import_id);
    console.log('📊 Columns:', columns);
    console.log('📝 Sample data:', data_sample.slice(0, 2));

    // 온톨로지 스키마 불러오기
    const { data: entityTypes, error: entityError } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', user.id);

    if (entityError) throw entityError;

    const { data: relationTypes, error: relationError } = await supabase
      .from('ontology_relation_types')
      .select('*')
      .eq('user_id', user.id);

    if (relationError) throw relationError;

    console.log('📋 Entity types:', entityTypes?.length);
    console.log('🔗 Relation types:', relationTypes?.length);

    // AI 기반 매핑 분석
    const mappingPrompt = `
당신은 데이터 ETL 전문가입니다. 다음 데이터를 분석하고 온톨로지 스키마에 자동 매핑하세요.

**데이터 컬럼:**
${columns.join(', ')}

**데이터 샘플 (첫 2개 레코드):**
${JSON.stringify(data_sample.slice(0, 2), null, 2)}

**사용 가능한 엔티티 타입:**
${entityTypes?.map(et => `- ${et.name} (${et.label}): ${JSON.stringify(et.properties)}`).join('\n')}

**사용 가능한 관계 타입:**
${relationTypes?.map(rt => `- ${rt.name} (${rt.label}): ${rt.source_entity_type} -> ${rt.target_entity_type}`).join('\n')}

**분석 요구사항:**
1. 각 컬럼이 어떤 엔티티 타입에 속하는지 판단
2. 엔티티의 속성과 컬럼을 매핑
3. 엔티티 간 관계를 추출 (source_key, target_key 포함)
4. 라벨 템플릿 제안 (예: {customer_id}, {customer_name})

**응답 형식 (JSON):**
{
  "entity_mappings": [
    {
      "entity_type_id": "uuid",
      "entity_type_name": "Customer",
      "column_mappings": {
        "property_name": "column_name"
      },
      "label_template": "{customer_id}",
      "confidence": 0.95
    }
  ],
  "relation_mappings": [
    {
      "relation_type_id": "uuid",
      "relation_type_name": "PURCHASED",
      "source_entity_type_id": "uuid",
      "target_entity_type_id": "uuid",
      "source_key": "customer_id",
      "target_key": "product_id",
      "confidence": 0.90
    }
  ]
}

**중요:** 반드시 유효한 JSON만 반환하세요. 설명은 제외하고 JSON만 출력하세요.
`;

    // Lovable AI 호출 (gemini-2.5-flash)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: mappingPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('🤖 AI Response:', JSON.stringify(aiData, null, 2));

    const aiContent = aiData.choices?.[0]?.message?.content || '{}';
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonContent = aiContent.trim();
    if (jsonContent.startsWith('```')) {
      const lines = jsonContent.split('\n');
      jsonContent = lines.slice(1, -1).join('\n').replace(/^json\s*/, '');
    }

    let mappingResult;
    try {
      mappingResult = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', jsonContent);
      throw new Error('AI 응답을 파싱할 수 없습니다');
    }

    console.log('✅ Mapping result:', JSON.stringify(mappingResult, null, 2));

    // 폴백: 규칙 기반 매핑
    if (!mappingResult.entity_mappings || mappingResult.entity_mappings.length === 0) {
      console.log('⚠️ AI mapping failed, using fallback rule-based mapping');
      mappingResult = ruleBasedMapping(columns, data_sample, entityTypes, relationTypes);
    }

    return new Response(
      JSON.stringify({
        success: true,
        entity_mappings: mappingResult.entity_mappings || [],
        relation_mappings: mappingResult.relation_mappings || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Auto-mapping error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// 규칙 기반 폴백 매핑
function ruleBasedMapping(
  columns: string[],
  dataSample: any[],
  entityTypes: any[],
  relationTypes: any[]
) {
  const entityMappings: any[] = [];
  const relationMappings: any[] = [];

  // 간단한 유사도 계산
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[_-]/g, '');
    const s2 = str2.toLowerCase().replace(/[_-]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;
    return 0;
  };

  // 각 엔티티 타입에 대해 매칭 시도
  entityTypes?.forEach(entityType => {
    const columnMappings: any = {};
    let totalConfidence = 0;
    let mappedCount = 0;

    const properties = entityType.properties || [];
    properties.forEach((prop: any) => {
      let bestMatch = '';
      let bestScore = 0;

      columns.forEach(col => {
        const score = calculateSimilarity(prop.name, col);
        if (score > bestScore && score > 0.5) {
          bestScore = score;
          bestMatch = col;
        }
      });

      if (bestMatch) {
        columnMappings[prop.name] = bestMatch;
        totalConfidence += bestScore;
        mappedCount++;
      }
    });

    // 최소 1개 이상 매핑되면 추가
    if (mappedCount > 0) {
      const confidence = mappedCount > 0 ? totalConfidence / mappedCount : 0;
      
      // 라벨 템플릿 추천
      const idColumn = columns.find(col => 
        col.toLowerCase().includes('id') && 
        col.toLowerCase().includes(entityType.name.toLowerCase())
      ) || columns.find(col => col.toLowerCase().endsWith('id'));

      entityMappings.push({
        entity_type_id: entityType.id,
        entity_type_name: entityType.name,
        column_mappings: columnMappings,
        label_template: idColumn ? `{${idColumn}}` : '',
        confidence: Math.min(confidence, 0.95),
      });
    }
  });

  console.log('📋 Rule-based entity mappings:', entityMappings.length);

  return {
    entity_mappings: entityMappings,
    relation_mappings: relationMappings,
  };
}
