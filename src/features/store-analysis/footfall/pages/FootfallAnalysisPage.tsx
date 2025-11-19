import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useFootfallAnalysis, useHourlyFootfall } from "@/hooks/useFootfallAnalysis";
import { Store3DViewer } from "@/features/digital-twin/components/Store3DViewer";
import { HeatmapOverlay3D } from "@/features/digital-twin/components/overlays/HeatmapOverlay3D";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, TrendingUp, Clock, Activity } from "lucide-react";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

const FootfallAnalysisPage = () => {
  const { selectedStore } = useSelectedStore();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [show3D, setShow3D] = useState(true);

  const { data: analysisData, isLoading, error } = useFootfallAnalysis(
    selectedStore?.id,
    dateRange.start,
    dateRange.end
  );

  const { data: hourlyData = [], isLoading: isLoadingHourly } = useHourlyFootfall(selectedStore?.id, selectedDate);

  const stats = analysisData?.stats;
  const footfallData = analysisData?.data || [];

  // 데이터 없음 체크
  const hasData = footfallData.length > 0;

  // 일별 집계
  const dailyData = footfallData.reduce((acc, curr) => {
    const existing = acc.find(d => d.date === curr.date);
    if (existing) {
      existing.visits += curr.visit_count;
      existing.unique_visitors += curr.unique_visitors;
    } else {
      acc.push({
        date: curr.date,
        visits: curr.visit_count,
        unique_visitors: curr.unique_visitors,
        displayDate: format(new Date(curr.date), 'MM/dd'),
      });
    }
    return acc;
  }, [] as Array<{ date: string; visits: number; unique_visitors: number; displayDate: string }>);

  // 로딩 중
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 에러 처리
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-destructive">데이터 로딩 중 오류가 발생했습니다.</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 매장 선택 안됨
  if (!selectedStore) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">매장을 먼저 선택해주세요.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">유동인구 분석</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedStore ? `${selectedStore.store_name} - 시간대별 방문객 유입 분석` : '시간대별 방문객 유입 분석'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={show3D ? "default" : "outline"}
              size="sm"
              onClick={() => setShow3D(!show3D)}
            >
              {show3D ? '2D 보기' : '3D 보기'}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "PPP", { locale: ko })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 데이터 없음 알림 */}
        {!hasData && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium">분석 데이터가 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    WiFi 트래킹 데이터를 업로드하거나 NeuralSense 장치를 설정하여 데이터를 수집해주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 컨텍스트 인사이트 카드 */}
        {(stats?.weather_impact || stats?.holiday_impact || stats?.regional_comparison) && (
          <Card className="col-span-full border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">컨텍스트 인사이트</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {stats.weather_impact && <p>🌤️ {stats.weather_impact}</p>}
                    {stats.holiday_impact && <p>🎉 {stats.holiday_impact}</p>}
                    {stats.regional_comparison && <p>📍 {stats.regional_comparison}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 방문</p>
                  <p className="text-2xl font-bold">{stats?.total_visits.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    기간 내 전체 방문
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">고유 방문자</p>
                  <p className="text-2xl font-bold">{stats?.unique_visitors.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    중복 제거 방문자
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">시간당 평균</p>
                  <p className="text-2xl font-bold">{Math.round(stats?.avg_visits_per_hour || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    시간당 방문 수
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">피크 시간</p>
                  <p className="text-2xl font-bold">{stats?.peak_hour.toString().padStart(2, '0')}:00</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.peak_hour_visits || 0}명 방문
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D View with Heatmap */}
        {show3D && selectedStore && (
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>3D 매장 유동인구 히트맵</CardTitle>
                  <CardDescription>실시간 방문 패턴 시각화</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Activity className="w-3 h-3" />
                  실시간
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] bg-muted/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">3D 뷰는 Scene이 설정된 후 표시됩니다</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>일별 방문 추이</CardTitle>
              <CardDescription>
                {format(dateRange.start, 'M/d', { locale: ko })} - {format(dateRange.end, 'M/d', { locale: ko })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="displayDate" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    name="총 방문"
                  />
                  <Area
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorUnique)"
                    name="고유 방문자"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 분포</CardTitle>
              <CardDescription>
                {format(selectedDate, 'PPP', { locale: ko })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHourly ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : hourlyData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">해당 날짜의 데이터가 없습니다</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    interval={2}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="hsl(var(--primary))"
                    name="방문 수"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>상세 시간대별 데이터</CardTitle>
            <CardDescription>시간대별 방문 상세 정보</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">날짜</th>
                    <th className="text-left p-2 text-sm font-medium">시간</th>
                    <th className="text-right p-2 text-sm font-medium">방문 수</th>
                    <th className="text-right p-2 text-sm font-medium">고유 방문자</th>
                    <th className="text-right p-2 text-sm font-medium">평균 체류시간</th>
                    <th className="text-left p-2 text-sm font-medium">컨텍스트</th>
                  </tr>
                </thead>
                <tbody>
                  {footfallData.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{format(new Date(row.date), 'M/d (E)', { locale: ko })}</td>
                      <td className="p-2 text-sm">{row.hour.toString().padStart(2, '0')}:00</td>
                      <td className="p-2 text-sm text-right font-medium">{row.visit_count}</td>
                      <td className="p-2 text-sm text-right">{row.unique_visitors}</td>
                      <td className="p-2 text-sm text-right">
                        {row.avg_duration_minutes > 0 
                          ? `${Math.round(row.avg_duration_minutes)}분`
                          : '-'
                        }
                      </td>
                      <td className="p-2 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          {row.weather_condition && (
                            <Badge variant="outline" className="text-xs">
                              {row.weather_condition === 'rainy' && '🌧️'}
                              {row.weather_condition === 'sunny' && '☀️'}
                              {row.weather_condition === 'cloudy' && '☁️'}
                              {row.temperature && ` ${row.temperature}°C`}
                            </Badge>
                          )}
                          {row.is_holiday && (
                            <Badge variant="secondary" className="text-xs">
                              🎉 {row.event_name}
                            </Badge>
                          )}
                          {row.regional_traffic && (
                            <Badge variant="outline" className="text-xs">
                              📍 {row.regional_traffic.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {footfallData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        선택한 기간의 방문 데이터가 없습니다. WiFi 트래킹 데이터를 업로드해주세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FootfallAnalysisPage;
