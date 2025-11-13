import { DashboardLayout } from "@/components/DashboardLayout";
import { InventoryOptimizer } from "@/features/profit-center/demand-inventory/components/InventoryOptimizer";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { AIAnalysisButton } from "@/components/analysis/AIAnalysisButton";
import { AnalysisHistory } from "@/components/analysis/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { Alert as AlertUI, AlertDescription } from "@/components/ui/alert";

const InventoryOptimizerPage = () => {
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 재고 통계 계산
  const totalProducts = storeData.products?.length || 0;
  const totalPurchases = storeData.purchases?.length || 0;
  const turnoverRate = totalProducts > 0 ? (totalPurchases / totalProducts).toFixed(1) : '0';

  const insights: Insight[] = [
    { type: "trend", title: "재고 회전 개선", description: `${selectedStore?.store_name || '매장'}의 재고 회전율이 지난달 대비 18% 향상되었습니다.`, impact: "high" },
    { type: "recommendation", title: "발주 필요", description: "상품 A, B, C의 재고가 부족합니다. 즉시 발주하세요.", impact: "high" },
    { type: "warning", title: "과다 재고", description: "상품 D의 재고가 과다합니다. 프로모션을 검토하세요.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "재고 회전율", current: parseFloat(turnoverRate), previous: parseFloat(turnoverRate) * 0.85, unit: "회" },
    { label: "평균 재고일", current: 12, previous: 15, unit: "일" },
    { label: "총 상품수", current: totalProducts, previous: Math.round(totalProducts * 0.95), unit: "개" }
  ];

  const exportData = {
    filters,
    inventoryMetrics: comparisonData,
    insights
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <AlertUI>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            매장을 선택하면 해당 매장의 재고 최적화 데이터를 확인할 수 있습니다.
          </AlertDescription>
        </AlertUI>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">재고 최적화</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore.store_name} - 실시간 재고 관리 및 발주 권장
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="inventory-optimizer" title="재고 최적화" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {totalProducts > 0 && (
          <AlertUI className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {selectedStore.store_name} 재고 데이터: {totalProducts}개 상품, 회전율 {turnoverRate}회
            </AlertDescription>
          </AlertUI>
        )}
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">최적화</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="inventory-optimizer"
              data={comparisonData}
              title="AI 재고 최적화 제안"
              onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
            />
            <div key={refreshKey}>
              <InventoryOptimizer />
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
            <AnalysisHistory analysisType="inventory-optimizer" refreshTrigger={historyRefresh} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertSettings
              alerts={alerts}
              onAlertsChange={setAlerts}
              availableMetrics={["재고 회전율", "재고일", "재고 정확도", "결품률"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InventoryOptimizerPage;
