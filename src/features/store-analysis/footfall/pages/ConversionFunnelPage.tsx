import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversionFunnel } from "@/features/store-analysis/footfall/components/ConversionFunnel";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Store, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store3DViewer } from "@/features/digital-twin/components";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ConversionFunnelPage = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 매장별 방문 및 구매 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      Promise.all([
        loadStoreFile(user.id, selectedStore.id, 'visits.csv'),
        loadStoreFile(user.id, selectedStore.id, 'purchases.csv')
      ])
        .then(([visits, purchases]) => {
          console.log(`${selectedStore.store_name} 전환 퍼널 데이터:`, visits.length, '방문,', purchases.length, '구매');
          setVisitsData(visits);
          setPurchasesData(purchases);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load funnel data:', error);
          setVisitsData([]);
          setPurchasesData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalVisits = visitsData.length;
  const totalPurchases = purchasesData.length;
  const conversionRate = totalVisits > 0 ? ((totalPurchases / totalVisits) * 100).toFixed(1) : '0';

  const comparisonData = [
    { label: "전환율", current: parseFloat(conversionRate), previous: parseFloat(conversionRate) * 0.9, unit: "%" },
    { label: "장바구니 추가", current: 65, previous: 58, unit: "%" },
    { label: "구매 완료", current: totalPurchases, previous: Math.round(totalPurchases * 0.9), unit: "건" }
  ];

  const exportData = {
    filters,
    conversionMetrics: comparisonData,
    totalVisits,
    totalPurchases,
    conversionRate
  };

  return (
    <DashboardLayout>
      <DataReadinessGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold gradient-text">전환 퍼널</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedStore ? `${selectedStore.store_name} - 방문: ${totalVisits}건, 구매: ${totalPurchases}건, 전환율: ${conversionRate}%` : '방문부터 구매까지의 고객 여정 분석'}
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
          
          <Tabs defaultValue="3d" className="w-full">
            <TabsList>
              <TabsTrigger value="3d">
                <Box className="w-4 h-4 mr-2" />
                3D 매장
              </TabsTrigger>
              <TabsTrigger value="analysis">퍼널 분석</TabsTrigger>
              <TabsTrigger value="comparison">비교 분석</TabsTrigger>
            </TabsList>
            
            <TabsContent value="3d" className="space-y-6">
              <Store3DViewer height="600px" />
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-6">
              <div key={refreshKey}>
                <ConversionFunnel visitsData={visitsData} purchasesData={purchasesData} />
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
        </div>
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default ConversionFunnelPage;
