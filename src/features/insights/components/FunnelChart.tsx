/**
 * FunnelChart.tsx
 *
 * 고객 여정 퍼널 시각화 컴포넌트
 * Entry → Browse → Engage → Fitting → Purchase
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FunnelData {
  entry: number;
  browse: number;
  engage: number;
  fitting: number;
  purchase: number;
}

interface FunnelChartProps {
  data: FunnelData;
  className?: string;
}

const stages = [
  { key: 'entry', label: '입장', labelEn: 'Entry', color: 'bg-blue-500' },
  { key: 'browse', label: '탐색', labelEn: 'Browse', color: 'bg-cyan-500' },
  { key: 'engage', label: '관심', labelEn: 'Engage', color: 'bg-teal-500' },
  { key: 'fitting', label: '피팅', labelEn: 'Fitting', color: 'bg-emerald-500' },
  { key: 'purchase', label: '구매', labelEn: 'Purchase', color: 'bg-green-500' },
] as const;

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, className }) => {
  const maxValue = data.entry || 1;

  // 최대 이탈 구간 찾기
  const { dropoffs, maxDropoff } = useMemo(() => {
    const drops = stages.slice(0, -1).map((stage, i) => {
      const current = data[stage.key as keyof FunnelData];
      const next = data[stages[i + 1].key as keyof FunnelData];
      return {
        from: stage.label,
        to: stages[i + 1].label,
        dropoffRate: current > 0 ? ((current - next) / current) * 100 : 0,
        dropoffCount: current - next,
      };
    });

    const max = drops.reduce((m, d) =>
      d.dropoffRate > m.dropoffRate ? d : m
    );

    return { dropoffs: drops, maxDropoff: max };
  }, [data]);

  if (data.entry === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            고객 여정 퍼널
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            해당 기간에 퍼널 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          고객 여정 퍼널
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 퍼널 바 차트 */}
        <div className="flex items-end justify-between gap-3 h-36 mb-4">
          {stages.map((stage, idx) => {
            const value = data[stage.key as keyof FunnelData];
            const percentage = (value / maxValue) * 100;
            const rate = data.entry > 0 ? ((value / data.entry) * 100).toFixed(1) : '0';

            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center">
                {/* 바 */}
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500',
                      stage.color
                    )}
                    style={{ height: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
                {/* 레이블 */}
                <div className="mt-2 text-center w-full">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {stage.labelEn}
                  </p>
                  <p className="text-xs font-medium">{stage.label}</p>
                  <p className="text-sm font-bold tabular-nums">
                    {value.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({rate}%)
                  </p>
                </div>
                {/* 이탈율 화살표 (마지막 제외) */}
                {idx < stages.length - 1 && dropoffs[idx] && (
                  <div className="absolute -right-4 top-1/2 text-[9px] text-red-400 hidden lg:block">
                    -{dropoffs[idx].dropoffRate.toFixed(0)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 최대 이탈 구간 알림 */}
        {maxDropoff.dropoffRate > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">최대 이탈 구간:</span>{' '}
              {maxDropoff.from} → {maxDropoff.to}{' '}
              <span className="text-amber-600 font-medium">
                ({maxDropoff.dropoffRate.toFixed(1)}% 이탈, {maxDropoff.dropoffCount.toLocaleString()}명)
              </span>
            </div>
          </div>
        )}

        {/* 전환율 요약 */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">최종 구매 전환율</span>
          <span className="font-bold text-primary">
            {data.entry > 0 ? ((data.purchase / data.entry) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
