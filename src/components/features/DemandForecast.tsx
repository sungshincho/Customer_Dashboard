import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EnhancedChart } from "@/components/analysis/EnhancedChart";

const generateForecast = (weather: string, event: string, day: string) => {
  const baseData = [
    { day: "월", sales: 100, conversion: 3.5 },
    { day: "화", sales: 95, conversion: 3.2 },
    { day: "수", sales: 110, conversion: 3.8 },
    { day: "목", sales: 105, conversion: 3.6 },
    { day: "금", sales: 130, conversion: 4.2 },
    { day: "토", sales: 180, conversion: 5.5 },
    { day: "일", sales: 165, conversion: 5.1 },
  ];

  const multiplier =
    (weather === "sunny" ? 1.1 : weather === "rainy" ? 0.85 : 1) *
    (event === "sale" ? 1.3 : event === "holiday" ? 1.15 : 1) *
    (day === "weekend" ? 1.2 : 1);

  return baseData.map((d) => ({
    ...d,
    sales: Math.round(d.sales * multiplier),
    conversion: parseFloat((d.conversion * multiplier).toFixed(1)),
  }));
};

export const DemandForecast = () => {
  const [weather, setWeather] = useState("clear");
  const [event, setEvent] = useState("none");
  const [day, setDay] = useState("weekday");

  const data = generateForecast(weather, event, day);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const avgConversion = (data.reduce((sum, d) => sum + d.conversion, 0) / data.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">날씨</Label>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunny">맑음 ☀️</SelectItem>
              <SelectItem value="clear">흐림 ⛅</SelectItem>
              <SelectItem value="rainy">비 🌧️</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">이벤트</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="sale">세일 🎉</SelectItem>
              <SelectItem value="holiday">공휴일 🎊</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">요일</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekday">평일</SelectItem>
              <SelectItem value="weekend">주말</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">예상 주간 매출</div>
          <div className="text-4xl font-bold gradient-text">₩{totalSales.toLocaleString()}k</div>
        </Card>
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">평균 전환율</div>
          <div className="text-4xl font-bold gradient-text">{avgConversion}%</div>
        </Card>
      </div>

      {/* Chart */}
      <EnhancedChart
        data={data}
        title="매출 및 전환율 예측"
        defaultChartType="line"
        xAxisKey="day"
        yAxisKeys={[
          { key: "sales", name: "매출 (₩k)", color: "hsl(var(--primary))" },
          { key: "conversion", name: "전환율 (%)", color: "hsl(var(--secondary))" }
        ]}
      />
    </div>
  );
};
