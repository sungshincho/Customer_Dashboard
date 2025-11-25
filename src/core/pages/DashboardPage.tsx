import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Package, DollarSign, AlertCircle, RefreshCw, AlertTriangle, Clock, TrendingDown, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState, useEffect } from "react";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreDataset } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useClearCache } from "@/hooks/useClearCache";
import { isToday, parseISO, format } from "date-fns";
import { FunnelVisualization } from "@/components/dashboard/FunnelVisualization";
import { AIRecommendationCard } from "@/components/dashboard/AIRecommendationCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useDashboardKPI, useLatestKPIs } from "@/hooks/useDashboardKPI";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { invalidateStoreData } = useClearCache();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: storeData, isLoading: loading, error, refetch } = useStoreDataset();
  
  // 선택된 날짜의 KPI 데이터
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: dashboardKPI } = useDashboardKPI(selectedStore?.id, dateStr);
  const { data: latestKPIs } = useLatestKPIs(selectedStore?.id, 7);
  
  // AI 추천 가져오기
  const { 
    data: recommendations, 
    dismissRecommendation, 
    generateRecommendations 
  } = useAIRecommendations(selectedStore?.id);

  // 페이지 로드 시 KPI 자동 집계
  useEffect(() => {
    if (selectedStore?.id && selectedDate) {
      handleAutoAggregate();
    }
  }, [selectedStore?.id, dateStr]);

  const handleGenerateRecommendations = async () => {
    if (selectedStore?.id) {
      try {
        // 1. 선택된 날짜의 KPI 집계
        const { error: kpiError } = await supabase.functions.invoke('aggregate-dashboard-kpis', {
          body: { 
            store_id: selectedStore.id,
            date: dateStr
          },
        });
        
        if (kpiError) throw kpiError;
        
        // 2. AI 추천 생성
        generateRecommendations.mutate(selectedStore.id);
      } catch (error) {
        console.error('KPI 집계 실패:', error);
      }
    }
  };

  // 페이지 로드 시 자동 집계
  const handleAutoAggregate = async () => {
    if (selectedStore?.id) {
      try {
        await supabase.functions.invoke('aggregate-dashboard-kpis', {
          body: { 
            store_id: selectedStore.id,
            date: dateStr
          },
        });
      } catch (error) {
        console.error('자동 KPI 집계 실패:', error);
      }
    }
  };

  // 오늘 날짜로 필터링된 데이터
  const todayData = useMemo(() => {
    if (!storeData) return { visits: [], purchases: [] };
    
    const todayVisits = storeData.visits?.filter((visit: any) => {
      try {
        if (visit.visit_date) {
          return isToday(parseISO(visit.visit_date));
        }
        return false;
      } catch {
        return false;
      }
    }) || [];

    const todayPurchases = storeData.purchases?.filter((purchase: any) => {
      try {
        if (purchase.purchase_date) {
          return isToday(parseISO(purchase.purchase_date));
        }
        return false;
      } catch {
        return false;
      }
    }) || [];

    return { visits: todayVisits, purchases: todayPurchases };
  }, [storeData]);

  // KPI 데이터 기반 stats 생성 - 실제 데이터만 사용
  const stats = useMemo(() => {
    // 실제 DB 데이터만 사용, 없으면 0 표시
    const totalVisits = dashboardKPI?.total_visits || 0;
    const totalRevenue = dashboardKPI?.total_revenue || 0;
    const salesPerSqm = dashboardKPI?.sales_per_sqm || 0;
    const conversionRate = dashboardKPI?.conversion_rate || 0;
    const totalPurchases = dashboardKPI?.total_purchases || 0;


    return [
      {
        title: "방문자",
        value: totalVisits.toLocaleString(),
        change: totalVisits > 0 ? "실제 데이터" : "데이터 없음",
        changeType: totalVisits > 0 ? "positive" as const : "neutral" as const,
        icon: Users,
      },
      {
        title: "매출",
        value: `₩${totalRevenue.toLocaleString()}`,
        change: `${totalPurchases}건 구매`,
        changeType: totalRevenue > 0 ? "positive" as const : "neutral" as const,
        icon: DollarSign,
      },
      {
        title: "평당 매출",
        value: `₩${Math.round(salesPerSqm).toLocaleString()}`,
        change: salesPerSqm > 0 ? "면적당 효율" : "데이터 없음",
        changeType: salesPerSqm > 1000 ? "positive" as const : "neutral" as const,
        icon: Package,
      },
      {
        title: "전환율",
        value: `${conversionRate.toFixed(1)}%`,
        change: conversionRate > 0 ? "실제 데이터" : "데이터 없음",
        changeType: conversionRate >= 3 ? "positive" as const : "neutral" as const,
        icon: TrendingUp,
      },
    ];
  }, [dashboardKPI, latestKPIs]);

  // 최근 7일 트렌드 데이터 (latestKPIs 기반)
  const visitorData = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) {
      return [];
    }
    
    return latestKPIs.slice(0, 7).reverse().map(kpi => ({
      date: format(new Date(kpi.date), 'MM/dd'),
      visitors: kpi.total_visits || 0,
      revenue: Math.round((kpi.total_revenue || 0) / 1000) // 천원 단위
    }));
  }, [latestKPIs]);

  // 실제 데이터 기반 알림 생성 - 데이터가 없으면 빈 배열
  const alerts = useMemo(() => {
    if (!storeData) return [];

    const alertList: Array<{
      type: 'warning' | 'info' | 'success';
      icon: any;
      title: string;
      time: string;
    }> = [];

    // 재고 부족 알림 - 실제 재고 데이터만
    const lowStockProducts = storeData.products?.filter((p: any) => 
      (parseInt(p.stock_quantity) || 0) > 0 && (parseInt(p.stock_quantity) || 0) < 10
    ) || [];
    
    lowStockProducts.slice(0, 2).forEach((product: any) => {
      alertList.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${product.product_name} 재고 부족 (${product.stock_quantity}개)`,
        time: '방금 전'
      });
    });

    // 높은 방문자 알림 - 실제 방문 데이터만
    if (todayData.visits.length > 50) {
      alertList.push({
        type: 'info',
        icon: Users,
        title: `높은 방문자 수: 오늘 ${todayData.visits.length}명 방문`,
        time: '5분 전'
      });
    }

    // 높은 매출 알림 - 실제 구매 데이터만
    const todayRevenue = todayData.purchases.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0);
    
    if (todayRevenue > 100000) {
      alertList.push({
        type: 'success',
        icon: TrendingUp,
        title: `오늘 매출 목표 달성: ₩${todayRevenue.toLocaleString()}`,
        time: '10분 전'
      });
    }

    // 최근 구매 알림
    if (todayData.purchases.length > 0) {
      const recentPurchase = todayData.purchases[0];
      const amount = (parseFloat(String(recentPurchase.unit_price)) || 0) * (parseInt(String(recentPurchase.quantity)) || 1);
      alertList.push({
        type: 'info',
        icon: DollarSign,
        title: `새 구매: ${recentPurchase.product_name} (₩${amount.toLocaleString()})`,
        time: '15분 전'
      });
    }

    // 전환율 알림
    const conversionRate = todayData.visits.length > 0 
      ? (todayData.purchases.length / todayData.visits.length) * 100
      : 0;
    
    if (conversionRate < 2 && todayData.visits.length > 10) {
      alertList.push({
        type: 'warning',
        icon: TrendingDown,
        title: `낮은 전환율: ${conversionRate.toFixed(1)}% (개선 필요)`,
        time: '30분 전'
      });
    }

    return alertList.slice(0, 5);
  }, [storeData, todayData]);

  const alertTypeStyles = {
    warning: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200",
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
  };

  return (
    <DataReadinessGuard>
      <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">실시간 대시보드</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 매장 운영 현황 및 주요 지표` : '매장 운영 현황 및 주요 지표'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardFilters 
              selectedDate={selectedDate}
              onDateChange={(date) => date && setSelectedDate(date)}
              onAggregateRange={async (startDate, endDate) => {
                if (selectedStore?.id) {
                  try {
                    const { error } = await supabase.functions.invoke('aggregate-all-kpis', {
                      body: {
                        store_id: selectedStore.id,
                        user_id: user?.id,
                        start_date: startDate,
                        end_date: endDate
                      }
                    });
                    
                    if (error) throw error;
                    
                    // KPI 데이터 새로고침
                    refetch();
                    toast.success(`${startDate}부터 ${endDate}까지 KPI 집계 완료`);
                  } catch (error) {
                    console.error('날짜 범위 KPI 집계 실패:', error);
                    toast.error('KPI 집계에 실패했습니다');
                  }
                }
              }}
            />
            <Button
              onClick={() => {
                invalidateStoreData(selectedStore?.id);
                refetch();
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
          </div>
        </div>

        {dashboardKPI && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {format(selectedDate, 'yyyy년 M월 d일')} 데이터: {dashboardKPI.total_visits || 0}건 방문, {dashboardKPI.total_purchases || 0}건 구매, ₩{(dashboardKPI.total_revenue || 0).toLocaleString()} 매출
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.title} style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* AI 추천 및 퍼널 섹션 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* AI 추천 */}
          <div className="animate-slide-up">
            <AIRecommendationCard 
              recommendations={recommendations || []}
              onDismiss={(id) => dismissRecommendation.mutate(id)}
            />
            {selectedStore && (
              <Button
                onClick={handleGenerateRecommendations}
                variant="outline"
                size="sm"
                className="mt-4 w-full gap-2"
                disabled={generateRecommendations.isPending}
              >
                <Sparkles className="w-4 h-4" />
                {generateRecommendations.isPending ? 'AI 분석 중...' : 'AI 추천 생성'}
              </Button>
            )}
          </div>

          {/* 고객 퍼널 */}
          {dashboardKPI && (
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <FunnelVisualization
                data={{
                  funnel_entry: dashboardKPI.funnel_entry,
                  funnel_browse: dashboardKPI.funnel_browse,
                  funnel_fitting: dashboardKPI.funnel_fitting,
                  funnel_purchase: dashboardKPI.funnel_purchase,
                  funnel_return: dashboardKPI.funnel_return,
                }}
              />
            </div>
          )}

          {/* 퍼널 데이터가 없을 때 */}
          {!dashboardKPI && (
            <Card className="hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle>고객 퍼널</CardTitle>
                <CardDescription>유입부터 재방문까지의 고객 여정</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>퍼널 데이터가 없습니다.</p>
                  <p className="text-sm mt-1">데이터를 집계하려면 위의 AI 추천 생성 버튼을 클릭하세요.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 animate-slide-up">
          {/* Visitor & Revenue Trend */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>최근 7일 트렌드</CardTitle>
              <CardDescription>방문자 수 및 매출 추이</CardDescription>
            </CardHeader>
            <CardContent>
              {visitorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={visitorData}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }} 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorVisitors)" 
                      name="방문자"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-2))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      name="매출 (천원)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>트렌드 데이터가 없습니다</p>
                    <p className="text-sm mt-1">KPI를 집계하면 데이터가 표시됩니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>오늘 구매 내역</CardTitle>
              <CardDescription>최근 상품 판매 현황</CardDescription>
            </CardHeader>
            <CardContent>
              {todayData.purchases.length > 0 ? (
                <div className="space-y-4">
                  {todayData.purchases.slice(0, 5).map((purchase: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="text-sm font-medium">{purchase.product_name || '상품'}</div>
                      <div className="text-sm text-muted-foreground">
                        ₩{((parseFloat(String(purchase.unit_price)) || 0) * (parseInt(String(purchase.quantity)) || 1)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>오늘 구매 내역이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card className="animate-slide-up hover-lift">
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
            <CardDescription>실시간 이벤트 및 알림</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${alertTypeStyles[alert.type]}`}
                  >
                    <alert.icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title}</p>
                      <p className="text-xs opacity-80 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>현재 알림이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default Dashboard;
