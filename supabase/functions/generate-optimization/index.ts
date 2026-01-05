import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

// Phase 0.1: 환경 데이터 로딩 시스템
import {
  loadEnvironmentDataBundle,
  type EnvironmentDataBundle,
  type EnvironmentImpact,
} from './data/environmentLoader.ts';

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

    // 4. 🆕 환경 데이터 로드 (Phase 0.1)
    const environmentData = await loadEnvironmentDataBundle(supabase, store_id);
    console.log(`[generate-optimization] Environment: weather=${environmentData.dataQuality.hasWeatherData}, events=${environmentData.events.length}`);

    // 5. 최적화 생성
    let result: AILayoutOptimizationResult;

    if (lovableApiKey) {
      result = await generateAIOptimization(
        lovableApiKey,
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters,
        environmentData  // 🆕 환경 데이터 추가
      );
    } else {
      // AI 키 없을 경우 룰 기반 최적화
      result = generateRuleBasedOptimization(
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters,
        environmentData  // 🆕 환경 데이터 추가
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
      // 🆕 환경 컨텍스트 요약
      environment_summary: {
        weather: environmentData.weather ? {
          condition: environmentData.impact.weather.condition,
          temperature: environmentData.weather.temperature,
          severity: environmentData.impact.weather.severity,
        } : null,
        events: environmentData.events.map(e => ({
          name: e.eventName,
          type: e.eventType,
          impact: e.impactLevel,
        })),
        temporal: {
          dayOfWeek: environmentData.temporal.dayOfWeek,
          isWeekend: environmentData.temporal.isWeekend,
          timeOfDay: environmentData.temporal.timeOfDay,
        },
        impact_multipliers: environmentData.impact.combined,
        data_quality: environmentData.dataQuality,
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
  // 1. 가구 데이터 로드 (furniture 테이블에서 직접)
  const { data: furnitureData } = await supabase
    .from('furniture')
    .select('id, furniture_code, furniture_name, furniture_type, zone_id, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, movable')
    .eq('store_id', storeId)
    .eq('is_active', true);

  // 2. 존 데이터 로드
  const { data: zonesData } = await supabase
    .from('zones_dim')
    .select('id, zone_code, zone_name, zone_type, area_sqm')
    .eq('store_id', storeId);

  // 3. 상품 데이터 로드
  const { data: productDetails } = await supabase
    .from('products')
    .select('id, product_name, sku, category, price, display_type, compatible_display_types')
    .eq('store_id', storeId);

  // 4. 제품 배치 데이터 로드 (product_placements 테이블 - 핵심!)
  const { data: placements } = await supabase
    .from('product_placements')
    .select(`
      id,
      product_id,
      slot_id,
      display_type,
      position_offset,
      is_active,
      furniture_slots:slot_id (
        id,
        slot_id,
        furniture_id,
        slot_position,
        compatible_display_types
      )
    `)
    .eq('store_id', storeId)
    .eq('is_active', true);

  // 5. 가구 데이터를 3D 포맷으로 변환
  const furniture = (furnitureData || []).map((f: any) => ({
    id: f.id,
    furniture_code: f.furniture_code,
    furniture_name: f.furniture_name,
    furniture_type: f.furniture_type,
    zone_id: f.zone_id,
    position: { x: f.position_x || 0, y: f.position_y || 0, z: f.position_z || 0 },
    rotation: { x: f.rotation_x || 0, y: f.rotation_y || 0, z: f.rotation_z || 0 },
    movable: f.movable !== false,
  }));

  // 6. 제품 배치를 3D 포맷으로 변환 (product_placements 기반)
  const products = (placements || []).map((p: any) => {
    const productInfo = (productDetails || []).find((pd: any) => pd.id === p.product_id);
    const slot = p.furniture_slots;
    const furnitureItem = furniture.find((f: any) => f.id === slot?.furniture_id);

    // 월드 좌표 계산: furniture.position + slot.slot_position + placement.position_offset
    const slotPos = slot?.slot_position || { x: 0, y: 0, z: 0 };
    const offsetPos = p.position_offset || { x: 0, y: 0, z: 0 };
    const furniturePos = furnitureItem?.position || { x: 0, y: 0, z: 0 };

    return {
      id: p.product_id,
      placement_id: p.id,
      sku: productInfo?.sku || '',
      product_name: productInfo?.product_name || '',
      category: productInfo?.category || '',
      display_type: p.display_type || productInfo?.display_type,
      zone_id: furnitureItem?.zone_id || '',
      furniture_id: slot?.furniture_id || '',
      slot_id: slot?.id || '',
      slot_code: slot?.slot_id || '',
      position: {
        x: furniturePos.x + (slotPos.x || 0) + (offsetPos.x || 0),
        y: furniturePos.y + (slotPos.y || 0) + (offsetPos.y || 0),
        z: furniturePos.z + (slotPos.z || 0) + (offsetPos.z || 0),
      },
    };
  });

  console.log(`[loadLayoutData] Loaded: ${furniture.length} furniture, ${products.length} product placements`);

  return {
    furniture,
    products,
    zones: zonesData || [],
    productDetails: productDetails || [],
    placements: placements || [],
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
  // furniture_slots와 furniture 조인하여 zone_id 포함
  const { data: slots } = await supabase
    .from('furniture_slots')
    .select(`
      *,
      furniture:furniture_id (
        id,
        zone_id,
        furniture_code,
        position_x,
        position_y,
        position_z
      )
    `)
    .eq('store_id', storeId);

  // zone_id를 슬롯 레벨로 평탄화
  return (slots || []).map((s: any) => ({
    ...s,
    zone_id: s.furniture?.zone_id || '',
    furniture_code: s.furniture?.furniture_code || '',
    furniture_position: {
      x: s.furniture?.position_x || 0,
      y: s.furniture?.position_y || 0,
      z: s.furniture?.position_z || 0,
    },
  }));
}

// ============== AI Optimization ==============

async function generateAIOptimization(
  apiKey: string,
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData?: EnvironmentDataBundle  // 🆕 환경 데이터
): Promise<AILayoutOptimizationResult> {
  const prompt = buildOptimizationPrompt(layoutData, performanceData, slotsData, optimizationType, parameters, environmentData);

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
    return generateRuleBasedOptimization(layoutData, performanceData, slotsData, optimizationType, parameters, environmentData);
  }
}

function buildOptimizationPrompt(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData?: EnvironmentDataBundle  // 🆕 환경 데이터
): string {
  // 🆕 환경 컨텍스트 섹션 생성
  const environmentSection = environmentData ? `
## 🌤️ Environment Context (IMPORTANT - Adjust recommendations accordingly)
${environmentData.impact.summary}

### Impact Multipliers
- Traffic: ${environmentData.impact.combined.traffic}x (${environmentData.impact.combined.traffic > 1 ? '📈 above average' : environmentData.impact.combined.traffic < 0.8 ? '📉 significantly below average' : '➖ average'})
- Dwell Time: ${environmentData.impact.combined.dwell}x (${environmentData.impact.combined.dwell > 1.1 ? '⏱️ customers staying longer' : '➖ normal'})
- Conversion: ${environmentData.impact.combined.conversion}x
- Confidence: ${Math.round(environmentData.impact.confidence * 100)}%

### Active Events
${environmentData.events.length > 0
  ? environmentData.events.map(e => `- ${e.eventName} (${e.eventType}, impact: ${e.impactLevel})`).join('\n')
  : '- No special events today'}

### Weather-Based Recommendations
${environmentData.impact.weather.recommendations.length > 0
  ? environmentData.impact.weather.recommendations.map(r => `- ${r}`).join('\n')
  : '- No weather-specific recommendations'}

### Event-Based Recommendations
${environmentData.impact.event.recommendations.length > 0
  ? environmentData.impact.event.recommendations.map(r => `- ${r}`).join('\n')
  : '- Standard optimization applies'}

` : '';

  return `You are a retail store layout optimization expert.

## CRITICAL CONSTRAINTS
1. ONLY use exact product IDs and SKUs from the provided data
2. ONLY suggest movable=true furniture for relocation
3. ENSURE slot compatibility (display_type must match slot's compatible_display_types)
4. Consider environment context when prioritizing changes
${environmentSection}
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
Generate layout optimization recommendations considering the environment context:
1. Identify underperforming products/furniture
2. Find better positions based on performance data
3. Ensure slot compatibility for products
4. Only move furniture if marked as movable
5. ${environmentData?.impact.combined.traffic && environmentData.impact.combined.traffic < 0.7
  ? 'LOW TRAFFIC EXPECTED: Focus on high-impact changes, prioritize experience products'
  : environmentData?.impact.combined.traffic && environmentData.impact.combined.traffic > 1.3
    ? 'HIGH TRAFFIC EXPECTED: Optimize flow paths, ensure popular items are accessible'
    : 'Apply standard optimization strategies'}

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
  parameters: any,
  environmentData?: EnvironmentDataBundle  // 🆕 환경 데이터
): AILayoutOptimizationResult {
  const furnitureChanges: FurnitureChange[] = [];
  const productChanges: ProductChange[] = [];

  const maxChanges = parameters.max_changes || 30;

  // 🆕 환경 기반 최적화 조정
  const envImpact = environmentData?.impact.combined;
  const isLowTrafficExpected = envImpact && envImpact.traffic < 0.7;
  const isHighTrafficExpected = envImpact && envImpact.traffic > 1.3;
  const isHighDwellExpected = envImpact && envImpact.dwell > 1.15;

  if (environmentData) {
    console.log(`[RuleBasedOpt] Environment: traffic=${envImpact?.traffic}x, dwell=${envImpact?.dwell}x, conversion=${envImpact?.conversion}x`);
  }

  // 상품 최적화
  if (optimizationType === 'product' || optimizationType === 'both') {
    const productPerf = performanceData.productPerformance || [];
    const products = layoutData.products || [];

    console.log(`[RuleBasedOpt] Products: ${products.length}, Performance data: ${productPerf.length}`);

    // 구역별 트래픽 정렬 (고트래픽 구역 우선)
    const zonesByTraffic = Object.entries(performanceData.zoneMetrics || {})
      .sort((a: any, b: any) => (b[1]?.visitors || 0) - (a[1]?.visitors || 0));

    const highTrafficZones = zonesByTraffic.slice(0, 3).map(([zoneId]) => zoneId);
    const lowTrafficZones = zonesByTraffic.slice(-2).map(([zoneId]) => zoneId);

    // 빈 슬롯 찾기
    const availableSlots = slotsData.filter(s => !s.is_occupied);
    console.log(`[RuleBasedOpt] Available slots: ${availableSlots.length}`);

    // 🆕 모든 슬롯이 점유된 경우: 제품 스왑 로직 사용
    if (availableSlots.length === 0 && products.length > 0) {
      console.log(`[RuleBasedOpt] No empty slots - using SWAP logic`);

      // 고트래픽 구역의 제품 (고성과 가능성)
      const highTrafficProducts = products.filter((p: any) =>
        highTrafficZones.includes(p.zone_id)
      );

      // 저트래픽 구역의 제품 (저성과 가능성)
      const lowTrafficProducts = products.filter((p: any) =>
        lowTrafficZones.includes(p.zone_id)
      );

      console.log(`[RuleBasedOpt] High traffic products: ${highTrafficProducts.length}, Low traffic: ${lowTrafficProducts.length}`);

      // 스왑 제안 생성: 저트래픽 구역의 제품을 고트래픽 구역으로
      const swapCount = Math.min(lowTrafficProducts.length, highTrafficProducts.length, maxChanges);

      for (let i = 0; i < swapCount; i++) {
        const lowProduct = lowTrafficProducts[i];
        const highProduct = highTrafficProducts[i];

        // display_type 호환성 확인
        const lowSlot = slotsData.find((s: any) => s.id === lowProduct.slot_id || s.slot_id === lowProduct.slot_code);
        const highSlot = slotsData.find((s: any) => s.id === highProduct.slot_id || s.slot_id === highProduct.slot_code);

        if (!lowSlot || !highSlot) continue;

        // 호환성 체크 (양방향)
        const lowCompatible = !lowProduct.display_type ||
          highSlot.compatible_display_types?.includes(lowProduct.display_type);
        const highCompatible = !highProduct.display_type ||
          lowSlot.compatible_display_types?.includes(highProduct.display_type);

        if (!lowCompatible || !highCompatible) continue;

        // 저트래픽 → 고트래픽 이동 제안 (메인 제안)
        const highSlotWorldPos = {
          x: (highSlot.furniture_position?.x || 0) + (highSlot.slot_position?.x || 0),
          y: (highSlot.furniture_position?.y || 0) + (highSlot.slot_position?.y || 0),
          z: (highSlot.furniture_position?.z || 0) + (highSlot.slot_position?.z || 0),
        };

        productChanges.push({
          product_id: lowProduct.id,
          sku: lowProduct.sku || '',
          current: {
            zone_id: lowProduct.zone_id || '',
            furniture_id: lowProduct.furniture_id || '',
            slot_id: lowProduct.slot_id || lowProduct.slot_code || '',
            position: lowProduct.position || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: highSlot.zone_id || highProduct.zone_id || '',
            furniture_id: highSlot.furniture_id || '',
            slot_id: highSlot.id || '',
            position: highSlotWorldPos,
          },
          reason: `${lowProduct.product_name || lowProduct.sku}을(를) 고트래픽 구역으로 이동 (${highProduct.product_name || highProduct.sku}과(와) 위치 교환)`,
          priority: 'high',
          expected_revenue_impact: 0.15 + Math.random() * 0.1,
          expected_visibility_impact: 0.25 + Math.random() * 0.15,
        });

        // 고트래픽 → 저트래픽 이동 제안 (스왑 파트너)
        const lowSlotWorldPos = {
          x: (lowSlot.furniture_position?.x || 0) + (lowSlot.slot_position?.x || 0),
          y: (lowSlot.furniture_position?.y || 0) + (lowSlot.slot_position?.y || 0),
          z: (lowSlot.furniture_position?.z || 0) + (lowSlot.slot_position?.z || 0),
        };

        productChanges.push({
          product_id: highProduct.id,
          sku: highProduct.sku || '',
          current: {
            zone_id: highProduct.zone_id || '',
            furniture_id: highProduct.furniture_id || '',
            slot_id: highProduct.slot_id || highProduct.slot_code || '',
            position: highProduct.position || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: lowSlot.zone_id || lowProduct.zone_id || '',
            furniture_id: lowSlot.furniture_id || '',
            slot_id: lowSlot.id || '',
            position: lowSlotWorldPos,
          },
          reason: `${highProduct.product_name || highProduct.sku}을(를) 저트래픽 구역으로 이동 (위치 교환)`,
          priority: 'low',
          expected_revenue_impact: -0.05,
          expected_visibility_impact: -0.1,
        });
      }

      console.log(`[RuleBasedOpt] Generated ${productChanges.length} swap suggestions`);
    } else {
      // 기존 로직: 빈 슬롯이 있는 경우
      // 재배치 대상 상품 선정 (성과 데이터 기반 또는 전체 배치된 제품)
      let targetProducts: any[] = [];

      if (productPerf.length > 0) {
        // 성과 데이터 있음: 저성과 상품 우선
        const lowPerformers = productPerf
          .filter((p: any) => p.conversion_rate < 0.08 || p.units_sold < 10)
          .map((p: any) => p.product_id);

        targetProducts = products.filter((p: any) => lowPerformers.includes(p.id));
      }

      // 성과 데이터 없거나 저성과 상품 없으면: 저트래픽 구역 상품 선택
      if (targetProducts.length === 0 && products.length > 0) {
        targetProducts = products.filter((p: any) =>
          lowTrafficZones.includes(p.zone_id) || !p.zone_id
        );
      }

      // 여전히 없으면 전체 상품 중 랜덤 선택
      if (targetProducts.length === 0) {
        targetProducts = products.slice(0, Math.min(maxChanges, products.length));
      }

      console.log(`[RuleBasedOpt] Target products for relocation: ${targetProducts.length}`);

      // 제품 재배치 제안 생성
      targetProducts.slice(0, maxChanges).forEach((product: any) => {
        // 고트래픽 구역에서 호환 가능한 빈 슬롯 찾기
        let targetSlot = availableSlots.find(s =>
          highTrafficZones.includes(s.zone_id) &&
          s.zone_id !== product.zone_id && // 다른 구역으로 이동
          (!product.display_type || s.compatible_display_types?.includes(product.display_type))
        );

        // 고트래픽 구역에 없으면 아무 빈 슬롯
        if (!targetSlot) {
          targetSlot = availableSlots.find(s =>
            s.zone_id !== product.zone_id &&
            (!product.display_type || s.compatible_display_types?.includes(product.display_type))
          );
        }

        if (targetSlot) {
          // 슬롯 위치 계산
          const slotWorldPos = {
            x: (targetSlot.furniture_position?.x || 0) + (targetSlot.slot_position?.x || 0),
            y: (targetSlot.furniture_position?.y || 0) + (targetSlot.slot_position?.y || 0),
            z: (targetSlot.furniture_position?.z || 0) + (targetSlot.slot_position?.z || 0),
          };

          productChanges.push({
            product_id: product.id,
            sku: product.sku || '',
            current: {
              zone_id: product.zone_id || '',
              furniture_id: product.furniture_id || '',
              slot_id: product.slot_id || product.slot_code || '',
              position: product.position || { x: 0, y: 0, z: 0 },
            },
            suggested: {
              zone_id: targetSlot.zone_id || '',
              furniture_id: targetSlot.furniture_id || '',
              slot_id: targetSlot.id || '', // furniture_slots.id (UUID)
              position: slotWorldPos,
            },
            reason: `${product.product_name || product.sku}을(를) ${targetSlot.furniture_code || '고트래픽 구역'}으로 이동하여 노출도 향상`,
            priority: Math.random() > 0.5 ? 'high' : 'medium',
            expected_revenue_impact: 0.1 + Math.random() * 0.15,
            expected_visibility_impact: 0.2 + Math.random() * 0.2,
          });

          // 슬롯을 점유된 것으로 표시 (중복 방지)
          targetSlot.is_occupied = true;
        }
      });
    }
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
  const baseRevenueImprovement = productChanges.reduce((sum, p) => sum + p.expected_revenue_impact, 0) / Math.max(productChanges.length, 1);
  const baseTrafficImprovement = furnitureChanges.reduce((sum, f) => sum + f.expected_impact, 0) / Math.max(furnitureChanges.length, 1);
  const baseConversionImprovement = productChanges.length > 0 ? 0.05 + Math.random() * 0.03 : 0;

  // 🆕 환경 영향도 반영
  const trafficMultiplier = envImpact?.traffic || 1.0;
  const conversionMultiplier = envImpact?.conversion || 1.0;

  const summary = {
    total_furniture_changes: furnitureChanges.length,
    total_product_changes: productChanges.length,
    expected_revenue_improvement: Math.round(baseRevenueImprovement * trafficMultiplier * conversionMultiplier * 100) / 100,
    expected_traffic_improvement: Math.round(baseTrafficImprovement * trafficMultiplier * 100) / 100,
    expected_conversion_improvement: Math.round(baseConversionImprovement * conversionMultiplier * 100) / 100,
    // 🆕 환경 컨텍스트 정보 추가
    environment_context: environmentData ? {
      weather: environmentData.impact.weather.condition,
      events: environmentData.events.map(e => e.eventName),
      multipliers: envImpact,
      confidence: environmentData.impact.confidence,
    } : null,
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
