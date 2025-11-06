import { DashboardLayout } from "@/components/DashboardLayout";
import { InventoryOptimizer } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const InventoryOptimizerPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">재고 최적화</h1>
            <p className="mt-2 text-muted-foreground">실시간 재고 관리 및 발주 권장</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        <div key={refreshKey}>
          <InventoryOptimizer />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryOptimizerPage;
