/**
 * store-context-builder.ts
 *
 * 온톨로지 + 데이터소스에서 AI 최적화/시뮬레이션용 Store Context 빌드
 */

import { supabase } from '@/integrations/supabase/client';

export interface StoreContext {
  storeInfo: {
    id: string;
    name: string;
    width: number;
    depth: number;
    businessType?: string;
    entrancePosition?: { x: number; z: number } | null;
  };
  entities: Array<{
    id: string;
    name: string;
    entityType: string;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    metadata?: Record<string, any>;
  }>;
  relations: Array<{
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationTypeName: string;
    weight?: number;
  }>;
  zones: Array<{
    id: string;
    zoneName: string;
    zoneType: string;
    x: number;
    z: number;
    width: number;
    depth: number;
  }>;
  dailySales: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
    visitorCount: number;
    conversionRate: number;
  }>;
  visits: Array<{
    id: string;
    visitStart: string;
    visitEnd?: string;
    dwellTimeSeconds?: number;
    purchaseAmount?: number;
    zonePath?: string[];
  }>;
  zoneMetrics: Array<{
    zoneId: string;
    zoneName: string;
    date: string;
    visitorCount: number;
    avgDwellTime: number;
    conversionRate: number;
    revenue: number;
  }>;
  /** 상품별 매출 성과 데이터 (AI 최적화 핵심 입력) */
  productPerformance: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    zoneId?: string;
    zoneName?: string;
    totalRevenue: number;
    unitsSold: number;
    viewCount: number;
    conversionRate: number;
    avgDwellTime: number;
    revenueRank: number;
  }>;
  /** 상품-가구 배치 관계 */
  productPlacements: Array<{
    productId: string;
    furnitureId: string;
    furnitureName?: string;
    slotId?: string;
    position?: { x: number; y: number; z: number };
  }>;
  dataQuality: {
    salesDataDays: number;
    visitorDataDays: number;
    hasZoneData: boolean;
    hasFlowData: boolean;
    hasProductData: boolean;
    overallScore: number;
  };
}

