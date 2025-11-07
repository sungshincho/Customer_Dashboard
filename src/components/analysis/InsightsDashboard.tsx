import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface TimeSeriesPattern {
  period: string;
  trend: string;
  seasonality?: string;
  anomalies?: string[];
}

interface InsightsDashboardProps {
  insights: Insight[];
  correlations?: Correlation[];
  wtpAnalysis?: WTPAnalysis;
  timeSeriesPatterns?: TimeSeriesPattern[];
  summary?: string;
}

export const InsightsDashboard = ({
  insights,
  correlations = [],
  wtpAnalysis,
  timeSeriesPatterns = [],
  summary
}: InsightsDashboardProps) => {
  const getImpactIcon = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCorrelationColor = (correlation: number) => {
    if (Math.abs(correlation) > 0.7) return 'text-red-500';
    if (Math.abs(correlation) > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {summary && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              분석 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{summary}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">핵심 인사이트</TabsTrigger>
          <TabsTrigger value="correlations">상관관계</TabsTrigger>
          <TabsTrigger value="wtp">WTP 분석</TabsTrigger>
          <TabsTrigger value="patterns">시계열 패턴</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">인사이트가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getImpactIcon(insight.impact)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        {insight.category && (
                          <Badge variant="outline" className="mt-1">
                            {insight.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={getImpactColor(insight.impact) as any}>
                      {insight.impact.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{insight.description}</p>
                  {(insight.actionable || insight.recommendation) && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm font-medium text-primary">
                        💡 실행 방안
                      </p>
                      <p className="text-sm mt-1">
                        {insight.actionable || insight.recommendation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          {correlations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">상관관계 데이터가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {correlations.map((corr, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {corr.factor1} ↔ {corr.factor2}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">상관계수</span>
                      <span className={`text-lg font-bold ${getCorrelationColor(corr.correlation)}`}>
                        {corr.correlation.toFixed(3)}
                      </span>
                    </div>
                    {corr.significance && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">유의성</span>
                        <Badge variant="outline">{corr.significance}</Badge>
                      </div>
                    )}
                    {corr.insight && (
                      <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                        {corr.insight}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wtp" className="space-y-4">
          {!wtpAnalysis ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">WTP 분석 데이터가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">평균 지불 의향 (WTP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{wtpAnalysis.avgWTP}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">가격 탄력성</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{wtpAnalysis.priceElasticity}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>권장 사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {wtpAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {timeSeriesPatterns.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">시계열 패턴 데이터가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            timeSeriesPatterns.map((pattern, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{pattern.period}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">추세:</span>
                      <span className="text-sm">{pattern.trend}</span>
                    </div>
                    {pattern.seasonality && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">계절성:</span>
                        <span className="text-sm">{pattern.seasonality}</span>
                      </div>
                    )}
                  </div>
                  {pattern.anomalies && pattern.anomalies.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">이상 징후:</p>
                      <ul className="space-y-1">
                        {pattern.anomalies.map((anomaly, aIdx) => (
                          <li key={aIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {anomaly}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
