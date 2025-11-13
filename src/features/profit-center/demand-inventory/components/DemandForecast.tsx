import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EnhancedChart } from "@/components/analysis/EnhancedChart";

interface DemandForecastProps {
  visitsData?: any[];
  purchasesData?: any[];
}

export const DemandForecast = ({ visitsData = [], purchasesData = [] }: DemandForecastProps) => {
  const [weather, setWeather] = useState("clear");
  const [event, setEvent] = useState("none");
  const [day, setDay] = useState("weekday");

  // 실제 데이터 기반 예측 데이터 생성
  const data = useMemo(() => {
    const totalVisits = visitsData.length;
    const totalPurchases = purchasesData.length;
    const totalRevenue = purchasesData.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.unit_price || p.price || 0) * (parseInt(p.quantity) || 1)), 0);

    const multiplier =
      (weather === "sunny" ? 1.1 : weather === "rainy" ? 0.85 : 1) *
      (event === "sale" ? 1.3 : event === "holiday" ? 1.15 : 1) *
      (day === "weekend" ? 1.2 : 1);

    // 요일별 예측 데이터 생성
    const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];
    const baseSales = totalRevenue > 0 ? Math.round(totalRevenue / 1000) : 150;
    const baseConversion = totalVisits > 0 ? ((totalPurchases / totalVisits) * 100) : 15;

    return daysOfWeek.map((day, idx) => ({
      day,
      sales: Math.round(baseSales * (0.9 + Math.random() * 0.3) * multiplier),
      conversion: parseFloat((baseConversion * (0.85 + Math.random() * 0.3) * multiplier).toFixed(1)),
    }));
  }, [visitsData, purchasesData, weather, event, day]);

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
