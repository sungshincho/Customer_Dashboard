import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

export default function DemandInventorySimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📦 Demand & Inventory Sim</h1>
          <p className="text-muted-foreground mt-2">발주정책/안전재고/리드타임 변경 → 매출·품절·폐기 예측</p>
        </div>
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            외부 API(날씨 예보, 이벤트, 경제지표)와 AI를 활용하여 미래 수요를 예측하고 최적 재고 수준을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Demand & Inventory Simulation</CardTitle>
            <CardDescription>
              발주정책/안전재고/리드타임 변경에 따른 매출·품절·폐기 예측
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
