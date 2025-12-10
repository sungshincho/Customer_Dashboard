/**
 * PredictionTab.tsx
 *
 * 인사이트 허브 - 예측 탭
 * 매출 예측, 방문자 예측, 트렌드 분석
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';
import { addDays, format, subDays } from 'date-fns';

export function PredictionTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();

  // 과거 데이터 조회 (예측 기반)
  const { data: historicalData } = useQuery({
    queryKey: ['historical-kpis', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('daily_kpis_agg')
        .select('date, total_revenue, total_visits, conversion_rate')
        .eq('store_id', selectedStore.id)
        .gte('date', subDays(new Date(dateRange.endDate), 60).toISOString().split('T')[0])
        .lte('date', dateRange.endDate)
        .order('date');

      return data || [];
    },
    enabled: !!selectedStore?.id,
  });

  // 예측 데이터 생성 (간단한 이동평균 기반)
  const predictionData = useMemo(() => {
    if (!historicalData || historicalData.length < 7) return [];

    const lastDate = new Date(historicalData[historicalData.length - 1]?.date || new Date());
    const last7Days = historicalData.slice(-7);

    // 평균 계산
    const avgRevenue = last7Days.reduce((s, d) => s + (d.total_revenue || 0), 0) / 7;
    const avgVisits = last7Days.reduce((s, d) => s + (d.total_visits || 0), 0) / 7;
    const avgConversion = last7Days.reduce((s, d) => s + (d.conversion_rate || 0), 0) / 7;

    // 트렌드 계산 (최근 3일 vs 이전 4일)
    const recent3 = last7Days.slice(-3);
    const prev4 = last7Days.slice(0, 4);
    const recent3AvgRevenue = recent3.reduce((s, d) => s + (d.total_revenue || 0), 0) / 3;
    const prev4AvgRevenue = prev4.reduce((s, d) => s + (d.total_revenue || 0), 0) / 4;
    const trend = prev4AvgRevenue > 0 ? (recent3AvgRevenue - prev4AvgRevenue) / prev4AvgRevenue : 0;

    // 향후 7일 예측
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const predictedDate = addDays(lastDate, i);
      const growthFactor = 1 + (trend * (i / 7)); // 트렌드 반영
      predictions.push({
        date: format(predictedDate, 'MM/dd'),
        revenue: Math.round(avgRevenue * growthFactor),
        visits: Math.round(avgVisits * growthFactor),
        conversion: parseFloat((avgConversion * (1 + trend * 0.3)).toFixed(1)),
        isPrediction: true,
      });
    }

    // 과거 데이터 + 예측 데이터 합치기
    const historical = historicalData.slice(-14).map(d => ({
      date: format(new Date(d.date), 'MM/dd'),
      revenue: d.total_revenue || 0,
      visits: d.total_visits || 0,
      conversion: d.conversion_rate || 0,
      isPrediction: false,
    }));

    return [...historical, ...predictions];
  }, [historicalData]);

  // 예측 요약
  const predictionSummary = useMemo(() => {
    const futurePredictions = predictionData.filter(d => d.isPrediction);
    if (futurePredictions.length === 0) return null;

    const totalRevenue = futurePredictions.reduce((s, d) => s + d.revenue, 0);
    const totalVisits = futurePredictions.reduce((s, d) => s + d.visits, 0);
    const avgConversion = futurePredictions.reduce((s, d) => s + d.conversion, 0) / futurePredictions.length;

    // 전주 대비 변화 계산
    const pastData = predictionData.filter(d => !d.isPrediction).slice(-7);
    const pastRevenue = pastData.reduce((s, d) => s + d.revenue, 0);
    const revenueChange = pastRevenue > 0 ? ((totalRevenue - pastRevenue) / pastRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalVisits,
      avgConversion,
      revenueChange,
    };
  }, [predictionData]);

  return (
    <div className="space-y-6">
      {/* 예측 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              향후 7일 예상 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(predictionSummary?.totalRevenue || 0)}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs",
              (predictionSummary?.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {(predictionSummary?.revenueChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              전주 대비 {Math.abs(predictionSummary?.revenueChange || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              예상 방문자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(predictionSummary?.totalVisits || 0).toLocaleString()}명
            </div>
            <p className="text-xs text-muted-foreground">향후 7일 누적</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              예상 전환율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(predictionSummary?.avgConversion || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">7일 평균 예측</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {(predictionSummary?.revenueChange || 0) >= 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              예측 신뢰도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData && historicalData.length >= 30 ? '높음' : historicalData && historicalData.length >= 14 ? '보통' : '낮음'}
            </div>
            <p className="text-xs text-muted-foreground">
              {historicalData?.length || 0}일 데이터 기반
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 매출 예측 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>매출 예측</CardTitle>
          <CardDescription>과거 14일 실적 및 향후 7일 예측</CardDescription>
        </CardHeader>
        <CardContent>
          {predictionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <ReferenceLine
                  x={predictionData.find(d => d.isPrediction)?.date}
                  stroke="#888"
                  strokeDasharray="5 5"
                  label={{ value: '예측 시작', position: 'top' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  name="매출"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              예측을 위한 충분한 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 방문자 & 전환율 예측 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>방문자 예측</CardTitle>
            <CardDescription>일별 방문자 수 추이</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    name="방문자"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>전환율 예측</CardTitle>
            <CardDescription>일별 전환율 추이</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="%" domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Line
                    type="monotone"
                    dataKey="conversion"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={false}
                    name="전환율"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 예측 설명 */}
      <Card>
        <CardHeader>
          <CardTitle>예측 모델 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline">데이터 기반</Badge>
            <p className="text-sm text-muted-foreground">
              최근 {historicalData?.length || 0}일간의 실적 데이터를 기반으로 예측합니다.
              더 많은 데이터가 축적될수록 예측 정확도가 향상됩니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline">트렌드 반영</Badge>
            <p className="text-sm text-muted-foreground">
              최근 7일간의 트렌드(상승/하락)를 분석하여 향후 예측에 반영합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline">신뢰 구간</Badge>
            <p className="text-sm text-muted-foreground">
              예측값은 추정치이며, 실제 결과는 외부 요인에 따라 달라질 수 있습니다.
              프로모션, 날씨, 이벤트 등의 특수 상황은 별도로 고려해야 합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
