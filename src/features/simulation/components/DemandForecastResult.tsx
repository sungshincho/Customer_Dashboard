import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, Package, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DemandDriver {
  factor: string;
  impact: 'positive' | 'negative';
  magnitude: number;
  explanation: string;
}

interface TopProduct {
  sku: string;
  name: string;
  predictedDemand: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

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
  demandDrivers?: DemandDriver[];
  topProducts?: TopProduct[];
  recommendations?: string[];
}

export function DemandForecastResult({ 
  forecastData, 
  summary, 
  demandDrivers,
  topProducts,
  recommendations 
}: DemandForecastResultProps) {
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
            <h4 className="text-sm font-medium mb-3">일별 수요 예측 차트</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={forecastData.dates.map((date, idx) => ({
                date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                demand: forecastData.predictedDemand[idx],
                confidence: forecastData.confidence[idx] * 100
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="demand" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {demandDrivers && demandDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              수요 영향 요인 분석
            </CardTitle>
            <CardDescription>예측된 수요에 영향을 미치는 주요 요인들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demandDrivers.map((driver, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{driver.factor}</span>
                    <Badge variant={driver.impact === 'positive' ? 'default' : 'destructive'}>
                      {driver.impact === 'positive' ? `+${driver.magnitude}%` : `${driver.magnitude}%`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{driver.explanation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topProducts && topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Top 10 상품별 수요 예측
            </CardTitle>
            <CardDescription>높은 수요가 예상되는 상품들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.slice(0, 10).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">{product.predictedDemand}개</p>
                      <p className="text-xs text-muted-foreground">신뢰도 {(product.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <Badge variant={
                      product.trend === 'up' ? 'default' : 
                      product.trend === 'down' ? 'destructive' : 
                      'secondary'
                    }>
                      {product.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {product.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                      {product.trend === 'up' ? '증가' : product.trend === 'down' ? '감소' : '안정'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations && recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              권장 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
