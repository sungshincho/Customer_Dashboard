/**
 * KPI 조회(query_kpi) 처리
 * Phase 3-B: RPC 함수 기반 쿼리 (프론트엔드 동일 데이터 소스)
 * Phase 3-B+: 인텐트 강화 - 새로운 쿼리 타입 및 기간 타입 추가
 * 데이터 응답 + 관련 탭 자동 이동
 * Phase 3-B++: TERM_LOCATION_MAP 활용 - 컨텍스트 기반 탭 전환
 * Phase 4: RPC 전환 - 인사이트 허브 5개 RPC로 프론트엔드와 데이터 일관성 보장
 * Phase 4+: RPC 전면 전환 - 직접 테이블 쿼리 6개를 RPC로 전환
 *   (store_goals, daily_kpis_agg, hourly_visitors_agg, zones_dim, applied_strategies, inventory_movements)
 *   + 기존 RPC 4개 수정 (get_overview_kpis, get_zone_metrics, get_customer_segments, get_inventory_status)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { ClassificationResult } from '../intent/classifier.ts';
import { formatDataResponse } from '../response/generator.ts';
import { UIAction } from './navigationActions.ts';
import { TERM_LOCATION_MAP, findTermLocation, resolveTargetLocation, TermLocationEntry } from '../config/dashboardStructure.ts';

export interface QueryActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
  data?: any;
}

// 현재 페이지 컨텍스트 인터페이스
export interface PageContext {
  current: string;
  tab?: string;
}

// ============================================
// RPC 호출 헬퍼 — 프론트엔드와 동일 RPC 사용
// 데이터 일관성 보장 (SECURITY DEFINER, org_id 필터)
// ============================================

async function rpcOverviewKpis(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_overview_kpis', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[])?.[0] ?? null;
}

async function rpcZoneMetrics(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_zone_metrics', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcCustomerSegments(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_customer_segments', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcProductPerformance(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_product_performance', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcInventoryStatus(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase.rpc('get_inventory_status', {
    p_org_id: orgId,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcStoreGoals(supabase: SupabaseClient, storeId: string, date: string) {
  const { data, error } = await supabase.rpc('get_store_goals', {
    p_store_id: storeId, p_date: date,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcHourlyVisitors(
  supabase: SupabaseClient, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_hourly_visitors', {
    p_store_id: storeId, p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcZonesDimList(supabase: SupabaseClient, storeId: string) {
  const { data, error } = await supabase.rpc('get_zones_dim_list', {
    p_store_id: storeId,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcAppliedStrategies(
  supabase: SupabaseClient, storeId: string,
  startDate?: string, endDate?: string, limit?: number
) {
  const params: any = { p_store_id: storeId };
  if (startDate) params.p_start_date = startDate;
  if (endDate) params.p_end_date = endDate;
  if (limit) params.p_limit = limit;
  const { data, error } = await supabase.rpc('get_applied_strategies', params);
  if (error) throw error;
  return (data as any[]) ?? [];
}

async function rpcInventoryMovements(
  supabase: SupabaseClient, orgId: string,
  startDate: string, endDate: string, limit?: number
) {
  const params: any = {
    p_org_id: orgId, p_start_date: startDate, p_end_date: endDate,
  };
  if (limit) params.p_limit = limit;
  const { data, error } = await supabase.rpc('get_inventory_movements', params);
  if (error) throw error;
  return (data as any[]) ?? [];
}


/**
 * 쿼리 타입별 관련 탭 매핑 (확장됨)
 */
const QUERY_TYPE_TO_TAB: Record<string, { page: string; tab?: string; section?: string }> = {
  // 개요(Overview) 탭
  revenue: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  conversion: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  avgTransaction: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  footfall: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  visitFrequency: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  funnel: { page: '/insights', tab: 'overview', section: 'overview-funnel' },
  goal: { page: '/insights', tab: 'overview', section: 'overview-goals' },
  aiEffect: { page: '/insights', tab: 'overview', section: 'overview-goals' },
  dailyInsight: { page: '/insights', tab: 'overview', section: 'overview-insights' },
  summary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  // 매장(Store) 탭
  storeSummary: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  peakTime: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  popularZone: { page: '/insights', tab: 'store', section: 'store-zone-performance' },
  trackingCoverage: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  hourlyPattern: { page: '/insights', tab: 'store', section: 'store-hourly-pattern' },
  zoneAnalysis: { page: '/insights', tab: 'store', section: 'store-zone-dwell' },
  storeDwell: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  // 고객(Customer) 탭
  visitors: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  dwellTime: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  newVsReturning: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  repeatRate: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  customerSegment: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  loyalCustomers: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  segmentAvgPurchase: { page: '/insights', tab: 'customer', section: 'customer-avg-purchase' },
  returnTrend: { page: '/insights', tab: 'customer', section: 'customer-return-trend' },
  // 상품(Product) 탭
  product: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  topProducts: { page: '/insights', tab: 'product', section: 'product-top10' },
  categoryAnalysis: { page: '/insights', tab: 'product', section: 'product-category-revenue' },
  unitsSold: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  // 재고(Inventory) 탭
  inventory: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  overstock: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  stockAlert: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
  stockMovement: { page: '/insights', tab: 'inventory', section: 'inventory-movements' },
  stockDistribution: { page: '/insights', tab: 'inventory', section: 'inventory-distribution' },
  healthyStock: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  inventoryCategory: { page: '/insights', tab: 'inventory', section: 'inventory-category' },
  inventoryDetail: { page: '/insights', tab: 'inventory', section: 'inventory-detail' },
  // 예측(Prediction) 탭 — 네비게이션만 수행
  predictionRevenue: { page: '/insights', tab: 'prediction' },
  predictionVisitors: { page: '/insights', tab: 'prediction' },
  predictionConversion: { page: '/insights', tab: 'prediction' },
  predictionSummary: { page: '/insights', tab: 'prediction' },
  predictionConfidence: { page: '/insights', tab: 'prediction' },
  predictionDaily: { page: '/insights', tab: 'prediction' },
  predictionModel: { page: '/insights', tab: 'prediction' },
  // AI추천(AI Recommendation) 탭 — 네비게이션만 수행
  activeStrategies: { page: '/insights', tab: 'ai' },
  strategyRecommendation: { page: '/insights', tab: 'ai' },
  priceOptimization: { page: '/insights', tab: 'ai' },
  inventoryOptimization: { page: '/insights', tab: 'ai' },
  demandForecast: { page: '/insights', tab: 'ai' },
  seasonTrend: { page: '/insights', tab: 'ai' },
  riskPrediction: { page: '/insights', tab: 'ai' },
  campaignStatus: { page: '/insights', tab: 'ai' },
  // 데이터 컨트롤타워 쿼리 (탭 없음)
  dataQuality: { page: '/data/control-tower', section: 'data-quality' },
  dataSources: { page: '/data/control-tower', section: 'data-sources' },
  contextDataSources: { page: '/data/control-tower', section: 'data-sources' },
  apiConnections: { page: '/data/control-tower', section: 'api-connections' },
  importHistory: { page: '/data/control-tower', section: 'data-import' },
  pipelineStatus: { page: '/data/control-tower', section: 'pipeline' },
  // ROI 측정 쿼리 (탭 없음)
  roiSummary: { page: '/roi', section: 'roi-summary' },
  appliedStrategies: { page: '/roi', section: 'applied-strategies' },
  categoryPerformance: { page: '/roi', section: 'strategy-performance' },
  roiInsight: { page: '/roi', section: 'roi-analysis' },
  filterStrategies: { page: '/roi', section: 'applied-strategies' },
  exportStrategies: { page: '/roi', section: 'applied-strategies' },
  roiTablePage: { page: '/roi', section: 'applied-strategies' },
  // 설정 & 관리 쿼리 (탭별)
  storeManagement: { page: '/settings', tab: 'stores', section: 'settings-store-list' },
  userManagement: { page: '/settings', tab: 'users', section: 'settings-members' },
  subscriptionInfo: { page: '/settings', tab: 'license', section: 'settings-subscription' },
  systemSettings: { page: '/settings', tab: 'system', section: 'settings-org' },
  dataSettings: { page: '/settings', tab: 'data', section: 'settings-data-stats' },
};

/**
 * 쿼리 타입에서 용어 키워드 추출
 */
function getTermKeyword(queryType: string): string {
  const termMap: Record<string, string> = {
    // 개요
    revenue: '매출',
    conversion: '전환율',
    avgTransaction: '객단가',
    footfall: '입장객',
    visitFrequency: '방문 빈도',
    funnel: '고객 여정 퍼널',
    goal: '목표 달성률',
    aiEffect: 'AI 추천 효과',
    dailyInsight: 'AI 인사이트',
    summary: '매출',
    // 매장
    peakTime: '피크타임',
    popularZone: '인기 존',
    trackingCoverage: '센서 커버율',
    hourlyPattern: '시간대별 방문',
    zoneAnalysis: '존 분석',
    storeDwell: '평균 체류시간',
    // 고객
    visitors: '방문객',
    dwellTime: '체류 시간',
    newVsReturning: '방문객',
    repeatRate: '재방문율',
    customerSegment: '고객 세그먼트',
    loyalCustomers: '충성 고객',
    segmentAvgPurchase: '세그먼트별 평균 구매액',
    returnTrend: '재방문 추이',
    // 상품
    product: '상품',
    topProducts: '인기 상품',
    categoryAnalysis: '카테고리 분석',
    unitsSold: '판매량',
    // 재고
    inventory: '재고',
    overstock: '과잉 재고',
    stockAlert: '재고 부족 경고',
    stockMovement: '입출고 내역',
    stockDistribution: '재고 분포',
    healthyStock: '정상 재고',
    inventoryCategory: '카테고리별 재고',
    inventoryDetail: '상세 재고 현황',
    // 예측 — 네비게이션만 수행
    predictionRevenue: '예측',
    predictionVisitors: '예측',
    predictionConversion: '예측',
    predictionSummary: '예측',
    predictionConfidence: '예측',
    predictionDaily: '예측',
    predictionModel: '예측',
    // AI추천 — 네비게이션만 수행
    activeStrategies: 'AI추천',
    strategyRecommendation: 'AI추천',
    priceOptimization: 'AI추천',
    inventoryOptimization: 'AI추천',
    demandForecast: 'AI추천',
    seasonTrend: 'AI추천',
    riskPrediction: 'AI추천',
    campaignStatus: 'AI추천',
    // ROI 측정
    roiSummary: 'ROI 요약',
    appliedStrategies: '적용된 전략',
    categoryPerformance: '카테고리별 성과',
    roiInsight: 'ROI 인사이트',
    filterStrategies: '적용 이력 필터',
    exportStrategies: '적용 이력 내보내기',
    roiTablePage: '적용 이력',
    // 설정 & 관리
    storeManagement: '매장 관리',
    userManagement: '사용자 관리',
    subscriptionInfo: '구독 정보',
    systemSettings: '시스템 설정',
    dataSettings: '데이터 설정',
  };
  return termMap[queryType] || '매출';
}

