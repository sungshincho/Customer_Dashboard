import { DashboardLayout } from "@/components/DashboardLayout";
import { StaffEfficiency } from "@/features/cost-center/automation/components/StaffEfficiency";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Box } from "lucide-react";
import { Store3DViewer } from "@/features/digital-twin/components";
import { useState, useEffect } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { AIInsights, Insight } from "@/features/data-management/analysis/components/AIInsights";
import { AlertSettings, Alert as AlertType } from "@/features/data-management/analysis/components/AlertSettings";
import { ComparisonView } from "@/features/data-management/analysis/components/ComparisonView";
import { AIAnalysisButton } from "@/features/data-management/analysis/components/AIAnalysisButton";
import { AnalysisHistory } from "@/features/data-management/analysis/components/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const StaffEfficiencyPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 직원 통계 계산
  const totalStaff = storeData.staff?.length || 0;
  const totalPurchases = storeData.purchases?.length || 0;
  const avgPerformance = totalStaff > 0 && storeData.staff
    ? (storeData.staff.reduce((sum: number, s: any) => sum + (parseFloat(s.performance_score) || 0), 0) / totalStaff)
    : 0;

  const insights: Insight[] = [
    { type: "trend", title: "생산성 향상", description: "직원 평균 생산성이 12% 증가했습니다.", impact: "high" },
    { type: "recommendation", title: "교대 근무 조정", description: "피크 타임에 인력을 25% 더 배치하세요.", impact: "high" },
    { type: "warning", title: "휴게 시간 부족", description: "일부 직원의 휴게 시간이 부족합니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "총 직원수", current: totalStaff, previous: Math.round(totalStaff * 0.95), unit: "명" },
    { label: "평균 성과점수", current: avgPerformance, previous: avgPerformance * 0.92, unit: "점" },
    { label: "처리 건수", current: totalPurchases, previous: Math.round(totalPurchases * 0.88), unit: "건" }
  ];

  const exportData = {
    filters,
    staffMetrics: comparisonData,
    insights
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
        <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">직원 효율성 분석</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 실시간 성과 및 근무 최적화` : '매장을 선택해주세요'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="staff-efficiency" title="직원 효율성 분석" />
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
              매장을 선택하면 해당 매장의 직원 효율성 데이터를 확인할 수 있습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList>
                <TabsTrigger value="analysis">효율성</TabsTrigger>
                <TabsTrigger value="comparison">비교</TabsTrigger>
                <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
                <TabsTrigger value="history">히스토리</TabsTrigger>
                <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="space-y-6">
            <Store3DViewer height="600px" />
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6">
                {totalStaff > 0 && (
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      {selectedStore.store_name} 직원 데이터: {totalStaff}명, 평균 성과 {Math.round(avgPerformance)}%
                    </AlertDescription>
                  </Alert>
                )}
                
                <AIAnalysisButton
                  analysisType="staff-efficiency"
                  data={{ totalStaff, totalPurchases, avgPerformance }}
                  title="AI 직원 효율성 분석"
                  onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
                />
                <div key={refreshKey}>
                  <StaffEfficiency 
                    staffData={storeData.staff}
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
                <AnalysisHistory analysisType="staff-efficiency" refreshTrigger={historyRefresh} />
              </TabsContent>
              
              <TabsContent value="alerts">
                <AlertSettings
                  alerts={alerts}
                  onAlertsChange={setAlerts}
                  availableMetrics={["생산성", "고객 응대율", "업무 효율성", "근무 시간"]}
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

export default StaffEfficiencyPage;
