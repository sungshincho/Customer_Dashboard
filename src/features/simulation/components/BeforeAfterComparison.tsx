import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiSnapshot } from '../types/scenario.types';
import { useKpiComparison } from '../hooks/useKpiComparison';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BeforeAfterComparisonProps {
  baseline?: KpiSnapshot;
  predicted?: KpiSnapshot;
}

export function BeforeAfterComparison({ baseline, predicted }: BeforeAfterComparisonProps) {
  const { deltas, summary } = useKpiComparison(baseline, predicted);

  if (!baseline || !predicted || deltas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Before/After 비교</CardTitle>
          <CardDescription>시뮬레이션 결과가 없습니다</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = deltas.map((delta) => ({
    name: getMetricLabel(delta.metric),
    Baseline: delta.baseline,
    Predicted: delta.predicted,
    delta: delta.delta,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Before/After 비교</CardTitle>
        <CardDescription>
          {summary && (
            <span>
              총 {summary.totalMetrics}개 지표 중{' '}
              <span className="text-green-500">↑{summary.positiveCount}</span>{' '}
              <span className="text-red-500">↓{summary.negativeCount}</span>{' '}
              <span className="text-muted-foreground">={summary.neutralCount}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="Baseline" fill="hsl(var(--muted))" name="현재" />
            <Bar dataKey="Predicted" fill="hsl(var(--primary))" name="예측" />
          </BarChart>
        </ResponsiveContainer>

        {/* Delta 테이블 */}
        <div className="mt-6 space-y-2">
          {deltas.map((delta) => (
            <div key={delta.metric} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">{getMetricLabel(delta.metric)}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {delta.baseline.toFixed(1)} → {delta.predicted.toFixed(1)}
                </span>
                <span
                  className={`font-semibold ${
                    delta.delta > 0
                      ? 'text-green-500'
                      : delta.delta < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {delta.delta > 0 && '+'}
                  {delta.deltaPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getMetricLabel(metric: string): string {
  const labelMap: Record<string, string> = {
    conversionRate: '전환율',
    totalVisits: '총 방문',
    totalPurchases: '총 구매',
    totalRevenue: '총 매출',
    averageTransactionValue: '평균 객단가',
    salesPerSqm: '평당매출',
    opex: '운영비',
    laborCost: '인건비',
    inventoryCost: '재고비용',
    grossMargin: '총 마진',
    netProfit: '순이익',
    stockoutRate: '품절률',
    inventoryTurnover: '재고회전율',
    customerSatisfaction: '고객만족도',
  };

  return labelMap[metric] || metric;
}
