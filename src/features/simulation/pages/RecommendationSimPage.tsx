import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target } from "lucide-react";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";

export default function RecommendationSimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🎯 Recommendation Strategy</h1>
          <p className="text-muted-foreground mt-2">AI 고객 추천 정책 실험 | 슬롯 수/위치/룰 변경 → uplift 예측</p>
        </div>
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            트렌드 데이터와 고객 행동 패턴을 기반으로 최적의 추천 전략을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Recommendation Strategy Simulation</CardTitle>
            <CardDescription>
              AI 고객 추천 정책 실험 (슬롯 수/위치/룰 변경 → uplift 예측)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SharedDigitalTwinScene
              overlayType="recommendation"
              height="600px"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
