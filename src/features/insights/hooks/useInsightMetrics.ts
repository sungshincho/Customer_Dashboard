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

      // 🆕 zone_daily_metrics에서 zone_type 기반 퍼널 데이터 조회
      const { data: zoneMetrics } = await supabase
        .from('zone_daily_metrics')
        .select('zone_id, total_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // zones_dim에서 zone_type 매핑 조회 (id와 zone_code 모두)
      const { data: zonesDim } = await supabase
        .from('zones_dim')
        .select('id, zone_code, zone_type')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id);

      // zone_type → 퍼널 단계 매핑
      const FUNNEL_ZONE_GROUPS: Record<string, string[]> = {
        entry: ['entrance', 'entry'],
        browse: ['clothing', 'accessory', 'display', 'product', 'browse'],
        engage: ['main', 'lounge', 'promotion', 'experience', 'engage'],
        fitting: ['fitting', 'trial', 'dressing'],
        purchase: ['checkout', 'cashier', 'pos', 'purchase'],
      };

      // zone_id → zone_type 맵 생성 (zone_daily_metrics용)
      const zoneIdToTypeMap = new Map<string, string>();
      // zone_code → zone_type 맵 생성 (store_visits.zones_visited용)
      const zoneCodeToTypeMap = new Map<string, string>();

      zonesDim?.forEach(z => {
        if (z.zone_type) {
          const zoneType = z.zone_type.toLowerCase();
          zoneIdToTypeMap.set(z.id, zoneType);
          if (z.zone_code) {
            zoneCodeToTypeMap.set(z.zone_code, zoneType);
          }
        }
      });

      console.log('[useInsightMetrics] Zone mappings:', {
        zoneIdToTypeMap: Object.fromEntries(zoneIdToTypeMap),
        zoneCodeToTypeMap: Object.fromEntries(zoneCodeToTypeMap),
      });

      // zone_daily_metrics 기반 퍼널 계산
      const zoneFunnel = { entry: 0, browse: 0, engage: 0, fitting: 0, purchase: 0 };
      zoneMetrics?.forEach(m => {
        const zoneType = zoneIdToTypeMap.get(m.zone_id);
        if (!zoneType) return;

        for (const [stage, types] of Object.entries(FUNNEL_ZONE_GROUPS)) {
          if (types.includes(zoneType)) {
            zoneFunnel[stage as keyof typeof zoneFunnel] += m.total_visitors || 0;
            break;
          }
        }
      });

      // 🆕 store_visits.zones_visited 기반 퍼널 계산 (zone_code 사용)
      const visitFunnel = { entry: 0, browse: 0, engage: 0, fitting: 0, purchase: 0 };

      // store_visits 데이터에서 zones_visited, made_purchase 조회
      // 🔧 FIX: Supabase 기본 1000개 제한 해제
      const { data: visitsWithZones } = await supabase
        .from('store_visits')
        .select('zones_visited, made_purchase')
        .eq('store_id', selectedStore.id)
        .gte('visit_date', `${startDate}T00:00:00`)
        .lte('visit_date', `${endDate}T23:59:59`)
        .limit(50000);

      visitsWithZones?.forEach(visit => {
        visitFunnel.entry++; // 모든 방문 = ENTRY

        // zones_visited의 zone_code를 zone_type으로 변환
        const visitedTypes = ((visit.zones_visited as string[]) || [])
          .map(zoneCode => zoneCodeToTypeMap.get(zoneCode))
          .filter(Boolean) as string[];

        // BROWSE: clothing 또는 accessory 방문
        if (visitedTypes.some(type => FUNNEL_ZONE_GROUPS.browse.includes(type))) {
          visitFunnel.browse++;
        }

        // ENGAGE: main 또는 lounge 방문
        if (visitedTypes.some(type => FUNNEL_ZONE_GROUPS.engage.includes(type))) {
          visitFunnel.engage++;
        }

        // FITTING: fitting 방문
        if (visitedTypes.some(type => FUNNEL_ZONE_GROUPS.fitting.includes(type))) {
          visitFunnel.fitting++;
        }

        // PURCHASE: made_purchase = true 또는 checkout 존 방문
        if (visit.made_purchase || visitedTypes.some(type => FUNNEL_ZONE_GROUPS.purchase.includes(type))) {
          visitFunnel.purchase++;
        }
      });

      console.log('[useInsightMetrics] Funnel data:', {
        zoneFunnel,
        visitFunnel,
        visitsWithZonesCount: visitsWithZones?.length || 0,
      });

      // purchases 테이블에서 구매 수 조회 (fallback)
      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id)
        .gte('purchase_date', `${startDate}T00:00:00`)
        .lte('purchase_date', `${endDate}T23:59:59`);

      // 🆕 하이브리드 병합 방식: 각 소스에서 가장 좋은 데이터 선택
      // 🔧 FIX: ENTRY는 항상 footfall 사용, 나머지는 zone_daily_metrics 우선
      const entryCount = footfall || visitStats?.length || 0;

      // funnel_events에서 가져온 값 (있으면 사용)
      const funnelEntry = funnelCounts.get('entry');
      const funnelBrowse = funnelCounts.get('browse');
      const funnelEngage = funnelCounts.get('engage');
      const funnelFitting = funnelCounts.get('fitting');
      const funnelPurchase = funnelCounts.get('purchase');

      // 하이브리드 병합: funnel_events > zone_daily_metrics > store_visits > 추정치
      // 🔧 FIX: zone_daily_metrics 우선 (이미 집계된 데이터, 제한 없음)
      const funnelByType = {
        // ENTRY는 항상 footfall 사용 (일관성)
        entry: funnelEntry || entryCount,
        // 나머지는 zone_daily_metrics 우선
        browse: funnelBrowse || zoneFunnel.browse || visitFunnel.browse || 0,
        engage: funnelEngage || zoneFunnel.engage || visitFunnel.engage || 0,
        fitting: funnelFitting || zoneFunnel.fitting || visitFunnel.fitting || 0,
        purchase: funnelPurchase || zoneFunnel.purchase || visitFunnel.purchase || purchaseCount || 0,
      };

      // 데이터 소스 추적 (디버깅용)
      const funnelSources = {
        entry: funnelEntry ? 'funnel_events' : 'footfall',
        browse: funnelBrowse ? 'funnel_events' : zoneFunnel.browse ? 'zone_metrics' : visitFunnel.browse ? 'store_visits' : 'none',
        engage: funnelEngage ? 'funnel_events' : zoneFunnel.engage ? 'zone_metrics' : visitFunnel.engage ? 'store_visits' : 'none',
        fitting: funnelFitting ? 'funnel_events' : zoneFunnel.fitting ? 'zone_metrics' : visitFunnel.fitting ? 'store_visits' : 'none',
        purchase: funnelPurchase ? 'funnel_events' : zoneFunnel.purchase ? 'zone_metrics' : visitFunnel.purchase ? 'store_visits' : 'purchases',
      };

      console.log('[useInsightMetrics] Hybrid funnel merge:', {
        funnelByType,
        funnelSources,
        rawData: {
          funnelEvents: { entry: funnelEntry, browse: funnelBrowse, engage: funnelEngage, fitting: funnelFitting, purchase: funnelPurchase },
          visitFunnel,
          zoneFunnel,
          purchaseCount,
        },
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
