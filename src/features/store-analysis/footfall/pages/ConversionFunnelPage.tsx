import { DashboardLayout } from "@/components/DashboardLayout";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Users, ShoppingCart, DollarSign, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";
import { ZoneBoundaryOverlay } from "@/features/digital-twin/components/overlays";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useMultipleStoreDataFiles } from "@/hooks/useStoreData";
import type { StoreSpaceMetadata } from "@/features/digital-twin/types/iot.types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const timeRanges = {
  "today": { label: "오늘", multiplier: 1 },
  "week": { label: "이번 주", multiplier: 7 },
  "month": { label: "이번 달", multiplier: 30 },
};

const ConversionFunnelPage = () => {
  const { selectedStore } = useSelectedStore();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [timeRange, setTimeRange] = useState<keyof typeof timeRanges>("today");
  const [showZones, setShowZones] = useState(true);
  const [showFunnelOverlay, setShowFunnelOverlay] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>("전체");

  const metadata = selectedStore?.metadata?.storeSpaceMetadata as StoreSpaceMetadata | undefined;
  const zones = metadata?.zones || [];

  // 여러 파일 동시 로드
  const dataQueries = useMultipleStoreDataFiles(['visits', 'purchases']);
  const [visitsQuery, purchasesQuery] = dataQueries;
  
  const visitsData = visitsQuery.data?.data || [];
  const purchasesData = purchasesQuery.data?.data || [];

  const handleRefresh = () => {
    visitsQuery.refetch();
    purchasesQuery.refetch();
  };

  // 퍼널 데이터 계산
  const funnelData = useMemo(() => {
    const totalVisits = visitsData.length || 1;
    const browsing = Math.round(totalVisits * 0.75); // 75% 체류
    const fitting = Math.round(totalVisits * 0.45); // 45% 체험
    const purchases = purchasesData.length;
    const returns = Math.round(purchases * 0.3); // 30% 재방문

    const multiplier = timeRanges[timeRange].multiplier;

    return [
      { 
        stage: "Entry", 
        label: "유입",
        count: Math.round(totalVisits * multiplier), 
        rate: 100, 
        color: "hsl(var(--primary))",
        dropoff: 0
      },
      { 
        stage: "Browse", 
        label: "체류",
        count: Math.round(browsing * multiplier), 
        rate: Math.round((browsing / totalVisits) * 100), 
        color: "#3b82f6",
        dropoff: Math.round(((totalVisits - browsing) / totalVisits) * 100)
      },
      { 
        stage: "Fitting", 
        label: "체험",
        count: Math.round(fitting * multiplier), 
        rate: Math.round((fitting / totalVisits) * 100), 
        color: "#10b981",
        dropoff: Math.round(((browsing - fitting) / browsing) * 100)
      },
      { 
        stage: "Purchase", 
        label: "구매",
        count: Math.round(purchases * multiplier), 
        rate: Math.round((purchases / totalVisits) * 100), 
        color: "#f59e0b",
        dropoff: Math.round(((fitting - purchases) / fitting) * 100)
      },
      { 
        stage: "Return", 
        label: "재방문",
        count: Math.round(returns * multiplier), 
        rate: Math.round((returns / totalVisits) * 100), 
        color: "#8b5cf6",
        dropoff: Math.round(((purchases - returns) / purchases) * 100)
      }
    ];
  }, [visitsData, purchasesData, timeRange]);

  // 세그먼트별 데이터
  const segmentData = useMemo(() => {
    return {
      "전체": funnelData,
      "신규고객": funnelData.map(d => ({ ...d, count: Math.round(d.count * 0.6) })),
      "재방문고객": funnelData.map(d => ({ ...d, count: Math.round(d.count * 0.4) })),
      "VIP고객": funnelData.map(d => ({ ...d, count: Math.round(d.count * 0.2), rate: Math.min(100, d.rate * 1.5) }))
    };
  }, [funnelData]);

  const currentFunnelData = segmentData[selectedSegment as keyof typeof segmentData] || funnelData;

  const totalRevenue = useMemo(() => {
    return purchasesData.reduce((sum: number, p: any) => {
      const price = parseFloat(p.total_amount || p.price || 0);
      return sum + price;
    }, 0) * timeRanges[timeRange].multiplier;
  }, [purchasesData, timeRange]);

  const conversionRate = currentFunnelData[0].count > 0 
    ? ((currentFunnelData[3].count / currentFunnelData[0].count) * 100).toFixed(1)
    : '0';

  const exportData = {
    filters,
    timeRange: timeRanges[timeRange].label,
    segment: selectedSegment,
    funnelData: currentFunnelData,
    totalRevenue,
    conversionRate
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold gradient-text">전환 퍼널</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedStore 
                  ? `${selectedStore.store_name} - 전환율: ${conversionRate}%` 
                  : '방문부터 구매까지의 고객 여정 분석'}
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton data={exportData} filename="conversion-funnel" title="전환 퍼널" />
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
          </div>
          
          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

          {/* 통합 3D 뷰 */}
          <div className="grid md:grid-cols-4 gap-6">
            {/* 좌측: 컨트롤 및 통계 */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">퍼널 컨트롤</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 시간 범위 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">시간 범위</label>
                  <Select value={timeRange} onValueChange={(v) => setTimeRange(v as keyof typeof timeRanges)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(timeRanges).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 세그먼트 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">고객 세그먼트</label>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="신규고객">신규고객</SelectItem>
                      <SelectItem value="재방문고객">재방문고객</SelectItem>
                      <SelectItem value="VIP고객">VIP고객</SelectItem>
                    </SelectContent>
                  </Select>
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
                      variant={showFunnelOverlay ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFunnelOverlay(!showFunnelOverlay)}
                      className="w-full justify-start"
                    >
                      {showFunnelOverlay ? "✓" : ""} 퍼널 단계
                    </Button>
                  </div>
                </div>

                {/* 주요 지표 */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">주요 지표</label>
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm">총 방문자</span>
                        </div>
                        <Badge variant="secondary">{currentFunnelData[0].count.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">구매 고객</span>
                        </div>
                        <Badge variant="secondary">{currentFunnelData[3].count.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm">총 매출</span>
                        </div>
                        <Badge variant="secondary">₩{totalRevenue.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">전환율</span>
                        </div>
                        <Badge variant="secondary">{conversionRate}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 퍼널 단계별 통계 */}
                {showFunnelOverlay && (
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">단계별 현황</label>
                    <div className="space-y-2">
                      {currentFunnelData.map((stage, idx) => (
                        <div key={stage.stage} className="p-2 rounded bg-muted text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{stage.label}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{stage.count.toLocaleString()}</Badge>
                              <span className="text-muted-foreground">({stage.rate}%)</span>
                            </div>
                          </div>
                          {idx > 0 && stage.dropoff > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <TrendingDown className="w-3 h-3" />
                              <span>이탈률: {stage.dropoff}%</span>
                            </div>
                          )}
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
                <CardTitle>3D 전환 퍼널 분석</CardTitle>
                <CardDescription>
                  {selectedSegment} 세그먼트 - {timeRanges[timeRange].label} 데이터
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] bg-muted rounded-lg overflow-hidden">
                  <SharedDigitalTwinScene
                    overlayType="funnel"
                    customOverlay={
                      <>
                        {showZones && metadata && (
                          <ZoneBoundaryOverlay
                            zones={zones}
                            metadata={metadata}
                          />
                        )}
                      </>
                    }
                    height="600px"
                  />
                </div>

                {/* 범례 */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">퍼널 단계</h4>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {currentFunnelData.map((stage) => (
                      <div key={stage.stage} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: stage.color }} />
                        <span>{stage.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 하단: 퍼널 시각화 및 비교 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 퍼널 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">단계별 전환율</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentFunnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis label={{ value: '전환율 (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--primary))">
                      {currentFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 세그먼트 비교 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">세그먼트별 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(segmentData).map(([segment, data]) => {
                    const segmentConversionRate = data[0].count > 0 
                      ? ((data[3].count / data[0].count) * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={segment} className="p-3 rounded bg-muted">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{segment}</span>
                          <Badge variant={segment === selectedSegment ? "default" : "secondary"}>
                            {segmentConversionRate}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{data[0].count.toLocaleString()}명</span>
                          <ChevronRight className="w-3 h-3 mx-1" />
                          <ShoppingCart className="w-3 h-3" />
                          <span>{data[3].count.toLocaleString()}건</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default ConversionFunnelPage;
