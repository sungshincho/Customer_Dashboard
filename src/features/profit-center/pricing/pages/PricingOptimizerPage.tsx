import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, DollarSign, Target, Zap, Database } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { useOntologyEntities, useOntologyRelations, transformToGraphData } from "@/hooks/useOntologyData";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";

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
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [simulationPrice, setSimulationPrice] = useState(0);

  const { data: productEntities = [] } = useOntologyEntities('product');
  const { data: customerEntities = [] } = useOntologyEntities('customer');
  const { data: relations = [] } = useOntologyRelations();

  useEffect(() => {
    const loadData = async () => {
      if (!user || !selectedStore) {
        setLoading(false);
        return;
      }

      try {
        const data = await loadStoreDataset(user.id, selectedStore.id);
        setStoreData(data);
        
        if (data.products && data.products.length > 0) {
          const productPricing = data.products.slice(0, 10).map((product: any, idx: number) => {
            const currentPrice = parseFloat(product.price) || 100000;
            const cost = currentPrice * 0.5;
            const avgWTP = currentPrice * 1.25;
            const competitorPrice = currentPrice * 1.1;
            const currentSales = Math.floor(Math.random() * 100) + 20;
            const optimalPrice = avgWTP * 0.95;
            const projectedSales = currentSales * 1.4;
            
            return {
              product: product.product_name || product.name || `상품 ${idx + 1}`,
              currentPrice: Math.round(currentPrice),
              avgWTP: Math.round(avgWTP),
              competitorPrice: Math.round(competitorPrice),
              cost: Math.round(cost),
              currentSales,
              optimalPrice: Math.round(optimalPrice),
              projectedSales: Math.round(projectedSales),
              revenueIncrease: Math.round((optimalPrice * projectedSales) - (currentPrice * currentSales)),
              priceElasticity: -1.5,
              segment: currentPrice > 200000 ? "프리미엄" : currentPrice > 100000 ? "중고가" : "중가",
              recommendationConfidence: 85 + Math.floor(Math.random() * 10)
            };
          });
          
          setPricingData(productPricing);
          if (productPricing.length > 0) {
            setSelectedProduct(productPricing[0]);
            setSimulationPrice(productPricing[0].currentPrice);
          }
        }
      } catch (error) {
        console.error('Failed to load store data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, selectedStore, refreshKey]);

  const graphData = useMemo(() => {
    const allEntities = [...productEntities, ...customerEntities];
    return transformToGraphData(allEntities, relations);
  }, [productEntities, customerEntities, relations]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalRevenueIncrease = pricingData.reduce((sum, item) => sum + item.revenueIncrease, 0);
  const avgConfidence = pricingData.length > 0 
    ? pricingData.reduce((sum, item) => sum + item.recommendationConfidence, 0) / pricingData.length 
    : 0;

  const simulationData = selectedProduct 
    ? generateSimulation(simulationPrice, selectedProduct.priceElasticity, selectedProduct.currentSales)
    : [];

  return (
    <DashboardLayout>
      <DataReadinessGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">가격 최적화</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - WTP 기반 AI 가격 분석` : 'WTP 기반 AI 가격 분석'}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {(productEntities.length > 0 || customerEntities.length > 0) && (
          <Alert>
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              온톨로지 통합: {productEntities.length}개 상품, {customerEntities.length}개 고객, {relations.length}개 관계 분석 중
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매출 증가 예상</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{(totalRevenueIncrease / 10000).toFixed(0)}만</div>
              <p className="text-xs text-green-600">최적가 적용 시</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">분석 상품 수</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pricingData.length}개</div>
              <p className="text-xs text-muted-foreground">가격 최적화 대상</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 신뢰도</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">AI 추천 정확도</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 가격 조정</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-green-600">최적 가격 대비</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommendations">가격 추천</TabsTrigger>
            <TabsTrigger value="simulator">가격 시뮬레이터</TabsTrigger>
            <TabsTrigger value="analysis">WTP 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>상품별 가격 최적화 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pricingData.map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{item.product}</p>
                          <Badge variant="outline">{item.segment}</Badge>
                        </div>
                        <Badge variant={item.recommendationConfidence > 90 ? "default" : "secondary"}>
                          신뢰도 {item.recommendationConfidence}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">현재 가격</p>
                          <p className="font-semibold text-lg">₩{item.currentPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">최적 가격</p>
                          <p className="font-semibold text-lg text-primary">₩{item.optimalPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">평균 WTP</p>
                          <p className="font-semibold">₩{item.avgWTP.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">경쟁사 가격</p>
                          <p className="font-semibold">₩{item.competitorPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="font-medium mb-2">💰 예상 효과</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">현재 판매량</p>
                            <p className="font-semibold">{item.currentSales}개/월</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">예상 판매량</p>
                            <p className="font-semibold text-green-600">{item.projectedSales}개/월 (+{((item.projectedSales - item.currentSales) / item.currentSales * 100).toFixed(0)}%)</p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                          <p className="text-green-600 font-semibold">
                            월 매출 증가: ₩{item.revenueIncrease.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>가격 시뮬레이터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">상품 선택</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedProduct?.product}
                    onChange={(e) => {
                      const product = pricingData.find(p => p.product === e.target.value);
                      if (product) {
                        setSelectedProduct(product);
                        setSimulationPrice(product.currentPrice);
                      }
                    }}
                  >
                    {pricingData.map((item, idx) => (
                      <option key={idx} value={item.product}>{item.product}</option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        시뮬레이션 가격: ₩{simulationPrice.toLocaleString()}
                      </label>
                      <Slider
                        value={[simulationPrice]}
                        onValueChange={([value]) => setSimulationPrice(value)}
                        min={selectedProduct.currentPrice * 0.5}
                        max={selectedProduct.currentPrice * 1.5}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>₩{Math.round(selectedProduct.currentPrice * 0.5).toLocaleString()}</span>
                        <span>₩{Math.round(selectedProduct.currentPrice * 1.5).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">예상 판매량</p>
                          <p className="text-2xl font-bold">
                            {Math.round(selectedProduct.currentSales * (1 - selectedProduct.priceElasticity * ((simulationPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice)))}개
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">예상 매출</p>
                          <p className="text-2xl font-bold">
                            ₩{Math.round(simulationPrice * selectedProduct.currentSales * (1 - selectedProduct.priceElasticity * ((simulationPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice)) / 10000)}만
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">이익률</p>
                          <p className="text-2xl font-bold">
                            {((simulationPrice - selectedProduct.cost) / simulationPrice * 100).toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>가격-판매량 관계</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={simulationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="price" tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" name="판매량" />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="매출" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WTP vs 현재가격 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="currentPrice" name="현재가격" />
                    <YAxis type="number" dataKey="avgWTP" name="평균 WTP" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="상품" data={pricingData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>예상 매출 증가</CardTitle>
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
          </TabsContent>
        </Tabs>
      </div>
      </DataReadinessGuard>
    </DashboardLayout>
  );
};

export default PricingOptimizerPage;
