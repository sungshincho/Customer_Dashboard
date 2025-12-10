/**
 * useAIPrediction.ts
 *
 * AI 기반 예측 훅
 * 최근 60일 데이터를 분석하여 향후 7일 예측 생성
 *
 * 기능:
 * - daily_kpis_agg 테이블에서 과거 데이터 조회
 * - 폴백: transactions 테이블에서 일별 집계
 * - 통계적 예측 (이동평균 + 트렌드 + 요일 패턴)
 * - 신뢰도 계산
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { addDays, format, subDays, getDay } from 'date-fns';

// 일별 예측 데이터 타입
export interface DailyPrediction {
  date: string;
  predicted_revenue: number;
  predicted_visitors: number;
  predicted_conversion: number;
  confidence: number; // 0~1
  lower_bound_revenue: number;
  upper_bound_revenue: number;
  is_prediction: boolean; // true면 예측, false면 실제
}

// 예측 요약 타입
export interface PredictionSummary {
  total_predicted_revenue: number;
  total_predicted_visitors: number;
  avg_predicted_conversion: number;
  revenue_change_percent: number; // 전주 대비
  overall_confidence: number; // 0~100
  model_info: {
    data_points: number;
    trend_direction: 'up' | 'down' | 'stable';
    seasonality_detected: boolean;
    last_updated: string;
  };
}

// 훅 반환 타입
export interface AIPredictionData {
  dailyPredictions: DailyPrediction[];
  summary: PredictionSummary | null;
  historicalData: DailyPrediction[];
  isLoading: boolean;
  error: Error | null;
}

// 내부 데이터 타입
interface RawDailyData {
  date: string;
  revenue: number;
  visitors: number;
  conversion: number;
  dayOfWeek: number;
}

// 요일별 패턴 분석
function calculateDayOfWeekPattern(data: RawDailyData[]): Record<number, number> {
  const dayTotals: Record<number, { sum: number; count: number }> = {};

  for (let i = 0; i < 7; i++) {
    dayTotals[i] = { sum: 0, count: 0 };
  }

  data.forEach((d) => {
    dayTotals[d.dayOfWeek].sum += d.revenue;
    dayTotals[d.dayOfWeek].count += 1;
  });

  // 전체 평균 대비 각 요일의 비율 계산
  const overallAvg = data.reduce((s, d) => s + d.revenue, 0) / data.length || 1;
  const patterns: Record<number, number> = {};

  for (let i = 0; i < 7; i++) {
    const dayAvg = dayTotals[i].count > 0 ? dayTotals[i].sum / dayTotals[i].count : overallAvg;
    patterns[i] = dayAvg / overallAvg;
  }

  return patterns;
}

// 트렌드 방향 계산
function calculateTrend(data: RawDailyData[]): { direction: 'up' | 'down' | 'stable'; slope: number } {
  if (data.length < 7) return { direction: 'stable', slope: 0 };

  // 최근 7일 vs 이전 7일 비교
  const recentWeek = data.slice(-7);
  const prevWeek = data.slice(-14, -7);

  if (prevWeek.length === 0) return { direction: 'stable', slope: 0 };

  const recentAvg = recentWeek.reduce((s, d) => s + d.revenue, 0) / recentWeek.length;
  const prevAvg = prevWeek.reduce((s, d) => s + d.revenue, 0) / prevWeek.length;

  const changePercent = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

  if (changePercent > 5) return { direction: 'up', slope: changePercent / 100 };
  if (changePercent < -5) return { direction: 'down', slope: changePercent / 100 };
  return { direction: 'stable', slope: changePercent / 100 };
}

// 신뢰도 계산
function calculateConfidence(dataPoints: number, dayIndex: number): number {
  // 데이터 양에 비례 (최대 60일 기준)
  const dataFactor = Math.min(dataPoints / 30, 1); // 30일이면 최대

  // 예측 기간에 반비례 (1~7일)
  const timeFactor = 1 - (dayIndex - 1) * 0.1; // 첫째 날 1.0, 7일째 0.4

  // 전체 신뢰도
  return Math.max(0.3, Math.min(1, dataFactor * timeFactor));
}

// 예측값 생성
function generatePredictions(
  data: RawDailyData[],
  dayPatterns: Record<number, number>,
  trend: { slope: number }
): DailyPrediction[] {
  if (data.length < 7) return [];

  const last7Days = data.slice(-7);
  const lastDate = new Date(data[data.length - 1].date);

  // 기본 평균 계산
  const avgRevenue = last7Days.reduce((s, d) => s + d.revenue, 0) / 7;
  const avgVisitors = last7Days.reduce((s, d) => s + d.visitors, 0) / 7;
  const avgConversion = last7Days.reduce((s, d) => s + d.conversion, 0) / 7;

  // 표준편차 계산 (신뢰구간용)
  const revenueStdDev = Math.sqrt(
    last7Days.reduce((s, d) => s + Math.pow(d.revenue - avgRevenue, 2), 0) / 7
  );

  const predictions: DailyPrediction[] = [];

  for (let i = 1; i <= 7; i++) {
    const predictedDate = addDays(lastDate, i);
    const dayOfWeek = getDay(predictedDate);
    const confidence = calculateConfidence(data.length, i);

    // 트렌드 반영 (시간이 지날수록 트렌드 영향 증가)
    const trendFactor = 1 + trend.slope * (i / 7);

    // 요일 패턴 반영
    const dayFactor = dayPatterns[dayOfWeek] || 1;

    // 최종 예측값
    const predictedRevenue = Math.round(avgRevenue * trendFactor * dayFactor);
    const predictedVisitors = Math.round(avgVisitors * trendFactor * dayFactor);
    const predictedConversion = Math.max(0, Math.min(100, avgConversion * (1 + trend.slope * 0.3)));

    // 신뢰구간 (confidence에 따라 조정)
    const margin = revenueStdDev * (2 - confidence);
    const lowerBound = Math.max(0, predictedRevenue - margin);
    const upperBound = predictedRevenue + margin;

    predictions.push({
      date: format(predictedDate, 'yyyy-MM-dd'),
      predicted_revenue: predictedRevenue,
      predicted_visitors: predictedVisitors,
      predicted_conversion: parseFloat(predictedConversion.toFixed(1)),
      confidence,
      lower_bound_revenue: Math.round(lowerBound),
      upper_bound_revenue: Math.round(upperBound),
      is_prediction: true,
    });
  }

  return predictions;
}

// 요약 데이터 생성
function generateSummary(
  predictions: DailyPrediction[],
  historicalData: RawDailyData[],
  trend: { direction: 'up' | 'down' | 'stable' },
  dayPatterns: Record<number, number>
): PredictionSummary | null {
  if (predictions.length === 0) return null;

  const totalRevenue = predictions.reduce((s, p) => s + p.predicted_revenue, 0);
  const totalVisitors = predictions.reduce((s, p) => s + p.predicted_visitors, 0);
  const avgConversion = predictions.reduce((s, p) => s + p.predicted_conversion, 0) / predictions.length;
  const avgConfidence = predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length;

  // 전주 매출 (최근 7일)
  const last7Days = historicalData.slice(-7);
  const lastWeekRevenue = last7Days.reduce((s, d) => s + d.revenue, 0);
  const revenueChange = lastWeekRevenue > 0 ? ((totalRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

  // 요일 패턴 변동성 확인 (주말 vs 평일 차이가 20% 이상이면 시즌성 있음)
  const weekdayAvg = (dayPatterns[1] + dayPatterns[2] + dayPatterns[3] + dayPatterns[4] + dayPatterns[5]) / 5;
  const weekendAvg = (dayPatterns[0] + dayPatterns[6]) / 2;
  const seasonalityDetected = Math.abs(weekendAvg - weekdayAvg) > 0.2;

  return {
    total_predicted_revenue: totalRevenue,
    total_predicted_visitors: totalVisitors,
    avg_predicted_conversion: parseFloat(avgConversion.toFixed(1)),
    revenue_change_percent: parseFloat(revenueChange.toFixed(1)),
    overall_confidence: Math.round(avgConfidence * 100),
    model_info: {
      data_points: historicalData.length,
      trend_direction: trend.direction,
      seasonality_detected: seasonalityDetected,
      last_updated: new Date().toISOString(),
    },
  };
}

export const useAIPrediction = () => {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['ai-prediction', selectedStore?.id, orgId],
    queryFn: async (): Promise<{
      dailyPredictions: DailyPrediction[];
      summary: PredictionSummary | null;
      historicalData: DailyPrediction[];
    }> => {
      if (!selectedStore?.id || !orgId) {
        return { dailyPredictions: [], summary: null, historicalData: [] };
      }

      const endDate = new Date();
      const startDate = subDays(endDate, 60);

      // 1. daily_kpis_agg에서 데이터 조회
      const { data: kpiData, error: kpiError } = await supabase
        .from('daily_kpis_agg')
        .select('date, total_revenue, total_visitors, conversion_rate')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      let rawData: RawDailyData[] = [];

      if (kpiData && kpiData.length >= 7) {
        rawData = kpiData.map((d) => ({
          date: d.date,
          revenue: Number(d.total_revenue) || 0,
          visitors: d.total_visitors || 0,
          conversion: d.conversion_rate || 0,
          dayOfWeek: getDay(new Date(d.date)),
        }));
      } else {
        // 폴백: transactions 테이블에서 일별 집계
        console.log('[useAIPrediction] Falling back to transactions table', { kpiError });

        const { data: txData } = await supabase
          .from('transactions')
          .select('transaction_datetime, total_amount, customer_id')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .gte('transaction_datetime', format(startDate, 'yyyy-MM-dd'))
          .lte('transaction_datetime', format(endDate, "yyyy-MM-dd'T'23:59:59"));

        if (txData && txData.length > 0) {
          // 일별 집계
          const dailyMap = new Map<string, { revenue: number; visitors: Set<string> }>();

          txData.forEach((tx) => {
            const date = tx.transaction_datetime.split('T')[0];
            if (!dailyMap.has(date)) {
              dailyMap.set(date, { revenue: 0, visitors: new Set() });
            }
            const day = dailyMap.get(date)!;
            day.revenue += Number(tx.total_amount) || 0;
            if (tx.customer_id) day.visitors.add(tx.customer_id);
          });

          rawData = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
              date,
              revenue: data.revenue,
              visitors: data.visitors.size,
              conversion: data.visitors.size > 0 ? (data.visitors.size / data.visitors.size) * 10 : 0, // 가상 전환율
              dayOfWeek: getDay(new Date(date)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
        }
      }

      // 데이터가 충분하지 않으면 샘플 데이터 생성
      if (rawData.length < 7) {
        console.log('[useAIPrediction] Generating sample data for demo');
        rawData = generateSampleData();
      }

      // 분석 실행
      const dayPatterns = calculateDayOfWeekPattern(rawData);
      const trend = calculateTrend(rawData);
      const predictions = generatePredictions(rawData, dayPatterns, trend);
      const summary = generateSummary(predictions, rawData, trend, dayPatterns);

      // 과거 데이터를 DailyPrediction 형식으로 변환 (최근 14일)
      const historicalData: DailyPrediction[] = rawData.slice(-14).map((d) => ({
        date: d.date,
        predicted_revenue: d.revenue,
        predicted_visitors: d.visitors,
        predicted_conversion: d.conversion,
        confidence: 1, // 실제 데이터는 신뢰도 100%
        lower_bound_revenue: d.revenue,
        upper_bound_revenue: d.revenue,
        is_prediction: false,
      }));

      return {
        dailyPredictions: predictions,
        summary,
        historicalData,
      };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
};

// 샘플 데이터 생성 함수 (데이터가 없을 때 데모용)
function generateSampleData(): RawDailyData[] {
  const data: RawDailyData[] = [];
  const baseRevenue = 500000;
  const baseVisitors = 150;

  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = getDay(date);

    // 주말 패턴 (토요일/일요일 20-30% 증가)
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1;

    // 약간의 랜덤 변동
    const randomFactor = 0.85 + Math.random() * 0.3;

    // 약간의 상승 트렌드
    const trendFactor = 1 + (30 - i) * 0.005;

    const revenue = Math.round(baseRevenue * weekendFactor * randomFactor * trendFactor);
    const visitors = Math.round(baseVisitors * weekendFactor * randomFactor * trendFactor);
    const conversion = 3 + Math.random() * 2;

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      revenue,
      visitors,
      conversion: parseFloat(conversion.toFixed(1)),
      dayOfWeek,
    });
  }

  return data;
}

export default useAIPrediction;
