import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

const inventoryData = [
  { item: "원피스 A", current: 23, optimal: 50, status: "low", velocity: 8.5 },
  { item: "블라우스 B", current: 45, optimal: 40, status: "optimal", velocity: 6.2 },
  { item: "팬츠 C", current: 12, optimal: 35, status: "critical", velocity: 5.4 },
  { item: "가디건 D", current: 34, optimal: 30, status: "optimal", velocity: 4.8 },
  { item: "스커트 E", current: 67, optimal: 40, status: "overstocked", velocity: 3.2 },
  { item: "재킷 F", current: 8, optimal: 25, status: "critical", velocity: 4.1 },
];

export function InventoryOptimizer() {
  const criticalItems = inventoryData.filter(i => i.status === "critical").length;
  const optimalItems = inventoryData.filter(i => i.status === "optimal").length;
  const avgVelocity = (inventoryData.reduce((sum, i) => sum + i.velocity, 0) / inventoryData.length).toFixed(1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "low": return "secondary";
      case "optimal": return "default";
      case "overstocked": return "outline";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "optimal": return <CheckCircle className="w-4 h-4 text-primary" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">재고 최적화</CardTitle>
        <CardDescription>실시간 재고 관리 및 발주 권장</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive mb-1" />
            <p className="text-xs text-muted-foreground">긴급 발주</p>
            <p className="text-xl font-bold text-destructive">{criticalItems}개</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">최적 상태</p>
            <p className="text-xl font-bold gradient-text">{optimalItems}개</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">평균 회전율</p>
            <p className="text-xl font-bold text-primary animate-glow-pulse">{avgVelocity}일</p>
          </div>
        </div>

        <div className="space-y-4">
          {inventoryData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="font-medium">{item.item}</span>
                  <Badge variant={getStatusColor(item.status)} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
                <span className="text-sm font-semibold">
                  {item.current} / {item.optimal}
                </span>
              </div>
              <Progress value={(item.current / item.optimal) * 100} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>회전율: {item.velocity}일</span>
                {item.status === "critical" && (
                  <span className="text-destructive font-medium">즉시 발주 필요</span>
                )}
                {item.status === "low" && (
                  <span className="text-orange-500 font-medium">발주 권장</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
