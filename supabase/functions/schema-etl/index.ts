import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETLRequest {
  import_id: string;
  store_id: string; // 매장 ID 추가
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

    // 2. 엔티티 생성 (배치 처리)
    const entityMap = new Map<string, string>(); // original_key -> entity_id
    const createdEntities: any[] = [];

    for (const mapping of body.entity_mappings) {
      // entity_type_id가 UUID인지 확인, 아니면 name으로 조회
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mapping.entity_type_id);
      
      let entityType: any;
      if (isUUID) {
        const { data } = await supabase
          .from('ontology_entity_types')
          .select('*')
          .eq('id', mapping.entity_type_id)
          .eq('user_id', user.id)
          .single();
        entityType = data;
      } else {
        // entity_type_id가 name인 경우
        const { data } = await supabase
          .from('ontology_entity_types')
          .select('*')
          .eq('name', mapping.entity_type_id)
          .eq('user_id', user.id)
          .single();
        entityType = data;
      }

      if (!entityType) {
        console.warn(`Entity type not found: ${mapping.entity_type_id}`);
        continue;
      }

      console.log(`Creating entities for type: ${entityType.name}`);

      // 배치 데이터 준비
      const entitiesToInsert: any[] = [];
      const recordMappings: Array<{ record: any; tempId: number }> = [];

      for (let i = 0; i < rawData.length; i++) {
        const record = rawData[i];
        
        // 속성 매핑
        const properties: Record<string, any> = {};
        for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
          if (record[columnName] !== undefined) {
            properties[propName] = record[columnName];
          }
        }

        // 라벨 생성
        let label = mapping.label_template;
        
        for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
          const value = record[columnName];
          if (value !== undefined && value !== null) {
            label = label.replace(`{${propName}}`, String(value));
            label = label.replace(`{${columnName}}`, String(value));
          }
        }
        
        for (const [key, value] of Object.entries(record)) {
          if (value !== undefined && value !== null) {
            label = label.replace(`{${key}}`, String(value));
          }
        }
        
        if (label.includes('{') && label.includes('}')) {
          const firstValue = Object.values(properties).find(v => v !== undefined && v !== null);
          label = firstValue ? String(firstValue) : `Entity ${Object.values(record)[0] || ''}`;
        }

        entitiesToInsert.push({
          user_id: user.id,
          store_id: body.store_id,
          entity_type_id: entityType.id,  // 실제 UUID 사용
          label,
          properties: { ...properties, source_import_id: body.import_id },
        });

        recordMappings.push({ record, tempId: i });
      }

      // 배치 삽입 (1000개씩)
      const BATCH_SIZE = 1000;
      for (let i = 0; i < entitiesToInsert.length; i += BATCH_SIZE) {
        const batch = entitiesToInsert.slice(i, i + BATCH_SIZE);
        const batchRecordMappings = recordMappings.slice(i, i + BATCH_SIZE);

        const { data: entities, error: batchError } = await supabase
          .from('graph_entities')
          .insert(batch)
          .select();

        if (!batchError && entities) {
          // 삽입된 엔티티들을 매핑
          entities.forEach((entity, idx) => {
            createdEntities.push(entity);
            const { record } = batchRecordMappings[idx];
            
            // entityMap 구성
            for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
              if (record[columnName] !== undefined && record[columnName] !== null) {
                const key = `${mapping.entity_type_id}:${columnName}:${record[columnName]}`;
                entityMap.set(key, entity.id);
              }
            }
          });
        } else if (batchError) {
          console.error(`Batch insert error: ${batchError.message}`);
        }
      }
    }

    console.log(`Created ${createdEntities.length} entities`);

    // 3. 관계 생성 (배치 처리)
    const createdRelations: any[] = [];

    for (const relMapping of body.relation_mappings) {
      console.log(`Creating relations for type: ${relMapping.relation_type_id}`);

      const relationsToInsert: any[] = [];

      for (const record of rawData) {
        const sourceKey = `${relMapping.source_entity_type_id}:${relMapping.source_key}:${record[relMapping.source_key]}`;
        const targetKey = `${relMapping.target_entity_type_id}:${relMapping.target_key}:${record[relMapping.target_key]}`;

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

        relationsToInsert.push({
          user_id: user.id,
          store_id: body.store_id,
          relation_type_id: relMapping.relation_type_id,
          source_entity_id: sourceEntityId,
          target_entity_id: targetEntityId,
          properties,
          weight: 1.0,
        });
      }

      // 배치 삽입 (1000개씩)
      const BATCH_SIZE = 1000;
      for (let i = 0; i < relationsToInsert.length; i += BATCH_SIZE) {
        const batch = relationsToInsert.slice(i, i + BATCH_SIZE);

        const { data: relations, error: batchError } = await supabase
          .from('graph_relations')
          .insert(batch)
          .select();

        if (!batchError && relations) {
          createdRelations.push(...relations);
        } else if (batchError) {
          console.error(`Batch relation insert error: ${batchError.message}`);
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
