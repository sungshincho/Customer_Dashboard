import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { toast } from 'sonner';

// ============================================================================
// 타입 정의
// ============================================================================

export interface ZoneDim {
  id: string;
  store_id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string | null;
  floor_level: number;
  area_sqm: number | null;
  capacity: number | null;
  coordinates: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
}

export interface ZoneDailyMetric {
  id: string;
  store_id: string;
  zone_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  avg_dwell_seconds: number;
  total_dwell_seconds: number;
  conversion_count: number;
  revenue_attributed: number;
  heatmap_intensity: number;
  peak_hour: number;
  zones_dim?: ZoneDim;
}

export interface DailyKPI {
  id: string;
  store_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  total_revenue: number;
  total_transactions: number;
  conversion_rate: number;
  sales_per_sqm: number;
  avg_transaction_value: number;
  avg_visit_duration_seconds: number;
}

export interface StoreVisit {
  id: string;
  store_id: string;
  visit_date: string;
  exit_date: string | null;
  duration_minutes: number | null;
  zones_visited: string[];
  zone_durations: Record<string, number>;
  made_purchase: boolean;
  purchase_amount: number | null;
}

export interface DataSource {
  id: string;
  store_id: string;
  name: string;
  type: string;
  status: string;
  last_sync_at: string | null;
  record_count: number;
}

// ============================================================================
// 구역 데이터 훅
// ============================================================================

/**
 * 매장 구역 목록 조회 훅
 */
export function useZones() {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zones', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase
        .from('zones_dim')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('is_active', true)
        .order('zone_name');

      if (error) throw error;
      return (data || []) as ZoneDim[];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 구역 일별 메트릭 조회 훅
 */
export function useZoneDailyMetrics(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zone-daily-metrics', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('zone_daily_metrics')
        .select('*, zones_dim(zone_name, zone_type)')
        .eq('store_id', selectedStore.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as ZoneDailyMetric[];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============================================================================
// KPI 데이터 훅
// ============================================================================

/**
 * 일별 KPI 조회 훅
 */
export function useDailyKPIs(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['daily-kpis', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('store_id', selectedStore.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as DailyKPI[];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 최신 KPI 단일 조회 훅
 */
export function useLatestKPI() {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['latest-kpi', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return null;

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DailyKPI | null;
    },
    enabled: !!selectedStore?.id,
  });
}

// ============================================================================
// 방문 데이터 훅
// ============================================================================

/**
 * 매장 방문 기록 조회 훅
 */
export function useStoreVisits(days: number = 30, limit: number = 100) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['store-visits', selectedStore?.id, days, limit],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('store_visits')
        .select('*')
        .eq('store_id', selectedStore.id)
        .gte('visit_date', startDate.toISOString())
        .order('visit_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as StoreVisit[];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============================================================================
// 리테일 개념 계산 훅
// ============================================================================

/**
 * 리테일 개념 계산 훅
 */
export function useRetailConcepts(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['retail-concepts', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return null;

      const { data, error } = await supabase.rpc('compute_all_retail_concepts', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) {
        console.error('Failed to compute retail concepts:', error);
        return null;
      }

      return data;
    },
    enabled: !!selectedStore?.id,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

/**
 * 구역 전환 퍼널 데이터 조회 훅
 */
export function useZoneConversionFunnel(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zone-conversion-funnel', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_zone_conversion_funnel', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 교차 판매 친화도 데이터 조회 훅
 */
export function useCrossSellAffinity(minSupport: number = 3) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['cross-sell-affinity', selectedStore?.id, minSupport],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_cross_sell_affinity', {
        p_store_id: selectedStore.id,
        p_min_support: minSupport,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============================================================================
// 데이터 소스 훅
// ============================================================================

/**
 * 데이터 소스 목록 조회 훅
 */
export function useDataSources() {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['data-sources', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DataSource[];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 데이터 소스 동기화 훅
 */
export function useSyncDataSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'sync',
          data_source_id: dataSourceId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone-daily-metrics'] });
      toast.success('데이터 동기화가 완료되었습니다');
    },
    onError: (error) => {
      console.error('Failed to sync data source:', error);
      toast.error('데이터 동기화에 실패했습니다');
    },
  });
}

export default {
  useZones,
  useZoneDailyMetrics,
  useDailyKPIs,
  useLatestKPI,
  useStoreVisits,
  useRetailConcepts,
  useZoneConversionFunnel,
  useCrossSellAffinity,
  useDataSources,
  useSyncDataSource,
};
