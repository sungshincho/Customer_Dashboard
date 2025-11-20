import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';

interface DemandForecastResultProps {
  forecastData?: {
    dates: string[];
    predictedDemand: number[];
    confidence: number[];
    peakDays?: string[];
    lowDays?: string[];
  };
  summary?: {
    avgDailyDemand: number;
    peakDemand: number;
    totalForecast: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export function DemandForecastResult({ forecastData, summary }: DemandForecastResultProps) {
  if (!forecastData || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>수요 예측 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 수요 예측 결과를 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>수요 예측 요약</span>
            <Badge variant={summary.trend === 'increasing' ? 'default' : summary.trend === 'decreasing' ? 'destructive' : 'secondary'}>
              {summary.trend === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
              {summary.trend === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
              {summary.trend === 'increasing' ? '증가 추세' : summary.trend === 'decreasing' ? '감소 추세' : '안정'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 일일 수요</p>
              <p className="text-2xl font-bold">{summary.avgDailyDemand.toFixed(0)}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">최대 수요 (피크)</p>
              <p className="text-2xl font-bold">{summary.peakDemand.toFixed(0)}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">예측 기간 총계</p>
              <p className="text-2xl font-bold">{summary.totalForecast.toFixed(0)}건</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">일별 예측 수요</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {forecastData.dates.map((date, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">
                    {new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {forecastData.predictedDemand[idx].toFixed(0)}건
                    </span>
                    <span className="text-xs text-muted-foreground">
                      신뢰도: {(forecastData.confidence[idx] * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {(forecastData.peakDays && forecastData.peakDays.length > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              수요 급증 예상일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {forecastData.peakDays.map((day, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(day).toLocaleDateString('ko-KR')}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              💡 해당 날짜에 재고와 인력을 추가로 확보하는 것이 좋습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
