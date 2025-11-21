import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineRequest {
  import_id: string;
  store_id: string;
  auto_fix?: boolean;
  skip_validation?: boolean;
}

interface PipelineResult {
  success: boolean;
  validation?: any;
  mapping?: any;
  etl?: any;
  error?: string;
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
      throw new Error('Unauthorized');
    }

    const { import_id, store_id, auto_fix = true, skip_validation = false } = await req.json() as PipelineRequest;

    console.log('🚀 Starting integrated data pipeline');
    console.log(`📦 Import ID: ${import_id}`);
    console.log(`🏪 Store ID: ${store_id}`);

    const result: PipelineResult = { success: false };

    // Step 1: 데이터 검증 및 수정
    if (!skip_validation) {
      console.log('\n📍 STEP 1: Validating and fixing data...');
      
      const validationResponse = await supabase.functions.invoke('validate-and-fix-csv', {
        body: {
          import_id,
          auto_fix,
        },
      });

      if (validationResponse.error) {
        console.error('❌ Validation failed:', validationResponse.error);
        throw new Error(`Validation failed: ${validationResponse.error.message}`);
      }

      result.validation = validationResponse.data;
      console.log('✅ Validation complete');
      console.log(`  - Data quality score: ${result.validation.data_quality_score}/100`);
      console.log(`  - Issues found: ${result.validation.issues.length}`);
      console.log(`  - Fixes applied: ${result.validation.fixes.length}`);

      // 심각한 오류가 있으면 중단
      const criticalErrors = result.validation.issues.filter((i: any) => i.type === 'error');
      if (criticalErrors.length > 0 && result.validation.data_quality_score < 50) {
        throw new Error(`Critical data quality issues found. Score: ${result.validation.data_quality_score}/100`);
      }
    } else {
      console.log('⏭️  Skipping validation');
      result.validation = { skipped: true };
    }

    // Step 2: AI 기반 온톨로지 매핑
    console.log('\n📍 STEP 2: Generating ontology mapping...');
    
    const mappingResponse = await supabase.functions.invoke('smart-ontology-mapping', {
      body: {
        import_id,
        id_columns: result.validation?.id_columns || [],
        foreign_key_columns: result.validation?.foreign_key_columns || {},
      },
    });

    if (mappingResponse.error) {
      console.error('❌ Mapping failed:', mappingResponse.error);
      throw new Error(`Mapping failed: ${mappingResponse.error.message}`);
    }

    result.mapping = mappingResponse.data;
    console.log('✅ Mapping complete');
    console.log(`  - Entity mappings: ${result.mapping.entity_mappings.length}`);
    console.log(`  - Relation mappings: ${result.mapping.relation_mappings.length}`);
    console.log(`  - Created entity types: ${result.mapping.created_entity_types.length}`);
    console.log(`  - Created relation types: ${result.mapping.created_relation_types.length}`);

    // Step 3: ETL 실행
    console.log('\n📍 STEP 3: Executing ETL...');
    
    const etlResponse = await supabase.functions.invoke('schema-etl', {
      body: {
        import_id,
        store_id,
        entity_mappings: result.mapping.entity_mappings,
        relation_mappings: result.mapping.relation_mappings,
      },
    });

    if (etlResponse.error) {
      console.error('❌ ETL failed:', etlResponse.error);
      throw new Error(`ETL failed: ${etlResponse.error.message}`);
    }

    result.etl = etlResponse.data;
    console.log('✅ ETL complete');
    console.log(`  - Entities created: ${result.etl.entities_created || 0}`);
    console.log(`  - Entities reused: ${result.etl.entities_reused || 0}`);
    console.log(`  - Relations created: ${result.etl.relations_created || 0}`);

    // Step 4: 검증
    console.log('\n📍 STEP 4: Validating results...');
    
    const { count: entitiesCount } = await supabase
      .from('graph_entities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('store_id', store_id);

    const { count: relationsCount } = await supabase
      .from('graph_relations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('store_id', store_id);

    console.log('✅ Validation complete');
    console.log(`  - Total entities in DB: ${entitiesCount}`);
    console.log(`  - Total relations in DB: ${relationsCount}`);

    // 관계가 하나도 없으면 경고
    if (relationsCount === 0 && result.mapping.relation_mappings.length > 0) {
      console.warn('⚠️  Warning: No relations created despite having relation mappings');
    }

    result.success = true;

    console.log('\n🎉 Pipeline completed successfully!');
    console.log('═══════════════════════════════════════');

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Pipeline error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
