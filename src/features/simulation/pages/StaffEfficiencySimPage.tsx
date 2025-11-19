import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck } from "lucide-react";

export default function StaffEfficiencySimPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">👥 직원 효율성 시뮬레이션</h1>
          <p className="text-muted-foreground mt-2">최적 인력 배치 및 근무 시간대 설정</p>
        </div>
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            직원 배치와 근무 시간대를 최적화하여 운영 효율성을 시뮬레이션합니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>직원 효율성 시뮬레이션</CardTitle>
            <CardDescription>
              최적 인력 배치 및 근무 시간대 설정
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
