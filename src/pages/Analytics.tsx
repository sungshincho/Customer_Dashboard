import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Clock, MapPin, ShoppingCart, Target, Zap } from "lucide-react";

// 1. Traffic Heatmap Data
const heatmapData = [
  { zone: "입구", morning: 85, afternoon: 120, evening: 145 },
  { zone: "의류구역", morning: 65, afternoon: 98, evening: 112 },
  { zone: "식품구역", morning: 120, afternoon: 156, evening: 134 },
  { zone: "계산대", morning: 78, afternoon: 105, evening: 128 },
  { zone: "휴게공간", morning: 34, afternoon: 67, evening: 89 },
];

// 2. Conversion Funnel Data
const funnelData = [
  { name: "매장 방문", value: 10000, fill: "hsl(var(--primary))" },
  { name: "상품 관심", value: 7500, fill: "hsl(219 100% 60%)" },
  { name: "상품 선택", value: 5000, fill: "hsl(219 100% 65%)" },
  { name: "카트 추가", value: 3000, fill: "hsl(219 100% 70%)" },
  { name: "구매 완료", value: 2100, fill: "hsl(var(--accent))" },
];

// 3. Visitor Flow Data
const flowData = [
  { from: "입구", to: "식품구역", visitors: 456 },
  { from: "입구", to: "의류구역", visitors: 234 },
  { from: "식품구역", to: "계산대", visitors: 389 },
  { from: "의류구역", to: "식품구역", visitors: 178 },
  { from: "의류구역", to: "계산대", visitors: 156 },
];

// 4. Dwell Time Analysis Data
const dwellTimeData = [
  { zone: "입구", avgTime: 2.3, target: 3 },
  { zone: "의류구역", avgTime: 8.5, target: 10 },
  { zone: "식품구역", avgTime: 12.4, target: 12 },
  { zone: "계산대", avgTime: 4.2, target: 5 },
  { zone: "휴게공간", avgTime: 15.6, target: 15 },
];

// 5. Peak Hours Data
const peakHoursData = [
  { hour: "06:00", visitors: 23, sales: 45000 },
  { hour: "09:00", visitors: 145, sales: 280000 },
  { hour: "12:00", visitors: 234, sales: 520000 },
  { hour: "15:00", visitors: 189, sales: 390000 },
  { hour: "18:00", visitors: 267, sales: 680000 },
  { hour: "21:00", visitors: 198, sales: 450000 },
];

// 6. Demographics Data
const demographicsData = [
  { name: "10대", value: 15, color: "hsl(var(--primary))" },
  { name: "20대", value: 35, color: "hsl(219 100% 60%)" },
  { name: "30대", value: 28, color: "hsl(219 100% 65%)" },
  { name: "40대", value: 15, color: "hsl(var(--accent))" },
  { name: "50대+", value: 7, color: "hsl(270 75% 65%)" },
];

const genderData = [
  { name: "남성", value: 45 },
  { name: "여성", value: 55 },
];

// 7. Product Interaction Data
const productInteractionData = [
  { product: "스마트폰", views: 1234, touches: 567, purchases: 89 },
  { product: "의류", views: 2345, touches: 1123, purchases: 234 },
  { product: "식품", views: 3456, touches: 2234, purchases: 456 },
  { product: "가전", views: 1567, touches: 678, purchases: 123 },
  { product: "화장품", views: 2123, touches: 987, purchases: 178 },
];

// 8. Zone Performance Data
const zonePerformanceData = [
  { zone: "입구", traffic: 92, sales: 3200000, conversion: 12.5 },
  { zone: "의류구역", traffic: 78, sales: 8900000, conversion: 18.3 },
  { zone: "식품구역", traffic: 95, sales: 12500000, conversion: 22.1 },
  { zone: "전자제품", traffic: 65, sales: 15600000, conversion: 15.7 },
  { zone: "계산대", traffic: 88, sales: 0, conversion: 85.2 },
];

