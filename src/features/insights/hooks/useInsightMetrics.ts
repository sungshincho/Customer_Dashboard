/**
 * useInsightMetrics.ts
 *
 * 인사이트 허브 통합 메트릭 훅
 * 업계 표준 용어 기반의 통합 데이터 조회
 *
 * 데이터 소스:
 * - daily_kpis_agg: Footfall, Revenue
 * - funnel_events: Unique Visitors, 퍼널 데이터
 * - zone_events: 체류시간, 센서 커버율
 * - transactions: 거래 수, ATV
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

      // 1. daily_kpis_agg에서 기본 지표 (Footfall, Revenue, Unique Visitors)
      const { data: kpis } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, unique_visitors, total_revenue, returning_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const footfall = kpis?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const revenue = kpis?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
      const kpiReturningSum = kpis?.reduce((sum, k) => sum + (k.returning_visitors || 0), 0) || 0;

      // 2. store_visits에서 실제 순 방문객 및 재방문률 조회
      const { data: visitStats } = await supabase
        .from('store_visits')
        .select('id, customer_id')
        .eq('store_id', selectedStore.id)
        .gte('visit_date', `${startDate}T00:00:00`)
        .lte('visit_date', `${endDate}T23:59:59`);

      // 총 방문 수 (store_visits 기준)
      const totalVisitsCount = visitStats?.length || 0;

      // 순 방문객 계산: customer_id가 있는 경우 고유 고객 수 + NULL 방문 수
      const customerIdVisits = visitStats?.filter(v => v.customer_id) || [];
      const uniqueCustomerIds = new Set(customerIdVisits.map(v => v.customer_id));
      const anonymousVisits = (visitStats?.length || 0) - customerIdVisits.length;

      // 순 방문객 = 고유 고객 수 + 익명 방문 수 (각 익명 방문을 개별 방문자로 취급)
      // 또는 daily_kpis_agg의 unique_visitors 합계 사용 (더 정확할 수 있음)
      const kpiUniqueVisitors = kpis?.reduce((sum, k) => sum + (k.unique_visitors || 0), 0) || 0;

      // 더 큰 값 사용 (데이터 일관성 문제 대응)
      const uniqueVisitors = Math.max(
        uniqueCustomerIds.size + anonymousVisits, // store_visits 기반
        kpiUniqueVisitors // daily_kpis_agg 기반
      );

      // 재방문률 계산: 2회 이상 방문한 고객 비율
      const customerVisitCounts = new Map<string, number>();
      customerIdVisits.forEach(v => {
        const count = customerVisitCounts.get(v.customer_id!) || 0;
        customerVisitCounts.set(v.customer_id!, count + 1);
      });
      const returningCustomers = Array.from(customerVisitCounts.values()).filter(count => count >= 2).length;
      const totalTrackedCustomers = customerVisitCounts.size;

      // 재방문률 = 2회 이상 방문 고객 / 전체 고객 * 100
      const calculatedRepeatRate = totalTrackedCustomers > 0
        ? (returningCustomers / totalTrackedCustomers) * 100
        : 0;

      // 퍼널 데이터: funnel_events 테이블에서 실제 데이터 조회
      const { data: funnelEvents } = await supabase
        .from('funnel_events')
        .select('event_type')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('event_date', startDate)
        .lte('event_date', endDate);

      // 퍼널 이벤트 카운트
      const funnelCounts = new Map<string, number>();
      (funnelEvents || []).forEach(e => {
        const count = funnelCounts.get(e.event_type) || 0;
        funnelCounts.set(e.event_type, count + 1);
      });

      // purchases 테이블에서 구매 수 조회 (fallback)
      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id)
        .gte('purchase_date', `${startDate}T00:00:00`)
        .lte('purchase_date', `${endDate}T23:59:59`);

      // funnel_events 데이터가 있으면 실제 데이터 사용, 없으면 추정치 사용
      const hasFunnelData = funnelEvents && funnelEvents.length > 0;
      const entryCount = footfall || visitStats?.length || 0;

      const funnelByType = hasFunnelData ? {
        // 실제 funnel_events 데이터 사용
        entry: funnelCounts.get('entry') || entryCount,
        browse: funnelCounts.get('browse') || 0,
        engage: funnelCounts.get('engage') || 0,
        fitting: funnelCounts.get('fitting') || 0,
        purchase: funnelCounts.get('purchase') || purchaseCount || 0,
      } : {
        // funnel_events 데이터 없음: store_visits + purchases 기반 추정
        entry: entryCount,
        browse: Math.round(entryCount * 0.75), // 추정: 75%가 둘러봄
        engage: Math.round(entryCount * 0.45), // 추정: 45%가 상호작용
        fitting: Math.round(entryCount * 0.25), // 추정: 25%가 피팅
        purchase: purchaseCount || 0, // 실제 구매 데이터
      };

      console.log('[useInsightMetrics] Funnel data:', {
        hasFunnelData,
        funnelEventsCount: funnelEvents?.length || 0,
        funnelByType,
      });

      // 디버깅 로그
      console.log('[useInsightMetrics] Visitor stats:', {
        storeId: selectedStore.id,
        startDate,
        endDate,
        footfall,
        uniqueVisitors,
        kpiUniqueVisitors,
        uniqueCustomerIdsSize: uniqueCustomerIds.size,
        anonymousVisits,
        totalVisitsCount,
        visitStatsCount: visitStats?.length,
        purchaseCount,
        returningCustomers,
        totalTrackedCustomers,
        calculatedRepeatRate,
      });

      // 3. zone_events에서 행동 지표
      const { data: zoneData } = await supabase
        .from('zone_events')
        .select('visitor_id, duration_seconds')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('event_date', startDate)
        .lte('event_date', endDate);

      const trackedVisitors = new Set(zoneData?.map(z => z.visitor_id)).size;
      const avgDwellTime = zoneData?.length
        ? zoneData.reduce((sum, z) => sum + (z.duration_seconds || 0), 0) / zoneData.length
        : 0;

      // 4. transactions에서 거래 지표
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('transaction_datetime', `${startDate}T00:00:00`)
        .lte('transaction_datetime', `${endDate}T23:59:59`);

      const transactions = txCount || 0;

      // 5. 전 기간 데이터 (변화율 계산용)
      const periodDays = Math.max(1, Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1);

      const prevEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
      const prevStartDate = new Date(prevEndDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

      const { data: prevKpis } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, total_revenue')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]);

      const prevFootfall = prevKpis?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const prevRevenue = prevKpis?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;

      // 전 기간 순 방문객 (store_visits 기반)
      const { data: prevVisitStats } = await supabase
        .from('store_visits')
        .select('id, customer_id')
        .eq('store_id', selectedStore.id)
        .gte('visit_date', `${prevStartDate.toISOString().split('T')[0]}T00:00:00`)
        .lte('visit_date', `${prevEndDate.toISOString().split('T')[0]}T23:59:59`);

      // 전 기간 순 방문객 계산 (현재 기간과 동일한 로직)
      const prevCustomerIdVisits = prevVisitStats?.filter(v => v.customer_id) || [];
      const prevUniqueCustomerIds = new Set(prevCustomerIdVisits.map(v => v.customer_id));
      const prevAnonymousVisits = (prevVisitStats?.length || 0) - prevCustomerIdVisits.length;

      // 전 기간 daily_kpis_agg unique_visitors도 조회
      const { data: prevKpisUnique } = await supabase
        .from('daily_kpis_agg')
        .select('unique_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]);

      const prevKpiUniqueVisitors = prevKpisUnique?.reduce((sum, k) => sum + (k.unique_visitors || 0), 0) || 0;
      const prevUniqueVisitors = Math.max(
        prevUniqueCustomerIds.size + prevAnonymousVisits,
        prevKpiUniqueVisitors
      );

      // 전 기간 퍼널 데이터
      const prevEntry = prevFootfall || prevVisitStats?.length || 0;
      const { count: prevPurchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id)
        .gte('purchase_date', `${prevStartDate.toISOString().split('T')[0]}T00:00:00`)
        .lte('purchase_date', `${prevEndDate.toISOString().split('T')[0]}T23:59:59`);

      const prevPurchase = prevPurchaseCount || 0;

      // 계산
      const visitFrequency = uniqueVisitors > 0 ? footfall / uniqueVisitors : 0;
      const conversionRate = funnelByType.entry > 0 ? (funnelByType.purchase / funnelByType.entry) * 100 : 0;
      const prevConversionRate = prevEntry > 0 ? (prevPurchase / prevEntry) * 100 : 0;
      const atv = transactions > 0 ? Math.round(revenue / transactions) : 0;
      const trackingCoverage = uniqueVisitors > 0 ? (trackedVisitors / uniqueVisitors) * 100 : 0;
      // 재방문률: store_visits 기반 계산값 사용 (2회 이상 방문 고객 비율)
      const repeatRate = calculatedRepeatRate;

      // ATV 디버깅 로그
      console.log('[useInsightMetrics] ATV calculation:', {
        revenue,
        transactions,
        atv,
        expectedAtv: transactions > 0 ? revenue / transactions : 0,
      });

      return {
        footfall,
        uniqueVisitors,
        visitFrequency,
        repeatRate,
        conversionRate,
        transactions,
        atv,
        revenue,
        avgDwellTime,
        trackedVisitors,
        trackingCoverage,
        funnel: funnelByType,
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
