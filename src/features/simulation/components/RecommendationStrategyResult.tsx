import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, ShoppingCart, Users } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

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

  const radarData = performanceMetrics?.map(m => ({
    metric: m.metric,
    현재: m.current,
    예측: m.predicted,
  })) || [];

  const strategyTypeLabels = {
    'cross-sell': '교차 판매',
    'up-sell': '상향 판매',
    'personalized': '개인화 추천',
    'trending': '트렌드 기반',
  };

  const strategyTypeColors = {
    'cross-sell': 'hsl(var(--chart-1))',
    'up-sell': 'hsl(var(--chart-2))',
    'personalized': 'hsl(var(--chart-3))',
    'trending': 'hsl(var(--chart-4))',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>추천 전략 요약</CardTitle>
        </CardHeader>
        <CardContent>
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

          <div className="mt-4 pt-4 border-t">
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
        </CardContent>
      </Card>

      {performanceMetrics && performanceMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>성과 지표 비교</CardTitle>
            <CardDescription>현재 vs 예측 성과</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis className="text-xs" />
                <Radar name="현재" dataKey="현재" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.5} />
                <Radar name="예측" dataKey="예측" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>추천 전략 상세</CardTitle>
          <CardDescription>각 전략별 목표 고객층과 예상 효과</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strategies.map((strategy, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        <span className="font-medium">{strategy.strategyName}</span>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: strategyTypeColors[strategy.strategyType],
                            color: strategyTypeColors[strategy.strategyType]
                          }}
                        >
                          {strategyTypeLabels[strategy.strategyType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>타겟: {strategy.targetSegment}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1 bg-muted/50 p-2 rounded">
                      <p className="text-xs text-muted-foreground">CTR 증가</p>
                      <p className="font-semibold text-green-500">+{strategy.expectedCTR.toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1 bg-muted/50 p-2 rounded">
                      <p className="text-xs text-muted-foreground">CVR 증가</p>
                      <p className="font-semibold text-green-500">+{strategy.expectedCVR.toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1 bg-muted/50 p-2 rounded">
                      <p className="text-xs text-muted-foreground">AOV 증가</p>
                      <p className="font-semibold text-green-500">+{strategy.expectedAOVIncrease.toFixed(1)}%</p>
                    </div>
                  </div>

                  {strategy.productPairs && strategy.productPairs.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-2">추천 상품 조합 (상위 3개):</p>
                      <div className="space-y-1">
                        {strategy.productPairs.slice(0, 3).map((pair, pidx) => (
                          <div key={pidx} className="text-xs flex items-center justify-between bg-primary/5 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-3 h-3" />
                              <span>{pair.product1}</span>
                              <span className="text-muted-foreground">+</span>
                              <span>{pair.product2}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              연관도 {(pair.affinity * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
