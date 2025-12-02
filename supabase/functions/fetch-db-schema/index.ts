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

// 핵심 테이블의 스키마를 하드코딩 (가장 안정적)
const CORE_SCHEMA: Record<string, TableMetadata> = {
  stores: {
    table_name: 'stores',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_name', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'location', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_type', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'area_sqm', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
      { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [],
    primary_keys: ['id']
  },
  customers: {
    table_name: 'customers',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'customer_name', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'email', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'phone', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'segment', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'total_purchases', data_type: 'integer', is_nullable: true, column_default: '0', is_primary_key: false },
      { column_name: 'last_visit_date', data_type: 'date', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
      { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  products: {
    table_name: 'products',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'product_name', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'category', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'brand', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'price', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'stock', data_type: 'integer', is_nullable: true, column_default: '0', is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
      { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  purchases: {
    table_name: 'purchases',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'customer_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'product_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'quantity', data_type: 'integer', is_nullable: true, column_default: '1', is_primary_key: false },
      { column_name: 'unit_price', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'total_price', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'purchase_date', data_type: 'timestamp with time zone', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' },
      { column_name: 'customer_id', foreign_table: 'customers', foreign_column: 'id' },
      { column_name: 'product_id', foreign_table: 'products', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  visits: {
    table_name: 'visits',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'customer_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'visit_date', data_type: 'timestamp with time zone', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'duration_minutes', data_type: 'integer', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'zones_visited', data_type: 'text[]', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' },
      { column_name: 'customer_id', foreign_table: 'customers', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  staff: {
    table_name: 'staff',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'staff_name', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'position', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'shift_hours', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  wifi_tracking: {
    table_name: 'wifi_tracking',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'mac_address', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'detected_at', data_type: 'timestamp with time zone', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'zone_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'signal_strength', data_type: 'integer', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' },
      { column_name: 'zone_id', foreign_table: 'wifi_zones', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  },
  wifi_zones: {
    table_name: 'wifi_zones',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: false, column_default: 'gen_random_uuid()', is_primary_key: true },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: false, column_default: null, is_primary_key: false },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'store_id', data_type: 'uuid', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'zone_name', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'sensor_mac', data_type: 'text', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'position_x', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'position_y', data_type: 'numeric', is_nullable: true, column_default: null, is_primary_key: false },
      { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: false, column_default: 'now()', is_primary_key: false },
    ],
    foreign_keys: [
      { column_name: 'store_id', foreign_table: 'stores', foreign_column: 'id' }
    ],
    primary_keys: ['id']
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Returning hardcoded schema metadata for core tables...');

    const schemaMetadata = { ...CORE_SCHEMA };
    
    console.log(`Schema loaded: ${Object.keys(schemaMetadata).length} tables`);

    return new Response(
      JSON.stringify({
        success: true,
        schema: schemaMetadata,
        table_count: Object.keys(schemaMetadata).length,
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
