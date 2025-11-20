import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { TrendingUp, Package } from "lucide-react";
import ProductPerformancePage from "@/features/cost-center/automation/pages/ProductPerformancePage";
import InventoryPage from "@/features/store-analysis/inventory/pages/InventoryPage";

export default function ProductAnalysisPage() {
  const { selectedStore } = useSelectedStore();

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>매장을 선택해주세요</CardTitle>
              <CardDescription>
                분석을 시작하려면 상단에서 매장을 먼저 선택해주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">상품 분석</h1>
          <p className="text-muted-foreground mt-2">
            상품 성과와 재고 현황을 분석하세요
          </p>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              상품 성과
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              재고 현황
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="mt-6">
            <div className="contents"><ProductPerformancePage /></div>
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-6">
            <div className="contents"><InventoryPage /></div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
