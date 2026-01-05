/**
 * RecommendSection.tsx
 *
 * 3단계: 추천 전략 섹션
 * 3D Glassmorphism + Monochrome
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Calendar,
  Play,
  Settings,
  FlaskConical,
} from 'lucide-react';
import type { StrategyRecommendation, StrategyType } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
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
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
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
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 36, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,1)',
  }}>
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

const Badge3D = ({ children, dark = false, size = 'sm' }: { children: React.ReactNode; dark?: boolean; size?: 'sm' | 'md' }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: size === 'sm' ? '4px 8px' : '6px 12px',
    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: size === 'sm' ? '6px' : '8px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    fontSize: size === 'sm' ? '10px' : '11px', fontWeight: 600,
  }}>
    {children}
  </div>
);

const strategyTypeLabels: Record<StrategyType, string> = {
  discount: '할인',
  bundle: '번들',
  targeting: '타겟팅',
  timing: '시간제',
  display: '진열',
  event: '이벤트',
};

interface RecommendSectionProps {
  recommendations: StrategyRecommendation[];
  onSimulate: (id: string) => void;
  onConfigure: (id: string) => void;
  onExecute: (id: string) => void;
  isLoading?: boolean;
}

export function RecommendSection({
  recommendations,
  onSimulate,
  onConfigure,
  onExecute,
  isLoading,
}: RecommendSectionProps) {
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

  const sortedRecommendations = [...recommendations]
    .filter(r => r.status === 'recommended')
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
        }}>3</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>추천 전략 (Recommend)</h3>
      </div>

      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          {/* 카드 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon3D size={36} dark={isDark}>
                <Sparkles className="h-4 w-4" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>이번 주 AI 추천 전략</h4>
                <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>데이터 분석 기반 최적 전략 추천</p>
              </div>
            </div>
            <Badge3D dark={isDark} size="md">
              <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>신뢰도 기준</span>
            </Badge3D>
          </div>

          {/* 전략 목록 */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse" style={{
                  padding: '20px', borderRadius: '16px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <div style={{ height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', width: '33%', marginBottom: '8px' }} />
                  <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '66%', marginBottom: '12px' }} />
                  <div style={{ height: '60px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }} />
                </div>
              ))}
            </div>
          ) : sortedRecommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedRecommendations.map((strategy, index) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  rank={index + 1}
                  isDark={isDark}
                  text3D={text3D}
                  iconColor={iconColor}
                  onSimulate={() => onSimulate(strategy.id)}
                  onConfigure={() => onConfigure(strategy.id)}
                  onExecute={() => onExecute(strategy.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Sparkles className="h-12 w-12" style={{ margin: '0 auto 12px', color: isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db' }} />
              <p style={{ fontSize: '14px', ...text3D.body }}>추천 전략을 분석 중입니다</p>
              <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                충분한 데이터가 수집되면 AI가 전략을 추천합니다
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// 전략 카드 컴포넌트
interface StrategyCardProps {
  strategy: StrategyRecommendation;
  rank: number;
  isDark: boolean;
  text3D: ReturnType<typeof getText3D>;
  iconColor: string;
  onSimulate: () => void;
  onConfigure: () => void;
  onExecute: () => void;
}

function StrategyCard({
  strategy,
  rank,
  isDark,
  text3D,
  iconColor,
  onSimulate,
  onConfigure,
  onExecute,
}: StrategyCardProps) {
  return (
    <div style={{
      padding: '16px', borderRadius: '16px',
      borderLeft: isDark ? '4px solid rgba(255,255,255,0.3)' : '4px solid rgba(0,0,0,0.15)',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Badge3D dark={isDark} size="md">
            <span style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#374151', fontWeight: 700 }}>{rank}위</span>
          </Badge3D>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.title}</h4>
            <p style={{ fontSize: '12px', marginTop: '4px', ...text3D.body }}>{strategy.description}</p>
          </div>
        </div>
        <Badge3D dark={isDark}>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>신뢰도 {strategy.confidence}%</span>
        </Badge3D>
      </div>

      {/* 메타 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...text3D.body }}>
          <Target className="w-3 h-3" style={{ color: iconColor }} />
          {strategy.targetAudience}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...text3D.body }}>
          <Calendar className="w-3 h-3" style={{ color: iconColor }} />
          {strategy.duration}일
        </div>
        <Badge3D dark={isDark}>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>{strategyTypeLabels[strategy.type]}</span>
        </Badge3D>
      </div>

      {/* 예상 효과 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
        padding: '12px', borderRadius: '12px', marginBottom: '12px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>추가 매출</p>
          <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
            +{formatCurrency(strategy.expectedResults.revenueIncrease)}
          </p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)', borderRight: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>전환율 증가</p>
          <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
            +{strategy.expectedResults.conversionIncrease.toFixed(1)}%p
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>예상 ROI</p>
          <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
            {strategy.expectedResults.roi}%
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSimulate}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
            fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          <FlaskConical className="w-3 h-3" /> 시뮬레이션
        </button>
        <button
          onClick={onConfigure}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
            fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          <Settings className="w-3 h-3" /> 상세 설정
        </button>
        <button
          onClick={onExecute}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            border: 'none',
            fontSize: '11px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          <Play className="w-3 h-3" /> 실행하기
        </button>
      </div>
    </div>
  );
}
