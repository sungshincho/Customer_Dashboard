/**
 * CustomerTab.tsx
 *
 * 인사이트 허브 - 고객 탭
 * 고객 세그먼트, 재방문율, 충성도 분석
 *
 * 데이터 소스:
 * - customer_segments_agg: 고객 세그먼트 분석
 * - daily_kpis_agg: 재방문 추이
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
  Users,
  UserCheck,
  UserPlus,
  Heart,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';
import { useInsightMetrics } from '../hooks/useInsightMetrics';

const SEGMENT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function CustomerTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();

  // 고객 세그먼트 데이터 (customer_segments_agg 테이블)
  const { data: segmentData } = useQuery({
    queryKey: ['customer-segments-agg', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('segment_name, customer_count, total_revenue, avg_transaction_value, visit_frequency')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (error) {
        console.error('Error fetching customer segments:', error);
        return [];
      }

      // 세그먼트별 집계
      const segmentMap = new Map<string, { count: number; value: number; frequency: number; records: number }>();
      (data || []).forEach((d) => {
        const existing = segmentMap.get(d.segment_name) || { count: 0, value: 0, frequency: 0, records: 0 };
        segmentMap.set(d.segment_name, {
          count: existing.count + (d.customer_count || 0),
          value: existing.value + (d.avg_transaction_value || 0),
          frequency: existing.frequency + (d.visit_frequency || 0),
          records: existing.records + 1,
        });
      });

      return Array.from(segmentMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        avgValue: Math.round(data.value / Math.max(data.records, 1)),
        frequency: (data.frequency / Math.max(data.records, 1)).toFixed(1),
      })).sort((a, b) => b.count - a.count);
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 재방문 추이 데이터 (daily_kpis_agg 테이블 - 올바르게 org_id 필터 추가)
  const { data: returnData } = useQuery({
    queryKey: ['return-visits', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('date, total_visitors, returning_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (error) {
        console.error('Error fetching return visits:', error);
        return [];
      }

      return (data || []).map((d) => ({
        date: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        totalVisitors: d.total_visitors || 0,
        newVisitors: (d.total_visitors || 0) - (d.returning_visitors || 0),
        returningVisitors: d.returning_visitors || 0,
        returnRate: d.total_visitors ? ((d.returning_visitors || 0) / d.total_visitors * 100).toFixed(1) : '0',
      }));
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 요약 통계 계산
  const summary = useMemo(() => {
    // returnData에서 총 방문자 수 계산
    const totalVisitors = returnData?.reduce((sum, d) => sum + d.totalVisitors, 0) || 0;
    const totalReturning = returnData?.reduce((sum, d) => sum + d.returningVisitors, 0) || 0;

    const avgReturnRate = totalVisitors > 0 ? (totalReturning / totalVisitors) * 100 : 0;

    // 세그먼트 데이터
    const totalCustomers = segmentData?.reduce((sum, s) => sum + s.count, 0) || 0;
    const topSegment = segmentData?.[0];
    const loyalCustomers = segmentData?.find(s =>
      s.name.toLowerCase().includes('vip') ||
      s.name.includes('충성') ||
      s.name.toLowerCase().includes('loyal')
    )?.count || 0;

    return {
      totalVisitors,
      totalCustomers,
      avgReturnRate,
      topSegment,
      loyalCustomers
    };
  }, [segmentData, returnData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Unique Visitors</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground -mt-1">순 방문객</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '-' : (metrics?.uniqueVisitors ?? 0).toLocaleString()}명
            </div>
            <p className="text-xs text-muted-foreground">기간 내 고유 방문자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Repeat Rate</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground -mt-1">재방문율</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '-' : (metrics?.repeatRate ?? summary.avgReturnRate).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">기간 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Top Segment</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground -mt-1">주요 세그먼트</p>
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
              <span className="text-[10px] text-muted-foreground uppercase">Loyal Customers</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground -mt-1">충성 고객</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.loyalCustomers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">VIP/충성 세그먼트</p>
          </CardContent>
        </Card>
      </div>

      {/* 방문 빈도 안내 */}
      {metrics?.visitFrequency && metrics.visitFrequency > 1 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:</span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

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
                세그먼트 데이터가 없습니다
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
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="avgValue" fill="hsl(var(--chart-1))" name="평균 구매액" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                세그먼트 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 재방문 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>재방문 추이</CardTitle>
          <CardDescription>신규 vs 재방문 고객 추이 ({dateRange.startDate} ~ {dateRange.endDate})</CardDescription>
        </CardHeader>
        <CardContent>
          {returnData && returnData.length > 0 && returnData.some(d => d.totalVisitors > 0) ? (
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
              해당 기간에 방문 데이터가 없습니다
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
          {segmentData && segmentData.length > 0 ? (
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              해당 기간에 세그먼트 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
