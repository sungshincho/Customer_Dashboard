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
  // Zone별 매출 기여도 계산
  const sortedZones = [...zoneData]
    .map(zone => ({
      ...zone,
      sales: zone.sales || 0,
      contribution: totalSales > 0 ? ((zone.sales || 0) / totalSales) * 100 : 0,
      conversion_rate: zone.conversion_rate || (zone.sales && zone.visits ? (zone.sales / zone.visits) * 100 : 0)
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topZones = sortedZones.slice(0, 5);
  const maxContribution = Math.max(...sortedZones.map(z => z.contribution));

  // 전체 통계
  const totalVisits = zoneData.reduce((sum, z) => sum + z.visits, 0);
  const avgConversion = sortedZones.reduce((sum, z) => sum + z.conversion_rate, 0) / sortedZones.length;
  const avgDwellTime = zoneData.reduce((sum, z) => sum + (z.avg_dwell_time || 0), 0) / zoneData.length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zone별 매출 기여도
          </CardTitle>
          <CardDescription>
            각 Zone의 매출 기여도, 전환율, 방문 빈도 분석
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-background/50 rounded-lg border">
              <p className="text-muted-foreground mb-1">총 방문 수</p>
              <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border">
              <p className="text-muted-foreground mb-1">평균 전환율</p>
              <p className="text-2xl font-bold">{avgConversion.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border">
              <p className="text-muted-foreground mb-1">평균 체류시간</p>
              <p className="text-2xl font-bold">{avgDwellTime.toFixed(0)}초</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 매출 기여 Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topZones.map((zone, idx) => (
            <div key={zone.zone_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">
                    {idx + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{zone.zone_name || zone.zone_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.visits}회 방문
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {zone.contribution.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₩{zone.sales.toLocaleString()}
                  </p>
                </div>
              </div>
              <Progress 
                value={(zone.contribution / maxContribution) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>전환율: {zone.conversion_rate.toFixed(1)}%</span>
                </div>
                {zone.avg_dwell_time && (
                  <span className="text-muted-foreground">
                    체류: {zone.avg_dwell_time.toFixed(0)}초
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              최고 전환율 Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const topConversion = sortedZones.reduce((max, zone) => 
                zone.conversion_rate > (max?.conversion_rate || 0) ? zone : max
              );
              return (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{topConversion.zone_name || topConversion.zone_id}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {topConversion.conversion_rate.toFixed(1)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {topConversion.visits}회 방문
                    </span>
                  </div>
                  <p className="text-sm text-primary">
                    💡 이 Zone의 전략을 다른 Zone에도 적용하세요
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              개선 필요 Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const lowPerformer = sortedZones
                .filter(z => z.visits > 10) // 방문 수가 충분한 Zone만
                .reduce((min, zone) => 
                  zone.conversion_rate < (min?.conversion_rate || Infinity) ? zone : min
                );
              return lowPerformer ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{lowPerformer.zone_name || lowPerformer.zone_id}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {lowPerformer.conversion_rate.toFixed(1)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {lowPerformer.visits}회 방문
                    </span>
                  </div>
                  <p className="text-sm text-orange-600">
                    ⚠️ 레이아웃 개선 또는 상품 재배치 검토 필요
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">데이터 부족</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">전체 Zone 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedZones.map((zone) => (
              <div 
                key={zone.zone_id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{zone.zone_name || zone.zone_id}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      방문 {zone.visits}회
                    </span>
                    <span className="text-xs text-muted-foreground">
                      전환 {zone.conversion_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {zone.contribution.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₩{zone.sales.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
