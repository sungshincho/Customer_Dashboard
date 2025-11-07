import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETLRequest {
  import_id: string;
  entity_mappings: Array<{
    entity_type_id: string;
    column_mappings: Record<string, string>; // property_name -> column_name
    label_template: string; // e.g., "{name}" or "{customer_id}"
  }>;
  relation_mappings: Array<{
    relation_type_id: string;
    source_entity_type_id: string;
    target_entity_type_id: string;
    source_key: string;
    target_key: string;
    properties?: Record<string, string>;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ETLRequest = await req.json();
    console.log('ETL request:', { import_id: body.import_id, mappings: body.entity_mappings.length });

    // 1. 임포트 데이터 가져오기
    const { data: importData, error: importError } = await supabase
      .from('user_data_imports')
      .select('raw_data')
      .eq('id', body.import_id)
      .eq('user_id', user.id)
      .single();

    if (importError || !importData) {
      throw new Error('Import data not found');
    }

    const rawData = importData.raw_data as any[];
    console.log(`Processing ${rawData.length} records`);

    // 2. 엔티티 생성
    const entityMap = new Map<string, string>(); // original_key -> entity_id
    const createdEntities: any[] = [];

    for (const mapping of body.entity_mappings) {
      const { data: entityType } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('id', mapping.entity_type_id)
        .single();

      if (!entityType) continue;

      console.log(`Creating entities for type: ${entityType.name}`);

      for (const record of rawData) {
        // 속성 매핑
        const properties: Record<string, any> = {};
        for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
          if (record[columnName] !== undefined) {
            properties[propName] = record[columnName];
          }
        }

        // 라벨 생성 (템플릿 사용)
        let label = mapping.label_template;
        for (const [key, value] of Object.entries(record)) {
          label = label.replace(`{${key}}`, String(value || ''));
        }

        // 엔티티 생성
        const { data: entity, error: entityError } = await supabase
          .from('graph_entities')
          .insert({
            user_id: user.id,
            entity_type_id: mapping.entity_type_id,
            label,
            properties,
          })
          .select()
          .single();

        if (!entityError && entity) {
          createdEntities.push(entity);
          
          // 원본 키로 매핑 (관계 생성시 사용)
          const sourceKey = Object.values(mapping.column_mappings)[0];
          if (sourceKey && record[sourceKey]) {
            const key = `${mapping.entity_type_id}:${record[sourceKey]}`;
            entityMap.set(key, entity.id);
          }
        }
      }
    }

    console.log(`Created ${createdEntities.length} entities`);

    // 3. 관계 생성
    const createdRelations: any[] = [];

    for (const relMapping of body.relation_mappings) {
      console.log(`Creating relations for type: ${relMapping.relation_type_id}`);

      for (const record of rawData) {
        const sourceKey = `${relMapping.source_entity_type_id}:${record[relMapping.source_key]}`;
        const targetKey = `${relMapping.target_entity_type_id}:${record[relMapping.target_key]}`;

        const sourceEntityId = entityMap.get(sourceKey);
        const targetEntityId = entityMap.get(targetKey);

        if (!sourceEntityId || !targetEntityId) continue;

        // 관계 속성 매핑
        const properties: Record<string, any> = {};
        if (relMapping.properties) {
          for (const [propName, columnName] of Object.entries(relMapping.properties)) {
            if (record[columnName] !== undefined) {
              properties[propName] = record[columnName];
            }
          }
        }

        // 관계 생성
        const { data: relation, error: relationError } = await supabase
          .from('graph_relations')
          .insert({
            user_id: user.id,
            relation_type_id: relMapping.relation_type_id,
            source_entity_id: sourceEntityId,
            target_entity_id: targetEntityId,
            properties,
            weight: 1.0,
          })
          .select()
          .single();

        if (!relationError && relation) {
          createdRelations.push(relation);
        }
      }
    }

    console.log(`Created ${createdRelations.length} relations`);

    return new Response(JSON.stringify({
      success: true,
      entities_created: createdEntities.length,
      relations_created: createdRelations.length,
      summary: {
        total_records: rawData.length,
        entity_types: body.entity_mappings.length,
        relation_types: body.relation_mappings.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ETL error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
