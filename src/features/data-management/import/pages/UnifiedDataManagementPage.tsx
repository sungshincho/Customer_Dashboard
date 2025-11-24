import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
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
import { IntegratedImportStatus } from "../components/IntegratedImportStatus";
import { DataValidation } from "../components/DataValidation";
import { DemoReadinessChecker } from "../components/DemoReadinessChecker";

export default function UnifiedDataManagementPage() {
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unified");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "업로드 완료",
      description: "데이터가 성공적으로 업로드되고 자동 매핑되었습니다",
    });
  };

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
        <DataStatistics key={`stats-${refreshTrigger}`} storeId={selectedStore?.id} />

        {/* 메인 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 w-full overflow-x-auto">
            <TabsTrigger value="unified" className="flex-shrink-0">
              <Upload className="w-4 h-4 mr-2" />
              통합 업로드
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              유효성 검사
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex-shrink-0">
              <Database className="w-4 h-4 mr-2" />
              스토리지
            </TabsTrigger>
            <TabsTrigger value="ontology" className="flex-shrink-0">
              <Network className="w-4 h-4 mr-2" />
              온톨로지
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              데모 준비상태
            </TabsTrigger>
          </TabsList>

          {/* 통합 업로드 탭 */}
          <TabsContent value="unified" className="space-y-6">
            <UnifiedDataUpload 
              storeId={selectedStore?.id}
              onUploadSuccess={handleUploadSuccess}
            />
          </TabsContent>

          {/* 유효성 검사 탭 */}
          <TabsContent value="validation" className="space-y-6">
            <DataValidation key={`validation-${refreshTrigger}`} storeId={selectedStore?.id} />
          </TabsContent>

          {/* 스토리지 관리 탭 */}
          <TabsContent value="storage" className="space-y-6">
            <StorageManager 
              key={`storage-${refreshTrigger}`} 
              storeId={selectedStore?.id} 
            />
            <DataImportHistory key={`history-${refreshTrigger}`} storeId={selectedStore?.id} />
          </TabsContent>

          {/* 온톨로지 관리 탭 */}
          <TabsContent value="ontology" className="space-y-6">
            <OntologyDataManagement key={`ontology-${refreshTrigger}`} storeId={selectedStore?.id} />
          </TabsContent>

          {/* 데모 준비상태 탭 */}
          <TabsContent value="demo" className="space-y-6">
            <DemoReadinessChecker />
          </TabsContent>
        </Tabs>

        {/* 데이터 통합 상태 */}
        <IntegratedImportStatus key={`integration-${refreshTrigger}`} storeId={selectedStore?.id} />
      </div>
    </DashboardLayout>
  );
}
