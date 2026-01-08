/**
 * useInsightMetrics.ts
 *
 * 인사이트 허브 통합 메트릭 훅 (v2.0 - 리팩토링)
 *
 * 🔧 주요 변경사항:
 * - 서버사이드 COUNT 사용 (클라이언트 집계 제거)
 * - 하이브리드 병합 로직 제거 (단일 데이터 소스)
 * - 중복 쿼리 통합 (13개 → 7개)
 * - 데이터 일관성 검증 추가
 *
 * 데이터 소스:
 * - daily_kpis_agg: Footfall, Revenue, Unique Visitors
 * - funnel_events: 퍼널 데이터 (서버사이드 COUNT)
 * - transactions: 거래 수
 * - store_visits: 재방문률
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';

export interface InsightMetrics {
  // 트래픽 지표
  footfall: number;           // 총 입장 횟수
  uniqueVisitors: number;     // 순 방문객
  visitFrequency: number;     // 평균 방문 빈도
  repeatRate: number;         // 재방문율

  // 전환 지표
  conversionRate: number;     // 구매 전환율
  transactions: number;       // 거래 수
  atv: number;                // 평균 객단가 (Average Transaction Value)
  revenue: number;            // 총 매출

  // 행동 지표
  avgDwellTime: number;       // 평균 체류시간 (초)
  trackedVisitors: number;    // 존 분석 대상
  trackingCoverage: number;   // 센서 커버율 (%)

  // 퍼널 데이터
  funnel: {
    entry: number;
    browse: number;
    engage: number;
    fitting: number;
    purchase: number;
  };

  // 변화율 (전 기간 대비)
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

export const useInsightMetrics = () => {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['insight-metrics', selectedStore?.id, dateRange, orgId],
    queryFn: async (): Promise<InsightMetrics> => {
      if (!selectedStore?.id || !orgId) {
        return getEmptyMetrics();
      }

      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;

      // ═══════════════════════════════════════════════════════════════
      // 1. KPI 데이터 (daily_kpis_agg) - 현재 기간
      // ═══════════════════════════════════════════════════════════════
      const { data: kpis } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, unique_visitors, total_revenue, returning_visitors, total_transactions')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const footfall = kpis?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const uniqueVisitors = kpis?.reduce((sum, k) => sum + (k.unique_visitors || 0), 0) || 0;
      const revenue = kpis?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
      const kpiReturningSum = kpis?.reduce((sum, k) => sum + (k.returning_visitors || 0), 0) || 0;

      // ═══════════════════════════════════════════════════════════════
      // 2. 퍼널 데이터 - 서버사이드 COUNT (핵심 수정!)
      // ═══════════════════════════════════════════════════════════════
      const eventTypes = ['entry', 'browse', 'engage', 'fitting', 'purchase'] as const;

      const funnelCountResults = await Promise.all(
        eventTypes.map(async (type) => {
          const { count, error } = await supabase
            .from('funnel_events')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('store_id', selectedStore.id)
            .eq('event_type', type)
            .gte('event_date', startDate)
            .lte('event_date', endDate);

          if (error) {
            console.error(`[useInsightMetrics] Funnel count error for ${type}:`, error);
            return 0;
          }
          return count || 0;
        })
      );

      const funnel = {
        entry: funnelCountResults[0],
        browse: funnelCountResults[1],
        engage: funnelCountResults[2],
        fitting: funnelCountResults[3],
        purchase: funnelCountResults[4],
      };

      // ═══════════════════════════════════════════════════════════════
      // 3. 데이터 일관성 검증 및 로깅
      // ═══════════════════════════════════════════════════════════════
      // footfall(daily_kpis_agg)과 funnel.entry(funnel_events)는 같아야 함
      if (Math.abs(footfall - funnel.entry) > Math.max(footfall, funnel.entry) * 0.01) {
        console.warn('[useInsightMetrics] Data inconsistency detected:', {
          footfall,
          funnelEntry: funnel.entry,
          diff: Math.abs(footfall - funnel.entry),
          percentDiff: footfall > 0 ? ((Math.abs(footfall - funnel.entry) / footfall) * 100).toFixed(1) + '%' : 'N/A',
          suggestion: 'SEED_06 재실행 또는 RLS 정책 확인 필요'
        });
      }

      console.log('[useInsightMetrics] Funnel counts (server-side):', funnel);

      // ═══════════════════════════════════════════════════════════════
      // 4. 거래 데이터 (transactions)
      // ═══════════════════════════════════════════════════════════════
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('transaction_datetime', `${startDate}T00:00:00`)
        .lte('transaction_datetime', `${endDate}T23:59:59`);

      const transactions = txCount || 0;

      // ═══════════════════════════════════════════════════════════════
      // 5. 재방문률 (store_visits)
      // ═══════════════════════════════════════════════════════════════
      const { data: visitData } = await supabase
        .from('store_visits')
        .select('customer_id')
        .eq('store_id', selectedStore.id)
        .gte('visit_date', `${startDate}T00:00:00`)
        .lte('visit_date', `${endDate}T23:59:59`)
        .not('customer_id', 'is', null)
        .limit(50000);

      const customerVisitCounts = new Map<string, number>();
      visitData?.forEach(v => {
        if (v.customer_id) {
          customerVisitCounts.set(v.customer_id, (customerVisitCounts.get(v.customer_id) || 0) + 1);
        }
      });

      const returningCustomers = Array.from(customerVisitCounts.values()).filter(c => c >= 2).length;
      const totalTrackedCustomers = customerVisitCounts.size;
      const repeatRate = totalTrackedCustomers > 0
        ? (returningCustomers / totalTrackedCustomers) * 100
        : 0;

      // ═══════════════════════════════════════════════════════════════
      // 6. 이전 기간 데이터 (변화율 계산)
      // ═══════════════════════════════════════════════════════════════
      const periodDays = Math.max(1, Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1);

      const prevEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
      const prevStartDate = new Date(prevEndDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

      const { data: prevKpis } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, unique_visitors, total_revenue')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]);

      const prevFootfall = prevKpis?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const prevUniqueVisitors = prevKpis?.reduce((sum, k) => sum + (k.unique_visitors || 0), 0) || 0;
      const prevRevenue = prevKpis?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;

      // 이전 기간 purchase count (전환율 변화 계산용)
      const { count: prevPurchaseCount } = await supabase
        .from('funnel_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .eq('event_type', 'purchase')
        .gte('event_date', prevStartDate.toISOString().split('T')[0])
        .lte('event_date', prevEndDate.toISOString().split('T')[0]);

      const prevConversionRate = prevFootfall > 0
        ? ((prevPurchaseCount || 0) / prevFootfall) * 100
        : 0;

      // ═══════════════════════════════════════════════════════════════
      // 7. 최종 계산
      // ═══════════════════════════════════════════════════════════════
      const visitFrequency = uniqueVisitors > 0 ? footfall / uniqueVisitors : 0;
      const conversionRate = funnel.entry > 0 ? (funnel.purchase / funnel.entry) * 100 : 0;
      const atv = transactions > 0 ? Math.round(revenue / transactions) : 0;

      return {
        footfall,
        uniqueVisitors,
        visitFrequency,
        repeatRate,
        conversionRate,
        transactions,
        atv,
        revenue,
        avgDwellTime: 0, // 필요시 별도 쿼리
        trackedVisitors: 0,
        trackingCoverage: 0,
        funnel,
        changes: {
          footfall: prevFootfall > 0 ? ((footfall - prevFootfall) / prevFootfall) * 100 : 0,
          uniqueVisitors: prevUniqueVisitors > 0 ? ((uniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors) * 100 : 0,
          revenue: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
          conversionRate: conversionRate - prevConversionRate,
        },
        periodDays,
        dataAvailable: footfall > 0 || uniqueVisitors > 0,
      };
    },
    enabled: !!selectedStore?.id && !!orgId,
  });
};

function getEmptyMetrics(): InsightMetrics {
  return {
    footfall: 0,
    uniqueVisitors: 0,
    visitFrequency: 0,
    repeatRate: 0,
    conversionRate: 0,
    transactions: 0,
    atv: 0,
    revenue: 0,
    avgDwellTime: 0,
    trackedVisitors: 0,
    trackingCoverage: 0,
    funnel: { entry: 0, browse: 0, engage: 0, fitting: 0, purchase: 0 },
    changes: { footfall: 0, uniqueVisitors: 0, revenue: 0, conversionRate: 0 },
    periodDays: 0,
    dataAvailable: false,
  };
}
