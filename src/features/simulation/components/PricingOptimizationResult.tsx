import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';

interface PricingRecommendation {
  productSku?: string;
  sku?: string;
  productName?: string;
  name?: string;
  currentPrice?: number;
  optimalPrice?: number;
  recommendedPrice?: number;
  priceChange?: number;
  expectedDemandChange?: number;
  expectedRevenueChange?: number;
  elasticity?: number;
  strategy?: string;
  expectedImpact?: string;
}

interface PricingSummary {
  totalProducts?: number;
  avgPriceChange?: number;
  expectedRevenueIncrease?: number;
  projectedRevenueIncrease?: number;
  expectedMarginIncrease?: number;
  recommendedDiscounts?: number;
  priceDecreases?: number;
  recommendedIncreases?: number;
  priceIncreases?: number;
  noChange?: number;
}

interface PricingOptimizationResultProps {
  recommendations?: PricingRecommendation[];
  summary?: PricingSummary;
}

// 안전한 숫자 포맷 헬퍼
const safeToFixed = (value: number | undefined | null, digits: number = 1): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toFixed(digits);
};

const safeToLocaleString = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString();
};

export function PricingOptimizationResult({ recommendations, summary }: PricingOptimizationResultProps) {
  if (!recommendations || recommendations.length === 0) {
    if (!summary) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>가격 최적화 결과</CardTitle>
            <CardDescription>시뮬레이션을 실행하여 가격 최적화 방안을 확인하세요</CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  // 정규화된 recommendations
  const normalizedRecs = (recommendations || []).map(rec => ({
    productSku: rec.productSku || rec.sku || 'N/A',
    productName: rec.productName || rec.name || '상품명 없음',
    currentPrice: rec.currentPrice || 0,
    optimalPrice: rec.optimalPrice || rec.recommendedPrice || rec.currentPrice || 0,
    priceChange: rec.priceChange || 0,
    expectedDemandChange: rec.expectedDemandChange || 0,
    expectedRevenueChange: rec.expectedRevenueChange || 0,
    elasticity: rec.elasticity || 0,
    strategy: rec.strategy,
    expectedImpact: rec.expectedImpact,
  }));

  // 정규화된 summary
  const normalizedSummary = {
    totalProducts: summary?.totalProducts || normalizedRecs.length || 0,
    avgPriceChange: summary?.avgPriceChange || 0,
    expectedRevenueIncrease: summary?.expectedRevenueIncrease || summary?.projectedRevenueIncrease || 0,
    expectedMarginIncrease: summary?.expectedMarginIncrease || 0,
    recommendedDiscounts: summary?.recommendedDiscounts || summary?.priceDecreases || 0,
    recommendedIncreases: summary?.recommendedIncreases || summary?.priceIncreases || 0,
    noChange: summary?.noChange || 0,
  };

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
              <p className="text-2xl font-bold">{normalizedSummary.totalProducts}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 가격 변화</p>
              <p className={`text-2xl font-bold ${normalizedSummary.avgPriceChange > 0 ? 'text-green-500' : normalizedSummary.avgPriceChange < 0 ? 'text-red-500' : ''}`}>
                {normalizedSummary.avgPriceChange > 0 && '+'}
                {safeToFixed(normalizedSummary.avgPriceChange, 1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">할인 권장</p>
              <p className="text-2xl font-bold text-orange-500">{normalizedSummary.recommendedDiscounts}개</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                예상 매출 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{safeToFixed(normalizedSummary.expectedRevenueIncrease / 10000, 0)}만원/월
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Percent className="w-4 h-4" />
                예상 마진 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{safeToFixed(normalizedSummary.expectedMarginIncrease, 1)}%p
              </p>
            </div>
          </div>

          {normalizedRecs.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">상품별 가격 변화 효과</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {normalizedRecs.map((rec, idx) => (
                  <div key={idx} className="py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{rec.productName}</p>
                      <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                        {rec.priceChange > 0 ? '인상' : rec.priceChange < 0 ? '할인' : '유지'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">가격 변화: </span>
                        <span className={rec.priceChange > 0 ? 'text-red-500' : rec.priceChange < 0 ? 'text-green-500' : ''}>
                          {rec.priceChange > 0 && '+'}
                          {safeToFixed(rec.priceChange, 1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">매출 효과: </span>
                        <span className="text-green-500">
                          +{safeToFixed(rec.expectedRevenueChange, 1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">탄력성: </span>
                        <span>{safeToFixed(Math.abs(rec.elasticity || 0), 2)}</span>
                      </div>
                    </div>
                    {rec.strategy && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        전략: {rec.strategy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {normalizedRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>우선 적용 권장 상품</CardTitle>
            <CardDescription>가장 큰 매출 증가 효과가 예상되는 상품</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalizedRecs
                .sort((a, b) => (b.expectedRevenueChange || 0) - (a.expectedRevenueChange || 0))
                .slice(0, 5)
                .map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">{rec.productName}</span>
                        <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                          {rec.priceChange > 0 ? '인상' : rec.priceChange < 0 ? '할인' : '유지'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">SKU: {rec.productSku}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">현재 가격: </span>
                        <span className="font-medium">{safeToLocaleString(rec.currentPrice)}원</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">권장 가격: </span>
                        <span className="font-medium text-primary">{safeToLocaleString(rec.optimalPrice)}원</span>
                      </div>
                      <div className="text-xs">
                        <span className={rec.priceChange > 0 ? 'text-red-500' : rec.priceChange < 0 ? 'text-green-500' : ''}>
                          {rec.priceChange > 0 && '+'}
                          {safeToFixed(rec.priceChange, 1)}%
                        </span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-green-500">
                          매출 +{safeToFixed(rec.expectedRevenueChange, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
