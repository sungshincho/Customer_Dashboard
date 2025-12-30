/**
 * CustomerTab.tsx
 *
 * 인사이트 허브 - 고객 탭
 * 3D Glassmorphism Design + Dark Mode Support
 */

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
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

// 3D Text 스타일 (다크모드 지원)
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

export function CustomerTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  // 고객 세그먼트 데이터
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

      if (error) return [];

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

  // 재방문 추이 데이터
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

      if (error) return [];

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

  const summary = useMemo(() => {
    const totalVisitors = returnData?.reduce((sum, d) => sum + d.totalVisitors, 0) || 0;
    const totalReturning = returnData?.reduce((sum, d) => sum + d.returningVisitors, 0) || 0;
    const avgReturnRate = totalVisitors > 0 ? (totalReturning / totalVisitors) * 100 : 0;
    const totalCustomers = segmentData?.reduce((sum, s) => sum + s.count, 0) || 0;
    const topSegment = segmentData?.[0];
    const loyalCustomers = segmentData?.find(s =>
      s.name.toLowerCase().includes('vip') || s.name.includes('충성') || s.name.toLowerCase().includes('loyal')
    )?.count || 0;

    return { totalVisitors, totalCustomers, avgReturnRate, topSegment, loyalCustomers };
  }, [segmentData, returnData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Users className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>UNIQUE VISITORS</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>순 방문객</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>
              {metricsLoading ? '-' : (metrics?.uniqueVisitors ?? 0).toLocaleString()}명
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>기간 내 고유 방문자</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <UserCheck className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>REPEAT RATE</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>재방문율</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>
              {metricsLoading ? '-' : (metrics?.repeatRate ?? summary.avgReturnRate).toFixed(1)}%
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>기간 평균</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <UserPlus className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>TOP SEGMENT</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>주요 세그먼트</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{summary.topSegment?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{summary.topSegment?.count.toLocaleString() || 0}명</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Heart className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>LOYAL CUSTOMERS</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>충성 고객</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{summary.loyalCustomers.toLocaleString()}명</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>VIP/충성 세그먼트</p>
          </div>
        </Glass3DCard>
      </div>

      {/* 방문 빈도 안내 */}
      {metrics?.visitFrequency && metrics.visitFrequency > 1 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:</span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

      {/* 고객 세그먼트 분포 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>고객 세그먼트 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>세그먼트별 고객 수</p>
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
                  <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>세그먼트별 평균 구매액</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>고객 세그먼트별 평균 구매 금액</p>
            {segmentData && segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={segmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="avgValue" fill={isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'} name="평균 구매액" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* 재방문 추이 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>재방문 추이</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>신규 vs 재방문 고객 추이</p>
          {returnData && returnData.length > 0 && returnData.some(d => d.totalVisitors > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="date" tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                <Bar dataKey="newVisitors" stackId="a" fill={isDark ? 'rgba(255,255,255,0.4)' : '#6b7280'} name="신규 방문" radius={[0, 0, 0, 0]} />
                <Bar dataKey="returningVisitors" stackId="a" fill={isDark ? '#ffffff' : '#1a1a1f'} name="재방문" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={text3D.body}>해당 기간에 방문 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>

      {/* 세그먼트 상세 테이블 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>세그먼트 상세 분석</h3>
          {segmentData && segmentData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>세그먼트</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>고객 수</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>평균 구매액</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>방문 빈도</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentData?.map((segment) => (
                    <tr key={segment.name} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4">
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                          color: isDark ? '#fff' : '#1a1a1f',
                        }}>
                          {segment.name}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{segment.count.toLocaleString()}명</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>₩{segment.avgValue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{segment.frequency}회/월</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 세그먼트 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
