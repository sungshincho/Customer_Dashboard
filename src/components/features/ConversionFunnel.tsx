import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from "recharts";

const funnelData = [
  { name: "방문", value: 1000, fill: "hsl(219 100% 85%)" },
  { name: "상품 조회", value: 750, fill: "hsl(219 100% 75%)" },
  { name: "장바구니", value: 450, fill: "hsl(219 100% 65%)" },
  { name: "결제 시작", value: 320, fill: "hsl(219 100% 60%)" },
  { name: "구매 완료", value: 280, fill: "hsl(var(--primary))" },
];

export function ConversionFunnel() {
  const conversionRate = ((280 / 1000) * 100).toFixed(1);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">전환 퍼널</CardTitle>
        <CardDescription>방문부터 구매까지의 고객 여정</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">전체 전환율</p>
          <p className="text-3xl font-bold gradient-text animate-glow-pulse">{conversionRate}%</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / 1000) * 100).toFixed(1);
                  return (
                    <div className="glass-card p-3 border-primary/20">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">방문자: {data.value}명</p>
                      <p className="text-sm text-primary">{percentage}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Funnel dataKey="value" data={funnelData}>
              <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
