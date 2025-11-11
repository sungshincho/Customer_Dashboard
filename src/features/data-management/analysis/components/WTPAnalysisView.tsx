import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users } from "lucide-react";

interface WTPAnalysis {
  avgWTP: number;
  topSegment: string;
  pricingRecommendation: string;
  purchaseInfluencers?: Array<{
    factor: string;
    score: number;
    insight: string;
  }>;
}

interface WTPAnalysisViewProps {
  wtpAnalysis?: WTPAnalysis;
}

export const WTPAnalysisView = ({ wtpAnalysis }: WTPAnalysisViewProps) => {
  if (!wtpAnalysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <p>WTP 분석 데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 WTP</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{wtpAnalysis.avgWTP.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              지불의사 최대 금액
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 세그먼트</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wtpAnalysis.topSegment}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              최고 가치 고객군
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가격 제안</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="text-sm" variant="default">추천 가격대</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              데이터 기반 최적화
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>가격 결정 제안</CardTitle>
          <CardDescription>데이터 기반 가격 전략 권장사항</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{wtpAnalysis.pricingRecommendation}</p>
          </div>
        </CardContent>
      </Card>

      {wtpAnalysis.purchaseInfluencers && wtpAnalysis.purchaseInfluencers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>구매 영향 인자 TOP 3</CardTitle>
            <CardDescription>고객 구매 의사결정에 가장 큰 영향을 미치는 요소</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wtpAnalysis.purchaseInfluencers.map((influencer, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        #{idx + 1}
                      </Badge>
                      <span className="font-semibold text-lg">{influencer.factor}</span>
                    </div>
                    <Badge variant="default" className="text-base px-3 py-1">
                      영향력: {influencer.score}점
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {influencer.insight}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>WTP 분석 활용 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <p className="font-medium">가격 최적화</p>
                <p className="text-muted-foreground">
                  평균 WTP를 기준으로 가격을 설정하되, 세그먼트별 차별화 전략 고려
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <p className="font-medium">프로모션 전략</p>
                <p className="text-muted-foreground">
                  구매 영향 인자를 활용하여 효과적인 마케팅 메시지 설계
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <p className="font-medium">제품 포지셔닝</p>
                <p className="text-muted-foreground">
                  Top 세그먼트의 특성을 반영한 제품 개선 및 마케팅 집중
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
