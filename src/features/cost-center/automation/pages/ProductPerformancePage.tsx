import { DashboardLayout } from "@/components/DashboardLayout";
import { ProductPerformance } from "@/features/cost-center/automation/components/ProductPerformance";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from "lucide-react";
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
import { AlertCircle } from "lucide-react";

const ProductPerformancePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
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

  // 온톨로지 데이터: 상품, 구매, 재고
  const { data: productEntities = [] } = useOntologyEntities('product');
  const { data: purchaseEntities = [] } = useOntologyEntities('purchase');
  const { data: relations = [] } = useOntologyRelations();
  
  const graphData = useMemo(() => {
    const allEntities = [...productEntities, ...purchaseEntities];
    return transformToGraphData(allEntities, relations);
  }, [productEntities, purchaseEntities, relations]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 상품 데이터 통계
  const totalProducts = storeData.products?.length || 0;
  const totalPurchases = storeData.purchases?.length || 0;
  const totalRevenue = storeData.purchases?.reduce((sum: number, p: any) => 
    sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0) || 0;

  const insights: Insight[] = [
    { type: "trend", title: "베스트셀러 급상승", description: "상품 A의 판매량이 지난주 대비 45% 증가했습니다.", impact: "high" },
    { type: "recommendation", title: "재고 부족 예상", description: "인기 상품 B의 재고가 3일 내 소진될 예정입니다.", impact: "high" },
    { type: "warning", title: "저성과 상품", description: "상품 C의 판매가 감소하고 있습니다. 프로모션을 고려하세요.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "총 판매량", current: totalPurchases, previous: Math.round(totalPurchases * 0.87), unit: "개" },
    { label: "평균 객단가", current: totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0, previous: totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases * 0.93) : 0, unit: "원" },
    { label: "총 상품수", current: totalProducts, previous: Math.round(totalProducts * 0.95), unit: "개" }
  ];

  const exportData = {
    filters,
    productMetrics: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">상품 성과 분석</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 판매량, 매출, 재고 통합 관리` : '매장을 선택해주세요'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="product-performance" title="상품 성과 분석" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {!selectedStore ? (
          <AlertUI>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 상품 성과 데이터를 확인할 수 있습니다.
            </AlertDescription>
          </AlertUI>
        ) : (
          <>
            {graphData.nodes.length > 0 && (
              <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  온톨로지 데이터: {productEntities.length}개 상품, {purchaseEntities.length}개 구매 기록 연동됨
                </AlertDescription>
              </AlertUI>
            )}
            
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList>
                <TabsTrigger value="analysis">성과 분석</TabsTrigger>
                <TabsTrigger value="comparison">비교</TabsTrigger>
                <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
                <TabsTrigger value="history">히스토리</TabsTrigger>
                <TabsTrigger value="alerts">알림 설정</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-6">
                {totalProducts > 0 && (
                  <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      {selectedStore.store_name} 상품 데이터: {totalProducts}개 상품, {totalPurchases}건 구매 기록
                    </AlertDescription>
                  </AlertUI>
                )}
                
                <AIAnalysisButton
                  analysisType="product-performance"
                  data={{ totalProducts, totalPurchases, totalRevenue }}
                  title="AI 상품 성과 분석"
                  onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
                />
                <div key={refreshKey}>
                  <ProductPerformance 
                    productsData={storeData.products}
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
                <AnalysisHistory analysisType="product-performance" refreshTrigger={historyRefresh} />
              </TabsContent>
              
              <TabsContent value="alerts">
                <AlertSettings
                  alerts={alerts}
                  onAlertsChange={setAlerts}
                  availableMetrics={["판매량", "매출", "재고 수준", "회전율"]}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductPerformancePage;