/**
 * 날짜 범위를 기반으로 네비게이션 액션 생성 (컨텍스트 인식)
 * navigate + set_tab을 하나의 navigate('page?tab=xxx') 액션으로 합침
 */
function createNavigationActions(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): { actions: UIAction[]; tabChanged: boolean; targetTab: string } {
  const mapping = QUERY_TYPE_TO_TAB[queryType] || QUERY_TYPE_TO_TAB.summary;
  const actions: UIAction[] = [];

  // 현재 탭과 목적 탭이 다른지 확인
  const currentPage = pageContext?.current || '';
  const currentTab = pageContext?.tab || '';
  const targetPage = mapping.page;
  const targetTab = mapping.tab || '';

  const pageNeedsChange = currentPage !== targetPage;
  const tabNeedsChange = targetTab ? currentTab !== targetTab : false;
  const tabChanged = pageNeedsChange || tabNeedsChange;

  // 1. 페이지 이동 + 탭 전환을 하나의 navigate 액션으로 합침
  if (pageNeedsChange && targetTab) {
    // 페이지 + 탭 동시 이동: navigate('/insights?tab=overview')
    actions.push({
      type: 'navigate',
      target: `${targetPage}?tab=${targetTab}`,
    });
  } else if (pageNeedsChange) {
    // 페이지만 이동 (탭 없는 페이지: control-tower, roi 등)
    actions.push({
      type: 'navigate',
      target: targetPage,
    });
  } else if (tabNeedsChange && targetTab) {
    // 같은 페이지에서 탭만 변경
    actions.push({
      type: 'set_tab',
      target: targetTab,
    });
  }

  // 2. 날짜 범위 설정
  actions.push({
    type: 'set_date_range',
    target: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  });

  // 3. 섹션으로 스크롤 (있으면)
  if (mapping.section) {
    actions.push({
      type: 'scroll_to_section',
      sectionId: mapping.section,
      highlight: true,
      highlightDuration: 2000,
    });
  }

  return { actions, tabChanged, targetTab };
}

/**
 * 탭 이름을 한글로 변환
 */
function getTabDisplayName(tabId: string): string {
  const tabNames: Record<string, string> = {
    overview: '개요',
    customer: '고객',
    store: '매장',
    product: '상품',
    inventory: '재고',
    prediction: '예측',
    ai: 'AI추천',
    stores: '매장 관리',
    data: '데이터',
    users: '사용자',
    system: '시스템',
    license: '플랜',
  };
  return tabNames[tabId] || tabId;
}

/**
 * 페이지 이름을 한글로 변환
 */
function getPageDisplayName(pagePath: string): string {
  const pageNames: Record<string, string> = {
    '/insights': '인사이트 허브',
    '/studio': '디지털트윈 스튜디오',
    '/roi': 'ROI 측정',
    '/settings': '설정',
    '/data/control-tower': '데이터 컨트롤타워',
  };
  return pageNames[pagePath] || pagePath;
}

/**
 * 새로 추가된 queryType용 - DB 쿼리 없이 해당 탭으로 네비게이션만 수행
 */
function createGenericNavigationResult(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  const termKeyword = getTermKeyword(queryType);
  const mapping = QUERY_TYPE_TO_TAB[queryType] || QUERY_TYPE_TO_TAB.summary;
  const { actions, tabChanged, targetTab } = createNavigationActions(queryType, dateRange, pageContext);

  let message: string;
  if (targetTab) {
    // 탭이 있는 페이지 (인사이트 허브, 설정)
    const tabName = getTabDisplayName(targetTab);
    if (tabChanged) {
      message = `${tabName} 탭의 ${termKeyword} 섹션으로 이동합니다.`;
    } else {
      message = `현재 ${tabName} 탭에서 ${termKeyword}을(를) 확인할 수 있습니다.`;
    }
  } else {
    // 탭이 없는 페이지 (ROI, 데이터 컨트롤타워)
    const pageName = getPageDisplayName(mapping.page);
    if (tabChanged) {
      message = `${pageName} 페이지의 ${termKeyword} 섹션으로 이동합니다.`;
    } else {
      message = `현재 ${pageName} 페이지에서 ${termKeyword}을(를) 확인할 수 있습니다.`;
    }
  }

  return {
    actions,
    message,
    suggestions: [`${termKeyword} 더 보기`, '다른 지표 보기'],
  };
}

/**
 * 중복 위치 용어 체크 및 메시지 생성
 * 사용자가 현재 탭에 있으면 유지, 아니면 가장 관련 높은 탭으로 이동 + 다른 위치 안내
 */
function getDisambiguationInfo(
  queryType: string,
  pageContext?: PageContext
): { extraMessage: string; shouldAsk: boolean; alternativeTabs: string[] } | null {
  const termKeyword = getTermKeyword(queryType);
  const entry = findTermLocation(termKeyword);

  if (!entry || !entry.secondary || entry.secondary.length === 0) {
    return null; // 중복 위치 없음
  }

  const currentTab = pageContext?.tab || '';
  const currentPage = pageContext?.current || '';

  // 모든 위치 수집 (primary + secondary)
  const allLocations = [entry.primary, ...entry.secondary];
  const allTabs = allLocations
    .filter(loc => loc.tab)
    .map(loc => ({
      tab: loc.tab!,
      tabName: getTabDisplayName(loc.tab!),
      description: entry.description?.[loc.tab!] || '',
    }));

  // 현재 탭이 해당 용어가 있는 탭 중 하나인지 확인
  const isOnMatchingTab = allTabs.some(t => t.tab === currentTab);
  const otherTabs = allTabs.filter(t => t.tab !== currentTab);

  if (isOnMatchingTab && otherTabs.length > 0) {
    // 현재 탭에 해당 데이터가 있음 → 유지, 다른 탭 안내
    const otherTabNames = otherTabs.map(t => {
      return t.description ? `${t.tabName} 탭(${t.description})` : `${t.tabName} 탭`;
    }).join(', ');
    return {
      extraMessage: `\n참고: ${termKeyword}은(는) ${otherTabNames}에서도 확인할 수 있습니다.`,
      shouldAsk: false,
      alternativeTabs: otherTabs.map(t => t.tab),
    };
  }

  if (!isOnMatchingTab && allTabs.length > 1) {
    // 현재 탭에 해당 데이터 없음, 여러 탭에 존재 → 가장 관련 높은 곳으로 이동하되 안내
    const otherTabsFromPrimary = allTabs.filter(t => t.tab !== entry.primary.tab);
    const otherTabNames = otherTabsFromPrimary.map(t => {
      return t.description ? `${t.tabName} 탭(${t.description})` : `${t.tabName} 탭`;
    }).join(', ');
    return {
      extraMessage: `\n참고: ${termKeyword}은(는) ${otherTabNames}에서도 확인할 수 있습니다.`,
      shouldAsk: false,
      alternativeTabs: otherTabsFromPrimary.map(t => t.tab),
    };
  }

  return null;
}

