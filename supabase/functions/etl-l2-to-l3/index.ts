import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AggregationRequest {
  org_id?: string;
  store_id?: string;
  date?: string;
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

    const body: AggregationRequest = await req.json().catch(() => ({}));
    const { org_id, store_id, date, date_from, date_to, target_tables } = body;

    // Default to today if no date specified
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log(`[ETL L2→L3] Starting aggregation for date: ${targetDate}, org: ${org_id}, store: ${store_id}, isServiceRole: ${isServiceRole}`);

    const results: Record<string, { processed: number; errors: number }> = {};
    const targetSet = new Set(target_tables || [
      'daily_kpis_agg', 'hourly_metrics', 'zone_daily_metrics', 
      'customer_segments_agg', 'product_performance_agg'
    ]);

    // 1. Aggregate daily KPIs
    if (targetSet.has('daily_kpis_agg')) {
      console.log('[ETL L2→L3] Aggregating daily_kpis_agg');
      const dailyKpiResult = await aggregateDailyKPIs(supabase, org_id, store_id, targetDate, date_from, date_to);
      results.daily_kpis_agg = dailyKpiResult;
    }

    // 2. Aggregate hourly metrics
    if (targetSet.has('hourly_metrics')) {
      console.log('[ETL L2→L3] Aggregating hourly_metrics');
      const hourlyResult = await aggregateHourlyMetrics(supabase, org_id, store_id, targetDate, date_from, date_to);
      results.hourly_metrics = hourlyResult;
    }

    // 3. Aggregate zone daily metrics
    if (targetSet.has('zone_daily_metrics')) {
      console.log('[ETL L2→L3] Aggregating zone_daily_metrics');
      const zoneResult = await aggregateZoneDailyMetrics(supabase, org_id, store_id, targetDate, date_from, date_to);
      results.zone_daily_metrics = zoneResult;
    }

    // 4. Aggregate customer segments
    if (targetSet.has('customer_segments_agg')) {
      console.log('[ETL L2→L3] Aggregating customer_segments_agg');
      const segmentResult = await aggregateCustomerSegments(supabase, org_id, store_id, targetDate);
      results.customer_segments_agg = segmentResult;
    }

    // 5. Aggregate product performance
    if (targetSet.has('product_performance_agg')) {
      console.log('[ETL L2→L3] Aggregating product_performance_agg');
      const productResult = await aggregateProductPerformance(supabase, org_id, store_id, targetDate, date_from, date_to);
      results.product_performance_agg = productResult;
    }

    console.log('[ETL L2→L3] Completed:', JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      results,
      aggregated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[ETL L2→L3] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Aggregation failed';
    return new Response(JSON.stringify({
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function aggregateDailyKPIs(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  // Get stores to aggregate
  let storeQuery = supabase.from('stores').select('id, org_id, area_sqm');
  if (org_id) storeQuery = storeQuery.eq('org_id', org_id);
  if (store_id) storeQuery = storeQuery.eq('id', store_id);

  const { data: stores, error: storeError } = await storeQuery;
  if (storeError || !stores || stores.length === 0) {
    return { processed: 0, errors: storeError ? 1 : 0 };
  }

  const dates = getDateRange(date, date_from, date_to);
  const aggregations: any[] = [];

  for (const targetDate of dates) {
    for (const store of stores) {
      // Get line_items for revenue and transaction metrics
      const { data: lineItems } = await supabase
        .from('line_items')
        .select('*')
        .eq('store_id', store.id)
        .eq('transaction_date', targetDate);

      // Get funnel_events for visitor metrics
      const { data: funnelEvents } = await supabase
        .from('funnel_events')
        .select('*')
        .eq('store_id', store.id)
        .eq('event_date', targetDate);

      // Calculate metrics
      const totalRevenue = (lineItems || []).reduce((sum: number, li: any) => sum + (li.total_amount || 0), 0);
      const totalTransactions = new Set((lineItems || []).map((li: any) => li.transaction_id)).size;
      const totalUnits = (lineItems || []).reduce((sum: number, li: any) => sum + (li.quantity || 0), 0);

      const entryEvents = (funnelEvents || []).filter((e: any) => e.event_type === 'entry');
      const purchaseEvents = (funnelEvents || []).filter((e: any) => e.event_type === 'purchase');
      const browseEvents = (funnelEvents || []).filter((e: any) => e.event_type === 'browse');

      const totalVisitors = entryEvents.length;
      const uniqueVisitors = new Set(entryEvents.map((e: any) => e.visitor_id)).size;
      const conversionRate = totalVisitors > 0 ? (purchaseEvents.length / totalVisitors) * 100 : 0;

      const avgVisitDuration = browseEvents.length > 0
        ? browseEvents.reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0) / browseEvents.length
        : 0;

      const browseToEngageRate = totalVisitors > 0 ? (browseEvents.length / totalVisitors) * 100 : 0;
      const engageToPurchaseRate = browseEvents.length > 0 ? (purchaseEvents.length / browseEvents.length) * 100 : 0;

      aggregations.push({
        date: targetDate,
        store_id: store.id,
        org_id: store.org_id,
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        total_units_sold: totalUnits,
        total_visitors: totalVisitors,
        unique_visitors: uniqueVisitors,
        conversion_rate: conversionRate,
        avg_transaction_value: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        avg_basket_size: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
        avg_visit_duration_seconds: avgVisitDuration,
        sales_per_sqm: store.area_sqm ? totalRevenue / store.area_sqm : null,
        sales_per_visitor: totalVisitors > 0 ? totalRevenue / totalVisitors : 0,
        browse_to_engage_rate: browseToEngageRate,
        engage_to_purchase_rate: engageToPurchaseRate,
        calculated_at: new Date().toISOString(),
      });
    }
  }

  if (aggregations.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('daily_kpis_agg')
    .upsert(aggregations, { onConflict: 'date,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[daily_kpis_agg] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: aggregations.length, errors: 0 };
}

async function aggregateHourlyMetrics(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  let storeQuery = supabase.from('stores').select('id, org_id');
  if (org_id) storeQuery = storeQuery.eq('org_id', org_id);
  if (store_id) storeQuery = storeQuery.eq('id', store_id);

  const { data: stores } = await storeQuery;
  if (!stores || stores.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const dates = getDateRange(date, date_from, date_to);
  const aggregations: any[] = [];

  for (const targetDate of dates) {
    for (const store of stores) {
      // Get hourly data from line_items
      const { data: lineItems } = await supabase
        .from('line_items')
        .select('*')
        .eq('store_id', store.id)
        .eq('transaction_date', targetDate);

      // Get hourly funnel events
      const { data: funnelEvents } = await supabase
        .from('funnel_events')
        .select('*')
        .eq('store_id', store.id)
        .eq('event_date', targetDate);

      // Group by hour (0-23)
      for (let hour = 0; hour < 24; hour++) {
        const hourlyLineItems = (lineItems || []).filter((li: any) => li.transaction_hour === hour);
        const hourlyFunnelEvents = (funnelEvents || []).filter((e: any) => e.event_hour === hour);

        const revenue = hourlyLineItems.reduce((sum: number, li: any) => sum + (li.total_amount || 0), 0);
        const transactions = new Set(hourlyLineItems.map((li: any) => li.transaction_id)).size;
        const units = hourlyLineItems.reduce((sum: number, li: any) => sum + (li.quantity || 0), 0);

        const entryEvents = hourlyFunnelEvents.filter((e: any) => e.event_type === 'entry');
        const purchaseEvents = hourlyFunnelEvents.filter((e: any) => e.event_type === 'purchase');
        const visitors = entryEvents.length;
        const conversionRate = visitors > 0 ? (purchaseEvents.length / visitors) * 100 : 0;

        // Only save if there's activity
        if (revenue > 0 || visitors > 0) {
          aggregations.push({
            date: targetDate,
            hour,
            store_id: store.id,
            org_id: store.org_id,
            visitor_count: visitors,
            entry_count: entryEvents.length,
            exit_count: entryEvents.length, // Assume equal for now
            transaction_count: transactions,
            revenue,
            units_sold: units,
            conversion_rate: conversionRate,
            calculated_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  if (aggregations.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('hourly_metrics')
    .upsert(aggregations, { onConflict: 'date,hour,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[hourly_metrics] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: aggregations.length, errors: 0 };
}

async function aggregateZoneDailyMetrics(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  const dates = getDateRange(date, date_from, date_to);
  const aggregations: any[] = [];

  for (const targetDate of dates) {
    // Get visit_zone_events for the date
    let query = supabase
      .from('visit_zone_events')
      .select('*')
      .eq('event_date', targetDate);

    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: zoneEvents } = await query;
    if (!zoneEvents || zoneEvents.length === 0) continue;

    // Get zone details
    const zoneIds = [...new Set(zoneEvents.map((ze: any) => ze.zone_id).filter(Boolean))];
    const { data: zones } = await supabase
      .from('zones_dim')
      .select('*')
      .in('id', zoneIds);

    const zoneMap = new Map<string, any>((zones || []).map((z: any) => [z.id, z]));

    // Group by zone
    const zoneGroups = new Map<string, any[]>();
    for (const event of zoneEvents) {
      if (!event.zone_id) continue;
      const key = `${event.zone_id}_${event.store_id}`;
      if (!zoneGroups.has(key)) {
        zoneGroups.set(key, []);
      }
      zoneGroups.get(key)!.push(event);
    }

    for (const [key, events] of zoneGroups) {
      const [zoneId, storeId] = key.split('_');
      const zone = zoneMap.get(zoneId) as any;

      const uniqueVisitors = new Set(events.map((e: any) => e.visit_id)).size;
      const totalDwell = events.reduce((sum: number, e: any) => sum + (e.dwell_seconds || 0), 0);
      const avgDwell = events.length > 0 ? totalDwell / events.length : 0;
      const totalInteractions = events.reduce((sum: number, e: any) => sum + (e.interaction_count || 0), 0);

      aggregations.push({
        date: targetDate,
        zone_id: zoneId,
        store_id: storeId,
        org_id: events[0]?.org_id,
        zone_name: zone?.zone_name || null,
        zone_type: zone?.zone_type || null,
        visitor_count: uniqueVisitors,
        total_dwell_seconds: totalDwell,
        avg_dwell_seconds: avgDwell,
        interaction_count: totalInteractions,
        conversion_rate: null, // Would need purchase correlation
        heatmap_intensity: uniqueVisitors > 0 ? Math.min(uniqueVisitors / 10, 1) : 0,
        calculated_at: new Date().toISOString(),
      });
    }
  }

  if (aggregations.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('zone_daily_metrics')
    .upsert(aggregations, { onConflict: 'date,zone_id,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[zone_daily_metrics] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: aggregations.length, errors: 0 };
}

async function aggregateCustomerSegments(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date?: string
): Promise<{ processed: number; errors: number }> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get customer segments from customer_segments table
  let segmentQuery = supabase.from('customer_segments').select('*');
  if (org_id) segmentQuery = segmentQuery.eq('org_id', org_id);
  if (store_id) segmentQuery = segmentQuery.eq('store_id', store_id);

  const { data: segments } = await segmentQuery;

  // Get customers data
  let customerQuery = supabase.from('customers').select('*');
  if (org_id) customerQuery = customerQuery.eq('org_id', org_id);
  if (store_id) customerQuery = customerQuery.eq('store_id', store_id);

  const { data: customers } = await customerQuery;

  // Get line_items for revenue calculation
  let lineItemQuery = supabase.from('line_items').select('*');
  if (org_id) lineItemQuery = lineItemQuery.eq('org_id', org_id);
  if (store_id) lineItemQuery = lineItemQuery.eq('store_id', store_id);

  const { data: lineItems } = await lineItemQuery;

  const aggregations: any[] = [];

  // RFM-based segmentation if no predefined segments
  if ((!segments || segments.length === 0) && customers && customers.length > 0) {
    const segmentTypes = ['VIP', 'Regular', 'New', 'At-Risk', 'Churned'];
    const customersBySegment = new Map<string, any[]>();

    // Simple RFM logic based on total_purchases
    for (const customer of customers) {
      const purchases = customer.total_purchases || 0;
      let segment = 'New';
      if (purchases >= 10) segment = 'VIP';
      else if (purchases >= 5) segment = 'Regular';
      else if (purchases >= 1) segment = 'New';
      else segment = 'At-Risk';

      if (!customersBySegment.has(segment)) {
        customersBySegment.set(segment, []);
      }
      customersBySegment.get(segment)!.push(customer);
    }

    for (const [segmentName, segmentCustomers] of customersBySegment) {
      const customerIds = segmentCustomers.map((c: any) => c.id);
      const segmentLineItems = (lineItems || []).filter((li: any) => customerIds.includes(li.customer_id));
      const totalRevenue = segmentLineItems.reduce((sum: number, li: any) => sum + (li.total_amount || 0), 0);
      const avgTransactionValue = segmentLineItems.length > 0 ? totalRevenue / segmentLineItems.length : 0;

      aggregations.push({
        date: targetDate,
        segment_type: 'rfm',
        segment_name: segmentName,
        store_id: store_id || segmentCustomers[0]?.store_id,
        org_id: org_id || segmentCustomers[0]?.org_id,
        customer_count: segmentCustomers.length,
        total_revenue: totalRevenue,
        avg_transaction_value: avgTransactionValue,
        visit_frequency: segmentCustomers.reduce((sum: number, c: any) => sum + (c.total_purchases || 0), 0) / segmentCustomers.length,
        ltv_estimate: avgTransactionValue * 12, // Simple annual LTV estimate
        churn_risk_score: segmentName === 'At-Risk' ? 0.8 : segmentName === 'Churned' ? 0.95 : 0.2,
        calculated_at: new Date().toISOString(),
      });
    }
  } else if (segments && segments.length > 0) {
    // Use predefined segments
    for (const segment of segments) {
      const segmentCustomers = (customers || []).filter((c: any) => c.segment === segment.segment_code);
      const customerIds = segmentCustomers.map((c: any) => c.id);
      const segmentLineItems = (lineItems || []).filter((li: any) => customerIds.includes(li.customer_id));
      const totalRevenue = segmentLineItems.reduce((sum: number, li: any) => sum + (li.total_amount || 0), 0);

      aggregations.push({
        date: targetDate,
        segment_type: 'predefined',
        segment_name: segment.segment_name,
        store_id: segment.store_id,
        org_id: segment.org_id,
        customer_count: segmentCustomers.length,
        total_revenue: totalRevenue,
        avg_transaction_value: segmentLineItems.length > 0 ? totalRevenue / segmentLineItems.length : 0,
        avg_basket_size: segment.avg_purchase_frequency,
        ltv_estimate: segment.avg_ltv,
        calculated_at: new Date().toISOString(),
      });
    }
  }

  if (aggregations.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('customer_segments_agg')
    .upsert(aggregations, { onConflict: 'date,segment_type,segment_name,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[customer_segments_agg] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: aggregations.length, errors: 0 };
}

async function aggregateProductPerformance(
  supabase: any,
  org_id?: string,
  store_id?: string,
  date?: string,
  date_from?: string,
  date_to?: string
): Promise<{ processed: number; errors: number }> {
  const dates = getDateRange(date, date_from, date_to);
  const aggregations: any[] = [];

  for (const targetDate of dates) {
    // Get line_items for the date
    let query = supabase
      .from('line_items')
      .select('*')
      .eq('transaction_date', targetDate);

    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: lineItems } = await query;
    if (!lineItems || lineItems.length === 0) continue;

    // Get product details
    const productIds = [...new Set(lineItems.map((li: any) => li.product_id).filter(Boolean))];
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productMap = new Map<string, any>((products || []).map((p: any) => [p.id, p]));

    // Group by product
    const productGroups = new Map<string, any[]>();
    for (const item of lineItems) {
      if (!item.product_id) continue;
      const key = `${item.product_id}_${item.store_id}`;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key)!.push(item);
    }

    for (const [key, items] of productGroups) {
      const [productId, storeId] = key.split('_');
      const product = productMap.get(productId) as any;

      const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const totalRevenue = items.reduce((sum: number, i: any) => sum + (i.line_total || 0), 0);
      const totalDiscount = items.reduce((sum: number, i: any) => sum + (i.discount_amount || 0), 0);
      const transactionCount = new Set(items.map((i: any) => i.transaction_id)).size;
      const discountRate = totalRevenue > 0 ? (totalDiscount / (totalRevenue + totalDiscount)) * 100 : 0;

      aggregations.push({
        date: targetDate,
        product_id: productId,
        store_id: storeId,
        org_id: items[0]?.org_id,
        units_sold: totalQuantity,
        revenue: totalRevenue,
        transactions: transactionCount,
        avg_selling_price: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
        discount_rate: discountRate,
        return_rate: 0,
        stock_level: product?.stock || null,
        calculated_at: new Date().toISOString(),
      });
    }
  }

  if (aggregations.length === 0) {
    return { processed: 0, errors: 0 };
  }

  const { error: insertError } = await supabase
    .from('product_performance_agg')
    .upsert(aggregations, { onConflict: 'date,product_id,store_id', ignoreDuplicates: false });

  if (insertError) {
    console.error('[product_performance_agg] Insert error:', insertError);
    return { processed: 0, errors: 1 };
  }

  return { processed: aggregations.length, errors: 0 };
}

function getDateRange(date?: string, date_from?: string, date_to?: string): string[] {
  if (date_from && date_to) {
    const dates: string[] = [];
    const start = new Date(date_from);
    const end = new Date(date_to);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }
  return [date || new Date().toISOString().split('T')[0]];
}
