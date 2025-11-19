import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign } from "lucide-react";

export default function PricingSimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">💰 가격 최적화 시뮬레이션</h1>
          <p className="text-muted-foreground mt-2">경제지표 기반 최적 가격 전략 수립</p>
        </div>
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            경제지표와 경쟁가격 데이터를 활용하여 최적 가격 전략을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>가격 최적화 시뮬레이션</CardTitle>
            <CardDescription>
              가격 탄력성, 경쟁 환경, 경제 상황을 고려한 최적 가격 책정
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
