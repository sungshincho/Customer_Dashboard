import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Grid3x3 } from "lucide-react";

export default function LayoutSimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🗺️ Layout Simulation</h1>
          <p className="text-muted-foreground mt-2">Digital Twin 3D 모델 위 레이아웃 What-if | 존 이동/페이싱 변경에 대한 KPI 예측</p>
        </div>
        <Alert>
          <Grid3x3 className="h-4 w-4" />
          <AlertDescription>
            Digital Twin 3D 모델에서 레이아웃을 변경하면 동선 흐름과 매출 영향을 실시간으로 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Layout Simulation</CardTitle>
            <CardDescription>
              Digital Twin 3D 모델 위 레이아웃 What-if, 존 이동/페이싱 변경 KPI 예측
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
