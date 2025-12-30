/**
 * CustomerTab.tsx
 *
 * 인사이트 허브 - 고객 탭
 * 3D Metallic Glassmorphism Design + Dark Mode Support
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

// 메탈릭 무채색 컬러 팔레트 (다크모드)
const METALLIC_COLORS_DARK = [
  'url(#metallicGradient1)',
  'url(#metallicGradient2)',
  'url(#metallicGradient3)',
  'url(#metallicGradient4)',
  'url(#metallicGradient5)',
];

// 메탈릭 무채색 컬러 팔레트 (라이트모드)
const METALLIC_COLORS_LIGHT = [
  'url(#metallicGradientLight1)',
  'url(#metallicGradientLight2)',
  'url(#metallicGradientLight3)',
  'url(#metallicGradientLight4)',
  'url(#metallicGradientLight5)',
];

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

// 메탈릭 그라데이션 SVG 정의
const MetallicGradients = ({ isDark }: { isDark: boolean }) => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      {/* 다크모드 메탈릭 그라데이션 */}
      <linearGradient id="metallicGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8e8e8" />
        <stop offset="30%" stopColor="#d0d0d0" />
        <stop offset="50%" stopColor="#f5f5f5" />
        <stop offset="70%" stopColor="#c8c8c8" />
        <stop offset="100%" stopColor="#b0b0b0" />
      </linearGradient>
      <linearGradient id="metallicGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#a8a8a8" />
        <stop offset="30%" stopColor="#909090" />
        <stop offset="50%" stopColor="#b8b8b8" />
        <stop offset="70%" stopColor="#888888" />
        <stop offset="100%" stopColor="#707070" />
      </linearGradient>
      <linearGradient id="metallicGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#787878" />
        <stop offset="30%" stopColor="#606060" />
        <stop offset="50%" stopColor="#888888" />
        <stop offset="70%" stopColor="#585858" />
        <stop offset="100%" stopColor="#484848" />
      </linearGradient>
      <linearGradient id="metallicGradient4" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#585858" />
        <stop offset="30%" stopColor="#404040" />
        <stop offset="50%" stopColor="#686868" />
        <stop offset="70%" stopColor="#383838" />
        <stop offset="100%" stopColor="#282828" />
      </linearGradient>
      <linearGradient id="metallicGradient5" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#404040" />
        <stop offset="30%" stopColor="#282828" />
        <stop offset="50%" stopColor="#505050" />
        <stop offset="70%" stopColor="#202020" />
        <stop offset="100%" stopColor="#181818" />
      </linearGradient>
      
      {/* 라이트모드 메탈릭 그라데이션 */}
      <linearGradient id="metallicGradientLight1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="30%" stopColor="#2a2a2a" />
        <stop offset="50%" stopColor="#0f0f0f" />
        <stop offset="70%" stopColor="#333333" />
        <stop offset="100%" stopColor="#404040" />
      </linearGradient>
      <linearGradient id="metallicGradientLight2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#404040" />
        <stop offset="30%" stopColor="#505050" />
        <stop offset="50%" stopColor="#353535" />
        <stop offset="70%" stopColor="#585858" />
        <stop offset="100%" stopColor="#606060" />
      </linearGradient>
      <linearGradient id="metallicGradientLight3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#606060" />
        <stop offset="30%" stopColor="#707070" />
        <stop offset="50%" stopColor="#555555" />
        <stop offset="70%" stopColor="#787878" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
      <linearGradient id="metallicGradientLight4" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#808080" />
        <stop offset="30%" stopColor="#909090" />
        <stop offset="50%" stopColor="#757575" />
        <stop offset="70%" stopColor="#989898" />
        <stop offset="100%" stopColor="#a0a0a0" />
      </linearGradient>
      <linearGradient id="metallicGradientLight5" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#a0a0a0" />
        <stop offset="30%" stopColor="#b0b0b0" />
        <stop offset="50%" stopColor="#959595" />
        <stop offset="70%" stopColor="#b8b8b8" />
        <stop offset="100%" stopColor="#c0c0c0" />
      </linearGradient>

      {/* 바 차트용 메탈릭 그라데이션 */}
      <linearGradient id="barMetallicDark" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#909090" />
        <stop offset="20%" stopColor="#c0c0c0" />
        <stop offset="40%" stopColor="#e0e0e0" />
        <stop offset="60%" stopColor="#f0f0f0" />
        <stop offset="80%" stopColor="#d0d0d0" />
        <stop offset="100%" stopColor="#a0a0a0" />
      </linearGradient>
      <linearGradient id="barMetallicDarkSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#505050" />
        <stop offset="20%" stopColor="#686868" />
        <stop offset="40%" stopColor="#808080" />
        <stop offset="60%" stopColor="#909090" />
        <stop offset="80%" stopColor="#707070" />
        <stop offset="100%" stopColor="#585858" />
      </linearGradient>
      <linearGradient id="barMetallicLight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#505050" />
        <stop offset="20%" stopColor="#353535" />
        <stop offset="40%" stopColor="#1a1a1a" />
        <stop offset="60%" stopColor="#0a0a0a" />
        <stop offset="80%" stopColor="#252525" />
        <stop offset="100%" stopColor="#404040" />
      </linearGradient>
      <linearGradient id="barMetallicLightSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#909090" />
        <stop offset="20%" stopColor="#787878" />
        <stop offset="40%" stopColor="#606060" />
        <stop offset="60%" stopColor="#505050" />
        <stop offset="80%" stopColor="#686868" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>

      {/* 글로시 하이라이트 필터 */}
      <filter id="glossy" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
        <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
      </filter>
    </defs>
  </svg>
);

