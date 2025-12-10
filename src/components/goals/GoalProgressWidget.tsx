/**
 * GoalProgressWidget.tsx
 *
 * 목표 달성률 위젯
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  Trophy,
  Trash2,
} from 'lucide-react';
import { useGoalProgress, useDeleteGoal, formatGoalValue, GOAL_TYPES, GoalType } from '@/hooks/useGoals';
import { GoalSettingDialog } from './GoalSettingDialog';
import { cn } from '@/lib/utils';

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            목표 달성률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progressList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            목표 달성률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              설정된 목표가 없습니다
            </p>
            <GoalSettingDialog />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5" />
          목표 달성률
        </CardTitle>
        <GoalSettingDialog />
      </CardHeader>
      <CardContent className="space-y-4">
        {progressList.map(({ goal, currentValue, progress, isAchieved }) => {
          const goalType = GOAL_TYPES.find(t => t.value === goal.goal_type);
          const Icon = goalType ? iconMap[goalType.icon as keyof typeof iconMap] : Target;

          return (
            <div key={goal.id} className="space-y-2 group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{goalType?.label}</span>
                  {isAchieved && (
                    <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50">
                      <Trophy className="h-3 w-3" />
                      달성!
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isAchieved
                        ? 'text-green-600'
                        : progress >= 70
                        ? 'text-yellow-600'
                        : 'text-muted-foreground'
                    )}
                  >
                    {progress.toFixed(0)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <Progress
                value={progress}
                className={cn(
                  'h-2',
                  isAchieved && '[&>div]:bg-green-500'
                )}
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  현재: {formatGoalValue(currentValue, goal.goal_type as GoalType)}
                </span>
                <span>
                  목표: {formatGoalValue(goal.target_value, goal.goal_type as GoalType)}
                </span>
              </div>
            </div>
          );
        })}

        {/* 전체 달성률 요약 */}
        {progressList.length > 1 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">전체 달성률</span>
              <span className="font-bold">
                {(
                  progressList.reduce((sum, p) => sum + p.progress, 0) /
                  progressList.length
                ).toFixed(0)}
                %
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
