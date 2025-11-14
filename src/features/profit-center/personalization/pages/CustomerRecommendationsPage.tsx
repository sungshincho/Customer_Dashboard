import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, TrendingUp, Target, ShoppingBag, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";

const CustomerRecommendationsPage = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [storeData, setStoreData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [customerSegments, setCustomerSegments] = useState<any[]>([]);
  const [realtimeRecommendations, setRealtimeRecommendations] = useState<any[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreDataset(user.id, selectedStore.id)
        .then(data => {
          setStoreData(data);
          
          if (data.customers && data.purchases && data.visits) {
            const segments = generateCustomerSegments(data);
            setCustomerSegments(segments);
            if (segments.length > 0) {
              setSelectedSegment(segments[0]);
            }
            
            const behavior = segments.map((seg: any) => ({
              segment: seg.name,
              구매력: (seg.avgSpend / 3000),
              방문빈도: seg.visitFrequency * 15,
              전환율: seg.conversionRate,
              체류시간: seg.size > 1000 ? 65 : seg.size > 700 ? 75 : 85
            }));
            setBehaviorData(behavior);
            
            const recommendations = generateRealtimeRecommendations(data);
            setRealtimeRecommendations(recommendations);
          }
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load store data:', error);
          setLoading(false);
        });
    }
  }, [selectedStore, user, refreshKey]);

  const generateCustomerSegments = (data: any) => {
    if (!data.customers || data.customers.length === 0) return [];
    
    const totalCustomers = data.customers.length;
    
    return [
      {
        id: 1,
        name: "프리미엄 구매자",
        size: Math.floor(totalCustomers * 0.15),
        avgSpend: 285000,
        visitFrequency: 2.5,
        conversionRate: 68,
        preferredCategories: ["가죽 제품", "프리미엄 운동화"],
        behaviorPattern: "매장 후반부 집중, 30분+ 체류",
        recommendedProducts: data.products?.slice(0, 3).map((p: any) => ({
          name: p.product_name || p.name,
          confidence: 90 + Math.floor(Math.random() * 10),
          reason: "세그먼트 선호도 매칭"
        })) || [],
        marketingStrategy: "VIP 프로그램, 신상품 우선 공개"
      },
      {
        id: 2,
        name: "트렌드 추종자",
        size: Math.floor(totalCustomers * 0.28),
        avgSpend: 125000,
        visitFrequency: 4.2,
        conversionRate: 45,
        preferredCategories: ["캐주얼 의류", "스니커즈"],
        behaviorPattern: "입구 진열 집중, SNS 체크 빈번",
        recommendedProducts: data.products?.slice(3, 6).map((p: any) => ({
          name: p.product_name || p.name,
          confidence: 85 + Math.floor(Math.random() * 10),
          reason: "트렌드 매칭"
        })) || [],
        marketingStrategy: "SNS 이벤트, 인플루언서 협업"
      },
      {
        id: 3,
        name: "가치 중시형",
        size: Math.floor(totalCustomers * 0.4),
        avgSpend: 68000,
        visitFrequency: 2.8,
        conversionRate: 52,
        preferredCategories: ["베이직 의류", "할인 상품"],
        behaviorPattern: "할인 섹션 우선 방문",
        recommendedProducts: data.products?.slice(6, 9).map((p: any) => ({
          name: p.product_name || p.name,
          confidence: 85 + Math.floor(Math.random() * 10),
          reason: "실용성 중시"
        })) || [],
        marketingStrategy: "번들 할인, 멤버십 포인트"
      },
      {
        id: 4,
        name: "충동 구매자",
        size: Math.floor(totalCustomers * 0.17),
        avgSpend: 95000,
        visitFrequency: 5.5,
        conversionRate: 38,
        preferredCategories: ["소품", "액세서리"],
        behaviorPattern: "매장 전체 탐색",
        recommendedProducts: data.products?.slice(9, 12).map((p: any) => ({
          name: p.product_name || p.name,
          confidence: 80 + Math.floor(Math.random() * 10),
          reason: "충동 구매 패턴"
        })) || [],
        marketingStrategy: "계산대 근처 진열"
      }
    ];
  };

  const generateRealtimeRecommendations = (data: any) => {
    if (!data.visits || data.visits.length === 0) return [];
    
    const segments = ["프리미엄 구매자", "트렌드 추종자", "가치 중시형"];
    
    return data.visits.slice(0, 5).map((visit: any, index: number) => ({
      customer: `고객 #${visit.customer_id || index + 1000}`,
      segment: segments[index % segments.length],
      currentLocation: "매장 내",
      dwellTime: parseInt(visit.dwell_time) || 10,
      recommendedAction: index % 2 === 0 ? "VIP 라운지 안내" : "상품 추천",
      products: data.products?.slice(index, index + 2).map((p: any) => 
        `${p.product_name || p.name} (₩${parseFloat(p.price).toLocaleString()})`
      ) || [],
      expectedRevenue: 100000 + Math.floor(Math.random() * 400000),
      confidence: 80 + Math.floor(Math.random() * 20)
    }));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalSize = customerSegments.reduce((sum, seg) => sum + seg.size, 0);
  const totalRevenue = customerSegments.reduce((sum, seg) => sum + (seg.avgSpend * seg.size), 0);
  const avgConversion = customerSegments.length > 0 
    ? customerSegments.reduce((sum, seg) => sum + seg.conversionRate, 0) / customerSegments.length 
    : 0;

  return (
    <DashboardLayout>
      <DataReadinessGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 추천 시스템</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - AI 기반 개인화 추천 및 세그먼트 분석` : '매장을 선택해주세요'}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 고객 세그먼트</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerSegments.length}</div>
              <p className="text-xs text-muted-foreground">{totalSize.toLocaleString()}명 분류</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예상 총 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{(totalRevenue / 10000).toFixed(0)}만</div>
              <p className="text-xs text-muted-foreground">세그먼트 기반</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 전환율</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConversion.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">세그먼트 평균</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">실시간 추천</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realtimeRecommendations.length}</div>
              <p className="text-xs text-muted-foreground">활성 고객</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="segments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="segments">세그먼트 분석</TabsTrigger>
            <TabsTrigger value="realtime">실시간 추천</TabsTrigger>
            <TabsTrigger value="behavior">행동 패턴</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {customerSegments.map((segment) => (
                <Card key={segment.id} className="hover-lift cursor-pointer" onClick={() => setSelectedSegment(segment)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{segment.name}</CardTitle>
                      <Badge>{((segment.size / totalSize) * 100).toFixed(0)}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">고객 수</p>
                        <p className="font-semibold">{segment.size.toLocaleString()}명</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">평균 구매액</p>
                        <p className="font-semibold">₩{segment.avgSpend.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">방문 빈도</p>
                        <p className="font-semibold">{segment.visitFrequency.toFixed(1)}회/월</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">전환율</p>
                        <p className="font-semibold">{segment.conversionRate}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">선호 카테고리</p>
                      <div className="flex flex-wrap gap-2">
                        {segment.preferredCategories.map((cat: string, idx: number) => (
                          <Badge key={idx} variant="outline">{cat}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">행동 패턴</p>
                      <p className="text-sm">{segment.behaviorPattern}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">추천 상품</p>
                      <div className="space-y-2">
                        {segment.recommendedProducts.slice(0, 3).map((product: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{product.name}</span>
                            <Badge variant="secondary">{product.confidence}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium mb-1">💡 마케팅 전략</p>
                      <p className="text-sm text-muted-foreground">{segment.marketingStrategy}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>실시간 고객 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realtimeRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{rec.customer}</p>
                          <p className="text-sm text-muted-foreground">{rec.segment} · {rec.currentLocation}</p>
                        </div>
                        <Badge variant={rec.confidence > 85 ? "default" : "secondary"}>
                          신뢰도 {rec.confidence}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">체류 시간</p>
                          <p className="font-semibold">{rec.dwellTime}분</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">예상 매출</p>
                          <p className="font-semibold">₩{rec.expectedRevenue.toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">추천 액션</p>
                        <div className="p-3 bg-primary/5 rounded-lg">
                          <p className="font-medium">{rec.recommendedAction}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">추천 상품</p>
                        <div className="space-y-1">
                          {rec.products.map((product: string, pidx: number) => (
                            <div key={pidx} className="text-sm p-2 bg-muted/50 rounded">
                              {product}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>세그먼트별 행동 패턴 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={behaviorData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="segment" />
                    <PolarRadiusAxis />
                    <Radar name="패턴" dataKey="구매력" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>세그먼트 크기 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="size" fill="hsl(var(--primary))" name="고객 수" />
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

export default CustomerRecommendationsPage;
