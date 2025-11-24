import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useState, useEffect } from "react";
import { Users, TrendingUp, Clock, Activity, RefreshCw, Play, Pause, RotateCcw } from "lucide-react";
import { useFootfallAnalysis } from "@/hooks/useFootfallAnalysis";
import { useTrafficHeatmap, useZoneStatistics, useTrafficContext } from "@/hooks/useTrafficHeatmap";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";
import { HeatmapOverlay3D, ZoneBoundaryOverlay } from "@/features/digital-twin/components/overlays";
import type { StoreSpaceMetadata } from "@/features/digital-twin/types/iot.types";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";

export default function StoreAnalysisPage() {
  const { selectedStore } = useSelectedStore();
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  
  // 3D Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Data
  const { data: analysisData, isLoading, refetch } = useFootfallAnalysis(
    selectedStore?.id,
    dateRange.start,
    dateRange.end
  );
  const heatPoints = useTrafficHeatmap(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const zoneStats = useZoneStatistics(heatPoints, metadata);
  const contextInsights = useTrafficContext(selectedStore?.id);

  const stats = analysisData?.stats;
  const footfallData = analysisData?.data || [];

  // 시간대 애니메이션
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev >= 23 ? 9 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 일별 집계
  const dailyData = footfallData.reduce((acc, curr) => {
    const existing = acc.find(d => d.date === curr.date);
    if (existing) {
      existing.visits += curr.visit_count;
      existing.unique_visitors += curr.unique_visitors;
    } else {
      acc.push({
        date: curr.date,
        visits: curr.visit_count,
        unique_visitors: curr.unique_visitors,
        displayDate: format(new Date(curr.date), 'MM/dd'),
      });
    }
    return acc;
  }, [] as Array<{ date: string; visits: number; unique_visitors: number; displayDate: string }>);

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
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
            <h1 className="text-3xl font-bold gradient-text">매장 분석</h1>
            <p className="text-muted-foreground mt-2">
              방문자 트래픽과 동선 히트맵을 분석하세요
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 컨텍스트 인사이트 */}
        {contextInsights && contextInsights.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">컨텍스트 인사이트</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {contextInsights.map((insight, idx) => (
                      <p key={idx}>{insight}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 방문</p>
                  <p className="text-2xl font-bold">{stats?.total_visits.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">기간 내 전체 방문</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">고유 방문자</p>
                  <p className="text-2xl font-bold">{stats?.unique_visitors.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">중복 제거 방문자</p>
                </div>
                <Users className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">시간당 평균 방문</p>
                  <p className="text-2xl font-bold">{stats?.avg_visits_per_hour.toFixed(0) || 0}<span className="text-sm">명</span></p>
                  <p className="text-xs text-muted-foreground mt-1">매장 평균</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">피크 시간대</p>
                  <p className="text-2xl font-bold">
                    {stats?.peak_hour !== undefined && stats?.peak_hour !== null ? (
                      <>
                        {stats.peak_hour}
                        <span className="text-sm">시</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최대 방문 시간</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D 히트맵 & 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3D 히트맵 */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>동선 히트맵 3D</CardTitle>
                  <CardDescription>시간대별 고객 밀집도 시각화</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPlaying(false);
                      setTimeOfDay(14);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">시간대: {timeOfDay}:00</span>
                <Badge variant="outline">{heatPoints.length}개 포인트</Badge>
              </div>
              <Slider
                value={[timeOfDay]}
                onValueChange={([val]) => setTimeOfDay(val)}
                min={9}
                max={23}
                step={1}
                className="w-full"
              />
              <div className="h-[400px] rounded-lg border bg-muted/20">
                <SharedDigitalTwinScene
                  overlayType="none"
                  height="400px"
                  customOverlay={
                    <>
                      {showZones && metadata && (
                        <ZoneBoundaryOverlay zones={metadata.zones} metadata={metadata} />
                      )}
                      {showHeatmap && (
                        <HeatmapOverlay3D heatPoints={heatPoints} />
                      )}
                    </>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 일별 방문 추이 */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>일별 방문 추이</CardTitle>
              <CardDescription>최근 7일간 방문자 데이터</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="displayDate" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="hsl(var(--primary))"
                      fill="url(#visitsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 존별 통계 */}
        {zoneStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>존별 트래픽 분석</CardTitle>
              <CardDescription>각 구역별 방문 밀집도</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneStats}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="traffic" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
