/**
 * OptimizeSection.tsx
 *
 * 2단계: 최적화 섹션
 * - 가격 최적화
 * - 재고 최적화
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceOptimization, InventoryOptimization } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface OptimizeSectionProps {
  priceOptimization: PriceOptimization | null;
  inventoryOptimization: InventoryOptimization | null;
  onViewDetails: (type: 'price' | 'inventory') => void;
  onApply: (type: 'price' | 'inventory') => void;
  isLoading?: boolean;
}

export function OptimizeSection({
  priceOptimization,
  inventoryOptimization,
  onViewDetails,
  onApply,
  isLoading,
}: OptimizeSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
          2
        </div>
        <h3 className="text-lg font-semibold">최적화 (Optimize)</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 가격 최적화 카드 */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded bg-yellow-500/20">
                <DollarSign className="h-4 w-4 text-yellow-500" />
              </div>
              가격 최적화
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ) : priceOptimization ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">분석 대상</p>
                    <p className="text-lg font-bold">{priceOptimization.totalProducts}개</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">최적화 가능</p>
                    <p className="text-lg font-bold text-yellow-500">{priceOptimization.optimizableCount}개</p>
                  </div>
                </div>

                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">잠재 수익 증가</span>
                  </div>
                  <p className="text-xl font-bold text-green-500 mt-1">
                    +{priceOptimization.potentialRevenueIncreasePercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예상 {formatCurrency(priceOptimization.potentialRevenueIncrease)} 추가 매출
                  </p>
                </div>

                {priceOptimization.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">추천 액션</p>
                    {priceOptimization.actions.slice(0, 2).map((action) => (
                      <div key={action.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <span className="truncate flex-1">{action.productName}</span>
                        <Badge variant={action.recommendedValue > action.currentValue ? 'default' : 'secondary'}>
                          {action.recommendedValue > action.currentValue ? '+' : ''}
                          {((action.recommendedValue - action.currentValue) / action.currentValue * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewDetails('price')}
                  >
                    상세 보기
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => onApply('price')}
                  >
                    <CheckCircle className="w-3 h-3" />
                    적용
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>분석할 상품 데이터가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 재고 최적화 카드 */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded bg-green-500/20">
                <Package className="h-4 w-4 text-green-500" />
              </div>
              재고 최적화
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ) : inventoryOptimization ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">분석 대상</p>
                    <p className="text-lg font-bold">{inventoryOptimization.totalItems}개</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">발주 추천</p>
                    <p className="text-lg font-bold text-green-500">{inventoryOptimization.orderRecommendations}건</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">품절 방지</p>
                    <p className="text-xl font-bold text-red-500">{inventoryOptimization.stockoutPrevention}건</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">과재고 감소</p>
                    <p className="text-xl font-bold text-blue-500">{inventoryOptimization.overStockReduction}건</p>
                  </div>
                </div>

                {inventoryOptimization.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">추천 액션</p>
                    {inventoryOptimization.actions.slice(0, 2).map((action) => (
                      <div key={action.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <span className="truncate flex-1">{action.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          +{action.recommendedValue}개 발주
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewDetails('inventory')}
                  >
                    상세 보기
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => onApply('inventory')}
                  >
                    <CheckCircle className="w-3 h-3" />
                    적용
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>분석할 재고 데이터가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
