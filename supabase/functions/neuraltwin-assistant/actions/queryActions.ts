/**
 * KPI 조회(query_kpi) 처리
 * Phase 3-B: 기존 DB 테이블 직접 쿼리 (읽기 전용)
 * Phase 3-B+: 인텐트 강화 - 새로운 쿼리 타입 및 기간 타입 추가
 * 데이터 응답 + 관련 탭 자동 이동
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { ClassificationResult } from '../intent/classifier.ts';
import { formatDataResponse } from '../response/generator.ts';
import { UIAction } from './navigationActions.ts';
import { TERM_LOCATION_MAP } from '../config/dashboardStructure.ts';

export interface QueryActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
  data?: any;
}

/**
 * 쿼리 타입별 관련 탭 매핑 (확장됨)
 */
const QUERY_TYPE_TO_TAB: Record<string, { page: string; tab: string; section?: string }> = {
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
};

/**
 * 날짜 범위를 기반으로 네비게이션 액션 생성
 */
function createNavigationActions(
  queryType: string,
  dateRange: { startDate: string; endDate: string }
): UIAction[] {
  const mapping = QUERY_TYPE_TO_TAB[queryType] || QUERY_TYPE_TO_TAB.summary;

  const actions: UIAction[] = [];

  // 1. 페이지 이동
  actions.push({
    type: 'navigate',
    target: mapping.page,
  });

  // 2. 탭 전환
  actions.push({
    type: 'set_tab',
    target: mapping.tab,
  });

  // 3. 날짜 범위 설정
  actions.push({
    type: 'set_date_range',
    target: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  });

  return actions;
}

