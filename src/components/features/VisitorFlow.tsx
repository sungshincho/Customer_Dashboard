import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const flowData = [
  { from: "입구", to: "신상품 코너", visitors: 450, percentage: 75 },
  { from: "신상품 코너", to: "세일 코너", visitors: 320, percentage: 71 },
  { from: "세일 코너", to: "계산대", visitors: 280, percentage: 87 },
  { from: "입구", to: "액세서리", visitors: 150, percentage: 25 },
  { from: "액세서리", to: "시착실", visitors: 90, percentage: 60 },
];

export function VisitorFlow() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">방문자 동선</CardTitle>
        <CardDescription>주요 이동 경로 분석</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flowData.map((flow, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all"
          >
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium">{flow.from}</span>
              <ArrowRight className="w-4 h-4 text-primary animate-float" />
              <span className="font-medium">{flow.to}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">{flow.visitors}명</p>
              <p className="text-xs text-muted-foreground">{flow.percentage}%</p>
            </div>
          </div>
        ))}
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">가장 인기있는 동선</p>
          <p className="text-lg font-semibold gradient-text">입구 → 신상품 → 세일 → 계산대</p>
        </div>
      </CardContent>
    </Card>
  );
}
