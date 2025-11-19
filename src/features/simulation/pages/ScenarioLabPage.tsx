import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestTube } from "lucide-react";

export default function ScenarioLabPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧪 Scenario Lab</h1>
          <p className="text-muted-foreground mt-2">시나리오 생성: 레이아웃, 스태핑, 프로모션, 가격/재고 | KPI 예측: ΔCVR, ΔATV, ΔSales/㎡, ΔOpex, ΔProfit</p>
        </div>
        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            다양한 비즈니스 시나리오를 설정하고 AI 기반으로 KPI 변화량을 예측합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Scenario Lab</CardTitle>
            <CardDescription>
              시나리오 생성, KPI 예측, 시나리오 비교 & 추천안 선택
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
