import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETLRequest {
  org_id?: string;
  store_id?: string;
  date_from?: string;
  date_to?: string;
  target_tables?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const body: ETLRequest = await req.json().catch(() => ({}));
    const { org_id, store_id, date_from, date_to, target_tables } = body;

    console.log(`[ETL L1→L2] Starting for org: ${org_id}, store: ${store_id}, isServiceRole: ${isServiceRole}`);

    const results: Record<string, { processed: number; errors: number }> = {};
    const targetSet = new Set(target_tables || ['line_items', 'funnel_events', 'zone_events', 'visit_zone_events', 'zones_dim']);

    // 1. Process purchases → line_items
    if (targetSet.has('line_items')) {
      console.log('[ETL L1→L2] Processing purchases → line_items');
      const lineItemsResult = await processLineItems(supabase, org_id, store_id, date_from, date_to);
      results.line_items = lineItemsResult;
    }

    // 2. Process visits/transactions → funnel_events
    if (targetSet.has('funnel_events')) {
      console.log('[ETL L1→L2] Processing visits → funnel_events');
      const funnelResult = await processFunnelEvents(supabase, org_id, store_id, date_from, date_to);
      results.funnel_events = funnelResult;
    }

    // 3. Process wifi_tracking → zone_events
    if (targetSet.has('zone_events')) {
      console.log('[ETL L1→L2] Processing wifi_tracking → zone_events');
      const zoneResult = await processZoneEvents(supabase, org_id, store_id, date_from, date_to);
      results.zone_events = zoneResult;
    }

    // 4. Process visits + zones → visit_zone_events
    if (targetSet.has('visit_zone_events')) {
      console.log('[ETL L1→L2] Processing visits → visit_zone_events');
      const visitZoneResult = await processVisitZoneEvents(supabase, org_id, store_id, date_from, date_to);
      results.visit_zone_events = visitZoneResult;
    }

    // 5. Sync zones → zones_dim
    if (targetSet.has('zones_dim')) {
      console.log('[ETL L1→L2] Syncing zones → zones_dim');
      const zonesDimResult = await syncZonesDim(supabase, org_id, store_id);
      results.zones_dim = zonesDimResult;
    }

    console.log('[ETL L1→L2] Completed:', JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      results,
      processed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[ETL L1→L2] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'ETL processing failed';
    return new Response(JSON.stringify({
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processLineItems(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  let query = supabase.from('purchases').select(`
    id, customer_id, product_id, store_id, org_id,
    quantity, unit_price, total_price, purchase_date, created_at
  `);

  if (org_id) query = query.eq('org_id', org_id);
  if (store_id) query = query.eq('store_id', store_id);
  if (date_from) query = query.gte('purchase_date', date_from);
  if (date_to) query = query.lte('purchase_date', date_to);

  const { data: purchases, error } = await query;
  if (error) {
    console.error('[line_items] Query error:', error);
    return { processed: 0, errors: 1 };
  }

  if (!purchases || purchases.length === 0) {
    return { processed: 0, errors: 0 };
  }

  // Get product details for category mapping
  const productIds = [...new Set(purchases.map((p: any) => p.product_id).filter(Boolean))];
  const { data: products } = await supabase
    .from('products')
    .select('id, category, brand, product_name')
    .in('id', productIds);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  const lineItems = purchases.map((p: any) => {
    const product = productMap.get(p.product_id) as any || {};
    return {
      transaction_id: p.id,
      product_id: p.product_id,
      customer_id: p.customer_id,
      store_id: p.store_id,
      org_id: p.org_id,
      quantity: p.quantity || 1,
      unit_price: p.unit_price || 0,
      discount_amount: 0,
      total_amount: p.total_price || (p.unit_price * (p.quantity || 1)),
      category: product?.category,
      brand: product?.brand,
      transaction_date: p.purchase_date,
      transaction_hour: p.purchase_date ? new Date(p.purchase_date).getHours() : null,
    };
  });

  const { error: insertError, count } = await supabase
    .from('line_items')
    .upsert(lineItems, { onConflict: 'transaction_id,product_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[line_items] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: lineItems.length, errors: 0 };
}

async function processFunnelEvents(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  // Get visits data
  let visitQuery = supabase.from('visits').select('*');
  if (org_id) visitQuery = visitQuery.eq('org_id', org_id);
  if (store_id) visitQuery = visitQuery.eq('store_id', store_id);
  if (date_from) visitQuery = visitQuery.gte('visit_date', date_from);
  if (date_to) visitQuery = visitQuery.lte('visit_date', date_to);

  const { data: visits, error: visitError } = await visitQuery;
  if (visitError) {
    console.error('[funnel_events] Visit query error:', visitError);
    return { processed: 0, errors: 1 };
  }

  if (!visits || visits.length === 0) {
    return { processed: 0, errors: 0 };
  }

  // Generate funnel events from visits
  const funnelEvents: any[] = [];
  
  for (const visit of visits) {
    const visitDate = visit.visit_date || visit.created_at;
    const baseEvent = {
      store_id: visit.store_id,
      org_id: visit.org_id,
      customer_id: visit.customer_id,
      visitor_id: visit.visitor_id || visit.id,
      session_id: visit.session_id || visit.id,
      event_date: visitDate?.split('T')[0],
      event_hour: visitDate ? new Date(visitDate).getHours() : null,
    };

    // Entry event
    funnelEvents.push({
      ...baseEvent,
      event_type: 'entry',
      event_timestamp: visitDate,
    });

    // Browse event (if dwell time indicates browsing)
    if (visit.dwell_time_seconds && visit.dwell_time_seconds > 30) {
      funnelEvents.push({
        ...baseEvent,
        event_type: 'browse',
        event_timestamp: visitDate,
        duration_seconds: Math.min(visit.dwell_time_seconds, 300),
      });
    }

    // Check for purchase
    if (visit.converted || visit.purchase_made) {
      funnelEvents.push({
        ...baseEvent,
        event_type: 'purchase',
        event_timestamp: visitDate,
      });
    }
  }

  if (funnelEvents.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('funnel_events')
    .upsert(funnelEvents, { onConflict: 'id', ignoreDuplicates: true });

  if (insertError) {
    console.error('[funnel_events] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: funnelEvents.length, errors: 0 };
}

async function processZoneEvents(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  let query = supabase.from('wifi_tracking').select('*');
  if (org_id) query = query.eq('org_id', org_id);
  if (store_id) query = query.eq('store_id', store_id);
  if (date_from) query = query.gte('detected_at', date_from);
  if (date_to) query = query.lte('detected_at', date_to);

  const { data: wifiData, error } = await query.limit(5000);
  if (error) {
    console.error('[zone_events] Query error:', error);
    return { processed: 0, errors: 1 };
  }

  if (!wifiData || wifiData.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const zoneEvents = wifiData.map((w: any) => ({
    zone_id: w.zone_id,
    store_id: w.store_id,
    org_id: w.org_id,
    visitor_id: w.device_id || w.mac_address,
    event_type: 'zone_enter',
    event_timestamp: w.detected_at,
    event_date: w.detected_at?.split('T')[0],
    event_hour: w.detected_at ? new Date(w.detected_at).getHours() : null,
    dwell_seconds: w.dwell_time_seconds,
    x_coord: w.x_position,
    y_coord: w.y_position,
    metadata: { signal_strength: w.signal_strength, source: 'wifi_tracking' },
  }));

  const { error: insertError } = await supabase
    .from('zone_events')
    .upsert(zoneEvents, { onConflict: 'id', ignoreDuplicates: true });

  if (insertError) {
    console.error('[zone_events] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: zoneEvents.length, errors: 0 };
}

async function processVisitZoneEvents(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  // Get zone_events and correlate with visits
  let query = supabase.from('zone_events').select('*');
  if (org_id) query = query.eq('org_id', org_id);
  if (store_id) query = query.eq('store_id', store_id);
  if (date_from) query = query.gte('event_date', date_from);
  if (date_to) query = query.lte('event_date', date_to);

  const { data: zoneEvents, error } = await query.limit(5000);
  if (error || !zoneEvents || zoneEvents.length === 0) {
    return { processed: 0, errors: error ? 1 : 0 };
  }

  // Get corresponding visits
  const { data: visits } = await supabase
    .from('visits')
    .select('id, visitor_id, store_id, visit_date')
    .in('store_id', [...new Set(zoneEvents.map((z: any) => z.store_id).filter(Boolean))]);

  const visitMap = new Map((visits || []).map((v: any) => [`${v.visitor_id}_${v.store_id}_${v.visit_date?.split('T')[0]}`, v.id]));

  const visitZoneEvents = zoneEvents.map((ze: any) => {
    const visitKey = `${ze.visitor_id}_${ze.store_id}_${ze.event_date}`;
    return {
      visit_id: visitMap.get(visitKey),
      zone_id: ze.zone_id,
      store_id: ze.store_id,
      org_id: ze.org_id,
      enter_time: ze.event_timestamp,
      exit_time: ze.dwell_seconds ? new Date(new Date(ze.event_timestamp).getTime() + ze.dwell_seconds * 1000).toISOString() : null,
      dwell_seconds: ze.dwell_seconds,
      interaction_count: 1,
      event_date: ze.event_date,
    };
  }).filter((vze: any) => vze.zone_id);

  if (visitZoneEvents.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('visit_zone_events')
    .upsert(visitZoneEvents, { onConflict: 'id', ignoreDuplicates: true });

  if (insertError) {
    console.error('[visit_zone_events] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: visitZoneEvents.length, errors: 0 };
}

async function syncZonesDim(
  supabase: any,
  org_id?: string,
  store_id?: string
): Promise<{ processed: number; errors: number }> {
  // Get zones from wifi_zones and graph_entities
  let query = supabase.from('wifi_zones').select('*');
  if (org_id) query = query.eq('org_id', org_id);
  if (store_id) query = query.eq('store_id', store_id);

  const { data: wifiZones, error } = await query;
  if (error) {
    console.error('[zones_dim] Query error:', error);
    return { processed: 0, errors: 1 };
  }

  // Also get Zone entities from graph
  let entityQuery = supabase
    .from('graph_entities')
    .select('id, label, properties, store_id, org_id')
    .eq('entity_type_id', (await supabase
      .from('ontology_entity_types')
      .select('id')
      .eq('name', 'Zone')
      .single()).data?.id);

  if (org_id) entityQuery = entityQuery.eq('org_id', org_id);
  if (store_id) entityQuery = entityQuery.eq('store_id', store_id);

  const { data: zoneEntities } = await entityQuery;

  const zones: any[] = [];

  // Process wifi_zones
  (wifiZones || []).forEach((wz: any) => {
    zones.push({
      zone_code: wz.zone_id || wz.id,
      zone_name: wz.zone_name || wz.name,
      zone_type: wz.zone_type || 'general',
      store_id: wz.store_id,
      org_id: wz.org_id,
      floor_level: wz.floor || 1,
      area_sqm: wz.area_sqm,
      capacity: wz.capacity,
      is_active: wz.is_active ?? true,
      metadata: wz.metadata || { source: 'wifi_zones' },
    });
  });

  // Process graph zone entities
  (zoneEntities || []).forEach((ze: any) => {
    const props = ze.properties || {};
    zones.push({
      zone_code: props.zone_code || ze.id,
      zone_name: ze.label || props.zone_name,
      zone_type: props.zone_type || 'general',
      store_id: ze.store_id,
      org_id: ze.org_id,
      floor_level: props.floor_level || 1,
      area_sqm: props.area_sqm,
      capacity: props.capacity,
      is_active: true,
      metadata: { source: 'graph_entities', entity_id: ze.id },
    });
  });

  if (zones.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('zones_dim')
    .upsert(zones, { onConflict: 'zone_code,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[zones_dim] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: zones.length, errors: 0 };
}
