import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Grid3x3 } from "lucide-react";

export default function LayoutSimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🗺️ 레이아웃 시뮬레이션</h1>
          <p className="text-muted-foreground mt-2">매장 레이아웃 변경 시 매출 영향 예측</p>
        </div>
        <Alert>
          <Grid3x3 className="h-4 w-4" />
          <AlertDescription>
            매장 레이아웃 변경 시 동선 흐름과 매출 영향을 3D로 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>레이아웃 시뮬레이션</CardTitle>
            <CardDescription>
              가구 배치, 동선 변경에 따른 매출 영향 예측
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
