import { DashboardLayout } from "@/components/DashboardLayout";
import { FootfallVisualizer } from "@/features/store-analysis/footfall/components/FootfallVisualizer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreScene } from "@/hooks/useStoreScene";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SceneViewer } from "@/features/digital-twin/components/SceneViewer";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { useAuth } from "@/hooks/useAuth";

const FootfallAnalysis = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { sceneRecipe, loading: sceneLoading, generateScene } = useStoreScene();
  const { latestAnalysis, analyzing } = useAutoAnalysis('visitor', true);

  // 매장별 방문 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreFile(user.id, selectedStore.id, 'visits.csv')
        .then(data => {
          console.log(`${selectedStore.store_name} 방문 데이터 로드됨:`, data.length, '건');
          setVisitsData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load visits data:', error);
          setVisitsData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
    <DashboardLayout>
      <div className="space-y-6">
        {!selectedStore && (
          <Alert>
            <Store className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 방문객 분석 데이터를 확인할 수 있습니다. 
              사이드바에서 매장을 선택하거나 <a href="/stores" className="underline font-medium">매장 관리</a>에서 매장을 등록하세요.
            </AlertDescription>
          </Alert>
        )}

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
            
            <Tabs defaultValue="3d" className="w-full">
              <TabsList>
                <TabsTrigger value="3d">3D 방문자 뷰</TabsTrigger>
                <TabsTrigger value="analysis">분석</TabsTrigger>
                <TabsTrigger value="comparison">비교 분석</TabsTrigger>
              </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3D 방문자 현황</CardTitle>
                <CardDescription>
                  실시간 방문자 위치를 3D 디지털 트윈에서 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!sceneRecipe ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      3D 매장을 생성하여 방문자 현황을 시각화하세요
                    </p>
                    <Button onClick={generateScene} disabled={sceneLoading}>
                      {sceneLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        "3D 매장 생성"
                      )}
                    </Button>
                  </div>
                ) : (
                  <SceneViewer
                    recipe={sceneRecipe}
                    overlay="visitor"
                    overlayData={latestAnalysis?.sceneData}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <FootfallVisualizer visitsData={visitsData} />
            </div>
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
  );
};

export default FootfallAnalysis;
