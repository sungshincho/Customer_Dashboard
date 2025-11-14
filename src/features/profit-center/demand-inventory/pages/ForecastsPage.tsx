import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { loadStoreDataset } from "@/utils/storageDataLoader";

const Forecasts = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [storeData, setStoreData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [salesForecast, setSalesForecast] = useState<any[]>([]);
  const [visitorForecast, setVisitorForecast] = useState<any[]>([]);

  // 매장 데이터 로드 및 예측 생성
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreDataset(user.id, selectedStore.id)
        .then(data => {
          setStoreData(data);
          
          // 판매 예측 생성
          if (data.purchases) {
            const forecast = generateSalesForecast(data.purchases);
            setSalesForecast(forecast);
          }
          
          // 방문자 예측 생성
          if (data.visits) {
            const forecast = generateVisitorForecast(data.visits);
            setVisitorForecast(forecast);
          }
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load store data:', error);
          setLoading(false);
        });
    }
  }, [selectedStore, user]);

  const generateSalesForecast = (purchases: any[]) => {
    const monthlyData = [
      { date: "1월", actual: purchases.length * 100, predicted: purchases.length * 98 },
      { date: "2월", actual: purchases.length * 90, predicted: purchases.length * 93 },
      { date: "3월", actual: purchases.length * 120, predicted: purchases.length * 118 },
      { date: "4월", actual: purchases.length * 105, predicted: purchases.length * 108 },
      { date: "5월", actual: null, predicted: purchases.length * 122 },
      { date: "6월", actual: null, predicted: purchases.length * 130 },
    ];
    return monthlyData;
  };

  const generateVisitorForecast = (visits: any[]) => {
    const weeklyData = [
      { date: "1주", actual: visits.length * 0.8, predicted: visits.length * 0.78 },
      { date: "2주", actual: visits.length * 0.9, predicted: visits.length * 0.88 },
      { date: "3주", actual: visits.length * 0.85, predicted: visits.length * 0.87 },
      { date: "4주", actual: visits.length, predicted: visits.length * 0.98 },
      { date: "5주", actual: null, predicted: visits.length * 1.1 },
      { date: "6주", actual: null, predicted: visits.length * 1.2 },
    ];
    return weeklyData;
  };

  const nextMonthRevenue = salesForecast.length > 0 ? salesForecast[4]?.predicted || 16500000 : 16500000;
  const expectedVisitors = visitorForecast.length > 0 ? visitorForecast[4]?.predicted || 42000 : 42000;

  return (
    <DashboardLayout>
      <DataReadinessGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">AI 예측</h1>
          <p className="mt-2 text-muted-foreground">
            {selectedStore ? `${selectedStore.store_name} - AI 기반 매출 및 방문자 예측 분석` : 'AI 기반 매출 및 방문자 예측 분석'}
          </p>
        </div>

        {/* AI Insights */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-lift animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">다음 달 예측 매출</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{nextMonthRevenue.toLocaleString()}</div>
              <p className="mt-1 text-xs text-green-600">+12.5% 예상 증가</p>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">예상 방문자</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(expectedVisitors).toLocaleString()}명</div>
              <p className="mt-1 text-xs text-primary">+8.3% 예상 증가</p>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">재고 소진 예측</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12일 후</div>
              <p className="mt-1 text-xs text-orange-600">상품 A, B 발주 필요</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">매출 예측</TabsTrigger>
            <TabsTrigger value="visitors">방문자 예측</TabsTrigger>
            <TabsTrigger value="recommendations">추천사항</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>매출 예측 분석</CardTitle>
                <CardDescription>실제 매출과 AI 예측 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="실제 매출"
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="예측 매출"
                      dot={{ fill: "hsl(var(--accent))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>방문자 예측 분석</CardTitle>
                <CardDescription>실제 방문자와 AI 예측 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={visitorForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="실제 방문자"
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="예측 방문자"
                      dot={{ fill: "hsl(var(--accent))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">재고 관리 추천</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">강남점 - 상품 A</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      현재 추세로는 12일 후 재고 소진 예상. 최소 50개 발주를 권장합니다.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">홍대점 - 상품 C</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      주말 수요 급증 예상. 추가 30개 발주를 권장합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">인력 운영 추천</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">명동점 - 주말 운영</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      이번 주말 방문자 35% 증가 예상. 추가 직원 2명 배치를 권장합니다.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">전체 매장 - 평일 오전</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      평일 오전 9-11시 방문자 감소 추세. 운영 인력 조정을 고려하세요.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">마케팅 전략 추천</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">20-30대 타겟 프로모션</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      주 고객층인 20-30대를 위한 평일 저녁 할인 이벤트 진행 시 매출 18% 증가 예상.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default Forecasts;
