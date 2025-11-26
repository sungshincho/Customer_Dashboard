import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useState, useEffect } from "react";
import { Users, TrendingUp, DollarSign, Clock, RefreshCw, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { useCustomerJourney, useJourneyStatistics } from "@/hooks/useCustomerJourney";
import { useCustomerSegments } from "@/hooks/useCustomerSegments";
import { usePurchasePatterns } from "@/hooks/usePurchasePatterns";
import { useMultipleStoreDataFiles } from "@/hooks/useStoreData";
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { CustomerPathOverlay, CustomerAvatarOverlay, ZoneBoundaryOverlay } from "@/features/simulation/components/overlays";
import type { StoreSpaceMetadata } from "@/features/simulation/types/iot.types";
import type { CustomerAvatar } from "@/features/simulation/types/avatar.types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CustomerAnalysisIntegratedPage() {
  const { selectedStore } = useSelectedStore();
  
  // 3D Journey Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);

  // Data
  const { paths, currentPositions } = useCustomerJourney(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const journeyStats = useJourneyStatistics(paths);
  const { segments, segmentStats } = useCustomerSegments();
  const { patterns } = usePurchasePatterns();

  // 전환 퍼널 데이터
  const dataQueries = useMultipleStoreDataFiles(['visits', 'purchases']);
  const [visitsQuery, purchasesQuery] = dataQueries;
  const visitsData = visitsQuery.data?.data || [];
  const purchasesData = purchasesQuery.data?.data || [];

  const totalVisits = visitsData.length;
  const browsing = Math.round(totalVisits * 0.75);
  const fitting = Math.round(totalVisits * 0.45);
  const purchases = purchasesData.length;
  const returns = Math.round(purchases * 0.3);

  const funnelData = totalVisits > 0 ? [
    { stage: "Entry", label: "유입", count: totalVisits, rate: 100, color: "hsl(var(--primary))" },
    { stage: "Browse", label: "체류", count: browsing, rate: Math.round((browsing / totalVisits) * 100), color: "#3b82f6" },
    { stage: "Fitting", label: "체험", count: fitting, rate: Math.round((fitting / totalVisits) * 100), color: "#10b981" },
    { stage: "Purchase", label: "구매", count: purchases, rate: Math.round((purchases / totalVisits) * 100), color: "#f59e0b" },
    { stage: "Return", label: "재방문", count: returns, rate: Math.round((returns / totalVisits) * 100), color: "#8b5cf6" },
  ] : [];

  // 시간대 애니메이션
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev >= 23 ? 9 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Convert paths for overlay
  const pathPoints = paths.map(path => 
    path.points.map(p => ({ x: p.x, y: 0.1, z: p.z, timestamp: new Date(p.timestamp).getTime() }))
  );

  const customerAvatars: CustomerAvatar[] = currentPositions.map(pos => ({
    id: pos.session_id,
    position: { x: pos.x, y: 0, z: pos.z },
    velocity: { x: 0, z: 0 },
    status: 'browsing' as const,
    lastUpdated: new Date(pos.timestamp).getTime()
  }));

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>매장을 선택해주세요</CardTitle>
              <CardDescription>
                분석을 시작하려면 상단에서 매장을 먼저 선택해주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 분석</h1>
            <p className="text-muted-foreground mt-2">
              고객 여정, 전환 퍼널, 세그먼트를 분석하세요
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 고객</p>
                  <p className="text-2xl font-bold">
                    {segments.length > 0 ? segments.length.toLocaleString() : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">전체 고객 수</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">전환율</p>
                  <p className="text-2xl font-bold">
                    {totalVisits > 0 ? `${Math.round((purchases / totalVisits) * 100)}%` : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">방문 대비 구매</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 객단가</p>
                  <p className="text-2xl font-bold">
                    {segmentStats[0]?.avgRevenue ? `₩${Math.round(segmentStats[0].avgRevenue).toLocaleString()}` : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">고객당 평균</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 여정 시간</p>
                  <p className="text-2xl font-bold">
                    {journeyStats.avgDuration > 0 ? (
                      <>
                        {journeyStats.avgDuration.toFixed(0)}
                        <span className="text-sm">분</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">매장 체류</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D 여정 & 전환 퍼널 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3D 고객 여정 */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>고객 여정 3D</CardTitle>
                  <CardDescription>실시간 동선 시각화</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsPlaying(false); setTimeOfDay(14); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">시간대: {timeOfDay}:00</span>
                <Badge variant="outline">{currentPositions.length}명 활동 중</Badge>
              </div>
              <Slider
                value={[timeOfDay]}
                onValueChange={([val]) => setTimeOfDay(val)}
                min={9}
                max={23}
                step={1}
              />
              <div className="h-[400px] rounded-lg border bg-muted/20">
                <SharedDigitalTwinScene
                  overlayType="none"
                  height="400px"
                  customOverlay={
                    <>
                      {metadata && <ZoneBoundaryOverlay zones={metadata.zones} metadata={metadata} />}
                      <CustomerPathOverlay paths={pathPoints} animate={true} />
                      <CustomerAvatarOverlay customers={customerAvatars} />
                    </>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 전환 퍼널 */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>전환 퍼널</CardTitle>
              <CardDescription>고객 여정 단계별 전환율</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>퍼널 데이터가 없습니다</p>
                  <p className="text-sm mt-1">방문 및 구매 데이터를 업로드해주세요</p>
                </div>
              ) : (
                funnelData.map((item, idx) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        <Badge variant="outline">{item.count.toLocaleString()}명</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.rate}%</span>
                    </div>
                    <Progress value={item.rate} className="h-3" />
                    {idx < funnelData.length - 1 && (
                      <div className="flex items-center gap-2 ml-4 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3" />
                        <span>다음 단계로 {Math.round((funnelData[idx + 1].count / item.count) * 100)}% 전환</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 세그먼트 & 패턴 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 고객 세그먼트 */}
          <Card>
            <CardHeader>
              <CardTitle>고객 세그먼트</CardTitle>
              <CardDescription>VIP, Regular, New 고객 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(segmentStats).map(([segment, data]: any) => ({ segment, count: data.count }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 구매 패턴 */}
          <Card>
            <CardHeader>
              <CardTitle>구매 패턴</CardTitle>
              <CardDescription>시간대별 구매 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Array.isArray(patterns) ? patterns : []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
