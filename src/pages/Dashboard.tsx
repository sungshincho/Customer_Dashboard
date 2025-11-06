import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Package, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase";
import {
  TrafficHeatmap,
  ConversionFunnel,
  VisitorFlow,
  DwellTime,
  PeakHours,
  Demographics,
  ProductInteraction,
  ZonePerformance,
  CustomerJourney,
  ABTesting,
} from "@/components/features";

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
  const [stats, setStats] = useState(initialStats);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">실시간 대시보드</h1>
          <p className="mt-2 text-muted-foreground">매장 운영 현황 및 주요 지표</p>
        </div>

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

        {/* Analytics Section */}
        <div className="space-y-6">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold gradient-text">심화 분석</h2>
            <p className="mt-2 text-muted-foreground">매장 운영 최적화를 위한 10가지 핵심 지표</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TrafficHeatmap />
            <ConversionFunnel />
            <VisitorFlow />
            <DwellTime />
            <PeakHours />
            <Demographics />
            <ProductInteraction />
            <ZonePerformance />
            <CustomerJourney />
            <ABTesting />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