export async function buildStoreContext(storeId: string): Promise<StoreContext> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // 병렬로 모든 데이터 조회
  const [
    storeResult,
    entitiesResult,
    relationsResult,
    zonesResult,
    kpisResult,
    visitsResult,
    zoneMetricsResult,
    productPerfResult,
    furnitureSlotsResult,
  ] = await Promise.all([
    // 매장 정보
    supabase.from('stores').select('*').eq('id', storeId).single(),

    // 온톨로지 엔티티
    supabase.from('graph_entities')
      .select(`
        *,
        entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(id, name, description)
      `)
      .eq('store_id', storeId),

    // 온톨로지 관계
    supabase.from('graph_relations')
      .select(`
        *,
        source:graph_entities!graph_relations_source_entity_id_fkey(id, name),
        target:graph_entities!graph_relations_target_entity_id_fkey(id, name),
        relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(id, name)
      `)
      .eq('store_id', storeId),

    // 구역 정보
    supabase.from('zones_dim')
      .select('*')
      .eq('store_id', storeId),

    // 일별 KPI
    supabase.from('daily_kpis_agg')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: false }),

    // 방문 기록 (최근 1000건) - store_visits 테이블 사용
    supabase.from('store_visits')
      .select('*')
      .eq('store_id', storeId)
      .gte('visit_date', thirtyDaysAgoStr)
      .order('visit_date', { ascending: false })
      .limit(1000),

    // 구역별 일별 메트릭
    supabase.from('zone_daily_metrics')
      .select('*, zone:zones_dim(*)')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgoStr),

    // 상품 성과 데이터 (AI 최적화 핵심)
    supabase.from('product_performance_agg')
      .select('*, product:products(*), zone:zones_dim(id, zone_name)')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgoStr)
      .order('total_revenue', { ascending: false }),

    // 가구 슬롯 정보 (상품 배치 관계)
    supabase.from('furniture_slots')
      .select('*, furniture:graph_entities(id, name, model_3d_position)')
      .eq('store_id', storeId),
  ]);

  const store = storeResult.data;
  const entities = entitiesResult.data || [];
  const relations = relationsResult.data || [];
  const zones = zonesResult.data || [];
  const dailyKpis = kpisResult.data || [];
  const visits = visitsResult.data || [];
  const zoneMetrics = zoneMetricsResult.data || [];
  const productPerf = productPerfResult.data || [];
  const furnitureSlots = furnitureSlotsResult.data || [];

  // 데이터 품질 점수 계산
  const salesDataDays = dailyKpis.length;
  const visitorDataDays = visits.length > 0 ? Math.min(30, new Set(visits.map((v: any) => v.visit_date?.split('T')[0])).size) : 0;
  const hasZoneData = zones.length > 0;
  const hasFlowData = visits.some((v: any) => v.zones_visited && v.zones_visited.length > 0);
  const hasProductData = productPerf.length > 0;

  const overallScore = Math.min(100, (
    (salesDataDays / 30) * 25 +
    (visitorDataDays / 30) * 25 +
    (hasZoneData ? 15 : 0) +
    (hasFlowData ? 15 : 0) +
    (hasProductData ? 20 : 0)
  ));

  // Calculate store dimensions from zones bounding box (더 정확한 방법)
  let storeWidth: number;
  let storeDepth: number;
  let entrancePosition: { x: number; z: number } | null = null;

  // 매장 면적 정보 먼저 확인 (실제 DB 값 우선)
  const storeArea = store?.floor_area_sqm || store?.area_sqm || null;
  const storeWidthFromDb = store?.width_m || store?.store_width || null;
  const storeDepthFromDb = store?.depth_m || store?.store_depth || null;

  if (zones.length > 0) {
    // zones_dim 데이터에서 바운딩 박스 계산
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    // 입구 후보 목록 (우선순위별로 정렬)
    const entranceCandidates: Array<{ x: number; z: number; priority: number; name: string }> = [];

    zones.forEach((z: any) => {
      const x = z.position_x ?? z.center_x ?? 0;
      const zPos = z.position_z ?? z.center_z ?? 0;
      const halfWidth = (z.size_width ?? z.width ?? 3) / 2;
      const halfDepth = (z.size_depth ?? z.depth ?? 3) / 2;

      minX = Math.min(minX, x - halfWidth);
      maxX = Math.max(maxX, x + halfWidth);
      minZ = Math.min(minZ, zPos - halfDepth);
      maxZ = Math.max(maxZ, zPos + halfDepth);

      // 입구 존 찾기 (확장된 감지 로직)
      const zoneName = (z.zone_name || '').toLowerCase();
      const zoneType = (z.zone_type || '').toLowerCase();

      // 우선순위 1: 명확한 입구 타입
      if (zoneType === 'entrance' || zoneType === 'entry') {
        entranceCandidates.push({ x, z: zPos, priority: 1, name: zoneName });
      }
      // 우선순위 2: 이름에 입구 포함
      else if (zoneName.includes('입구') || zoneName.includes('entrance') || zoneName.includes('entry')) {
        entranceCandidates.push({ x, z: zPos, priority: 2, name: zoneName });
      }
      // 우선순위 3: 문, 출입 관련
      else if (zoneName.includes('door') || zoneName.includes('문') || zoneName.includes('출입')) {
        entranceCandidates.push({ x, z: zPos, priority: 3, name: zoneName });
      }
    });

    // 가장 높은 우선순위의 입구 선택
    if (entranceCandidates.length > 0) {
      entranceCandidates.sort((a, b) => a.priority - b.priority);
      entrancePosition = { x: entranceCandidates[0].x, z: entranceCandidates[0].z };
      console.log('[StoreContext] Entrance found:', entranceCandidates[0].name);
    }

    // 바운딩 박스에서 매장 크기 계산 (여유 공간 포함)
    const calculatedWidth = (maxX - minX) + 2; // 양쪽 1m 여유
    const calculatedDepth = (maxZ - minZ) + 2;

    // DB에 저장된 면적과 비교하여 더 정확한 값 사용
    if (storeArea && storeArea > 0) {
      const calculatedArea = calculatedWidth * calculatedDepth;
      const areaRatio = storeArea / calculatedArea;

      // 면적 차이가 50% 이상이면 DB 면적 기반으로 스케일 조정
      if (areaRatio > 1.5 || areaRatio < 0.67) {
        const scale = Math.sqrt(areaRatio);
        storeWidth = calculatedWidth * scale;
        storeDepth = calculatedDepth * scale;
        console.log('[StoreContext] Adjusted from DB area:', { storeArea, calculatedArea, scale });
      } else {
        storeWidth = calculatedWidth;
        storeDepth = calculatedDepth;
      }
    } else {
      storeWidth = calculatedWidth;
      storeDepth = calculatedDepth;
    }

    // 입구가 없으면 경계 기반으로 추정 (가장 -z 쪽 중앙)
    if (!entrancePosition) {
      entrancePosition = { x: (minX + maxX) / 2, z: minZ - 0.5 };
      console.log('[StoreContext] Entrance estimated at store edge:', entrancePosition);
    }

    console.log('[StoreContext] Calculated from zones:', { storeWidth, storeDepth, zonesCount: zones.length, entrancePosition });
  } else if (storeWidthFromDb && storeDepthFromDb) {
    // zones 데이터가 없지만 DB에 크기 정보가 있는 경우
    storeWidth = storeWidthFromDb;
    storeDepth = storeDepthFromDb;
    // 입구는 하단 중앙으로 가정
    entrancePosition = { x: 0, z: -storeDepth / 2 + 1 };
    console.log('[StoreContext] Using DB dimensions:', { storeWidth, storeDepth });
  } else if (storeArea && storeArea > 0) {
    // zones 데이터가 없으면 면적에서 추정
    // 일반적인 매장은 정사각형보다 직사각형이 많음 (비율 약 1:1.2)
    storeDepth = Math.sqrt(storeArea / 1.2);
    storeWidth = storeDepth * 1.2;
    // 입구는 하단 중앙으로 가정
    entrancePosition = { x: 0, z: -storeDepth / 2 + 1 };
    console.log('[StoreContext] Estimated from area:', { storeArea, storeWidth, storeDepth });
  } else {
    // 기본값 (중소형 매장 기준 약 17x16m)
    storeWidth = 17.4;
    storeDepth = 16.6;
    entrancePosition = { x: 0, z: -8 };
    console.log('[StoreContext] Using default dimensions');
  }

  return {
    storeInfo: {
      id: store?.id || storeId,
      name: store?.store_name || 'Unknown Store',
      width: Math.round(storeWidth * 10) / 10,
      depth: Math.round(storeDepth * 10) / 10,
      businessType: store?.store_type,
      entrancePosition, // 입구 위치 추가
    },
    entities: entities.map((e: any) => ({
      id: e.id,
      name: e.name || e.display_name,
      entityType: e.entity_type?.name || 'unknown',
      position: e.model_3d_position,
      rotation: e.model_3d_rotation,
      scale: e.model_3d_scale,
      metadata: e.properties,
    })),
    relations: relations.map((r: any) => ({
      id: r.id,
      sourceEntityId: r.source_entity_id,
      targetEntityId: r.target_entity_id,
      relationTypeName: r.relation_type?.name || 'related_to',
      weight: r.weight,
    })),
    zones: zones.map((z: any) => ({
      id: z.id,
      zoneName: z.zone_name,
      zoneType: z.zone_type || 'display',
      // 실제 DB 스키마: position_x, position_z, size_width, size_depth
      x: z.position_x ?? z.center_x ?? 0,
      z: z.position_z ?? z.center_z ?? 0,
      width: z.size_width ?? z.width ?? 3,
      depth: z.size_depth ?? z.depth ?? 3,
    })),
    dailySales: dailyKpis.map((k: any) => ({
      date: k.date,
      totalRevenue: k.total_revenue || 0,
      // 실제 DB 스키마: total_transactions, total_visitors
      transactionCount: k.total_transactions ?? k.transaction_count ?? 0,
      visitorCount: k.total_visitors ?? k.visitor_count ?? 0,
      conversionRate: k.conversion_rate || 0,
    })),
    visits: visits.map((v: any) => ({
      id: v.id,
      visitStart: v.visit_date,
      visitEnd: v.exit_date,
      dwellTimeSeconds: (v.duration_minutes || 0) * 60,
      purchaseAmount: v.made_purchase ? 50000 : 0,
      zonePath: v.zones_visited,
    })),
    zoneMetrics: zoneMetrics.map((m: any) => ({
      zoneId: m.zone_id,
      zoneName: m.zone?.zone_name || 'Unknown',
      date: m.date,
      // 실제 DB 스키마: total_visitors, avg_dwell_seconds, conversion_count
      visitorCount: m.total_visitors ?? m.visitor_count ?? 0,
      avgDwellTime: m.avg_dwell_seconds ?? m.avg_dwell_time ?? 0,
      conversionRate: m.conversion_rate ?? (m.conversion_count && m.total_visitors ? m.conversion_count / m.total_visitors : 0),
      revenue: m.revenue ?? 0,
      heatmapIntensity: m.heatmap_intensity ?? 0.5,
    })),
    // 상품별 매출 성과 (중복 제거 후 집계)
    productPerformance: aggregateProductPerformance(productPerf),
    // 현재 상품 배치 정보
    productPlacements: furnitureSlots
      .filter((s: any) => s.occupied_by_product_id)
      .map((s: any) => ({
        productId: s.occupied_by_product_id,
        furnitureId: s.furniture_id,
        furnitureName: s.furniture?.name,
        slotId: s.slot_id,
        position: s.furniture?.model_3d_position,
      })),
    dataQuality: {
      salesDataDays,
      visitorDataDays,
      hasZoneData,
      hasFlowData,
      hasProductData,
      overallScore,
    },
  };
}

