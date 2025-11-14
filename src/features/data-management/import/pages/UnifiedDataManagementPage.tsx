import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Database, 
  Wifi, 
  Box, 
  History, 
  FileSpreadsheet,
  Cpu,
  Network,
  Layers,
  HardDrive
} from "lucide-react";
import { useSelectedStore } from "@/hooks/useSelectedStore";

// 통합 컴포넌트 임포트
import { CSVDataImport } from "../components/CSVDataImport";
import { ThreeDModelUpload } from "../components/ThreeDModelUpload";
import { WiFiDataManagement } from "../components/WiFiDataManagement";
import { OntologyDataManagement } from "../components/OntologyDataManagement";
import { DataImportHistory } from "../components/DataImportHistory";
import { DataStatistics } from "../components/DataStatistics";
import { StorageManager } from "../components/StorageManager";

export default function UnifiedDataManagementPage() {
  const { selectedStore } = useSelectedStore();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            통합 데이터 관리
          </h1>
          <p className="text-muted-foreground mt-2">
            2D/3D 데이터, WiFi 트래킹, 온톨로지 등 모든 데이터를 한 곳에서 관리하세요
          </p>
        </div>

        {/* 매장 선택 경고 */}
        {!selectedStore && (
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <p className="text-yellow-800 dark:text-yellow-200">
                💡 데이터를 특정 매장에 연결하려면 사이드바에서 매장을 선택하세요
              </p>
            </CardContent>
          </Card>
        )}

        {/* 데이터 통계 대시보드 */}
        <DataStatistics storeId={selectedStore?.id} />

        {/* 메인 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">
              <Database className="w-4 h-4 mr-2" />
              개요
            </TabsTrigger>
            <TabsTrigger value="csv-import">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV/Excel
            </TabsTrigger>
            <TabsTrigger value="3d-models">
              <Box className="w-4 h-4 mr-2" />
              3D 모델
            </TabsTrigger>
            <TabsTrigger value="wifi-data">
              <Wifi className="w-4 h-4 mr-2" />
              WiFi/IoT
            </TabsTrigger>
            <TabsTrigger value="ontology">
              <Network className="w-4 h-4 mr-2" />
              온톨로지
            </TabsTrigger>
            <TabsTrigger value="storage">
              <HardDrive className="w-4 h-4 mr-2" />
              스토리지
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              히스토리
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("csv-import")}
              >
                <CardHeader>
                  <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>CSV/Excel 데이터</CardTitle>
                  <CardDescription>
                    매출, 방문, 고객 데이터를 CSV 또는 Excel 파일로 업로드하세요
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("3d-models")}
              >
                <CardHeader>
                  <Box className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>3D 모델 & 매장 구성</CardTitle>
                  <CardDescription>
                    매장의 3D 모델을 업로드하고 디지털 트윈을 구축하세요
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("wifi-data")}
              >
                <CardHeader>
                  <Wifi className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>WiFi 트래킹 데이터</CardTitle>
                  <CardDescription>
                    라즈베리파이로 수집한 WiFi probe 데이터를 업로드하세요
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("ontology")}
              >
                <CardHeader>
                  <Network className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>온톨로지 & 그래프 데이터</CardTitle>
                  <CardDescription>
                    Entity, Relation을 정의하고 지식 그래프를 구축하세요
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("history")}
              >
                <CardHeader>
                  <History className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>데이터 히스토리</CardTitle>
                  <CardDescription>
                    모든 데이터 임포트 기록과 상태를 확인하세요
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <Layers className="w-8 h-8 text-muted-foreground mb-2" />
                  <CardTitle className="text-muted-foreground">곧 추가될 기능</CardTitle>
                  <CardDescription>
                    외부 API 연동, 실시간 스트리밍 데이터 등
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* 빠른 시작 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 시작 가이드</CardTitle>
                <CardDescription>
                  데이터를 업로드하고 디지털 트윈을 구축하는 순서
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">매장 정보 등록</h4>
                    <p className="text-sm text-muted-foreground">
                      사이드바 → 매장 관리에서 매장 기본 정보를 등록하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">3D 모델 업로드</h4>
                    <p className="text-sm text-muted-foreground">
                      매장의 3D 모델(.glb 또는 .gltf)을 업로드하여 공간을 시각화하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">온톨로지 구성</h4>
                    <p className="text-sm text-muted-foreground">
                      진열대, 제품 등 매장 구성 요소를 Entity로 정의하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">거래 데이터 업로드</h4>
                    <p className="text-sm text-muted-foreground">
                      매출, 방문, 재고 데이터를 CSV로 업로드하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold">WiFi 트래킹 설정 (선택)</h4>
                    <p className="text-sm text-muted-foreground">
                      실시간 고객 동선 분석을 위해 WiFi 데이터를 수집하세요
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV/Excel 임포트 탭 */}
          <TabsContent value="csv-import">
            <CSVDataImport storeId={selectedStore?.id} />
          </TabsContent>

          {/* 3D 모델 탭 */}
          <TabsContent value="3d-models">
            <ThreeDModelUpload storeId={selectedStore?.id} />
          </TabsContent>

          {/* WiFi 데이터 탭 */}
          <TabsContent value="wifi-data">
            <WiFiDataManagement storeId={selectedStore?.id} />
          </TabsContent>

          {/* 온톨로지 탭 */}
          <TabsContent value="ontology">
            <OntologyDataManagement storeId={selectedStore?.id} />
          </TabsContent>

          {/* 스토리지 관리 탭 */}
          <TabsContent value="storage">
            <StorageManager storeId={selectedStore?.id} />
          </TabsContent>

          {/* 히스토리 탭 */}
          <TabsContent value="history">
            <DataImportHistory storeId={selectedStore?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
