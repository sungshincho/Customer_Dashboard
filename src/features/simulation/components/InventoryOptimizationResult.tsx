import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface InventoryOptimizationResultProps {
  recommendations?: {
    productSku: string;
    productName: string;
    currentStock: number;
    optimalStock: number;
    reorderPoint: number;
    safetyStock: number;
    orderQuantity: number;
    urgency: 'high' | 'medium' | 'low';
  }[];
  summary?: {
    totalProducts: number;
    overstocked: number;
    understocked: number;
    optimal: number;
    potentialSavings: number;
    expectedTurnover: number;
  };
}

export function InventoryOptimizationResult({ recommendations, summary }: InventoryOptimizationResultProps) {
  if (!recommendations || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>재고 최적화 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 재고 최적화 방안을 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const urgencyColors = {
    high: 'hsl(var(--destructive))',
    medium: 'hsl(var(--chart-3))',
    low: 'hsl(var(--chart-1))',
  };

  const chartData = recommendations.slice(0, 10).map((rec) => ({
    name: rec.productName.length > 15 ? rec.productName.slice(0, 12) + '...' : rec.productName,
    current: rec.currentStock,
    optimal: rec.optimalStock,
    urgency: rec.urgency,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>재고 최적화 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">전체 상품</p>
              <p className="text-2xl font-bold">{summary.totalProducts}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">과재고</p>
              <p className="text-2xl font-bold text-red-500">{summary.overstocked}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">품절 위험</p>
              <p className="text-2xl font-bold text-orange-500">{summary.understocked}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">최적 수준</p>
              <p className="text-2xl font-bold text-green-500">{summary.optimal}개</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                예상 비용 절감
              </p>
              <p className="text-xl font-bold text-green-500">
                {(summary.potentialSavings / 10000).toFixed(0)}만원/월
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                예상 회전율
              </p>
              <p className="text-xl font-bold">{summary.expectedTurnover.toFixed(1)}회/년</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상품별 재고 현황 vs 최적 재고</CardTitle>
          <CardDescription>상위 10개 상품의 현재 재고와 권장 재고 수준</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={100} />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="current" fill="hsl(var(--muted))" name="현재 재고" />
              <Bar dataKey="optimal" name="권장 재고">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={urgencyColors[entry.urgency]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>긴급 조치 필요 상품</CardTitle>
          <CardDescription>즉시 발주 또는 재고 조정이 필요한 상품</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations
              .filter(rec => rec.urgency === 'high')
              .slice(0, 5)
              .map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">{rec.productName}</span>
                      <Badge variant="destructive" className="text-xs">긴급</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">SKU: {rec.productSku}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm">
                      <span className="text-muted-foreground">현재: </span>
                      <span className="font-medium">{rec.currentStock}개</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">권장: </span>
                      <span className="font-medium text-green-500">{rec.optimalStock}개</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      발주 수량: {rec.orderQuantity}개
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
