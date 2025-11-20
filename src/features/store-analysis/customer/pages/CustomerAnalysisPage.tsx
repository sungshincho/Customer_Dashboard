import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Users, TrendingUp, DollarSign, Target, ShoppingBag, Clock } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { useCustomerSegments } from "@/hooks/useCustomerSegments";
import { usePurchasePatterns } from "@/hooks/usePurchasePatterns";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COLORS = ['#1B6BFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function CustomerAnalysisPage() {
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [selectedSegment, setSelectedSegment] = useState<string>("전체");
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue");
  const [showSegments, setShowSegments] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showPersona, setShowPersona] = useState(true);

  const { segments, segmentStats } = useCustomerSegments();
  const { patterns } = usePurchasePatterns();

  const handleRefresh = () => {
    window.location.reload();
  };

  // 세그먼트별 필터링
  const filteredSegments = selectedSegment === "전체" 
    ? segments 
    : segments.filter(s => s.segment === selectedSegment);

  // 페르소나 데이터
  const personaData = {
    ageDistribution: [
      { range: "10대", count: 45, percentage: 8 },
      { range: "20대", count: 180, percentage: 32 },
      { range: "30대", count: 215, percentage: 38 },
      { range: "40대", count: 90, percentage: 16 },
      { range: "50대+", count: 35, percentage: 6 }
    ],
    genderDistribution: [
      { gender: "남성", count: 280, percentage: 49 },
      { gender: "여성", count: 285, percentage: 51 }
    ],
    visitTimeDistribution: [
      { time: "09-12시", count: 95, percentage: 17 },
      { time: "12-15시", count: 168, percentage: 30 },
      { time: "15-18시", count: 196, percentage: 35 },
      { time: "18-21시", count: 106, percentage: 18 }
    ],
    channelPreference: [
      { channel: "모바일", count: 340, percentage: 60 },
      { channel: "PC", count: 170, percentage: 30 },
      { channel: "매장", count: 55, percentage: 10 }
    ]
  };

  const exportData = {
    filters,
    selectedSegment,
    segmentStats,
    patterns,
    personaData,
    totalCustomers: segments.length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">고객 분석</h1>
            <p className="text-muted-foreground mt-2">
              실제 고객 데이터 기반 세그먼트 분석 및 구매 패턴
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="customer-analysis" title="고객 분석" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                VIP 고객
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segmentStats.vip.count}명</div>
              <p className="text-xs text-muted-foreground mt-1">
                총 매출: {segmentStats.vip.totalRevenue.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                평균 LTV: {segmentStats.vip.avgLTV.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Regular 고객
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segmentStats.regular.count}명</div>
              <p className="text-xs text-muted-foreground mt-1">
                총 매출: {segmentStats.regular.totalRevenue.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                평균 LTV: {segmentStats.regular.avgLTV.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                신규 고객
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segmentStats.new.count}명</div>
              <p className="text-xs text-muted-foreground mt-1">
                총 매출: {segmentStats.new.totalRevenue.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                평균 LTV: {segmentStats.new.avgLTV.toLocaleString()}원
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 통합 분석 뷰 */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* 좌측: 컨트롤 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">분석 컨트롤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">고객 세그먼트</label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="신규">신규</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">측정 지표</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">매출</SelectItem>
                    <SelectItem value="frequency">구매 빈도</SelectItem>
                    <SelectItem value="atv">평균 구매 금액</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">표시 섹션</label>
                <div className="space-y-2">
                  <Button
                    variant={showSegments ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSegments(!showSegments)}
                    className="w-full justify-start"
                  >
                    {showSegments ? "✓" : ""} 고객 세그먼트
                  </Button>
                  <Button
                    variant={showPatterns ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPatterns(!showPatterns)}
                    className="w-full justify-start"
                  >
                    {showPatterns ? "✓" : ""} 구매 패턴
                  </Button>
                  <Button
                    variant={showPersona ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPersona(!showPersona)}
                    className="w-full justify-start"
                  >
                    {showPersona ? "✓" : ""} 페르소나
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">주요 통계</label>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-muted text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">총 고객</span>
                      <Badge variant="secondary">{filteredSegments.length}명</Badge>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">평균 구매</span>
                      <Badge variant="secondary">
                        {(filteredSegments.reduce((sum, s) => sum + s.purchaseCount, 0) / filteredSegments.length || 0).toFixed(1)}회
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">평균 LTV</span>
                      <Badge variant="secondary">
                        {(filteredSegments.reduce((sum, s) => sum + s.totalSpent, 0) / filteredSegments.length || 0).toLocaleString()}원
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 우측: 분석 결과 */}
          <div className="md:col-span-3 space-y-6">
            {showSegments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    고객 세그먼트 분포
                  </CardTitle>
                  <CardDescription>신규/재방문, 구매 빈도, ATV별 세그먼트 분석</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">세그먼트별 분포</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'VIP', value: segmentStats.vip.count },
                              { name: 'Regular', value: segmentStats.regular.count },
                              { name: '신규', value: segmentStats.new.count }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}명`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2].map((index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">고객 목록 (상위 10명)</h4>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {filteredSegments.slice(0, 10).map((customer) => (
                          <div
                            key={customer.customer_id}
                            className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors text-sm"
                          >
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">
                                구매 {customer.purchaseCount}회 · {customer.totalSpent.toLocaleString()}원
                              </div>
                            </div>
                            <Badge
                              variant={
                                customer.segment === 'VIP'
                                  ? 'destructive'
                                  : customer.segment === 'Regular'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {customer.segment}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showPatterns && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    구매 패턴 분석
                  </CardTitle>
                  <CardDescription>상품 카테고리 선호도, 구매 주기, 평균 구매 금액</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">카테고리별 구매</h4>
                      <div className="space-y-3">
                        {patterns.categoryPattern.map((cat) => (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{cat.category}</span>
                              <span className="text-muted-foreground">
                                {cat.count}건 · {cat.revenue.toLocaleString()}원
                              </span>
                            </div>
                            <Progress value={(cat.count / (patterns.categoryPattern[0]?.count || 1)) * 100} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">Top 제품</h4>
                      <div className="space-y-2">
                        {patterns.topProducts.slice(0, 5).map((product, idx) => (
                          <div key={product.product_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{idx + 1}</Badge>
                              <span className="text-sm">{product.name}</span>
                            </div>
                            <span className="text-sm font-medium">{product.revenue.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm">평균 구매 주기</span>
                      </div>
                      <div className="text-2xl font-bold">15일</div>
                      <p className="text-xs text-muted-foreground mt-1">전월 대비 -2일 감소</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-sm">평균 구매 금액 (ATV)</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {patterns.categoryPattern.length > 0 
                          ? Math.round(patterns.categoryPattern.reduce((sum, c) => sum + c.avgPrice, 0) / patterns.categoryPattern.length).toLocaleString()
                          : '0'
                        }원
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">전월 대비 +8% 증가</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showPersona && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    페르소나 분석
                  </CardTitle>
                  <CardDescription>연령/성별 분포, 방문 시간대, 선호 채널</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">연령 분포</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={personaData.ageDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))">
                            {personaData.ageDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">성별 분포</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={personaData.genderDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.gender}: ${entry.percentage}%`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {personaData.genderDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">선호 방문 시간대</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={personaData.visitTimeDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10B981">
                            {personaData.visitTimeDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">선호 채널</h4>
                      <div className="space-y-3">
                        {personaData.channelPreference.map((channel) => (
                          <div key={channel.channel}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{channel.channel}</span>
                              <span className="text-muted-foreground">
                                {channel.count}명 ({channel.percentage}%)
                              </span>
                            </div>
                            <Progress value={channel.percentage} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