/**
 * query_kpi 인텐트 처리 (컨텍스트 인식 버전)
 */
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string,
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const queryType = classification.entities.queryType || 'summary';

  // ROI 쿼리는 기본 기간을 90일로 설정 (프론트엔드 ROI 페이지 기본값과 통일)
  const ROI_QUERY_TYPES = ['roiSummary', 'appliedStrategies', 'categoryPerformance', 'roiInsight'];
  const defaultPeriod = ROI_QUERY_TYPES.includes(queryType) ? { type: '90d' } : { type: 'today' };
  const period = classification.entities.period || defaultPeriod;

  try {
    const dateRange = getDateRange(period);

    // 중복 위치 용어 체크 (disambiguation)
    const disambiguationInfo = getDisambiguationInfo(queryType, pageContext);

    let result: QueryActionResult;

    switch (queryType) {
      // 개요(Overview) 탭 — get_overview_kpis RPC 사용
      case 'revenue':
        result = await queryRevenue(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'conversion':
        result = await queryConversion(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'avgTransaction':
        result = await queryAvgTransaction(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'footfall':
        result = await queryFootfall(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'visitFrequency':
        result = await queryVisitFrequency(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'funnel':
        result = await queryFunnel(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'goal':
        result = await queryGoal(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'aiEffect':
      case 'dailyInsight':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // 매장(Store) 탭 — get_zone_metrics RPC 사용 (존 관련)
      case 'storeSummary':
        result = await queryStoreSummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'peakTime':
        result = await queryPeakTime(supabase, storeId, dateRange, pageContext);
        break;
      case 'popularZone':
        result = await queryPopularZone(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'trackingCoverage':
        result = await queryTrackingCoverage(supabase, storeId, dateRange, pageContext);
        break;
      case 'hourlyPattern':
        result = await queryHourlyPattern(supabase, storeId, dateRange, pageContext, classification.entities.hour);
        break;
      case 'zoneAnalysis':
        result = await queryZoneAnalysis(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'storeDwell':
        result = queryStoreDwell(dateRange, pageContext);
        break;

      // 고객(Customer) 탭 — get_overview_kpis / get_customer_segments RPC 사용
      case 'visitors':
        result = await queryVisitors(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'dwellTime':
        result = await queryDwellTime(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'newVsReturning':
        result = await queryNewVsReturning(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'repeatRate':
        result = await queryRepeatRate(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'customerSegment':
        result = await queryCustomerSegment(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'loyalCustomers':
        result = await queryLoyalCustomers(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'segmentAvgPurchase':
      case 'returnTrend':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // 상품(Product) 탭 — get_product_performance RPC 사용
      case 'product':
        result = await queryProduct(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'topProducts':
        result = await queryTopProducts(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'categoryAnalysis':
        result = await queryCategoryAnalysis(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'unitsSold':
        result = await queryUnitsSold(supabase, storeId, dateRange, pageContext, orgId);
        break;

      // 재고(Inventory) 탭
      case 'inventory':
        result = await queryInventory(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'overstock':
        result = await queryOverstock(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'stockAlert':
        result = await queryStockAlert(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'stockMovement':
        result = await queryStockMovement(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'stockDistribution':
        result = await queryStockDistribution(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'healthyStock':
      case 'inventoryCategory':
      case 'inventoryDetail':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // 예측(Prediction) 탭 — 탭 네비게이션만 수행
      case 'predictionRevenue':
      case 'predictionVisitors':
      case 'predictionConversion':
      case 'predictionSummary':
      case 'predictionConfidence':
      case 'predictionDaily':
      case 'predictionModel': {
        const { actions: predActions } = createNavigationActions(queryType, dateRange, pageContext);
        result = {
          actions: predActions,
          message: '예측 데이터는 예측 탭에서 직접 확인하실 수 있습니다.',
          suggestions: ['예측탭 보여줘', '매출 알려줘', '방문객 알려줘'],
        };
        break;
      }

      // AI추천(AI Recommendation) 탭 — 탭 네비게이션만 수행
      case 'activeStrategies':
      case 'strategyRecommendation':
      case 'priceOptimization':
      case 'inventoryOptimization':
      case 'demandForecast':
      case 'seasonTrend':
      case 'riskPrediction':
      case 'campaignStatus': {
        const { actions: aiActions } = createNavigationActions(queryType, dateRange, pageContext);
        result = {
          actions: aiActions,
          message: 'AI 추천 데이터는 AI추천 탭에서 직접 확인하실 수 있습니다.',
          suggestions: ['AI추천탭 보여줘', '매출 알려줘', '재고 현황 알려줘'],
        };
        break;
      }

      // 데이터 컨트롤타워 — org_id 필터 추가
      case 'dataQuality':
        result = await queryDataQuality(supabase, storeId, pageContext);
        break;
      case 'dataSources':
        result = await queryDataSources(supabase, storeId, pageContext);
        break;
      case 'contextDataSources':
        result = await queryContextDataSources(supabase, storeId, pageContext, orgId);
        break;
      case 'apiConnections':
        result = await queryApiConnections(supabase, storeId, pageContext, orgId);
        break;
      case 'importHistory':
        result = await queryImportHistory(supabase, storeId, pageContext, orgId);
        break;
      case 'pipelineStatus':
        result = await queryPipelineStatus(supabase, storeId, pageContext);
        break;

      // ROI 측정 — org_id 필터 추가
      case 'roiSummary':
        result = await queryROISummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'appliedStrategies':
        result = await queryAppliedStrategies(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'categoryPerformance':
        result = await queryROICategoryPerformance(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'roiInsight':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // ROI 테이블 제어
      case 'filterStrategies':
        result = handleFilterStrategies(classification, pageContext);
        break;
      case 'exportStrategies':
        result = handleExportStrategies(pageContext);
        break;
      case 'roiTablePage':
        result = handleRoiTablePage(classification, pageContext);
        break;

      // 설정 & 관리
      case 'storeManagement':
      case 'userManagement':
      case 'subscriptionInfo':
      case 'systemSettings':
      case 'dataSettings':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      case 'summary':
      default:
        result = await querySummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
    }

    // 중복 위치 용어인 경우 → 다른 탭 안내 메시지 추가
    if (disambiguationInfo && disambiguationInfo.extraMessage) {
      result.message += disambiguationInfo.extraMessage;
      // 다른 탭으로의 제안도 추가
      const altSuggestions = disambiguationInfo.alternativeTabs.map(tab =>
        `${getTabDisplayName(tab)} 탭에서 보기`
      );
      result.suggestions = [...result.suggestions, ...altSuggestions].slice(0, 4);
    }

    return result;

  } catch (error) {
    console.error('[queryActions] Error:', error);
    return {
      actions: [],
      message: '데이터 조회 중 문제가 발생했어요.',
      suggestions: ['다시 시도해줘', '인사이트 허브에서 확인하기'],
    };
  }
}

/**
 * 기간 계산 (확장됨)
 */
function getDateRange(period: { type: string; startDate?: string; endDate?: string }): {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (period.type) {
    case 'custom': {
      if (period.startDate && period.endDate) {
        return {
          startDate: period.startDate,
          endDate: period.endDate,
        };
      }
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
      };
    }

    case 'today': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
        compareStartDate: formatDate(yesterday),
        compareEndDate: formatDate(yesterday),
      };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);
      return {
        startDate: formatDate(yesterday),
        endDate: formatDate(yesterday),
        compareStartDate: formatDate(dayBefore),
        compareEndDate: formatDate(dayBefore),
      };
    }

    case 'thisWeek': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(today),
      };
    }

    case 'lastWeek': {
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return {
        startDate: formatDate(startOfLastWeek),
        endDate: formatDate(endOfLastWeek),
      };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(today),
      };
    }

    case 'lastMonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: formatDate(startOfLastMonth),
        endDate: formatDate(endOfLastMonth),
      };
    }

    case 'thisQuarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      return {
        startDate: formatDate(startOfQuarter),
        endDate: formatDate(today),
      };
    }

    case '7d': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return {
        startDate: formatDate(sevenDaysAgo),
        endDate: formatDate(today),
      };
    }

    case '30d': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return {
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
      };
    }

    case '90d': {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 89);
      return {
        startDate: formatDate(ninetyDaysAgo),
        endDate: formatDate(today),
      };
    }

    case '365d': {
      const yearAgo = new Date(today);
      yearAgo.setDate(today.getDate() - 364);
      return {
        startDate: formatDate(yearAgo),
        endDate: formatDate(today),
      };
    }

    default:
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
      };
  }
}

/**
 * 매출 조회 (RPC: get_overview_kpis)
 */
async function queryRevenue(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate && dateRange.compareEndDate) {
    const compareKpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.compareStartDate, dateRange.compareEndDate);
    const prevRevenue = compareKpi?.total_revenue ?? 0;
    if (prevRevenue > 0) {
      change = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    }
  }

  const responseData = { totalRevenue, totalTransactions, change };
  const { actions, tabChanged, targetTab } = createNavigationActions('revenue', dateRange, pageContext);

  let message = formatDataResponse('revenue', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  } else {
    message += '\n\n현재 탭에서 데이터를 확인할 수 있습니다.';
  }

  return {
    actions,
    message,
    suggestions: ['방문객 수 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 방문객 조회 (RPC: get_overview_kpis)
 */
async function queryVisitors(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const totalVisitors = kpi?.total_visitors ?? 0;
  const uniqueVisitors = kpi?.unique_visitors ?? 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate && dateRange.compareEndDate) {
    const compareKpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.compareStartDate, dateRange.compareEndDate);
    const prevVisitors = compareKpi?.total_visitors ?? 0;
    if (prevVisitors > 0) {
      change = Math.round(((totalVisitors - prevVisitors) / prevVisitors) * 100);
    }
  }

  const responseData = { totalVisitors, uniqueVisitors, change };
  const { actions, tabChanged, targetTab } = createNavigationActions('visitors', dateRange, pageContext);

  let message = formatDataResponse('visitors', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
    const termEntry = findTermLocation('방문객');
    if (termEntry?.secondary && termEntry.secondary.length > 0) {
      const secondaryTab = termEntry.secondary[0].tab;
      if (secondaryTab) {
        message += ` (${getTabDisplayName(secondaryTab)}탭에서도 요약 정보 확인 가능)`;
      }
    }
  } else {
    message += '\n\n현재 탭에서 데이터를 확인할 수 있습니다.';
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '전환율 어때?', '체류 시간 알려줘'],
    data: responseData,
  };
}

/**
 * 전환율 조회 (RPC: get_overview_kpis — 퍼널 기반 전환율로 프론트엔드와 일치)
 */
async function queryConversion(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const funnelEntry = kpi?.funnel_entry ?? 0;
  const funnelPurchase = kpi?.funnel_purchase ?? 0;
  // 프론트엔드와 동일: purchase / entry * 100
  const conversionRate = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;

  const responseData = { conversionRate, totalVisitors: funnelEntry, totalTransactions: funnelPurchase };
  const { actions, tabChanged, targetTab } = createNavigationActions('conversion', dateRange, pageContext);

  let message = formatDataResponse('conversion', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '방문객 수 알려줘'],
    data: responseData,
  };
}

/**
 * 평균 객단가 조회 (RPC: get_overview_kpis)
 */
async function queryAvgTransaction(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const avgTransaction = kpi?.avg_transaction_value ?? 0;
  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;

  const responseData = { avgTransaction, totalRevenue, totalTransactions };
  const { actions, tabChanged, targetTab } = createNavigationActions('avgTransaction', dateRange, pageContext);

  let message = `평균 객단가는 ${Math.round(avgTransaction).toLocaleString()}원입니다.`;
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 전체 요약 조회 (RPC: get_overview_kpis — 퍼널 기반 전환율)
 */
async function querySummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('summary', dateRange, pageContext);

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 개요 데이터를 조회할 수 없습니다.`,
      suggestions: ['고객 여정 퍼널 보여줘', '고객탭 보여줘', '시뮬레이션 돌려줘'],
      data: null,
    };
  }

  const footfall = kpi.funnel_entry ?? kpi.total_visitors ?? 0;
  const totalRevenue = kpi.total_revenue ?? 0;
  const totalTransactions = kpi.total_transactions ?? 0;
  const funnelEntry = kpi.funnel_entry ?? 0;
  const funnelPurchase = kpi.funnel_purchase ?? 0;
  const conversionRate = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;

  let message = `${dateRange.startDate} ~ ${dateRange.endDate} 주요 지표입니다:\n` +
    `• 총 방문객: ${footfall.toLocaleString()}명\n` +
    `• 총 매출: ₩${totalRevenue.toLocaleString()}원\n` +
    `• 총 거래: ${totalTransactions.toLocaleString()}건\n` +
    `• 구매 전환율: ${conversionRate.toFixed(1)}%`;

  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['고객 여정 퍼널 보여줘', '고객탭 보여줘', '시뮬레이션 돌려줘'],
    data: { footfall, totalRevenue, totalTransactions, conversionRate },
  };
}

/**
 * 상품 판매량 조회 (RPC: get_product_performance — 상품명 포함)
 */
async function queryProduct(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('product', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const totalUnitsSold = products.reduce((sum: number, p: any) => sum + (p.units_sold || 0), 0);
  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalUnitsSold.toLocaleString()}개, 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
    suggestions: ['매출 알려줘', '재고 현황 알려줘'],
    data: { totalUnitsSold, totalRevenue },
  };
}

/**
 * 재고 현황 조회 (RPC: get_inventory_status — stock_status 분류 포함, 프론트엔드와 일치)
 */
async function queryInventory(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('inventory', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  if (!orgId) {
    return {
      actions,
      message: `조직 정보를 확인할 수 없습니다.${tabMessage}`,
      suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
      data: null,
    };
  }

  const items = await rpcInventoryStatus(supabase, orgId);
  const totalItems = items.length;
  const lowStockItems = items.filter((i: any) => i.stock_status === 'critical' || i.stock_status === 'low').length;
  const overstockItems = items.filter((i: any) => i.stock_status === 'overstock').length;

  return {
    actions,
    message: `현재 ${totalItems}개 상품 중 ${lowStockItems}개 상품이 재주문 필요(재고 부족), ${overstockItems}개 상품이 과잉 재고 상태입니다.${tabMessage}`,
    suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
    data: { totalItems, lowStockItems, overstockItems },
  };
}

/**
 * 목표 달성률 조회 (조건부 응답, 컨텍스트 인식)
 * - store_goals 테이블 사용 (프론트엔드 useGoals.ts와 동일)
 * - goal_type: revenue, visitors, conversion, avg_basket
 * - 목표 없음 시 목표 설정 다이얼로그 팝업 유도
 */
async function queryGoal(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const today = new Date().toISOString().split('T')[0];

  // RPC: get_store_goals (store_goals 테이블, 프론트엔드 useGoals.ts와 동일)
  let goals: any[] = [];
  try {
    goals = await rpcStoreGoals(supabase, storeId, today);
  } catch (e) {
    console.error('[queryGoal] RPC error:', e);
  }

  // 목표 설정이 없는 경우 → 목표 설정 다이얼로그 팝업 유도
  if (!goals || goals.length === 0) {
    return {
      actions: [
        { type: 'navigate', target: '/insights?tab=overview' },
        { type: 'open_modal', modalId: 'goal-settings' },
      ],
      message: '현재 설정된 목표가 없습니다. 목표를 설정하시면 달성률을 확인할 수 있어요.\n\n목표 설정 창을 열어드리겠습니다.',
      suggestions: ['매출 알려줘', '방문객 수 확인', '전환율 어때?'],
      data: { hasGoal: false },
    };
  }

  // 목표가 있는 경우 → RPC로 KPI 데이터 조회 후 달성률 계산
  const kpi = orgId
    ? await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate)
    : null;

  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalVisitors = kpi?.total_visitors ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;
  const funnelEntry = kpi?.funnel_entry ?? 0;
  const funnelPurchase = kpi?.funnel_purchase ?? 0;
  const avgConversion = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;
  const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // goal_type별 달성률 계산
  const goalTypeLabels: Record<string, string> = {
    revenue: '매출', visitors: '방문자', conversion: '전환율', avg_basket: '객단가',
  };
  const goalTypeUnits: Record<string, string> = {
    revenue: '원', visitors: '명', conversion: '%', avg_basket: '원',
  };

  const results = goals.map(goal => {
    let currentValue = 0;
    switch (goal.goal_type) {
      case 'revenue': currentValue = totalRevenue; break;
      case 'visitors': currentValue = totalVisitors; break;
      case 'conversion': currentValue = avgConversion; break;
      case 'avg_basket': currentValue = avgBasket; break;
    }
    const progress = goal.target_value > 0 ? Math.min(Math.round((currentValue / goal.target_value) * 100), 100) : 0;
    const remaining = Math.max(goal.target_value - currentValue, 0);
    return { ...goal, currentValue, progress, remaining };
  });

  // 전체 평균 달성률
  const overallRate = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.progress, 0) / results.length)
    : 0;

  const trend = overallRate >= 100 ? '목표를 달성했어요!' :
               overallRate >= 80 ? '목표 달성에 근접해 있어요.' :
               overallRate >= 50 ? '중간 정도 진행 중이에요.' : '목표까지 더 노력이 필요해요.';

  // 각 목표 상세 메시지 구성
  const details = results.map(r => {
    const label = goalTypeLabels[r.goal_type] || r.goal_type;
    const unit = goalTypeUnits[r.goal_type] || '';
    const currentStr = r.goal_type === 'conversion'
      ? `${r.currentValue.toFixed(1)}%`
      : `${formatNumber(Math.round(r.currentValue))}${unit}`;
    const targetStr = r.goal_type === 'conversion'
      ? `${r.target_value}%`
      : `${formatNumber(r.target_value)}${unit}`;
    return `• ${label}: ${currentStr} / ${targetStr} (${r.progress}%)`;
  }).join('\n');

  const { actions, tabChanged, targetTab } = createNavigationActions('goal', dateRange, pageContext);
  let message = `현재 목표 달성률은 평균 ${overallRate}%입니다. ${trend}\n\n${details}`;
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['목표 설정 변경하기', '매출 알려줘', '상세 분석 보기'],
    data: { overallRate, goals: results, hasGoal: true },
  };
}

/**
 * 체류 시간 조회 (RPC: get_overview_kpis — avg_dwell_minutes 사용)
 */
async function queryDwellTime(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('dwellTime', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  if (!orgId) {
    return {
      actions,
      message: `조직 정보를 확인할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
      data: null,
    };
  }

  // RPC: get_overview_kpis (avg_dwell_minutes = 가중평균 체류시간, 분 단위)
  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `체류 시간 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
      data: null,
    };
  }

  const avgDwellMinutes = kpi.avg_dwell_minutes ?? 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 평균 체류 시간은 ${Math.round(avgDwellMinutes)}분입니다.${tabMessage}`,
    suggestions: ['방문객 수 알려줘', '신규/재방문 비율'],
    data: { avgDwellTime: avgDwellMinutes },
  };
}

/**
 * 신규/재방문 고객 조회 (RPC: get_overview_kpis)
 */
async function queryNewVsReturning(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('newVsReturning', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `신규/재방문 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
      data: null,
    };
  }

  const totalVisitors = kpi.total_visitors ?? 0;
  const totalReturning = kpi.returning_visitors ?? 0;
  const totalNew = totalVisitors - totalReturning;
  const newRate = totalVisitors > 0 ? Math.round((totalNew / totalVisitors) * 100) : 0;
  const returnRate = totalVisitors > 0 ? Math.round((totalReturning / totalVisitors) * 100) : 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 고객 구성:\n• 신규 고객: ${totalNew.toLocaleString()}명 (${newRate}%)\n• 재방문 고객: ${totalReturning.toLocaleString()}명 (${returnRate}%)${tabMessage}`,
    suggestions: ['방문객 수 알려줘', '체류 시간 알려줘'],
    data: { newVisitors: totalNew, returningVisitors: totalReturning, newRate, returnRate },
  };
}

// ============================================
// 개요(Overview) 탭 추가 쿼리 핸들러
// ============================================

/**
 * 총 입장객(Footfall) 조회 (RPC: get_overview_kpis — funnel_entry 기반으로 프론트엔드와 일치)
 */
async function queryFootfall(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('footfall', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `입장객 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  const totalFootfall = kpi.funnel_entry ?? kpi.total_visitors ?? 0;
  const uniqueVisitors = kpi.unique_visitors ?? 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 입장객은 ${totalFootfall.toLocaleString()}명, 순 방문객은 ${uniqueVisitors.toLocaleString()}명입니다.${tabMessage}`,
    suggestions: ['매출 알려줘', '전환율 어때?', '방문 빈도 알려줘'],
    data: { totalFootfall, uniqueVisitors },
  };
}

/**
 * 방문 빈도 조회 (RPC: get_overview_kpis)
 */
async function queryVisitFrequency(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('visitFrequency', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `방문 빈도 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  const totalVisitors = kpi.total_visitors ?? 0;
  const returningVisitors = kpi.returning_visitors ?? 0;
  // 기간 일수 계산
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  const days = Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
  const avgDaily = Math.round(totalVisitors / days);
  const returnRate = totalVisitors > 0 ? Math.round((returningVisitors / totalVisitors) * 100) : 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 일평균 방문객은 ${avgDaily.toLocaleString()}명이며, 재방문율은 ${returnRate}%입니다.${tabMessage}`,
    suggestions: ['입장객 수 알려줘', '재방문율 알려줘', '매출 알려줘'],
    data: { avgDaily, returnRate, totalVisitors, days },
  };
}

/**
 * 고객 여정 퍼널 조회 (RPC: get_overview_kpis — 5개 퍼널 카운트 통합, 5회→1회 쿼리로 최적화)
 */
async function queryFunnel(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('funnel', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 퍼널을 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  const counts = {
    entry: kpi?.funnel_entry ?? 0,
    browse: kpi?.funnel_browse ?? 0,
    engage: kpi?.funnel_engage ?? 0,
    fitting: kpi?.funnel_fitting ?? 0,
    purchase: kpi?.funnel_purchase ?? 0,
  };

  if (counts.entry === 0) {
    return {
      actions,
      message: `퍼널 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매출 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  return {
    actions,
    message: `고객 여정 퍼널:\n• 입장(Entry): ${counts.entry.toLocaleString()}명\n• 탐색(Browse): ${counts.browse.toLocaleString()}명\n• 참여(Engage): ${counts.engage.toLocaleString()}명\n• 피팅(Fitting): ${counts.fitting.toLocaleString()}명\n• 구매(Purchase): ${counts.purchase.toLocaleString()}건${tabMessage}`,
    suggestions: ['전환율 올리려면?', '매출 알려줘', '목표 달성률 보여줘'],
    data: { funnel: counts },
  };
}

// ============================================
// 매장(Store) 탭 쿼리 핸들러 (DB 직접 조회)
// ============================================

/**
 * 존 데이터를 텍스트로 포맷하는 헬퍼
 */
function formatZoneList(zones: { name: string; visitors: number; avgDwellMinutes: number; conversionRate: string }[], limit = 5): string {
  return zones.slice(0, limit).map((z, i) =>
    `${i + 1}. ${z.name}: ${z.visitors.toLocaleString()}명 (체류 ${z.avgDwellMinutes}분, 전환율 ${z.conversionRate})`
  ).join('\n');
}

/**
 * itemFilter로 존 데이터를 필터링하는 헬퍼
 */
function filterZones(zones: { name: string; visitors: number; avgDwellMinutes: number; conversionRate: string }[], itemFilter?: string[]): {
  filtered: typeof zones;
  isFiltered: boolean;
} {
  if (!itemFilter || itemFilter.length === 0) return { filtered: zones, isFiltered: false };
  const filtered = zones.filter(z =>
    itemFilter.some(f => z.name.toLowerCase().includes(f.toLowerCase()))
  );
  return { filtered: filtered.length > 0 ? filtered : zones, isFiltered: filtered.length > 0 };
}

/**
 * 피크타임 조회 (RPC: get_hourly_visitors)
 */
async function queryPeakTime(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('peakTime', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  // RPC: get_hourly_visitors (hourly_visitors_agg 기반, hour별 SUM 사전 집계)
  let data: any[] = [];
  try {
    data = await rpcHourlyVisitors(supabase, storeId, dateRange.startDate, dateRange.endDate);
  } catch (e) {
    console.error('[queryPeakTime] RPC error:', e);
  }

  if (data.length === 0) {
    return {
      actions,
      message: `피크타임 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '방문객 알려줘'],
      data: null,
    };
  }

  const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
  const peak = sorted[0];
  const peakTime = peak ? `${peak.hour}시` : '확인 불가';
  const peakVisitors = peak ? Number(peak.visitor_count) : 0;

  return {
    actions,
    message: `피크타임은 ${peakTime}이며, 해당 시간대 방문객은 총 ${peakVisitors.toLocaleString()}명입니다.${tabMessage}`,
    suggestions: ['시간대별 방문 패턴 보여줘', '인기 존 알려줘', '매출 알려줘'],
    data: { peakTime, peakVisitors },
  };
}

/**
 * 인기 존 조회 (RPC: get_zone_metrics — zone_daily_metrics 기반으로 프론트엔드와 일치)
 */
async function queryPopularZone(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string,
  itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('popularZone', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 존 분석을 확인합니다.` : '';

  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (zones.length === 0) {
    return {
      actions,
      message: `존 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }

  // itemFilter 적용
  let results = zones;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = zones.filter((z: any) =>
      itemFilter.some(f => (z.zone_name || z.zone_id || '').toLowerCase().includes(f.toLowerCase()))
    );
    if (filtered.length > 0) {
      results = filtered;
      filterNote = ` (${itemFilter.join(', ')} 필터 적용)`;
    }
  }

  const topZone = results[0];
  const zoneList = results.slice(0, 5).map((z: any, i: number) =>
    `${i + 1}. ${z.zone_name || z.zone_id}: ${(z.visitors || 0).toLocaleString()}명 (체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분)`
  ).join('\n');

  return {
    actions,
    message: `가장 인기 있는 존은 "${topZone.zone_name || topZone.zone_id}"입니다.${filterNote}\n\n${zoneList}${tabMessage}`,
    suggestions: ['존 체류시간 분석', '피크타임 알려줘', '매출 알려줘'],
    data: { zones: results },
  };
}

/**
 * 센서 커버율 조회 (RPC: get_zones_dim_list)
 */
async function queryTrackingCoverage(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('trackingCoverage', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 확인합니다.` : '';

  // RPC: get_zones_dim_list (zones_dim 테이블, 프론트엔드와 동일)
  let zones: any[] = [];
  try {
    zones = await rpcZonesDimList(supabase, storeId);
  } catch (e) {
    console.error('[queryTrackingCoverage] RPC error:', e);
  }

  if (zones.length === 0) {
    return {
      actions,
      message: `센서 커버율 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }

  const totalZones = zones.length;
  const activeZones = zones.filter((z: any) => z.is_active !== false).length;
  const coverage = totalZones > 0 ? Math.round((activeZones / totalZones) * 100) : 0;

  return {
    actions,
    message: `센서 커버율은 ${coverage}%입니다 (${activeZones}/${totalZones} 존 활성).${tabMessage}`,
    suggestions: ['인기 존 알려줘', '피크타임 알려줘', '존 분석 보여줘'],
    data: { coverage, activeZones, totalZones },
  };
}

/**
 * 시간대별 방문 패턴 조회 (RPC: get_hourly_visitors, 특정 시간 필터 지원)
 */
async function queryHourlyPattern(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  hour?: number
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('hourlyPattern', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 시간대별 차트를 확인합니다.` : '';

  // RPC: get_hourly_visitors (hourly_visitors_agg 기반, hour별 SUM 사전 집계)
  let data: any[] = [];
  try {
    data = await rpcHourlyVisitors(supabase, storeId, dateRange.startDate, dateRange.endDate);
  } catch (e) {
    console.error('[queryHourlyPattern] RPC error:', e);
  }

  if (data.length === 0) {
    return {
      actions,
      message: `시간대별 방문 패턴 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }

  // RPC가 이미 hour별 SUM을 반환하므로 바로 hourlyMap 구성
  const hourlyMap: Record<number, number> = {};
  data.forEach((row: any) => {
    hourlyMap[row.hour] = row.visitor_count || 0;
  });

  // 특정 시간 질의
  if (hour !== undefined && hour >= 0 && hour <= 23) {
    const visitors = hourlyMap[hour] || 0;
    const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
    const peak = sorted[0];
    return {
      actions,
      message: `${dateRange.startDate} ${hour}시의 방문객은 ${visitors.toLocaleString()}명입니다.\n(피크타임: ${peak?.hour ?? '-'}시 ${Number(peak?.visitor_count || 0).toLocaleString()}명)${tabMessage}`,
      suggestions: ['피크타임 알려줘', '시간대별 전체 패턴 보여줘', '인기 존 알려줘'],
      data: { hour, visitors },
    };
  }

  const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
  const top3 = sorted.slice(0, 3).map((r: any) => `${r.hour}시: ${Number(r.visitor_count || 0).toLocaleString()}명`).join(', ');

  return {
    actions,
    message: `시간대별 방문 패턴 TOP 3: ${top3}${tabMessage}`,
    suggestions: ['피크타임 알려줘', '인기 존 알려줘', '방문객 알려줘'],
    data: { hourlyMap },
  };
}

/**
 * 존 분석 (체류시간/방문자 분포) 조회 (RPC: get_zone_metrics)
 */
async function queryZoneAnalysis(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string,
  itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('zoneAnalysis', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 존 분석을 확인합니다.` : '';

  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (zones.length === 0) {
    return {
      actions,
      message: `존 분석 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }

  // itemFilter 적용
  let results = zones;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = zones.filter((z: any) =>
      itemFilter.some(f => (z.zone_name || z.zone_id || '').toLowerCase().includes(f.toLowerCase()))
    );
    if (filtered.length > 0) {
      results = filtered;
      filterNote = ` (${itemFilter.join(', ')} 필터 적용)`;
    }
  }

  const zoneList = results.slice(0, 5).map((z: any) =>
    `• ${z.zone_name || z.zone_id}: 방문 ${(z.visitors || 0).toLocaleString()}명, 체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분`
  ).join('\n');

  return {
    actions,
    message: `존별 분석 결과${filterNote}:\n${zoneList}${tabMessage}`,
    suggestions: ['인기 존 알려줘', '피크타임 알려줘', '체류시간 알려줘'],
    data: { zones: results },
  };
}

/**
 * 매장 평균 체류시간 조회
 */
function queryStoreDwell(
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  return createGenericNavigationResult('storeDwell', dateRange, pageContext);
}

/**
 * 매장 탭 종합 요약 (RPC: get_hourly_visitors + get_zone_metrics)
 */
async function queryStoreSummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('storeSummary', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';

  // RPC 병렬 조회: get_hourly_visitors + get_zone_metrics
  const [hourlyData, zones] = await Promise.all([
    rpcHourlyVisitors(supabase, storeId, dateRange.startDate, dateRange.endDate),
    rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate),
  ]);

  if (hourlyData.length === 0 && zones.length === 0) {
    return {
      actions,
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 매장 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['시간대별 방문 패턴 보여줘', '존 분석 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }

  // 피크타임 계산 (RPC가 이미 hour별 SUM 반환)
  let peakTime = '확인 불가';
  let peakVisitors = 0;
  if (hourlyData.length > 0) {
    const sorted = [...hourlyData].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
    const peak = sorted[0];
    if (peak) {
      peakTime = `${peak.hour}시`;
      peakVisitors = Number(peak.visitor_count);
    }
  }

  // 인기 존 계산 (RPC 결과 사용)
  let popularZone = '확인 불가';
  let topZonesText = '';
  if (zones.length > 0) {
    popularZone = zones[0].zone_name || zones[0].zone_id;
    topZonesText = zones.slice(0, 3).map((z: any) =>
      `  • ${z.zone_name || z.zone_id}: ${(z.visitors || 0).toLocaleString()}명 (체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분)`
    ).join('\n');
  }

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 매장 주요 지표입니다:\n` +
      `• 피크타임: ${peakTime} (${peakVisitors.toLocaleString()}명)\n` +
      `• 인기 존: ${popularZone}\n` +
      `• 운영 존: ${zones.length}개\n` +
      (topZonesText ? `\n존별 방문 TOP 3:\n${topZonesText}` : '') +
      tabMessage,
    suggestions: ['시간대별 방문 패턴 보여줘', '존 분석 보여줘', '피크타임 알려줘'],
    data: { peakTime, peakVisitors, popularZone, zones },
  };
}

// ============================================
// 고객(Customer) 탭 추가 쿼리 핸들러
// ============================================

/**
 * 재방문율 조회 (RPC: get_overview_kpis)
 */
async function queryRepeatRate(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('repeatRate', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `재방문율 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['고객탭 보여줘', '방문객 알려줘'],
      data: null,
    };
  }

  const totalVisitors = kpi.total_visitors ?? 0;
  const returningVisitors = kpi.returning_visitors ?? 0;
  const repeatRate = totalVisitors > 0 ? Math.round((returningVisitors / totalVisitors) * 100) : 0;

  return {
    actions,
    message: `재방문율은 ${repeatRate}%입니다 (재방문 고객 ${returningVisitors.toLocaleString()}명 / 전체 ${totalVisitors.toLocaleString()}명).${tabMessage}`,
    suggestions: ['고객 세그먼트 보여줘', '충성 고객 알려줘', '방문객 알려줘'],
    data: { repeatRate, returningVisitors, totalVisitors },
  };
}

/**
 * 고객 세그먼트 조회 (RPC: get_customer_segments — segment_name 기준, 프론트엔드와 일치)
 */
async function queryCustomerSegment(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('customerSegment', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 세그먼트 분포를 확인합니다.` : '';

  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (segments.length === 0) {
    return {
      actions,
      message: `고객 세그먼트 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['고객탭 보여줘', '방문객 알려줘'],
      data: null,
    };
  }

  const segmentList = segments.map((s: any) =>
    `• ${s.segment_name}: ${(s.customer_count || 0).toLocaleString()}명`
  ).join('\n');

  const topSegment = segments[0];

  return {
    actions,
    message: `주요 세그먼트는 "${topSegment?.segment_name || '-'}"입니다.\n\n${segmentList}${tabMessage}`,
    suggestions: ['재방문율 알려줘', '충성 고객 알려줘', '체류시간 알려줘'],
    data: { segments, topSegment: topSegment?.segment_name },
  };
}

