import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { store_id, date } = await req.json();
    console.log('Aggregating KPIs for:', { store_id, date, user_id: user.id });

    // 1. 온톨로지 데이터에서 방문/구매 데이터 가져오기
    const { data: visits, error: visitsError } = await supabaseClient
      .from('graph_entities')
      .select('properties')
      .eq('user_id', user.id)
      .eq('entity_type_id', '(select id from ontology_entity_types where name = "visit")')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (visitsError) console.error('Visits error:', visitsError);

    const { data: purchases, error: purchasesError } = await supabaseClient
      .from('graph_entities')
      .select('properties')
      .eq('user_id', user.id)
      .eq('entity_type_id', '(select id from ontology_entity_types where name = "purchase")')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (purchasesError) console.error('Purchases error:', purchasesError);

    // 2. KPI 계산
    const totalVisits = visits?.length || 0;
    const totalPurchases = purchases?.length || 0;
    const totalRevenue = purchases?.reduce((sum, p) => {
      const props = p.properties as any;
      return sum + ((props?.total_amount || 0) as number);
    }, 0) || 0;

    const conversionRate = totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;

    // 3. 퍼널 메트릭 계산
    const { data: trackingData } = await supabaseClient
      .from('wifi_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', `${date}T00:00:00`)
      .lte('timestamp', `${date}T23:59:59`);

    const funnelMetrics = {
      funnel_entry: totalVisits,
      funnel_browse: Math.floor(totalVisits * 0.7),
      funnel_fitting: Math.floor(totalVisits * 0.3),
      funnel_purchase: totalPurchases,
      funnel_return: Math.floor(totalPurchases * 0.15),
    };

    // 4. 매장 정보 가져오기
    const { data: storeData } = await supabaseClient
      .from('stores')
      .select('metadata')
      .eq('id', store_id)
      .single();

    const storeMetadata = storeData?.metadata as any;
    const storeArea = storeMetadata?.area || 100; // 기본값 100㎡
    const salesPerSqm = storeArea > 0 ? totalRevenue / storeArea : 0;

    // 5. Dashboard KPI 저장/업데이트
    const { data: existingKpi } = await supabaseClient
      .from('dashboard_kpis')
      .select('id')
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .eq('date', date)
      .maybeSingle();

    const kpiData = {
      user_id: user.id,
      store_id,
      date,
      total_revenue: totalRevenue,
      total_visits: totalVisits,
      total_purchases: totalPurchases,
      conversion_rate: conversionRate,
      sales_per_sqm: salesPerSqm,
      labor_hours: 0, // 추후 스태핑 데이터 연동
      ...funnelMetrics,
      weather_condition: null,
      is_holiday: false,
      special_event: null,
      consumer_sentiment_index: null,
    };

    let kpiResult;
    if (existingKpi) {
      const { data, error } = await supabaseClient
        .from('dashboard_kpis')
        .update(kpiData)
        .eq('id', existingKpi.id)
        .select()
        .single();
      
      if (error) throw error;
      kpiResult = data;
    } else {
      const { data, error } = await supabaseClient
        .from('dashboard_kpis')
        .insert(kpiData)
        .select()
        .single();
      
      if (error) throw error;
      kpiResult = data;
    }

    console.log('KPI aggregation completed:', kpiResult);

    return new Response(
      JSON.stringify({
        success: true,
        kpi: kpiResult,
        metrics: {
          totalVisits,
          totalPurchases,
          totalRevenue,
          conversionRate,
          salesPerSqm,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error aggregating KPIs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
