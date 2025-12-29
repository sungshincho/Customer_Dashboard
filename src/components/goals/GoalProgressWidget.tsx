/**
 * GoalProgressWidget.tsx
 *
 * 목표 달성률 위젯 - 3D Glassmorphism Design
 */

import { Target, DollarSign, Users, TrendingUp, ShoppingCart, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoalProgress, useDeleteGoal, formatGoalValue, GOAL_TYPES, GoalType } from '@/hooks/useGoals';
import { GoalSettingDialog } from './GoalSettingDialog';
import React from 'react';

// ===== 3D Text Styles =====
const text3D = {
  number: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#0a0a0c',
    textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  label: {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    background: 'linear-gradient(180deg, #8a8a8f 0%, #9a9a9f 50%, #7a7a7f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,
  body: {
    fontWeight: 500,
    color: '#515158',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,
};

// ===== Glass Card Component =====
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div style={{ perspective: '1200px', height: '100%' }} className={className}>
    <div
      style={{
        borderRadius: '24px',
        padding: '1.5px',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
        boxShadow: '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02), 0 32px 32px rgba(0,0,0,0.02)',
        height: '100%',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
          backdropFilter: 'blur(80px) saturate(200%)',
          borderRadius: '23px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Chrome top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Surface reflection */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
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
const Icon3D = ({ children, size = 40 }: { children: React.ReactNode; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
      borderRadius: '32%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.95)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
      flexShrink: 0,
    }}
  >
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
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

// ===== Badge 3D Component =====
const Badge3D = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 10px',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.95)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
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
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
        borderRadius: '8px 8px 0 0',
        pointerEvents: 'none',
      }}
    />
    <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>{children}</span>
  </div>
);

const iconMap = {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
};

export function GoalProgressWidget() {
  const { data: progressList = [], isLoading } = useGoalProgress();
  const deleteGoal = useDeleteGoal();

  if (isLoading) {
    return (
      <GlassCard>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Icon3D size={40}>
              <Target className="h-5 w-5" style={{ color: '#1a1a1f' }} />
            </Icon3D>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>목표 달성률</h3>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200/50 rounded w-3/4" />
            <div className="h-2 bg-gray-200/50 rounded" />
            <div className="h-4 bg-gray-200/50 rounded w-1/2" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (progressList.length === 0) {
    return (
      <GlassCard>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Icon3D size={40}>
              <Target className="h-5 w-5" style={{ color: '#1a1a1f' }} />
            </Icon3D>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>목표 달성률</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,248,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1)',
              }}
            >
              <Target className="h-7 w-7" style={{ color: '#9ca3af' }} />
            </div>
            <p style={{ fontSize: '14px', marginBottom: '16px', ...text3D.body }}>
              설정된 목표가 없습니다
            </p>
            <GoalSettingDialog />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={40}>
              <Target className="h-5 w-5" style={{ color: '#1a1a1f' }} />
            </Icon3D>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>목표 달성률</h3>
          </div>
          <GoalSettingDialog />
        </div>

        {/* Goals List */}
        <div className="space-y-5">
          {progressList.map(({ goal, currentValue, progress, isAchieved }) => {
            const goalType = GOAL_TYPES.find((t) => t.value === goal.goal_type);
            const Icon = goalType ? iconMap[goalType.icon as keyof typeof iconMap] : Target;

            return (
              <div key={goal.id} className="group">
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(235,235,245,0.95) 100%)',
                        border: '1px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,1)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: '#374151' }} />
                    </div>
                    <span style={{ fontSize: '14px', ...text3D.number }}>
                      {goalType?.label}
                    </span>
                    {isAchieved && (
                      <Badge3D>
                        <Trophy className="h-3 w-3" style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#d97706' }}>달성!</span>
                      </Badge3D>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isAchieved ? '#059669' : progress >= 70 ? '#d97706' : '#6b7280',
                      }}
                    >
                      {progress.toFixed(0)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-3 w-3" style={{ color: '#9ca3af' }} />
                    </Button>
                  </div>
                </div>

                {/* 3D Progress Bar */}
                <div
                  style={{
                    height: '10px',
                    borderRadius: '5px',
                    background: 'linear-gradient(180deg, rgba(235,235,242,0.95) 0%, rgba(248,248,252,0.9) 45%, rgba(242,242,248,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Highlight */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Fill */}
                  <div
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      height: '100%',
                      borderRadius: '5px',
                      background: isAchieved
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 45%, #0d9669 100%)'
                        : 'linear-gradient(180deg, #2c2c35 0%, #1c1c24 45%, #252530 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                {/* Values */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', ...text3D.body }}>
                    현재: {formatGoalValue(currentValue, goal.goal_type as GoalType)}
                  </span>
                  <span style={{ fontSize: '12px', ...text3D.body }}>
                    목표: {formatGoalValue(goal.target_value, goal.goal_type as GoalType)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total Progress Summary */}
          {progressList.length > 1 && (
            <div
              style={{
                paddingTop: '16px',
                marginTop: '16px',
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', ...text3D.body }}>전체 달성률</span>
                <span style={{ fontSize: '18px', ...text3D.number }}>
                  {(progressList.reduce((sum, p) => sum + p.progress, 0) / progressList.length).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default GoalProgressWidget;
