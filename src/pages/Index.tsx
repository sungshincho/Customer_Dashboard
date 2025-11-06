import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const stats = [
  {
    title: "총 매출",
    value: "₩12,450,000",
    change: "+12.5% 지난달 대비",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "신규 사용자",
    value: "2,345",
    change: "+8.2% 지난달 대비",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "총 주문",
    value: "1,234",
    change: "-3.1% 지난달 대비",
    changeType: "negative" as const,
    icon: ShoppingCart,
  },
  {
    title: "전환율",
    value: "24.8%",
    change: "+2.4% 지난달 대비",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const chartData = [
  { name: "1월", value: 4000, revenue: 2400 },
  { name: "2월", value: 3000, revenue: 1398 },
  { name: "3월", value: 2000, revenue: 9800 },
  { name: "4월", value: 2780, revenue: 3908 },
  { name: "5월", value: 1890, revenue: 4800 },
  { name: "6월", value: 2390, revenue: 3800 },
  { name: "7월", value: 3490, revenue: 4300 },
];

const recentActivity = [
  { id: 1, user: "김철수", action: "새 주문을 생성했습니다", time: "5분 전" },
  { id: 2, user: "이영희", action: "프로필을 업데이트했습니다", time: "15분 전" },
  { id: 3, user: "박민수", action: "결제를 완료했습니다", time: "1시간 전" },
  { id: 4, user: "정수진", action: "계정을 등록했습니다", time: "2시간 전" },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="mt-2 text-muted-foreground">비즈니스 개요 및 주요 지표</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>월별 트래픽</CardTitle>
              <CardDescription>지난 7개월 방문자 수</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>매출 추이</CardTitle>
              <CardDescription>지난 7개월 매출 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>사용자 활동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
