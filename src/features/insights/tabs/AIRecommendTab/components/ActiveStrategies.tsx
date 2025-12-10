/**
 * ActiveStrategies.tsx
 *
 * 진행 중인 전략 카드
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveStrategy } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface ActiveStrategiesProps {
  strategies: ActiveStrategy[];
  onViewDetails: (id: string) => void;
  onCreateNew: () => void;
}

export function ActiveStrategies({
  strategies,
  onViewDetails,
  onCreateNew,
}: ActiveStrategiesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">실행 중</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">예정</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">일시정지</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  if (strategies.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">진행 중인 전략</CardTitle>
          <Button size="sm" className="gap-1" onClick={onCreateNew}>
            <Plus className="w-4 h-4" />
            새 전략
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>진행 중인 전략이 없습니다</p>
            <p className="text-sm mt-1">AI 추천을 확인하고 전략을 실행해보세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          진행 중인 전략
          <Badge variant="secondary" className="ml-2">{strategies.length}</Badge>
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1" onClick={onCreateNew}>
          <Plus className="w-4 h-4" />
          새 전략
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onViewDetails(strategy.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(strategy.status)}
                  <span className="font-medium truncate">{strategy.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>D+{strategy.daysActive}</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    예상 ROI: {strategy.expectedROI}%
                    <ArrowRight className="w-3 h-3" />
                    <span className={cn(
                      'font-medium',
                      strategy.currentROI >= strategy.expectedROI ? 'text-green-500' : 'text-yellow-500'
                    )}>
                      현재: {strategy.currentROI}%
                    </span>
                    {getTrendIcon(strategy.trend)}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-xs">
                상세보기
              </Button>
            </div>
            <Progress value={strategy.progress} className="h-1.5 mt-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
