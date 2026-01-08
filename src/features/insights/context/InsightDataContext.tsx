/**
 * InsightDataContext.tsx
 *
 * 데이터소스 통합 Provider
 * - 기본 KPI: daily_kpis_agg 단일 소스 (항상 로드)
 * - 퍼널 데이터: funnel_events 단일 소스 (항상 로드)
 * - 탭별 상세 데이터: Lazy Loading
 * - 캐싱: staleTime 5분
 *
 * 문제 해결:
 * - 동일 지표의 다중 소스 조회로 인한 불일치 해소
 * - 중복 쿼리 제거로 성능 개선
 * - 데이터 일관성 보장
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// 타입 정의
// ============================================================================

export type InsightTabType = 'overview' | 'store' | 'customer' | 'product' | 'prediction' | 'ai';

// 기본 KPI (daily_kpis_agg 단일 소스)
export interface BaseKPIs {
  totalVisitors: number;
  uniqueVisitors: number;
  returningVisitors: number;
  totalRevenue: number;
  totalTransactions: number;
  conversionRate: number;
  avgTransactionValue: number;
  // 전 기간 대비 변화율
  changes: {
    visitors: number;
    revenue: number;
    transactions: number;
    conversionRate: number;
  };
  periodDays: number;
}

// 퍼널 데이터 (funnel_events 단일 소스)
export interface FunnelData {
  entry: number;
  browse: number;
  engage: number;
  fitting: number;
  purchase: number;
  // 시간대별 entry 데이터
  hourlyEntry: { hour: number; count: number }[];
}

// 존 메트릭 (Store 탭)
export interface ZoneMetrics {
  zones: Array<{
    id: string;
    name: string;
    type: string;
    visitors: number;
    avgDwell: number;
    revenue: number;
  }>;
  transitions: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

// 고객 세그먼트 (Customer 탭)
export interface CustomerSegments {
  segments: Array<{
    name: string;
    count: number;
    revenue: number;
    avgLTV: number;
    churnRisk: number;
  }>;
  totalCustomers: number;
  repeatRate: number;
}

// 상품 성과 (Product 탭)
export interface ProductPerformance {
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    revenue: number;
    unitsSold: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    unitsSold: number;
    percentage: number;
  }>;
  totalUnits: number;
  avgPrice: number;
}

// Context 타입
interface InsightDataContextType {
  // 현재 활성 탭
  activeTab: InsightTabType;
  setActiveTab: (tab: InsightTabType) => void;

  // 기본 KPI (항상 로드)
  baseKPIs: UseQueryResult<BaseKPIs | null>;

  // 퍼널 데이터 (항상 로드)
  funnelData: UseQueryResult<FunnelData | null>;

  // 탭별 Lazy Loading 데이터
  zoneMetrics: UseQueryResult<ZoneMetrics | null>;
  customerSegments: UseQueryResult<CustomerSegments | null>;
  productPerformance: UseQueryResult<ProductPerformance | null>;

  // 데이터 새로고침
  refreshAll: () => void;
}

// ============================================================================
// Context 생성
// ============================================================================

const InsightDataContext = createContext<InsightDataContextType | null>(null);

// ============================================================================
// 캐싱 설정
// ============================================================================

const STALE_TIME = 5 * 60 * 1000; // 5분
const CACHE_TIME = 10 * 60 * 1000; // 10분

// ============================================================================
// Provider 구현
// ============================================================================

interface InsightDataProviderProps {
  children: ReactNode;
  initialTab?: InsightTabType;
}

export function InsightDataProvider({ children, initialTab = 'overview' }: InsightDataProviderProps) {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { orgId } = useAuth();

  const [activeTab, setActiveTab] = useState<InsightTabType>(initialTab);

  const storeId = selectedStore?.id;
  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;

  // ========================================================================
  // 1. 기본 KPI - daily_kpis_agg 단일 소스 (항상 로드)
  // ========================================================================
  const baseKPIs = useQuery({
    queryKey: ['insight-base-kpis', storeId, startDate, endDate, orgId],
    queryFn: async (): Promise<BaseKPIs | null> => {
      if (!storeId || !orgId) return null;

      // 현재 기간 데이터
      const { data: currentData, error: currentError } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, unique_visitors, returning_visitors, total_revenue, total_transactions, conversion_rate, avg_transaction_value')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (currentError) {
        console.error('[InsightDataProvider] Base KPIs error:', currentError);
        return null;
      }

      // 집계
      const totalVisitors = currentData?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const uniqueVisitors = currentData?.reduce((sum, k) => sum + (k.unique_visitors || 0), 0) || 0;
      const returningVisitors = currentData?.reduce((sum, k) => sum + (k.returning_visitors || 0), 0) || 0;
      const totalRevenue = currentData?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
      const totalTransactions = currentData?.reduce((sum, k) => sum + (k.total_transactions || 0), 0) || 0;

      // 전환율과 객단가는 마지막 날 기준 또는 평균
      const avgConversionRate = currentData?.length
        ? currentData.reduce((sum, k) => sum + (k.conversion_rate || 0), 0) / currentData.length
        : 0;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // 기간 일수 계산
      const periodDays = Math.max(1, Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1);

      // 전 기간 데이터 (변화율 계산용)
      const prevEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
      const prevStartDate = new Date(prevEndDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

      const { data: prevData } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, total_revenue, total_transactions, conversion_rate')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]);

      const prevVisitors = prevData?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const prevRevenue = prevData?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
      const prevTransactions = prevData?.reduce((sum, k) => sum + (k.total_transactions || 0), 0) || 0;
      const prevConversionRate = prevData?.length
        ? prevData.reduce((sum, k) => sum + (k.conversion_rate || 0), 0) / prevData.length
        : 0;

      return {
        totalVisitors,
        uniqueVisitors,
        returningVisitors,
        totalRevenue,
        totalTransactions,
        conversionRate: avgConversionRate,
        avgTransactionValue,
        changes: {
          visitors: prevVisitors > 0 ? ((totalVisitors - prevVisitors) / prevVisitors) * 100 : 0,
          revenue: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
          transactions: prevTransactions > 0 ? ((totalTransactions - prevTransactions) / prevTransactions) * 100 : 0,
          conversionRate: avgConversionRate - prevConversionRate,
        },
        periodDays,
      };
    },
    enabled: !!storeId && !!orgId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
  });

  // ========================================================================
  // 2. 퍼널 데이터 - funnel_events 서버사이드 COUNT (항상 로드)
  // ========================================================================
  const funnelData = useQuery({
    queryKey: ['insight-funnel', storeId, startDate, endDate, orgId],
    queryFn: async (): Promise<FunnelData | null> => {
      if (!storeId || !orgId) return null;

      // 🔧 FIX: 서버사이드 COUNT 사용 - 클라이언트 집계 대신 DB에서 직접 카운트
      // 이렇게 하면 RLS 통과 후에도 정확한 COUNT를 반환받을 수 있음
      const eventTypes = ['entry', 'browse', 'engage', 'fitting', 'purchase'] as const;

      try {
        // 병렬로 각 event_type별 COUNT 쿼리 실행
        const countResults = await Promise.all(
          eventTypes.map(async (type) => {
            const { count, error } = await supabase
              .from('funnel_events')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId)
              .eq('store_id', storeId)
              .eq('event_type', type)
              .gte('event_date', startDate)
              .lte('event_date', endDate);

            if (error) {
              console.error(`[InsightDataProvider] Funnel count error for ${type}:`, error);
              return 0;
            }
            return count || 0;
          })
        );

        const counts = {
          entry: countResults[0],
          browse: countResults[1],
          engage: countResults[2],
          fitting: countResults[3],
          purchase: countResults[4],
        };

        // 시간대별 entry 데이터 (별도 쿼리 - 최대 24개 행만 필요)
        const { data: hourlyData, error: hourlyError } = await supabase
          .rpc('get_hourly_entry_counts', {
            p_org_id: orgId,
            p_store_id: storeId,
            p_start_date: startDate,
            p_end_date: endDate,
          });

        let hourlyEntry: { hour: number; count: number }[] = [];

        if (hourlyError || !hourlyData) {
          // RPC 함수가 없으면 기본값 사용 (hourly 데이터는 선택적)
          console.warn('[InsightDataProvider] Hourly data RPC not available, using empty array');
          hourlyEntry = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
        } else {
          // RPC 결과를 배열로 변환
          const hourlyMap = new Map(hourlyData.map((h: { hour: number; count: number }) => [h.hour, h.count]));
          hourlyEntry = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: hourlyMap.get(hour) || 0,
          }));
        }

        console.log('[InsightDataProvider] Funnel counts (server-side):', counts);

        return {
          ...counts,
          hourlyEntry,
        };
      } catch (error) {
        console.error('[InsightDataProvider] Funnel data error:', error);
        return null;
      }
    },
    enabled: !!storeId && !!orgId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
  });

  // ========================================================================
  // 3. 존 메트릭 - Store 탭 진입 시 Lazy Loading
  // ========================================================================
  const zoneMetrics = useQuery({
    queryKey: ['insight-zones', storeId, startDate, endDate, orgId],
    queryFn: async (): Promise<ZoneMetrics | null> => {
      if (!storeId || !orgId) return null;

      // zone_daily_metrics + zones_dim 조인
      // 🔧 FIX: limit(10000) 추가 - Supabase 기본 1000행 제한 해결
      const { data: metricsData, error: metricsError } = await supabase
        .from('zone_daily_metrics')
        .select('zone_id, total_visitors, avg_dwell_seconds, revenue_attributed')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(10000);

      if (metricsError) {
        console.error('[InsightDataProvider] Zone metrics error:', metricsError);
        return null;
      }

      const { data: zonesData } = await supabase
        .from('zones_dim')
        .select('id, zone_name, zone_type')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('is_active', true);

      // 존별 집계
      const zoneMap = new Map<string, { visitors: number; dwellSum: number; dwellCount: number; revenue: number }>();

      metricsData?.forEach(m => {
        const current = zoneMap.get(m.zone_id) || { visitors: 0, dwellSum: 0, dwellCount: 0, revenue: 0 };
        zoneMap.set(m.zone_id, {
          visitors: current.visitors + (m.total_visitors || 0),
          dwellSum: current.dwellSum + (m.avg_dwell_seconds || 0),
          dwellCount: current.dwellCount + 1,
          revenue: current.revenue + Number(m.revenue_attributed || 0),
        });
      });

      const zonesNameMap = new Map(zonesData?.map(z => [z.id, { name: z.zone_name, type: z.zone_type }]) || []);

      const zones = Array.from(zoneMap.entries()).map(([id, data]) => ({
        id,
        name: zonesNameMap.get(id)?.name || id,
        type: zonesNameMap.get(id)?.type || 'unknown',
        visitors: data.visitors,
        avgDwell: data.dwellCount > 0 ? data.dwellSum / data.dwellCount : 0,
        revenue: data.revenue,
      })).sort((a, b) => b.visitors - a.visitors);

      // 존 이동 경로
      // 🔧 FIX: limit(10000) 추가
      const { data: transitionsData } = await supabase
        .from('zone_transitions')
        .select('from_zone_id, to_zone_id, transition_count')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('transition_date', startDate)
        .lte('transition_date', endDate)
        .limit(10000);

      const transitionMap = new Map<string, number>();
      transitionsData?.forEach(t => {
        const key = `${t.from_zone_id}->${t.to_zone_id}`;
        transitionMap.set(key, (transitionMap.get(key) || 0) + (t.transition_count || 0));
      });

      const transitions = Array.from(transitionMap.entries())
        .map(([key, count]) => {
          const [from, to] = key.split('->');
          return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return { zones, transitions };
    },
    enabled: !!storeId && !!orgId && activeTab === 'store',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
  });

  // ========================================================================
  // 4. 고객 세그먼트 - Customer 탭 진입 시 Lazy Loading
  // ========================================================================
  const customerSegments = useQuery({
    queryKey: ['insight-customers', storeId, startDate, endDate, orgId],
    queryFn: async (): Promise<CustomerSegments | null> => {
      if (!storeId || !orgId) return null;

      // customer_segments_agg에서 최신 날짜 기준
      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('segment_name, customer_count, total_revenue, ltv_estimate, churn_risk_score')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', endDate); // 최신 날짜 기준

      if (error) {
        console.error('[InsightDataProvider] Customer segments error:', error);
        return null;
      }

      const segments = (data || []).map(s => ({
        name: s.segment_name,
        count: s.customer_count || 0,
        revenue: Number(s.total_revenue || 0),
        avgLTV: Number(s.ltv_estimate || 0),
        churnRisk: Number(s.churn_risk_score || 0),
      }));

      const totalCustomers = segments.reduce((sum, s) => sum + s.count, 0);

      // 재방문율: daily_kpis_agg에서 계산
      const repeatRate = baseKPIs.data
        ? (baseKPIs.data.returningVisitors / Math.max(baseKPIs.data.uniqueVisitors, 1)) * 100
        : 0;

      return { segments, totalCustomers, repeatRate };
    },
    enabled: !!storeId && !!orgId && activeTab === 'customer',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
  });

  // ========================================================================
  // 5. 상품 성과 - Product 탭 진입 시 Lazy Loading
  // ========================================================================
  const productPerformance = useQuery({
    queryKey: ['insight-products', storeId, startDate, endDate, orgId],
    queryFn: async (): Promise<ProductPerformance | null> => {
      if (!storeId || !orgId) return null;

      // product_performance_agg + products 조인
      // limit(10000) 설정으로 Supabase 기본 1000 제한 해결
      const { data: perfData, error: perfError } = await supabase
        .from('product_performance_agg')
        .select('product_id, revenue, units_sold')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(10000);

      if (perfError) {
        console.error('[InsightDataProvider] Product performance error:', perfError);
        return null;
      }

      // 상품별 집계
      const productMap = new Map<string, { revenue: number; unitsSold: number }>();
      let totalUnits = 0;
      let totalRevenue = 0;

      perfData?.forEach(p => {
        const current = productMap.get(p.product_id) || { revenue: 0, unitsSold: 0 };
        const revenue = Number(p.revenue || 0);
        const units = p.units_sold || 0;

        productMap.set(p.product_id, {
          revenue: current.revenue + revenue,
          unitsSold: current.unitsSold + units,
        });

        totalUnits += units;
        totalRevenue += revenue;
      });

      // 상품 정보 조회
      const productIds = Array.from(productMap.keys());
      const { data: productsData } = await supabase
        .from('products')
        .select('id, product_name, category')
        .in('id', productIds.length > 0 ? productIds : ['']);

      const productsInfo = new Map(productsData?.map(p => [p.id, { name: p.product_name, category: p.category }]) || []);

      // TOP 10 상품
      const topProducts = Array.from(productMap.entries())
        .map(([id, data]) => ({
          id,
          name: productsInfo.get(id)?.name || id,
          category: productsInfo.get(id)?.category || 'Unknown',
          revenue: data.revenue,
          unitsSold: data.unitsSold,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // 카테고리별 집계
      const categoryMap = new Map<string, { revenue: number; unitsSold: number }>();

      Array.from(productMap.entries()).forEach(([id, data]) => {
        const category = productsInfo.get(id)?.category || 'Unknown';
        const current = categoryMap.get(category) || { revenue: 0, unitsSold: 0 };
        categoryMap.set(category, {
          revenue: current.revenue + data.revenue,
          unitsSold: current.unitsSold + data.unitsSold,
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          revenue: data.revenue,
          unitsSold: data.unitsSold,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const avgPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

      return { topProducts, categoryBreakdown, totalUnits, avgPrice };
    },
    enabled: !!storeId && !!orgId && activeTab === 'product',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
  });

  // ========================================================================
  // 데이터 새로고침
  // ========================================================================
  const refreshAll = useCallback(() => {
    baseKPIs.refetch();
    funnelData.refetch();
    if (activeTab === 'store') zoneMetrics.refetch();
    if (activeTab === 'customer') customerSegments.refetch();
    if (activeTab === 'product') productPerformance.refetch();
  }, [activeTab, baseKPIs, funnelData, zoneMetrics, customerSegments, productPerformance]);

  // ========================================================================
  // Context Value
  // ========================================================================
  const value = useMemo<InsightDataContextType>(() => ({
    activeTab,
    setActiveTab,
    baseKPIs,
    funnelData,
    zoneMetrics,
    customerSegments,
    productPerformance,
    refreshAll,
  }), [activeTab, baseKPIs, funnelData, zoneMetrics, customerSegments, productPerformance, refreshAll]);

  return (
    <InsightDataContext.Provider value={value}>
      {children}
    </InsightDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useInsightData() {
  const context = useContext(InsightDataContext);
  if (!context) {
    throw new Error('useInsightData must be used within InsightDataProvider');
  }
  return context;
}

// 개별 데이터 접근용 훅
export function useBaseKPIs() {
  const { baseKPIs } = useInsightData();
  return baseKPIs;
}

export function useFunnelData() {
  const { funnelData } = useInsightData();
  return funnelData;
}

export function useZoneMetricsData() {
  const { zoneMetrics, setActiveTab } = useInsightData();
  // Store 탭으로 전환되면 자동으로 데이터 로드
  return { ...zoneMetrics, enableLoading: () => setActiveTab('store') };
}

export function useCustomerSegmentsData() {
  const { customerSegments, setActiveTab } = useInsightData();
  return { ...customerSegments, enableLoading: () => setActiveTab('customer') };
}

export function useProductPerformanceData() {
  const { productPerformance, setActiveTab } = useInsightData();
  return { ...productPerformance, enableLoading: () => setActiveTab('product') };
}

// ============================================================================
// 기존 useInsightMetrics 호환 훅
// ============================================================================

/**
 * 기존 useInsightMetrics와 호환되는 통합 메트릭 훅
 * baseKPIs + funnelData를 결합하여 기존 인터페이스 제공
 */
