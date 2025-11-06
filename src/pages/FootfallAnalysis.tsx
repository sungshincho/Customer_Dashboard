import { DashboardLayout } from "@/components/DashboardLayout";
import { FootfallVisualizer } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/components/analysis/AdvancedFilters";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AIInsights, Insight } from "@/components/analysis/AIInsights";
import { AlertSettings, Alert } from "@/components/analysis/AlertSettings";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FootfallAnalysis = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const insights: Insight[] = [
    { type: "trend", title: "방문자 증가 추세", description: "지난주 대비 방문자가 15% 증가했습니다.", impact: "high" },
    { type: "recommendation", title: "피크 타임 대응", description: "오후 2-4시 사이 고객 밀집도가 높습니다. 직원 배치를 강화하세요.", impact: "medium" },
    { type: "warning", title: "저녁 시간대 감소", description: "저녁 7시 이후 방문자가 감소하고 있습니다.", impact: "low" }
  ];

  const comparisonData = [
    { label: "총 방문자", current: 1250, previous: 1100, unit: "명" },
    { label: "평균 체류시간", current: 18, previous: 15, unit: "분" },
    { label: "신규 방문자", current: 420, previous: 380, unit: "명" }
  ];

  const exportData = {
    filters,
    totalVisitors: 1250,
    avgDwellTime: 18,
    peakHours: "14:00-16:00",
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">방문객 유입 분석</h1>
            <p className="mt-2 text-muted-foreground">시간대별 방문자 패턴 및 트렌드 분석</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="footfall-analysis" title="방문객 유입 분석" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
        
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">분석</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <div key={refreshKey}>
              <FootfallVisualizer />
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
              availableMetrics={["총 방문자", "평균 체류시간", "신규 방문자", "재방문자"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FootfallAnalysis;
