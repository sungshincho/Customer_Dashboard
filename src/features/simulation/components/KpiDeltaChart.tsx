import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiDelta } from '../types/scenario.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface KpiDeltaChartProps {
  deltas: KpiDelta[];
  title?: string;
  description?: string;
}

export function KpiDeltaChart({ deltas, title = 'KPI 변화량', description }: KpiDeltaChartProps) {
  if (!deltas || deltas.length === 0) {
    return null;
  }

  const chartData = deltas.map((delta) => ({
    name: getMetricLabel(delta.metric),
    value: delta.deltaPercent,
    isPositive: delta.delta > 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis type="category" dataKey="name" className="text-xs" width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
