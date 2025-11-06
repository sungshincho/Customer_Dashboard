import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";

const testData = [
  {
    metric: "방문자 수",
    control: 523,
    variant: 587,
    improvement: 12.2,
  },
  {
    metric: "전환율",
    control: 18.5,
    variant: 23.8,
    improvement: 28.6,
  },
  {
    metric: "평균 구매액",
    control: 89000,
    variant: 104000,
    improvement: 16.8,
  },
  {
    metric: "체류 시간",
    control: 18.2,
    variant: 22.7,
    improvement: 24.7,
  },
];

const activeTests = [
  {
    name: "세일 코너 레이아웃 변경",
    status: "진행중",
    improvement: "+23.8%",
    icon: ShoppingCart,
  },
  {
    name: "입구 디스플레이 재배치",
    status: "완료",
    improvement: "+15.2%",
    icon: Users,
  },
  {
    name: "계산대 위치 이동",
    status: "대기",
    improvement: "측정중",
    icon: DollarSign,
  },
];

export function ABTesting() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">A/B 테스트</CardTitle>
        <CardDescription>레이아웃 최적화 실험 결과</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-3">
          {activeTests.map((test, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <test.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{test.name}</p>
                  <Badge
                    variant={test.status === "진행중" ? "default" : test.status === "완료" ? "secondary" : "outline"}
                    className="mt-1"
                  >
                    {test.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">{test.improvement}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary animate-glow-pulse" />
            <p className="font-semibold gradient-text">세일 코너 레이아웃 변경 결과</p>
          </div>
          <p className="text-sm text-muted-foreground">새 레이아웃이 기존 대비 평균 23.8% 성과 개선</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={testData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "개선율") return `${value}%`;
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="control" fill="hsl(219 100% 75%)" name="기존 (Control)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="variant" fill="hsl(var(--primary))" name="변경 (Variant)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