/**
 * 충성 고객 조회 (RPC: get_customer_segments — segment_name 필터)
 */
async function queryLoyalCustomers(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('loyalCustomers', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const loyalKeywords = ['loyal', 'vip', 'champion', '충성', 'VIP'];
  const loyalSegments = segments.filter((s: any) =>
    loyalKeywords.some(kw => (s.segment_name || '').toLowerCase().includes(kw.toLowerCase()))
  );

  if (loyalSegments.length === 0) {
    return {
      actions,
      message: `충성 고객 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['고객 세그먼트 보여줘', '재방문율 알려줘'],
      data: null,
    };
  }

  const totalLoyal = loyalSegments.reduce((sum: number, s: any) => sum + (s.customer_count || 0), 0);
  const avgRevenue = loyalSegments.reduce((sum: number, s: any) => sum + (s.avg_transaction_value || 0), 0) / loyalSegments.length;

  return {
    actions,
    message: `충성 고객은 총 ${totalLoyal.toLocaleString()}명이며, 평균 구매금액은 ${formatNumber(Math.round(avgRevenue))}원입니다.${tabMessage}`,
    suggestions: ['고객 세그먼트 보여줘', '재방문율 알려줘', '매출 알려줘'],
    data: { totalLoyal, avgRevenue },
  };
}

// ============================================
// 상품(Product) 탭 추가 쿼리 핸들러
// ============================================

/**
 * TOP 상품 조회 (RPC: get_product_performance — 상품명 포함, product_id별 사전 집계)
 */
async function queryTopProducts(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('topProducts', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (products.length === 0) {
    return {
      actions,
      message: `상품 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['상품탭 보여줘', '매출 알려줘'],
      data: null,
    };
  }

  // RPC가 이미 매출 DESC 정렬 + product_id별 집계 완료
  const top5 = products.slice(0, 5);
  const productList = top5.map((p: any, i: number) =>
    `${i + 1}. ${p.product_name || '상품#' + p.product_id}: ${formatNumber(p.revenue || 0)}원 (${(p.units_sold || 0).toLocaleString()}개)`
  ).join('\n');

  return {
    actions,
    message: `매출 TOP 5 상품:\n${productList}${tabMessage}`,
    suggestions: ['카테고리 분석 보여줘', '판매량 알려줘', '재고 현황 알려줘'],
    data: { topProducts: top5 },
  };
}

/**
 * 카테고리 분석 조회 (RPC: get_product_performance — 카테고리명 포함)
 */
async function queryCategoryAnalysis(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('categoryAnalysis', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 카테고리 분석을 확인합니다.` : '';

  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (products.length === 0) {
    return {
      actions,
      message: `카테고리 분석 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['상품탭 보여줘', '매출 알려줘'],
      data: null,
    };
  }

  // 카테고리별 집계 (RPC는 상품별이므로 category로 재그룹핑)
  const catMap: Record<string, { units: number; revenue: number }> = {};
  products.forEach((p: any) => {
    const cat = p.category || '기타';
    if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
    catMap[cat].units += p.units_sold || 0;
    catMap[cat].revenue += p.revenue || 0;
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1].revenue - a[1].revenue);
  const catList = sorted.slice(0, 5).map(([cat, v]) =>
    `• ${cat}: ${formatNumber(v.revenue)}원 (${v.units.toLocaleString()}개)`
  ).join('\n');

  return {
    actions,
    message: `카테고리별 매출:\n${catList}${tabMessage}`,
    suggestions: ['TOP 상품 보여줘', '판매량 알려줘', '재고 현황 알려줘'],
    data: { categories: catMap },
  };
}

