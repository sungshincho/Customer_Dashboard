import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KpiSnapshot } from '../types/scenario.types';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface PredictionResultCardProps {
  predictedKpi?: KpiSnapshot;
  baselineKpi?: KpiSnapshot;
  confidenceScore?: number;
  aiInsights?: string;
}

export function PredictionResultCard({
  predictedKpi,
  baselineKpi,
  confidenceScore,
  aiInsights,
}: PredictionResultCardProps) {
  if (!predictedKpi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>예측 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 예측 결과를 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getDelta = (metric: keyof KpiSnapshot) => {
    if (!baselineKpi || !predictedKpi) return null;
    const baseline = baselineKpi[metric];
    const predicted = predictedKpi[metric];
    if (typeof baseline !== 'number' || typeof predicted !== 'number') return null;
    
    const delta = predicted - baseline;
    const deltaPercent = baseline !== 0 ? (delta / baseline) * 100 : 0;
    return { delta, deltaPercent };
  };

  const renderDelta = (metric: keyof KpiSnapshot) => {
    const result = getDelta(metric);
    if (!result) return null;

    const { delta, deltaPercent } = result;
    const isPositive = delta > 0;
    const isNegative = delta < 0;

    return (
      <div className="flex items-center gap-1 text-sm">
        {isPositive && <TrendingUp className="w-4 h-4 text-green-500" />}
        {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
        {!isPositive && !isNegative && <Minus className="w-4 h-4 text-muted-foreground" />}
        <span
          className={
            isPositive
              ? 'text-green-500'
              : isNegative
              ? 'text-red-500'
              : 'text-muted-foreground'
          }
        >
          {isPositive && '+'}
          {deltaPercent.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>예측 결과</CardTitle>
            <CardDescription>AI 기반 시뮬레이션 예측</CardDescription>
          </div>
          {confidenceScore !== undefined && (
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                신뢰도 {confidenceScore.toFixed(0)}%
              </Badge>
              <Progress value={confidenceScore} className="w-24 h-2" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 주요 KPI 표시 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {predictedKpi.conversionRate !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">전환율</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{predictedKpi.conversionRate.toFixed(1)}%</p>
                {renderDelta('conversionRate')}
              </div>
            </div>
          )}
          
          {predictedKpi.totalRevenue !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">총 매출</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {(predictedKpi.totalRevenue / 10000).toFixed(0)}만원
                </p>
                {renderDelta('totalRevenue')}
              </div>
            </div>
          )}
          
          {predictedKpi.salesPerSqm !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평당매출</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {(predictedKpi.salesPerSqm / 10000).toFixed(1)}만원/㎡
                </p>
                {renderDelta('salesPerSqm')}
              </div>
            </div>
          )}
          
          {predictedKpi.netProfit !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">순이익</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {(predictedKpi.netProfit / 10000).toFixed(0)}만원
                </p>
                {renderDelta('netProfit')}
              </div>
            </div>
          )}
        </div>

        {/* AI 인사이트 */}
        {aiInsights && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm">AI 인사이트</p>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsights}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
