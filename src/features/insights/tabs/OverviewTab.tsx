/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * 3D Glassmorphism + Dark Mode Support
 * Original 4 KPI cards: Footfall, Unique Visitors, Revenue, Conversion
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  UserCheck,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Box,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';
import { AIRecommendationEffectWidget } from '@/components/dashboard/AIRecommendationEffectWidget';

// ===== 3D Text Styles (동적) =====
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.1))',
  } as React.CSSProperties,
  number: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#0a0a0c',
    textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    background: 'linear-gradient(180deg, #8a8a8f 0%, #9a9a9f 50%, #7a7a7f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500,
    color: '#515158',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,
});

// ===== Glass Card Component =====
const GlassCard = ({ 
  children, 
  dark = false, 
  className = '' 
}: { 
  children: React.ReactNode; 
  dark?: boolean; 
  className?: string;
}) => (
  <div style={{ perspective: '1200px', height: '100%' }} className={className}>
    <div
      style={{
        borderRadius: '24px',
        padding: '1.5px',
        background: dark
          ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
        boxShadow: dark
          ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
          : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02), 0 32px 32px rgba(0,0,0,0.02)',
        height: '100%',
      }}
    >
      <div
        style={{
          background: dark
            ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
            : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
          backdropFilter: 'blur(80px) saturate(200%)',
          borderRadius: '23px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: dark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: dark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
            borderRadius: '23px 23px 50% 50%',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

// ===== Icon 3D Component =====
const Icon3D = ({ 
  children, 
  size = 44, 
  dark = false 
}: { 
  children: React.ReactNode; 
  size?: number; 
  dark?: boolean;
}) => (
  <div
    style={{
      width: size,
      height: size,
      background: dark
        ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
      borderRadius: '32%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
      boxShadow: dark
        ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
        : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
      flexShrink: 0,
    }}
  >
    {!dark && (
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: '15%',
          right: '15%',
          height: '35%',
          background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '40% 40% 50% 50%',
          pointerEvents: 'none',
        }}
      />
    )}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

// ===== Badge 3D Component =====
const Badge3D = ({ 
  children, 
  dark = false 
}: { 
  children: React.ReactNode; 
  dark?: boolean;
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: dark
        ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
      borderRadius: '10px',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
      boxShadow: dark
        ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
        : '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {!dark && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
          borderRadius: '10px 10px 0 0',
          pointerEvents: 'none',
        }}
      />
    )}
    <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>{children}</span>
  </div>
);

// ===== Format Utilities =====
const formatCurrency = (value: number): string => `₩${value.toLocaleString()}원`;
const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

// ===== MetricCard Component =====
const MetricCard = ({
  icon,
  labelEn,
  label,
  value,
  subLabel,
  change,
  changeUnit = '%',
  isDark = false,
}: {
  icon: React.ReactNode;
  labelEn: string;
  label: string;
  value: string;
  subLabel?: string;
  change?: number;
  changeUnit?: string;
  isDark?: boolean;
}) => {
  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';
  
  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div>
            <p style={text3D.label}>{labelEn}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', ...text3D.body }}>{label}</p>
          </div>
          <p style={{ fontSize: '32px', margin: '12px 0 0 0', flex: 1, ...text3D.heroNumber }}>
            {value}
          </p>
          {subLabel && (
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
              {subLabel}
            </p>
          )}
          {change !== undefined && (
            <div style={{ marginTop: '12px' }}>
              <Badge3D dark={isDark}>
                {change >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#059669' }} />
                ) : change < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
                ) : (
                  <Minus className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
                )}
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: isDark 
                    ? 'rgba(255,255,255,0.9)' 
                    : (change >= 0 ? '#059669' : change < 0 ? '#dc2626' : '#6b7280')
                }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}{changeUnit}
                </span>
              </Badge3D>
            </div>
          )}
        </div>
        <Icon3D size={44} dark={isDark}>
          {icon}
        </Icon3D>
      </div>
    </GlassCard>
  );
};

