import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestTube } from "lucide-react";

export default function ScenarioLabPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧪 시나리오 랩</h1>
          <p className="text-muted-foreground mt-2">복합 시나리오 설정 및 What-if 분석</p>
        </div>
        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            다양한 비즈니스 시나리오를 설정하고 AI 기반으로 결과를 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>시나리오 랩</CardTitle>
            <CardDescription>
              복합 시나리오 설정 및 What-if 분석
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
