/**
 * StoreTab.tsx
 *
 * 인사이트 허브 - 매장 탭
 * 시간대별 방문 패턴, 존별 체류시간, 피크타임 분석
 *
 * 데이터 소스:
 * - funnel_events: 시간대별 방문 패턴
 * - zone_daily_metrics: 존별 체류시간 및 방문자
 * - zones_dim: 존 정보
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Clock,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useZoneMetricsByDateRange, useZonesDim } from '@/hooks/useZoneMetrics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ZONE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function StoreTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();

  // 시간대별 방문 데이터 (funnel_events에서 entry 이벤트 집계)
  const { data: hourlyData } = useQuery({
    queryKey: ['store-hourly-visits', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('funnel_events')
        .select('event_hour')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .eq('event_type', 'entry')
        .gte('event_date', dateRange.startDate)
        .lte('event_date', dateRange.endDate);

      if (error) {
        console.error('Error fetching hourly data:', error);
        return [];
      }

      // 시간대별 집계
      const hourlyMap = new Map<number, number>();
      (data || []).forEach((d) => {
        const hour = d.event_hour || 0;
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      // 0-23시 데이터 생성
      return Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}시`,
        visitors: hourlyMap.get(hour) || 0,
      }));
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 존별 데이터 (zone_daily_metrics 테이블)
  const { data: rawZoneMetrics } = useZoneMetricsByDateRange(
    selectedStore?.id,
    dateRange.startDate,
    dateRange.endDate
  );

  // 존 정보
  const { data: zonesDim } = useZonesDim(selectedStore?.id);

  // 존별 집계 데이터
  const zoneData = useMemo(() => {
    if (!rawZoneMetrics || rawZoneMetrics.length === 0) return [];

    // zone_id별 집계
    const zoneMap = new Map<string, {
      visitors: number;
      dwell: number;
      conversion: number;
      count: number
    }>();

    rawZoneMetrics.forEach((m: any) => {
      const existing = zoneMap.get(m.zone_id) || { visitors: 0, dwell: 0, conversion: 0, count: 0 };
      zoneMap.set(m.zone_id, {
        visitors: existing.visitors + (m.total_visitors || 0),
        dwell: existing.dwell + (m.avg_dwell_seconds || 0),
        conversion: existing.conversion + (m.conversion_count || 0),
        count: existing.count + 1,
      });
    });

    // zone_id를 zone 이름으로 매핑
    const zoneNameMap = new Map(
      (zonesDim || []).map((z: any) => [z.id, z.zone_name || z.name || z.id])
    );

    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      name: zoneNameMap.get(zoneId) || zoneId.substring(0, 8),
      visitors: data.visitors,
      avgDwell: Math.round((data.dwell / Math.max(data.count, 1)) / 60), // 초 → 분 변환
      conversion: data.visitors > 0
        ? ((data.conversion / data.visitors) * 100).toFixed(1)
        : '0',
    })).sort((a, b) => b.visitors - a.visitors);
  }, [rawZoneMetrics, zonesDim]);

  // 피크타임 계산
  const peakHour = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return null;
    return hourlyData.reduce(
      (max, item) => (item.visitors > (max?.visitors || 0) ? item : max),
      hourlyData[0]
    );
  }, [hourlyData]);

  // 총 방문자 수
  const totalVisitors = useMemo(() => {
    return hourlyData?.reduce((sum, h) => sum + h.visitors, 0) || 0;
  }, [hourlyData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              피크타임
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakHour?.hour || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {peakHour?.visitors || 0}명 방문
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              인기 존
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zoneData?.[0]?.name || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {zoneData?.[0]?.visitors?.toLocaleString() || 0}명 방문
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              평균 체류시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zoneData?.length
                ? Math.round(zoneData.reduce((s, z) => s + z.avgDwell, 0) / zoneData.length)
                : 0}분
            </div>
            <p className="text-xs text-muted-foreground">전체 존 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              총 방문자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVisitors.toLocaleString()}명
            </div>
            <p className="text-xs text-muted-foreground">
              기간 내 총 방문
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 방문 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 방문 패턴</CardTitle>
          <CardDescription>시간대별 방문자 수 ({dateRange.startDate} ~ {dateRange.endDate})</CardDescription>
        </CardHeader>
        <CardContent>
          {hourlyData && hourlyData.some(h => h.visitors > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" interval={2} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" name="방문자" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              해당 기간에 방문 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 존별 성과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>존별 체류시간</CardTitle>
            <CardDescription>각 존별 평균 체류시간 (분)</CardDescription>
          </CardHeader>
          <CardContent>
            {zoneData && zoneData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={zoneData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="avgDwell" fill="hsl(var(--chart-2))" name="체류시간(분)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                존 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>존별 방문자 분포</CardTitle>
            <CardDescription>각 존별 방문자 비율</CardDescription>
          </CardHeader>
          <CardContent>
            {zoneData && zoneData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={zoneData}
                    dataKey="visitors"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {zoneData.map((_, index) => (
                      <Cell key={index} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                존 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 존별 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>존별 성과 비교</CardTitle>
        </CardHeader>
        <CardContent>
          {zoneData && zoneData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">존</th>
                    <th className="text-right py-3 px-4">방문자</th>
                    <th className="text-right py-3 px-4">체류시간</th>
                    <th className="text-right py-3 px-4">전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData?.map((zone) => (
                    <tr key={zone.name} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{zone.name}</td>
                      <td className="text-right py-3 px-4">{zone.visitors.toLocaleString()}명</td>
                      <td className="text-right py-3 px-4">{zone.avgDwell}분</td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={parseFloat(zone.conversion) > 20 ? 'default' : 'secondary'}>
                          {zone.conversion}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              해당 기간에 존 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