// ===== Main Component =====
export function OverviewTab() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  
  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';
  
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { data: metrics, isLoading } = useInsightMetrics();
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  const topRecommendations = recommendations?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 rounded-3xl bg-white/50 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 - 표준 용어 (4개) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="FOOTFALL"
          label="총 입장"
          value={metrics?.footfall.toLocaleString() || '0'}
          subLabel="기간 내 총 입장 횟수"
          change={metrics?.changes.footfall}
          isDark={isDark}
        />
        <MetricCard
          icon={<UserCheck className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="UNIQUE VISITORS"
          label="순 방문객"
          value={metrics?.uniqueVisitors.toLocaleString() || '0'}
          subLabel={metrics?.visitFrequency ? `평균 ${metrics.visitFrequency.toFixed(1)}회 방문` : undefined}
          change={metrics?.changes.uniqueVisitors}
          isDark={isDark}
        />
        {/* Revenue - 다크모드에서 반전됨 */}
        <MetricCard
          icon={<DollarSign className="h-5 w-5" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f' }} />}
          labelEn="REVENUE"
          label="총 매출"
          value={formatCurrency(metrics?.revenue || 0)}
          subLabel={metrics?.atv ? `객단가 ${formatCurrency(metrics.atv)}` : undefined}
          change={metrics?.changes.revenue}
          isDark={isDark}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="CONVERSION"
          label="구매 전환율"
          value={formatPercent(metrics?.conversionRate || 0)}
          subLabel={`${metrics?.transactions.toLocaleString() || 0}건 거래`}
          change={metrics?.changes.conversionRate}
          changeUnit="%p"
          isDark={isDark}
        />
      </div>

      {/* 방문 빈도 안내 */}
      {metrics?.visitFrequency && metrics.visitFrequency > 1 && (
        <div className={cn(
          "p-3 rounded-lg flex items-start gap-2",
          isDark 
            ? "bg-blue-500/20 border border-blue-500/30" 
            : "bg-blue-500/10 border border-blue-500/20"
        )}>
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className={cn("text-sm", isDark ? "text-white/70" : "text-muted-foreground")}>
            <span className={cn("font-medium", isDark ? "text-white" : "text-foreground")}>
              평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:
            </span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

      {/* 고객 여정 퍼널 */}
      {metrics?.funnel && (
        <GlassCard dark={isDark}>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>고객 여정 퍼널</h3>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>
                방문 빈도 {metrics?.visitFrequency?.toFixed(1) || '0'}회
              </p>
            </div>
            
            {/* Funnel Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '120px', marginBottom: '16px' }}>
              {[
                { key: 'entry', label: 'ENTRY', value: metrics.funnel.entry, isAccent: true },
                { key: 'browse', label: 'BROWSE', value: metrics.funnel.browse, isAccent: false },
                { key: 'engage', label: 'ENGAGE', value: metrics.funnel.engage, isAccent: false },
                { key: 'fitting', label: 'FITTING', value: metrics.funnel.fitting, isAccent: false },
                { key: 'purchase', label: 'PURCHASE', value: metrics.funnel.purchase, isAccent: true },
              ].map((stage) => {
                const maxValue = metrics.funnel.entry || 1;
                const percentage = (stage.value / maxValue) * 100;
                const rate = ((stage.value / maxValue) * 100).toFixed(1);
                return (
                  <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(percentage, 8)}%`,
                          borderRadius: '8px 8px 3px 3px',
                          background: stage.isAccent
                            ? (isDark 
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'
                                : 'linear-gradient(180deg, #2c2c35 0%, #1c1c24 100%)')
                            : (isDark
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)'
                                : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,240,248,0.95) 100%)'),
                          border: stage.isAccent 
                            ? (isDark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)')
                            : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.95)'),
                          boxShadow: stage.isAccent
                            ? (isDark 
                                ? '0 2px 8px rgba(255,255,255,0.1)' 
                                : '0 4px 8px rgba(0,0,0,0.15)')
                            : (isDark 
                                ? '0 2px 4px rgba(0,0,0,0.2)' 
                                : '0 2px 4px rgba(0,0,0,0.05)'),
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '9px', marginTop: '8px', textAlign: 'center', ...text3D.label }}>{stage.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', color: isDark ? '#ffffff' : '#0a0a0c' }}>{stage.value}</p>
                    <p style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>({rate}%)</p>
                  </div>
                );
              })}
            </div>

            {/* Drop-off Alert */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
              border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: '#ef4444', fontSize: '12px' }}>!</span>
              </div>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : '#515158' }}>
                최대 이탈 구간: 입장 → 탐색
              </span>
            </div>

            {/* Final Conversion */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <span style={{ fontSize: '12px', ...text3D.body }}>최종 구매 전환율</span>
              <span style={{ fontSize: '24px', marginLeft: '12px', ...text3D.heroNumber }}>
                {metrics.funnel.entry > 0 
                  ? ((metrics.funnel.purchase / metrics.funnel.entry) * 100).toFixed(1) 
                  : '0'}%
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 목표 달성률 & AI 추천 효과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GoalProgressWidget />
        <AIRecommendationEffectWidget />
      </div>

      {/* 오늘의 AI 인사이트 */}
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Icon3D size={40} dark={isDark}>
              <Lightbulb className="h-5 w-5" style={{ color: '#eab308' }} />
            </Icon3D>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>오늘의 AI 인사이트</h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>
                AI가 분석한 주요 인사이트와 추천 액션
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topRecommendations.length > 0 ? (
              topRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    borderLeft: `4px solid ${rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#eab308' : '#3b82f6'}`,
                    background: isDark 
                      ? (rec.priority === 'high' ? 'rgba(239,68,68,0.1)' : rec.priority === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)')
                      : (rec.priority === 'high' ? 'rgba(239,68,68,0.05)' : rec.priority === 'medium' ? 'rgba(234,179,8,0.05)' : 'rgba(59,130,246,0.05)'),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#eab308' : '#3b82f6',
                          color: '#ffffff',
                        }}>
                          {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                        <span style={{ fontWeight: 600, color: isDark ? '#ffffff' : '#1a1a1f' }}>{rec.title}</span>
                      </div>
                      <p style={{ fontSize: '13px', ...text3D.body }}>{rec.description}</p>
                      {rec.expected_impact && (
                        <p style={{ fontSize: '13px', marginTop: '8px', color: '#059669', fontWeight: 500 }}>
                          예상 효과: 매출 +{rec.expected_impact.revenue_increase?.toLocaleString() || '?'}원
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                          background: 'transparent',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <BarChart3 className="h-3 w-3" />
                        분석
                      </button>
                      <button
                        onClick={() => navigate('/studio')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                          background: 'transparent',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Box className="h-3 w-3" />
                        3D
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Lightbulb className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
                </div>
                <p style={{ fontSize: '14px', ...text3D.body }}>AI 인사이트가 없습니다</p>
                <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                  데이터가 축적되면 AI가 인사이트를 생성합니다
                </p>
              </div>
            )}

            {topRecommendations.length > 0 && (
              <button
                onClick={() => navigate('/insights?tab=ai')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                모든 AI 추천 보기
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
