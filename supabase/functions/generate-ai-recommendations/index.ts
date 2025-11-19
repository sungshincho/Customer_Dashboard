import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPI {
  total_revenue: number;
  total_visits: number;
  total_purchases: number;
  conversion_rate: number;
  sales_per_sqm: number;
  funnel_entry: number;
  funnel_browse: number;
  funnel_fitting: number;
  funnel_purchase: number;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  category: string;
  impact: any;
  evidence: any;
}

function generateRecommendations(kpi: KPI, inventory: any[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. 재고 부족 경고
  const lowStockItems = inventory.filter((item) => {
    const stock = item.properties?.stock_quantity || 0;
    const minStock = item.properties?.min_stock || 10;
    return stock < minStock;
  });

  if (lowStockItems.length > 0) {
    recommendations.push({
      type: 'alert',
      priority: 'high',
      title: '재고 부족 경고',
      description: `${lowStockItems.length}개 상품의 재고가 최소 수량 이하입니다. 즉시 발주가 필요합니다.`,
      category: 'inventory',
      impact: {
        revenue_loss_risk: lowStockItems.length * 50000,
      },
      evidence: {
        low_stock_count: lowStockItems.length,
        items: lowStockItems.slice(0, 5).map((i) => i.label),
      },
    });
  }

  // 2. 전환율 개선 제안
  if (kpi.conversion_rate < 5) {
    const funnelDropoff = ((kpi.funnel_browse - kpi.funnel_fitting) / kpi.funnel_browse) * 100;
    
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: '전환율 개선 기회',
      description: `현재 전환율 ${kpi.conversion_rate.toFixed(1)}%는 업계 평균(7-10%)보다 낮습니다. 피팅룸 개선과 직원 배치 최적화로 2-3% 향상 가능합니다.`,
      category: 'layout',
      impact: {
        cvr_increase: 2.5,
        revenue_increase: (kpi.total_revenue * 0.4), // 40% 매출 증가 예상
      },
      evidence: {
        current_cvr: kpi.conversion_rate,
        target_cvr: 7.0,
        funnel_dropoff: funnelDropoff,
      },
    });
  }

  // 3. 매출/㎡ 최적화
  if (kpi.sales_per_sqm < 100000) {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: '매장 공간 효율성 개선',
      description: `현재 매출/㎡가 ₩${Math.floor(kpi.sales_per_sqm).toLocaleString()}로 목표치(₩150,000/㎡) 대비 낮습니다. 핫존 재배치로 20% 개선 가능합니다.`,
      category: 'layout',
      impact: {
        sales_per_sqm_increase: 30000,
        revenue_increase: kpi.total_revenue * 0.2,
      },
      evidence: {
        current_sales_per_sqm: kpi.sales_per_sqm,
        target_sales_per_sqm: 150000,
      },
    });
  }

  // 4. 고객 여정 최적화
  const browseToFittingRate = (kpi.funnel_fitting / kpi.funnel_browse) * 100;
  if (browseToFittingRate < 50) {
    recommendations.push({
      type: 'insight',
      priority: 'low',
      title: '피팅룸 유도율 개선',
      description: `탐색 고객 중 ${browseToFittingRate.toFixed(1)}%만 피팅룸을 이용합니다. 피팅룸 표지판과 직원 안내 개선으로 15% 향상 가능합니다.`,
      category: 'staffing',
      impact: {
        fitting_rate_increase: 15,
      },
      evidence: {
        current_rate: browseToFittingRate,
        browse_count: kpi.funnel_browse,
        fitting_count: kpi.funnel_fitting,
      },
    });
  }

  return recommendations;
}

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

    const { store_id } = await req.json();
    console.log('Generating AI recommendations for:', { store_id, user_id: user.id });

    // 1. 최근 KPI 가져오기
    const { data: latestKpi, error: kpiError } = await supabaseClient
      .from('dashboard_kpis')
      .select('*')
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kpiError) {
      console.error('KPI error:', kpiError);
      throw kpiError;
    }

    if (!latestKpi) {
      throw new Error('No KPI data found. Please aggregate KPIs first.');
    }

    // 2. 재고 데이터 가져오기
    const { data: inventory, error: inventoryError } = await supabaseClient
      .from('graph_entities')
      .select('*')
      .eq('user_id', user.id)
      .eq('store_id', store_id);

    if (inventoryError) console.error('Inventory error:', inventoryError);

    // 3. AI 추천 생성
    const recommendations = generateRecommendations(latestKpi, inventory || []);

    // 4. 기존 추천 비활성화 (오늘 날짜 기준)
    const today = new Date().toISOString().split('T')[0];
    await supabaseClient
      .from('ai_recommendations')
      .update({ is_displayed: false })
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .gte('created_at', `${today}T00:00:00`);

    // 5. 새 추천 저장 (상위 3개만)
    const topRecommendations = recommendations.slice(0, 3);
    const insertData = topRecommendations.map((rec) => ({
      user_id: user.id,
      store_id,
      recommendation_type: rec.type,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      action_category: rec.category,
      expected_impact: rec.impact,
      data_source: 'analysis',
      evidence: rec.evidence,
      status: 'pending',
      is_displayed: true,
      displayed_at: new Date().toISOString(),
    }));

    const { data: insertedRecs, error: insertError } = await supabaseClient
      .from('ai_recommendations')
      .insert(insertData)
      .select();

    if (insertError) throw insertError;

    console.log('AI recommendations generated:', insertedRecs);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: insertedRecs,
        count: insertedRecs.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
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
