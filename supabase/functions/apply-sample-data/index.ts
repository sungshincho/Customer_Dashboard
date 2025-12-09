/**
 * apply-sample-data/index.ts
 * 
 * Supabase Edge Function
 * 온보딩 시 샘플 데이터 템플릿을 적용하는 함수
 * 
 * 배포: supabase functions deploy apply-sample-data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  templateId: string;
  storeId: string;
  orgId: string;
  userId: string;
}

serve(async (req) => {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId, storeId, orgId, userId }: RequestBody = await req.json();

    // 1. 템플릿 조회
    const { data: template, error: templateError } = await supabaseClient
      .from('sample_data_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw new Error(`템플릿 조회 실패: ${templateError.message}`);
    if (!template) throw new Error('템플릿을 찾을 수 없습니다');

    console.log(`템플릿 적용 시작: ${template.display_name}`);

    // 2. 매장 정보 업데이트 (업종 설정)
    await supabaseClient
      .from('stores')
      .update({
        business_type: template.template_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    // 3. 샘플 상품 생성
    const sampleProducts = getDefaultProducts(template.template_type);
    let createdProductsCount = 0;
    
    for (const product of sampleProducts) {
      const { error: productError } = await supabaseClient
        .from('graph_entities')
        .insert({
          org_id: orgId,
          store_id: storeId,
          entity_type: 'product',
          name: product.name,
          properties: {
            price: product.price,
            category: product.category,
            sku: product.sku,
          },
        });

      if (!productError) createdProductsCount++;
    }

    // 4. 샘플 구역 생성
    const zones = getDefaultZones(template.template_type);
    let createdZonesCount = 0;
    
    for (const zone of zones) {
      const { error: zoneError } = await supabaseClient
        .from('graph_entities')
        .insert({
          org_id: orgId,
          store_id: storeId,
          entity_type: 'zone',
          name: zone.name,
          properties: {
            zone_type: zone.type,
            area: zone.area,
            position: zone.position,
          },
        });

      if (!zoneError) createdZonesCount++;
    }

    // 5. 샘플 KPI 데이터 생성 (최근 30일)
    const kpiData = generateSampleKPIs(template.template_type, 30);
    let createdKPICount = 0;
    
    for (const kpi of kpiData) {
      const { error: kpiError } = await supabaseClient
        .from('dashboard_kpis')
        .upsert({
          org_id: orgId,
          store_id: storeId,
          date: kpi.date,
          total_revenue: kpi.total_revenue,
          total_visitors: kpi.total_visitors,
          total_transactions: kpi.total_transactions,
          conversion_rate: kpi.conversion_rate,
          avg_transaction_value: kpi.avg_transaction_value,
        }, {
          onConflict: 'store_id,date',
        });

      if (!kpiError) createdKPICount++;
    }

    // 6. 온보딩 진행 상태 업데이트
    await supabaseClient
      .from('onboarding_progress')
      .update({
        selected_template: template.template_name,
        business_type: template.template_type,
        steps_status: {
          '1_account_setup': 'completed',
          '2_store_creation': 'completed',
          '3_data_source': 'completed',
          '4_sample_data': 'completed',
          '5_first_dashboard': 'in_progress',
          '6_first_simulation': 'pending',
          '7_completion': 'pending',
        },
        completed_steps: [1, 2, 3, 4],
        current_step: 5,
        last_activity_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log(`템플릿 적용 완료: ${template.display_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        template: template.display_name,
        created: {
          products: createdProductsCount,
          zones: createdZonesCount,
          kpiDays: createdKPICount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('샘플 데이터 적용 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// 헬퍼 함수: 기본 상품 데이터
// ============================================================================

function getDefaultProducts(templateType: string) {
  const products: Record<string, any[]> = {
    fashion: [
      { name: '캐시미어 코트', price: 450000, category: '아우터', sku: 'FAS-001' },
      { name: '실크 블라우스', price: 180000, category: '상의', sku: 'FAS-002' },
      { name: '울 슬랙스', price: 220000, category: '하의', sku: 'FAS-003' },
      { name: '가죽 핸드백', price: 350000, category: '액세서리', sku: 'FAS-004' },
      { name: '니트 스웨터', price: 150000, category: '상의', sku: 'FAS-005' },
      { name: '데님 재킷', price: 280000, category: '아우터', sku: 'FAS-006' },
      { name: '플리츠 스커트', price: 165000, category: '하의', sku: 'FAS-007' },
      { name: '실버 목걸이', price: 95000, category: '액세서리', sku: 'FAS-008' },
    ],
    beauty: [
      { name: '수분 에센스', price: 65000, category: '스킨케어', sku: 'BTY-001' },
      { name: '선크림 SPF50+', price: 38000, category: '선케어', sku: 'BTY-002' },
      { name: '립스틱 레드', price: 42000, category: '메이크업', sku: 'BTY-003' },
      { name: '클렌징 오일', price: 28000, category: '클렌징', sku: 'BTY-004' },
      { name: '아이크림', price: 85000, category: '스킨케어', sku: 'BTY-005' },
      { name: '파운데이션', price: 55000, category: '메이크업', sku: 'BTY-006' },
      { name: '마스카라', price: 32000, category: '메이크업', sku: 'BTY-007' },
      { name: '토너', price: 35000, category: '스킨케어', sku: 'BTY-008' },
    ],
    grocery: [
      { name: '유기농 우유', price: 4500, category: '유제품', sku: 'GRC-001' },
      { name: '신선 계란 30구', price: 8900, category: '계란', sku: 'GRC-002' },
      { name: '수입 바나나', price: 3500, category: '과일', sku: 'GRC-003' },
      { name: '프리미엄 소고기', price: 25000, category: '정육', sku: 'GRC-004' },
      { name: '통밀 식빵', price: 3800, category: '베이커리', sku: 'GRC-005' },
      { name: '생수 2L', price: 1200, category: '음료', sku: 'GRC-006' },
      { name: '라면 5개입', price: 4500, category: '가공식품', sku: 'GRC-007' },
      { name: '치즈', price: 6500, category: '유제품', sku: 'GRC-008' },
    ],
    restaurant: [
      { name: '아메리카노', price: 4500, category: '커피', sku: 'RST-001' },
      { name: '카페라떼', price: 5500, category: '커피', sku: 'RST-002' },
      { name: '크로아상', price: 4000, category: '베이커리', sku: 'RST-003' },
      { name: '클럽 샌드위치', price: 7500, category: '푸드', sku: 'RST-004' },
      { name: '티라미수', price: 6500, category: '디저트', sku: 'RST-005' },
      { name: '녹차 라떼', price: 5800, category: '음료', sku: 'RST-006' },
      { name: '에그 타르트', price: 3500, category: '베이커리', sku: 'RST-007' },
      { name: '파스타', price: 12000, category: '푸드', sku: 'RST-008' },
    ],
    general: [
      { name: '상품 A', price: 15000, category: '일반', sku: 'GEN-001' },
      { name: '상품 B', price: 25000, category: '일반', sku: 'GEN-002' },
      { name: '상품 C', price: 35000, category: '일반', sku: 'GEN-003' },
      { name: '상품 D', price: 45000, category: '일반', sku: 'GEN-004' },
      { name: '상품 E', price: 55000, category: '일반', sku: 'GEN-005' },
    ],
  };

  return products[templateType] || products.general;
}

// ============================================================================
// 헬퍼 함수: 기본 구역 데이터
// ============================================================================

function getDefaultZones(templateType: string) {
  const zones: Record<string, any[]> = {
    fashion: [
      { name: '입구', type: 'entrance', area: 10, position: { x: 0, y: 0 } },
      { name: '여성복', type: 'women', area: 50, position: { x: 10, y: 0 } },
      { name: '남성복', type: 'men', area: 40, position: { x: 10, y: 20 } },
      { name: '액세서리', type: 'accessories', area: 20, position: { x: 30, y: 0 } },
      { name: '피팅룸', type: 'fitting_room', area: 15, position: { x: 30, y: 20 } },
      { name: '계산대', type: 'counter', area: 10, position: { x: 40, y: 10 } },
    ],
    beauty: [
      { name: '입구', type: 'entrance', area: 8, position: { x: 0, y: 0 } },
      { name: '스킨케어', type: 'skincare', area: 35, position: { x: 10, y: 0 } },
      { name: '메이크업', type: 'makeup', area: 35, position: { x: 10, y: 15 } },
      { name: '향수', type: 'fragrance', area: 20, position: { x: 25, y: 0 } },
      { name: '테스터바', type: 'tester_bar', area: 15, position: { x: 25, y: 15 } },
      { name: '상담석', type: 'consultation', area: 10, position: { x: 35, y: 5 } },
      { name: '계산대', type: 'counter', area: 8, position: { x: 35, y: 15 } },
    ],
    grocery: [
      { name: '입구', type: 'entrance', area: 12, position: { x: 0, y: 0 } },
      { name: '음료', type: 'beverages', area: 30, position: { x: 10, y: 0 } },
      { name: '과자/스낵', type: 'snacks', area: 25, position: { x: 20, y: 0 } },
      { name: '신선식품', type: 'fresh_food', area: 40, position: { x: 10, y: 15 } },
      { name: '냉동식품', type: 'frozen', area: 30, position: { x: 20, y: 15 } },
      { name: '생활용품', type: 'daily_goods', area: 25, position: { x: 30, y: 0 } },
      { name: '계산대', type: 'counter', area: 15, position: { x: 0, y: 15 } },
    ],
    restaurant: [
      { name: '입구', type: 'entrance', area: 8, position: { x: 0, y: 0 } },
      { name: '주문대', type: 'counter', area: 15, position: { x: 10, y: 0 } },
      { name: '좌석 A', type: 'seating_area', area: 40, position: { x: 0, y: 10 } },
      { name: '좌석 B', type: 'seating_area', area: 40, position: { x: 20, y: 10 } },
      { name: '주방', type: 'kitchen', area: 30, position: { x: 10, y: 20 } },
      { name: '야외석', type: 'outdoor', area: 25, position: { x: 30, y: 0 } },
    ],
    general: [
      { name: '입구', type: 'entrance', area: 10, position: { x: 0, y: 0 } },
      { name: '메인 매장', type: 'main_floor', area: 80, position: { x: 10, y: 0 } },
      { name: '창고', type: 'back_room', area: 20, position: { x: 30, y: 0 } },
      { name: '계산대', type: 'counter', area: 10, position: { x: 10, y: 20 } },
    ],
  };

  return zones[templateType] || zones.general;
}

// ============================================================================
// 헬퍼 함수: 샘플 KPI 데이터 생성
// ============================================================================

function generateSampleKPIs(templateType: string, days: number) {
  const baseMetrics: Record<string, any> = {
    fashion: { avgRevenue: 2500000, avgVisitors: 150, conversionRate: 16.7 },
    beauty: { avgRevenue: 1800000, avgVisitors: 200, conversionRate: 22.5 },
    grocery: { avgRevenue: 850000, avgVisitors: 300, conversionRate: 80.0 },
    restaurant: { avgRevenue: 650000, avgVisitors: 120, conversionRate: 83.3 },
    general: { avgRevenue: 500000, avgVisitors: 100, conversionRate: 20.0 },
  };

  const base = baseMetrics[templateType] || baseMetrics.general;
  const kpis = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 요일에 따른 변동 (주말 +30%)
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
    
    // 랜덤 변동 (-15% ~ +15%)
    const randomVariation = 0.85 + Math.random() * 0.3;
    
    const visitors = Math.round(base.avgVisitors * weekendMultiplier * randomVariation);
    const transactions = Math.round(visitors * (base.conversionRate / 100));
    const revenue = Math.round(base.avgRevenue * weekendMultiplier * randomVariation);
    const conversionRate = transactions > 0 ? Math.round((transactions / visitors) * 1000) / 10 : 0;
    const avgTransactionValue = transactions > 0 ? Math.round(revenue / transactions) : 0;

    kpis.push({
      date: date.toISOString().split('T')[0],
      total_revenue: revenue,
      total_visitors: visitors,
      total_transactions: transactions,
      conversion_rate: conversionRate,
      avg_transaction_value: avgTransactionValue,
    });
  }

  return kpis;
}
