import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, DollarSign, Target, Zap } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

// 가격 최적화 데이터 (WTP 분석 기반)
const pricingData = [
  {
    product: "프리미엄 운동화",
    currentPrice: 120000,
    avgWTP: 155000,
    competitorPrice: 135000,
    cost: 65000,
    currentSales: 45,
    optimalPrice: 148000,
    projectedSales: 62,
    revenueIncrease: 1426000,
    priceElasticity: -1.8,
    segment: "고가",
    recommendationConfidence: 92
  },
  {
    product: "캐주얼 티셔츠",
    currentPrice: 35000,
    avgWTP: 42000,
    competitorPrice: 38000,
    cost: 15000,
    currentSales: 180,
    optimalPrice: 39000,
    projectedSales: 195,
    revenueIncrease: 585000,
    priceElasticity: -1.2,
    segment: "중가",
    recommendationConfidence: 87
  },
  {
    product: "데님 청바지",
    currentPrice: 85000,
    avgWTP: 105000,
    competitorPrice: 95000,
    cost: 40000,
    currentSales: 25,
    optimalPrice: 98000,
    projectedSales: 42,
    revenueIncrease: 991000,
    priceElasticity: -2.1,
    segment: "중고가",
    recommendationConfidence: 89
  },
  {
    product: "가죽 재킷",
    currentPrice: 280000,
    avgWTP: 320000,
    competitorPrice: 310000,
    cost: 140000,
    currentSales: 15,
    optimalPrice: 305000,
    projectedSales: 22,
    revenueIncrease: 1285000,
    priceElasticity: -1.5,
    segment: "프리미엄",
    recommendationConfidence: 94
  }
];

// 가격 시뮬레이션 데이터
const generateSimulation = (basePrice: number, elasticity: number, baseSales: number) => {
  const points = [];
  for (let i = -30; i <= 30; i += 5) {
    const priceChange = i / 100;
    const price = basePrice * (1 + priceChange);
    const salesChange = -elasticity * priceChange;
    const sales = Math.max(0, baseSales * (1 + salesChange));
    const revenue = price * sales;
    points.push({
      price: Math.round(price),
      sales: Math.round(sales),
      revenue: Math.round(revenue),
      priceChange: i
    });
  }
  return points;
};

const PricingOptimizerPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(pricingData[0]);
  const [simulationPrice, setSimulationPrice] = useState(selectedProduct.currentPrice);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalRevenueIncrease = pricingData.reduce((sum, item) => sum + item.revenueIncrease, 0);
  const avgConfidence = Math.round(pricingData.reduce((sum, item) => sum + item.recommendationConfidence, 0) / pricingData.length);

  const simulationData = generateSimulation(
    selectedProduct.currentPrice,
    selectedProduct.priceElasticity,
    selectedProduct.currentSales
  );

  const getPriceGap = (current: number, optimal: number) => {
    const gap = ((optimal - current) / current) * 100;
    return gap.toFixed(1);
  };

  const getRecommendationBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-600">높은 신뢰도</Badge>;
    if (confidence >= 80) return <Badge className="bg-blue-500">양호</Badge>;
    return <Badge variant="secondary">검토 필요</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">가격 최적화 엔진</h1>
            <p className="mt-2 text-muted-foreground">AI 기반 동적 가격 전략 및 수익 극대화</p>
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
              <CardTitle className="text-sm font-medium">예상 추가 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₩{totalRevenueIncrease.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                최적 가격 적용 시
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">최적화 대상</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pricingData.length}개</div>
              <p className="text-xs text-muted-foreground mt-1">
                가격 조정 추천 상품
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 신뢰도</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConfidence}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI 추천 정확도
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 가격 갭</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                +{Math.abs(pricingData.reduce((sum, item) => 
                  sum + ((item.optimalPrice - item.currentPrice) / item.currentPrice), 0
                ) / pricingData.length * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                현재가 대비 최적가
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList>
            <TabsTrigger value="recommendations">가격 추천</TabsTrigger>
            <TabsTrigger value="simulator">시뮬레이터</TabsTrigger>
            <TabsTrigger value="analysis">분석</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI 가격 최적화 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingData.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{item.product}</h4>
                          {getRecommendationBadge(item.recommendationConfidence)}
                          <Badge variant="outline">{item.segment}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-semibold">
                            +₩{item.revenueIncrease.toLocaleString()} 증가 예상
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">현재 가격</p>
                          <p className="font-semibold text-lg">₩{item.currentPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">최적 가격</p>
                          <p className="font-semibold text-lg text-primary">₩{item.optimalPrice.toLocaleString()}</p>
                          <p className="text-xs text-green-600">+{getPriceGap(item.currentPrice, item.optimalPrice)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">고객 WTP</p>
                          <p className="font-semibold text-lg">₩{item.avgWTP.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">경쟁사 가격</p>
                          <p className="font-semibold text-lg">₩{item.competitorPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">판매량 변화</p>
                          <p className="font-semibold text-lg text-green-600">
                            {item.currentSales} → {item.projectedSales}개
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>가격 탄력성: {item.priceElasticity}</span>
                          <span>원가: ₩{item.cost.toLocaleString()}</span>
                          <span>이익률: {(((item.optimalPrice - item.cost) / item.optimalPrice) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedProduct(item)}>
                            시뮬레이션
                          </Button>
                          <Button size="sm">가격 적용</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulator">
            <Card>
              <CardHeader>
                <CardTitle>가격 시뮬레이터: {selectedProduct.product}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">시뮬레이션 가격</p>
                      <p className="text-2xl font-bold">₩{simulationPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">현재가 대비</p>
                      <p className="text-2xl font-bold text-primary">
                        {getPriceGap(selectedProduct.currentPrice, simulationPrice)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[simulationPrice]}
                      onValueChange={([value]) => setSimulationPrice(value)}
                      min={selectedProduct.currentPrice * 0.7}
                      max={selectedProduct.currentPrice * 1.3}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₩{Math.round(selectedProduct.currentPrice * 0.7).toLocaleString()}</span>
                      <span>₩{Math.round(selectedProduct.currentPrice * 1.3).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">예상 판매량</p>
                      <p className="text-xl font-bold">
                        {Math.round(
                          selectedProduct.currentSales * 
                          (1 + (-selectedProduct.priceElasticity * ((simulationPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice)))
                        )}개
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">예상 매출</p>
                      <p className="text-xl font-bold text-green-600">
                        ₩{Math.round(
                          simulationPrice * selectedProduct.currentSales * 
                          (1 + (-selectedProduct.priceElasticity * ((simulationPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice)))
                        ).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">매출 변화</p>
                      <p className="text-xl font-bold text-primary">
                        {(((simulationPrice * selectedProduct.currentSales * 
                          (1 + (-selectedProduct.priceElasticity * ((simulationPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice)))) - 
                          (selectedProduct.currentPrice * selectedProduct.currentSales)) / 
                          (selectedProduct.currentPrice * selectedProduct.currentSales) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={simulationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priceChange" label={{ value: '가격 변화 (%)', position: 'insideBottom', offset: -5 }} />
                    <YAxis yAxisId="left" label={{ value: '매출', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: '판매량', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="매출" />
                    <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="판매량" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>가격 포지셔닝 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="currentPrice" name="현재 가격" />
                      <YAxis type="number" dataKey="avgWTP" name="고객 WTP" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter name="상품 포지셔닝" data={pricingData} fill="#8b5cf6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>수익 영향 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pricingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenueIncrease" fill="#10b981" name="매출 증가 (원)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PricingOptimizerPage;
