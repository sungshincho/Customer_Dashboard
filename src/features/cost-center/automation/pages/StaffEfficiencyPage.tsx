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
import { useStoreDataset } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStoreScene } from "@/hooks/useStoreScene";

const StaffEfficiencyPage = () => {
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const { selectedStore } = useSelectedStore();
  const { activeScene } = useStoreScene();
  
  // 새로운 통합 Hook 사용
  const { data: storeData, isLoading: loading, refetch } = useStoreDataset();

  const handleRefresh = () => {
    refetch();
  };

  // 직원 통계 계산
  const totalStaff = storeData?.staff?.length || 0;
  const totalPurchases = storeData?.purchases?.length || 0;
  const avgPerformance = totalStaff > 0 && storeData?.staff
    ? (storeData.staff.reduce((sum: number, s: any) => sum + (parseFloat(s.performance_score) || 0), 0) / totalStaff)
    : 0;

  // 실제 데이터 기반 인사이트 생성
  const insights: Insight[] = [];
  
  if (storeData?.staff && storeData?.purchases) {
    // 평균 성과 계산
    if (avgPerformance > 70) {
      insights.push({ 
        type: "trend", 
        title: "높은 생산성", 
        description: `직원 평균 성과점수가 ${avgPerformance.toFixed(1)}점으로 양호합니다.`, 
        impact: "high" 
      });
    } else if (avgPerformance < 50) {
      insights.push({ 
        type: "warning", 
        title: "생산성 저하", 
        description: `직원 평균 성과점수가 ${avgPerformance.toFixed(1)}점으로 낮습니다. 개선이 필요합니다.`, 
        impact: "high" 
      });
    }
    
    // 직원당 처리 건수 계산
    const avgPurchasesPerStaff = totalStaff > 0 ? Math.round(totalPurchases / totalStaff) : 0;
    if (avgPurchasesPerStaff > 20) {
      insights.push({ 
        type: "recommendation", 
        title: "높은 업무량", 
        description: `직원당 평균 ${avgPurchasesPerStaff}건을 처리하고 있습니다. 추가 인력 배치를 고려하세요.`, 
        impact: "high" 
      });
    }
    
    // 성과가 낮은 직원 확인
    const lowPerformers = storeData.staff.filter((s: any) => 
      (parseFloat(s.performance_score) || 0) < 50
    );
    if (lowPerformers.length > 0) {
      insights.push({ 
        type: "warning", 
        title: "교육 필요", 
        description: `${lowPerformers.length}명의 직원이 낮은 성과를 보이고 있습니다. 교육 및 지원이 필요합니다.`, 
        impact: "medium" 
      });
    }
  }

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
            <Store3DViewer height="600px" sceneRecipe={activeScene?.recipe_data} />
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
                <StaffEfficiency 
                  staffData={storeData?.staff}
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
