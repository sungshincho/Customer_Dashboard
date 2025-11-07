import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, MapPin } from "lucide-react";

interface ZoneData {
  zone_id: string;
  zone_name: string;
  visits: number;
  sales?: number;
  conversion_rate?: number;
  avg_dwell_time?: number;
}

interface ZoneContributionProps {
  zoneData: ZoneData[];
  totalSales: number;
}

export const ZoneContribution = ({ zoneData, totalSales }: ZoneContributionProps) => {
  // 데이터 유효성 검증
  const validZoneData = Array.isArray(zoneData) ? zoneData : [];
  
  // Zone별 매출 기여도 계산
  const sortedZones = [...validZoneData]
    .map(zone => ({
      ...zone,
      sales: zone.sales || 0,
      contribution: totalSales > 0 ? ((zone.sales || 0) / totalSales) * 100 : 0,
      conversion_rate: zone.conversion_rate || (zone.sales && zone.visits ? (zone.sales / zone.visits) * 100 : 0)
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topZones = sortedZones.slice(0, 5);
  const maxContribution = sortedZones.length > 0 ? Math.max(...sortedZones.map(z => z.contribution), 0) : 0;

  // 전체 통계
  const totalVisits = validZoneData.reduce((sum, z) => sum + (z.visits || 0), 0);
  const avgConversion = sortedZones.length > 0 
    ? sortedZones.reduce((sum, z) => sum + z.conversion_rate, 0) / sortedZones.length 
    : 0;
  const avgDwellTime = validZoneData.length > 0
    ? validZoneData.reduce((sum, z) => sum + (z.avg_dwell_time || 0), 0) / validZoneData.length
    : 0;

  return (
    <div className="space-y-4">
      {/* 핵심 메트릭 - 간결한 3열 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">총 방문</p>
            <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">평균 전환율</p>
            <p className="text-2xl font-bold text-primary">{avgConversion.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">평균 체류</p>
            <p className="text-2xl font-bold">{avgDwellTime.toFixed(0)}초</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Zone - 더 간결하게 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Top 5 매출 Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topZones.map((zone, idx) => (
            <div key={zone.zone_id} className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                    {idx + 1}
                  </Badge>
                  <span className="font-medium text-sm">{zone.zone_name || zone.zone_id}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{zone.contribution.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">₩{zone.sales.toLocaleString()}</p>
                </div>
              </div>
              <Progress value={(zone.contribution / maxContribution) * 100} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{zone.visits}회 방문</span>
                <span>전환율 {zone.conversion_rate.toFixed(1)}%</span>
                {zone.avg_dwell_time && <span>{zone.avg_dwell_time.toFixed(0)}초 체류</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 핵심 인사이트 - 2열 간결하게 */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 pb-4">
            {(() => {
              const topConversion = sortedZones.reduce((max, zone) => 
                zone.conversion_rate > (max?.conversion_rate || 0) ? zone : max
              );
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <p className="text-xs font-medium text-muted-foreground">최고 전환율</p>
                  </div>
                  <p className="text-xl font-bold mb-1">{topConversion.zone_name || topConversion.zone_id}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      {topConversion.conversion_rate.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">{topConversion.visits}회 방문</span>
                  </div>
                  <p className="text-xs text-green-600">💡 이 Zone 전략을 타 Zone에 적용</p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4 pb-4">
            {(() => {
              const lowPerformer = sortedZones
                .filter(z => z.visits > 10)
                .reduce((min, zone) => 
                  zone.conversion_rate < (min?.conversion_rate || Infinity) ? zone : min
                );
              return lowPerformer ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    <p className="text-xs font-medium text-muted-foreground">개선 필요</p>
                  </div>
                  <p className="text-xl font-bold mb-1">{lowPerformer.zone_name || lowPerformer.zone_id}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">
                      {lowPerformer.conversion_rate.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lowPerformer.visits}회 방문</span>
                  </div>
                  <p className="text-xs text-orange-600">⚠️ 레이아웃 재설계 또는 상품 재배치</p>
                </>
              ) : (
                <p className="text-muted-foreground">데이터 부족</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
