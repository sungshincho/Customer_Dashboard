import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Lightbulb, Target, ArrowRight } from "lucide-react";
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
  significance?: string;
  insight?: string;
}

interface WTPAnalysis {
  avgWTP: string;
  priceElasticity: string;
  recommendations: string[];
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
  const getImpactConfig = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return { 
          icon: AlertCircle, 
          color: 'text-red-500', 
          bg: 'bg-red-500/10 border-red-500/20',
          badge: 'destructive' as const
        };
      case 'medium':
        return { 
          icon: TrendingUp, 
          color: 'text-yellow-500', 
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          badge: 'default' as const
        };
      default:
        return { 
          icon: Lightbulb, 
          color: 'text-green-500', 
          bg: 'bg-green-500/10 border-green-500/20',
          badge: 'secondary' as const
        };
    }
  };

  const topCorrelations = correlations
    .filter(c => Math.abs(c.correlation) > 0.5)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 요약 */}
      {summary && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-lg leading-relaxed">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 핵심 인사이트 - 간결한 카드 형태 */}
      <div className="grid gap-3">
        {insights.slice(0, 4).map((insight, idx) => {
          const config = getImpactConfig(insight.impact);
          const Icon = config.icon;
          
          return (
            <Card key={idx} className={`hover:shadow-md transition-all ${config.bg} border`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{insight.title}</h4>
                      <Badge variant={config.badge} className="text-xs">
                        {insight.impact === 'high' ? '높음' : insight.impact === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    {(insight.actionable || insight.recommendation) && (
                      <div className="flex items-start gap-2 p-2 bg-background/80 rounded border border-primary/10">
                        <ArrowRight className={`h-4 w-4 ${config.color} flex-shrink-0 mt-0.5`} />
                        <p className="text-sm font-medium">
                          {insight.actionable || insight.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2열 레이아웃: 상관관계 & WTP */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 강한 상관관계 */}
        {topCorrelations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                핵심 상관관계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCorrelations.map((corr, idx) => {
                const strength = Math.abs(corr.correlation);
                const strengthPercent = (strength * 100).toFixed(0);
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {corr.factor1} ↔ {corr.factor2}
                      </span>
                      <Badge variant={strength > 0.7 ? 'default' : 'outline'}>
                        {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
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
            </CardContent>
          </Card>
        )}

        {/* WTP 분석 */}
        {wtpAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                가격 최적화
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">평균 WTP</p>
                  <p className="text-xl font-bold text-primary">{wtpAnalysis.avgWTP}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">가격 탄력성</p>
                  <p className="text-xl font-bold text-primary">{wtpAnalysis.priceElasticity}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {wtpAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};