/**
 * query_kpi 인텐트 처리
 */
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string
): Promise<QueryActionResult> {
  const queryType = classification.entities.queryType || 'summary';
  const period = classification.entities.period || { type: 'today' };

  try {
    const dateRange = getDateRange(period);

    switch (queryType) {
      case 'revenue':
        return await queryRevenue(supabase, storeId, dateRange);

      case 'visitors':
        return await queryVisitors(supabase, storeId, dateRange);

      case 'conversion':
        return await queryConversion(supabase, storeId, dateRange);

      case 'avgTransaction':
        return await queryAvgTransaction(supabase, storeId, dateRange);

      case 'product':
        return await queryProduct(supabase, storeId, dateRange);

      case 'inventory':
        return await queryInventory(supabase, storeId, dateRange);

      case 'goal':
        return await queryGoal(supabase, storeId, dateRange);

      case 'dwellTime':
        return await queryDwellTime(supabase, storeId, dateRange);

      case 'newVsReturning':
        return await queryNewVsReturning(supabase, storeId, dateRange);

      case 'summary':
      default:
        return await querySummary(supabase, storeId, dateRange);
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
 * 매출 조회
 */
async function queryRevenue(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string }
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

  return {
    actions: createNavigationActions('revenue', dateRange),
    message: formatDataResponse('revenue', responseData) + '\n\n인사이트 허브 개요탭에서 확인해보세요.',
    suggestions: ['방문객 수 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 방문객 조회
 */
async function queryVisitors(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string }
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

  return {
    actions: createNavigationActions('visitors', dateRange),
    message: formatDataResponse('visitors', responseData) + '\n\n인사이트 허브 고객탭에서 확인해보세요.',
    suggestions: ['매출 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 전환율 조회
 */
async function queryConversion(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
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

  return {
    actions: createNavigationActions('conversion', dateRange),
    message: formatDataResponse('conversion', responseData) + '\n\n인사이트 허브 개요탭에서 확인해보세요.',
    suggestions: ['매출 알려줘', '방문객 수 알려줘'],
    data: responseData,
  };
}

/**
 * 평균 객단가 조회
 */
async function queryAvgTransaction(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
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

  return {
    actions: createNavigationActions('avgTransaction', dateRange),
    message: `평균 객단가는 ${Math.round(avgTransaction).toLocaleString()}원입니다.\n\n인사이트 허브 개요탭에서 확인해보세요.`,
    suggestions: ['매출 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 전체 요약 조회
 */
async function querySummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
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

  const message = `오늘의 주요 지표입니다:\n` +
    `• 매출: ${formatNumber(totalRevenue)}원\n` +
    `• 방문객: ${totalVisitors.toLocaleString()}명\n` +
    `• 전환율: ${conversionRate.toFixed(1)}%\n\n` +
    `인사이트 허브 개요탭에서 확인해보세요.`;

  return {
    actions: createNavigationActions('summary', dateRange),
    message,
    suggestions: ['고객탭 보여줘', '시뮬레이션 돌려줘'],
    data: { totalRevenue, totalVisitors, totalTransactions, conversionRate },
  };
}

/**
 * 상품 판매량 조회
 */
async function queryProduct(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  // product_performance_agg 테이블에서 조회
  const { data, error } = await supabase
    .from('product_performance_agg')
    .select('product_id, product_name, sales_count, revenue')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) {
    console.error('[queryProduct] Error:', error);
    // 테이블이 없거나 에러 시 daily_kpis_agg에서 거래 수로 대체
    const { data: kpiData } = await supabase
      .from('daily_kpis_agg')
      .select('total_transactions, total_revenue')
      .eq('store_id', storeId)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    const totalSales = kpiData?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
    const totalRevenue = kpiData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;

    return {
      actions: createNavigationActions('product', dateRange),
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매 건수는 ${totalSales.toLocaleString()}건, 매출은 ${formatNumber(totalRevenue)}원입니다.\n\n인사이트 허브 상품탭에서 상세 내역을 확인해보세요.`,
      suggestions: ['매출 알려줘', '재고 현황 알려줘'],
      data: { totalSales, totalRevenue },
    };
  }

  const totalSalesCount = data?.reduce((sum, row) => sum + (row.sales_count || 0), 0) || 0;
  const totalRevenue = data?.reduce((sum, row) => sum + (row.revenue || 0), 0) || 0;

  return {
    actions: createNavigationActions('product', dateRange),
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalSalesCount.toLocaleString()}개, 매출은 ${formatNumber(totalRevenue)}원입니다.\n\n인사이트 허브 상품탭에서 상세 내역을 확인해보세요.`,
    suggestions: ['매출 알려줘', '재고 현황 알려줘'],
    data: { totalSalesCount, totalRevenue },
  };
}

/**
 * 재고 현황 조회
 */
async function queryInventory(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  // 재고 관련 테이블에서 조회 시도
  const { data, error } = await supabase
    .from('inventory_status')
    .select('product_id, product_name, current_stock, reorder_point')
    .eq('store_id', storeId);

  if (error) {
    console.error('[queryInventory] Error:', error);
    return {
      actions: createNavigationActions('inventory', dateRange),
      message: `재고 데이터를 조회할 수 없습니다.\n\n인사이트 허브 재고탭에서 직접 확인해보세요.`,
      suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
      data: null,
    };
  }

  const totalItems = data?.length || 0;
  const lowStockItems = data?.filter(item => item.current_stock <= item.reorder_point).length || 0;

  return {
    actions: createNavigationActions('inventory', dateRange),
    message: `현재 ${totalItems}개 상품 중 ${lowStockItems}개 상품이 재주문 필요 상태입니다.\n\n인사이트 허브 재고탭에서 상세 내역을 확인해보세요.`,
    suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
    data: { totalItems, lowStockItems },
  };
}

/**
 * 목표 달성률 조회 (조건부 응답)
 */
async function queryGoal(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  // user_goals 테이블에서 목표 조회 시도
  const { data: goalData, error: goalError } = await supabase
    .from('user_goals')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single();

  // 목표 설정이 없는 경우 - 조건부 응답
  if (goalError || !goalData) {
    return {
      actions: [
        { type: 'navigate', target: '/insights?tab=overview' },
        { type: 'scroll_to_section', sectionId: 'goal-achievement', highlight: true, highlightDuration: 2000 },
      ],
      message: '현재 설정된 목표가 없습니다. 목표를 설정하시면 달성률을 확인할 수 있어요.',
      suggestions: ['목표 설정하기', '매출 알려줘', '방문객 수 확인'],
      data: { hasGoal: false },
    };
  }

  // 목표가 있는 경우 - 현재 성과 조회
  const { data: kpiData } = await supabase
    .from('daily_kpis_agg')
    .select('total_revenue, total_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  const totalRevenue = kpiData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const goalRevenue = goalData.target_revenue || 0;
  const achievementRate = goalRevenue > 0 ? Math.round((totalRevenue / goalRevenue) * 100) : 0;

  const trend = achievementRate >= 100 ? '목표를 달성했어요!' :
               achievementRate >= 80 ? '목표 달성에 근접해 있어요.' :
               achievementRate >= 50 ? '중간 정도 진행 중이에요.' : '목표까지 더 노력이 필요해요.';

  return {
    actions: createNavigationActions('goal', dateRange),
    message: `현재 목표 달성률은 ${achievementRate}%입니다. ${trend}\n\n인사이트 허브 개요탭에서 확인해보세요.`,
    suggestions: ['목표 수정하기', '매출 알려줘', '상세 분석 보기'],
    data: { achievementRate, totalRevenue, goalRevenue, hasGoal: true },
  };
}

/**
 * 체류 시간 조회
 */
async function queryDwellTime(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  // 체류 시간 데이터 조회 시도
  const { data, error } = await supabase
    .from('customer_behavior_agg')
    .select('avg_dwell_time, total_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) {
    console.error('[queryDwellTime] Error:', error);
    // 폴백: daily_kpis_agg 사용
    const { data: kpiData } = await supabase
      .from('daily_kpis_agg')
      .select('avg_dwell_time')
      .eq('store_id', storeId)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    if (!kpiData || kpiData.length === 0) {
      return {
        actions: createNavigationActions('dwellTime', dateRange),
        message: '체류 시간 데이터를 조회할 수 없습니다.\n\n인사이트 허브 고객탭에서 확인해보세요.',
        suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
        data: null,
      };
    }

    const avgDwell = kpiData.reduce((sum, row) => sum + (row.avg_dwell_time || 0), 0) / kpiData.length;
    return {
      actions: createNavigationActions('dwellTime', dateRange),
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 평균 체류 시간은 ${Math.round(avgDwell)}분입니다.\n\n인사이트 허브 고객탭에서 상세 분석을 확인해보세요.`,
      suggestions: ['방문객 수 알려줘', '신규/재방문 비율'],
      data: { avgDwellTime: avgDwell },
    };
  }

  const totalVisitors = data.reduce((sum, row) => sum + (row.total_visitors || 0), 0);
  const weightedDwellSum = data.reduce((sum, row) => sum + (row.avg_dwell_time || 0) * (row.total_visitors || 0), 0);
  const avgDwellTime = totalVisitors > 0 ? weightedDwellSum / totalVisitors : 0;

  return {
    actions: createNavigationActions('dwellTime', dateRange),
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 평균 체류 시간은 ${Math.round(avgDwellTime)}분입니다.\n\n인사이트 허브 고객탭에서 상세 분석을 확인해보세요.`,
    suggestions: ['방문객 수 알려줘', '신규/재방문 비율'],
    data: { avgDwellTime },
  };
}

/**
 * 신규/재방문 고객 조회
 */
async function queryNewVsReturning(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  // 고객 세그먼트 데이터 조회 시도
  const { data, error } = await supabase
    .from('customer_segments_agg')
    .select('new_visitors, returning_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) {
    console.error('[queryNewVsReturning] Error:', error);
    // 폴백: daily_kpis_agg 사용
    const { data: kpiData } = await supabase
      .from('daily_kpis_agg')
      .select('new_visitors, returning_visitors, total_visitors')
      .eq('store_id', storeId)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    if (!kpiData || kpiData.length === 0) {
      return {
        actions: createNavigationActions('newVsReturning', dateRange),
        message: '신규/재방문 데이터를 조회할 수 없습니다.\n\n인사이트 허브 고객탭에서 확인해보세요.',
        suggestions: ['방문객 수 알려줘', '고객탭 보여줘'],
        data: null,
      };
    }

    const totalNew = kpiData.reduce((sum, row) => sum + (row.new_visitors || 0), 0);
    const totalReturning = kpiData.reduce((sum, row) => sum + (row.returning_visitors || 0), 0);
    const total = totalNew + totalReturning;
    const newRate = total > 0 ? Math.round((totalNew / total) * 100) : 0;
    const returnRate = total > 0 ? Math.round((totalReturning / total) * 100) : 0;

    return {
      actions: createNavigationActions('newVsReturning', dateRange),
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 고객 구성:\n• 신규 고객: ${totalNew.toLocaleString()}명 (${newRate}%)\n• 재방문 고객: ${totalReturning.toLocaleString()}명 (${returnRate}%)\n\n인사이트 허브 고객탭에서 상세 분석을 확인해보세요.`,
      suggestions: ['방문객 수 알려줘', '체류 시간 알려줘'],
      data: { newVisitors: totalNew, returningVisitors: totalReturning, newRate, returnRate },
    };
  }

  const totalNew = data.reduce((sum, row) => sum + (row.new_visitors || 0), 0);
  const totalReturning = data.reduce((sum, row) => sum + (row.returning_visitors || 0), 0);
  const total = totalNew + totalReturning;
  const newRate = total > 0 ? Math.round((totalNew / total) * 100) : 0;
  const returnRate = total > 0 ? Math.round((totalReturning / total) * 100) : 0;

  return {
    actions: createNavigationActions('newVsReturning', dateRange),
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 고객 구성:\n• 신규 고객: ${totalNew.toLocaleString()}명 (${newRate}%)\n• 재방문 고객: ${totalReturning.toLocaleString()}명 (${returnRate}%)\n\n인사이트 허브 고객탭에서 상세 분석을 확인해보세요.`,
    suggestions: ['방문객 수 알려줘', '체류 시간 알려줘'],
    data: { newVisitors: totalNew, returningVisitors: totalReturning, newRate, returnRate },
  };
}

function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
