import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, DollarSign, Clock } from "lucide-react";

const storeData = [
  {
    name: "강남점",
    status: "online",
    visitors: 1456,
    sales: 12340000,
    efficiency: 92,
    lastSync: "방금 전",
  },
  {
    name: "홍대점",
    status: "online",
    visitors: 1289,
    sales: 10230000,
    efficiency: 88,
    lastSync: "1분 전",
  },
  {
    name: "명동점",
    status: "online",
    visitors: 1678,
    sales: 14560000,
    efficiency: 95,
    lastSync: "방금 전",
  },
  {
    name: "잠실점",
    status: "warning",
    visitors: 987,
    sales: 7890000,
    efficiency: 76,
    lastSync: "5분 전",
  },
  {
    name: "신촌점",
    status: "online",
    visitors: 1123,
    sales: 9450000,
    efficiency: 84,
    lastSync: "2분 전",
  },
];

export function HQStoreSync() {
  const totalVisitors = storeData.reduce((sum, s) => sum + s.visitors, 0);
  const totalSales = storeData.reduce((sum, s) => sum + s.sales, 0);
  const avgEfficiency = Math.round(storeData.reduce((sum, s) => sum + s.efficiency, 0) / storeData.length);
  const onlineStores = storeData.filter(s => s.status === "online").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "default";
      case "warning": return "secondary";
      case "offline": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">본사-매장 실시간 동기화</CardTitle>
        <CardDescription>전체 매장 통합 모니터링</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Building2 className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">온라인</p>
            <p className="text-xl font-bold gradient-text">{onlineStores}/{storeData.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 방문자</p>
            <p className="text-xl font-bold text-primary animate-glow-pulse">{totalVisitors}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <DollarSign className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 매출</p>
            <p className="text-lg font-bold gradient-text">₩{(totalSales / 10000000).toFixed(1)}억</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">평균 효율</p>
            <p className="text-xl font-bold gradient-text">{avgEfficiency}%</p>
          </div>
        </div>

        <div className="space-y-3">
          {storeData.map((store, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all bg-background/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">{store.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(store.status)} className="text-xs">
                        {store.status === "online" ? "운영중" : store.status === "warning" ? "주의" : "오프라인"}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {store.lastSync}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{store.efficiency}%</p>
                  <p className="text-xs text-muted-foreground">효율</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">방문자</p>
                    <p className="font-semibold">{store.visitors}명</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">매출</p>
                    <p className="font-semibold">₩{(store.sales / 10000).toFixed(0)}만</p>
                  </div>
                </div>
              </div>

              {store.status === "warning" && (
                <div className="mt-3 p-2 rounded bg-secondary/20 border border-secondary">
                  <p className="text-xs text-muted-foreground">⚠️ 동기화 지연 - 시스템 점검 필요</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">실시간 동기화 상태</p>
          <p className="text-sm font-medium">모든 매장 데이터 실시간 업데이트 중 ✓</p>
        </div>
      </CardContent>
    </Card>
  );
}
