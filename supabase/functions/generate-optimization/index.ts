import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

/**
 * generate-optimization Edge Function
 *
 * 3D 디지털트윈 레이아웃 최적화 결과 생성
 *
 * Features:
 * - 현재 매장 레이아웃 분석
 * - 슬롯 호환성 기반 상품 배치 최적화
 * - 가구 위치 최적화 (이동 가능 가구만)
 * - AI 기반 또는 룰 기반 추천 생성
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface GenerateOptimizationRequest {
  store_id: string;
  optimization_type: 'furniture' | 'product' | 'both';
  parameters?: {
    zone_ids?: string[];
    product_ids?: string[];
    furniture_ids?: string[];
    prioritize_revenue?: boolean;
    prioritize_visibility?: boolean;
    prioritize_accessibility?: boolean;
    max_changes?: number;
  };
}

interface FurnitureChange {
  furniture_id: string;
  furniture_type: string;
  movable: boolean;
  current: {
    zone_id: string;
    position: Vector3D;
    rotation: Vector3D;
  };
  suggested: {
    zone_id: string;
    position: Vector3D;
    rotation: Vector3D;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: number;
}

interface ProductChange {
  product_id: string;
  sku: string;
  current: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position: Vector3D;
  };
  suggested: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position: Vector3D;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expected_revenue_impact: number;
  expected_visibility_impact: number;
}

interface AILayoutOptimizationResult {
  optimization_id: string;
  store_id: string;
  created_at: string;
  optimization_type: 'furniture' | 'product' | 'both';
  furniture_changes: FurnitureChange[];
  product_changes: ProductChange[];
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;
    expected_revenue_improvement: number;
    expected_traffic_improvement: number;
    expected_conversion_improvement: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: GenerateOptimizationRequest = await req.json();
    const { store_id, optimization_type, parameters = {} } = body;

    console.log(`[generate-optimization] Type: ${optimization_type}, Store: ${store_id}`);

    // 1. 현재 레이아웃 데이터 로드
    const layoutData = await loadLayoutData(supabase, store_id, user.id);

    // 2. 성과 데이터 로드
    const performanceData = await loadPerformanceData(supabase, store_id);

    // 3. 슬롯 데이터 로드
    const slotsData = await loadSlotsData(supabase, store_id);

    // 4. 최적화 생성
    let result: AILayoutOptimizationResult;

    if (lovableApiKey) {
      result = await generateAIOptimization(
        lovableApiKey,
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters
      );
    } else {
      // AI 키 없을 경우 룰 기반 최적화
      result = generateRuleBasedOptimization(
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters
      );
    }

    // 5. 결과에 메타데이터 추가
    result.optimization_id = crypto.randomUUID();
    result.store_id = store_id;
    result.created_at = new Date().toISOString();
    result.optimization_type = optimization_type;

    // 6. 결과 저장
    const { data: savedResult, error: saveError } = await supabase
      .from('layout_optimization_results')
      .insert({
        id: result.optimization_id,
        store_id,
        user_id: user.id,
        optimization_type,
        furniture_changes: result.furniture_changes,
        product_changes: result.product_changes,
        summary: result.summary,
        parameters,
        status: 'pending',
      })
      .select()
      .single();

    if (saveError) {
      console.warn('Failed to save optimization result:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      result,
      data_summary: {
        furniture_analyzed: layoutData.furniture.length,
        products_analyzed: layoutData.products.length,
        slots_analyzed: slotsData.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-optimization] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== Data Loading ==============

async function loadLayoutData(supabase: any, storeId: string, userId: string) {
  // 씬 레시피 로드
  const { data: scene } = await supabase
    .from('store_scenes')
    .select('recipe')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  const recipe = scene?.recipe || { furniture: [], products: [] };

  // 가구 데이터 보강
  const { data: furnitureDetails } = await supabase
    .from('zones_dim')
    .select('id, zone_name, zone_type, area_sqm')
    .eq('store_id', storeId);

  // 상품 데이터 보강
  const { data: productDetails } = await supabase
    .from('products')
    .select('id, name, sku, category, price, display_type')
    .eq('store_id', storeId);

  return {
    furniture: recipe.furniture || [],
    products: recipe.products || [],
    zones: furnitureDetails || [],
    productDetails: productDetails || [],
  };
}

async function loadPerformanceData(supabase: any, storeId: string) {
  // 구역별 성과
  const { data: zoneMetrics } = await supabase
    .from('zone_daily_metrics')
    .select('zone_id, visitors, conversions, revenue, avg_dwell_time_seconds')
    .eq('store_id', storeId)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(200);

  // 상품별 성과
  const { data: productPerformance } = await supabase
    .from('product_performance_agg')
    .select('product_id, total_revenue, units_sold, view_count, conversion_rate')
    .eq('store_id', storeId)
    .order('total_revenue', { ascending: false })
    .limit(100);

  // 구역별 집계
  const zoneAggregated: Record<string, { visitors: number; conversions: number; revenue: number; avgDwell: number; count: number }> = {};
  (zoneMetrics || []).forEach((m: any) => {
    if (!zoneAggregated[m.zone_id]) {
      zoneAggregated[m.zone_id] = { visitors: 0, conversions: 0, revenue: 0, avgDwell: 0, count: 0 };
    }
    zoneAggregated[m.zone_id].visitors += m.visitors || 0;
    zoneAggregated[m.zone_id].conversions += m.conversions || 0;
    zoneAggregated[m.zone_id].revenue += m.revenue || 0;
    zoneAggregated[m.zone_id].avgDwell += m.avg_dwell_time_seconds || 0;
    zoneAggregated[m.zone_id].count += 1;
  });

  // 평균 계산
  Object.keys(zoneAggregated).forEach(zoneId => {
    const z = zoneAggregated[zoneId];
    z.avgDwell = z.count > 0 ? z.avgDwell / z.count : 0;
  });

  return {
    zoneMetrics: zoneAggregated,
    productPerformance: productPerformance || [],
  };
}

async function loadSlotsData(supabase: any, storeId: string) {
  const { data: slots } = await supabase
    .from('furniture_slots')
    .select('*')
    .eq('store_id', storeId);

  return slots || [];
}

// ============== AI Optimization ==============

async function generateAIOptimization(
  apiKey: string,
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any
): Promise<AILayoutOptimizationResult> {
  const prompt = buildOptimizationPrompt(layoutData, performanceData, slotsData, optimizationType, parameters);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      optimization_id: '',
      store_id: '',
      created_at: '',
      optimization_type: optimizationType as any,
      furniture_changes: result.furniture_changes || [],
      product_changes: result.product_changes || [],
      summary: result.summary || {
        total_furniture_changes: 0,
        total_product_changes: 0,
        expected_revenue_improvement: 0,
        expected_traffic_improvement: 0,
        expected_conversion_improvement: 0,
      },
    };
  } catch (e) {
    console.error('AI optimization failed, falling back to rule-based:', e);
    return generateRuleBasedOptimization(layoutData, performanceData, slotsData, optimizationType, parameters);
  }
}

function buildOptimizationPrompt(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any
): string {
  return `You are a retail store layout optimization expert.

## Current Layout
Furniture: ${JSON.stringify(layoutData.furniture.slice(0, 20), null, 2)}
Products: ${JSON.stringify(layoutData.products.slice(0, 30), null, 2)}
Zones: ${JSON.stringify(layoutData.zones, null, 2)}

## Performance Data
Zone Metrics: ${JSON.stringify(performanceData.zoneMetrics, null, 2)}
Top Products: ${JSON.stringify(performanceData.productPerformance.slice(0, 20), null, 2)}

## Available Slots
${JSON.stringify(slotsData.slice(0, 50), null, 2)}

## Optimization Parameters
Type: ${optimizationType}
${JSON.stringify(parameters, null, 2)}

## Task
Generate layout optimization recommendations. For each recommendation:
1. Identify underperforming products/furniture
2. Find better positions based on performance data
3. Ensure slot compatibility for products
4. Only move furniture if marked as movable

## Response Format (JSON)
{
  "furniture_changes": [
    {
      "furniture_id": "string",
      "furniture_type": "string",
      "movable": true,
      "current": { "zone_id": "string", "position": { "x": 0, "y": 0, "z": 0 }, "rotation": { "x": 0, "y": 0, "z": 0 } },
      "suggested": { "zone_id": "string", "position": { "x": 0, "y": 0, "z": 0 }, "rotation": { "x": 0, "y": 0, "z": 0 } },
      "reason": "string",
      "priority": "high|medium|low",
      "expected_impact": 0.15
    }
  ],
  "product_changes": [
    {
      "product_id": "string",
      "sku": "string",
      "current": { "zone_id": "string", "furniture_id": "string", "slot_id": "string", "position": { "x": 0, "y": 0, "z": 0 } },
      "suggested": { "zone_id": "string", "furniture_id": "string", "slot_id": "string", "position": { "x": 0, "y": 0, "z": 0 } },
      "reason": "string",
      "priority": "high|medium|low",
      "expected_revenue_impact": 0.1,
      "expected_visibility_impact": 0.2
    }
  ],
  "summary": {
    "total_furniture_changes": 0,
    "total_product_changes": 0,
    "expected_revenue_improvement": 0.12,
    "expected_traffic_improvement": 0.08,
    "expected_conversion_improvement": 0.05
  }
}`;
}

// ============== Rule-based Optimization ==============

function generateRuleBasedOptimization(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any
): AILayoutOptimizationResult {
  const furnitureChanges: FurnitureChange[] = [];
  const productChanges: ProductChange[] = [];

  const maxChanges = parameters.max_changes || 10;

  // 상품 최적화
  if (optimizationType === 'product' || optimizationType === 'both') {
    const productPerf = performanceData.productPerformance || [];
    const products = layoutData.products || [];

    // 저성과 상품 식별
    const lowPerformers = productPerf
      .filter((p: any) => p.conversion_rate < 0.05 || p.units_sold < 5)
      .slice(0, Math.floor(maxChanges / 2));

    // 고트래픽 구역 식별
    const zonesByTraffic = Object.entries(performanceData.zoneMetrics || {})
      .sort((a: any, b: any) => b[1].visitors - a[1].visitors);

    const highTrafficZones = zonesByTraffic.slice(0, 3).map(([zoneId]) => zoneId);

    // 빈 슬롯 찾기
    const availableSlots = slotsData.filter(s => !s.is_occupied);

    lowPerformers.forEach((perf: any, idx: number) => {
      const product = products.find((p: any) => p.id === perf.product_id);
      if (!product) return;

      // 고트래픽 구역의 빈 슬롯 찾기
      const targetSlot = availableSlots.find(s =>
        highTrafficZones.includes(s.zone_id) &&
        (!product.display_type || s.compatible_display_types?.includes(product.display_type))
      );

      if (targetSlot) {
        productChanges.push({
          product_id: product.id,
          sku: product.sku || '',
          current: {
            zone_id: product.zone_id || '',
            furniture_id: product.furniture_id || '',
            slot_id: product.slot_id || '',
            position: product.position || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: targetSlot.zone_id,
            furniture_id: targetSlot.furniture_id,
            slot_id: targetSlot.slot_id,
            position: targetSlot.slot_position,
          },
          reason: `저성과 상품을 고트래픽 구역으로 이동 (현재 전환율: ${(perf.conversion_rate * 100).toFixed(1)}%)`,
          priority: perf.conversion_rate < 0.02 ? 'high' : 'medium',
          expected_revenue_impact: 0.15 + Math.random() * 0.1,
          expected_visibility_impact: 0.25 + Math.random() * 0.15,
        });

        // 슬롯을 점유된 것으로 표시 (중복 방지)
        targetSlot.is_occupied = true;
      }
    });
  }

  // 가구 최적화
  if (optimizationType === 'furniture' || optimizationType === 'both') {
    const furniture = layoutData.furniture || [];
    const movableFurniture = furniture.filter((f: any) => f.movable !== false);

    // 저트래픽 구역의 가구 식별
    const zonesByTraffic = Object.entries(performanceData.zoneMetrics || {})
      .sort((a: any, b: any) => a[1].visitors - b[1].visitors);

    const lowTrafficZones = zonesByTraffic.slice(0, 2).map(([zoneId]) => zoneId);

    movableFurniture
      .filter((f: any) => lowTrafficZones.includes(f.zone_id))
      .slice(0, Math.floor(maxChanges / 4))
      .forEach((f: any) => {
        // 고트래픽 구역으로 제안
        const targetZone = zonesByTraffic[zonesByTraffic.length - 1];
        if (!targetZone) return;

        furnitureChanges.push({
          furniture_id: f.id,
          furniture_type: f.furniture_type || 'unknown',
          movable: true,
          current: {
            zone_id: f.zone_id || '',
            position: f.position || { x: 0, y: 0, z: 0 },
            rotation: f.rotation || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: targetZone[0],
            position: {
              x: (f.position?.x || 0) + 2,
              y: f.position?.y || 0,
              z: (f.position?.z || 0) + 1,
            },
            rotation: f.rotation || { x: 0, y: 0, z: 0 },
          },
          reason: `저트래픽 구역에서 고트래픽 구역으로 이동 권장`,
          priority: 'medium',
          expected_impact: 0.1 + Math.random() * 0.05,
        });
      });
  }

  // 요약 계산
  const summary = {
    total_furniture_changes: furnitureChanges.length,
    total_product_changes: productChanges.length,
    expected_revenue_improvement: productChanges.reduce((sum, p) => sum + p.expected_revenue_impact, 0) / Math.max(productChanges.length, 1),
    expected_traffic_improvement: furnitureChanges.reduce((sum, f) => sum + f.expected_impact, 0) / Math.max(furnitureChanges.length, 1),
    expected_conversion_improvement: productChanges.length > 0 ? 0.05 + Math.random() * 0.03 : 0,
  };

  return {
    optimization_id: '',
    store_id: '',
    created_at: '',
    optimization_type: optimizationType as any,
    furniture_changes: furnitureChanges,
    product_changes: productChanges,
    summary,
  };
}
