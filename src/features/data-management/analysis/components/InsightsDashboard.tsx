import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, ArrowRight, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Insight {
  category?: string;
  title: string;
  description: string;
  impact: string;
  actionable?: string;
  recommendation?: string;
}

interface Correlation {
  factor1: string;
  factor2: string;
  correlation: number;
  correlationPercent?: string;
  insight?: string;
  actionable?: string;
}

interface PurchaseInfluencer {
  factor: string;
  score: number;
  insight: string;
}

interface WTPAnalysis {
  avgWTP: number;
  atv: number;
  priceElasticityScore: number;
  priceElasticityInsights: string[];
  pricingRecommendation?: string;
  purchaseInfluencers?: PurchaseInfluencer[];
  actionable: string;
}

interface InsightsDashboardProps {
  insights: Insight[];
  correlations?: Correlation[];
  wtpAnalysis?: WTPAnalysis;
  summary?: string;
}

export const InsightsDashboard = ({
  insights,
  correlations = [],
  wtpAnalysis,
  summary
}: InsightsDashboardProps) => {
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const topCorrelations = correlations
    .filter(c => Math.abs(c.correlation) > 0.5)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 3);

  // 핵심 실행 방안 추출
  const insightActions = insights.slice(0, 3).map(i => i.actionable || i.recommendation).filter(Boolean);
  const correlationActions = topCorrelations.map(c => c.actionable).filter(Boolean);
  const wtpAction = wtpAnalysis?.actionable;

  return (
    <div className="space-y-6">
      {/* 요약 */}
      {summary && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-base leading-relaxed">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 1. 핵심 인사이트 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              1. 핵심 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                    {idx + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1">{insight.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getImpactColor(insight.impact)} border-0 flex-shrink-0`}
                  >
                    {insight.impact === 'high' ? 'H' : insight.impact === 'medium' ? 'M' : 'L'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {/* 핵심 실행 방안 */}
            {insightActions.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  핵심 실행 방안
                </p>
                <div className="space-y-1.5">
                  {insightActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-muted-foreground leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 핵심 상관관계 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              2. 핵심 상관관계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCorrelations.length > 0 ? (
              <>
                {topCorrelations.map((corr, idx) => {
                  const strength = Math.abs(corr.correlation);
                  const isPositive = corr.correlation > 0;
                  
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {corr.factor1} ↔ {corr.factor2}
                        </p>
                        <Badge 
                          variant={strength > 0.7 ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {corr.correlationPercent || `${(strength * 100).toFixed(0)}%`}
                        </Badge>
                      </div>
                      <Progress value={strength * 100} className="h-1.5" />
                      {corr.insight && (
                        <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                          {corr.insight}
                        </p>
                      )}
                    </div>
                  );
                })}
                
                {/* 핵심 실행 방안 */}
                {correlationActions.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      핵심 실행 방안
                    </p>
                    <div className="space-y-1.5">
                      {correlationActions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="text-primary mt-0.5">•</span>
                          <p className="text-muted-foreground leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                상관관계 데이터 부족
              </p>
            )}
          </CardContent>
        </Card>

        {/* 3. WTP 분석 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              3. WTP 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wtpAnalysis ? (
              <>
                {/* 핵심 메트릭 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">지불의사최대금액</p>
                    <p className="text-lg font-bold text-primary">
                      ₩{(wtpAnalysis.avgWTP || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">객단가 (ATV)</p>
                    <p className="text-lg font-bold text-primary">
                      ₩{(wtpAnalysis.atv || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 가격결정 제안 */}
                {wtpAnalysis.pricingRecommendation && (
                  <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                    <p className="text-xs font-semibold mb-1.5 text-green-600">가격결정 제안</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {wtpAnalysis.pricingRecommendation}
                    </p>
                  </div>
                )}

                {/* 구매영향인자 TOP 3 */}
                {wtpAnalysis.purchaseInfluencers && wtpAnalysis.purchaseInfluencers.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold mb-2">구매영향인자 TOP 3</p>
                    <div className="space-y-2">
                      {wtpAnalysis.purchaseInfluencers.map((influencer, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{influencer.factor}</p>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(influencer.score / 10) * 100} 
                                className="h-1.5 w-12"
                              />
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {influencer.score.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                            {influencer.insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 가격 탄력성 */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold">가격 탄력성</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(wtpAnalysis.priceElasticityScore / 10) * 100} 
                        className="h-1.5 w-16"
                      />
                      <Badge variant="outline" className="text-xs">
                        {wtpAnalysis.priceElasticityScore.toFixed(1)}/10
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {wtpAnalysis.priceElasticityInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs">
                        <span className="text-primary mt-0.5">•</span>
                        <p className="text-muted-foreground">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 핵심 실행 방안 */}
                {wtpAction && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      핵심 실행 방안
                    </p>
                    <div className="flex items-start gap-1.5 text-xs">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-muted-foreground leading-relaxed">{wtpAction}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                WTP 분석 데이터 부족
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};