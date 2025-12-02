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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching database schema metadata...');

    // 1. 모든 테이블 목록 가져오기
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      query: tablesQuery
    });

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      throw tablesError;
    }

    const tableNames: string[] = tables.map((t: any) => t.table_name);
    console.log(`Found ${tableNames.length} tables`);

    // 2. 각 테이블의 메타데이터 가져오기
    const schemaMetadata: Record<string, TableMetadata> = {};

    for (const tableName of tableNames) {
      // 컬럼 정보
      const columnsQuery = `
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable = 'YES' as is_nullable,
          c.column_default,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku 
            ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = '${tableName}'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = '${tableName}'
        AND c.table_schema = 'public'
        ORDER BY c.ordinal_position;
      `;

      const { data: columns } = await supabase.rpc('execute_sql', {
        query: columnsQuery
      });

      // FK 정보
      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = '${tableName}';
      `;

      const { data: foreignKeys } = await supabase.rpc('execute_sql', {
        query: fkQuery
      });

      const primaryKeys = columns
        ?.filter((c: any) => c.is_primary_key)
        .map((c: any) => c.column_name) || [];

      schemaMetadata[tableName] = {
        table_name: tableName,
        columns: columns || [],
        foreign_keys: foreignKeys || [],
        primary_keys: primaryKeys
      };
    }

    console.log('Schema metadata fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        schema: schemaMetadata,
        table_count: tableNames.length,
        fetched_at: new Date().toISOString()
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
