import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, TrendingUp, Target, ShoppingBag, Eye } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 고객 세그먼트 데이터
const customerSegments = [
  {
    id: 1,
    name: "프리미엄 구매자",
    size: 450,
    avgSpend: 285000,
    visitFrequency: 2.5,
    conversionRate: 68,
    preferredCategories: ["가죽 제품", "프리미엄 운동화", "명품 액세서리"],
    behaviorPattern: "매장 후반부 집중, 30분+ 체류",
    recommendedProducts: [
      { name: "가죽 재킷", confidence: 94, reason: "세그먼트 선호도 매칭" },
      { name: "프리미엄 운동화", confidence: 91, reason: "과거 구매 이력" },
      { name: "디자이너 가방", confidence: 87, reason: "연관 상품 분석" }
    ],
    marketingStrategy: "VIP 프로그램, 신상품 우선 공개"
  },
  {
    id: 2,
    name: "트렌드 추종자",
    size: 820,
    avgSpend: 125000,
    visitFrequency: 4.2,
    conversionRate: 45,
    preferredCategories: ["캐주얼 의류", "스니커즈", "액세서리"],
    behaviorPattern: "입구 진열 집중, SNS 체크 빈번",
    recommendedProducts: [
      { name: "신상 스니커즈", confidence: 89, reason: "트렌드 매칭" },
      { name: "그래픽 티셔츠", confidence: 85, reason: "연령대 선호" },
      { name: "에코백", confidence: 82, reason: "연관 구매 패턴" }
    ],
    marketingStrategy: "SNS 이벤트, 인플루언서 협업"
  },
  {
    id: 3,
    name: "가치 중시형",
    size: 1150,
    avgSpend: 68000,
    visitFrequency: 2.8,
    conversionRate: 52,
    preferredCategories: ["베이직 의류", "할인 상품", "실용품"],
    behaviorPattern: "할인 섹션 우선 방문, 빠른 결정",
    recommendedProducts: [
      { name: "베이직 티셔츠 3종", confidence: 92, reason: "번들 선호도" },
      { name: "청바지", confidence: 88, reason: "실용성 중시" },
      { name: "양말 세트", confidence: 84, reason: "세일 반응률" }
    ],
    marketingStrategy: "번들 할인, 멤버십 포인트"
  },
  {
    id: 4,
    name: "충동 구매자",
    size: 620,
    avgSpend: 95000,
    visitFrequency: 5.5,
    conversionRate: 38,
    preferredCategories: ["소품", "액세서리", "시즌 상품"],
    behaviorPattern: "매장 전체 탐색, 짧은 체류",
    recommendedProducts: [
      { name: "계절 액세서리", confidence: 86, reason: "충동 구매 패턴" },
      { name: "미니 가방", confidence: 83, reason: "저가 고회전" },
      { name: "모자/스카프", confidence: 80, reason: "시즌 상품 선호" }
    ],
    marketingStrategy: "계산대 근처 진열, 한정판 강조"
  }
];

// 실시간 추천 데이터
const realtimeRecommendations = [
  {
    customer: "고객 #1547",
    segment: "프리미엄 구매자",
    currentLocation: "가죽 제품 구역",
    dwellTime: 8,
    recommendedAction: "VIP 라운지 안내",
    products: ["가죽 재킷 (₩305,000)", "디자이너 벨트 (₩180,000)"],
    expectedRevenue: 485000,
    confidence: 91
  },
  {
    customer: "고객 #2891",
    segment: "트렌드 추종자",
    currentLocation: "스니커즈 섹션",
    dwellTime: 5,
    recommendedAction: "신상품 프로모션 안내",
    products: ["리미티드 스니커즈 (₩148,000)", "에코백 (₩35,000)"],
    expectedRevenue: 183000,
    confidence: 87
  },
  {
    customer: "고객 #4203",
    segment: "가치 중시형",
    currentLocation: "할인 구역",
    dwellTime: 12,
    recommendedAction: "번들 할인 제안",
    products: ["베이직 티셔츠 3종 (₩69,000)", "청바지 (₩85,000)"],
    expectedRevenue: 154000,
    confidence: 94
  }
];

// 세그먼트 행동 패턴 데이터 (레이더 차트용)
const behaviorData = customerSegments.map(seg => ({
  segment: seg.name,
  구매력: (seg.avgSpend / 3000),
  방문빈도: seg.visitFrequency * 15,
  전환율: seg.conversionRate,
  체류시간: seg.size > 1000 ? 65 : seg.size > 700 ? 75 : 85
}));

const CustomerRecommendationsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState(customerSegments[0]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalCustomers = customerSegments.reduce((sum, seg) => sum + seg.size, 0);
  const avgConversionRate = Math.round(
    customerSegments.reduce((sum, seg) => sum + seg.conversionRate * seg.size, 0) / totalCustomers
  );
  const potentialRevenue = realtimeRecommendations.reduce((sum, rec) => sum + rec.expectedRevenue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 추천 시스템</h1>
            <p className="mt-2 text-muted-foreground">행동 패턴 기반 개인화 추천 및 매출 극대화</p>
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
              <CardTitle className="text-sm font-medium">총 고객 세그먼트</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerSegments.length}개</div>
              <p className="text-xs text-muted-foreground mt-1">
                총 {totalCustomers.toLocaleString()}명 분류
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 전환율</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                세그먼트 가중 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">실시간 추천</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realtimeRecommendations.length}건</div>
              <p className="text-xs text-muted-foreground mt-1">
                진행 중인 개인화 추천
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예상 추가 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₩{potentialRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                실시간 추천 기대 효과
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="segments" className="w-full">
          <TabsList>
            <TabsTrigger value="segments">세그먼트 분석</TabsTrigger>
            <TabsTrigger value="realtime">실시간 추천</TabsTrigger>
            <TabsTrigger value="insights">인사이트</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>고객 세그먼트별 추천 전략</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {customerSegments.map((segment, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-xl">{segment.name}</h4>
                          <Badge>{segment.size.toLocaleString()}명</Badge>
                          <Badge variant="outline">전환율 {segment.conversionRate}%</Badge>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelectedSegment(segment)}>
                          상세 보기
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">평균 구매액</p>
                          <p className="font-semibold text-lg">₩{segment.avgSpend.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">방문 빈도</p>
                          <p className="font-semibold text-lg">{segment.visitFrequency}회/월</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">행동 패턴</p>
                          <p className="text-xs">{segment.behaviorPattern}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">마케팅 전략</p>
                          <p className="text-xs">{segment.marketingStrategy}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-2">추천 상품 (신뢰도 기반)</p>
                        <div className="space-y-2">
                          {segment.recommendedProducts.map((product, pidx) => (
                            <div key={pidx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div className="flex items-center gap-3">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{product.name}</span>
                                <span className="text-xs text-muted-foreground">({product.reason})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={product.confidence} className="w-20 h-2" />
                                <span className="text-sm font-semibold">{product.confidence}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">추천 활성화</Button>
                        <Button size="sm" variant="outline" className="flex-1">타겟 광고 설정</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime">
            <Card>
              <CardHeader>
                <CardTitle>실시간 고객 추천 (현재 매장 내)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realtimeRecommendations.map((rec, idx) => (
                    <div key={idx} className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{rec.customer}</h4>
                            <p className="text-xs text-muted-foreground">{rec.segment}</p>
                          </div>
                          <Badge className="bg-green-600">신뢰도 {rec.confidence}%</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">예상 매출</p>
                          <p className="text-xl font-bold text-green-600">₩{rec.expectedRevenue.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">현재 위치</p>
                          <p className="font-medium">{rec.currentLocation}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">체류 시간</p>
                          <p className="font-medium">{rec.dwellTime}분</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">권장 액션</p>
                          <p className="font-medium text-primary">{rec.recommendedAction}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">추천 상품:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.products.map((product, pidx) => (
                            <Badge key={pidx} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">직원 알림 전송</Button>
                        <Button size="sm" variant="outline" className="flex-1">앱 푸시 발송</Button>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">🤖 실시간 추천 설정</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>고객 입장 시 자동 분석</span>
                        <Button size="sm" variant="outline">활성화됨</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>직원 태블릿 실시간 알림</span>
                        <Button size="sm" variant="outline">설정</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>고객 앱 개인화 푸시</span>
                        <Button size="sm" variant="outline">연동</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>세그먼트 행동 패턴 비교</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={behaviorData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="segment" />
                      <PolarRadiusAxis />
                      <Radar name="행동 패턴" dataKey="구매력" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                      <Radar name="방문빈도" dataKey="방문빈도" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                      <Radar name="전환율" dataKey="전환율" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>세그먼트별 구매력 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerSegments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgSpend" fill="#8b5cf6" name="평균 구매액 (원)" />
                      <Bar dataKey="size" fill="#06b6d4" name="고객 수 (명)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💡 핵심 인사이트 및 액션</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="font-semibold mb-1">🎯 프리미엄 구매자 집중 공략</p>
                      <p className="text-sm text-muted-foreground">
                        전체의 14%이지만 매출 기여도 35%. VIP 라운지 확장 및 프리미엄 라인 강화 권장
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <p className="font-semibold mb-1">📈 트렌드 추종자 방문율 증가</p>
                      <p className="text-sm text-muted-foreground">
                        월 4.2회 방문으로 최고 빈도. SNS 마케팅 투자 ROI 높음. 인플루언서 콜라보 추진 필요
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                      <p className="font-semibold mb-1">💰 가치 중시형 번들 전략 효과적</p>
                      <p className="text-sm text-muted-foreground">
                        최대 세그먼트(36%). 번들 할인 및 멤버십 프로그램으로 객단가 상승 가능
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomerRecommendationsPage;
