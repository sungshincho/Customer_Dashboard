import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';

interface RecommendationStrategyResultProps {
  strategies?: {
    strategyName: string;
    strategyType: 'cross-sell' | 'up-sell' | 'personalized' | 'trending';
    targetSegment: string;
    expectedCTR: number;
    expectedCVR: number;
    expectedAOVIncrease: number;
    productPairs?: { product1: string; product2: string; affinity: number }[];
  }[];
  summary?: {
    totalStrategies: number;
    avgCTRIncrease: number;
    avgCVRIncrease: number;
    avgAOVIncrease: number;
    expectedRevenueImpact: number;
  };
  performanceMetrics?: {
    metric: string;
    current: number;
    predicted: number;
  }[];
}

export function RecommendationStrategyResult({ 
  strategies, 
  summary,
  performanceMetrics 
}: RecommendationStrategyResultProps) {
  if (!strategies || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 전략 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 추천 전략 효과를 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>추천 전략 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">총 전략 수</p>
              <p className="text-2xl font-bold">{summary.totalStrategies}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 CTR 증가</p>
              <p className="text-2xl font-bold text-green-500">+{summary.avgCTRIncrease.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 CVR 증가</p>
              <p className="text-2xl font-bold text-green-500">+{summary.avgCVRIncrease.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 AOV 증가</p>
              <p className="text-2xl font-bold text-green-500">+{summary.avgAOVIncrease.toFixed(1)}%</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                예상 매출 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{(summary.expectedRevenueImpact / 10000).toFixed(0)}만원/월
              </p>
            </div>
          </div>

          {performanceMetrics && performanceMetrics.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">성과 지표 비교</h4>
              <div className="space-y-2">
                {performanceMetrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">현재: </span>
                        <span className="font-medium">{metric.current.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">예측: </span>
                        <span className="font-medium text-green-500">{metric.predicted.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-green-500">
                          +{((metric.predicted - metric.current) / metric.current * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추천 전략 상세</CardTitle>
          <CardDescription>각 전략별 예상 효과 및 타겟 세그먼트</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strategies.map((strategy, idx) => (
              <div key={idx} className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="font-medium">{strategy.strategyName}</span>
                    <Badge variant="outline" className="text-xs">
                      {strategy.strategyType === 'cross-sell' && '교차 판매'}
                      {strategy.strategyType === 'up-sell' && '상향 판매'}
                      {strategy.strategyType === 'personalized' && '개인화 추천'}
                      {strategy.strategyType === 'trending' && '트렌드 기반'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">타겟: </span>
                    <span className="font-medium">{strategy.targetSegment}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">예상 CTR: </span>
                    <span className="text-green-500 font-medium">+{strategy.expectedCTR.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">예상 CVR: </span>
                    <span className="text-green-500 font-medium">+{strategy.expectedCVR.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-muted-foreground">평균 주문액 증가: </span>
                  <span className="text-green-500 font-medium">+{strategy.expectedAOVIncrease.toFixed(1)}%</span>
                </div>

                {strategy.productPairs && strategy.productPairs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">추천 상품 조합:</p>
                    <div className="space-y-1">
                      {strategy.productPairs.slice(0, 3).map((pair, pIdx) => (
                        <div key={pIdx} className="text-xs flex items-center justify-between">
                          <span>{pair.product1} + {pair.product2}</span>
                          <span className="text-muted-foreground">연관도: {(pair.affinity * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
