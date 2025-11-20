import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { Map, Filter, UserCheck } from "lucide-react";
import CustomerJourneyPage from "@/features/store-analysis/footfall/pages/CustomerJourneyPage";
import ConversionFunnelPage from "@/features/store-analysis/footfall/pages/ConversionFunnelPage";
import CustomerAnalysisPage from "@/features/store-analysis/customer/pages/CustomerAnalysisPage";

export default function CustomerAnalysisIntegratedPage() {
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
          <h1 className="text-3xl font-bold gradient-text">고객 분석</h1>
          <p className="text-muted-foreground mt-2">
            고객 여정, 전환 퍼널, 세그먼트를 분석하세요
          </p>
        </div>

        <Tabs defaultValue="journey" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="journey" className="gap-2">
              <Map className="w-4 h-4" />
              고객 여정
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2">
              <Filter className="w-4 h-4" />
              전환 퍼널
            </TabsTrigger>
            <TabsTrigger value="segments" className="gap-2">
              <UserCheck className="w-4 h-4" />
              고객 세그먼트
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="journey" className="mt-6">
            <div className="contents"><CustomerJourneyPage /></div>
          </TabsContent>
          
          <TabsContent value="funnel" className="mt-6">
            <div className="contents"><ConversionFunnelPage /></div>
          </TabsContent>
          
          <TabsContent value="segments" className="mt-6">
            <div className="contents"><CustomerAnalysisPage /></div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
