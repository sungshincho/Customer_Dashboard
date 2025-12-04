import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface InventoryRecommendation {
  productSku?: string;
  sku?: string;
  productName?: string;
  name?: string;
  currentStock?: number;
  optimalStock?: number;
  reorderPoint?: number;
  safetyStock?: number;
  orderQuantity?: number;
  urgency?: 'high' | 'medium' | 'low' | string;
}

interface InventorySummary {
  totalProducts?: number;
  overstocked?: number;
  understocked?: number;
  optimal?: number;
  potentialSavings?: number;
  expectedTurnover?: number;
}

interface InventoryOptimizationResultProps {
  recommendations?: InventoryRecommendation[];
  summary?: InventorySummary;
}

// 안전한 숫자 헬퍼
const safeNumber = (value: number | undefined | null, defaultValue: number = 0): number => {
  if (value === undefined || value === null || isNaN(Number(value))) return defaultValue;
  return Number(value);
};

const safeToFixed = (value: number | undefined | null, digits: number = 0): string => {
  return safeNumber(value).toFixed(digits);
};

export function InventoryOptimizationResult({ recommendations, summary }: InventoryOptimizationResultProps) {
  if (!recommendations || recommendations.length === 0) {
    if (!summary) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>재고 최적화 결과</CardTitle>
            <CardDescription>시뮬레이션을 실행하여 재고 최적화 방안을 확인하세요</CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  // 정규화된 summary
  const normalizedSummary = {
    totalProducts: safeNumber(summary?.totalProducts),
    overstocked: safeNumber(summary?.overstocked),
    understocked: safeNumber(summary?.understocked),
    optimal: safeNumber(summary?.optimal),
    potentialSavings: safeNumber(summary?.potentialSavings),
    expectedTurnover: safeNumber(summary?.expectedTurnover),
  };

  // 정규화된 recommendations
  const normalizedRecs = (recommendations || []).map((rec, idx) => ({
    productSku: rec.productSku || rec.sku || `SKU-${idx + 1}`,
    productName: rec.productName || rec.name || `상품 ${idx + 1}`,
    currentStock: safeNumber(rec.currentStock),
    optimalStock: safeNumber(rec.optimalStock),
    reorderPoint: safeNumber(rec.reorderPoint),
    safetyStock: safeNumber(rec.safetyStock),
    orderQuantity: safeNumber(rec.orderQuantity),
    urgency: rec.urgency || 'low',
  }));

  const getUrgencyVariant = (urgency: string) => {
    if (urgency === 'high') return 'destructive';
    if (urgency === 'medium') return 'outline';
    return 'secondary';
  };

  const getUrgencyLabel = (urgency: string) => {
    if (urgency === 'high') return '긴급';
    if (urgency === 'medium') return '주의';
    return '양호';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>재고 최적화 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">전체 상품</p>
              <p className="text-2xl font-bold">{normalizedSummary.totalProducts}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">과재고</p>
              <p className="text-2xl font-bold text-red-500">{normalizedSummary.overstocked}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">품절 위험</p>
              <p className="text-2xl font-bold text-orange-500">{normalizedSummary.understocked}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">최적 수준</p>
              <p className="text-2xl font-bold text-green-500">{normalizedSummary.optimal}개</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                예상 비용 절감
              </p>
              <p className="text-xl font-bold text-green-500">
                {safeToFixed(normalizedSummary.potentialSavings / 10000, 0)}만원/월
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                예상 회전율
              </p>
              <p className="text-xl font-bold">
                {safeToFixed(normalizedSummary.expectedTurnover, 1)}회/년
              </p>
            </div>
          </div>

          {normalizedRecs.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">상품별 재고 현황 (상위 10개)</h4>
              <div className="space-y-2">
                {normalizedRecs.slice(0, 10).map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.productName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {rec.productSku}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">현재: </span>
                        <span className="font-medium">{rec.currentStock}개</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">권장: </span>
                        <span className={`font-medium ${
                          rec.urgency === 'high' ? 'text-destructive' : 
                          rec.urgency === 'medium' ? 'text-orange-500' : 
                          'text-green-500'
                        }`}>{rec.optimalStock}개</span>
                      </div>
                      <Badge variant={getUrgencyVariant(rec.urgency)} className="text-xs">
                        {getUrgencyLabel(rec.urgency)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {normalizedRecs.filter(rec => rec.urgency === 'high').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>긴급 조치 필요 상품</CardTitle>
            <CardDescription>즉시 발주 또는 재고 조정이 필요한 상품</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalizedRecs
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
      )}
    </div>
  );
}
