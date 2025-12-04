import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useState, useEffect, useMemo } from "react";
import { Users, TrendingUp, DollarSign, Clock, RefreshCw, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { useCustomerJourney, useJourneyStatistics } from "@/hooks/useCustomerJourney";
import { useSegmentStats } from "@/hooks/useCustomerSegmentsAgg";  // ✅ L3 사용
import { useFunnelAnalysis } from "@/hooks/useFunnelAnalysis";     // ✅ L2 funnel_events 사용
import { useLatestKPIAgg } from "@/hooks/useDashboardKPIAgg";       // ✅ L3 사용
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { CustomerPathOverlay, CustomerAvatarOverlay, ZoneBoundaryOverlay } from "@/features/simulation/components/overlays";
import type { StoreSpaceMetadata } from "@/features/simulation/types/iot.types";
import type { CustomerAvatar } from "@/features/simulation/types/avatar.types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";
import { subDays } from "date-fns";

/**
 * 고객 분석 페이지 - 통일된 L3 구조
 * 
 * 데이터 소스:
 * - KPI 카드: daily_kpis_agg + customer_segments_agg (L3) ✅
 * - 전환 퍼널: funnel_events (L2) ✅ - 하드코딩 제거
 * - 세그먼트: customer_segments_agg (L3) ✅
 * - 구매 패턴: daily_kpis_agg (L3) ✅
 * - 고객 여정 3D: wifi_tracking (L2) - 실시간 시각화용
 */
export default function CustomerAnalysisPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  
  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Customer Analysis',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);
  
  // 3D Journey Controls
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);

  // ✅ L3 데이터 소스 - 세그먼트 통계
  const { stats: segmentStats, totalCustomers, isLoading: segmentsLoading } = useSegmentStats(selectedStore?.id);
  
  // ✅ L3 데이터 소스 - 최근 7일 KPI (전환율, 구매 패턴용)
  const { data: latestKPIs, isLoading: kpisLoading } = useLatestKPIAgg(selectedStore?.id, 7);
  
  // ✅ L2 데이터 소스 - 퍼널 분석 (하드코딩 제거)
  const { data: funnelData, isLoading: funnelLoading } = useFunnelAnalysis(
    selectedStore?.id,
    subDays(new Date(), 7),
    new Date()
  );

  // L2 데이터 - 실시간 시각화용 (고객 여정 3D)
  const { paths, currentPositions } = useCustomerJourney(selectedStore?.id, timeOfDay);
  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const journeyStats = useJourneyStatistics(paths);

  // ✅ L3 기반 KPI 계산
  const kpiStats = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) {
      return {
        conversionRate: 0,
        avgTransactionValue: 0,
      };
    }

    // 최근 7일 평균 전환율
    const avgConversion = latestKPIs.reduce((sum, kpi) => sum + (kpi.conversion_rate || 0), 0) / latestKPIs.length;
    
    // 최근 7일 평균 객단가
    const avgTransaction = latestKPIs.reduce((sum, kpi) => sum + (kpi.avg_transaction_value || 0), 0) / latestKPIs.length;

    return {
      conversionRate: avgConversion,
      avgTransactionValue: avgTransaction,
    };
  }, [latestKPIs]);

  // ✅ L2 funnel_events 기반 퍼널 데이터 (하드코딩 완전 제거)
  const funnelStages = useMemo(() => {
    if (!funnelData || funnelData.totalEntries === 0) return [];

    const stageLabels: Record<string, string> = {
      entry: '유입',
      browse: '체류',
      engage: '체험',
      fitting: '피팅',
      purchase: '구매',
    };

    const stageColors: Record<string, string> = {
      entry: 'hsl(var(--primary))',
      browse: '#3b82f6',
      engage: '#10b981',
      fitting: '#f59e0b',
      purchase: '#8b5cf6',
    };

    return funnelData.stages
      .filter(stage => stage.count > 0 || stage.event_type === 'entry')
      .map(stage => ({
        stage: stage.event_type,
        label: stageLabels[stage.event_type] || stage.event_type,
        count: stage.count,
        rate: Math.round(stage.conversion_rate),
        color: stageColors[stage.event_type] || '#666',
      }));
  }, [funnelData]);

  // ✅ L3 기반 세그먼트 차트 데이터
  const segmentChartData = useMemo(() => {
    if (!segmentStats) return [];

    return [
      { segment: 'VIP', count: segmentStats.vip.count, revenue: segmentStats.vip.totalRevenue },
      { segment: 'Regular', count: segmentStats.regular.count, revenue: segmentStats.regular.totalRevenue },
      { segment: 'New', count: segmentStats.new.count, revenue: segmentStats.new.totalRevenue },
      { segment: 'Churning', count: segmentStats.churning.count, revenue: segmentStats.churning.totalRevenue },
    ].filter(s => s.count > 0);
  }, [segmentStats]);

  // ✅ L3 기반 일별 구매 패턴 (daily_kpis_agg)
  const purchasePatternData = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) return [];

    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weeklyMap = new Map<string, { count: number; revenue: number }>();

    latestKPIs.forEach(kpi => {
      const dayIndex = new Date(kpi.date).getDay();
      const day = weekdays[dayIndex];
      const current = weeklyMap.get(day) || { count: 0, revenue: 0 };
      weeklyMap.set(day, {
        count: current.count + (kpi.total_transactions || 0),
        revenue: current.revenue + (kpi.total_revenue || 0),
      });
    });

    return weekdays.map(day => ({
      day,
      ...(weeklyMap.get(day) || { count: 0, revenue: 0 }),
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

  const isLoading = segmentsLoading || kpisLoading || funnelLoading;

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

        {/* KPI Cards - L3 기반 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ✅ 수정: 총 고객 → 고객 세그먼트 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">고객 세그먼트</p>
                  <p className="text-2xl font-bold">
                    {segmentChartData.length > 0 ? segmentChartData.length : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">VIP/Regular/New/Churning</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* ✅ L3 기반 전환율 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">전환율</p>
                  <p className="text-2xl font-bold">
                    {funnelData?.overallConversionRate ? (
                      `${funnelData.overallConversionRate.toFixed(1)}%`
                    ) : kpiStats.conversionRate > 0 ? (
                      `${kpiStats.conversionRate.toFixed(1)}%`
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">방문 대비 구매</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* ✅ L3 기반 평균 객단가 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 객단가</p>
                  <p className="text-2xl font-bold">
                    {kpiStats.avgTransactionValue > 0 ? (
                      `₩${Math.round(kpiStats.avgTransactionValue).toLocaleString()}`
                    ) : segmentStats?.vip?.avgLTV ? (
                      `₩${Math.round(segmentStats.vip.avgLTV).toLocaleString()}`
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최근 7일 평균</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 체류 시간</p>
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
          {/* 3D 고객 여정 - L2 사용 (실시간 시각화) */}
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

          {/* ✅ 전환 퍼널 - L2 funnel_events 사용 (하드코딩 제거) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>전환 퍼널</CardTitle>
              <CardDescription>고객 여정 단계별 전환율 (최근 7일, L2)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelStages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>퍼널 데이터가 없습니다</p>
                  <p className="text-sm mt-1">funnel_events 테이블에 데이터를 추가해주세요</p>
                </div>
              ) : (
                funnelStages.map((item, idx) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        <Badge variant="outline">{item.count.toLocaleString()}명</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.rate}%</span>
                    </div>
                    <Progress value={item.rate} className="h-3" />
                    {idx < funnelStages.length - 1 && (
                      <div className="flex items-center gap-2 ml-4 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3" />
                        <span>
                          다음 단계로 {funnelStages[idx + 1].count > 0 && item.count > 0 
                            ? Math.round((funnelStages[idx + 1].count / item.count) * 100) 
                            : 0}% 전환
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 세그먼트 & 패턴 - L3 기반 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ 고객 세그먼트 - L3 사용 */}
          <Card>
            <CardHeader>
              <CardTitle>고객 세그먼트</CardTitle>
              <CardDescription>VIP, Regular, New, Churning 분포 (L3)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {segmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="고객 수" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>세그먼트 데이터가 없습니다</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ✅ 구매 패턴 - L3 사용 */}
          <Card>
            <CardHeader>
              <CardTitle>요일별 구매 패턴</CardTitle>
              <CardDescription>요일별 구매 분포 (L3)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {purchasePatternData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchasePatternData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="구매 건수" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>구매 패턴 데이터가 없습니다</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
