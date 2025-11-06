import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, Calendar, Target } from "lucide-react";

const forecastData = [
  { date: "1/6", actual: 1234, forecast: 1180, confidence: 95 },
  { date: "1/7", actual: 1456, forecast: 1390, confidence: 94 },
  { date: "1/8", actual: 1289, forecast: 1310, confidence: 93 },
  { date: "1/9", actual: 1567, forecast: 1520, confidence: 92 },
  { date: "1/10", actual: 1678, forecast: 1640, confidence: 91 },
  { date: "1/11", actual: null, forecast: 1720, confidence: 88 },
  { date: "1/12", actual: null, forecast: 1850, confidence: 85 },
  { date: "1/13", actual: null, forecast: 1680, confidence: 82 },
];

export function DemandForecast() {
  const nextDayForecast = forecastData.find(d => d.actual === null);
  const accuracy = 94.3;

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">수요 예측</CardTitle>
        <CardDescription>AI 기반 방문자 및 매출 예측</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Calendar className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">다음 예측</p>
            <p className="text-xl font-bold gradient-text">{nextDayForecast?.forecast}명</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Target className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">예측 정확도</p>
            <p className="text-xl font-bold text-primary animate-glow-pulse">{accuracy}%</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">신뢰도</p>
            <p className="text-xl font-bold gradient-text">{nextDayForecast?.confidence}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
            />
            <Legend />
            <Bar dataKey="actual" fill="hsl(219 100% 75%)" name="실제" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="예측"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">AI 인사이트</p>
          <p className="text-sm font-medium">
            이번 주말 방문자 급증 예상 (+23%). 재고 보충 및 인력 배치 권장.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