/**
 * 총 판매량 조회 (RPC: get_product_performance)
 */
async function queryUnitsSold(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('unitsSold', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const totalUnits = products.reduce((sum: number, p: any) => sum + (p.units_sold || 0), 0);
  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalUnits.toLocaleString()}개, 총 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
    suggestions: ['TOP 상품 보여줘', '카테고리 분석 보여줘', '재고 현황 알려줘'],
    data: { totalUnits, totalRevenue },
  };
}

// ============================================
// 재고(Inventory) 탭 추가 쿼리 핸들러
// ============================================

/**
 * 과잉 재고 조회 (RPC: get_inventory_status)
 */
async function queryOverstock(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('overstock', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }

  const items = await rpcInventoryStatus(supabase, orgId);
  const overstockItems = items.filter((i: any) => i.stock_status === 'overstock');

  return {
    actions,
    message: `과잉 재고 상품은 ${overstockItems.length}개입니다 (전체 ${items.length}개 중).${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '재고 현황 보여줘', '재고 최적화 추천'],
    data: { overstockCount: overstockItems.length, totalItems: items.length },
  };
}

/**
 * 재고 부족 경고 조회 (RPC: get_inventory_status)
 */
async function queryStockAlert(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockAlert', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }

  const items = await rpcInventoryStatus(supabase, orgId);
  const lowStockItems = items.filter((i: any) => i.stock_status === 'critical');

  return {
    actions,
    message: `재고 부족 경고 상품은 ${lowStockItems.length}개입니다 (전체 ${items.length}개 중). 재주문이 필요합니다.${tabMessage}`,
    suggestions: ['과잉 재고 알려줘', '재고 현황 보여줘', '입출고 내역 보여줘'],
    data: { lowStockCount: lowStockItems.length, totalItems: items.length },
  };
}

/**
 * 입출고 내역 조회 (RPC: get_inventory_movements)
 */
async function queryStockMovement(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockMovement', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }

  // RPC: get_inventory_movements (moved_at 기준, products JOIN, 프론트엔드와 동일)
  let data: any[] = [];
  try {
    data = await rpcInventoryMovements(supabase, orgId, dateRange.startDate, dateRange.endDate, 10);
  } catch (e) {
    console.error('[queryStockMovement] RPC error:', e);
  }

  if (data.length === 0) {
    return {
      actions,
      message: `해당 기간의 입출고 내역이 없습니다.${tabMessage}`,
      suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘'],
      data: null,
    };
  }

  const inCount = data.filter((m: any) => m.movement_type === 'in' || m.movement_type === 'inbound' || m.movement_type === '입고').length;
  const outCount = data.filter((m: any) => m.movement_type === 'out' || m.movement_type === 'outbound' || m.movement_type === '출고').length;

  return {
    actions,
    message: `최근 입출고 내역: 입고 ${inCount}건, 출고 ${outCount}건 (총 ${data.length}건).${tabMessage}`,
    suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘', '과잉 재고 알려줘'],
    data: { movements: data, inCount, outCount },
  };
}

/**
 * 재고 상태 분포 조회 (RPC: get_inventory_status — stock_status 분류 사용)
 */
async function queryStockDistribution(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockDistribution', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 분포 차트를 확인합니다.` : '';

  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }

  const items = await rpcInventoryStatus(supabase, orgId);
  const total = items.length;
  const lowStock = items.filter((i: any) => i.stock_status === 'critical' || i.stock_status === 'low').length;
  const overstock = items.filter((i: any) => i.stock_status === 'overstock').length;
  const healthy = items.filter((i: any) => i.stock_status === 'normal').length;

  return {
    actions,
    message: `재고 상태 분포:\n• 정상: ${healthy}개 (${total > 0 ? Math.round((healthy / total) * 100) : 0}%)\n• 부족: ${lowStock}개 (${total > 0 ? Math.round((lowStock / total) * 100) : 0}%)\n• 과잉: ${overstock}개 (${total > 0 ? Math.round((overstock / total) * 100) : 0}%)${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '과잉 재고 알려줘', '입출고 내역 보여줘'],
    data: { total, lowStock, overstock, healthy },
  };
}

// ============================================
// ROI 측정 전용 쿼리 핸들러
// ============================================

/**
 * ROI 요약 KPI 조회 (RPC: get_applied_strategies)
 */
async function queryROISummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';

  try {
    // RPC: get_applied_strategies (날짜 필터 적용)
    const data = await rpcAppliedStrategies(supabase, storeId, dateRange.startDate, dateRange.endDate);

    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `해당 기간에 적용된 전략이 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['기간 변경해줘', '전체 기간으로 보여줘', '인사이트 허브로 가줘'],
      };
    }

    const totalApplied = data.length;
    const successCount = data.filter((s: any) => s.result === 'success' || s.status === 'completed').length;
    const successRate = totalApplied > 0 ? Math.round((successCount / totalApplied) * 100) : 0;
    const rois = data.filter((s: any) => s.final_roi != null || s.current_roi != null);
    const avgRoi = rois.length > 0
      ? Math.round(rois.reduce((sum: number, s: any) => sum + (s.final_roi ?? s.current_roi ?? 0), 0) / rois.length)
      : 0;
    const totalRevenueImpact = data.reduce((sum: number, s: any) => sum + (s.actual_revenue || 0), 0);

    const message = `ROI 요약 (${dateRange.startDate} ~ ${dateRange.endDate}):\n` +
      `• 총 적용 전략: ${totalApplied}개\n` +
      `• 성공률: ${successRate}%\n` +
      `• 평균 ROI: ${avgRoi}%\n` +
      `• 총 추가매출: ${formatNumber(totalRevenueImpact)}원` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');

    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['적용된 전략 이력 보여줘', '카테고리별 성과 보여줘', '인사이트 허브로 가줘'],
      data: { totalApplied, successRate, avgRoi, totalRevenueImpact },
    };
  } catch (error) {
    console.error('[queryROISummary] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: 'ROI 데이터를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘', '매출 알려줘'],
    };
  }
}

