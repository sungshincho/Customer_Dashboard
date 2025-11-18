import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap } from "@/features/store-analysis/footfall/components/TrafficHeatmap";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Play, Pause, RotateCcw, Layers, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useVisits } from "@/hooks/useStoreData";
import { SceneComposer } from "@/features/digital-twin/components/SceneComposer";
import { HeatmapOverlay3D, ZoneBoundaryOverlay } from "@/features/digital-twin/components/overlays";
import { useStoreScene } from "@/hooks/useStoreScene";
import { useTrafficHeatmap, useZoneStatistics } from "@/hooks/useTrafficHeatmap";
import type { StoreSpaceMetadata } from "@/features/digital-twin/types/iot.types";
import { cn } from "@/lib/utils";

const TrafficHeatmapPage = () => {
  const { selectedStore } = useSelectedStore();
  const { activeScene } = useStoreScene();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  
  // 새로운 Hook 사용
  const { data: visitsResult, isLoading: loading, refetch } = useVisits();
  const visitsData = visitsResult?.data || [];
  
  // View Mode State
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  
  // 3D Heatmap Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // WiFi 트래킹 데이터를 히트맵으로 변환
  const heatPoints = useTrafficHeatmap(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const zoneStats = useZoneStatistics(heatPoints, metadata);

  // 시간대 애니메이션
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev >= 23 ? 9 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleRefresh = () => {
    refetch();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOfDay(14);
  };

  const comparisonData = [
    { label: "피크 밀집도", current: 85, previous: 78, unit: "%" },
    { label: "평균 밀집도", current: 45, previous: 42, unit: "%" },
    { label: "핫스팟 개수", current: heatPoints.length > 0 ? Math.ceil(heatPoints.length / 10) : 3, previous: 2, unit: "개" }
  ];

  const exportData = {
    filters,
    heatmapMetrics: comparisonData,
    timeOfDay,
    heatPoints: heatPoints.length,
    zones: zoneStats.length
  };

  return (
    <DashboardLayout>
      <DataReadinessGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold gradient-text">매장 동선 히트맵</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedStore ? `${selectedStore.store_name} - WiFi 트래킹 포인트: ${heatPoints.length}개` : '실시간 방문자 밀집도 및 동선 분석'}
              </p>
            </div>
            <div className="flex gap-2">
              {/* 2D/3D Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === "2d" ? "default" : "ghost"}
                  onClick={() => setViewMode("2d")}
                  className={cn(
                    "gap-2 transition-all duration-200",
                    viewMode === "2d" && "shadow-sm"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  2D
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "3d" ? "default" : "ghost"}
                  onClick={() => setViewMode("3d")}
                  className={cn(
                    "gap-2 transition-all duration-200",
                    viewMode === "3d" && "shadow-sm"
                  )}
                >
                  <Box className="w-4 h-4" />
                  3D
                </Button>
              </div>
              
              <ExportButton data={exportData} filename="traffic-heatmap" title="매장 동선 히트맵" />
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
          </div>
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            
          {/* Hybrid View with smooth transition */}
          <div className="space-y-4 animate-fade-in">
            {/* 2D View */}
            <div 
              className={cn(
                "transition-all duration-500",
                viewMode === "2d" ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"
              )}
            >
              <Card>
                <CardHeader>
                  <CardTitle>2D 히트맵 분석</CardTitle>
                  <CardDescription>
                    시간대별 매장 내 고객 밀집도를 한눈에 파악하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrafficHeatmap visitsData={visitsData} heatPoints={heatPoints} timeOfDay={timeOfDay} />
                </CardContent>
              </Card>
            </div>

            {/* 3D View */}
            <div 
              className={cn(
                "transition-all duration-500",
                viewMode === "3d" ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"
              )}
            >
              {activeScene && selectedStore ? (
                <Card>
                  <CardHeader>
                    <CardTitle>3D 디지털 트윈 히트맵</CardTitle>
                    <CardDescription>
                      실제 매장 공간에서 고객 동선을 3D로 확인하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Time Controls */}
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-lg font-semibold">
                            {String(timeOfDay).padStart(2, '0')}:00
                          </Badge>
                          <span className="text-sm text-muted-foreground">시간대</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReset}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={isPlaying ? "secondary" : "default"}
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                일시정지
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                재생
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={[timeOfDay]}
                          onValueChange={([value]) => setTimeOfDay(value)}
                          min={9}
                          max={23}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>09:00</span>
                          <span>16:00</span>
                          <span>23:00</span>
                        </div>
                      </div>
                    </div>

                    {/* 3D Scene */}
                    <div className="relative h-[600px] rounded-lg overflow-hidden bg-background border">
                      <SceneComposer
                        recipe={activeScene.recipe_data}
                        overlay={
                          <>
                            {showZones && metadata && (
                              <ZoneBoundaryOverlay
                                zones={metadata.zones || []}
                                metadata={metadata}
                              />
                            )}
                            {showHeatmap && heatPoints.length > 0 && (
                              <HeatmapOverlay3D
                                heatPoints={heatPoints}
                                gridSize={20}
                              />
                            )}
                          </>
                        }
                      />
                      
                      {/* Overlay Controls */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={showHeatmap ? "default" : "outline"}
                          onClick={() => setShowHeatmap(!showHeatmap)}
                          className="backdrop-blur-sm bg-background/80"
                        >
                          히트맵 {showHeatmap ? 'ON' : 'OFF'}
                        </Button>
                        <Button
                          size="sm"
                          variant={showZones ? "default" : "outline"}
                          onClick={() => setShowZones(!showZones)}
                          className="backdrop-blur-sm bg-background/80"
                        >
                          Zone {showZones ? 'ON' : 'OFF'}
                        </Button>
                      </div>

                      {/* Statistics Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
                        {zoneStats.slice(0, 3).map((zone) => (
                          <Card key={zone.zone_id} className="backdrop-blur-sm bg-background/80">
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">{zone.zone_name}</div>
                              <div className="text-lg font-bold">{zone.visitCount}</div>
                              <div className="text-xs">방문</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      3D 히트맵을 보려면 매장을 선택하고 3D 씬을 설정해주세요.
                    </p>
                    <Button variant="outline" className="mt-4">
                      3D 설정 페이지로 이동
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comparison Analysis */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>비교 분석</CardTitle>
                <CardDescription>
                  이전 기간 대비 트래픽 변화 추이
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonView
                  data={comparisonData}
                  comparisonType={comparisonType}
                  onComparisonTypeChange={setComparisonType}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default TrafficHeatmapPage;
