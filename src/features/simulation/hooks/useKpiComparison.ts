import { useMemo } from 'react';
import { KpiSnapshot, KpiDelta } from '../types/scenario.types';

export function useKpiComparison(
  baseline?: KpiSnapshot,
  predicted?: KpiSnapshot
) {
  const deltas = useMemo<KpiDelta[]>(() => {
    if (!baseline || !predicted) return [];

    const result: KpiDelta[] = [];
    const metrics = Object.keys(baseline) as (keyof KpiSnapshot)[];

    metrics.forEach((metric) => {
      if (metric === 'timestamp') return;

      const baselineValue = baseline[metric];
      const predictedValue = predicted[metric];

      if (
        typeof baselineValue === 'number' &&
        typeof predictedValue === 'number'
      ) {
        const delta = predictedValue - baselineValue;
        const deltaPercent =
          baselineValue !== 0 ? (delta / baselineValue) * 100 : 0;

        result.push({
          metric,
          baseline: baselineValue,
          predicted: predictedValue,
          delta,
          deltaPercent,
          unit: getUnitForMetric(metric),
        });
      }
    });

    return result;
  }, [baseline, predicted]);

  const summary = useMemo(() => {
    if (deltas.length === 0) return null;

    const positiveCount = deltas.filter((d) => d.delta > 0).length;
    const negativeCount = deltas.filter((d) => d.delta < 0).length;
    const neutralCount = deltas.filter((d) => d.delta === 0).length;

    const avgDeltaPercent =
      deltas.reduce((sum, d) => sum + Math.abs(d.deltaPercent), 0) /
      deltas.length;

    return {
      totalMetrics: deltas.length,
      positiveCount,
      negativeCount,
      neutralCount,
      avgDeltaPercent,
      overallTrend:
        positiveCount > negativeCount
          ? 'positive'
          : positiveCount < negativeCount
          ? 'negative'
          : 'neutral',
    };
  }, [deltas]);

  return { deltas, summary };
}

function getUnitForMetric(metric: keyof KpiSnapshot): string {
  const unitMap: Partial<Record<keyof KpiSnapshot, string>> = {
    conversionRate: '%',
    totalVisits: '명',
    totalPurchases: '건',
    totalRevenue: '원',
    averageTransactionValue: '원',
    salesPerSqm: '원/㎡',
    opex: '원',
    laborCost: '원',
    inventoryCost: '원',
    grossMargin: '%',
    netProfit: '원',
    stockoutRate: '%',
    inventoryTurnover: '회',
    customerSatisfaction: '점',
  };

  return unitMap[metric] || '';
}