/**
 * 상품 성과 데이터 집계 (기간 내 합산 + 랭킹)
 */
function aggregateProductPerformance(rawData: any[]): StoreContext['productPerformance'] {
  if (!rawData || rawData.length === 0) return [];

  // 상품별 집계
  const aggregated = new Map<string, {
    productId: string;
    productName: string;
    sku: string;
    category: string;
    zoneId?: string;
    zoneName?: string;
    totalRevenue: number;
    unitsSold: number;
    viewCount: number;
    conversionSum: number;
    dwellTimeSum: number;
    recordCount: number;
  }>();

  rawData.forEach((row: any) => {
    const productId = row.product_id;
    const existing = aggregated.get(productId);

    if (existing) {
      existing.totalRevenue += row.total_revenue || 0;
      existing.unitsSold += row.units_sold || 0;
      existing.viewCount += row.view_count || 0;
      existing.conversionSum += row.conversion_rate || 0;
      existing.dwellTimeSum += row.avg_dwell_time || 0;
      existing.recordCount += 1;
    } else {
      aggregated.set(productId, {
        productId,
        productName: row.product?.product_name || row.product_name || 'Unknown',
        sku: row.product?.sku || row.sku || '',
        category: row.product?.category || row.category || 'Other',
        zoneId: row.zone_id,
        zoneName: row.zone?.zone_name,
        totalRevenue: row.total_revenue || 0,
        unitsSold: row.units_sold || 0,
        viewCount: row.view_count || 0,
        conversionSum: row.conversion_rate || 0,
        dwellTimeSum: row.avg_dwell_time || 0,
        recordCount: 1,
      });
    }
  });

  // 배열로 변환 후 매출 랭킹 추가
  const products = Array.from(aggregated.values())
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      sku: p.sku,
      category: p.category,
      zoneId: p.zoneId,
      zoneName: p.zoneName,
      totalRevenue: p.totalRevenue,
      unitsSold: p.unitsSold,
      viewCount: p.viewCount,
      conversionRate: p.recordCount > 0 ? p.conversionSum / p.recordCount : 0,
      avgDwellTime: p.recordCount > 0 ? p.dwellTimeSum / p.recordCount : 0,
      revenueRank: 0, // 아래에서 설정
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 랭킹 설정
  products.forEach((p, idx) => {
    p.revenueRank = idx + 1;
  });

  return products;
}

export default buildStoreContext;
