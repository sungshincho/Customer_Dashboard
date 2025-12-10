/**
 * ROI 요약 KPI 카드 컴포넌트
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, CheckCircle, TrendingUp, Banknote, Loader2 } from 'lucide-react';
import type { ROISummary } from '../types/roi.types';
import { cn } from '@/lib/utils';

interface ROISummaryCardsProps {
  data: ROISummary | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 100000000) {
    return `₩${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000000) {
    return `₩${(value / 10000000).toFixed(1)}천만`;
  }
  if (value >= 1000000) {
    return `₩${(value / 1000000).toFixed(1)}M`;
  }
  return `₩${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(0)}%`;
};

export const ROISummaryCards: React.FC<ROISummaryCardsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-16 bg-white/10" />
              <Skeleton className="h-5 w-5 rounded bg-white/10" />
            </div>
            <Skeleton className="h-8 w-20 bg-white/10 mb-1" />
            <Skeleton className="h-3 w-24 bg-white/10" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: '총 적용',
      value: `${data?.totalApplied || 0}건`,
      subLabel: `진행 중 ${data?.activeCount || 0}건`,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '성공률',
      value: formatPercent(data?.successRate || 0),
      subLabel: `(${data?.successCount || 0}/${data?.totalApplied || 0})`,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: '평균 ROI',
      value: formatPercent(data?.averageRoi || 0),
      subLabel: '목표 200%',
      icon: TrendingUp,
      color: (data?.averageRoi || 0) >= 200 ? 'text-green-400' : 'text-yellow-400',
      bgColor: (data?.averageRoi || 0) >= 200 ? 'bg-green-500/10' : 'bg-yellow-500/10',
      highlight: (data?.averageRoi || 0) >= 200,
    },
    {
      label: '총 추가매출',
      value: formatCurrency(data?.totalRevenueImpact || 0),
      subLabel:
        data?.revenueChangePercent !== undefined
          ? `${data.revenueChangePercent > 0 ? '+' : ''}${data.revenueChangePercent}% 전월`
          : '추적 중',
      icon: Banknote,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn(
            'p-4 border-white/10 transition-all hover:border-white/20',
            card.bgColor
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase tracking-wide font-medium">
              {card.label}
            </span>
            <div className={cn('p-1.5 rounded-lg', card.bgColor)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </div>
          <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
          <p className="text-xs text-white/40 mt-1">{card.subLabel}</p>
        </Card>
      ))}
    </div>
  );
};

export default ROISummaryCards;
