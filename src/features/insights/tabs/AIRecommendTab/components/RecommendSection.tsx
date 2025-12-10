/**
 * RecommendSection.tsx
 *
 * 3단계: 추천 전략 섹션
 * - 순위별 전략 카드
 * - 예상 효과 표시
 * - 시뮬레이션/실행 버튼
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Play,
  Settings,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrategyRecommendation, StrategyType } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface RecommendSectionProps {
  recommendations: StrategyRecommendation[];
  onSimulate: (id: string) => void;
  onConfigure: (id: string) => void;
  onExecute: (id: string) => void;
  isLoading?: boolean;
}

const rankIcons = ['1', '2', '3'];
const rankColors = [
  'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  'bg-gray-400/20 text-gray-400 border-gray-400/30',
  'bg-orange-600/20 text-orange-600 border-orange-600/30',
];

const strategyTypeLabels: Record<StrategyType, string> = {
  discount: '할인',
  bundle: '번들',
  targeting: '타겟팅',
  timing: '시간제',
  display: '진열',
  event: '이벤트',
};

export function RecommendSection({
  recommendations,
  onSimulate,
  onConfigure,
  onExecute,
  isLoading,
}: RecommendSectionProps) {
  const sortedRecommendations = [...recommendations]
    .filter(r => r.status === 'recommended')
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
          3
        </div>
        <h3 className="text-lg font-semibold">추천 전략 (Recommend)</h3>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                이번 주 AI 추천 전략
              </CardTitle>
              <CardDescription className="mt-1">
                데이터 분석 기반 최적 전략 추천
              </CardDescription>
            </div>
            <Badge variant="outline">신뢰도 기준</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : sortedRecommendations.length > 0 ? (
            sortedRecommendations.map((strategy, index) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                rank={index + 1}
                onSimulate={() => onSimulate(strategy.id)}
                onConfigure={() => onConfigure(strategy.id)}
                onExecute={() => onExecute(strategy.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>추천 전략을 분석 중입니다</p>
              <p className="text-sm mt-1">충분한 데이터가 수집되면 AI가 전략을 추천합니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 전략 카드 컴포넌트
interface StrategyCardProps {
  strategy: StrategyRecommendation;
  rank: number;
  onSimulate: () => void;
  onConfigure: () => void;
  onExecute: () => void;
}

function StrategyCard({
  strategy,
  rank,
  onSimulate,
  onConfigure,
  onExecute,
}: StrategyCardProps) {
  const rankIndex = Math.min(rank - 1, 2);

  return (
    <div className={cn(
      'p-4 rounded-lg border border-l-4 transition-all hover:shadow-md',
      rank === 1
        ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
        : rank === 2
        ? 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20'
        : 'border-l-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
    )}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <Badge className={cn('text-xs font-bold', rankColors[rankIndex])}>
            {rank}위
          </Badge>
          <div>
            <h4 className="font-semibold">{strategy.title}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {strategy.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0">
          신뢰도 {strategy.confidence}%
        </Badge>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {strategy.targetAudience}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {strategy.duration}일
        </div>
        <Badge variant="secondary" className="text-xs">
          {strategyTypeLabels[strategy.type]}
        </Badge>
      </div>

      {/* 예상 효과 */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-background/50 rounded-lg mb-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">추가 매출</p>
          <p className="text-sm font-bold text-green-500">
            +{formatCurrency(strategy.expectedResults.revenueIncrease)}
          </p>
        </div>
        <div className="text-center border-x">
          <p className="text-xs text-muted-foreground">전환율 증가</p>
          <p className="text-sm font-bold text-blue-500">
            +{strategy.expectedResults.conversionIncrease.toFixed(1)}%p
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">예상 ROI</p>
          <p className="text-sm font-bold text-purple-500">
            {strategy.expectedResults.roi}%
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={onSimulate}
        >
          <FlaskConical className="w-3 h-3" />
          시뮬레이션
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={onConfigure}
        >
          <Settings className="w-3 h-3" />
          상세 설정
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1"
          onClick={onExecute}
        >
          <Play className="w-3 h-3" />
          실행하기
        </Button>
      </div>
    </div>
  );
}