export interface IntegratedMetrics {
  // 트래픽 지표
  footfall: number;
  uniqueVisitors: number;
  visitFrequency: number;
  repeatRate: number;

  // 전환 지표
  conversionRate: number;
  transactions: number;
  atv: number;
  revenue: number;

  // 행동 지표 (기본값 제공)
  avgDwellTime: number;
  trackedVisitors: number;
  trackingCoverage: number;

  // 퍼널 데이터
  funnel: {
    entry: number;
    browse: number;
    engage: number;
    fitting: number;
    purchase: number;
  };

  // 변화율
  changes: {
    footfall: number;
    uniqueVisitors: number;
    revenue: number;
    conversionRate: number;
  };

  // 메타 정보
  periodDays: number;
  dataAvailable: boolean;
}

export function useIntegratedMetrics(): {
  data: IntegratedMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { baseKPIs, funnelData } = useInsightData();

  const data = useMemo((): IntegratedMetrics | undefined => {
    if (!baseKPIs.data || !funnelData.data) return undefined;

    const kpi = baseKPIs.data;
    const funnel = funnelData.data;

    // 방문 빈도: total / unique
    const visitFrequency = kpi.uniqueVisitors > 0
      ? kpi.totalVisitors / kpi.uniqueVisitors
      : 0;

    // 재방문율: returning / unique * 100
    const repeatRate = kpi.uniqueVisitors > 0
      ? (kpi.returningVisitors / kpi.uniqueVisitors) * 100
      : 0;

    // 전환율: funnel.purchase / funnel.entry * 100 (더 정확)
    const conversionRate = funnel.entry > 0
      ? (funnel.purchase / funnel.entry) * 100
      : kpi.conversionRate;

    return {
      footfall: kpi.totalVisitors,
      uniqueVisitors: kpi.uniqueVisitors,
      visitFrequency,
      repeatRate,
      conversionRate,
      transactions: kpi.totalTransactions,
      atv: kpi.avgTransactionValue,
      revenue: kpi.totalRevenue,
      // 행동 지표는 별도 쿼리 필요 - 기본값 제공
      avgDwellTime: 0,
      trackedVisitors: 0,
      trackingCoverage: 0,
      funnel: {
        entry: funnel.entry,
        browse: funnel.browse,
        engage: funnel.engage,
        fitting: funnel.fitting,
        purchase: funnel.purchase,
      },
      changes: {
        footfall: kpi.changes.visitors,
        uniqueVisitors: kpi.changes.visitors,
        revenue: kpi.changes.revenue,
        conversionRate: kpi.changes.conversionRate,
      },
      periodDays: kpi.periodDays,
      dataAvailable: kpi.totalVisitors > 0 || kpi.uniqueVisitors > 0,
    };
  }, [baseKPIs.data, funnelData.data]);

  return {
    data,
    isLoading: baseKPIs.isLoading || funnelData.isLoading,
    error: baseKPIs.error || funnelData.error || null,
  };
}

// 시간대별 방문자 데이터 훅
export function useHourlyVisitors(): {
  data: { hour: number; count: number }[] | undefined;
  isLoading: boolean;
} {
  const { funnelData } = useInsightData();

  return {
    data: funnelData.data?.hourlyEntry,
    isLoading: funnelData.isLoading,
  };
}
