import { DashboardLayout } from "@/components/DashboardLayout";
import { DemandForecast } from "@/features/profit-center/demand-inventory/components/DemandForecast";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { AIAnalysisButton } from "@/components/analysis/AIAnalysisButton";
import { AnalysisHistory } from "@/components/analysis/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOntologyEntities, useOntologyRelations, transformToGraphData } from "@/hooks/useOntologyData";
import { Alert as AlertUI, AlertDescription } from "@/components/ui/alert";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";

const DemandForecastPage = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [storeData, setStoreData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 매장 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreDataset(user.id, selectedStore.id)
        .then(data => {
          setStoreData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load store data:', error);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  // 온톨로지 데이터 로드
  const { data: visitEntities = [], isLoading: visitsLoading } = useOntologyEntities('visit');
  const { data: storeEntities = [] } = useOntologyEntities('store');
  const { data: relations = [] } = useOntologyRelations();
  
  // 그래프 데이터 변환
  const graphData = useMemo(() => {
    const allEntities = [...visitEntities, ...storeEntities];
    return transformToGraphData(allEntities, relations);
  }, [visitEntities, storeEntities, relations]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 매장 데이터 기반 통계
  const totalVisits = storeData.visits?.length || 0;
  const totalPurchases = storeData.purchases?.length || 0;
  const conversionRate = totalVisits > 0 ? Math.round((totalPurchases / totalVisits) * 100) : 0;
  const totalRevenue = storeData.purchases?.reduce((sum: number, p: any) => 
    sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0) || 0;

  const insights: Insight[] = [
    { type: "trend", title: "수요 증가 예측", description: `${selectedStore?.store_name || '매장'}의 다음 주 매출이 20% 증가할 것으로 예상됩니다.`, impact: "high" },
    { type: "recommendation", title: "재고 확보 필요", description: "인기 상품의 재고를 30% 추가 확보하세요.", impact: "high" },
    { type: "warning", title: "날씨 영향", description: "우천 예보로 방문자가 감소할 수 있습니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "예상 매출", current: Math.round(totalRevenue * 1.15), previous: totalRevenue, unit: "원" },
    { label: "예상 방문자", current: Math.round(totalVisits * 1.12), previous: totalVisits, unit: "명" },
    { label: "전환율", current: conversionRate, previous: Math.max(0, conversionRate - 3), unit: "%" }
  ];

  const exportData = {
    filters,
    forecast: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <DataReadinessGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold gradient-text">수요 예측</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedStore?.store_name} - AI 기반 방문자 및 매출 예측 분석
              </p>
            </div>
            <div className="flex gap-2">
              <ExportButton data={exportData} filename="demand-forecast" title="수요 예측" />
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
          </div>

          {totalVisits > 0 && (
            <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                {selectedStore?.store_name} 데이터: {totalVisits}건 방문, {totalPurchases}건 구매, 전환율 {conversionRate}%
              </AlertDescription>
            </AlertUI>
          )}
          
          {graphData.nodes.length > 0 && (
            <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <Database className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                온톨로지 데이터 연동됨: {graphData.nodes.length}개 엔티티, {graphData.edges.length}개 관계
              </AlertDescription>
            </AlertUI>
          )}
          
          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
          
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList>
              <TabsTrigger value="analysis">예측</TabsTrigger>
              <TabsTrigger value="comparison">비교</TabsTrigger>
              <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
              <TabsTrigger value="history">히스토리</TabsTrigger>
              <TabsTrigger value="alerts">알림 설정</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-6">
              <AIAnalysisButton
                analysisType="demand-forecast"
                data={comparisonData}
                title="AI 수요 시뮬레이션 (온톨로지 기반)"
                onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
                graphData={graphData}
              />
              <div key={refreshKey}>
                <DemandForecast 
                  visitsData={storeData.visits}
                  purchasesData={storeData.purchases}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="comparison">
              <ComparisonView
                data={comparisonData}
                comparisonType={comparisonType}
                onComparisonTypeChange={setComparisonType}
              />
            </TabsContent>
            
            <TabsContent value="insights">
              <AIInsights insights={insights} />
            </TabsContent>

            <TabsContent value="history">
              <AnalysisHistory analysisType="demand-forecast" refreshTrigger={historyRefresh} />
            </TabsContent>
            
            <TabsContent value="alerts">
              <AlertSettings
                alerts={alerts}
                onAlertsChange={setAlerts}
                availableMetrics={["예상 매출", "예상 방문자", "전환율", "평균 객단가"]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default DemandForecastPage;
