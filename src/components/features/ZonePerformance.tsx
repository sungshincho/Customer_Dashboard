import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

const zoneData = [
  { zone: "신상품 코너", performance: 92, trend: "up", sales: "₩3,450,000", conversion: 23.5 },
  { zone: "세일 코너", performance: 88, trend: "up", sales: "₩2,980,000", conversion: 19.8 },
  { zone: "액세서리", performance: 76, trend: "down", sales: "₩1,230,000", conversion: 15.2 },
  { zone: "시착실", performance: 84, trend: "up", sales: "-", conversion: 0 },
  { zone: "입구", performance: 65, trend: "down", sales: "₩890,000", conversion: 12.1 },
  { zone: "계산대", performance: 95, trend: "up", sales: "₩8,550,000", conversion: 87.5 },
];

export function ZonePerformance() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">구역별 성과</CardTitle>
        <CardDescription>매출 및 전환율 분석</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {zoneData.map((zone, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{zone.zone}</span>
                {zone.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500 animate-float" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <span className="text-sm font-semibold text-primary">{zone.performance}점</span>
            </div>
            <Progress value={zone.performance} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>매출: {zone.sales}</span>
              {zone.conversion > 0 && <span>전환율: {zone.conversion}%</span>}
            </div>
          </div>
        ))}
        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">최고 성과 구역</p>
          <p className="text-lg font-semibold gradient-text">계산대 - 95점</p>
          <p className="text-xs text-muted-foreground mt-1">87.5% 전환율 달성</p>
        </div>
      </CardContent>
    </Card>
  );
}
