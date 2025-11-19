import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockedFeature } from "@/components/LockedFeature";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useCustomerSegments } from "@/hooks/useCustomerSegments";
import { usePurchasePatterns } from "@/hooks/usePurchasePatterns";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function CustomerAnalysisPage() {
  const { segments, segmentStats, isLoading } = useCustomerSegments();
  const { patterns } = usePurchasePatterns();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">고객 분석</h1>
          <p className="text-muted-foreground mt-2">
            실제 고객 데이터 기반 세그먼트 분석 및 구매 패턴
          </p>
        </div>

        {/* Tier 1: 고객 세그먼트 */}
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

        {/* Tabs */}
        <Tabs defaultValue="segments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="segments">고객 세그먼트</TabsTrigger>
            <TabsTrigger value="patterns">구매 패턴</TabsTrigger>
            <TabsTrigger value="ltv">LTV 분석</TabsTrigger>
            <TabsTrigger value="churn">🔒 이탈 예측 (Tier 3)</TabsTrigger>
            <TabsTrigger value="recommendations">🔒 개인화 추천 (Tier 3)</TabsTrigger>
          </TabsList>

          {/* Tier 1: 고객 세그먼트 목록 */}
          <TabsContent value="segments">
            <Card>
              <CardHeader>
                <CardTitle>고객 목록</CardTitle>
                <CardDescription>세그먼트별 고객 상세 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {segments.slice(0, 20).map((customer) => (
                    <div
                      key={customer.customer_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            구매 {customer.purchaseCount}회 · 총 {customer.totalSpent.toLocaleString()}원
                          </div>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tier 1: 구매 패턴 */}
          <TabsContent value="patterns">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 구매</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patterns.categoryPattern.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{cat.category}</span>
                          <span className="text-muted-foreground">
                            {cat.count}건 · {cat.revenue.toLocaleString()}원
                          </span>
                        </div>
                        <Progress value={(cat.count / patterns.categoryPattern[0]?.count || 1) * 100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 제품</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tier 1: LTV 분석 */}
          <TabsContent value="ltv">
            <Card>
              <CardHeader>
                <CardTitle>LTV 분포</CardTitle>
                <CardDescription>고객 생애 가치 (Lifetime Value) 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">평균 LTV</div>
                      <div className="text-2xl font-bold">
                        {(segments.reduce((sum, c) => sum + c.lifetimeValue, 0) / segments.length || 0).toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">최고 LTV</div>
                      <div className="text-2xl font-bold">
                        {Math.max(...segments.map(c => c.lifetimeValue), 0).toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">총 고객 가치</div>
                      <div className="text-2xl font-bold">
                        {segments.reduce((sum, c) => sum + c.lifetimeValue, 0).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tier 3: 이탈 예측 (Locked) */}
          <TabsContent value="churn">
            <LockedFeature
              tier={3}
              title="고객 이탈 위험 예측"
              description="AI 기반으로 이탈 위험이 높은 고객을 예측하고, 리텐션 전략을 제안합니다."
              config={FEATURE_FLAGS.tier3.churnRiskPrediction}
            />
          </TabsContent>

          {/* Tier 3: 개인화 추천 (Locked) */}
          <TabsContent value="recommendations">
            <LockedFeature
              tier={3}
              title="개인화 제품 추천"
              description="고객별 구매 패턴을 AI로 분석하여 개인화된 제품 추천을 제공합니다."
              config={FEATURE_FLAGS.tier3.personalizedRecommendations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
