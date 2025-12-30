/**
 * StoreTab.tsx
 *
 * 인사이트 허브 - 매장 탭
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
  Clock,
  MapPin,
  Users,
  Radio,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useZoneMetricsByDateRange, useZonesDim } from '@/hooks/useZoneMetrics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { formatDuration } from '../components';

const ZONE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

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

export function StoreTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics } = useInsightMetrics();
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

  // 시간대별 방문 데이터
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

      if (error) return [];

      const hourlyMap = new Map<number, number>();
      (data || []).forEach((d) => {
        const hour = d.event_hour || 0;
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      return Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}시`,
        visitors: hourlyMap.get(hour) || 0,
      }));
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 존별 데이터
  const { data: rawZoneMetrics } = useZoneMetricsByDateRange(
    selectedStore?.id,
    dateRange.startDate,
    dateRange.endDate
  );
  const { data: zonesDim } = useZonesDim(selectedStore?.id);

  const zoneData = useMemo(() => {
    if (!rawZoneMetrics || rawZoneMetrics.length === 0) return [];

    const zoneMap = new Map<string, { visitors: number; dwell: number; conversion: number; count: number }>();
    rawZoneMetrics.forEach((m: any) => {
      const existing = zoneMap.get(m.zone_id) || { visitors: 0, dwell: 0, conversion: 0, count: 0 };
      zoneMap.set(m.zone_id, {
        visitors: existing.visitors + (m.total_visitors || 0),
        dwell: existing.dwell + (m.avg_dwell_seconds || 0),
        conversion: existing.conversion + (m.conversion_count || 0),
        count: existing.count + 1,
      });
    });

    const zoneNameMap = new Map(
      (zonesDim || []).map((z: any) => [z.id, z.zone_name || z.name || z.id])
    );

    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      name: zoneNameMap.get(zoneId) || zoneId.substring(0, 8),
      visitors: data.visitors,
      avgDwell: Math.round((data.dwell / Math.max(data.count, 1)) / 60),
      conversion: data.visitors > 0 ? ((data.conversion / data.visitors) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.visitors - a.visitors);
  }, [rawZoneMetrics, zonesDim]);

  const peakHour = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return null;
    return hourlyData.reduce((max, item) => (item.visitors > (max?.visitors || 0) ? item : max), hourlyData[0]);
  }, [hourlyData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Clock className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>PEAK TIME</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>피크타임</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{peakHour?.hour || '0시'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{peakHour?.visitors || 0}명 방문</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <MapPin className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>POPULAR ZONE</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>인기 존</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{zoneData?.[0]?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{zoneData?.[0]?.visitors?.toLocaleString() || 0}회 방문</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Users className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>AVG DWELL TIME</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>평균 체류시간</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>
              {metrics?.avgDwellTime ? formatDuration(metrics.avgDwellTime) :
                (zoneData?.length ? `${Math.round(zoneData.reduce((s, z) => s + z.avgDwell, 0) / zoneData.length)}분` : '0분')}
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>전체 존 평균</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Radio className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>TRACKING COVERAGE</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>센서 커버율</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{metrics?.trackingCoverage?.toFixed(1) || '0'}%</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{metrics?.trackedVisitors?.toLocaleString() || 0}명 추적</p>
          </div>
        </Glass3DCard>
      </div>

      {/* 센서 커버율 안내 */}
      {metrics?.trackedVisitors && metrics.uniqueVisitors > 0 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            존 분석은 센서 감지 방문객 <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{metrics.trackedVisitors.toLocaleString()}명</span> 기준
            (전체 {metrics.uniqueVisitors.toLocaleString()}명의 <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{metrics.trackingCoverage.toFixed(0)}%</span>)
          </p>
        </div>
      )}

      {/* 시간대별 방문 패턴 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>시간대별 방문 패턴</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>시간대별 입장 횟수</p>
          {hourlyData && hourlyData.some(h => h.visitors > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="hour" interval={2} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                <Bar dataKey="visitors" fill={isDark ? '#ffffff' : '#1a1a1f'} name="방문자" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={text3D.body}>
              해당 기간에 방문 데이터가 없습니다
            </div>
          )}
        </div>
      </Glass3DCard>

      {/* 존별 성과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>존별 체류시간</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>각 존별 평균 체류시간 (분)</p>
            {zoneData && zoneData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={zoneData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis type="number" tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="avgDwell" fill={isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'} name="체류시간(분)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>존 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>존별 방문자 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>각 존별 방문자 비율</p>
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
                  <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>존 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* 존별 상세 테이블 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>존별 성과 비교</h3>
          {zoneData && zoneData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>존</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>방문자</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>체류시간</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData?.map((zone) => (
                    <tr key={zone.name} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{zone.name}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{zone.visitors.toLocaleString()}명</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{zone.avgDwell}분</td>
                      <td className="text-right py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: parseFloat(zone.conversion) > 20 ? (isDark ? 'rgba(255,255,255,0.2)' : '#1a1a1f') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                          color: parseFloat(zone.conversion) > 20 ? (isDark ? '#fff' : '#fff') : (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'),
                        }}>
                          {zone.conversion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 존 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
