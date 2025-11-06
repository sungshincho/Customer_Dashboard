import { DashboardLayout } from "@/components/DashboardLayout";
import { DemandForecast } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const DemandForecastPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">수요 예측</h1>
            <p className="mt-2 text-muted-foreground">AI 기반 방문자 및 매출 예측 분석</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        <div key={refreshKey}>
          <DemandForecast />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DemandForecastPage;
