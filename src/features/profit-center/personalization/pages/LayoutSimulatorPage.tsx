import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutSimulator } from "@/features/profit-center/personalization/components/LayoutSimulator";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { AIAnalysisButton } from "@/components/analysis/AIAnalysisButton";
import { AnalysisHistory } from "@/components/analysis/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SceneComposer } from "@/features/digital-twin/components";
import { generateSceneRecipe } from "@/features/digital-twin/utils/sceneRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import type { SceneRecipe, AILayoutResult } from "@/types/scene3d";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { Alert as AlertUI, AlertDescription } from "@/components/ui/alert";

const LayoutSimulatorPage = () => {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [sceneRecipe, setSceneRecipe] = useState<SceneRecipe | null>(null);
  const [loading3D, setLoading3D] = useState(false);
  const [storeData, setStoreData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 매장 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreDataset(user.id, selectedStore.id)
        .then(data => {
          setStoreData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load store data:', error);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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

  const generate3DScene = async () => {
    if (!user) return;
    
    setLoading3D(true);
    try {
      const mockAIResult: AILayoutResult = {
        zones: [
          {
            zone_id: 'entrance',
            zone_type: 'entry',
            furniture: [
              {
                furniture_id: 'shelf-001',
                entity_type: 'Shelf',
                movable: true,
                current_position: { x: -5, y: 0, z: 0 },
                position: { x: -5, y: 0, z: 0 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 }
              },
              {
                furniture_id: 'shelf-002',
                entity_type: 'Shelf',
                movable: true,
                current_position: { x: 5, y: 0, z: 0 },
                position: { x: 5, y: 0, z: 0 },
                rotation: { x: 0, y: -Math.PI / 2, z: 0 }
              }
            ],
            products: [
              {
                product_id: 'product-001',
                entity_type: 'Product',
                movable: true,
                current_position: { x: -5, y: 1, z: 0 },
                position: { x: -5, y: 1, z: 0 }
              },
              {
                product_id: 'product-002',
                entity_type: 'Product',
                movable: true,
                current_position: { x: 5, y: 1, z: 0 },
                position: { x: 5, y: 1, z: 0 }
              }
            ]
          }
        ],
        lighting_suggestion: 'warm-retail'
      };

      const recipe = await generateSceneRecipe(mockAIResult, user.id);
      setSceneRecipe(recipe);
      toast.success("3D 레이아웃이 생성되었습니다");
    } catch (error) {
      console.error('3D scene generation error:', error);
      toast.error("3D 씬 생성 중 오류가 발생했습니다");
    } finally {
      setLoading3D(false);
    }
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <AlertUI>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            매장을 선택하면 해당 매장의 레이아웃 시뮬레이션을 확인할 수 있습니다.
          </AlertDescription>
        </AlertUI>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 레이아웃 시뮬레이터</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore.store_name} - AI 기반 최적 배치 시뮬레이션
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
          <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {selectedStore.store_name} 데이터: {totalVisits}건 방문, 평균 체류시간 {avgDwellTime}분
            </AlertDescription>
          </AlertUI>
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
            <Card className="p-6">
              {!sceneRecipe && (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <Box className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-4">
                    AI 추론 기반 3D 레이아웃 시뮬레이션
                  </p>
                  <Button onClick={generate3DScene} disabled={loading3D}>
                    {loading3D ? "생성 중..." : "3D 레이아웃 생성"}
                  </Button>
                </div>
              )}
              {sceneRecipe && (
                <div className="h-[600px]">
                  <SceneComposer recipe={sceneRecipe} />
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="layout-simulator"
              data={comparisonData}
              title="AI 레이아웃 시뮬레이션"
              onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
            />
            <div key={refreshKey}>
              <LayoutSimulator 
                visitsData={storeData.visits}
                purchasesData={storeData.purchases}
              />
            </div>
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
  );
};

export default LayoutSimulatorPage;
