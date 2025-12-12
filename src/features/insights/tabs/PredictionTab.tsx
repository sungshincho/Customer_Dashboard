/**
 * PredictionTab.tsx
 *
 * 인사이트 허브 - AI 예측 탭
 * AI 기반 매출/방문자/전환율 예측 시스템
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Brain,
  Calendar,
  Users,
  Percent,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Info,
} from 'lucide-react';
import { useAIPrediction, DailyPrediction } from '../hooks/useAIPrediction';
import { formatCurrency } from '../components';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 신뢰도 레벨 계산
function getConfidenceLevel(confidence: number): { label: string; color: string } {
  if (confidence >= 70) return { label: '높음', color: 'text-green-500' };
  if (confidence >= 40) return { label: '보통', color: 'text-yellow-500' };
  return { label: '낮음', color: 'text-red-500' };
}

// 트렌드 방향 아이콘
function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Activity className="h-4 w-4 text-gray-500" />;
}

// 차트 데이터 포맷
function formatChartData(historical: DailyPrediction[], predictions: DailyPrediction[]) {
  const combined = [...historical, ...predictions];
  return combined.map((d) => ({
    date: format(new Date(d.date), 'MM/dd'),
    fullDate: d.date,
    revenue: d.predicted_revenue,
    visitors: d.predicted_visitors,
    conversion: d.predicted_conversion,
    isPrediction: d.is_prediction,
    lowerBound: d.lower_bound_revenue,
    upperBound: d.upper_bound_revenue,
    confidence: d.confidence,
  }));
}

export function PredictionTab() {
  const { data, isLoading, error } = useAIPrediction();

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    if (!data?.historicalData || !data?.dailyPredictions) return [];
    return formatChartData(data.historicalData, data.dailyPredictions);
  }, [data]);

  // 예측 시작점 (실제 데이터의 마지막 날짜)
  const predictionStartDate = useMemo(() => {
    if (!chartData.length) return null;
    const firstPrediction = chartData.find((d) => d.isPrediction);
    return firstPrediction?.date || null;
  }, [chartData]);

  // 로딩 상태
  if (isLoading) {
    return <PredictionTabSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>예측 데이터를 불러오는 중 오류가 발생했습니다</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const { summary, dailyPredictions } = data || {};

  // 데이터 없음 상태
  if (!summary || !dailyPredictions?.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>예측을 위한 충분한 데이터가 없습니다</p>
          <p className="text-sm mt-2">최소 7일 이상의 판매 데이터가 필요합니다</p>
        </div>
      </div>
    );
  }

  const confidenceLevel = getConfidenceLevel(summary.overall_confidence);

  return (
    <div className="space-y-6">
      {/* AI 예측 배너 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Brain className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI 기반 예측</h3>
            <p className="text-xs text-muted-foreground">
              통계적 분석과 트렌드를 기반으로 향후 7일을 예측합니다
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-violet-500/20 text-violet-600 border-violet-500/30">
          <Sparkles className="h-3 w-3 mr-1" />
          {summary.model_info.data_points}일 데이터 분석
        </Badge>
      </div>

      {/* 요약 카드 4개 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 향후 7일 예상 매출 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              향후 7일 예상 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.total_predicted_revenue)}
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs mt-1',
                summary.revenue_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {summary.revenue_change_percent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              전주 대비 {summary.revenue_change_percent >= 0 ? '+' : ''}
              {summary.revenue_change_percent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* 예상 방문자 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              예상 방문자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_predicted_visitors.toLocaleString()}명
            </div>
            <p className="text-xs text-muted-foreground mt-1">향후 7일 누적</p>
          </CardContent>
        </Card>

        {/* 예상 전환율 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              예상 전환율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avg_predicted_conversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">7일 평균 예측</p>
          </CardContent>
        </Card>

        {/* 예측 신뢰도 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              예측 신뢰도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', confidenceLevel.color)}>
              {confidenceLevel.label}
            </div>
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                  style={{ width: `${summary.overall_confidence}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.overall_confidence}% 신뢰도
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매출 예측 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            매출 예측
          </CardTitle>
          <CardDescription>과거 14일 실적 및 향후 7일 예측 (보라색 영역: 예측)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm">
                        {data.isPrediction ? '예상 매출: ' : '매출: '}
                        {formatCurrency(data.revenue)}
                      </p>
                      {data.isPrediction && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            신뢰구간: {formatCurrency(data.lowerBound)} ~ {formatCurrency(data.upperBound)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            신뢰도: {Math.round(data.confidence * 100)}%
                          </p>
                        </>
                      )}
                      <Badge variant={data.isPrediction ? 'secondary' : 'outline'} className="mt-1">
                        {data.isPrediction ? '예측' : '실적'}
                      </Badge>
                    </div>
                  );
                }}
              />
              {predictionStartDate && (
                <ReferenceLine
                  x={predictionStartDate}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  label={{
                    value: '예측 시작',
                    position: 'top',
                    fill: '#8b5cf6',
                    fontSize: 12,
                  }}
                />
              )}
              {/* 신뢰구간 영역 (예측 부분만) */}
              <Area
                type="monotone"
                dataKey={(d: { isPrediction: boolean; upperBound?: number }) => (d.isPrediction ? d.upperBound : null)}
                stroke="none"
                fill="url(#colorPrediction)"
                fillOpacity={0.3}
              />
              {/* 실제 데이터 영역 */}
              <Area
                type="monotone"
                dataKey={(d: { isPrediction: boolean; revenue?: number }) => (!d.isPrediction ? d.revenue : null)}
                stroke="hsl(var(--primary))"
                fill="url(#colorActual)"
                strokeWidth={2}
                connectNulls={false}
              />
              {/* 예측 데이터 라인 */}
              <Line
                type="monotone"
                dataKey={(d: { isPrediction: boolean; revenue?: number }) => (d.isPrediction ? d.revenue : null)}
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 0 }}
                connectNulls={false}
              />
              {/* 실제 데이터 라인 */}
              <Line
                type="monotone"
                dataKey={(d: { isPrediction: boolean; revenue?: number }) => (!d.isPrediction ? d.revenue : null)}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 방문자 & 전환율 예측 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 방문자 예측 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              방문자 예측
            </CardTitle>
            <CardDescription>일별 방문자 수 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">
                          {data.isPrediction ? '예상 방문자: ' : '방문자: '}
                          {data.visitors.toLocaleString()}명
                        </p>
                        <Badge variant={data.isPrediction ? 'secondary' : 'outline'} className="mt-1">
                          {data.isPrediction ? '예측' : '실적'}
                        </Badge>
                      </div>
                    );
                  }}
                />
                {predictionStartDate && (
                  <ReferenceLine x={predictionStartDate} stroke="#8b5cf6" strokeDasharray="5 5" />
                )}
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isPrediction) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#8b5cf6"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={0} />;
                  }}
                  strokeDasharray="0"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 전환율 예측 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-500" />
              전환율 예측
            </CardTitle>
            <CardDescription>일별 전환율 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis unit="%" domain={['auto', 'auto']} className="text-xs" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">
                          {data.isPrediction ? '예상 전환율: ' : '전환율: '}
                          {data.conversion.toFixed(1)}%
                        </p>
                        <Badge variant={data.isPrediction ? 'secondary' : 'outline'} className="mt-1">
                          {data.isPrediction ? '예측' : '실적'}
                        </Badge>
                      </div>
                    );
                  }}
                />
                {predictionStartDate && (
                  <ReferenceLine x={predictionStartDate} stroke="#8b5cf6" strokeDasharray="5 5" />
                )}
                <Line
                  type="monotone"
                  dataKey="conversion"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isPrediction) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#8b5cf6"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={0} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 일별 예측 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-500" />
            일별 예측 상세
          </CardTitle>
          <CardDescription>향후 7일 예측 데이터</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">날짜</th>
                  <th className="text-right py-3 px-4 font-medium">예상 매출</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    신뢰구간
                  </th>
                  <th className="text-right py-3 px-4 font-medium">방문자</th>
                  <th className="text-right py-3 px-4 font-medium">전환율</th>
                  <th className="text-right py-3 px-4 font-medium">신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {dailyPredictions.map((pred, idx) => {
                  const conf = Math.round(pred.confidence * 100);
                  const confLevel = getConfidenceLevel(conf);
                  return (
                    <tr key={pred.date} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span>
                            {format(new Date(pred.date), 'M월 d일 (EEE)', { locale: ko })}
                          </span>
                          {idx === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              내일
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {formatCurrency(pred.predicted_revenue)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground text-xs">
                        {formatCurrency(pred.lower_bound_revenue)} ~{' '}
                        {formatCurrency(pred.upper_bound_revenue)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {pred.predicted_visitors.toLocaleString()}명
                      </td>
                      <td className="text-right py-3 px-4">{pred.predicted_conversion.toFixed(1)}%</td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className={cn('text-xs', confLevel.color)}>{conf}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 예측 모델 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            예측 모델 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline">데이터 기반</Badge>
              <div>
                <p className="text-sm font-medium">{summary.model_info.data_points}일</p>
                <p className="text-xs text-muted-foreground">분석된 데이터 일수</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">트렌드</Badge>
              <div className="flex items-center gap-2">
                <TrendIcon direction={summary.model_info.trend_direction} />
                <div>
                  <p className="text-sm font-medium">
                    {summary.model_info.trend_direction === 'up'
                      ? '상승'
                      : summary.model_info.trend_direction === 'down'
                        ? '하락'
                        : '안정'}
                  </p>
                  <p className="text-xs text-muted-foreground">최근 매출 추세</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">요일 패턴</Badge>
              <div>
                <p className="text-sm font-medium">
                  {summary.model_info.seasonality_detected ? '감지됨' : '미감지'}
                </p>
                <p className="text-xs text-muted-foreground">주중/주말 패턴</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">업데이트</Badge>
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(summary.model_info.last_updated), 'HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground">마지막 분석 시간</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              이 예측은 과거 {summary.model_info.data_points}일간의 데이터를 기반으로 통계적 분석
              (이동평균, 트렌드, 요일 패턴)을 적용하여 생성되었습니다. 예측값은 참고용이며, 프로모션,
              날씨, 이벤트 등 외부 요인에 따라 실제 결과가 달라질 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 로딩 스켈레톤
function PredictionTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* 배너 스켈레톤 */}
      <Skeleton className="h-16 w-full" />

      {/* 요약 카드 스켈레톤 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 차트 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>

      {/* 작은 차트 스켈레톤 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 테이블 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
