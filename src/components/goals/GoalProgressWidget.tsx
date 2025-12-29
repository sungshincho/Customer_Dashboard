/**
 * GoalProgressWidget.tsx
 *
 * 목표 달성률 위젯 - 3D Glassmorphism Design
 */

import { Target, DollarSign, Users, TrendingUp, ShoppingCart, Trophy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoalProgress, useDeleteGoal, formatGoalValue, GOAL_TYPES, GoalType } from '@/hooks/useGoals';
import { GoalSettingDialog } from './GoalSettingDialog';
import { cn } from '@/lib/utils';
import { Glass3DCard, Icon3D, Badge3D, text3DStyles } from '@/components/ui/glass-card';

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
      <Glass3DCard>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Icon3D size={40}>
              <Target className="h-4 w-4 text-gray-800" />
            </Icon3D>
            <h3 style={text3DStyles.heading}>목표 달성률</h3>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200/50 rounded w-3/4" />
            <div className="h-2 bg-gray-200/50 rounded" />
            <div className="h-4 bg-gray-200/50 rounded w-1/2" />
          </div>
        </div>
      </Glass3DCard>
    );
  }

  if (progressList.length === 0) {
    return (
      <Glass3DCard>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Icon3D size={40}>
              <Target className="h-4 w-4 text-gray-800" />
            </Icon3D>
            <h3 style={text3DStyles.heading}>목표 달성률</h3>
          </div>
          <div className="text-center py-6">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,248,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1)',
              }}
            >
              <Target className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm mb-4" style={text3DStyles.body}>
              설정된 목표가 없습니다
            </p>
            <GoalSettingDialog />
          </div>
        </div>
      </Glass3DCard>
    );
  }

  return (
    <Glass3DCard>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Icon3D size={40}>
              <Target className="h-4 w-4 text-gray-800" />
            </Icon3D>
            <h3 style={text3DStyles.heading}>목표 달성률</h3>
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
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(235,235,245,0.95) 100%)',
                        border: '1px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,1)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 text-gray-700" />
                    </div>
                    <span className="text-sm" style={text3DStyles.heading}>
                      {goalType?.label}
                    </span>
                    {isAchieved && (
                      <Badge3D>
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-semibold text-amber-600">달성!</span>
                      </Badge3D>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{
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
                      <Trash2 className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>

                {/* 3D Progress Bar */}
                <div
                  className="h-2.5 rounded-md relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(235,235,242,0.95) 0%, rgba(248,248,252,0.9) 45%, rgba(242,242,248,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Highlight */}
                  <div
                    className="absolute top-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)',
                    }}
                  />
                  {/* Fill */}
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: isAchieved
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 45%, #0d9669 100%)'
                        : 'linear-gradient(180deg, #2c2c35 0%, #1c1c24 45%, #252530 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                {/* Values */}
                <div className="flex justify-between text-xs mt-2" style={text3DStyles.body}>
                  <span>현재: {formatGoalValue(currentValue, goal.goal_type as GoalType)}</span>
                  <span>목표: {formatGoalValue(goal.target_value, goal.goal_type as GoalType)}</span>
                </div>
              </div>
            );
          })}

          {/* Total Progress Summary */}
          {progressList.length > 1 && (
            <div
              className="pt-4 mt-4"
              style={{
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex justify-between items-center text-sm">
                <span style={text3DStyles.body}>전체 달성률</span>
                <span
                  className="text-lg"
                  style={text3DStyles.heroNumber}
                >
                  {(progressList.reduce((sum, p) => sum + p.progress, 0) / progressList.length).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Glass3DCard>
  );
}

export default GoalProgressWidget;
