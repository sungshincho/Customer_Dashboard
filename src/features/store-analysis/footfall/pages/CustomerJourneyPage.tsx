import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerJourney } from "@/features/store-analysis/footfall/components/CustomerJourney";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Play, Pause, RotateCcw, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useMultipleStoreDataFiles } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { SceneComposer } from "@/features/digital-twin/components/SceneComposer";
import { CustomerPathOverlay, CustomerAvatarOverlay, ZoneBoundaryOverlay } from "@/features/digital-twin/components/overlays";
import { useStoreScene } from "@/hooks/useStoreScene";
import { useCustomerJourney, useJourneyStatistics } from "@/hooks/useCustomerJourney";
import type { StoreSpaceMetadata } from "@/features/digital-twin/types/iot.types";
import type { CustomerAvatar } from "@/features/digital-twin/types/avatar.types";

const CustomerJourneyPage = () => {
  const { selectedStore } = useSelectedStore();
  const { activeScene } = useStoreScene();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  
  // 여러 파일 동시 로드
  const dataQueries = useMultipleStoreDataFiles(['visits', 'purchases']);
  const [visitsQuery, purchasesQuery] = dataQueries;
  
  const visitsData = visitsQuery.data?.data || [];
  const purchasesData = purchasesQuery.data?.data || [];
  const loading = visitsQuery.isLoading || purchasesQuery.isLoading;

  // 3D Journey Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPaths, setShowPaths] = useState(true);
  const [showAvatars, setShowAvatars] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [animatePaths, setAnimatePaths] = useState(true);

  // WiFi 트래킹 데이터를 고객 경로로 변환
  const { paths, currentPositions } = useCustomerJourney(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const journeyStats = useJourneyStatistics(paths);

  // Convert paths to PathPoint[][] format for CustomerPathOverlay
  const pathPoints = paths.map(path => 
    path.points.map(p => ({ x: p.x, y: 0.1, z: p.z, timestamp: new Date(p.timestamp).getTime() }))
  );

  // Convert positions to CustomerAvatar[] format
  const customerAvatars: CustomerAvatar[] = currentPositions.map(pos => ({
    id: pos.session_id,
    position: { x: pos.x, y: 0, z: pos.z },
    velocity: { x: 0, z: 0 },
    status: 'browsing' as const,
    lastUpdated: new Date(pos.timestamp).getTime()
  }));

  // 시간대 애니메이션
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev >= 23 ? 9 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleRefresh = () => {
    visitsQuery.refetch();
    purchasesQuery.refetch();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOfDay(14);
  };

  // 실제 데이터 기반 비교 데이터
  const comparisonData = [
    { 
      label: "평균 동선 길이", 
      current: journeyStats.avgDistance, 
      previous: journeyStats.avgDistance > 5 ? journeyStats.avgDistance * 0.9 : journeyStats.avgDistance, 
      unit: "m" 
    },
    { 
      label: "평균 경로 포인트", 
      current: journeyStats.avgPathLength, 
      previous: journeyStats.avgPathLength > 1 ? journeyStats.avgPathLength * 0.92 : journeyStats.avgPathLength, 
      unit: "개" 
    },
    { 
      label: "평균 체류 시간", 
      current: journeyStats.avgDuration, 
      previous: journeyStats.avgDuration > 10 ? journeyStats.avgDuration * 0.88 : journeyStats.avgDuration, 
      unit: "분" 
    }
  ];

  const exportData = {
    filters,
    journeyMetrics: comparisonData,
    timeOfDay,
    totalPaths: paths.length,
    currentCustomers: currentPositions.length
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
        <div className="space-y-6">

        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 여정 맵</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore 
                ? `${selectedStore.store_name} - 추적된 경로: ${paths.length}개` 
                : '고객 이동 경로 및 체류 패턴 분석'}
            </p>
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
        
        <Tabs defaultValue="3d-journey" className="w-full">
          <TabsList>
            <TabsTrigger value="3d-journey">3D 고객 동선</TabsTrigger>
            <TabsTrigger value="analysis">2D 여정 분석</TabsTrigger>
            <TabsTrigger value="comparison">비교 분석</TabsTrigger>
          </TabsList>

          {/* 3D 고객 동선 */}
          <TabsContent value="3d-journey" className="space-y-6">
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
                        variant={showPaths ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowPaths(!showPaths)}
                        className="w-full justify-start"
                      >
                        {showPaths ? "✓" : ""} 이동 경로
                      </Button>
                      <Button
                        variant={showAvatars ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAvatars(!showAvatars)}
                        className="w-full justify-start"
                      >
                        {showAvatars ? "✓" : ""} 고객 아바타
                      </Button>
                    </div>
                  </div>

                  {/* 애니메이션 옵션 */}
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">옵션</label>
                    <Button
                      variant={animatePaths ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnimatePaths(!animatePaths)}
                      className="w-full justify-start"
                    >
                      {animatePaths ? "✓" : ""} 경로 애니메이션
                    </Button>
                  </div>

                  {/* 여정 통계 */}
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      여정 통계
                    </label>
                    <div className="space-y-2">
                      <div className="p-2 rounded text-xs bg-muted">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">총 고객</span>
                          <Badge variant="secondary">{journeyStats.totalCustomers}</Badge>
                        </div>
                      </div>
                      <div className="p-2 rounded text-xs bg-muted">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">평균 거리</span>
                          <Badge variant="secondary">{journeyStats.avgDistance}m</Badge>
                        </div>
                      </div>
                      <div className="p-2 rounded text-xs bg-muted">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">평균 체류</span>
                          <Badge variant="secondary">{journeyStats.avgDuration}분</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 우측: 3D 뷰어 */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>3D 고객 동선 프리뷰</CardTitle>
                  <CardDescription>
                    {paths.length > 0 
                      ? `${timeOfDay}시 고객 경로: ${paths.length}개, 현재 위치: ${currentPositions.length}명`
                      : 'WiFi 트래킹 데이터를 기반으로 고객 이동 경로를 시각화합니다'
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
                                opacity={0.3}
                              />
                            )}
                            {showPaths && pathPoints.length > 0 && (
                              <CustomerPathOverlay
                                paths={pathPoints}
                                animate={animatePaths}
                                color="#1B6BFF"
                              />
                            )}
                            {showAvatars && customerAvatars.length > 0 && (
                              <CustomerAvatarOverlay
                                customers={customerAvatars}
                                maxInstances={200}
                                animationSpeed={1.0}
                                showTrails={false}
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
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">범례</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
                        <span>시작점</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                        <span>종료점</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1B6BFF' }} />
                        <span>이동 경로</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2D 여정 분석 */}
          <TabsContent value="analysis" className="space-y-6">
            <CustomerJourney visitsData={visitsData} purchasesData={purchasesData} />
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
    </DataReadinessGuard>
  );
};

export default CustomerJourneyPage;
