import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap } from "@/features/store-analysis/footfall/components/TrafficHeatmap";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SceneComposer } from "@/features/digital-twin/components";
import { generateSceneRecipe } from "@/features/digital-twin/utils/sceneRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import type { SceneRecipe, AILayoutResult } from "@/types/scene3d";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrafficHeatmapPage = () => {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [sceneRecipe, setSceneRecipe] = useState<SceneRecipe | null>(null);
  const [loading3D, setLoading3D] = useState(false);
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 매장별 방문 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreFile(user.id, selectedStore.id, 'visits.csv')
        .then(data => {
          console.log(`${selectedStore.store_name} 방문 데이터 (히트맵):`, data.length, '건');
          setVisitsData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load visits data:', error);
          setVisitsData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const comparisonData = [
    { label: "피크 밀집도", current: 85, previous: 78, unit: "%" },
    { label: "평균 밀집도", current: 45, previous: 42, unit: "%" },
    { label: "핫스팟 개수", current: 3, previous: 2, unit: "개" }
  ];

  const exportData = {
    filters,
    heatmapMetrics: comparisonData
  };

  const generate3DHeatmap = async () => {
    if (!user) return;
    
    setLoading3D(true);
    try {
      const mockAIResult: AILayoutResult = {
        zones: [
          {
            zone_id: 'hotspot-1',
            zone_type: 'high_traffic',
            furniture: [],
            products: []
          }
        ],
        lighting_suggestion: 'cool-modern',
        heatmap_data: {
          zones: [
            { x: -3, z: -3, intensity: 0.8 },
            { x: 0, z: 0, intensity: 1.0 },
            { x: 3, z: 3, intensity: 0.6 }
          ]
        }
      };

      const recipe = await generateSceneRecipe(mockAIResult, user.id);
      setSceneRecipe(recipe);
      toast.success("3D 히트맵이 생성되었습니다");
    } catch (error) {
      console.error('3D heatmap generation error:', error);
      toast.error("3D 히트맵 생성 중 오류가 발생했습니다");
    } finally {
      setLoading3D(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!selectedStore && (
          <Alert>
            <Store className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 히트맵 데이터를 확인할 수 있습니다. 
              사이드바에서 매장을 선택하거나 <a href="/stores" className="underline font-medium">매장 관리</a>에서 매장을 등록하세요.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 동선 히트맵</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 방문 데이터: ${visitsData.length}건` : '실시간 방문자 밀집도 및 동선 분석'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="traffic-heatmap" title="매장 동선 히트맵" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="3d" className="w-full">
          <TabsList>
            <TabsTrigger value="3d">
              <Box className="w-4 h-4 mr-2" />
              3D 히트맵
            </TabsTrigger>
            <TabsTrigger value="analysis">히트맵</TabsTrigger>
            <TabsTrigger value="comparison">비교 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Card className="p-6">
              {!sceneRecipe && (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <Box className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-4">
                    실시간 트래픽 밀집도 3D 시각화
                  </p>
                  <Button onClick={generate3DHeatmap} disabled={loading3D}>
                    {loading3D ? "생성 중..." : "3D 히트맵 생성"}
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
            <div key={refreshKey}>
              <TrafficHeatmap />
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            <ComparisonView
              data={comparisonData}
              comparisonType={comparisonType}
              onComparisonTypeChange={setComparisonType}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TrafficHeatmapPage;
