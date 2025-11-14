import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerJourney } from "@/features/store-analysis/footfall/components/CustomerJourney";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store3DViewer } from "@/features/digital-twin/components";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

const CustomerJourneyPage = () => {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
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
          console.log(`${selectedStore.store_name} 고객 여정 데이터:`, visits.length, '방문,', purchases.length, '구매');
          setVisitsData(visits);
          setPurchasesData(purchases);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load journey data:', error);
          setVisitsData([]);
          setPurchasesData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const comparisonData = [
    { label: "평균 동선 길이", current: 85, previous: 78, unit: "m" },
    { label: "방문 구역 수", current: 5.2, previous: 4.8, unit: "개" },
    { label: "체류 시간", current: 22, previous: 20, unit: "분" }
  ];

  const exportData = {
    filters,
    journeyMetrics: comparisonData
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!selectedStore && (
          <Alert>
            <Store className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 고객 여정 데이터를 확인할 수 있습니다. 
              사이드바에서 매장을 선택하거나 <a href="/stores" className="underline font-medium">매장 관리</a>에서 매장을 등록하세요.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 여정 맵</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 방문 데이터: ${visitsData.length}건` : '평균 구매 고객의 매장 체류 패턴'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="customer-journey" title="고객 여정 맵" />
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
              3D 여정
            </TabsTrigger>
            <TabsTrigger value="analysis">여정 분석</TabsTrigger>
            <TabsTrigger value="comparison">비교 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Store3DViewer height="600px" />
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <CustomerJourney visitsData={visitsData} purchasesData={purchasesData} />
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
    </DashboardLayout>
  );
};

export default CustomerJourneyPage;
