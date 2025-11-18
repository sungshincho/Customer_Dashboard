import { DashboardLayout } from "@/components/DashboardLayout";
import { ProductPerformance } from "@/features/cost-center/automation/components/ProductPerformance";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { AIInsights, Insight } from "@/features/data-management/analysis/components/AIInsights";
import { AlertSettings, Alert as AlertType } from "@/features/data-management/analysis/components/AlertSettings";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { AIAnalysisButton } from "@/features/data-management/analysis/components/AIAnalysisButton";
import { AnalysisHistory } from "@/features/data-management/analysis/components/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOntologyEntities, useOntologyRelations, transformToGraphData } from "@/hooks/useOntologyData";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreDataset } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProductPerformancePage = () => {
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { selectedStore } = useSelectedStore();
  
  // 새로운 통합 Hook 사용
  const { data: storeData, isLoading: loading, refetch } = useStoreDataset();

  // 온톨로지 데이터: 상품, 구매, 재고
  const { data: productEntities = [] } = useOntologyEntities('product');
  const { data: purchaseEntities = [] } = useOntologyEntities('purchase');
  const { data: relations = [] } = useOntologyRelations();
  
  const graphData = useMemo(() => {
    const allEntities = [...productEntities, ...purchaseEntities];
    return transformToGraphData(allEntities, relations);
  }, [productEntities, purchaseEntities, relations]);

  const handleRefresh = () => {
    refetch();
  };

  // 상품 데이터 통계
  const totalProducts = storeData?.products?.length || 0;
  const totalPurchases = storeData?.purchases?.length || 0;
  const totalRevenue = storeData?.purchases?.reduce((sum: number, p: any) => 
    sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0) || 0;

  // 실제 데이터 기반 인사이트 생성
  const insights: Insight[] = [];
  
  if (storeData?.products && storeData?.purchases) {
    // 상품별 판매량 집계
    const productSales = new Map<string, number>();
    storeData.purchases.forEach((p: any) => {
      const productName = p.product_name || 'Unknown';
      productSales.set(productName, (productSales.get(productName) || 0) + (parseInt(p.quantity) || 1));
    });
    
    // 베스트셀러 찾기
    const sortedProducts = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedProducts.length > 0) {
      const topProduct = sortedProducts[0];
      insights.push({ 
        type: "trend", 
        title: "베스트셀러", 
        description: `${topProduct[0]}이(가) 총 ${topProduct[1]}개 판매되어 가장 높은 판매량을 기록했습니다.`, 
        impact: "high" 
      });
    }
    
    // 재고 부족 상품 찾기
    const lowStockProducts = storeData.products.filter((p: any) => 
      (parseInt(p.stock_quantity) || 0) < 10
    );
    if (lowStockProducts.length > 0) {
      insights.push({ 
        type: "recommendation", 
        title: "재고 부족 예상", 
        description: `${lowStockProducts.length}개 상품의 재고가 10개 미만입니다. 재발주를 고려하세요.`, 
        impact: "high" 
      });
    }
    
    // 저성과 상품 찾기
    if (sortedProducts.length > 0) {
      const lowPerformers = sortedProducts.slice(-3).filter(([_, sales]) => sales < 5);
      if (lowPerformers.length > 0) {
        insights.push({ 
          type: "warning", 
          title: "저성과 상품", 
          description: `일부 상품의 판매가 저조합니다. 프로모션이나 진열 위치 변경을 고려하세요.`, 
          impact: "medium" 
        });
      }
    }
  }

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
    <DataReadinessGuard>
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 상품 성과 데이터를 확인할 수 있습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {graphData.nodes.length > 0 && (
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  온톨로지 데이터: {productEntities.length}개 상품, {purchaseEntities.length}개 구매 기록 연동됨
                </AlertDescription>
              </Alert>
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
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      {selectedStore.store_name} 상품 데이터: {totalProducts}개 상품, {totalPurchases}건 구매 기록
                    </AlertDescription>
                  </Alert>
                )}
                
                <AIAnalysisButton
                  analysisType="product-performance"
                  data={{ totalProducts, totalPurchases, totalRevenue }}
                  title="AI 상품 성과 분석"
                  onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
                />
                <ProductPerformance 
                  productsData={storeData?.products}
                  purchasesData={storeData?.purchases}
                />
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
    </DataReadinessGuard>
  );
};

export default ProductPerformancePage;
