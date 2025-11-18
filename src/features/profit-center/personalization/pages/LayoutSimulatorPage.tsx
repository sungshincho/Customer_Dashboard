import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutSimulator } from "@/features/profit-center/personalization/components/LayoutSimulator";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { AIInsights, Insight } from "@/features/data-management/analysis/components/AIInsights";
import { AlertSettings, Alert as AlertType } from "@/features/data-management/analysis/components/AlertSettings";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { AIAnalysisButton } from "@/features/data-management/analysis/components/AIAnalysisButton";
import { AnalysisHistory } from "@/features/data-management/analysis/components/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store3DViewer } from "@/features/digital-twin/components";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreDataset } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStoreScene } from "@/hooks/useStoreScene";

const LayoutSimulatorPage = () => {
  const { selectedStore } = useSelectedStore();
  const { activeScene } = useStoreScene();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  
  // 새로운 통합 Hook 사용
  const { data: storeData, isLoading: loading, refetch } = useStoreDataset();

  const handleRefresh = () => {
    refetch();
  };

  // 매장 데이터 기반 통계
  const totalVisits = storeData.visits?.length || 0;
  const avgDwellTime = totalVisits > 0 && storeData.visits
    ? (storeData.visits.reduce((sum: number, v: any) => sum + (parseInt(v.dwell_time) || 0), 0) / totalVisits).toFixed(0)
    : '0';

  const insights: Insight[] = [
    { type: "trend", title: "레이아웃 효율성", description: `${selectedStore?.store_name || '매장'}의 현재 레이아웃이 전월 대비 15% 더 효율적입니다.`, impact: "high" },
    { type: "recommendation", title: "동선 최적화", description: "계산대를 중앙으로 이동하면 대기 시간이 감소합니다.", impact: "high" },
    { type: "warning", title: "공간 활용", description: "매장 후면 공간이 저활용되고 있습니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "고객 동선 효율", current: 92, previous: 85, unit: "%" },
    { label: "공간 활용률", current: 78, previous: 72, unit: "%" },
    { label: "평균 체류 시간", current: parseInt(avgDwellTime), previous: Math.max(0, parseInt(avgDwellTime) - 3), unit: "분" }
  ];

  const exportData = {
    filters,
    layoutMetrics: comparisonData,
    insights
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 레이아웃 시뮬레이터</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - AI 기반 최적 배치 시뮬레이션` : 'AI 기반 최적 배치 시뮬레이션'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="layout-simulator" title="레이아웃 시뮬레이터" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {totalVisits > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {selectedStore ? `${selectedStore.store_name} 데이터: ` : ''}
              {totalVisits}건 방문, 평균 체류시간 {avgDwellTime}분
            </AlertDescription>
          </Alert>
        )}
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="3d" className="w-full">
          <TabsList>
            <TabsTrigger value="3d">
              <Box className="w-4 h-4 mr-2" />
              3D 뷰
            </TabsTrigger>
            <TabsTrigger value="analysis">시뮬레이션</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Store3DViewer height="600px" sceneRecipe={activeScene?.recipe_data} />
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="layout-simulator"
              data={comparisonData}
              title="AI 레이아웃 시뮬레이션"
              onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
            />
            <LayoutSimulator 
              visitsData={storeData?.visits}
                purchasesData={storeData.purchases}
              />
          </TabsContent>
          
          <TabsContent value="comparison">
            <ComparisonView
              data={comparisonData}
              comparisonType={comparisonType}
              onComparisonTypeChange={setComparisonType}
            />
          </TabsContent>
          
          <TabsContent value="insights">
            <AIInsights insights={insights} />
          </TabsContent>

          <TabsContent value="history">
            <AnalysisHistory analysisType="layout-simulator" refreshTrigger={historyRefresh} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertSettings
              alerts={alerts}
              onAlertsChange={setAlerts}
              availableMetrics={["동선 효율", "공간 활용률", "체류 시간", "전환율"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default LayoutSimulatorPage;
