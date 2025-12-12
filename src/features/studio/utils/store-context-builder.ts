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
  dataQuality: {
    salesDataDays: number;
    visitorDataDays: number;
    hasZoneData: boolean;
    hasFlowData: boolean;
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

    // 방문 기록 (최근 1000건)
    supabase.from('store_visits')
      .select('*')
      .eq('store_id', storeId)
      .gte('visit_start', thirtyDaysAgo.toISOString())
      .order('visit_start', { ascending: false })
      .limit(1000),

    // 구역별 일별 메트릭
    supabase.from('zone_daily_metrics')
      .select('*, zone:zones_dim(*)')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgoStr),
  ]);

  const store = storeResult.data;
  const entities = entitiesResult.data || [];
  const relations = relationsResult.data || [];
  const zones = zonesResult.data || [];
  const dailyKpis = kpisResult.data || [];
  const visits = visitsResult.data || [];
  const zoneMetrics = zoneMetricsResult.data || [];

  // 데이터 품질 점수 계산
  const salesDataDays = dailyKpis.length;
  const visitorDataDays = visits.length > 0 ? Math.min(30, new Set(visits.map(v => v.visit_start?.split('T')[0])).size) : 0;
  const hasZoneData = zones.length > 0;
  const hasFlowData = visits.some(v => v.zone_path && v.zone_path.length > 0);

  const overallScore = Math.min(100, (
    (salesDataDays / 30) * 30 +
    (visitorDataDays / 30) * 30 +
    (hasZoneData ? 20 : 0) +
    (hasFlowData ? 20 : 0)
  ));

  return {
    storeInfo: {
      id: store?.id || storeId,
      name: store?.name || 'Unknown Store',
      width: store?.width || 17.4,
      depth: store?.depth || 16.6,
      businessType: store?.business_type,
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
      x: z.center_x || 0,
      z: z.center_z || 0,
      width: z.width || 3,
      depth: z.depth || 3,
    })),
    dailySales: dailyKpis.map((k: any) => ({
      date: k.date,
      totalRevenue: k.total_revenue || 0,
      transactionCount: k.transaction_count || 0,
      visitorCount: k.visitor_count || 0,
      conversionRate: k.conversion_rate || 0,
    })),
    visits: visits.map((v: any) => ({
      id: v.id,
      visitStart: v.visit_start,
      visitEnd: v.visit_end,
      dwellTimeSeconds: v.dwell_time_seconds,
      purchaseAmount: v.purchase_amount,
      zonePath: v.zone_path,
    })),
    zoneMetrics: zoneMetrics.map((m: any) => ({
      zoneId: m.zone_id,
      zoneName: m.zone?.zone_name || 'Unknown',
      date: m.date,
      visitorCount: m.visitor_count || 0,
      avgDwellTime: m.avg_dwell_time || 0,
      conversionRate: m.conversion_rate || 0,
      revenue: m.revenue || 0,
    })),
    dataQuality: {
      salesDataDays,
      visitorDataDays,
      hasZoneData,
      hasFlowData,
      overallScore,
    },
  };
}

export default buildStoreContext;
