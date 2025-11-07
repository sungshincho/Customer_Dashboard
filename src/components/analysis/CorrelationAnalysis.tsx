import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Correlation {
  factor1: string;
  factor2: string;
  correlationPercent: string;
  insight: string;
}

interface CorrelationAnalysisProps {
  correlations?: Correlation[];
}

export const CorrelationAnalysis = ({ correlations = [] }: CorrelationAnalysisProps) => {
  if (!correlations || correlations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <p>상관관계 데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>핵심 상관관계 분석</CardTitle>
          <CardDescription>
            데이터 간 주요 상관관계 및 인사이트
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {correlations.map((corr, idx) => {
              const correlationValue = parseFloat(corr.correlationPercent.replace('%', ''));
              const isPositive = correlationValue > 0;
              
              return (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isPositive ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-semibold text-lg">
                          {corr.factor1} ↔ {corr.factor2}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {corr.insight}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={Math.abs(correlationValue) > 50 ? "default" : "secondary"}
                      className="text-lg px-4 py-2"
                    >
                      {corr.correlationPercent}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상관관계 해석 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">강한 양의 상관</Badge>
              <p className="text-muted-foreground">
                70% 이상: 두 요소가 강하게 연관되어 함께 증가하는 경향
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">중간 상관</Badge>
              <p className="text-muted-foreground">
                30-70%: 두 요소 간 적당한 수준의 연관성 존재
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">약한 상관</Badge>
              <p className="text-muted-foreground">
                30% 미만: 두 요소 간 연관성이 낮거나 미미함
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