/**
 * 적용된 전략 이력 조회 (RPC: get_applied_strategies)
 */
async function queryAppliedStrategies(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';

  try {
    // RPC: get_applied_strategies (날짜 필터 없이 최근 10건)
    const data = await rpcAppliedStrategies(supabase, storeId, undefined, undefined, 10);

    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `적용된 전략 이력이 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['AI추천탭 보여줘', '인사이트 허브로 가줘'],
      };
    }

    const statusLabels: Record<string, string> = {
      completed: '완료', active: '진행중', pending: '대기', failed: '실패',
    };
    const resultLabels: Record<string, string> = {
      success: '성공', failure: '실패', partial: '부분성공', pending: '대기',
    };

    const strategyList = data.slice(0, 5).map((s: any) => {
      const status = statusLabels[s.status] || s.status || '-';
      const result = s.result ? (resultLabels[s.result] || s.result) : '-';
      const roi = s.final_roi ?? s.current_roi;
      const roiStr = roi != null ? ` (ROI: ${roi}%)` : '';
      return `• ${s.name || s.source_module || '전략'}: ${status}/${result}${roiStr}`;
    }).join('\n');

    const message = `최근 적용된 전략 (${data.length}건):\n\n${strategyList}` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');

    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['ROI 요약 보여줘', '카테고리별 성과 보여줘', 'AI추천탭 보여줘'],
      data: { strategies: data },
    };
  } catch (error) {
    console.error('[queryAppliedStrategies] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: '적용된 전략 이력을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘'],
    };
  }
}

/**
 * ROI 카테고리별 성과 조회 (RPC: get_applied_strategies)
 */
async function queryROICategoryPerformance(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';

  try {
    // RPC: get_applied_strategies (날짜 필터 적용)
    const data = await rpcAppliedStrategies(supabase, storeId, dateRange.startDate, dateRange.endDate);

    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `해당 기간에 카테고리별 성과 데이터가 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['기간 변경해줘', 'ROI 요약 보여줘'],
      };
    }

    // source별 (insight_hub = 2D, studio = 3D) 그룹핑
    const sourceLabels: Record<string, string> = {
      insight_hub: '2D 시뮬레이션 (인사이트 허브)',
      studio: '3D 시뮬레이션 (디지털트윈)',
    };

    const grouped: Record<string, { count: number; successCount: number; totalRevenue: number; totalRoi: number; roiCount: number }> = {};
    data.forEach((s: any) => {
      const key = s.source || 'other';
      if (!grouped[key]) grouped[key] = { count: 0, successCount: 0, totalRevenue: 0, totalRoi: 0, roiCount: 0 };
      grouped[key].count++;
      if (s.result === 'success' || s.status === 'completed') grouped[key].successCount++;
      grouped[key].totalRevenue += s.actual_revenue || 0;
      const roi = s.final_roi ?? s.current_roi;
      if (roi != null) { grouped[key].totalRoi += roi; grouped[key].roiCount++; }
    });

    const lines = Object.entries(grouped).map(([source, g]) => {
      const label = sourceLabels[source] || source;
      const avgRoi = g.roiCount > 0 ? Math.round(g.totalRoi / g.roiCount) : 0;
      const successRate = g.count > 0 ? Math.round((g.successCount / g.count) * 100) : 0;
      return `[${label}]\n  전략 수: ${g.count}개 | 성공률: ${successRate}% | 평균 ROI: ${avgRoi}% | 추가매출: ${formatNumber(g.totalRevenue)}원`;
    }).join('\n\n');

    const message = `카테고리별 성과:\n\n${lines}` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');

    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['ROI 요약 보여줘', '적용된 전략 이력 보여줘', '인사이트 허브로 가줘'],
      data: { categories: grouped },
    };
  } catch (error) {
    console.error('[queryROICategoryPerformance] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: '카테고리별 성과를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘'],
    };
  }
}

