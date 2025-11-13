import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { loadStoreFile } from "@/utils/storageDataLoader";

const hourlyData = [
  { hour: "06:00", visitors: 23 },
  { hour: "09:00", visitors: 145 },
  { hour: "12:00", visitors: 234 },
  { hour: "15:00", visitors: 189 },
  { hour: "18:00", visitors: 267 },
  { hour: "21:00", visitors: 198 },
];

const weeklyData = [
  { day: "월", visitors: 1234 },
  { day: "화", visitors: 1456 },
  { day: "수", visitors: 1123 },
  { day: "목", visitors: 1678 },
  { day: "금", visitors: 2134 },
  { day: "토", visitors: 2876 },
  { day: "일", visitors: 2543 },
];

const ageGroupData = [
  { name: "10대", value: 15 },
  { name: "20대", value: 35 },
  { name: "30대", value: 28 },
  { name: "40대", value: 15 },
  { name: "50대+", value: 7 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#8884d8", "#82ca9d", "#ffc658"];

const Analytics = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 매장별 방문 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreFile(user.id, selectedStore.id, 'visits.csv')
        .then(data => {
          console.log(`${selectedStore.store_name} 분석 데이터:`, data.length, '건');
          setVisitsData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load visits data:', error);
          setVisitsData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!selectedStore && (
          <Alert>
            <Store className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 분석 데이터를 확인할 수 있습니다.
            </AlertDescription>
          </Alert>
        )}

        {selectedStore && (
          <>
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold gradient-text">방문자 분석</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedStore.store_name} - 방문 데이터: {visitsData.length}건
              </p>
            </div>

        <Tabs defaultValue="hourly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hourly">시간대별</TabsTrigger>
            <TabsTrigger value="weekly">요일별</TabsTrigger>
            <TabsTrigger value="demographics">연령대</TabsTrigger>
          </TabsList>

          <TabsContent value="hourly" className="space-y-4">
            <Card className="hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle>시간대별 방문자</CardTitle>
                <CardDescription>오늘 시간대별 방문 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <Card className="hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle>요일별 방문자</CardTitle>
                <CardDescription>이번 주 요일별 방문 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }} 
                    />
                    <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover-lift animate-fade-in">
                <CardHeader>
                  <CardTitle>연령대별 분포</CardTitle>
                  <CardDescription>방문자 연령대 비율</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ageGroupData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ageGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <CardTitle>주요 인사이트</CardTitle>
                  <CardDescription>AI 분석 결과</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">피크 시간대</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      저녁 6시~7시에 가장 많은 방문자가 집중됩니다. 이 시간대에 추가 직원 배치를 권장합니다.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">주말 트렌드</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      토요일 방문자가 평일 대비 2배 증가합니다. 주말 재고 관리에 유의하세요.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-medium">타겟 고객층</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      20-30대가 전체 방문자의 63%를 차지합니다. 이 연령대를 타겟으로 한 마케팅 전략이 효과적입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
