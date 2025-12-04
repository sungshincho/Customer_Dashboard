import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';

interface ProductPair {
  product1?: string;
  product2?: string;
  affinity?: number;
}

interface Strategy {
  strategyName?: string;
  name?: string;
  strategyType?: 'cross-sell' | 'up-sell' | 'personalized' | 'trending' | string;
  type?: string;
  targetSegment?: string;
  target?: string;
  expectedCTR?: number;
  expectedCVR?: number;
  expectedAOVIncrease?: number;
  productPairs?: ProductPair[];
}

interface StrategySummary {
  totalStrategies?: number;
  avgCTRIncrease?: number;
  avgCVRIncrease?: number;
  avgAOVIncrease?: number;
  expectedRevenueImpact?: number;
}

interface PerformanceMetric {
  metric?: string;
  name?: string;
  current?: number;
  predicted?: number;
}

interface RecommendationStrategyResultProps {
  strategies?: Strategy[];
  summary?: StrategySummary;
  performanceMetrics?: PerformanceMetric[];
}

// 안전한 숫자 헬퍼
const safeNumber = (value: number | undefined | null, defaultValue: number = 0): number => {
  if (value === undefined || value === null || isNaN(Number(value))) return defaultValue;
  return Number(value);
};

const safeToFixed = (value: number | undefined | null, digits: number = 1): string => {
  return safeNumber(value).toFixed(digits);
};

export function RecommendationStrategyResult({ 
  strategies, 
  summary,
  performanceMetrics 
}: RecommendationStrategyResultProps) {
  if (!strategies || strategies.length === 0) {
    if (!summary) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>추천 전략 결과</CardTitle>
            <CardDescription>시뮬레이션을 실행하여 추천 전략 효과를 확인하세요</CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  // 정규화된 summary
  const normalizedSummary = {
    totalStrategies: safeNumber(summary?.totalStrategies, strategies?.length || 0),
    avgCTRIncrease: safeNumber(summary?.avgCTRIncrease),
    avgCVRIncrease: safeNumber(summary?.avgCVRIncrease),
    avgAOVIncrease: safeNumber(summary?.avgAOVIncrease),
    expectedRevenueImpact: safeNumber(summary?.expectedRevenueImpact),
  };

  // 정규화된 strategies
  const normalizedStrategies = (strategies || []).map((strategy, idx) => ({
    strategyName: strategy.strategyName || strategy.name || `전략 ${idx + 1}`,
    strategyType: strategy.strategyType || strategy.type || 'personalized',
    targetSegment: strategy.targetSegment || strategy.target || '전체 고객',
    expectedCTR: safeNumber(strategy.expectedCTR),
    expectedCVR: safeNumber(strategy.expectedCVR),
    expectedAOVIncrease: safeNumber(strategy.expectedAOVIncrease),
    productPairs: strategy.productPairs || [],
  }));

  // 정규화된 performanceMetrics
  const normalizedMetrics = (performanceMetrics || []).map(metric => ({
    metric: metric.metric || metric.name || '지표',
    current: safeNumber(metric.current),
    predicted: safeNumber(metric.predicted),
  }));

  const getStrategyTypeLabel = (type: string) => {
    switch (type) {
      case 'cross-sell': return '교차 판매';
      case 'up-sell': return '상향 판매';
      case 'personalized': return '개인화 추천';
      case 'trending': return '트렌드 기반';
      default: return type;
    }
  };

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
              <p className="text-2xl font-bold">{normalizedSummary.totalStrategies}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 CTR 증가</p>
              <p className="text-2xl font-bold text-green-500">+{safeToFixed(normalizedSummary.avgCTRIncrease)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 CVR 증가</p>
              <p className="text-2xl font-bold text-green-500">+{safeToFixed(normalizedSummary.avgCVRIncrease)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 AOV 증가</p>
              <p className="text-2xl font-bold text-green-500">+{safeToFixed(normalizedSummary.avgAOVIncrease)}%</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                예상 매출 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{safeToFixed(normalizedSummary.expectedRevenueImpact / 10000, 0)}만원/월
              </p>
            </div>
          </div>

          {normalizedMetrics.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">성과 지표 비교</h4>
              <div className="space-y-2">
                {normalizedMetrics.map((metric, idx) => {
                  const changePercent = metric.current !== 0 
                    ? ((metric.predicted - metric.current) / metric.current * 100) 
                    : 0;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">현재: </span>
                          <span className="font-medium">{safeToFixed(metric.current)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">예측: </span>
                          <span className="font-medium text-green-500">{safeToFixed(metric.predicted)}</span>
                        </div>
                        <div>
                          <span className="text-green-500">
                            +{safeToFixed(changePercent)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {normalizedStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>추천 전략 상세</CardTitle>
            <CardDescription>각 전략별 예상 효과 및 타겟 세그먼트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalizedStrategies.map((strategy, idx) => (
                <div key={idx} className="p-3 bg-muted/50 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="font-medium">{strategy.strategyName}</span>
                      <Badge variant="outline" className="text-xs">
                        {getStrategyTypeLabel(strategy.strategyType)}
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
                      <span className="text-green-500 font-medium">+{safeToFixed(strategy.expectedCTR)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">예상 CVR: </span>
                      <span className="text-green-500 font-medium">+{safeToFixed(strategy.expectedCVR)}%</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-muted-foreground">평균 주문액 증가: </span>
                    <span className="text-green-500 font-medium">+{safeToFixed(strategy.expectedAOVIncrease)}%</span>
                  </div>

                  {strategy.productPairs && strategy.productPairs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">추천 상품 조합:</p>
                      <div className="space-y-1">
                        {strategy.productPairs.slice(0, 3).map((pair, pIdx) => (
                          <div key={pIdx} className="text-xs flex items-center justify-between">
                            <span>{pair.product1 || '상품A'} + {pair.product2 || '상품B'}</span>
                            <span className="text-muted-foreground">연관도: {safeToFixed(safeNumber(pair.affinity) * 100, 0)}%</span>
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
      )}
    </div>
  );
}
