/**
 * KPI 조회(query_kpi) 처리
 * Phase 3-B: 기존 DB 테이블 직접 쿼리 (읽기 전용)
 * Phase 3-B+: 인텐트 강화 - 새로운 쿼리 타입 및 기간 타입 추가
 * 데이터 응답 + 관련 탭 자동 이동
 * Phase 3-B++: TERM_LOCATION_MAP 활용 - 컨텍스트 기반 탭 전환
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

/**
 * 쿼리 타입별 관련 탭 매핑 (확장됨)
 */
const QUERY_TYPE_TO_TAB: Record<string, { page: string; tab?: string; section?: string }> = {
  revenue: { page: '/insights', tab: 'overview', section: 'kpi-cards' },
  visitors: { page: '/insights', tab: 'customer', section: 'customer-kpi' },
  conversion: { page: '/insights', tab: 'overview', section: 'kpi-cards' },
  avgTransaction: { page: '/insights', tab: 'overview', section: 'kpi-cards' },
  product: { page: '/insights', tab: 'product', section: 'product-performance' },
  inventory: { page: '/insights', tab: 'inventory', section: 'inventory-status' },
  goal: { page: '/insights', tab: 'overview', section: 'goal-achievement' },
  dwellTime: { page: '/insights', tab: 'customer', section: 'customer-kpi' },
  newVsReturning: { page: '/insights', tab: 'customer', section: 'customer-kpi' },
  summary: { page: '/insights', tab: 'overview', section: 'kpi-cards' },
  // 데이터 컨트롤타워 쿼리 (탭 없음)
  dataQuality: { page: '/data/control-tower', section: 'data-sources' },
  dataSources: { page: '/data/control-tower', section: 'data-sources' },
  pipelineStatus: { page: '/data/control-tower', section: 'data-sources' },
};

/**
 * 쿼리 타입에서 용어 키워드 추출
 */
function getTermKeyword(queryType: string): string {
  const termMap: Record<string, string> = {
    visitors: '방문객',
    revenue: '매출',
    conversion: '전환율',
    avgTransaction: '객단가',
    product: '상품',
    inventory: '재고',
    goal: '목표 달성률',
    dwellTime: '체류 시간',
    newVsReturning: '방문객',
    summary: '매출',
  };
  return termMap[queryType] || '매출';
}

