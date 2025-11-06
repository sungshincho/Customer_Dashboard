import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversionFunnel } from "@/components/features";
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

const ConversionFunnelPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comparisonType, setComparisonType] = useState<"period" | "store">("period");

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const insights: Insight[] = [
    { type: "trend", title: "전환율 개선", description: "전환율이 지난달 대비 3% 상승했습니다.", impact: "high" },
    { type: "recommendation", title: "장바구니 이탈 감소", description: "결제 프로세스를 간소화하면 전환율이 더 증가할 수 있습니다.", impact: "high" },
    { type: "warning", title: "상품 페이지 이탈", description: "상품 상세 페이지에서 이탈률이 높습니다.", impact: "medium" }
  ];

  const comparisonData = [
    { label: "전환율", current: 24.5, previous: 21.8, unit: "%" },
    { label: "장바구니 추가", current: 65, previous: 58, unit: "%" },
    { label: "구매 완료", current: 38, previous: 35, unit: "%" }
  ];

  const exportData = {
    filters,
    conversionMetrics: comparisonData,
    insights
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">전환 퍼널</h1>
            <p className="mt-2 text-muted-foreground">방문부터 구매까지의 고객 여정 분석</p>
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
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">퍼널 분석</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysisButton
              analysisType="conversion-funnel"
              data={comparisonData}
              title="AI 전환율 최적화 제안"
            />
            <div key={refreshKey}>
              <ConversionFunnel />
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
              availableMetrics={["전환율", "장바구니 추가율", "구매 완료율", "평균 객단가"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ConversionFunnelPage;
