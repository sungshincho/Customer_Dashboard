import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerJourney } from "@/features/store-analysis/footfall/components/CustomerJourney";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box } from "lucide-react";
import { useState } from "react";
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

const CustomerJourneyPage = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [sceneRecipe, setSceneRecipe] = useState<SceneRecipe | null>(null);
  const [loading3D, setLoading3D] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const comparisonData = [
    { label: "평균 동선 길이", current: 85, previous: 78, unit: "m" },
    { label: "방문 구역 수", current: 5.2, previous: 4.8, unit: "개" },
    { label: "체류 시간", current: 22, previous: 20, unit: "분" }
  ];

  const exportData = {
    filters,
    journeyMetrics: comparisonData
  };

  const generate3DJourney = async () => {
    if (!user) return;
    
    setLoading3D(true);
    try {
      const mockAIResult: AILayoutResult = {
        zones: [
          {
            zone_id: 'path-1',
            zone_type: 'journey',
            furniture: [],
            products: []
          }
        ],
        lighting_suggestion: 'warm-retail'
      };

      const recipe = await generateSceneRecipe(mockAIResult, user.id);
      setSceneRecipe(recipe);
      toast.success("3D 고객 여정이 생성되었습니다");
    } catch (error) {
      console.error('3D journey generation error:', error);
      toast.error("3D 여정 생성 중 오류가 발생했습니다");
    } finally {
      setLoading3D(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 여정 맵</h1>
            <p className="mt-2 text-muted-foreground">평균 구매 고객의 매장 체류 패턴</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="customer-journey" title="고객 여정 맵" />
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
              3D 여정
            </TabsTrigger>
            <TabsTrigger value="analysis">여정 분석</TabsTrigger>
            <TabsTrigger value="comparison">비교 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Card className="p-6">
              {!sceneRecipe && (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <Box className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-4">
                    고객 동선 패턴 3D 시각화
                  </p>
                  <Button onClick={generate3DJourney} disabled={loading3D}>
                    {loading3D ? "생성 중..." : "3D 여정 생성"}
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
              <CustomerJourney />
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

export default CustomerJourneyPage;
