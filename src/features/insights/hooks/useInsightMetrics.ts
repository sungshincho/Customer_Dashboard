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

      // 1. daily_kpis_agg에서 기본 지표 (Footfall, Revenue)
      const { data: kpis } = await supabase
        .from('daily_kpis_agg')
        .select('total_visitors, total_revenue, returning_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const footfall = kpis?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
      const revenue = kpis?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
      const totalReturning = kpis?.reduce((sum, k) => sum + (k.returning_visitors || 0), 0) || 0;

      // 2. funnel_events에서 퍼널 데이터 및 Unique Visitors
      // store_id로만 필터링 + 충분한 limit 설정 (기본 1000개 제한 해제)
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnel_events')
        .select('event_type, visitor_id')
        .eq('store_id', selectedStore.id)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .limit(50000); // 기본 1000개 limit 해제

      // 디버깅 로그
      console.log('[useInsightMetrics] Funnel query:', {
        storeId: selectedStore.id,
        startDate,
        endDate,
        resultCount: funnelData?.length || 0,
        error: funnelError?.message,
      });

      // 이벤트 타입별 고유 방문자 수
      const getUniqueByType = (type: string) =>
        new Set(funnelData?.filter(f => f.event_type === type).map(f => f.visitor_id)).size;

      const funnelByType = {
        entry: getUniqueByType('entry'),
        browse: getUniqueByType('browse'),
        engage: getUniqueByType('engage'),
        fitting: getUniqueByType('fitting'),
        purchase: getUniqueByType('purchase'),
      };

      // 디버깅 로그
      console.log('[useInsightMetrics] Funnel results:', funnelByType);

      // 전체 고유 방문자 수
      const uniqueVisitors = new Set(funnelData?.map(f => f.visitor_id)).size;

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

      // 전 기간 퍼널 데이터 (전환율 변화 계산용)
      const { data: prevFunnelData } = await supabase
        .from('funnel_events')
        .select('event_type, visitor_id')
        .eq('store_id', selectedStore.id)
        .gte('event_date', prevStartDate.toISOString().split('T')[0])
        .lte('event_date', prevEndDate.toISOString().split('T')[0])
        .limit(50000);

      const prevEntry = new Set(prevFunnelData?.filter(f => f.event_type === 'entry').map(f => f.visitor_id)).size;
      const prevPurchase = new Set(prevFunnelData?.filter(f => f.event_type === 'purchase').map(f => f.visitor_id)).size;
      const prevUniqueVisitors = new Set(prevFunnelData?.map(f => f.visitor_id)).size;

      // 계산
      const visitFrequency = uniqueVisitors > 0 ? footfall / uniqueVisitors : 0;
      const conversionRate = funnelByType.entry > 0 ? (funnelByType.purchase / funnelByType.entry) * 100 : 0;
      const prevConversionRate = prevEntry > 0 ? (prevPurchase / prevEntry) * 100 : 0;
      const atv = transactions > 0 ? Math.round(revenue / transactions) : 0;
      const trackingCoverage = uniqueVisitors > 0 ? (trackedVisitors / uniqueVisitors) * 100 : 0;
      const repeatRate = footfall > 0 ? (totalReturning / footfall) * 100 : 0;

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
