import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap } from "@/features/store-analysis/footfall/components/TrafficHeatmap";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Play, Pause, RotateCcw } from "lucide-react";
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

const TrafficHeatmapPage = () => {
  const { selectedStore } = useSelectedStore();
  const { activeScene } = useStoreScene();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  
  // 새로운 Hook 사용
  const { data: visitsResult, isLoading: loading, refetch } = useVisits();
  const visitsData = visitsResult?.data || [];
  
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
              <ExportButton data={exportData} filename="traffic-heatmap" title="매장 동선 히트맵" />
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
          </div>
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            
            <Tabs defaultValue="digital-twin" className="w-full">
              <TabsList>
                <TabsTrigger value="digital-twin">3D 디지털트윈 히트맵</TabsTrigger>
                <TabsTrigger value="analysis">2D 히트맵 분석</TabsTrigger>
                <TabsTrigger value="comparison">비교 분석</TabsTrigger>
              </TabsList>
          
          {/* 3D 디지털트윈 히트맵 */}
          <TabsContent value="digital-twin" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* 좌측: 컨트롤 및 통계 */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">시간대 컨트롤</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 시간 표시 */}
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className="text-2xl px-6 py-3">
                      {String(timeOfDay).padStart(2, "0")}:00
                    </Badge>
                  </div>

                  {/* 재생 컨트롤 */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleReset}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex-1"
                    >
                      {isPlaying ? (
                        <><Pause className="w-4 h-4 mr-2" /> 정지</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> 재생</>
                      )}
                    </Button>
                  </div>

                  {/* 시간 슬라이더 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">시간대 선택</label>
                    <Slider
                      value={[timeOfDay]}
                      onValueChange={([value]) => setTimeOfDay(value)}
                      min={9}
                      max={23}
                      step={1}
                      disabled={isPlaying}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>09:00</span>
                      <span>23:00</span>
                    </div>
                  </div>

                  {/* 레이어 토글 */}
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">레이어</label>
                    <div className="space-y-2">
                      <Button
                        variant={showZones ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowZones(!showZones)}
                        className="w-full justify-start"
                      >
                        {showZones ? "✓" : ""} Zone 경계선
                      </Button>
                      <Button
                        variant={showHeatmap ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className="w-full justify-start"
                      >
                        {showHeatmap ? "✓" : ""} 히트맵
                      </Button>
                    </div>
                  </div>

                  {/* Zone 통계 */}
                  {zoneStats.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <label className="text-sm font-medium">Zone 통계</label>
                      <div className="space-y-2">
                        {zoneStats.map((zone) => (
                          <div 
                            key={zone.zone_id}
                            className="p-2 rounded text-xs bg-muted"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span 
                                className="font-semibold"
                                style={{ color: zone.zone_color }}
                              >
                                {zone.zone_name}
                              </span>
                              <Badge variant="secondary">{zone.visitCount}</Badge>
                            </div>
                            <div className="text-muted-foreground">
                              평균 강도: {(zone.avgIntensity * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 우측: 3D 뷰어 */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>3D 디지털트윈 매장 프리뷰</CardTitle>
                  <CardDescription>
                    {heatPoints.length > 0 
                      ? `${timeOfDay}시 트래킹 데이터: ${heatPoints.length}개 포인트`
                      : '실시간 WiFi 트래킹 데이터를 3D 공간에 시각화합니다'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] bg-muted rounded-lg overflow-hidden">
                    {activeScene?.recipe_data ? (
                      <SceneComposer
                        recipe={activeScene.recipe_data}
                        overlay={
                          <>
                            {showZones && metadata?.zones && (
                              <ZoneBoundaryOverlay
                                zones={metadata.zones}
                                metadata={metadata}
                                showLabels={true}
                                opacity={0.6}
                              />
                            )}
                            {showHeatmap && heatPoints.length > 0 && (
                              <HeatmapOverlay3D
                                heatPoints={heatPoints}
                                gridSize={20}
                                heightScale={2}
                              />
                            )}
                          </>
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        디지털트윈 씬을 먼저 구성해주세요
                      </div>
                    )}
                  </div>

                  {/* 범례 */}
                  {showHeatmap && (
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                      <h4 className="font-semibold text-sm">히트맵 색상</h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-4 rounded" style={{ background: 'linear-gradient(to right, #0000FF, #00FFFF, #00FF00, #FFFF00, #FF0000)' }} />
                          <span>낮음 → 높음</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2D 히트맵 분석 */}
          <TabsContent value="analysis" className="space-y-6">
            <TrafficHeatmap visitsData={visitsData} />
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
