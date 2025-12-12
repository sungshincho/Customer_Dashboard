import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Unified ETL Function
 *
 * Consolidates 4 ETL functions into a single endpoint:
 * - raw_to_l2: Process raw CSV data into L2 fact/dimension tables
 * - l1_to_l2: Transform L1 data into L2 event tables
 * - l2_to_l3: Aggregate L2 data into L3 summary tables
 * - schema: Process data with ontology entity/relation mappings
 * - full_pipeline: Run L1→L2 and L2→L3 sequentially
 */

interface UnifiedETLRequest {
  etl_type: 'raw_to_l2' | 'l1_to_l2' | 'l2_to_l3' | 'schema' | 'full_pipeline';
  // Common parameters
  org_id?: string;
  store_id?: string;
  // Date range parameters
  date?: string;
  date_from?: string;
  date_to?: string;
  // raw_to_l2 specific
  import_id?: string;
  data_type?: string;
  raw_data?: any[];
  // l1_to_l2 / l2_to_l3 specific
  target_tables?: string[];
  // schema ETL specific
  entity_mappings?: Array<{
    entity_type_id: string;
    column_mappings: Record<string, string>;
    label_template: string;
  }>;
  relation_mappings?: Array<{
    relation_type_id: string;
    source_entity_type_id: string;
    target_entity_type_id: string;
    source_key: string;
    target_key: string;
    properties?: Record<string, string>;
  }>;
  options?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if using service role key (for internal calls from scheduler)
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === supabaseServiceKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string | null = null;

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const body: UnifiedETLRequest = await req.json();
    console.log(`[unified-etl] Starting ETL type: ${body.etl_type}`);