// 9. Customer Journey Data
const journeySteps = [
  { step: 1, action: "입장", count: 10000, dropoff: 0 },
  { step: 2, action: "상품 탐색", count: 8500, dropoff: 15 },
  { step: 3, action: "상품 선택", count: 6000, dropoff: 29 },
  { step: 4, action: "비교 검토", count: 4500, dropoff: 25 },
  { step: 5, action: "구매 결정", count: 3200, dropoff: 29 },
  { step: 6, action: "계산대 이동", count: 2800, dropoff: 13 },
  { step: 7, action: "결제 완료", count: 2100, dropoff: 25 },
];

// 10. A/B Testing Data
const abTestResults = [
  { variant: "A (기존)", clicks: 1234, conversions: 123, revenue: 4560000 },
  { variant: "B (신규)", clicks: 1456, conversions: 189, revenue: 6780000 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#8884d8", "#82ca9d", "#ffc658"];

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">고급 분석 대시보드</h1>
          <p className="mt-2 text-muted-foreground">10가지 실시간 매장 분석 및 AI 인사이트</p>
        </div>

        <Tabs defaultValue="heatmap" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="heatmap">히트맵</TabsTrigger>
            <TabsTrigger value="funnel">전환퍼널</TabsTrigger>
            <TabsTrigger value="flow">방문경로</TabsTrigger>
            <TabsTrigger value="dwell">체류시간</TabsTrigger>
            <TabsTrigger value="peak">피크시간</TabsTrigger>
            <TabsTrigger value="demographics">인구통계</TabsTrigger>
            <TabsTrigger value="interaction">상품반응</TabsTrigger>
            <TabsTrigger value="zones">구역성과</TabsTrigger>
            <TabsTrigger value="journey">고객여정</TabsTrigger>
            <TabsTrigger value="abtest">A/B테스트</TabsTrigger>
          </TabsList>

          {/* 1. Traffic Heatmap */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  트래픽 히트맵
                </CardTitle>
                <CardDescription>매장 구역별 시간대별 방문자 밀집도</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={heatmapData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        backdropFilter: "blur(12px)"
                      }} 
                    />
                    <Bar dataKey="morning" fill="hsl(219 100% 70%)" name="오전" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="afternoon" fill="hsl(var(--primary))" name="오후" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="evening" fill="hsl(var(--accent))" name="저녁" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최고 밀집 구역</p>
                    <p className="mt-2 text-2xl font-bold gradient-text">식품구역</p>
                    <p className="text-xs text-muted-foreground">평균 156명/시간</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최고 밀집 시간</p>
                    <p className="mt-2 text-2xl font-bold gradient-text">18:00-21:00</p>
                    <p className="text-xs text-muted-foreground">저녁 시간대</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">개선 필요 구역</p>
                    <p className="mt-2 text-2xl font-bold text-warning">휴게공간</p>
                    <p className="text-xs text-muted-foreground">평균 63명/시간</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Conversion Funnel */}
          <TabsContent value="funnel" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  전환 퍼널 분석
                </CardTitle>
                <CardDescription>방문자부터 구매까지의 단계별 전환율</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => {
                    const prevValue = index > 0 ? funnelData[index - 1].value : stage.value;
                    const conversionRate = ((stage.value / prevValue) * 100).toFixed(1);
                    const dropoffRate = (100 - parseFloat(conversionRate)).toFixed(1);
                    
                    return (
                      <div key={stage.name} className="glass-effect rounded-lg p-4 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{stage.name}</h4>
                              <p className="text-sm text-muted-foreground">{stage.value.toLocaleString()}명</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {index > 0 && (
                              <>
                                <Badge variant="outline" className="bg-gradient-primary text-primary-foreground border-0">
                                  전환율 {conversionRate}%
                                </Badge>
                                {parseFloat(dropoffRate) > 20 && (
                                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    이탈 {dropoffRate}%
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                            style={{ width: `${(stage.value / funnelData[0].value) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">전체 전환율</p>
                    <p className="mt-2 text-3xl font-bold gradient-text">21%</p>
                    <p className="text-xs text-muted-foreground">방문자 → 구매</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">개선 우선순위</p>
                    <p className="mt-2 text-xl font-semibold text-warning">상품 선택 단계</p>
                    <p className="text-xs text-muted-foreground">29% 이탈률 (가장 높음)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Visitor Flow */}
          <TabsContent value="flow" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  방문자 이동 경로
                </CardTitle>
                <CardDescription>매장 내 주요 이동 패턴 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {flowData.map((flow, index) => (
                    <div key={index} className="glass-effect rounded-lg p-4 hover-lift">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-primary/20 text-primary border-0">{flow.from}</Badge>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-px w-12 bg-gradient-primary" />
                            <span className="text-xs">→</span>
                            <div className="h-px w-12 bg-gradient-primary" />
                          </div>
                          <Badge className="bg-accent/20 text-accent border-0">{flow.to}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold gradient-text">{flow.visitors}</p>
                          <p className="text-xs text-muted-foreground">방문자</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최다 이동 경로</p>
                    <p className="mt-2 font-semibold gradient-text">입구 → 식품구역</p>
                    <p className="text-xs text-muted-foreground">456명 (전체의 35%)</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">평균 이동 횟수</p>
                    <p className="mt-2 text-2xl font-bold gradient-text">3.7회</p>
                    <p className="text-xs text-muted-foreground">구역 간 이동</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">추천 동선</p>
                    <p className="mt-2 font-semibold text-primary">순환형 레이아웃</p>
                    <p className="text-xs text-muted-foreground">이탈률 -15% 예상</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Dwell Time Analysis */}
          <TabsContent value="dwell" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  체류 시간 분석
                </CardTitle>
                <CardDescription>구역별 평균 체류 시간 vs 목표 시간</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dwellTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="zone" />
                    <YAxis label={{ value: '분', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        backdropFilter: "blur(12px)"
                      }} 
                    />
                    <Bar dataKey="avgTime" fill="hsl(var(--primary))" name="평균 시간" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="hsl(var(--accent))" name="목표 시간" radius={[4, 4, 0, 0]} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 space-y-3">
                  {dwellTimeData.map((zone) => {
                    const isAboveTarget = zone.avgTime >= zone.target;
                    const percentage = ((zone.avgTime / zone.target) * 100).toFixed(0);
                    
                    return (
                      <div key={zone.zone} className="glass-effect rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{zone.zone}</h4>
                          <Badge 
                            variant={isAboveTarget ? "default" : "destructive"}
                            className={isAboveTarget ? "bg-gradient-primary border-0" : ""}
                          >
                            {isAboveTarget ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {percentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">평균: <strong className="text-foreground">{zone.avgTime}분</strong></span>
                          <span className="text-muted-foreground">목표: <strong className="text-foreground">{zone.target}분</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Peak Hours */}
          <TabsContent value="peak" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  피크 시간대 분석
                </CardTitle>
                <CardDescription>시간대별 방문자 수 및 매출 상관관계</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        backdropFilter: "blur(12px)"
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === "매출") {
                          return [`₩${value.toLocaleString()}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                      name="방문자"
                      className="drop-shadow-glow"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--accent))", r: 5 }}
                      name="매출"
                      className="drop-shadow-glow"
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">피크 시간</p>
                    <p className="mt-2 text-2xl font-bold gradient-text">18:00</p>
                    <p className="text-xs text-muted-foreground">267명 방문</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최고 매출</p>
                    <p className="mt-2 text-xl font-bold gradient-text">₩680만</p>
                    <p className="text-xs text-muted-foreground">18시 시간대</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">한적한 시간</p>
                    <p className="mt-2 text-2xl font-bold text-muted-foreground">06:00</p>
                    <p className="text-xs text-muted-foreground">23명 방문</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">권장 직원 배치</p>
                    <p className="mt-2 text-xl font-bold text-primary">+3명</p>
                    <p className="text-xs text-muted-foreground">18-21시 추가</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Demographics */}
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card hover-lift animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    연령대 분포
                  </CardTitle>
                  <CardDescription>방문자 연령대별 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {demographicsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 space-y-2">
                    {demographicsData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <Badge variant="outline">{item.value}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <CardTitle>성별 분포</CardTitle>
                  <CardDescription>방문자 성별 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 glass-effect rounded-lg p-4">
                    <h4 className="font-medium mb-2">주요 인사이트</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 20-30대가 전체의 <strong className="text-foreground">63%</strong> 차지</li>
                      <li>• 여성 방문자가 <strong className="text-foreground">10% 더 많음</strong></li>
                      <li>• 주말 10대 방문자 <strong className="text-foreground">+45%</strong> 증가</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 7. Product Interaction */}
          <TabsContent value="interaction" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  상품 인터랙션 분석
                </CardTitle>
                <CardDescription>카테고리별 조회, 접촉, 구매 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productInteractionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        backdropFilter: "blur(12px)"
                      }} 
                    />
                    <Bar dataKey="views" fill="hsl(219 100% 70%)" name="조회" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="touches" fill="hsl(var(--primary))" name="접촉" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" fill="hsl(var(--accent))" name="구매" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 space-y-3">
                  {productInteractionData.map((product) => {
                    const touchRate = ((product.touches / product.views) * 100).toFixed(1);
                    const conversionRate = ((product.purchases / product.touches) * 100).toFixed(1);
                    
                    return (
                      <div key={product.product} className="glass-effect rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{product.product}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-primary/10">
                              접촉률 {touchRate}%
                            </Badge>
                            <Badge variant="outline" className="bg-accent/10">
                              전환율 {conversionRate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">조회</p>
                            <p className="font-semibold">{product.views.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">접촉</p>
                            <p className="font-semibold">{product.touches.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">구매</p>
                            <p className="font-semibold">{product.purchases.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. Zone Performance */}
          <TabsContent value="zones" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  구역별 성과 분석
                </CardTitle>
                <CardDescription>트래픽, 매출, 전환율 종합 평가</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zonePerformanceData.map((zone, index) => {
                    const isTopPerformer = zone.conversion > 20 || zone.sales > 10000000;
                    
                    return (
                      <div 
                        key={zone.zone} 
                        className={`glass-effect rounded-lg p-4 hover-lift ${isTopPerformer ? 'border border-primary/30' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{zone.zone}</h4>
                          {isTopPerformer && (
                            <Badge className="bg-gradient-primary border-0">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              우수
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">트래픽 점수</p>
                            <p className="text-2xl font-bold gradient-text">{zone.traffic}</p>
                            <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-primary rounded-full"
                                style={{ width: `${zone.traffic}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground">매출</p>
                            <p className="text-xl font-bold gradient-text">
                              {zone.sales === 0 ? 'N/A' : `₩${(zone.sales / 10000).toFixed(0)}만`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">일 평균</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground">전환율</p>
                            <p className="text-2xl font-bold gradient-text">{zone.conversion}%</p>
                            <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-primary rounded-full"
                                style={{ width: `${zone.conversion}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최고 성과 구역</p>
                    <p className="mt-2 text-xl font-bold gradient-text">식품구역</p>
                    <p className="text-xs text-muted-foreground">매출 1,250만원/일</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">개선 필요 구역</p>
                    <p className="mt-2 text-xl font-bold text-warning">전자제품</p>
                    <p className="text-xs text-muted-foreground">전환율 15.7%</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">예상 개선 효과</p>
                    <p className="mt-2 text-xl font-bold text-success">+₩340만</p>
                    <p className="text-xs text-muted-foreground">월 추가 매출</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 9. Customer Journey */}
          <TabsContent value="journey" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  고객 여정 분석
                </CardTitle>
                <CardDescription>입장부터 구매까지의 단계별 행동 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {journeySteps.map((step, index) => {
                    const isLastStep = index === journeySteps.length - 1;
                    const nextStep = !isLastStep ? journeySteps[index + 1] : null;
                    
                    return (
                      <div key={step.step}>
                        <div className="glass-effect rounded-lg p-4 hover-lift">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-bold">
                                {step.step}
                              </div>
                              <div>
                                <h4 className="font-semibold">{step.action}</h4>
                                <p className="text-sm text-muted-foreground">{step.count.toLocaleString()}명</p>
                              </div>
                            </div>
                            {step.dropoff > 0 && (
                              <Badge 
                                variant={step.dropoff > 25 ? "destructive" : "outline"}
                                className={step.dropoff > 25 ? "" : "bg-warning/10 text-warning border-warning/20"}
                              >
                                <TrendingDown className="mr-1 h-3 w-3" />
                                이탈 {step.dropoff}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                              style={{ width: `${(step.count / journeySteps[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {!isLastStep && nextStep && (
                          <div className="flex items-center justify-center py-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-6 w-px bg-gradient-primary" />
                              <span className="text-xs text-muted-foreground">
                                -{((step.count - nextStep.count) / step.count * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최종 전환율</p>
                    <p className="mt-2 text-3xl font-bold gradient-text">21%</p>
                    <p className="text-xs text-muted-foreground">입장 → 구매</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">최대 이탈 단계</p>
                    <p className="mt-2 font-semibold text-warning">상품 선택</p>
                    <p className="text-xs text-muted-foreground">29% 이탈</p>
                  </div>
                  <div className="glass-effect rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">평균 체류 시간</p>
                    <p className="mt-2 text-2xl font-bold gradient-text">23.4분</p>
                    <p className="text-xs text-muted-foreground">전체 여정</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 10. A/B Testing */}
          <TabsContent value="abtest" className="space-y-4">
            <Card className="glass-card hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  A/B 테스트 결과
                </CardTitle>
                <CardDescription>신규 레이아웃 vs 기존 레이아웃 성과 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {abTestResults.map((variant, index) => {
                    const isWinner = index === 1; // B가 승자
                    const conversionRate = ((variant.conversions / variant.clicks) * 100).toFixed(2);
                    const avgRevenue = (variant.revenue / variant.conversions).toLocaleString();
                    
                    return (
                      <div 
                        key={variant.variant}
                        className={`glass-effect rounded-lg p-6 hover-lift ${
                          isWinner ? 'border-2 border-primary shadow-glow' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold">{variant.variant}</h3>
                          {isWinner && (
                            <Badge className="bg-gradient-primary border-0 animate-pulse-glow">
                              <TrendingUp className="mr-1 h-4 w-4" />
                              승자
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">클릭 수</p>
                            <p className="text-2xl font-bold gradient-text">{variant.clicks.toLocaleString()}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">전환 수</p>
                            <p className="text-2xl font-bold gradient-text">{variant.conversions.toLocaleString()}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">전환율</p>
                            <p className="text-3xl font-bold gradient-text">{conversionRate}%</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">총 매출</p>
                            <p className="text-xl font-bold gradient-text">₩{(variant.revenue / 10000).toFixed(0)}만</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">평균 객단가</p>
                            <p className="text-lg font-bold">₩{avgRevenue}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 glass-effect rounded-lg p-6">
                  <h4 className="font-semibold mb-4">테스트 결과 요약</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">전환율 개선</p>
                      <p className="text-2xl font-bold text-success">+53.7%</p>
                      <p className="text-xs text-muted-foreground">B가 A 대비</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">매출 증가</p>
                      <p className="text-2xl font-bold text-success">+48.7%</p>
                      <p className="text-xs text-muted-foreground">₩222만 증가</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">권장 조치</p>
                      <p className="text-lg font-bold text-primary">B 적용</p>
                      <p className="text-xs text-muted-foreground">통계적 유의성 확인</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm">
                      <strong className="text-primary">AI 추천:</strong> 신규 레이아웃(B)이 모든 지표에서 우수한 성과를 보입니다. 
                      즉시 전체 매장에 적용을 권장하며, 예상 월 매출 증가는 <strong className="text-primary">₩666만</strong>입니다.
                    </p>
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

export default Analytics;
