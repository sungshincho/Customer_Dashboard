import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const hourlyData = [
  { hour: "09:00", visitors: 45 },
  { hour: "10:00", visitors: 78 },
  { hour: "11:00", visitors: 125 },
  { hour: "12:00", visitors: 198 },
  { hour: "13:00", visitors: 167 },
  { hour: "14:00", visitors: 145 },
  { hour: "15:00", visitors: 189 },
  { hour: "16:00", visitors: 234 },
  { hour: "17:00", visitors: 267 },
  { hour: "18:00", visitors: 298 },
  { hour: "19:00", visitors: 245 },
  { hour: "20:00", visitors: 178 },
  { hour: "21:00", visitors: 89 },
];

export function PeakHours() {
  const peakHour = hourlyData.reduce((max, item) => (item.visitors > max.visitors ? item : max));

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">피크 시간대</CardTitle>
        <CardDescription>시간대별 방문자 분석</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">피크 타임</p>
          <p className="text-3xl font-bold gradient-text animate-glow-pulse">
            {peakHour.hour} - {peakHour.visitors}명
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
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
  );
}
