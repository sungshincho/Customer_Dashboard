import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DeviceRegistrationForm, DeviceList } from "../components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Wifi, Database, Settings } from "lucide-react";

export default function NeuralSenseSettingsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegistrationSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            NeuralSense IoT 설정
          </h1>
          <p className="text-muted-foreground mt-2">
            라즈베리파이 디바이스를 등록하고 WiFi probe 데이터 수집을 관리하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IoT 인프라</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">라즈베리파이</div>
              <p className="text-xs text-muted-foreground">WiFi Probe Request 추적</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">실시간 수집</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dynamic 데이터</div>
              <p className="text-xs text-muted-foreground">매장 내 소비자 행동 분석</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">데이터 저장</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">자동 통합</div>
              <p className="text-xs text-muted-foreground">온톨로지 스키마 매핑</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devices">
              <Cpu className="h-4 w-4 mr-2" />
              디바이스 관리
            </TabsTrigger>
            <TabsTrigger value="register">
              <Settings className="h-4 w-4 mr-2" />
              새 디바이스 등록
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <DeviceList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <DeviceRegistrationForm onSuccess={handleRegistrationSuccess} />
            
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  라즈베리파이 설정 가이드
                </CardTitle>
                <CardDescription>
                  NeuralSense IoT 디바이스를 설정하는 방법
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">1. 라즈베리파이 준비</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Raspberry Pi 3B+ 이상 권장</li>
                    <li>Raspbian OS 설치</li>
                    <li>WiFi 어댑터 연결 (모니터 모드 지원 필수)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. WiFi Probe 소프트웨어 설치</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>NeuralSense Agent 다운로드 및 설치</li>
                    <li>디바이스 ID 및 API 키 설정</li>
                    <li>네트워크 인터페이스 모니터 모드 활성화</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. 연결 및 테스트</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>인터넷 연결 확인</li>
                    <li>NeuralSense Agent 실행</li>
                    <li>데이터 수집 테스트 및 모니터링</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>참고:</strong> WiFi probe request는 개인정보를 수집하지 않으며, 
                    익명화된 MAC 주소와 신호 강도만 분석합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
