import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap } from "@/components/features";
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

const TrafficHeatmapPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const insights: Insight[] = [
    { type: "trend", title: "핫스팟 이동", description: "고객 밀집 지역이 매장 중앙으로 이동하고 있습니다.", impact: "medium" },
    { type: "recommendation", title: "직원 재배치", description: "혼잡 구역에 추가 직원을 배치하면 고객 만족도가 향상됩니다.", impact: "high" },
    { type: "warning", title: "저활용 구역", description: "매장 후면이 저활용되고 있습니다. 프로모션 배치를 고려하세요.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "피크 밀집도", current: 85, previous: 78, unit: "%" },
    { label: "평균 밀집도", current: 45, previous: 42, unit: "%" },
    { label: "핫스팟 개수", current: 3, previous: 2, unit: "개" }
  ];

  const exportData = {
    filters,
    heatmapMetrics: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 동선 히트맵</h1>
            <p className="mt-2 text-muted-foreground">실시간 방문자 밀집도 및 동선 분석</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="traffic-heatmap" title="매장 동선 히트맵" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">히트맵</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="traffic-heatmap"
              data={comparisonData}
              title="AI 레이아웃 최적화 제안"
              onAnalysisComplete={() => setHistoryRefresh(prev => prev + 1)}
            />
            <div key={refreshKey}>
              <TrafficHeatmap />
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
            <AnalysisHistory analysisType="traffic-heatmap" refreshTrigger={historyRefresh} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertSettings
              alerts={alerts}
              onAlertsChange={setAlerts}
              availableMetrics={["피크 밀집도", "평균 밀집도", "핫스팟 개수", "고객 체류 시간"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TrafficHeatmapPage;
