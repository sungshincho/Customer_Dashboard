import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, Database, Cpu, AlertCircle } from "lucide-react";
import { WiFiDataUploader } from "@/features/data-management/neuralsense/components/WiFiDataUploader";
import { DeviceList, DeviceRegistrationForm } from "@/features/data-management/neuralsense/components";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WiFiDataManagementProps {
  storeId?: string;
}

export function WiFiDataManagement({ storeId }: WiFiDataManagementProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegistrationSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {!storeId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WiFi 데이터를 특정 매장에 연결하려면 먼저 사이드바에서 매장을 선택하세요
          </AlertDescription>
        </Alert>
      )}

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

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">
            <Database className="h-4 w-4 mr-2" />
            데이터 업로드
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Cpu className="h-4 w-4 mr-2" />
            디바이스 관리
          </TabsTrigger>
          <TabsTrigger value="register">
            <Wifi className="h-4 w-4 mr-2" />
            새 디바이스 등록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <WiFiDataUploader />

          <Card>
            <CardHeader>
              <CardTitle>WiFi 데이터 포맷</CardTitle>
              <CardDescription>
                라즈베리파이에서 수집한 데이터의 CSV 포맷 가이드
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">wifi_sensors.csv</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  sensor_id,x,y,z,coverage_radius
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  센서 위치를 미터 단위로 지정 (매장 3D 좌표계와 일치)
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">wifi_tracking.csv</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  timestamp,mac_address,sensor_id,rssi,x,z
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  x, z는 선택사항 (없으면 RSSI 기반 삼변측량으로 자동 계산)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                WiFi probe 데이터 수집을 위한 설정 방법
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h4 className="font-semibold mb-1">1. 모니터 모드 활성화</h4>
                <code className="text-xs bg-blue-100 dark:bg-blue-900 p-1 rounded">
                  sudo airmon-ng start wlan0
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">2. Probe Request 캡처</h4>
                <code className="text-xs bg-blue-100 dark:bg-blue-900 p-1 rounded">
                  sudo tcpdump -i wlan0mon -e -s 256 type mgt subtype probe-req
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">3. 데이터 저장</h4>
                <p className="text-xs">
                  MAC 주소, RSSI, 타임스탬프를 CSV로 저장 후 업로드
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
