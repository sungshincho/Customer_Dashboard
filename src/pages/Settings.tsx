import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="mt-2 text-muted-foreground">시스템 설정 및 환경 구성</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="integrations">연동</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일반 설정</CardTitle>
                <CardDescription>기본 시스템 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company">회사명</Label>
                  <Input id="company" defaultValue="NEURALTWIN" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">관리자 이메일</Label>
                  <Input id="email" type="email" defaultValue="admin@neuraltwin.com" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>다크 모드</Label>
                    <p className="text-sm text-muted-foreground">다크 모드로 UI를 표시합니다</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>실시간 업데이트</Label>
                    <p className="text-sm text-muted-foreground">데이터를 실시간으로 자동 새로고침합니다</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <Button>변경사항 저장</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>알림 수신 방법을 설정합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>재고 부족 알림</Label>
                    <p className="text-sm text-muted-foreground">재고가 최소 수량 이하로 떨어지면 알림</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>매출 목표 달성 알림</Label>
                    <p className="text-sm text-muted-foreground">일일 매출 목표 달성 시 알림</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>방문자 급증 알림</Label>
                    <p className="text-sm text-muted-foreground">평소보다 방문자가 30% 이상 증가하면 알림</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>시스템 점검 알림</Label>
                    <p className="text-sm text-muted-foreground">정기 점검 및 업데이트 알림</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="notification-email">알림 수신 이메일</Label>
                  <Input id="notification-email" type="email" defaultValue="admin@neuraltwin.com" />
                </div>
                <Button>변경사항 저장</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>외부 서비스 연동</CardTitle>
                <CardDescription>외부 서비스와의 연동을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <h4 className="font-medium">Supabase</h4>
                      <p className="text-sm text-muted-foreground">데이터베이스 및 인증</p>
                    </div>
                    <Button variant="outline" size="sm">연결됨</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <h4 className="font-medium">결제 시스템</h4>
                      <p className="text-sm text-muted-foreground">POS 시스템 연동</p>
                    </div>
                    <Button variant="outline" size="sm">연결</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <h4 className="font-medium">이메일 서비스</h4>
                      <p className="text-sm text-muted-foreground">자동 알림 발송</p>
                    </div>
                    <Button variant="outline" size="sm">연결</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>보안 설정</CardTitle>
                <CardDescription>계정 보안 및 접근 권한을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-muted-foreground">추가 보안 계층을 활성화합니다</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>세션 관리</Label>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">현재 활성 세션: 1개</p>
                    <Button variant="outline" size="sm" className="mt-2">모든 세션 로그아웃</Button>
                  </div>
                </div>
                <Button>변경사항 저장</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