    let result;
    switch (body.etl_type) {
      case 'raw_to_l2':
        result = await processRawToL2(supabase, userId, body);
        break;
      case 'l1_to_l2':
        result = await processL1ToL2(supabase, body);
        break;
      case 'l2_to_l3':
        result = await processL2ToL3(supabase, body);
        break;
      case 'schema':
        result = await processSchemaETL(supabase, userId!, body);
        break;
      case 'full_pipeline':
        result = await runFullPipeline(supabase, body);
        break;
      default:
        throw new Error(`Invalid ETL type: ${body.etl_type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[unified-etl] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// ETL Type: raw_to_l2 - Process raw CSV data into L2 tables
// ============================================================================

const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  customers: {
    'customer_id': 'id', 'id': 'id', 'name': 'name', 'customer_name': 'name',
    'email': 'email', 'phone': 'phone', 'gender': 'gender', 'age': 'age',
    'age_group': 'age_group', 'membership_tier': 'membership_tier',
  },
  products: {
    'product_id': 'id', 'id': 'id', 'name': 'product_name', 'product_name': 'product_name',
    'category': 'category', 'price': 'price', 'cost_price': 'cost_price',
    'stock': 'stock', 'sku': 'sku', 'brand': 'brand',
  },
  purchases: {
    'purchase_id': 'id', 'transaction_id': 'id', 'id': 'id', 'customer_id': 'customer_id',
    'product_id': 'product_id', 'quantity': 'quantity', 'unit_price': 'unit_price',
    'total_price': 'total_price', 'purchase_date': 'purchase_date', 'payment_method': 'payment_method',
  },
  visits: {
    'visit_id': 'id', 'id': 'id', 'customer_id': 'customer_id', 'visit_date': 'visit_date',
    'duration_minutes': 'duration_minutes', 'zones_visited': 'zones_visited',
  },
  staff: {
    'staff_id': 'id', 'id': 'id', 'name': 'name', 'role': 'role',
    'department': 'department', 'hire_date': 'hire_date', 'email': 'email',
  },
};

function mapFields(record: any, dataType: string): any {
  const mapping = FIELD_MAPPINGS[dataType] || {};
  const mapped: any = {};
  for (const [csvCol, value] of Object.entries(record)) {
    const dbCol = mapping[csvCol] || mapping[csvCol.toLowerCase()] || csvCol;
    mapped[dbCol] = value;
  }
  return mapped;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value).replace(/[,]/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(value: any): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function ensureUUID(value: any): string {
  if (!value) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(String(value))) return String(value);
  return crypto.randomUUID();
}

async function processRawToL2(supabase: any, userId: string | null, request: UnifiedETLRequest) {
  const { import_id, store_id, org_id, data_type } = request;
  let { raw_data } = request;

  console.log(`[raw_to_l2] Processing import: ${import_id}, type: ${data_type}`);

  // Load raw_data from import if not provided
  if (!raw_data && import_id) {
    const { data: importData, error: importError } = await supabase
      .from('user_data_imports')
      .select('raw_data, file_name')
      .eq('id', import_id)
      .single();

    if (importError || !importData) {
      throw new Error(`Import data not found: ${import_id}`);
    }
    raw_data = importData.raw_data;
  }

  if (!Array.isArray(raw_data) || raw_data.length === 0) {
    throw new Error('No data to process');
  }

  const result: any = {
    success: false,
    data_type,
    records_processed: raw_data.length,
    records_inserted: 0,
    errors: [],
    tables_affected: [],
  };

  // Process based on data type
  if (data_type === 'customers') {
    const customersToUpsert = raw_data.map((record, idx) => {
      const mapped = mapFields(record, 'customers');
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id,
        store_id,
        name: mapped.name || `Customer ${idx + 1}`,
        email: mapped.email || null,
        phone: mapped.phone || null,
        gender: mapped.gender || null,
        age: parseNumber(mapped.age),
        age_group: mapped.age_group || null,
        total_visits: parseNumber(mapped.total_visits) || 0,
        total_spent: parseNumber(mapped.total_spent) || 0,
        membership_tier: mapped.membership_tier || 'basic',
      };
    });

    const { data: inserted, error } = await supabase
      .from('customers')
      .upsert(customersToUpsert, { onConflict: 'id' })
      .select();

    if (error) result.errors.push(error.message);
    else result.records_inserted = inserted?.length || 0;
    result.tables_affected = ['customers'];
  } else if (data_type === 'products') {
    const productsToUpsert = raw_data.map((record, idx) => {
      const mapped = mapFields(record, 'products');
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id,
        store_id,
        product_name: mapped.product_name || `Product ${idx + 1}`,
        category: mapped.category || 'uncategorized',
        price: parseNumber(mapped.price) || 0,
        stock: parseNumber(mapped.stock) || 0,
        sku: mapped.sku || null,
        brand: mapped.brand || null,
      };
    });

    const { data: inserted, error } = await supabase
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'id' })
      .select();

    if (error) result.errors.push(error.message);
    else result.records_inserted = inserted?.length || 0;
    result.tables_affected = ['products'];
  }
  // Add more data types as needed...

  result.success = result.errors.length === 0 || result.records_inserted > 0;
  return result;
}

// ============================================================================
// ETL Type: l1_to_l2 - Transform L1 data into L2 event tables
// ============================================================================

async function processL1ToL2(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date_from, date_to, target_tables } = request;

  console.log(`[l1_to_l2] Processing org: ${org_id}, store: ${store_id}`);

  const results: Record<string, { processed: number; errors: number }> = {};
  const targetSet = new Set(target_tables || ['line_items', 'funnel_events', 'zone_events', 'zones_dim']);

  // Process purchases → line_items
  if (targetSet.has('line_items')) {
    let query = supabase.from('purchases').select('*');
    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);
    if (date_from) query = query.gte('purchase_date', date_from);
    if (date_to) query = query.lte('purchase_date', date_to);

    const { data: purchases, error } = await query;
    if (error) {
      results.line_items = { processed: 0, errors: 1 };
    } else if (purchases && purchases.length > 0) {
      const lineItems = purchases.map((p: any) => ({
        transaction_id: p.id,
        purchase_id: p.id,
        product_id: p.product_id,
        customer_id: p.customer_id,
        store_id: p.store_id,
        org_id: p.org_id,
        quantity: p.quantity || 1,
        unit_price: p.unit_price || 0,
        line_total: p.total_price || (p.unit_price * (p.quantity || 1)),
        transaction_date: p.purchase_date,
        transaction_hour: p.purchase_date ? new Date(p.purchase_date).getHours() : null,
      }));

      const { error: insertError } = await supabase.from('line_items').insert(lineItems);
      results.line_items = { processed: lineItems.length, errors: insertError ? 1 : 0 };
    } else {
      results.line_items = { processed: 0, errors: 0 };
    }
  }

  // Process visits → funnel_events
  if (targetSet.has('funnel_events')) {
    let query = supabase.from('visits').select('*');
    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);
    if (date_from) query = query.gte('visit_date', date_from);
    if (date_to) query = query.lte('visit_date', date_to);

    const { data: visits, error } = await query;
    if (error) {
      results.funnel_events = { processed: 0, errors: 1 };
    } else if (visits && visits.length > 0) {
      const funnelEvents: any[] = [];
      for (const visit of visits) {
        const visitDate = visit.visit_date || visit.created_at;
        funnelEvents.push({
          store_id: visit.store_id,
          org_id: visit.org_id,
          customer_id: visit.customer_id,
          visitor_id: visit.visitor_id || visit.id,
          session_id: visit.session_id || visit.id,
          event_type: 'entry',
          event_date: visitDate?.split('T')[0],
          event_hour: visitDate ? new Date(visitDate).getHours() : null,
          event_timestamp: visitDate,
        });
      }

      const { error: insertError } = await supabase
        .from('funnel_events')
        .upsert(funnelEvents, { onConflict: 'id', ignoreDuplicates: true });
      results.funnel_events = { processed: funnelEvents.length, errors: insertError ? 1 : 0 };
    } else {
      results.funnel_events = { processed: 0, errors: 0 };
    }
  }

  return {
    success: true,
    etl_type: 'l1_to_l2',
    results,
    processed_at: new Date().toISOString(),
  };
}

// ============================================================================
// ETL Type: l2_to_l3 - Aggregate L2 data into L3 summary tables
// ============================================================================

async function processL2ToL3(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date, date_from, date_to, target_tables } = request;
  const targetDate = date || new Date().toISOString().split('T')[0];

  console.log(`[l2_to_l3] Aggregating for date: ${targetDate}, org: ${org_id}`);

  const results: Record<string, { processed: number; errors: number }> = {};
  const targetSet = new Set(target_tables || ['daily_kpis_agg', 'hourly_metrics', 'zone_daily_metrics']);

  // Get stores to aggregate
  let storeQuery = supabase.from('stores').select('id, org_id, area_sqm');
  if (org_id) storeQuery = storeQuery.eq('org_id', org_id);
  if (store_id) storeQuery = storeQuery.eq('id', store_id);

  const { data: stores } = await storeQuery;
  if (!stores || stores.length === 0) {
    return { success: true, etl_type: 'l2_to_l3', results, processed_at: new Date().toISOString() };
  }

  const dates = getDateRange(targetDate, date_from, date_to);

  // Aggregate daily_kpis_agg
  if (targetSet.has('daily_kpis_agg')) {
    const aggregations: any[] = [];

    for (const date of dates) {
      for (const store of stores) {
        const { data: lineItems } = await supabase
          .from('line_items')
          .select('*')
          .eq('store_id', store.id)
          .eq('transaction_date', date);

        const { data: funnelEvents } = await supabase
          .from('funnel_events')
          .select('*')
          .eq('store_id', store.id)
          .eq('event_date', date);

        const totalRevenue = (lineItems || []).reduce((sum: number, li: any) => sum + (li.line_total || 0), 0);
        const totalTransactions = new Set((lineItems || []).map((li: any) => li.transaction_id)).size;
        const entryEvents = (funnelEvents || []).filter((e: any) => e.event_type === 'entry');
        const totalVisitors = entryEvents.length;

        aggregations.push({
          date,
          store_id: store.id,
          org_id: store.org_id,
          total_revenue: totalRevenue,
          total_transactions: totalTransactions,
          total_visitors: totalVisitors,
          conversion_rate: totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0,
          avg_transaction_value: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          calculated_at: new Date().toISOString(),
        });
      }
    }

    if (aggregations.length > 0) {
      const { error } = await supabase
        .from('daily_kpis_agg')
        .upsert(aggregations, { onConflict: 'date,store_id', ignoreDuplicates: false });
      results.daily_kpis_agg = { processed: aggregations.length, errors: error ? 1 : 0 };
    } else {
      results.daily_kpis_agg = { processed: 0, errors: 0 };
    }
  }

  return {
    success: true,
    etl_type: 'l2_to_l3',
    results,
    aggregated_at: new Date().toISOString(),
  };
}

function getDateRange(date?: string, date_from?: string, date_to?: string): string[] {
  if (date_from && date_to) {
    const dates: string[] = [];
    const start = new Date(date_from);
    const end = new Date(date_to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }
  return [date || new Date().toISOString().split('T')[0]];
}

// ============================================================================
// ETL Type: schema - Process data with ontology entity/relation mappings
// ============================================================================

async function processSchemaETL(supabase: any, userId: string, request: UnifiedETLRequest) {
  const { import_id, store_id, entity_mappings, relation_mappings } = request;

  console.log(`[schema] Processing import: ${import_id}, mappings: ${entity_mappings?.length || 0}`);

  // Get import data
  const { data: importData, error: importError } = await supabase
    .from('user_data_imports')
    .select('raw_data')
    .eq('id', import_id)
    .eq('user_id', userId)
    .single();

  if (importError || !importData) {
    throw new Error('Import data not found');
  }

  const rawData = importData.raw_data as any[];
  console.log(`[schema] Processing ${rawData.length} records`);

  const entityMap = new Map<string, string>();
  const labelCache = new Map<string, string>();
  let totalCreated = 0;
  let totalReused = 0;

  // Process entity mappings
  for (const mapping of entity_mappings || []) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mapping.entity_type_id);

    let entityType: any;
    if (isUUID) {
      const { data } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('id', mapping.entity_type_id)
        .eq('user_id', userId)
        .single();
      entityType = data;
    } else {
      const { data } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('name', mapping.entity_type_id)
        .eq('user_id', userId)
        .single();
      entityType = data;
    }

    if (!entityType) {
      console.warn(`[schema] Entity type not found: ${mapping.entity_type_id}`);
      continue;
    }

    // Get existing entities for this type
    const { data: existingEntities } = await supabase
      .from('graph_entities')
      .select('id, label, properties')
      .eq('user_id', userId)
      .eq('store_id', store_id)
      .eq('entity_type_id', entityType.id);

    if (existingEntities) {
      for (const entity of existingEntities) {
        const cacheKey = `${entityType.id}:${entity.label}`;
        labelCache.set(cacheKey, entity.id);
      }
    }

    // Extract unique entities
    const uniqueEntities = new Map<string, any>();

    for (const record of rawData) {
      const properties: Record<string, any> = {};
      for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
        if (record[columnName] !== undefined) {
          properties[propName] = record[columnName];
        }
      }

      let label = mapping.label_template;
      for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
        const value = record[columnName];
        if (value !== undefined && value !== null) {
          label = label.replace(`{${propName}}`, String(value));
          label = label.replace(`{${columnName}}`, String(value));
        }
      }

      const cacheKey = `${entityType.id}:${label}`;

      if (labelCache.has(cacheKey)) {
        totalReused++;
        continue;
      }

      if (!uniqueEntities.has(cacheKey)) {
        uniqueEntities.set(cacheKey, {
          user_id: userId,
          store_id,
          entity_type_id: entityType.id,
          label,
          properties: { ...properties, source_import_id: import_id },
        });
      }
    }

    // Batch insert entities
    const entitiesToInsert = Array.from(uniqueEntities.values());
    if (entitiesToInsert.length > 0) {
      const { data: entities, error } = await supabase
        .from('graph_entities')
        .insert(entitiesToInsert)
        .select();

      if (!error && entities) {
        totalCreated += entities.length;
        entities.forEach((entity: any) => {
          const cacheKey = `${entity.entity_type_id}:${entity.label}`;
          labelCache.set(cacheKey, entity.id);
          entityMap.set(cacheKey, entity.id);
        });
      }
    }
  }

  // Process relation mappings
  let totalRelations = 0;
  const relationsToInsert: any[] = [];
  const relationSet = new Set<string>();

  for (const relMapping of relation_mappings || []) {
    // Get relation type UUID
    const isRelTypeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relMapping.relation_type_id);
    let relationTypeId = relMapping.relation_type_id;

    if (!isRelTypeUUID) {
      const { data: relationType } = await supabase
        .from('ontology_relation_types')
        .select('id')
        .eq('name', relMapping.relation_type_id)
        .eq('user_id', userId)
        .single();

      if (relationType) relationTypeId = relationType.id;
      else continue;
    }

    for (const record of rawData) {
      const sourceValue = record[relMapping.source_key];
      const targetValue = record[relMapping.target_key];

      // Find source and target entities
      let sourceEntityId: string | undefined;
      let targetEntityId: string | undefined;

      for (const [key, id] of entityMap.entries()) {
        if (key.includes(sourceValue)) sourceEntityId = id;
        if (key.includes(targetValue)) targetEntityId = id;
      }

      if (!sourceEntityId || !targetEntityId) continue;

      const relationKey = `${sourceEntityId}:${relationTypeId}:${targetEntityId}`;
      if (relationSet.has(relationKey)) continue;
      relationSet.add(relationKey);

      relationsToInsert.push({
        user_id: userId,
        store_id,
        relation_type_id: relationTypeId,
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        weight: 1.0,
      });
    }
  }

  if (relationsToInsert.length > 0) {
    const { data: relations, error } = await supabase
      .from('graph_relations')
      .insert(relationsToInsert)
      .select();

    if (!error && relations) {
      totalRelations = relations.length;
    }
  }

  return {
    success: true,
    etl_type: 'schema',
    entities_created: totalCreated,
    entities_reused: totalReused,
    relations_created: totalRelations,
    summary: {
      total_records: rawData.length,
      entity_types: entity_mappings?.length || 0,
      relation_types: relation_mappings?.length || 0,
    },
  };
}

// ============================================================================
// ETL Type: full_pipeline - Run L1→L2 and L2→L3 sequentially
// ============================================================================

async function runFullPipeline(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date_from, date_to } = request;

  console.log(`[full_pipeline] Running for org: ${org_id}`);

  const l1Result = await processL1ToL2(supabase, {
    ...request,
    etl_type: 'l1_to_l2'
  });

  const l2Result = await processL2ToL3(supabase, {
    ...request,
    etl_type: 'l2_to_l3'
  });

  return {
    success: true,
    etl_type: 'full_pipeline',
    stages: {
      l1_to_l2: l1Result,
      l2_to_l3: l2Result,
    },
    timestamp: new Date().toISOString(),
  };
}
