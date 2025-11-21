import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETLRequest {
  import_id: string;
  store_id: string;
  entity_mappings: Array<{
    entity_type_id: string;
    column_mappings: Record<string, string>;
    label_template: string;
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

    // 2. 엔티티 생성 (중복 방지)
    const entityMap = new Map<string, string>(); // lookup_key -> entity_id
    const labelCache = new Map<string, string>(); // entity_type:label -> entity_id
    let totalCreated = 0;
    let totalReused = 0;

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

      console.log(`Processing entities for type: ${entityType.name}`);

      // 이 타입의 기존 엔티티를 모두 가져와서 캐시
      const { data: existingEntities } = await supabase
        .from('graph_entities')
        .select('id, label, properties')
        .eq('user_id', user.id)
        .eq('store_id', body.store_id)
        .eq('entity_type_id', entityType.id);

      if (existingEntities) {
        for (const entity of existingEntities) {
          const cacheKey = `${entityType.id}:${entity.label}`;
          labelCache.set(cacheKey, entity.id);
          
          // entityMap에도 추가 (properties 기반 조회용)
          const props = entity.properties as any;
          for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
            if (props && props[propName] !== undefined) {
              const lookupKey = `${mapping.entity_type_id}:${columnName}:${props[propName]}`;
              entityMap.set(lookupKey, entity.id);
            }
          }
        }
      }

      // 각 레코드에서 유니크한 엔티티만 추출
      const uniqueEntities = new Map<string, any>();
      
      for (const record of rawData) {
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

        const cacheKey = `${entityType.id}:${label}`;
        
        // 이미 존재하는지 확인
        if (labelCache.has(cacheKey)) {
          totalReused++;
          const entityId = labelCache.get(cacheKey)!;
          
          // entityMap 업데이트
          for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
            if (record[columnName] !== undefined && record[columnName] !== null) {
              const lookupKey = `${mapping.entity_type_id}:${columnName}:${record[columnName]}`;
              entityMap.set(lookupKey, entityId);
            }
          }
          continue;
        }

        // 유니크 엔티티로 추가
        if (!uniqueEntities.has(cacheKey)) {
          uniqueEntities.set(cacheKey, {
            user_id: user.id,
            store_id: body.store_id,
            entity_type_id: entityType.id,
            label,
            properties: { ...properties, source_import_id: body.import_id },
            cacheKey,
            rawRecord: record,
            mapping,
          });
        }
      }

      console.log(`Found ${uniqueEntities.size} unique entities to create (${totalReused} reused)`);

      // 유니크 엔티티만 배치 삽입
      const entitiesToInsert = Array.from(uniqueEntities.values());
      const BATCH_SIZE = 1000;
      
      for (let i = 0; i < entitiesToInsert.length; i += BATCH_SIZE) {
        const batch = entitiesToInsert.slice(i, i + BATCH_SIZE);
        
        const insertData = batch.map(e => ({
          user_id: e.user_id,
          store_id: e.store_id,
          entity_type_id: e.entity_type_id,
          label: e.label,
          properties: e.properties,
        }));

        const { data: entities, error: batchError } = await supabase
          .from('graph_entities')
          .insert(insertData)
          .select();

        if (!batchError && entities) {
          totalCreated += entities.length;
          
          entities.forEach((entity, idx) => {
            const originalData = batch[idx];
            const cacheKey = originalData.cacheKey;
            
            // 캐시 업데이트
            labelCache.set(cacheKey, entity.id);
            
            // entityMap 업데이트
            for (const [propName, columnName] of Object.entries(originalData.mapping.column_mappings)) {
              const value = (originalData.rawRecord as Record<string, any>)[columnName as string];
              if (value !== undefined && value !== null) {
                const lookupKey = `${originalData.mapping.entity_type_id}:${columnName}:${value}`;
                entityMap.set(lookupKey, entity.id);
              }
            }
          });
        } else if (batchError) {
          console.error(`Batch insert error: ${batchError.message}`);
        }
      }
    }

    console.log(`Created ${totalCreated} new entities, reused ${totalReused} existing entities`);

    // 3. 관계 생성 (배치 처리)
    const relationsToInsert: any[] = [];
    const relationSet = new Set<string>(); // 중복 방지

    for (const relMapping of body.relation_mappings) {
      console.log(`Processing relations for type: ${relMapping.relation_type_id}`);

      for (const record of rawData) {
        const sourceKey = `${relMapping.source_entity_type_id}:${relMapping.source_key}:${record[relMapping.source_key]}`;
        const targetKey = `${relMapping.target_entity_type_id}:${relMapping.target_key}:${record[relMapping.target_key]}`;

        const sourceEntityId = entityMap.get(sourceKey);
        const targetEntityId = entityMap.get(targetKey);

        if (!sourceEntityId || !targetEntityId) {
          console.warn(`Missing entity for relation: ${sourceKey} -> ${targetKey}`);
          continue;
        }

        // 중복 체크
        const relationKey = `${sourceEntityId}:${relMapping.relation_type_id}:${targetEntityId}`;
        if (relationSet.has(relationKey)) continue;
        relationSet.add(relationKey);

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
    }

    console.log(`Inserting ${relationsToInsert.length} unique relations`);

    // 관계 배치 삽입
    let totalRelations = 0;
    const BATCH_SIZE = 1000;
    
    for (let i = 0; i < relationsToInsert.length; i += BATCH_SIZE) {
      const batch = relationsToInsert.slice(i, i + BATCH_SIZE);

      const { data: relations, error: batchError } = await supabase
        .from('graph_relations')
        .insert(batch)
        .select();

      if (!batchError && relations) {
        totalRelations += relations.length;
      } else if (batchError) {
        console.error(`Batch relation insert error: ${batchError.message}`);
      }
    }

    console.log(`Created ${totalRelations} relations`);

    return new Response(JSON.stringify({
      success: true,
      entities_created: totalCreated,
      entities_reused: totalReused,
      relations_created: totalRelations,
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
