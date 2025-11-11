import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, AlertTriangle, DollarSign, Package } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 통합 데이터 - 수요 예측과 재고를 연결
const integratedData = [
  {
    product: "프리미엄 운동화",
    currentStock: 45,
    optimalStock: 120,
    predictedDemand: 150,
    weeklyDemand: 35,
    leadTime: 7,
    stockoutRisk: "high",
    revenueImpact: -5250000,
    recommendedOrder: 105,
    urgency: "긴급"
  },
  {
    product: "캐주얼 티셔츠",
    currentStock: 180,
    optimalStock: 200,
    predictedDemand: 95,
    weeklyDemand: 22,
    leadTime: 5,
    stockoutRisk: "low",
    revenueImpact: 0,
    recommendedOrder: 40,
    urgency: "보통"
  },
  {
    product: "데님 청바지",
    currentStock: 25,
    optimalStock: 80,
    predictedDemand: 120,
    weeklyDemand: 28,
    leadTime: 10,
    stockoutRisk: "critical",
    revenueImpact: -8400000,
    recommendedOrder: 135,
    urgency: "긴급"
  },
  {
    product: "가죽 재킷",
    currentStock: 15,
    optimalStock: 40,
    predictedDemand: 65,
    weeklyDemand: 15,
    leadTime: 14,
    stockoutRisk: "high",
    revenueImpact: -3900000,
    recommendedOrder: 75,
    urgency: "높음"
  }
];

// 주간 수요-재고 트렌드
const weeklyTrend = [
  { week: "1주", demand: 320, stock: 480, revenue: 28000000 },
  { week: "2주", demand: 380, stock: 420, revenue: 33200000 },
  { week: "3주", demand: 350, stock: 380, revenue: 30500000 },
  { week: "4주", demand: 420, stock: 310, revenue: 36400000 },
  { week: "현재", demand: 450, stock: 265, revenue: 38000000 },
  { week: "예측1", demand: 480, stock: 220, revenue: 41000000 },
  { week: "예측2", demand: 520, stock: 150, revenue: 44500000 }
];

const ProfitCenterPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalRevenueAtRisk = integratedData.reduce((sum, item) => sum + Math.abs(item.revenueImpact), 0);
  const criticalItems = integratedData.filter(item => item.stockoutRisk === "critical").length;
  const highRiskItems = integratedData.filter(item => item.stockoutRisk === "high").length;
  const totalOrderValue = integratedData.reduce((sum, item) => sum + (item.recommendedOrder * 50000), 0);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "critical":
        return <Badge variant="destructive">위험</Badge>;
      case "high":
        return <Badge className="bg-orange-500">높음</Badge>;
      default:
        return <Badge variant="secondary">낮음</Badge>;
    }
  };

  const getStockLevel = (current: number, optimal: number) => {
    return (current / optimal) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Profit Center 통합 대시보드</h1>
            <p className="mt-2 text-muted-foreground">수요 예측 기반 재고 최적화 및 매출 극대화</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 핵심 지표 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">위험 매출액</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ₩{totalRevenueAtRisk.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                재고 부족으로 인한 예상 손실
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">긴급 대응 필요</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalItems + highRiskItems}개</div>
              <p className="text-xs text-muted-foreground mt-1">
                위험 {criticalItems}개 / 높음 {highRiskItems}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">권장 발주액</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{totalOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                최적 재고 확보 비용
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예상 ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {((totalRevenueAtRisk / totalOrderValue) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                발주 투자 대비 매출 회복
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="integrated" className="w-full">
          <TabsList>
            <TabsTrigger value="integrated">통합 현황</TabsTrigger>
            <TabsTrigger value="trends">트렌드 분석</TabsTrigger>
            <TabsTrigger value="actions">실행 계획</TabsTrigger>
          </TabsList>

          <TabsContent value="integrated" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>수요-재고 통합 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {integratedData.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{item.product}</h4>
                          {getRiskBadge(item.stockoutRisk)}
                          <Badge variant="outline">{item.urgency}</Badge>
                        </div>
                        {item.revenueImpact < 0 && (
                          <div className="text-right">
                            <p className="text-sm text-destructive font-semibold">
                              예상 손실: ₩{Math.abs(item.revenueImpact).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">현재 재고</p>
                          <p className="font-semibold text-lg">{item.currentStock}개</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">최적 재고</p>
                          <p className="font-semibold text-lg text-primary">{item.optimalStock}개</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">예상 수요</p>
                          <p className="font-semibold text-lg">{item.predictedDemand}개</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">권장 발주</p>
                          <p className="font-semibold text-lg text-green-600">{item.recommendedOrder}개</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>재고 충족률</span>
                          <span className="font-semibold">
                            {getStockLevel(item.currentStock, item.optimalStock).toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={getStockLevel(item.currentStock, item.optimalStock)} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          주간 수요: {item.weeklyDemand}개 | 리드타임: {item.leadTime}일 | 
                          {item.currentStock < item.weeklyDemand * 2 && 
                            <span className="text-destructive font-semibold"> ⚠️ 2주 이내 재고 소진 예상</span>
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>주간 수요-재고-매출 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="demand" stroke="#8b5cf6" name="수요" strokeWidth={2} />
                    <Line yAxisId="left" type="monotone" dataKey="stock" stroke="#06b6d4" name="재고" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="매출(원)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">⚠️ 중요 인사이트</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 재고가 지속적으로 감소 중이며, 2주 후 심각한 재고 부족 예상</li>
                    <li>• 수요는 주간 8-12% 증가 추세로 시즌 성수기 진입 신호</li>
                    <li>• 현재 트렌드 지속 시 예측2주차에 ₩17.5M 추가 매출 손실 발생</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>실행 계획 및 자동화</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    긴급 조치 필요 (24시간 내)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {integratedData.filter(i => i.stockoutRisk === "critical").map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                        <span>{item.product}: <strong>{item.recommendedOrder}개</strong> 긴급 발주</span>
                        <Button size="sm" className="ml-2">발주 요청</Button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    주간 발주 계획 (3일 내)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {integratedData.filter(i => i.stockoutRisk === "high").map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                        <span>{item.product}: <strong>{item.recommendedOrder}개</strong> 발주 준비</span>
                        <Button size="sm" variant="outline">예약</Button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">🤖 자동화 설정</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">자동 발주 제안</p>
                        <p className="text-xs text-muted-foreground">재고 부족 예상 시 자동 알림</p>
                      </div>
                      <Button variant="outline" size="sm">활성화</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">수요 급등 감지</p>
                        <p className="text-xs text-muted-foreground">예상 수요 20% 초과 시 알림</p>
                      </div>
                      <Button variant="outline" size="sm">설정</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">공급업체 자동 연동</p>
                        <p className="text-xs text-muted-foreground">발주 승인 시 자동 전송</p>
                      </div>
                      <Button variant="outline" size="sm">연결</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfitCenterPage;
