import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const dwellData = [
  { zone: "입구", avgTime: 2.5, maxTime: 8 },
  { zone: "신상품", avgTime: 12.3, maxTime: 45 },
  { zone: "세일", avgTime: 15.7, maxTime: 60 },
  { zone: "시착실", avgTime: 8.4, maxTime: 25 },
  { zone: "계산대", avgTime: 5.2, maxTime: 15 },
  { zone: "액세서리", avgTime: 6.8, maxTime: 20 },
];

export function DwellTime() {
  const totalAvg = (dwellData.reduce((sum, d) => sum + d.avgTime, 0) / dwellData.length).toFixed(1);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">체류 시간 분석</CardTitle>
        <CardDescription>구역별 평균 체류 시간 (분)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">전체 평균 체류시간</p>
          <p className="text-3xl font-bold gradient-text animate-glow-pulse">{totalAvg}분</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dwellData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="zone" stroke="hsl(var(--muted-foreground))" />
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
            <Bar dataKey="avgTime" fill="hsl(var(--primary))" name="평균 시간" radius={[8, 8, 0, 0]} />
            <Bar dataKey="maxTime" fill="hsl(219 100% 75%)" name="최대 시간" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
