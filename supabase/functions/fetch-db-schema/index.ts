import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnMetadata {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
}

interface ForeignKey {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

interface TableMetadata {
  table_name: string;
  columns: ColumnMetadata[];
  foreign_keys: ForeignKey[];
  primary_keys: string[];
}

// 정적 스키마 캐시 (타임아웃 방지용 fallback)
const STATIC_SCHEMA_TABLES = [
  'stores', 'products', 'customers', 'purchases', 'visits',
  'daily_kpis_agg', 'dashboard_kpis', 'ai_recommendations',
  'recommendation_applications', 'roi_measurements',
  'graph_entities', 'graph_relations', 'scenarios',
  'store_visits', 'transactions', 'funnel_events'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching dynamic schema metadata from database...');

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 타임아웃 설정 (10초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let schemaMetadata: Record<string, TableMetadata> = {};
    let source = 'dynamic_database_query';

    try {
      // 데이터베이스 함수 호출하여 스키마 메타데이터 조회
      const { data: schemaData, error } = await supabase.rpc('get_schema_metadata');
      clearTimeout(timeoutId);

      if (error) {
        console.warn('RPC error, using fallback:', error.message);
        throw error;
      }

      if (!schemaData) {
        throw new Error('No schema metadata returned');
      }

      schemaMetadata = schemaData as Record<string, TableMetadata>;
    } catch (rpcError: any) {
      clearTimeout(timeoutId);
      console.warn('Falling back to static schema list due to:', rpcError.message);

      // Fallback: 정적 테이블 목록 반환
      source = 'static_fallback';
      for (const tableName of STATIC_SCHEMA_TABLES) {
        schemaMetadata[tableName] = {
          table_name: tableName,
          columns: [],
          foreign_keys: [],
          primary_keys: ['id']
        };
      }
    }

    const tableCount = Object.keys(schemaMetadata).length;

    console.log(`Schema loaded: ${tableCount} tables (source: ${source})`);

    return new Response(
      JSON.stringify({
        success: true,
        schema: schemaMetadata,
        table_count: tableCount,
        fetched_at: new Date().toISOString(),
        source
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in fetch-db-schema:', error);

    // 완전 실패 시에도 기본 스키마 반환
    const fallbackSchema: Record<string, TableMetadata> = {};
    for (const tableName of STATIC_SCHEMA_TABLES) {
      fallbackSchema[tableName] = {
        table_name: tableName,
        columns: [],
        foreign_keys: [],
        primary_keys: ['id']
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        schema: fallbackSchema,
        table_count: STATIC_SCHEMA_TABLES.length,
        fetched_at: new Date().toISOString(),
        source: 'error_fallback',
        warning: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
