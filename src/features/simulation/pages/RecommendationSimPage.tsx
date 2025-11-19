import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target } from "lucide-react";

export default function RecommendationSimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🎯 추천 전략 시뮬레이션</h1>
          <p className="text-muted-foreground mt-2">고객 세그먼트별 맞춤 추천 전략</p>
        </div>
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            트렌드 데이터와 고객 행동 패턴을 기반으로 최적의 추천 전략을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>추천 전략 시뮬레이션</CardTitle>
            <CardDescription>
              고객 세그먼트별 맞춤 추천 전략 효과 예측
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">시뮬레이션 기능이 곧 추가됩니다.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
