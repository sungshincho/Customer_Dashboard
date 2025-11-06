import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutGrid, TrendingUp, Users, DollarSign } from "lucide-react";

const layoutOptions = [
  {
    name: "현재 레이아웃",
    type: "current",
    traffic: 1234,
    conversion: 18.6,
    revenue: 8450000,
    score: 78,
  },
  {
    name: "AI 추천 레이아웃 A",
    type: "recommended",
    traffic: 1456,
    conversion: 23.2,
    revenue: 10230000,
    score: 92,
    improvements: ["+18% 방문자", "+24.7% 전환율", "+21% 매출"],
  },
  {
    name: "AI 추천 레이아웃 B",
    type: "recommended",
    traffic: 1389,
    conversion: 21.5,
    revenue: 9680000,
    score: 87,
    improvements: ["+12.5% 방문자", "+15.6% 전환율", "+14.5% 매출"],
  },
];

export function LayoutSimulator() {
  const bestLayout = layoutOptions.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">매장 레이아웃 시뮬레이터</CardTitle>
        <CardDescription>AI 기반 최적 배치 시뮬레이션</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary animate-glow-pulse" />
            <p className="font-semibold gradient-text">AI 최고 추천</p>
          </div>
          <p className="text-sm text-muted-foreground">{bestLayout.name} - {bestLayout.score}점</p>
          <p className="text-xs text-muted-foreground mt-1">
            예상 매출 증가: ₩{((bestLayout.revenue - layoutOptions[0].revenue) / 10000).toFixed(0)}만원
          </p>
        </div>

        <div className="space-y-4">
          {layoutOptions.map((layout, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all ${
                layout.type === "current"
                  ? "bg-background/50 border-border/50"
                  : "bg-primary/5 border-primary/20 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{layout.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={layout.type === "current" ? "secondary" : "default"}>
                    {layout.score}점
                  </Badge>
                  {layout.type === "recommended" && (
                    <Badge variant="outline" className="text-primary border-primary">
                      AI 추천
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">방문자</p>
                    <p className="text-sm font-semibold">{layout.traffic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">전환율</p>
                    <p className="text-sm font-semibold">{layout.conversion}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">매출</p>
                    <p className="text-sm font-semibold">₩{(layout.revenue / 10000).toFixed(0)}만</p>
                  </div>
                </div>
              </div>

              {layout.improvements && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {layout.improvements.map((improvement, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {improvement}
                    </Badge>
                  ))}
                </div>
              )}

              {layout.type === "recommended" && (
                <Button size="sm" className="w-full">
                  시뮬레이션 상세보기
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
