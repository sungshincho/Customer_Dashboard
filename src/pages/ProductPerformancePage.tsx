import { DashboardLayout } from "@/components/DashboardLayout";
import { ProductPerformance } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const ProductPerformancePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">상품 성과 분석</h1>
            <p className="mt-2 text-muted-foreground">판매량, 매출, 재고 통합 관리</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        <div key={refreshKey}>
          <ProductPerformance />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductPerformancePage;
