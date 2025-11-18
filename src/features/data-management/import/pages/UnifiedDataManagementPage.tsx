import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  History, 
  Network,
  Database,
  CheckCircle2
} from "lucide-react";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useToast } from "@/hooks/use-toast";

// 통합 컴포넌트 임포트
import { UnifiedDataUpload } from "../components/UnifiedDataUpload";
import { StorageManager } from "../components/StorageManager";
import { OntologyDataManagement } from "../components/OntologyDataManagement";
import { DataImportHistory } from "../components/DataImportHistory";
import { DataStatistics } from "../components/DataStatistics";
import { DataValidation } from "../components/DataValidation";

export default function UnifiedDataManagementPage() {
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unified");

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="unified">
              <Upload className="w-4 h-4 mr-2" />
              통합 업로드
            </TabsTrigger>
            <TabsTrigger value="validation">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              유효성 검사
            </TabsTrigger>
            <TabsTrigger value="storage">
              <Database className="w-4 h-4 mr-2" />
              스토리지
            </TabsTrigger>
            <TabsTrigger value="ontology">
              <Network className="w-4 h-4 mr-2" />
              온톨로지
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              히스토리
            </TabsTrigger>
          </TabsList>

          {/* 통합 업로드 탭 */}
          <TabsContent value="unified" className="space-y-6">
            <UnifiedDataUpload 
              storeId={selectedStore?.id}
              onUploadSuccess={() => {
                toast({
                  title: "업로드 완료",
                  description: "데이터가 성공적으로 업로드되고 자동 매핑되었습니다",
                });
              }}
            />
          </TabsContent>

          {/* 유효성 검사 탭 */}
          <TabsContent value="validation" className="space-y-6">
            <DataValidation storeId={selectedStore?.id} />
          </TabsContent>

          {/* 스토리지 관리 탭 */}
          <TabsContent value="storage" className="space-y-6">
            <StorageManager storeId={selectedStore?.id} />
          </TabsContent>

          {/* 온톨로지 관리 탭 */}
          <TabsContent value="ontology" className="space-y-6">
            <OntologyDataManagement storeId={selectedStore?.id} />
          </TabsContent>

          {/* 히스토리 탭 */}
          <TabsContent value="history" className="space-y-6">
            <DataImportHistory storeId={selectedStore?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
