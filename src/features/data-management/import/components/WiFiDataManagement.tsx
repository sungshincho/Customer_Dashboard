import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, Database, Cpu, AlertCircle, File, Trash2, Download, Loader2 } from "lucide-react";
import { WiFiDataUploader } from "@/features/data-management/neuralsense/components/WiFiDataUploader";
import { DeviceList, DeviceRegistrationForm } from "@/features/data-management/neuralsense/components";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WiFiDataManagementProps {
  storeId?: string;
}

interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  url: string;
}

export function WiFiDataManagement({ storeId }: WiFiDataManagementProps) {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistrationSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (storeId) {
      loadWiFiFiles();
    }
  }, [storeId]);

  const loadWiFiFiles = async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const folderPath = `${user.id}/${storeId}`;
      
      const { data: files, error } = await supabase.storage
        .from('store-data')
        .list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // WiFi 관련 파일만 필터링
      const wifiFiles = (files || []).filter(file => 
        file.name.includes('wifi') || 
        file.name.includes('sensor') ||
        file.name.includes('tracking')
      );

      const filesWithUrls: StorageFile[] = wifiFiles.map((file) => {
        const filePath = `${folderPath}/${file.name}`;
        const { data: { publicUrl } } = supabase.storage
          .from('store-data')
          .getPublicUrl(filePath);

        return {
          name: file.name,
          path: filePath,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          url: publicUrl
        };
      });

      setUploadedFiles(filesWithUrls);
    } catch (error: any) {
      console.error('Error loading WiFi files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.storage
        .from('store-data')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "파일 삭제 완료",
        description: `${fileName}이 삭제되었습니다`,
      });

      loadWiFiFiles();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">
            <Database className="h-4 w-4 mr-2" />
            데이터 업로드
          </TabsTrigger>
          <TabsTrigger value="files">
            <File className="h-4 w-4 mr-2" />
            업로드된 파일
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

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>업로드된 WiFi 데이터 파일</CardTitle>
              <CardDescription>
                {storeId ? '현재 매장의 WiFi 트래킹 데이터 파일들' : '매장을 선택하면 파일 목록을 확인할 수 있습니다'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!storeId ? (
                <Alert>
                  <AlertDescription>
                    사이드바에서 매장을 먼저 선택하세요
                  </AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  업로드된 WiFi 데이터 파일이 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>파일명</TableHead>
                      <TableHead>크기</TableHead>
                      <TableHead>업로드 일시</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => (
                      <TableRow key={file.path}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-primary" />
                            {file.name}
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          {new Date(file.created_at).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.path, file.name)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
