import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

interface PricingOptimizationResultProps {
  recommendations?: {
    productSku: string;
    productName: string;
    currentPrice: number;
    optimalPrice: number;
    priceChange: number;
    expectedDemandChange: number;
    expectedRevenueChange: number;
    elasticity: number;
  }[];
  summary?: {
    totalProducts: number;
    avgPriceChange: number;
    expectedRevenueIncrease: number;
    expectedMarginIncrease: number;
    recommendedDiscounts: number;
    recommendedIncreases: number;
  };
}

export function PricingOptimizationResult({ recommendations, summary }: PricingOptimizationResultProps) {
  if (!recommendations || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>가격 최적화 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 가격 최적화 방안을 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = recommendations.map((rec) => ({
    name: rec.productName,
    priceChange: rec.priceChange,
    revenueChange: rec.expectedRevenueChange,
    elasticity: Math.abs(rec.elasticity) * 100,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>가격 최적화 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">분석 상품</p>
              <p className="text-2xl font-bold">{summary.totalProducts}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 가격 변화</p>
              <p className={`text-2xl font-bold ${summary.avgPriceChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summary.avgPriceChange > 0 && '+'}
                {summary.avgPriceChange.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">할인 권장</p>
              <p className="text-2xl font-bold text-orange-500">{summary.recommendedDiscounts}개</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                예상 매출 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{(summary.expectedRevenueIncrease / 10000).toFixed(0)}만원/월
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Percent className="w-4 h-4" />
                예상 마진 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{summary.expectedMarginIncrease.toFixed(1)}%p
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가격 변화 vs 매출 효과</CardTitle>
          <CardDescription>상품별 가격 변화와 예상 매출 변화의 관계</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                dataKey="priceChange" 
                name="가격 변화 (%)" 
                className="text-xs"
                label={{ value: '가격 변화 (%)', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="revenueChange" 
                name="매출 변화 (%)" 
                className="text-xs"
                label={{ value: '매출 변화 (%)', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" dataKey="elasticity" range={[50, 400]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="상품" data={chartData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 점의 크기는 가격 탄력성을 나타냅니다
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>우선 적용 권장 상품</CardTitle>
          <CardDescription>가장 큰 매출 증가 효과가 예상되는 상품</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations
              .sort((a, b) => b.expectedRevenueChange - a.expectedRevenueChange)
              .slice(0, 5)
              .map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">{rec.productName}</span>
                      <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                        {rec.priceChange > 0 ? '인상' : '할인'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">SKU: {rec.productSku}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm">
                      <span className="text-muted-foreground">현재 가격: </span>
                      <span className="font-medium">{rec.currentPrice.toLocaleString()}원</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">권장 가격: </span>
                      <span className="font-medium text-primary">{rec.optimalPrice.toLocaleString()}원</span>
                    </div>
                    <div className="text-xs">
                      <span className={rec.priceChange > 0 ? 'text-red-500' : 'text-green-500'}>
                        {rec.priceChange > 0 && '+'}
                        {rec.priceChange.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-green-500">
                        매출 +{rec.expectedRevenueChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
