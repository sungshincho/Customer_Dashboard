/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * 3D Glassmorphism + Bento Grid Layout + Dark Mode Support
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
  Target,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';

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

// Revenue 카드용 (항상 다크)
const darkCardText = {
  heroNumber: {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  label: {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties,
  body: {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties,
};

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

// ===== Compact Stat Card =====
const CompactStatCard = ({ 
  label, 
  labelEn, 
  value, 
  icon: IconComponent,
  isCenter = false,
  isDark = false,
}: { 
  label: string;
  labelEn: string;
  value: string;
  icon: React.ReactNode;
  isCenter?: boolean;
  isDark?: boolean;
}) => {
  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';
  
  return (
    <GlassCard dark={isDark}>
      <div style={{ 
        padding: isCenter ? '20px' : '16px 20px', 
        display: 'flex', 
        flexDirection: isCenter ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isCenter ? 'center' : 'space-between',
        height: '100%',
        textAlign: isCenter ? 'center' : 'left',
      }}>
        {isCenter ? (
          <>
            <Icon3D size={48} dark={isDark}>
              {IconComponent}
            </Icon3D>
            <p style={{ fontSize: '9px', marginTop: '12px', ...text3D.label }}>{labelEn}</p>
            <p style={{ fontSize: '36px', margin: '4px 0', ...text3D.heroNumber }}>{value}</p>
            <p style={{ fontSize: '12px', ...text3D.body }}>{label}</p>
          </>
        ) : (
          <>
            <div>
              <p style={{ fontSize: '9px', margin: 0, ...text3D.label }}>{labelEn}</p>
              <p style={{ fontSize: '28px', margin: '4px 0 2px 0', ...text3D.heroNumber }}>{value}</p>
              <p style={{ fontSize: '12px', margin: 0, ...text3D.body }}>{label}</p>
            </div>
            <Icon3D size={40} dark={isDark}>
              {IconComponent}
            </Icon3D>
          </>
        )}
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
  const { data: metrics, isLoading } = useInsightMetrics();
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  const topRecommendations = recommendations?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="col-span-3 animate-pulse">
            <div className="h-40 rounded-3xl bg-white/50 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  const funnel = metrics?.funnel || { entry: 0, browse: 0, engage: 0, fitting: 0, purchase: 0 };
  const maxFunnelValue = funnel.entry || 1;

  return (
    <div className="space-y-5">
      {/* ===== Bento Grid ===== */}
      <div 
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
      >
        {/* Row 1: Quick Stats */}
        <div style={{ gridColumn: 'span 2' }}>
          <CompactStatCard
            labelEn="TODAY"
            label="오늘 방문"
            value="892"
            icon={<span style={{ fontSize: '18px', color: iconColor }}>◈</span>}
            isCenter={true}
            isDark={isDark}
          />
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <CompactStatCard
            labelEn="AVG. STAY TIME"
            label="평균 체류 시간"
            value="12:34"
            icon={<Clock className="h-5 w-5" style={{ color: iconColor }} />}
            isDark={isDark}
          />
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <CompactStatCard
            labelEn="PEAK HOUR"
            label="피크 타임"
            value="14:00"
            icon={<BarChart3 className="h-5 w-5" style={{ color: iconColor }} />}
            isDark={isDark}
          />
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <CompactStatCard
            labelEn="ACTIVE ZONES"
            label="활성 구역"
            value="12"
            icon={<Target className="h-5 w-5" style={{ color: iconColor }} />}
            isDark={isDark}
          />
        </div>

        {/* Row 2-3: Main KPIs */}
        {/* Footfall - Large Card */}
        <div style={{ gridColumn: 'span 3', gridRow: 'span 2' }}>
          <GlassCard dark={isDark}>
            <div style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <Icon3D size={48} dark={isDark}>
                  <Users className="h-6 w-6" style={{ color: iconColor }} />
                </Icon3D>
                <div>
                  <p style={text3D.label}>FOOTFALL</p>
                  <p style={{ fontSize: '14px', margin: '2px 0 0 0', ...text3D.body }}>총 입장</p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '48px', display: 'block', lineHeight: 1, ...text3D.heroNumber }}>
                  {metrics?.footfall.toLocaleString() || '0'}
                </span>
                <p style={{ fontSize: '13px', marginTop: '16px', ...text3D.body }}>
                  기간 내 총 입장 횟수
                </p>
              </div>
              {metrics?.changes.footfall !== undefined && (
                <Badge3D dark={isDark}>
                  {metrics.changes.footfall >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#059669' }} />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.9)' : (metrics.changes.footfall >= 0 ? '#059669' : '#dc2626') }}>
                    전주 대비 {metrics.changes.footfall >= 0 ? '+' : ''}{metrics.changes.footfall.toFixed(1)}%
                  </span>
                </Badge3D>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Unique Visitors */}
        <div style={{ gridColumn: 'span 3' }}>
          <GlassCard dark={isDark}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={text3D.label}>UNIQUE VISITORS</p>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0', ...text3D.body }}>순 방문객</p>
                <p style={{ fontSize: '32px', margin: '12px 0 0 0', ...text3D.heroNumber }}>
                  {metrics?.uniqueVisitors.toLocaleString() || '0'}
                </p>
                <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
                  {metrics?.visitFrequency ? `평균 ${metrics.visitFrequency.toFixed(1)}회 방문` : ''}
                </p>
                {metrics?.changes.uniqueVisitors !== undefined && (
                  <div style={{ marginTop: '12px' }}>
                    <Badge3D dark={isDark}>
                      <Minus className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>
                        {metrics.changes.uniqueVisitors.toFixed(1)}%
                      </span>
                    </Badge3D>
                  </div>
                )}
              </div>
              <Icon3D size={44} dark={isDark}>
                <UserCheck className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
            </div>
          </GlassCard>
        </div>

        {/* Revenue - Always Dark Card */}
        <div style={{ gridColumn: 'span 3', gridRow: 'span 2' }}>
          <GlassCard dark>
            <div style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <Icon3D size={48} dark>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>₩</span>
                </Icon3D>
                <div>
                  <p style={darkCardText.label}>REVENUE</p>
                  <p style={{ fontSize: '14px', margin: '2px 0 0 0', ...darkCardText.body }}>총 매출</p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '32px', display: 'block', lineHeight: 1.2, ...darkCardText.heroNumber }}>
                  {formatCurrency(metrics?.revenue || 0)}
                </span>
                <p style={{ fontSize: '13px', marginTop: '16px', ...darkCardText.body }}>
                  객단가 {formatCurrency(metrics?.atv || 0)}
                </p>
              </div>
              {metrics?.changes.revenue !== undefined && (
                <Badge3D dark>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.8)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    전월 대비 {metrics.changes.revenue >= 0 ? '+' : ''}{metrics.changes.revenue.toFixed(1)}%
                  </span>
                </Badge3D>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Funnel Chart */}
        <div style={{ gridColumn: 'span 3', gridRow: 'span 2' }}>
          <GlassCard dark={isDark}>
            <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>고객 여정 퍼널</h3>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>
                  방문 빈도 {metrics?.visitFrequency?.toFixed(1) || '0'}회
                </p>
              </div>

              {/* Funnel Bars */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
                {[
                  { key: 'entry', label: 'ENTRY', value: funnel.entry, isAccent: true },
                  { key: 'browse', label: 'BROWSE', value: funnel.browse, isAccent: false },
                  { key: 'engage', label: 'ENGAGE', value: funnel.engage, isAccent: false },
                  { key: 'fitting', label: 'FITTING', value: funnel.fitting, isAccent: false },
                  { key: 'purchase', label: 'PURCHASE', value: funnel.purchase, isAccent: true },
                ].map((stage) => {
                  const percentage = (stage.value / maxFunnelValue) * 100;
                  const rate = ((stage.value / maxFunnelValue) * 100).toFixed(1);
                  return (
                    <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(percentage, 8)}%`,
                            borderRadius: '8px 8px 3px 3px',
                            background: stage.isAccent
                              ? 'linear-gradient(180deg, #2c2c35 0%, #1c1c24 35%, #252530 65%, #1a1a22 100%)'
                              : (isDark 
                                  ? 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)'
                                  : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(235,235,242,0.95) 30%, rgba(248,248,252,0.98) 60%, rgba(242,242,248,0.95) 100%)'),
                            border: stage.isAccent 
                              ? '1px solid rgba(255,255,255,0.1)' 
                              : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)'),
                            boxShadow: stage.isAccent
                              ? '0 4px 8px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)'
                              : '0 2px 4px rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {!stage.isAccent && !isDark && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)',
                                borderRadius: '8px 8px 0 0',
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '8px', marginTop: '8px', ...text3D.label }}>{stage.label}</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: '2px 0 0 0', ...text3D.number }}>
                        {stage.value.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', ...text3D.body }}>({rate}%)</p>
                    </div>
                  );
                })}
              </div>

              {/* Alert */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isDark 
                    ? 'rgba(251,191,36,0.15)'
                    : 'linear-gradient(165deg, rgba(255,251,235,0.95) 0%, rgba(254,243,199,0.85) 100%)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
                <div style={{ fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: isDark ? '#fbbf24' : '#92400e' }}>최대 이탈 구간:</span>{' '}
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#b45309' }}>입장 → 탐색</span>
                </div>
              </div>

              {/* Conversion */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` }}>
                <span style={{ fontSize: '13px', ...text3D.body }}>최종 구매 전환율</span>
                <span style={{ fontSize: '18px', ...text3D.heroNumber }}>
                  {funnel.entry > 0 ? ((funnel.purchase / funnel.entry) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Conversion */}
        <div style={{ gridColumn: 'span 3' }}>
          <GlassCard dark={isDark}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={text3D.label}>CONVERSION</p>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0', ...text3D.body }}>구매 전환율</p>
                <p style={{ fontSize: '32px', margin: '12px 0 0 0', ...text3D.heroNumber }}>
                  {formatPercent(metrics?.conversionRate || 0)}
                </p>
                <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
                  {metrics?.transactions.toLocaleString() || 0}건 거래
                </p>
                {metrics?.changes.conversionRate !== undefined && (
                  <div style={{ marginTop: '12px' }}>
                    <Badge3D dark={isDark}>
                      <TrendingUp className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#059669' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.9)' : '#059669' }}>
                        +{metrics.changes.conversionRate.toFixed(1)}%p
                      </span>
                    </Badge3D>
                  </div>
                )}
              </div>
              <Icon3D size={44} dark={isDark}>
                <TrendingUp className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
            </div>
          </GlassCard>
        </div>

        {/* Row 4: Goals + AI Insight */}
        <div style={{ gridColumn: 'span 6' }}>
          <GoalProgressWidget />
        </div>

        {/* AI Insight */}
        <div style={{ gridColumn: 'span 6' }}>
          <GlassCard dark={isDark}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(145deg, #222228 0%, #2c2c35 45%, #1c1c24 100%)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>오늘의 AI 인사이트</h3>
                  <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>AI가 분석한 주요 인사이트</p>
                </div>
              </div>

              {topRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {topRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        background: isDark 
                          ? 'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(248,248,252,0.85) 100%)',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {!isDark && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '45%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, transparent 100%)',
                            borderRadius: '16px 16px 0 0',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      <div style={{ position: 'relative', zIndex: 10 }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'linear-gradient(145deg, #1c1c22 0%, #282830 100%)',
                            marginBottom: '8px',
                          }}
                        >
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)' }}>
                            {rec.priority === 'high' ? '높은 우선순위' : rec.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', ...text3D.number }}>{rec.title}</h4>
                        <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.5, ...text3D.body }}>{rec.description}</p>
                        {rec.expected_impact && (
                          <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600, color: '#059669' }}>
                            예상 효과: 매출 +{rec.expected_impact.revenue_increase?.toLocaleString() || '?'}원
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => navigate('/insights?tab=ai')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isDark 
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 100%)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.95)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                    }}
                  >
                    모든 AI 추천 보기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Lightbulb className="h-12 w-12 mx-auto mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db' }} />
                  <p style={{ fontSize: '14px', ...text3D.body }}>AI 인사이트가 없습니다</p>
                  <p style={{ fontSize: '12px', marginTop: '4px', ...text3D.body }}>
                    데이터가 축적되면 AI가 인사이트를 생성합니다
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
