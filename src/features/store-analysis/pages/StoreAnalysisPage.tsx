import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { Activity, Users, Package, TrendingUp } from "lucide-react";

// 방문자 & 동선 컴포넌트
import FootfallAnalysisPage from "@/features/store-analysis/footfall/pages/FootfallAnalysisPage";
import TrafficHeatmapPage from "@/features/store-analysis/footfall/pages/TrafficHeatmapPage";

// 고객 여정 & 퍼널 컴포넌트
import CustomerJourneyPage from "@/features/store-analysis/footfall/pages/CustomerJourneyPage";
import ConversionFunnelPage from "@/features/store-analysis/footfall/pages/ConversionFunnelPage";
import CustomerAnalysisPage from "@/features/store-analysis/customer/pages/CustomerAnalysisPage";

// 상품 & 재고 컴포넌트
import ProductPerformancePage from "@/features/cost-center/automation/pages/ProductPerformancePage";
import InventoryPage from "@/features/store-analysis/inventory/pages/InventoryPage";

export default function StoreAnalysisPage() {
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
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">매장 현황 분석</h1>
          <p className="text-muted-foreground mt-2">
            방문자, 고객 여정, 상품 성과를 한 곳에서 분석하세요
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="footfall" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="footfall" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">방문자 & 동선</span>
              <span className="sm:hidden">방문자</span>
            </TabsTrigger>
            <TabsTrigger value="journey" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">고객 여정 & 퍼널</span>
              <span className="sm:hidden">고객</span>
            </TabsTrigger>
            <TabsTrigger value="product" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">상품 & 재고</span>
              <span className="sm:hidden">상품</span>
            </TabsTrigger>
          </TabsList>

          {/* 탭 1: 방문자 & 동선 */}
          <TabsContent value="footfall" className="space-y-6">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList>
                <TabsTrigger value="analysis">방문자 분석</TabsTrigger>
                <TabsTrigger value="heatmap">동선 히트맵</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="mt-6">
                <FootfallAnalysisPageContent />
              </TabsContent>
              
              <TabsContent value="heatmap" className="mt-6">
                <TrafficHeatmapPageContent />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 탭 2: 고객 여정 & 퍼널 */}
          <TabsContent value="journey" className="space-y-6">
            <Tabs defaultValue="journey" className="w-full">
              <TabsList>
                <TabsTrigger value="journey">고객 여정</TabsTrigger>
                <TabsTrigger value="funnel">전환 퍼널</TabsTrigger>
                <TabsTrigger value="analysis">고객 분석</TabsTrigger>
              </TabsList>
              
              <TabsContent value="journey" className="mt-6">
                <CustomerJourneyPageContent />
              </TabsContent>
              
              <TabsContent value="funnel" className="mt-6">
                <ConversionFunnelPageContent />
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-6">
                <CustomerAnalysisPageContent />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 탭 3: 상품 & 재고 */}
          <TabsContent value="product" className="space-y-6">
            <Tabs defaultValue="performance" className="w-full">
              <TabsList>
                <TabsTrigger value="performance">상품 성과</TabsTrigger>
                <TabsTrigger value="inventory">재고 현황</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="mt-6">
                <ProductPerformancePageContent />
              </TabsContent>
              
              <TabsContent value="inventory" className="mt-6">
                <InventoryPageContent />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// 래퍼 컴포넌트들 - DashboardLayout 제거
function FootfallAnalysisPageContent() {
  return <div className="contents"><FootfallAnalysisPage /></div>;
}

function TrafficHeatmapPageContent() {
  return <div className="contents"><TrafficHeatmapPage /></div>;
}

function CustomerJourneyPageContent() {
  return <div className="contents"><CustomerJourneyPage /></div>;
}

function ConversionFunnelPageContent() {
  return <div className="contents"><ConversionFunnelPage /></div>;
}

function CustomerAnalysisPageContent() {
  return <div className="contents"><CustomerAnalysisPage /></div>;
}

function ProductPerformancePageContent() {
  return <div className="contents"><ProductPerformancePage /></div>;
}

function InventoryPageContent() {
  return <div className="contents"><InventoryPage /></div>;
}
