import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

export default function DemandInventorySimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📦 수요 & 재고 예측 시뮬레이션</h1>
          <p className="text-muted-foreground mt-2">AI 기반 미래 수요 예측 및 최적 재고 시뮬레이션</p>
        </div>
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            외부 API(날씨 예보, 이벤트, 경제지표)와 AI를 활용하여 미래 수요를 예측하고 최적 재고 수준을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>수요 & 재고 시뮬레이션</CardTitle>
            <CardDescription>
              날씨 예보, 이벤트 캘린더, 경제 지표를 기반으로 미래 수요 예측
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
