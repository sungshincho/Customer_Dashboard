// ============================================================================
// PipelineTimeline.tsx - 데이터 파이프라인 타임라인 (3D Glassmorphism Design)
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Database,
  ArrowRight,
  Layers,
  BarChart3,
  CheckCircle,
  Loader2,
  GitBranch,
} from 'lucide-react';
import type { PipelineStats } from '../types';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '15px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '15px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.02em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 50%, #1a1a1f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#6b7280',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '11px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '11px', color: '#9ca3af',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '24px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '23px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          borderRadius: '23px 23px 50% 50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 44, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '3px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

const Badge3D = ({ children, dark = false, variant = 'default' }: { children: React.ReactNode; dark?: boolean; variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const colors = {
    default: { bg: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: dark ? 'rgba(255,255,255,0.8)' : '#6b7280' },
    success: { bg: dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)', text: '#22c55e' },
    warning: { bg: dark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.1)', text: '#eab308' },
    error: { bg: dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', text: '#ef4444' },
  };
  const color = colors[variant];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
      background: color.bg,
      borderRadius: '6px',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
      fontSize: '10px', fontWeight: 600, color: color.text,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// 스테이지 아이콘 컴포넌트
// ============================================================================

const StageIcon3D = ({ icon: Icon, color, dark }: { icon: any; color: string; dark: boolean }) => (
  <div style={{
    width: '64px', height: '64px',
    background: dark
      ? `linear-gradient(145deg, ${color}30 0%, ${color}15 50%, ${color}20 100%)`
      : `linear-gradient(145deg, ${color}15 0%, ${color}08 50%, ${color}12 100%)`,
    borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? `1px solid ${color}40` : `1px solid ${color}25`,
    boxShadow: dark
      ? `inset 0 1px 2px ${color}30, 0 4px 12px rgba(0,0,0,0.3)`
      : `0 2px 4px ${color}15, 0 4px 8px ${color}10, inset 0 2px 4px rgba(255,255,255,0.8)`,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '4px', left: '20%', right: '20%', height: '30%',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <Icon className="w-7 h-7" style={{ color, position: 'relative', zIndex: 10 }} />
  </div>
);

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface PipelineTimelineProps {
  stats: PipelineStats;
}

export function PipelineTimeline({ stats }: PipelineTimelineProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const stages = [
    {
      name: 'Raw Import',
      layer: 'L1',
      icon: Database,
      count: stats.raw_imports.total,
      completed: stats.raw_imports.completed,
      pending: stats.raw_imports.pending,
      failed: stats.raw_imports.failed,
      color: '#3b82f6',
    },
    {
      name: 'L2 Transform',
      layer: 'L2',
      icon: Layers,
      count: stats.l2_records,
      completed: stats.l2_records,
      pending: 0,
      failed: 0,
      color: '#8b5cf6',
    },
    {
      name: 'L3 Aggregate',
      layer: 'L3',
      icon: BarChart3,
      count: stats.l3_records,
      completed: stats.l3_records,
      pending: 0,
      failed: 0,
      color: '#22c55e',
    },
  ];

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Icon3D size={44} dark={isDark}>
            <GitBranch className="w-5 h-5" style={{ color: iconColor }} />
          </Icon3D>
          <div>
            <span style={text3D.label}>Data Pipeline</span>
            <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>데이터 파이프라인</h3>
          </div>
        </div>

        {/* 파이프라인 스테이지 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {stages.map((stage, index) => (
            <div key={stage.layer} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Stage Card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <StageIcon3D icon={stage.icon} color={stage.color} dark={isDark} />
                <span style={{ marginTop: '12px', ...text3D.body }}>{stage.name}</span>
                <span style={{ fontSize: '22px', marginTop: '4px', ...text3D.heroNumber }}>
                  {stage.count.toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {stage.pending > 0 && (
                    <Badge3D dark={isDark} variant="warning">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {stage.pending}
                    </Badge3D>
                  )}
                  {stage.completed > 0 && (
                    <Badge3D dark={isDark} variant="success">
                      <CheckCircle className="w-3 h-3" />
                      {stage.completed}
                    </Badge3D>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <div style={{ margin: '0 24px', marginBottom: '60px' }}>
                  <ArrowRight className="w-6 h-6" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ETL Runs Summary */}
        {stats.etl_runs && (
          <div style={{
            marginTop: '24px', paddingTop: '20px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={text3D.body}>ETL 실행</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={text3D.title}>총 {stats.etl_runs.total}회</span>
                {stats.etl_runs.running > 0 && (
                  <Badge3D dark={isDark} variant="warning">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {stats.etl_runs.running} 실행 중
                  </Badge3D>
                )}
                {stats.etl_runs.failed > 0 && (
                  <Badge3D dark={isDark} variant="error">
                    {stats.etl_runs.failed} 실패
                  </Badge3D>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
