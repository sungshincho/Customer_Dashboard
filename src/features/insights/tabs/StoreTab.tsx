/**
 * StoreTab.tsx
 *
 * 인사이트 허브 - 매장 탭
 * 시간대별 방문 패턴, 존별 체류시간, 피크타임 분석
 */

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
  LineChart,
  Line,
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';

const ZONE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function StoreTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();

  // 시간대별 방문 데이터
  const { data: hourlyData } = useQuery({
    queryKey: ['hourly-visits', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('hourly_metrics')
        .select('hour, visitor_count, avg_dwell_time')
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('hour');

      // 시간대별 집계
      const hourlyMap = new Map<number, { visitors: number; count: number; dwell: number }>();
      (data || []).forEach((d) => {
        const existing = hourlyMap.get(d.hour) || { visitors: 0, count: 0, dwell: 0 };
        hourlyMap.set(d.hour, {
          visitors: existing.visitors + (d.visitor_count || 0),
          count: existing.count + 1,
          dwell: existing.dwell + (d.avg_dwell_time || 0),
        });
      });

      return Array.from(hourlyMap.entries())
        .map(([hour, data]) => ({
          hour: `${hour}시`,
          visitors: Math.round(data.visitors / Math.max(data.count, 1)),
          avgDwell: Math.round(data.dwell / Math.max(data.count, 1)),
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    },
    enabled: !!selectedStore?.id,
  });

  // 존별 데이터
  const { data: zoneData } = useQuery({
    queryKey: ['zone-metrics', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('zone_metrics')
        .select('zone_name, visitor_count, avg_dwell_time, conversion_rate')
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      // 존별 집계
      const zoneMap = new Map<string, { visitors: number; dwell: number; conversion: number; count: number }>();
      (data || []).forEach((d) => {
        const existing = zoneMap.get(d.zone_name) || { visitors: 0, dwell: 0, conversion: 0, count: 0 };
        zoneMap.set(d.zone_name, {
          visitors: existing.visitors + (d.visitor_count || 0),
          dwell: existing.dwell + (d.avg_dwell_time || 0),
          conversion: existing.conversion + (d.conversion_rate || 0),
          count: existing.count + 1,
        });
      });

      return Array.from(zoneMap.entries()).map(([name, data]) => ({
        name,
        visitors: data.visitors,
        avgDwell: Math.round(data.dwell / Math.max(data.count, 1)),
        conversion: (data.conversion / Math.max(data.count, 1)).toFixed(1),
      }));
    },
    enabled: !!selectedStore?.id,
  });

  // 피크타임 계산
  const peakHour = hourlyData?.reduce(
    (max, item) => (item.visitors > (max?.visitors || 0) ? item : max),
    hourlyData[0]
  );

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
              평균 {peakHour?.visitors || 0}명 방문
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
              {zoneData?.[0]?.visitors || 0}명 방문
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
              최고 전환존
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zoneData?.sort((a, b) => parseFloat(b.conversion) - parseFloat(a.conversion))[0]?.name || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              전환율 {zoneData?.sort((a, b) => parseFloat(b.conversion) - parseFloat(a.conversion))[0]?.conversion || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 방문 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 방문 패턴</CardTitle>
          <CardDescription>시간대별 평균 방문자 수</CardDescription>
        </CardHeader>
        <CardContent>
          {hourlyData && hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" name="방문자" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
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
                데이터가 없습니다
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
                데이터가 없습니다
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
                    <td className="text-right py-3 px-4">{zone.visitors}명</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