// ============================================
// ROI 테이블 제어 핸들러 (필터/내보내기/페이지)
// ============================================

/**
 * 적용 이력 테이블 필터 설정
 */
function handleFilterStrategies(
  classification: ClassificationResult,
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];
  const filterMessages: string[] = [];

  if (!isOnROI) {
    actions.push({ type: 'navigate', target: '/roi' });
  }

  // 상태 필터
  const statusFilter = classification.entities.filter?.status;
  if (statusFilter) {
    actions.push({ type: 'set_filter', filterId: 'status', value: statusFilter });
    const statusLabels: Record<string, string> = {
      active: '진행 중', completed: '완료', cancelled: '취소', all: '전체',
    };
    filterMessages.push(`상태: ${statusLabels[statusFilter] || statusFilter}`);
  }

  // 출처 필터
  const sourceFilter = classification.entities.filter?.source;
  if (sourceFilter) {
    actions.push({ type: 'set_filter', filterId: 'source', value: sourceFilter });
    const sourceLabels: Record<string, string> = {
      '2d_simulation': '2D 시뮬레이션', '3d_simulation': '3D 시뮬레이션', all: '전체',
    };
    filterMessages.push(`출처: ${sourceLabels[sourceFilter] || sourceFilter}`);
  }

  const message = filterMessages.length > 0
    ? `적용 이력 필터를 변경합니다. (${filterMessages.join(', ')})`
    : '적용 이력 테이블로 이동합니다.';

  return {
    actions,
    message,
    suggestions: ['완료된 전략만 보여줘', '3D 시뮬레이션 전략만', '전체 보기', '내보내기 해줘'],
  };
}

/**
 * 적용 이력 내보내기 트리거
 */
function handleExportStrategies(
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];

  if (!isOnROI) {
    actions.push({ type: 'navigate', target: '/roi' });
  }

  actions.push({ type: 'trigger_export', exportType: 'strategies' });

  return {
    actions,
    message: '적용 이력을 CSV 파일로 내보냅니다.',
    suggestions: ['ROI 요약 보여줘', '카테고리별 성과 보여줘'],
  };
}

/**
 * 적용 이력 테이블 페이지 이동
 */
function handleRoiTablePage(
  classification: ClassificationResult,
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];

  if (!isOnROI) {
    actions.push({ type: 'navigate', target: '/roi' });
  }

  const tablePage = classification.entities.tablePage || 'next';
  actions.push({ type: 'set_table_page', page: tablePage });

  const pageLabel = tablePage === 'next' ? '다음' : tablePage === 'prev' ? '이전' : `${tablePage}`;

  return {
    actions,
    message: `적용 이력 ${pageLabel} 페이지로 이동합니다.`,
    suggestions: ['다음 페이지', '이전 페이지', '첫 페이지'],
  };
}

// ============================================
// 데이터 컨트롤타워 전용 쿼리 핸들러
// ============================================

/**
 * RPC 결과에서 통합 소스 목록 생성 (coverage + data_sources 병합)
 * 프론트엔드와 동일한 5개 비즈니스 소스만 포함: pos, sensor, crm, product, erp
 * RPC가 zone을 반환하면 무시 (프론트엔드는 ensureERPCoverage로 erp를 별도 추가)
 */
function buildUnifiedSources(status: any): Array<{
  key: string;
  name: string;
  status: string;
  available: boolean;
  recordCount: number;
}> {
  const coverage = status?.quality_score?.coverage || {};
  const dataSources = status?.data_sources || {};

  // 프론트엔드와 동일한 5개 비즈니스 소스만 표시
  const KNOWN_SOURCES: Array<{ key: string; name: string }> = [
    { key: 'pos', name: 'POS/매출 데이터' },
    { key: 'sensor', name: 'NEURALSENSE 센서' },
    { key: 'crm', name: 'CRM/고객 데이터' },
    { key: 'product', name: '상품 마스터' },
    { key: 'erp', name: 'ERP/재고 데이터' },
  ];

  return KNOWN_SOURCES.map(({ key, name }) => {
    const cov = coverage[key];
    const ds = dataSources[key];
    return {
      key,
      name: ds?.name ? `${ds.name}` : cov?.label || name,
      status: ds?.status || (cov?.available ? 'active' : 'inactive'),
      available: cov?.available ?? ((ds?.status === 'active') || false),
      recordCount: cov?.record_count || 0,
    };
  });
}

/**
 * 데이터 품질 점수 조회
 */
