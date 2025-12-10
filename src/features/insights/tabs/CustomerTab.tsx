/**
 * CustomerTab.tsx
 *
 * 인사이트 허브 - 고객 탭
 * 고객 세그먼트, 재방문율, 충성도 분석
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
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  UserCheck,
  UserPlus,
  Heart,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';

const SEGMENT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function CustomerTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();

  // 고객 세그먼트 데이터
  const { data: segmentData } = useQuery({
    queryKey: ['customer-segments', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('customer_segments')
        .select('segment_name, customer_count, avg_purchase_value, visit_frequency')
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      // 세그먼트별 집계
      const segmentMap = new Map<string, { count: number; value: number; frequency: number; records: number }>();
      (data || []).forEach((d) => {
        const existing = segmentMap.get(d.segment_name) || { count: 0, value: 0, frequency: 0, records: 0 };
        segmentMap.set(d.segment_name, {
          count: existing.count + (d.customer_count || 0),
          value: existing.value + (d.avg_purchase_value || 0),
          frequency: existing.frequency + (d.visit_frequency || 0),
          records: existing.records + 1,
        });
      });

      return Array.from(segmentMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        avgValue: Math.round(data.value / Math.max(data.records, 1)),
        frequency: (data.frequency / Math.max(data.records, 1)).toFixed(1),
      }));
    },
    enabled: !!selectedStore?.id,
  });

  // 재방문 추이 데이터
  const { data: returnData } = useQuery({
    queryKey: ['return-visits', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('daily_kpis_agg')
        .select('date, total_visits, returning_visitors')
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      return (data || []).map((d) => ({
        date: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        newVisitors: (d.total_visits || 0) - (d.returning_visitors || 0),
        returningVisitors: d.returning_visitors || 0,
        returnRate: d.total_visits ? ((d.returning_visitors || 0) / d.total_visits * 100).toFixed(1) : '0',
      }));
    },
    enabled: !!selectedStore?.id,
  });

  // 요약 통계 계산
  const summary = useMemo(() => {
    const totalCustomers = segmentData?.reduce((sum, s) => sum + s.count, 0) || 0;
    const avgReturnRate = returnData?.length
      ? returnData.reduce((sum, d) => sum + parseFloat(d.returnRate), 0) / returnData.length
      : 0;
    const topSegment = segmentData?.sort((a, b) => b.count - a.count)[0];
    const loyalCustomers = segmentData?.find(s => s.name.includes('충성') || s.name.includes('VIP'))?.count || 0;

    return { totalCustomers, avgReturnRate, topSegment, loyalCustomers };
  }, [segmentData, returnData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              총 고객
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCustomers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">분석 기간 내 방문 고객</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              평균 재방문율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgReturnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">기간 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              주요 세그먼트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.topSegment?.name || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {summary.topSegment?.count.toLocaleString() || 0}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              충성 고객
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.loyalCustomers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">VIP/충성 세그먼트</p>
          </CardContent>
        </Card>
      </div>

      {/* 고객 세그먼트 분포 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>고객 세그먼트 분포</CardTitle>
            <CardDescription>세그먼트별 고객 수</CardDescription>
          </CardHeader>
          <CardContent>
            {segmentData && segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {segmentData.map((_, index) => (
                      <Cell key={index} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
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

        <Card>
          <CardHeader>
            <CardTitle>세그먼트별 평균 구매액</CardTitle>
            <CardDescription>고객 세그먼트별 평균 구매 금액</CardDescription>
          </CardHeader>
          <CardContent>
            {segmentData && segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={segmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₩${(v/1000).toFixed(0)}천`} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} />
                  <Bar dataKey="avgValue" fill="hsl(var(--chart-1))" name="평균 구매액" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 재방문 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>재방문 추이</CardTitle>
          <CardDescription>신규 vs 재방문 고객 추이</CardDescription>
        </CardHeader>
        <CardContent>
          {returnData && returnData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="newVisitors" stackId="a" fill="hsl(var(--chart-1))" name="신규 방문" />
                <Bar dataKey="returningVisitors" stackId="a" fill="hsl(var(--chart-2))" name="재방문" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 세그먼트 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>세그먼트 상세 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">세그먼트</th>
                  <th className="text-right py-3 px-4">고객 수</th>
                  <th className="text-right py-3 px-4">평균 구매액</th>
                  <th className="text-right py-3 px-4">방문 빈도</th>
                </tr>
              </thead>
              <tbody>
                {segmentData?.map((segment) => (
                  <tr key={segment.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">
                      <Badge variant="outline">{segment.name}</Badge>
                    </td>
                    <td className="text-right py-3 px-4">{segment.count.toLocaleString()}명</td>
                    <td className="text-right py-3 px-4">₩{segment.avgValue.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{segment.frequency}회/월</td>
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
