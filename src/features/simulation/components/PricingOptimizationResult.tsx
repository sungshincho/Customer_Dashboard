import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>가격 최적화 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">상품별 가격 변화 효과</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="py-2 px-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{rec.productName}</p>
                    <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                      {rec.priceChange > 0 ? '인상' : '할인'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">가격 변화: </span>
                      <span className={rec.priceChange > 0 ? 'text-red-500' : 'text-green-500'}>
                        {rec.priceChange > 0 && '+'}
                        {rec.priceChange.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">매출 효과: </span>
                      <span className="text-green-500">
                        +{rec.expectedRevenueChange.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">탄력성: </span>
                      <span>{Math.abs(rec.elasticity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
