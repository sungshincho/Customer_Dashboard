import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Play, Pause, RotateCcw, Users, TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";
import { CustomerPathOverlay, CustomerAvatarOverlay, ZoneBoundaryOverlay, ZoneTransitionOverlay, DwellTimeOverlay } from "@/features/digital-twin/components/overlays";
import { useCustomerJourney, useJourneyStatistics } from "@/hooks/useCustomerJourney";
import { useZoneTransition } from "@/hooks/useZoneTransition";
import { useDwellTime } from "@/hooks/useDwellTime";
import type { StoreSpaceMetadata } from "@/features/digital-twin/types/iot.types";
import type { CustomerAvatar } from "@/features/digital-twin/types/avatar.types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomerJourneyPage = () => {
  const { selectedStore } = useSelectedStore();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });

  // 3D Journey Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPaths, setShowPaths] = useState(true);
  const [showAvatars, setShowAvatars] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showZoneTransitions, setShowZoneTransitions] = useState(false);
  const [showDwellTime, setShowDwellTime] = useState(false);
  const [animatePaths, setAnimatePaths] = useState(true);

  // WiFi 트래킹 데이터를 고객 경로로 변환
  const { paths, currentPositions } = useCustomerJourney(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const zones = metadata?.zones || [];
  const journeyStats = useJourneyStatistics(paths);
  
  // 존 전환 및 체류 시간 데이터
  const zoneTransitionStats = useZoneTransition(selectedStore?.id, zones);
  const dwellTimeStats = useDwellTime(selectedStore?.id, zones);

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
    window.location.reload();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOfDay(14);
  };


  const exportData = {
    filters,
    timeOfDay,
    totalPaths: paths.length,
    currentCustomers: currentPositions.length,
    zoneTransitions: zoneTransitionStats,
    dwellTimes: dwellTimeStats
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
        
        <Tabs defaultValue="path-pattern" className="w-full">
          <TabsList>
            <TabsTrigger value="path-pattern">고객 동선 패턴</TabsTrigger>
            <TabsTrigger value="zone-transition">존 전환 확률</TabsTrigger>
            <TabsTrigger value="dwell-time">체류 시간 분석</TabsTrigger>
          </TabsList>

          {/* 고객 동선 패턴 */}
          <TabsContent value="path-pattern" className="space-y-6">
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
<SharedDigitalTwinScene
                      overlayType="journey"
                      customOverlay={
                        <>
                          {showZones && metadata && (
                            <ZoneBoundaryOverlay
                              zones={metadata.zones || []}
                              metadata={metadata}
                            />
                          )}
                          {showPaths && pathPoints.length > 0 && (
                            <CustomerPathOverlay paths={pathPoints} animate={animatePaths} />
                          )}
                          {showAvatars && customerAvatars.length > 0 && (
                            <CustomerAvatarOverlay customers={customerAvatars} />
                          )}
                        </>
                      }
                      height="600px"
                    />
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

          {/* 존 전환 확률 */}
          <TabsContent value="zone-transition" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    존 전환 통계
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">총 전환 수</div>
                    <div className="text-2xl font-bold">{zoneTransitionStats.totalTransitions}</div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium">주요 전환 경로</div>
                    {zoneTransitionStats.topTransitions.map((t, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{t.fromZone} → {t.toZone}</span>
                          <Badge variant="secondary">{t.probability.toFixed(1)}%</Badge>
                        </div>
                        <div className="text-muted-foreground">전환 {t.count}회</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>존 전환 3D 시각화</CardTitle>
                  <CardDescription>
                    화살표 두께와 색상으로 전환 확률 표시 (진할수록 높은 확률)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] bg-muted rounded-lg overflow-hidden">
                    <SharedDigitalTwinScene
                      overlayType="none"
                      customOverlay={
                        <>
                          {metadata && (
                            <ZoneBoundaryOverlay
                              zones={zones}
                              metadata={metadata}
                            />
                          )}
                          <ZoneTransitionOverlay
                            transitions={zoneTransitionStats.transitions}
                            zones={zones}
                          />
                        </>
                      }
                      height="600px"
                    />
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">전환 확률 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={zoneTransitionStats.topTransitions.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={(d) => `${d.fromZone}→${d.toZone}`} 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={11}
                        />
                        <YAxis label={{ value: '확률 (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="probability" fill="hsl(var(--primary))">
                          {zoneTransitionStats.topTransitions.slice(0, 8).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${220 - index * 20}, 70%, 50%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 체류 시간 분석 */}
          <TabsContent value="dwell-time" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    체류 시간 통계
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">전체 평균</div>
                    <div className="text-2xl font-bold">{Math.round(dwellTimeStats.overallAvgDwellTime / 60)}분</div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium">존별 체류 시간</div>
                    {dwellTimeStats.zoneDwellTimes.slice(0, 5).map((d, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{d.zoneName}</span>
                          <Badge variant="secondary">{Math.round(d.avgDwellTime / 60)}분</Badge>
                        </div>
                        <div className="text-muted-foreground">방문 {d.totalVisits}회</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>존별 체류 시간 3D 시각화</CardTitle>
                  <CardDescription>
                    원기둥 높이와 색상으로 체류 시간 표시 (높고 붉을수록 긴 체류)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] bg-muted rounded-lg overflow-hidden">
                    <SharedDigitalTwinScene
                      overlayType="none"
                      customOverlay={
                        <>
                          {metadata && (
                            <ZoneBoundaryOverlay
                              zones={zones}
                              metadata={metadata}
                            />
                          )}
                          <DwellTimeOverlay
                            dwellTimes={dwellTimeStats.zoneDwellTimes}
                            zones={zones}
                          />
                        </>
                      }
                      height="600px"
                    />
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">체류 시간 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dwellTimeStats.zoneDwellTimes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="zoneName" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={11}
                        />
                        <YAxis label={{ value: '평균 체류 시간 (초)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: number) => `${Math.round(value / 60)}분 ${value % 60}초`}
                        />
                        <Bar dataKey="avgDwellTime" fill="hsl(var(--primary))">
                          {dwellTimeStats.zoneDwellTimes.map((entry, index) => {
                            const maxTime = Math.max(...dwellTimeStats.zoneDwellTimes.map(d => d.avgDwellTime));
                            const intensity = entry.avgDwellTime / maxTime;
                            const hue = 220 - intensity * 100;
                            return <Cell key={`cell-${index}`} fill={`hsl(${hue}, 70%, 50%)`} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default CustomerJourneyPage;
