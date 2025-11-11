import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutSimulator } from "@/features/profit-center/personalization/components/LayoutSimulator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { AIAnalysisButton } from "@/components/analysis/AIAnalysisButton";
import { AnalysisHistory } from "@/components/analysis/AnalysisHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LayoutSimulatorPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const insights: Insight[] = [
    { type: "trend", title: "레이아웃 효율성", description: "현재 레이아웃이 전월 대비 15% 더 효율적입니다.", impact: "high" },
    { type: "recommendation", title: "동선 최적화", description: "계산대를 중앙으로 이동하면 대기 시간이 감소합니다.", impact: "high" },
    { type: "warning", title: "공간 활용", description: "매장 후면 공간이 저활용되고 있습니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "고객 동선 효율", current: 92, previous: 85, unit: "%" },
    { label: "공간 활용률", current: 78, previous: 72, unit: "%" },
    { label: "평균 체류 시간", current: 25, previous: 22, unit: "분" }
  ];

  const exportData = {
    filters,
    layoutMetrics: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 레이아웃 시뮬레이터</h1>
            <p className="mt-2 text-muted-foreground">AI 기반 최적 배치 시뮬레이션</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="layout-simulator" title="레이아웃 시뮬레이터" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">시뮬레이션</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="layout-simulator"
              data={comparisonData}
              title="AI 레이아웃 시뮬레이션"
              onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
            />
            <div key={refreshKey}>
              <LayoutSimulator />
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
            <AnalysisHistory analysisType="layout-simulator" refreshTrigger={historyRefresh} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertSettings
              alerts={alerts}
              onAlertsChange={setAlerts}
              availableMetrics={["동선 효율", "공간 활용률", "체류 시간", "전환율"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LayoutSimulatorPage;
