import { DashboardLayout } from "@/components/DashboardLayout";
import { FootfallVisualizer } from "@/features/store-analysis/footfall/components/FootfallVisualizer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreScene } from "@/hooks/useStoreScene";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SceneViewer } from "@/features/digital-twin/components/SceneViewer";

const FootfallAnalysis = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  
  const { sceneRecipe, loading: sceneLoading, generateScene } = useStoreScene();
  const { latestAnalysis, analyzing } = useAutoAnalysis('visitor', true);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const comparisonData = [
    { label: "총 방문자", current: 1250, previous: 1100, unit: "명" },
    { label: "평균 체류시간", current: 18, previous: 15, unit: "분" },
    { label: "신규 방문자", current: 420, previous: 380, unit: "명" }
  ];

  const exportData = {
    filters,
    totalVisitors: 1250,
    avgDwellTime: 18,
    peakHours: "14:00-16:00",
    comparisonData
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">방문객 유입 분석</h1>
            <p className="mt-2 text-muted-foreground">
              시간대별 방문자 패턴 및 트렌드 분석
              {analyzing && <span className="ml-2 text-primary">(AI 분석 중...)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="footfall-analysis" title="방문객 유입 분석" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="3d" className="w-full">
          <TabsList>
            <TabsTrigger value="3d">3D 방문자 뷰</TabsTrigger>
            <TabsTrigger value="analysis">분석</TabsTrigger>
            <TabsTrigger value="comparison">비교 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3D 방문자 현황</CardTitle>
                <CardDescription>
                  실시간 방문자 위치를 3D 디지털 트윈에서 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!sceneRecipe ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      3D 매장을 생성하여 방문자 현황을 시각화하세요
                    </p>
                    <Button onClick={generateScene} disabled={sceneLoading}>
                      {sceneLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        "3D 매장 생성"
                      )}
                    </Button>
                  </div>
                ) : (
                  <SceneViewer
                    recipe={sceneRecipe}
                    overlay="visitor"
                    overlayData={latestAnalysis?.sceneData}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <FootfallVisualizer />
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

export default FootfallAnalysis;
