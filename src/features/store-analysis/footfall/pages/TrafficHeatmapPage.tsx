import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap } from "@/features/store-analysis/footfall/components/TrafficHeatmap";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, Store } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store3DViewer } from "@/features/digital-twin/components/Store3DViewer";
import { HeatmapOverlay3D } from "@/features/digital-twin/components/overlays";
import { generateHeatPoints } from "@/features/digital-twin/utils/overlayDataConverter";

const TrafficHeatmapPage = () => {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);

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

  return (
    <DashboardLayout>
      <DataReadinessGuard>
        <div className="space-y-6">
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
            
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList>
                <TabsTrigger value="analysis">히트맵 분석</TabsTrigger>
                <TabsTrigger value="digital-twin">디지털트윈 매장 프리뷰</TabsTrigger>
                <TabsTrigger value="comparison">비교 분석</TabsTrigger>
              </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <TrafficHeatmap visitsData={visitsData} />
            </div>
          </TabsContent>

          <TabsContent value="digital-twin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>디지털트윈 매장 프리뷰</CardTitle>
                <CardDescription>
                  방문 밀도를 3D 모델 위에 시각화하여 핫스팟을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 토글 컨트롤 */}
                <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                  <Button
                    variant={showHeatmap ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHeatmap(!showHeatmap)}
                  >
                    {showHeatmap ? "✓" : ""} 히트맵
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <span>방문 데이터: {visitsData.length}건</span>
                  </div>
                </div>

                {/* 단일 3D 뷰 */}
                <Store3DViewer 
                  height="600px"
                  overlay={
                    <>
                      {showHeatmap && (
                        <HeatmapOverlay3D
                          heatPoints={generateHeatPoints(visitsData)}
                          gridSize={20}
                          heightScale={2}
                        />
                      )}
                    </>
                  }
                />

                {/* 범례 */}
                {showHeatmap && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">히트맵 색상</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, #0000FF, #00FFFF, #00FF00, #FFFF00, #FF0000)' }} />
                        <span>낮음 → 높음</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default TrafficHeatmapPage;