/**
 * 날짜 범위를 기반으로 네비게이션 액션 생성 (컨텍스트 인식)
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

  // 1. 페이지 이동 (필요시)
  if (pageNeedsChange) {
    actions.push({
      type: 'navigate',
      target: targetPage,
    });
  }

  // 2. 탭 전환 (필요시, 탭이 있는 페이지만)
  if (tabNeedsChange && targetTab) {
    actions.push({
      type: 'set_tab',
      target: targetTab,
    });
  }

  // 3. 날짜 범위 설정
  actions.push({
    type: 'set_date_range',
    target: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  });

  // 4. 섹션으로 스크롤 (있으면)
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
    'ai-recommendation': 'AI추천',
  };
  return tabNames[tabId] || tabId;
}

/**
 * query_kpi 인텐트 처리 (컨텍스트 인식 버전)
 */
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string,
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const queryType = classification.entities.queryType || 'summary';
  const period = classification.entities.period || { type: 'today' };

  try {
    const dateRange = getDateRange(period);

    switch (queryType) {
      case 'revenue':
        return await queryRevenue(supabase, storeId, dateRange, pageContext);

      case 'visitors':
        return await queryVisitors(supabase, storeId, dateRange, pageContext);

      case 'conversion':
        return await queryConversion(supabase, storeId, dateRange, pageContext);

      case 'avgTransaction':
        return await queryAvgTransaction(supabase, storeId, dateRange, pageContext);

      case 'product':
        return await queryProduct(supabase, storeId, dateRange, pageContext);

      case 'inventory':
        return await queryInventory(supabase, storeId, dateRange, pageContext);

      case 'goal':
        return await queryGoal(supabase, storeId, dateRange, pageContext);

      case 'dwellTime':
        return await queryDwellTime(supabase, storeId, dateRange, pageContext);

      case 'newVsReturning':
        return await queryNewVsReturning(supabase, storeId, dateRange, pageContext);

      case 'dataQuality':
        return await queryDataQuality(supabase, storeId, pageContext);

      case 'dataSources':
        return await queryDataSources(supabase, storeId, pageContext);

      case 'pipelineStatus':
        return await queryPipelineStatus(supabase, storeId, pageContext);

      case 'summary':
      default:
        return await querySummary(supabase, storeId, dateRange, pageContext);
    }

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
 * 매출 조회 (컨텍스트 인식)
 */
async function queryRevenue(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('date, total_revenue, total_transactions')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate) {
    const { data: compareData } = await supabase
      .from('daily_kpis_agg')
      .select('total_revenue')
      .eq('store_id', storeId)
      .eq('date', dateRange.compareStartDate)
      .single();

    if (compareData?.total_revenue && compareData.total_revenue > 0) {
      change = Math.round(((totalRevenue - compareData.total_revenue) / compareData.total_revenue) * 100);
    }
  }

  const responseData = { totalRevenue, totalTransactions, change };

  // 컨텍스트 기반 네비게이션 액션 생성
  const { actions, tabChanged, targetTab } = createNavigationActions('revenue', dateRange, pageContext);

  // 응답 메시지 구성
  let message = formatDataResponse('revenue', responseData);

  if (tabChanged) {
    const targetTabName = getTabDisplayName(targetTab);
    message += `\n\n${targetTabName}탭으로 이동하여 상세 데이터를 확인합니다.`;
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
 * 방문객 조회 (컨텍스트 인식)
 */
async function queryVisitors(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('date, total_visitors, unique_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const uniqueVisitors = data?.reduce((sum, row) => sum + (row.unique_visitors || 0), 0) || 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate) {
    const { data: compareData } = await supabase
      .from('daily_kpis_agg')
      .select('total_visitors')
      .eq('store_id', storeId)
      .eq('date', dateRange.compareStartDate)
      .single();

    if (compareData?.total_visitors && compareData.total_visitors > 0) {
      change = Math.round(((totalVisitors - compareData.total_visitors) / compareData.total_visitors) * 100);
    }
  }

  const responseData = { totalVisitors, uniqueVisitors, change };

  // 컨텍스트 기반 네비게이션 액션 생성
  const { actions, tabChanged, targetTab } = createNavigationActions('visitors', dateRange, pageContext);

  // 응답 메시지 구성
  let message = formatDataResponse('visitors', responseData);

  // 탭 전환 안내 추가
  if (tabChanged) {
    const targetTabName = getTabDisplayName(targetTab);
    message += `\n\n${targetTabName}탭으로 이동하여 상세 데이터를 확인합니다.`;

    // 복수 위치가 있는 용어인 경우 안내 추가
    const termEntry = findTermLocation('방문객');
    if (termEntry?.secondary && termEntry.secondary.length > 0) {
      const secondaryTab = termEntry.secondary[0].tab;
      if (secondaryTab) {
        const secondaryTabName = getTabDisplayName(secondaryTab);
        message += ` (${secondaryTabName}탭에서도 요약 정보 확인 가능)`;
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
 * 전환율 조회 (컨텍스트 인식)
 */
async function queryConversion(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('total_visitors, total_transactions, conversion_rate')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const conversionRate = totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0;

  const responseData = { conversionRate, totalVisitors, totalTransactions };
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
 * 평균 객단가 조회 (컨텍스트 인식)
 */
async function queryAvgTransaction(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('total_revenue, total_transactions, avg_transaction_value')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

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
 * 전체 요약 조회 (컨텍스트 인식)
 */
async function querySummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const conversionRate = totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0;

  const { actions, tabChanged, targetTab } = createNavigationActions('summary', dateRange, pageContext);

  let message = `${dateRange.startDate} ~ ${dateRange.endDate} 주요 지표입니다:\n` +
    `• 매출: ${formatNumber(totalRevenue)}원\n` +
    `• 방문객: ${totalVisitors.toLocaleString()}명\n` +
    `• 전환율: ${conversionRate.toFixed(1)}%`;

  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['고객탭 보여줘', '시뮬레이션 돌려줘'],
    data: { totalRevenue, totalVisitors, totalTransactions, conversionRate },
  };
}

/**
 * 상품 판매량 조회 (컨텍스트 인식)
 */
async function queryProduct(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('product', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  // product_performance_agg 테이블에서 조회 (실제 컬럼: units_sold, revenue)
  const { data, error } = await supabase
    .from('product_performance_agg')
    .select('product_id, units_sold, revenue')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) {
    console.error('[queryProduct] Error:', error);
    // 폴백: daily_kpis_agg에서 거래 수로 대체
    const { data: kpiData } = await supabase
      .from('daily_kpis_agg')
      .select('total_transactions, total_revenue')
      .eq('store_id', storeId)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    const totalSales = kpiData?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
    const totalRevenue = kpiData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;

    return {
      actions,
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매 건수는 ${totalSales.toLocaleString()}건, 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
      suggestions: ['매출 알려줘', '재고 현황 알려줘'],
      data: { totalSales, totalRevenue },
    };
  }

  const totalUnitsSold = data?.reduce((sum, row) => sum + (row.units_sold || 0), 0) || 0;
  const totalRevenue = data?.reduce((sum, row) => sum + (row.revenue || 0), 0) || 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalUnitsSold.toLocaleString()}개, 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
    suggestions: ['매출 알려줘', '재고 현황 알려줘'],
    data: { totalUnitsSold, totalRevenue },
  };
}

/**
 * 재고 현황 조회 (컨텍스트 인식)
 */
async function queryInventory(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('inventory', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';

  // store에서 org_id 조회 (inventory_levels는 org_id 기준 필터)
  const { data: storeData } = await supabase
    .from('stores')
    .select('org_id')
    .eq('id', storeId)
    .single();

  const orgId = storeData?.org_id;

  if (!orgId) {
    return {
      actions,
      message: `매장 정보를 확인할 수 없습니다.${tabMessage}`,
      suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
      data: null,
    };
  }

  // inventory_levels 테이블에서 재고 현황 조회 (실제 컬럼: current_stock, minimum_stock, optimal_stock)
  const { data, error } = await supabase
    .from('inventory_levels')
    .select('product_id, current_stock, minimum_stock, optimal_stock')
    .eq('org_id', orgId);

  if (error) {
    console.error('[queryInventory] Error:', error);
    return {
      actions,
      message: `재고 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
      data: null,
    };
  }

  const totalItems = data?.length || 0;
  const lowStockItems = data?.filter(item => item.current_stock <= item.minimum_stock).length || 0;
  const overstockItems = data?.filter(item =>
    item.optimal_stock > 0 && item.current_stock > item.optimal_stock * 1.5
  ).length || 0;

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
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const today = new Date().toISOString().split('T')[0];

  // store_goals 테이블에서 활성 목표 조회 (현재 기간 내)
  const { data: goals, error: goalError } = await supabase
    .from('store_goals')
    .select('id, goal_type, period_type, target_value, period_start, period_end')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .lte('period_start', today)
    .gte('period_end', today);

  // 목표 설정이 없는 경우 → 목표 설정 다이얼로그 팝업 유도
  if (goalError || !goals || goals.length === 0) {
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

  // 목표가 있는 경우 → KPI 데이터 조회 후 달성률 계산
  const { data: kpiData } = await supabase
    .from('daily_kpis_agg')
    .select('total_revenue, total_visitors, total_transactions, conversion_rate, avg_transaction_value')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  const totalRevenue = kpiData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalVisitors = kpiData?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const totalTransactions = kpiData?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const avgConversion = totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0;
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
 * 체류 시간 조회 (컨텍스트 인식)
 */
async function queryDwellTime(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('dwellTime', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  // daily_kpis_agg에서 체류 시간 조회 (실제 컬럼: avg_visit_duration_seconds, 단위: 초)
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('avg_visit_duration_seconds, total_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error || !data || data.length === 0) {
    if (error) console.error('[queryDwellTime] Error:', error);
    return {
      actions,
      message: `체류 시간 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
      data: null,
    };
  }

  // 방문자 가중 평균 (초 단위 → 분 변환)
  const totalVisitors = data.reduce((sum, row) => sum + (row.total_visitors || 0), 0);
  const weightedDwellSum = data.reduce(
    (sum, row) => sum + (row.avg_visit_duration_seconds || 0) * (row.total_visitors || 0), 0
  );
  const avgDwellSeconds = totalVisitors > 0 ? weightedDwellSum / totalVisitors : 0;
  const avgDwellMinutes = avgDwellSeconds / 60;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 평균 체류 시간은 ${Math.round(avgDwellMinutes)}분입니다.${tabMessage}`,
    suggestions: ['방문객 수 알려줘', '신규/재방문 비율'],
    data: { avgDwellTime: avgDwellMinutes },
  };
}

/**
 * 신규/재방문 고객 조회 (컨텍스트 인식)
 */
async function queryNewVsReturning(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('newVsReturning', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  // daily_kpis_agg에서 total_visitors, returning_visitors 조회
  // (customer_segments_agg는 세그먼트 분류 테이블이므로 방문자 수 집계에 부적합)
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('total_visitors, returning_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error || !data || data.length === 0) {
    if (error) console.error('[queryNewVsReturning] Error:', error);
    return {
      actions,
      message: `신규/재방문 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
      data: null,
    };
  }

  const totalVisitors = data.reduce((sum, row) => sum + (row.total_visitors || 0), 0);
  const totalReturning = data.reduce((sum, row) => sum + (row.returning_visitors || 0), 0);
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
// 데이터 컨트롤타워 전용 쿼리 핸들러
// ============================================

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

    const overallScore = score.overall || 0;
    const completeness = score.completeness || 0;
    const freshness = score.freshness || 0;
    const consistency = score.consistency || 0;

    const gradeEmoji = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D';

    const message = `현재 데이터 품질 점수는 ${overallScore}점 (${gradeEmoji})입니다.\n\n` +
      `• 완전성(Completeness): ${completeness}점\n` +
      `• 최신성(Freshness): ${freshness}점\n` +
      `• 일관성(Consistency): ${consistency}점` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['연결된 소스 뭐 있어?', '새 연결 추가해줘', '매출 알려줘'],
      data: { overallScore, completeness, freshness, consistency },
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
 * 데이터 소스 연결 현황 조회
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
    const sources = status?.data_sources || [];

    if (sources.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 데이터 소스가 없습니다. 새 연결을 추가해 보세요.',
        suggestions: ['새 연결 추가해줘', '데이터 컨트롤타워로 가줘'],
      };
    }

    const sourceList = sources.map((s: any) => {
      const statusLabel = s.status === 'active' ? 'Active' : s.status === 'error' ? 'Error' : s.status;
      const recordCount = s.record_count ? `${s.record_count.toLocaleString()}건` : '-';
      return `• ${s.name || s.source_type}: ${statusLabel} (${recordCount})`;
    }).join('\n');

    const activeCount = sources.filter((s: any) => s.status === 'active').length;
    const errorCount = sources.filter((s: any) => s.status === 'error').length;

    let summaryNote = '';
    if (errorCount > 0) {
      summaryNote = `\n\n${errorCount}개 소스에 오류가 있습니다. 확인이 필요합니다.`;
    }

    const message = `현재 ${sources.length}개 데이터 소스가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${sourceList}${summaryNote}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '새 연결 추가해줘', '파이프라인 상태 확인'],
      data: { totalSources: sources.length, activeCount, errorCount, sources },
    };
  } catch (error) {
    console.error('[queryDataSources] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '데이터 소스 현황을 조회하는 중 오류가 발생했습니다.' +
        (!isOnControlTower ? ' 데이터 컨트롤타워에서 직접 확인해 주세요.' : ''),
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

/**
 * 파이프라인 상태 조회
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
    const pipeline = status?.pipeline_stats;

    if (!pipeline) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '파이프라인 상태 정보를 조회할 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘', '데이터 품질 점수 확인'],
      };
    }

    const totalRuns = pipeline.total_runs || 0;
    const successRuns = pipeline.success_runs || 0;
    const failedRuns = pipeline.failed_runs || 0;
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
    const lastRun = pipeline.last_run_at ? new Date(pipeline.last_run_at).toLocaleString('ko-KR') : '없음';

    const message = `데이터 파이프라인 현황:\n\n` +
      `• 총 실행: ${totalRuns}회\n` +
      `• 성공: ${successRuns}회 (${successRate}%)\n` +
      `• 실패: ${failedRuns}회\n` +
      `• 마지막 실행: ${lastRun}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');

    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '연결된 소스 확인', '매출 알려줘'],
      data: { totalRuns, successRuns, failedRuns, successRate },
    };
  } catch (error) {
    console.error('[queryPipelineStatus] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '파이프라인 상태를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
