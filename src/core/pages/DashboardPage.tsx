import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Package, DollarSign, AlertCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { loadStoreDataset } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialStats = [
  {
    title: "오늘 방문자",
    value: "1,234",
    change: "+12.5% 어제 대비",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "총 매출",
    value: "₩8,450,000",
    change: "+8.2% 지난주 대비",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "재고 알림",
    value: "23",
    change: "5개 품목 긴급",
    changeType: "negative" as const,
    icon: Package,
  },
  {
    title: "전환율",
    value: "18.6%",
    change: "+2.4% 지난주 대비",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const visitorData = [
  { time: "00:00", visitors: 45 },
  { time: "03:00", visitors: 32 },
  { time: "06:00", visitors: 58 },
  { time: "09:00", visitors: 124 },
  { time: "12:00", visitors: 203 },
  { time: "15:00", visitors: 186 },
  { time: "18:00", visitors: 245 },
  { time: "21:00", visitors: 178 },
];

const salesData = [
  { store: "강남점", sales: 4200 },
  { store: "홍대점", sales: 3800 },
  { store: "명동점", sales: 5100 },
  { store: "잠실점", sales: 3500 },
];

const Dashboard = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [stats, setStats] = useState(initialStats);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 매장 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreDataset(user.id, selectedStore.id)
        .then(data => {
          setStoreData(data);
          
          // 실제 데이터로 stats 업데이트
          const totalVisits = data.visits?.length || 0;
          const totalPurchases = data.purchases?.length || 0;
          const totalRevenue = data.purchases?.reduce((sum: number, p: any) => 
            sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0) || 0;
          const conversionRate = totalVisits > 0 ? ((totalPurchases / totalVisits) * 100).toFixed(1) : '0.0';
          const lowStockProducts = data.products?.filter((p: any) => 
            (parseInt(p.stock_quantity) || 0) < 10
          ).length || 0;

          setStats([
            {
              title: "오늘 방문자",
              value: totalVisits.toString(),
              change: "+12.5% 어제 대비",
              changeType: "positive" as const,
              icon: Users,
            },
            {
              title: "총 매출",
              value: `₩${totalRevenue.toLocaleString()}`,
              change: "+8.2% 지난주 대비",
              changeType: "positive" as const,
              icon: DollarSign,
            },
            {
              title: "재고 알림",
              value: lowStockProducts.toString(),
              change: `${lowStockProducts}개 품목 부족`,
              changeType: lowStockProducts > 0 ? "negative" as const : "positive" as const,
              icon: Package,
            },
            {
              title: "전환율",
              value: `${conversionRate}%`,
              change: "+2.4% 지난주 대비",
              changeType: "positive" as const,
              icon: TrendingUp,
            },
          ]);
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load store data:', error);
          setLoading(false);
        });
    }
  }, [selectedStore, user]);

  useEffect(() => {
    // Supabase Realtime 구독 예시
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          // 실제 데이터로 업데이트
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            매장을 선택하면 해당 매장의 실시간 대시보드를 확인할 수 있습니다.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">실시간 대시보드</h1>
          <p className="mt-2 text-muted-foreground">
            {selectedStore.store_name} - 매장 운영 현황 및 주요 지표
          </p>
        </div>

        {storeData.visits?.length > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {selectedStore.store_name} 데이터: {storeData.visits.length}건 방문, {storeData.purchases?.length || 0}건 구매
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

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 animate-slide-up">
          {/* Visitor Chart */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>실시간 방문자</CardTitle>
              <CardDescription>오늘 시간대별 방문자 수</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={visitorData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>매장별 매출</CardTitle>
              <CardDescription>오늘 매장별 판매 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="store" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="space-y-4">
              {[
                { type: "재고", message: "강남점 - 상품 A 재고 부족 (5개 남음)", time: "5분 전", urgent: true },
                { type: "방문자", message: "명동점 방문자 급증 (전일 대비 +35%)", time: "12분 전", urgent: false },
                { type: "매출", message: "홍대점 - 목표 매출 달성 (105%)", time: "25분 전", urgent: false },
                { type: "시스템", message: "AI 예측 모델 업데이트 완료", time: "1시간 전", urgent: false },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 hover:bg-accent/5 transition-colors duration-200 rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-2 w-2 rounded-full ${alert.urgent ? 'bg-destructive animate-pulse-glow' : 'bg-primary'}`} />
                    <div>
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
