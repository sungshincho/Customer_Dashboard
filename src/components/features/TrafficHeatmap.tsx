import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from "recharts";

const heatmapData = [
  { x: 20, y: 30, value: 89, zone: "입구" },
  { x: 40, y: 50, value: 145, zone: "신상품" },
  { x: 60, y: 40, value: 234, zone: "세일" },
  { x: 30, y: 70, value: 178, zone: "계산대" },
  { x: 70, y: 60, value: 98, zone: "시착실" },
  { x: 50, y: 20, value: 156, zone: "액세서리" },
  { x: 80, y: 80, value: 67, zone: "휴게공간" },
];

const getColor = (value: number) => {
  if (value > 200) return "hsl(var(--primary))";
  if (value > 150) return "hsl(219 100% 65%)";
  if (value > 100) return "hsl(219 100% 75%)";
  return "hsl(219 100% 85%)";
};

export function TrafficHeatmap() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">매장 동선 히트맵</CardTitle>
        <CardDescription>실시간 방문자 밀집도 분석</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
            <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
            <ZAxis type="number" dataKey="value" range={[100, 1000]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card p-3 border-primary/20">
                      <p className="font-semibold text-primary">{data.zone}</p>
                      <p className="text-sm">방문자: {data.value}명</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={heatmapData}>
              {heatmapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-glow-pulse" />
            <span>고밀도 (200+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(219 100% 65%)" }} />
            <span>중밀도 (150-200)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(219 100% 75%)" }} />
            <span>일반 (100-150)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(219 100% 85%)" }} />
            <span>저밀도 (&lt;100)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
