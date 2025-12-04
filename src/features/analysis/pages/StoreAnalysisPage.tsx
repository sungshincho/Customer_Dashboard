import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useState, useEffect, useMemo } from "react";
import { Users, TrendingUp, Clock, Activity, RefreshCw, Play, Pause, RotateCcw } from "lucide-react";
import { useLatestKPIAgg } from "@/hooks/useDashboardKPIAgg";  // ✅ L3 사용
import { useTrafficHeatmap, useZoneStatistics, useTrafficContext } from "@/hooks/useTrafficHeatmap";
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { HeatmapOverlay3D, ZoneBoundaryOverlay } from "@/features/simulation/components/overlays";
import type { StoreSpaceMetadata } from "@/features/simulation/types/iot.types";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

/**
 * 매장 분석 페이지 - 통일된 L3 구조
 * 
 * 데이터 소스:
 * - KPI 카드: daily_kpis_agg (L3) ✅
 * - 일별 추이: daily_kpis_agg (L3) ✅
 * - 히트맵: wifi_tracking (L2) - 실시간 시각화용
 * - 존 통계: zones_dim (L2) - 실시간 시각화용
 */
export default function StoreAnalysisPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Store Analysis',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);
  
  // 3D Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // ✅ L3 데이터 소스 - 최근 7일 KPI
  const { data: latestKPIs, isLoading, refetch } = useLatestKPIAgg(selectedStore?.id, 7);
  
  // L2 데이터 - 실시간 시각화용 (히트맵)
  const heatPoints = useTrafficHeatmap(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const zoneStats = useZoneStatistics(heatPoints, metadata);
  const contextInsights = useTrafficContext(selectedStore?.id);

  // ✅ L3 기반 KPI 계산
  const stats = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) {
      return {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgVisitsPerHour: 0,
        peakHour: null as number | null,
      };
    }

    // 최근 7일 합계
    const totalVisits = latestKPIs.reduce((sum, kpi) => sum + (kpi.total_visitors || 0), 0);
    const uniqueVisitors = latestKPIs.reduce((sum, kpi) => sum + (kpi.unique_visitors || 0), 0);
    
    // 평균 시간당 방문 (영업시간 14시간 가정: 9시~23시)
    const avgVisitsPerHour = totalVisits / (latestKPIs.length * 14);
    
    // 피크 시간대 (가장 최근 데이터 기준)
    // L3에서 피크 시간대를 직접 제공하지 않으므로, 대시보드 레벨에서 계산하거나 L3 확장 필요
    // 임시로 null 처리
    const peakHour = null;

    return {
      totalVisits,
      uniqueVisitors,
      avgVisitsPerHour,
      peakHour,
    };
  }, [latestKPIs]);

  // ✅ L3 기반 일별 차트 데이터
  const dailyData = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) return [];
    
    return latestKPIs
      .slice()
      .reverse()
      .map(kpi => ({
        date: kpi.date,
        visits: kpi.total_visitors || 0,
        unique_visitors: kpi.unique_visitors || 0,
        displayDate: format(new Date(kpi.date), 'MM/dd'),
      }));
  }, [latestKPIs]);

  // 시간대 애니메이션
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev >= 23 ? 9 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

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

        {/* KPI Cards - L3 기반 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 방문</p>
                  <p className="text-2xl font-bold">
                    {stats.totalVisits > 0 ? (
                      stats.totalVisits.toLocaleString()
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최근 7일</p>
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
                  <p className="text-2xl font-bold">
                    {stats.uniqueVisitors > 0 ? (
                      <>
                        {stats.uniqueVisitors.toLocaleString()}
                        <span className="text-sm">명</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">중복 제거</p>
                </div>
                <Users className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">시간당 평균</p>
                  <p className="text-2xl font-bold">
                    {stats.avgVisitsPerHour > 0 ? (
                      <>
                        {stats.avgVisitsPerHour.toFixed(1)}
                        <span className="text-sm">명</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">영업시간 기준</p>
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
                    {stats.peakHour !== null ? (
                      <>
                        {stats.peakHour}
                        <span className="text-sm">시</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">분석 중</span>
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
          {/* 3D 히트맵 - L2 사용 (실시간 시각화) */}
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

          {/* 일별 방문 추이 - L3 사용 */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>일별 방문 추이</CardTitle>
              <CardDescription>최근 7일간 방문자 데이터 (L3)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {dailyData.length > 0 ? (
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
                        name="방문자"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>방문 데이터가 없습니다</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 존별 통계 - L2 사용 (실시간 시각화) */}
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
