/**
 * MetricCard.tsx
 *
 * 표준 용어 기반 KPI 카드 컴포넌트
 * 영문 라벨 + 한글 라벨 + 변화율 표시
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  labelEn?: string;
  value: string | number;
  subLabel?: string;
  change?: number;
  changeLabel?: string;
  changeUnit?: string; // '%' or '%p' or ''
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  labelEn,
  value,
  subLabel,
  change,
  changeLabel,
  changeUnit = '%',
  className,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {labelEn && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              {labelEn}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          {subLabel && (
            <p className="text-xs text-muted-foreground mt-1">{subLabel}</p>
          )}
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                isPositive && 'text-green-500',
                isNegative && 'text-red-500',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-4 w-4" />
              <span>
                {isPositive ? '+' : ''}
                {change.toFixed(1)}
                {changeUnit}
                {changeLabel && ` ${changeLabel}`}
              </span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
};

// 포맷 유틸리티 함수들
export const formatCurrency = (value: number, unit: 'full' | 'man' | 'chun' = 'man'): string => {
  if (unit === 'man') {
    return `₩${(value / 10000).toFixed(0)}만`;
  } else if (unit === 'chun') {
    return `₩${Math.round(value / 1000)}천`;
  }
  return `₩${value.toLocaleString()}`;
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes > 0) {
    return secs > 0 ? `${minutes}분 ${secs}초` : `${minutes}분`;
  }
  return `${secs}초`;
};
