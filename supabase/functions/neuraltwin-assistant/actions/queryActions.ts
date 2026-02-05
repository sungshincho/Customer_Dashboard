/**
 * KPI 조회(query_kpi) 처리
 * Phase 3-B: 기존 DB 테이블 직접 쿼리 (읽기 전용)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { ClassificationResult } from '../intent/classifier.ts';
import { formatDataResponse } from '../response/generator.ts';

export interface QueryActionResult {
  actions: any[];
  message: string;
  suggestions: string[];
  data?: any;
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
 * 기간 계산
 */
function getDateRange(period: { type: string; date?: string }): {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (period.type) {
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

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDate(startOfMonth),
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
    actions: [],
    message: formatDataResponse('revenue', responseData),
    suggestions: ['방문객 수 알려줘', '전환율 어때?', '인사이트 허브에서 자세히 보기'],
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
    actions: [],
    message: formatDataResponse('visitors', responseData),
    suggestions: ['매출 알려줘', '전환율 어때?', '고객탭에서 자세히 보기'],
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
    actions: [],
    message: formatDataResponse('conversion', responseData),
    suggestions: ['매출 알려줘', '방문객 수 알려줘', '인사이트 허브에서 자세히 보기'],
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
    actions: [],
    message: `평균 객단가는 ${Math.round(avgTransaction).toLocaleString()}원입니다.`,
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
    `• 전환율: ${conversionRate.toFixed(1)}%`;

  return {
    actions: [],
    message,
    suggestions: ['인사이트 허브에서 자세히 보기', '시뮬레이션 돌려줘'],
    data: { totalRevenue, totalVisitors, totalTransactions, conversionRate },
  };
}

function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
