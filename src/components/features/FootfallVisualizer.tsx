import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, Users, Clock } from "lucide-react";

const footfallData = [
  { time: "09:00", weekday: 45, weekend: 78 },
  { time: "10:00", weekday: 78, weekend: 125 },
  { time: "11:00", weekday: 125, weekend: 198 },
  { time: "12:00", weekday: 198, weekend: 267 },
  { time: "13:00", weekday: 167, weekend: 234 },
  { time: "14:00", weekday: 145, weekend: 189 },
  { time: "15:00", weekday: 189, weekend: 245 },
  { time: "16:00", weekday: 234, weekend: 312 },
  { time: "17:00", weekday: 267, weekend: 356 },
  { time: "18:00", weekday: 298, weekend: 389 },
  { time: "19:00", weekday: 245, weekend: 298 },
  { time: "20:00", weekday: 178, weekend: 234 },
  { time: "21:00", weekday: 89, weekend: 156 },
];

export function FootfallVisualizer() {
  const avgWeekday = Math.round(footfallData.reduce((sum, d) => sum + d.weekday, 0) / footfallData.length);
  const avgWeekend = Math.round(footfallData.reduce((sum, d) => sum + d.weekend, 0) / footfallData.length);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">방문객 유입 시각화</CardTitle>
        <CardDescription>평일/주말 방문자 패턴 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">평일 평균</p>
            <p className="text-xl font-bold gradient-text">{avgWeekday}명</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">주말 평균</p>
            <p className="text-xl font-bold gradient-text">{avgWeekend}명</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Clock className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">증가율</p>
            <p className="text-xl font-bold text-primary animate-glow-pulse">
              +{Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100)}%
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={footfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
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
            <Line
              type="monotone"
              dataKey="weekday"
              stroke="hsl(219 100% 75%)"
              strokeWidth={2}
              dot={{ fill: "hsl(219 100% 75%)", r: 4 }}
              name="평일"
            />
            <Line
              type="monotone"
              dataKey="weekend"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="주말"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
