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

    // 데이터베이스 함수 호출하여 스키마 메타데이터 조회
    const { data: schemaData, error } = await supabase.rpc('get_schema_metadata');

    if (error) {
      console.error('Error fetching schema metadata:', error);
      throw new Error(`Failed to fetch schema metadata: ${error.message}`);
    }

    if (!schemaData) {
      throw new Error('No schema metadata returned from database');
    }

    const schemaMetadata = schemaData as Record<string, TableMetadata>;
    const tableCount = Object.keys(schemaMetadata).length;
    
    console.log(`Schema loaded: ${tableCount} tables`);
    console.log(`Tables: ${Object.keys(schemaMetadata).join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        schema: schemaMetadata,
        table_count: tableCount,
        fetched_at: new Date().toISOString(),
        source: 'dynamic_database_query'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in fetch-db-schema:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
