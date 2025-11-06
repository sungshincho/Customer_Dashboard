import { DashboardLayout } from "@/components/DashboardLayout";
import { DemandForecast } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { AIAnalysisButton } from "@/components/analysis/AIAnalysisButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DemandForecastPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const insights: Insight[] = [
    { type: "trend", title: "수요 증가 예측", description: "다음 주 매출이 20% 증가할 것으로 예상됩니다.", impact: "high" },
    { type: "recommendation", title: "재고 확보 필요", description: "인기 상품의 재고를 30% 추가 확보하세요.", impact: "high" },
    { type: "warning", title: "날씨 영향", description: "우천 예보로 방문자가 감소할 수 있습니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "예상 매출", current: 15000000, previous: 12500000, unit: "원" },
    { label: "예상 방문자", current: 2800, previous: 2300, unit: "명" },
    { label: "전환율", current: 28, previous: 25, unit: "%" }
  ];

  const exportData = {
    filters,
    forecast: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">수요 예측</h1>
            <p className="mt-2 text-muted-foreground">AI 기반 방문자 및 매출 예측 분석</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="demand-forecast" title="수요 예측" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">예측</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="demand-forecast"
              data={comparisonData}
              title="AI 수요 시뮬레이션"
            />
            <div key={refreshKey}>
              <DemandForecast />
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
          
          <TabsContent value="alerts">
            <AlertSettings
              alerts={alerts}
              onAlertsChange={setAlerts}
              availableMetrics={["예상 매출", "예상 방문자", "전환율", "평균 객단가"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DemandForecastPage;
