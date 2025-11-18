import { DashboardLayout } from "@/components/DashboardLayout";
import { FootfallVisualizer } from "@/features/store-analysis/footfall/components/FootfallVisualizer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Store } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreScene } from "@/hooks/useStoreScene";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SceneViewer } from "@/features/digital-twin/components/SceneViewer";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useVisits } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Store3DViewer } from "@/features/digital-twin/components/Store3DViewer";
import { CustomerPathOverlay, CustomerAvatarOverlay, RealtimeCustomerOverlay } from "@/features/digital-twin/components/overlays";
import { generateCustomerPaths, generateCustomerAvatars } from "@/features/digital-twin/utils/overlayDataConverter";

const FootfallAnalysis = () => {
  const { selectedStore } = useSelectedStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [showRealtimeIoT, setShowRealtimeIoT] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  const [showPaths, setShowPaths] = useState(false);
  
  const { activeScene, isLoading: sceneLoading } = useStoreScene();
  const { latestAnalysis, analyzing } = useAutoAnalysis('visitor', true);
  
  // 새로운 Hook 사용 (자동 캐싱 + 타입 안전)
  const { data: visitsResult, isLoading: loading, refetch } = useVisits();
  const visitsData = visitsResult?.data || [];
  
  const sceneRecipe = activeScene?.recipe_data;

  const handleRefresh = () => {
    refetch();
  };

  const totalVisits = visitsData.length;
  const totalPurchased = visitsData.filter(v => v.purchased === 'Y').length;
  const conversionRate = totalVisits > 0 ? ((totalPurchased / totalVisits) * 100).toFixed(1) : '0';

  const comparisonData = [
    { label: "총 방문자", current: totalVisits, previous: Math.round(totalVisits * 0.85), unit: "명" },
    { label: "평균 체류시간", current: 18, previous: 15, unit: "분" },
    { label: "전환율", current: parseFloat(conversionRate), previous: parseFloat(conversionRate) * 0.9, unit: "%" }
  ];

  const exportData = {
    filters,
    totalVisitors: totalVisits,
    avgDwellTime: 18,
    peakHours: "14:00-16:00",
    comparisonData
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
        <div className="space-y-6">

        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">방문객 유입 분석</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 방문 데이터: ${totalVisits}건` : '시간대별 방문자 패턴 및 트렌드 분석'}
              {analyzing && <span className="ml-2 text-primary">(AI 분석 중...)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="footfall-analysis" title="방문객 유입 분석" />
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              새로고침
            </Button>
          </div>
        </div>
        
        {selectedStore && (
          <>
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList>
                <TabsTrigger value="analysis">분석</TabsTrigger>
                <TabsTrigger value="digital-twin">디지털트윈 매장 프리뷰</TabsTrigger>
                <TabsTrigger value="comparison">비교 분석</TabsTrigger>
              </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <FootfallVisualizer visitsData={visitsData} />
            </div>
          </TabsContent>

          <TabsContent value="digital-twin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>디지털트윈 매장 프리뷰</CardTitle>
                <CardDescription>
                  3D 매장 모델에서 실시간 고객 데이터를 시각화합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 토글 컨트롤 */}
                <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                  <Button
                    variant={showRealtimeIoT ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRealtimeIoT(!showRealtimeIoT)}
                  >
                    {showRealtimeIoT ? "✓" : ""} 실시간 IoT
                  </Button>
                  <Button
                    variant={showAvatars ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAvatars(!showAvatars)}
                  >
                    {showAvatars ? "✓" : ""} 고객 아바타
                  </Button>
                  <Button
                    variant={showPaths ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPaths(!showPaths)}
                  >
                    {showPaths ? "✓" : ""} 동선
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <span>방문 데이터: {visitsData.length}건</span>
                  </div>
                </div>

                {/* 단일 3D 뷰 */}
                {selectedStore && (
                  <Store3DViewer 
                    key={`${selectedStore.id}-${refreshKey}`}
                    height="600px"
                    sceneRecipe={sceneRecipe}
                    overlay={
                      <>
                        {showRealtimeIoT && (
                          <RealtimeCustomerOverlay
                            storeId={selectedStore.id}
                            maxInstances={200}
                            showDebugInfo={false}
                          />
                        )}
                        {showAvatars && (
                          <CustomerAvatarOverlay
                            customers={generateCustomerAvatars(visitsData, 100)}
                            maxInstances={150}
                            animationSpeed={1.5}
                            showTrails={false}
                          />
                        )}
                        {showPaths && (
                          <CustomerPathOverlay
                            paths={generateCustomerPaths(visitsData)}
                            animate
                            color="#1B6BFF"
                          />
                        )}
                      </>
                    }
                  />
                )}

                {/* 범례 */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">범례</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {showAvatars && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1B6BFF' }} />
                          <span>탐색 중</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
                          <span>구매 중</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6B7280' }} />
                          <span>퇴장 중</span>
                        </div>
                      </>
                    )}
                    {showPaths && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5" style={{ backgroundColor: '#1B6BFF' }} />
                        <span>고객 동선</span>
                      </div>
                    )}
                  </div>
                </div>
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
          </>
        )}
      </div>
    </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default FootfallAnalysis;