async function queryDataQuality(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    const { data, error } = await supabase
      .rpc('get_data_control_tower_status', {
        p_store_id: storeId,
        p_limit: 5,
      });

    if (error) throw error;

    const status = data as any;
    const score = status?.quality_score;

    if (!score) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '데이터 품질 점수를 조회할 수 없습니다. 데이터 컨트롤타워에서 확인해 주세요.',
        suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
      };
    }

    // 통합 소스 목록으로 품질 점수 재계산 (프론트엔드와 동일한 방식)
    const sources = buildUnifiedSources(status);
    const availableCount = sources.filter(s => s.available).length;
    const totalCount = sources.length || 5;
    const overallScore = score.overall_score || Math.round((availableCount / totalCount) * 100);
    const confidenceLevel = score.confidence_level || (overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low');

    const gradeEmoji = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D';
    const confidenceLabel = confidenceLevel === 'high' ? '높음' : confidenceLevel === 'medium' ? '보통' : '낮음';

    const coverageLines = sources.map(src => {
      const statusText = src.available ? '연동' : '미연동';
      const count = src.recordCount > 0 ? ` (${src.recordCount.toLocaleString()}건)` : '';
      return `• ${src.name}: ${statusText}${count}`;
    }).join('\n');

    const warningCount = score.warning_count || 0;
    const warningNote = warningCount > 0 ? `\n\n${warningCount}건의 경고가 있습니다.` : '';

    const message = `현재 데이터 품질 점수는 ${overallScore}점 (${gradeEmoji})입니다.\n신뢰도: ${confidenceLabel}\n\n${coverageLines}${warningNote}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['연결된 소스 뭐 있어?', '새 연결 추가해줘', '데이터 흐름 현황 확인'],
      data: { overallScore, confidenceLevel, sources },
    };
  } catch (error) {
    console.error('[queryDataQuality] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '데이터 품질 점수를 조회하는 중 오류가 발생했습니다.' +
        (!isOnControlTower ? ' 데이터 컨트롤타워에서 직접 확인해 주세요.' : ''),
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

/**
 * 비즈니스 데이터 소스 연결 현황 조회
 * coverage + data_sources를 병합하여 통합 목록 생성
 */
async function queryDataSources(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    const { data, error } = await supabase
      .rpc('get_data_control_tower_status', {
        p_store_id: storeId,
        p_limit: 20,
      });

    if (error) throw error;

    const status = data as any;
    const sources = buildUnifiedSources(status);

    if (sources.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 비즈니스 데이터 소스가 없습니다. 새 연결을 추가해 보세요.',
        suggestions: ['새 연결 추가해줘', '데이터 컨트롤타워로 가줘'],
      };
    }

    const sourceList = sources.map(src => {
      const statusLabel = src.status === 'active' ? '활성' : src.status === 'error' ? '오류' : '비활성';
      const count = src.recordCount > 0 ? ` (${src.recordCount.toLocaleString()}건)` : '';
      return `• ${src.name}: ${statusLabel}${count}`;
    }).join('\n');

    const activeCount = sources.filter(s => s.status === 'active').length;

    const message = `현재 ${sources.length}개 비즈니스 데이터 소스가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${sourceList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['컨텍스트 데이터 소스 확인', '데이터 품질 점수 알려줘', '새 연결 추가해줘'],
      data: { totalSources: sources.length, activeCount },
    };
  } catch (error) {
    console.error('[queryDataSources] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '비즈니스 데이터 소스 현황을 조회하는 중 오류가 발생했습니다.' +
        (!isOnControlTower ? ' 데이터 컨트롤타워에서 직접 확인해 주세요.' : ''),
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

/**
 * 컨텍스트 데이터 소스 조회 (날씨, 공휴일/이벤트)
 * api_connections 테이블에서 connection_category='context' 조회
 */
async function queryContextDataSources(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }

    // 컨텍스트 데이터 소스 조회
    const { data: connections, error } = await supabase
      .from('api_connections')
      .select('id, name, provider, data_category, is_active, status, total_records_synced, last_sync, description')
      .eq('org_id', orgId)
      .or('connection_category.eq.context,data_category.in.(weather,holidays)')
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!connections || connections.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 컨텍스트 데이터 소스가 없습니다. 날씨/공휴일 데이터 연동을 설정해 보세요.',
        suggestions: ['비즈니스 데이터 소스 확인', '새 연결 추가해줘'],
      };
    }

    const sourceList = connections.map((conn: any) => {
      const isActive = conn.is_active || conn.status === 'active';
      const statusLabel = isActive ? '활성' : '비활성';
      const records = conn.total_records_synced ? ` (${conn.total_records_synced.toLocaleString()}건)` : '';
      const desc = conn.description ? ` — ${conn.description}` : '';
      return `• ${conn.name}: ${statusLabel}${records}${desc}`;
    }).join('\n');

    const activeCount = connections.filter((c: any) => c.is_active || c.status === 'active').length;

    const message = `현재 ${connections.length}개 컨텍스트 데이터 소스가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${sourceList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['비즈니스 데이터 소스 확인', '데이터 품질 점수 알려줘', '데이터 흐름 현황 확인'],
      data: { totalSources: connections.length, activeCount },
    };
  } catch (error) {
    console.error('[queryContextDataSources] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '컨텍스트 데이터 소스 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘', '비즈니스 데이터 소스 확인'],
    };
  }
}

/**
 * 데이터 흐름(파이프라인) 현황 조회
 * RPC data_flows가 없으면 coverage 기반으로 직접 생성 (프론트엔드 ensureERPCoverage와 동일)
 */
async function queryPipelineStatus(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    const { data, error } = await supabase
      .rpc('get_data_control_tower_status', {
        p_store_id: storeId,
        p_limit: 5,
      });

    if (error) throw error;

    const status = data as any;
    const pipeline = status?.pipeline_stats || {};
    const coverage = status?.quality_score?.coverage || {};

    // data_flows가 없으면 coverage 기반으로 생성 (프론트엔드와 동일 로직)
    let dataFlows = pipeline.data_flows || [];
    if (dataFlows.length === 0) {
      const l3Records = pipeline.l3_records || 0;
      const rawTotal = pipeline.raw_imports?.total || 0;
      const rawCompleted = pipeline.raw_imports?.completed || 0;

      dataFlows = [
        { label: 'POS', source: 'pos', inputCount: coverage.pos?.record_count || 0, outputTable: 'transactions', outputCount: coverage.pos?.record_count || 0, kpiConnected: l3Records > 0 && (coverage.pos?.record_count || 0) > 0, status: (coverage.pos?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '센서', source: 'sensor', inputCount: coverage.sensor?.record_count || 0, outputTable: 'zone_events', outputCount: pipeline.l2_records || coverage.sensor?.record_count || 0, kpiConnected: l3Records > 0 && (coverage.sensor?.record_count || 0) > 0, status: (coverage.sensor?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '고객', source: 'customer', inputCount: coverage.crm?.record_count || 0, outputTable: 'customers', outputCount: coverage.crm?.record_count || 0, kpiConnected: false, status: (coverage.crm?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '재고', source: 'inventory', inputCount: coverage.erp?.record_count || 0, outputTable: 'inventory_levels', outputCount: coverage.erp?.record_count || 0, kpiConnected: false, status: (coverage.erp?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '파일', source: 'import', inputCount: rawTotal, outputTable: 'user_data_imports', outputCount: rawCompleted, kpiConnected: false, status: rawTotal > 0 ? 'active' : 'inactive' },
      ];
    }

    const activeFlows = dataFlows.filter((f: any) => f.status === 'active').length;
    const kpiConnected = dataFlows.filter((f: any) => f.kpiConnected).length;
    const l3Records = pipeline.l3_records || 0;

    // 파이프라인 건강 상태
    const health = pipeline.pipeline_health || {};
    const healthStatus = health.status === 'healthy' ? '정상' : health.status === 'warning' ? '주의' : (activeFlows >= 3 ? '정상' : activeFlows >= 1 ? '주의' : '확인 필요');
    const healthMessage = health.message || '';

    const flowLines = dataFlows.map((flow: any) => {
      const statusText = flow.status === 'active' ? '활성' : '비활성';
      const input = flow.inputCount ? flow.inputCount.toLocaleString() : '0';
      const output = flow.outputCount ? flow.outputCount.toLocaleString() : '0';
      const kpi = flow.kpiConnected ? ' → KPI 연결' : '';
      return `• ${flow.label}: ${statusText} (${input}건 → ${flow.outputTable} ${output}건${kpi})`;
    }).join('\n');

    const message = `데이터 흐름 현황:\n\n` +
      `활성 소스: ${activeFlows}/${dataFlows.length}개 | KPI 연결: ${kpiConnected}개 | L3 집계: ${l3Records.toLocaleString()}건\n\n` +
      flowLines +
      (healthMessage ? `\n\n${healthMessage}` : '') +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '연결된 소스 확인', '임포트 히스토리 보여줘'],
      data: { healthStatus, activeFlows, totalFlows: dataFlows.length, kpiConnected, l3Records },
    };
  } catch (error) {
    console.error('[queryPipelineStatus] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '데이터 흐름 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

/**
 * API 연결 현황 조회 (api_connections 테이블 — 프론트엔드 "API 연결" 카드와 동일)
 */
async function queryApiConnections(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }

    const { data: connections, error } = await supabase
      .from('api_connections')
      .select('id, name, type, provider, data_category, connection_category, is_active, status, total_records_synced, last_sync')
      .eq('org_id', orgId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!connections || connections.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 API가 없습니다. 새 연결을 추가해 보세요.',
        suggestions: ['새 연결 추가해줘', '데이터 컨트롤타워로 가줘'],
      };
    }

    const connList = connections.map((conn: any) => {
      const isActive = conn.is_active || conn.status === 'active';
      const statusLabel = isActive ? '활성' : conn.status === 'error' ? '오류' : '비활성';
      const category = conn.data_category || conn.connection_category || '';
      const records = conn.total_records_synced ? ` (${conn.total_records_synced.toLocaleString()}건)` : '';
      return `• ${conn.name}${category ? ` [${category}]` : ''}: ${statusLabel}${records}`;
    }).join('\n');

    const activeCount = connections.filter((c: any) => c.is_active || c.status === 'active').length;

    const message = `현재 ${connections.length}개 API가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${connList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['새 연결 추가해줘', '데이터 품질 점수 알려줘', '임포트 히스토리 보여줘'],
      data: { totalConnections: connections.length, activeCount },
    };
  } catch (error) {
    console.error('[queryApiConnections] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: 'API 연결 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘'],
    };
  }
}

/**
 * 임포트 히스토리 조회 (user_data_imports 테이블 — 프론트엔드 "임포트 히스토리" 카드와 동일)
 */
async function queryImportHistory(
  supabase: SupabaseClient,
  storeId: string,
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';

  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }

    const { data: imports, error } = await supabase
      .from('user_data_imports')
      .select('id, file_name, data_type, total_rows, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!imports || imports.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '임포트 히스토리가 없습니다. 데이터를 임포트해 보세요.',
        suggestions: ['데이터 컨트롤타워로 가줘', '연결된 소스 확인'],
      };
    }

    const typeLabels: Record<string, string> = {
      products: '상품', customers: '고객', transactions: '거래', staff: '직원', inventory: '재고',
    };
    const statusLabels: Record<string, string> = {
      pending: '대기', processing: '처리중', completed: '완료', partial: '부분완료', failed: '실패', rolled_back: '롤백됨',
    };

    const importList = imports.map((imp: any) => {
      const type = typeLabels[imp.data_type] || imp.data_type || '-';
      const statusText = statusLabels[imp.status] || imp.status || '-';
      const rows = imp.total_rows ? `${imp.total_rows.toLocaleString()}행` : '-';
      const date = imp.created_at ? new Date(imp.created_at).toLocaleDateString('ko-KR') : '-';
      return `• ${imp.file_name || '파일'} (${type}) — ${rows} — ${statusText} — ${date}`;
    }).join('\n');

    const completedCount = imports.filter((i: any) => i.status === 'completed').length;
    const failedCount = imports.filter((i: any) => i.status === 'failed').length;

    const message = `최근 임포트 히스토리 (${imports.length}건):\n\n${importList}` +
      (failedCount > 0 ? `\n\n${failedCount}건 실패가 있습니다.` : '') +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '연결된 소스 확인', '데이터 흐름 현황 확인'],
      data: { totalImports: imports.length, completedCount, failedCount },
    };
  } catch (error) {
    console.error('[queryImportHistory] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '임포트 히스토리를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘'],
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