// 커스텀 3D 파이 차트 라벨
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, isDark }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text 
      x={x} 
      y={y} 
      fill={isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1a'}
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      style={{ 
        fontSize: '12px', 
        fontWeight: 600,
        textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 1px rgba(255,255,255,0.8)'
      }}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// 커스텀 3D 툴팁
const Custom3DTooltip = ({ active, payload, label, isDark, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: isDark
            ? 'linear-gradient(165deg, rgba(40,40,45,0.98) 0%, rgba(25,25,30,0.97) 50%, rgba(35,35,40,0.98) 100%)'
            : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(245,245,248,0.97) 50%, rgba(255,255,255,0.98) 100%)',
          border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <p style={{ 
          color: isDark ? '#fff' : '#1a1a1a', 
          fontWeight: 600, 
          marginBottom: '4px',
          fontSize: '13px'
        }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ 
            color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280',
            fontSize: '12px'
          }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const metallicColors = isDark ? METALLIC_COLORS_DARK : METALLIC_COLORS_LIGHT;

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
        date: new Date(d.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }).replace('.', '월 ').replace('.', '일'),
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
      {/* 메탈릭 그라데이션 정의 */}
      <MetallicGradients isDark={isDark} />

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

      {/* 고객 세그먼트 분포 - 3D 메탈릭 파이차트 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>고객 세그먼트 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>세그먼트별 고객 수</p>
            {segmentData && segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    {/* 3D 효과를 위한 그림자 필터 */}
                    <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)"} />
                    </filter>
                  </defs>
                  <Pie
                    data={segmentData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={35}
                    paddingAngle={2}
                    label={(props) => renderCustomLabel({ ...props, isDark })}
                    labelLine={{ stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', strokeWidth: 1 }}
                    style={{ filter: 'url(#pieShadow)' }}
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    strokeWidth={1}
                  >
                    {segmentData.map((_, index) => (
                      <Cell 
                        key={index} 
                        fill={metallicColors[index % metallicColors.length]}
                        style={{ 
                          filter: 'url(#glossy)',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<Custom3DTooltip isDark={isDark} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>

        {/* 세그먼트별 평균 구매액 - 3D 메탈릭 바차트 */}
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>세그먼트별 평균 구매액</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>고객 세그먼트별 평균 구매 금액</p>
            {segmentData && segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={segmentData} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <filter id="barShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor={isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"} />
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `₩${(v/10000).toFixed(0)}만`} 
                    tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={70} 
                    tick={{ fill: isDark ? 'rgba(255,255,255,0.7)' : '#4b5563', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: 'transparent' }}
                    tickLine={{ stroke: 'transparent' }}
                  />
                  <Tooltip content={<Custom3DTooltip isDark={isDark} formatter={(v: number) => formatCurrency(v)} />} />
                  <Bar 
                    dataKey="avgValue" 
                    fill={isDark ? 'url(#barMetallicDark)' : 'url(#barMetallicLight)'} 
                    name="평균 구매액" 
                    radius={[0, 6, 6, 0]}
                    style={{ filter: 'url(#barShadow)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* 재방문 추이 - 3D 메탈릭 스택 바차트 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>재방문 추이</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>신규 vs 재방문 고객 추이</p>
          {returnData && returnData.length > 0 && returnData.some(d => d.totalVisitors > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={returnData} barCategoryGap="15%">
                <defs>
                  <filter id="stackBarShadow" x="-5%" y="-5%" width="110%" height="115%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor={isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)"} />
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  tickLine={{ stroke: 'transparent' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: 'transparent' }}
                  tickLine={{ stroke: 'transparent' }}
                />
                <Tooltip content={<Custom3DTooltip isDark={isDark} />} />
                <Bar 
                  dataKey="newVisitors" 
                  stackId="a" 
                  fill={isDark ? 'url(#barMetallicDarkSecondary)' : 'url(#barMetallicLightSecondary)'} 
                  name="신규 방문" 
                  radius={[0, 0, 0, 0]}
                  style={{ filter: 'url(#stackBarShadow)' }}
                />
                <Bar 
                  dataKey="returningVisitors" 
                  stackId="a" 
                  fill={isDark ? 'url(#barMetallicDark)' : 'url(#barMetallicLight)'} 
                  name="재방문" 
                  radius={[4, 4, 0, 0]}
                  style={{ filter: 'url(#stackBarShadow)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center" style={text3D.body}>해당 기간에 방문 데이터가 없습니다</div>
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
