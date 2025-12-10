/**
 * AIRecommendationTab.tsx
 *
 * 인사이트 허브 - AI 추천 탭
 * AI 의사결정 허브 (예측 → 최적화 → 추천 → 실행 → 측정)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  Package,
  Target,
  Play,
  Settings,
  FlaskConical,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';
import type { SourceModule } from '@/features/roi/types/roi.types';

// ============================================================================
// 타입 정의
// ============================================================================
interface ActiveStrategy {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled';
  daysActive: number;
  expectedROI: number;
  currentROI: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
}

interface DemandForecast {
  predictedRevenue: number;
  predictedVisitors: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

interface PriceOptimization {
  totalProducts: number;
  optimizableCount: number;
  potentialRevenueIncreasePercent: number;
}

interface InventoryOptimization {
  totalItems: number;
  orderRecommendations: number;
  stockoutPrevention: number;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function AIRecommendationTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { data: recommendations = [], isLoading } = useAIRecommendations(selectedStore?.id);

  // 적용 모달 상태
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyModalData, setApplyModalData] = useState<{
    source: '2d_simulation' | '3d_simulation';
    sourceModule: SourceModule;
    name: string;
    description?: string;
    settings: Record<string, any>;
    expectedRoi: number;
    expectedRevenue?: number;
    confidence?: number;
    baselineMetrics: Record<string, number>;
  } | null>(null);

  // Mock 데이터 (실제 구현 시 API 연동)
  const activeStrategies: ActiveStrategy[] = useMemo(() => [
    {
      id: '1',
      name: '겨울 패딩 10% 할인',
      status: 'active',
      daysActive: 3,
      expectedROI: 245,
      currentROI: 198,
      progress: 43,
      trend: 'up',
    },
  ], []);

  const demandForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 12.5,
  }), []);

  const visitorForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 8.3,
  }), []);

  const priceOptimization: PriceOptimization = useMemo(() => ({
    totalProducts: 156,
    optimizableCount: 23,
    potentialRevenueIncreasePercent: 15.2,
  }), []);

  const inventoryOptimization: InventoryOptimization = useMemo(() => ({
    totalItems: 89,
    orderRecommendations: 12,
    stockoutPrevention: 5,
  }), []);

  // 추천 전략 변환
  const strategyRecommendations = useMemo(() => {
    return recommendations
      .filter(r => r.status === 'pending')
      .slice(0, 3)
      .map((rec, index) => ({
        id: rec.id,
        rank: index + 1,
        title: rec.title,
        description: rec.description,
        confidence: rec.priority === 'high' ? 94 : rec.priority === 'medium' ? 87 : 75,
        targetAudience: '전체 고객',
        duration: 7,
        expectedResults: {
          revenueIncrease: rec.expected_impact?.revenue_increase || 0,
          conversionIncrease: 2.1,
          roi: rec.priority === 'high' ? 312 : rec.priority === 'medium' ? 187 : 120,
        },
        priority: rec.priority,
      }));
  }, [recommendations]);

  // 가격 최적화 적용
  const handleApplyPriceOptimization = () => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'price_optimization',
      name: `가격 최적화 (${priceOptimization.optimizableCount}개 상품)`,
      description: `${priceOptimization.optimizableCount}개 상품 가격 최적화로 ${priceOptimization.potentialRevenueIncreasePercent}% 매출 증가 예상`,
      settings: { totalProducts: priceOptimization.totalProducts },
      expectedRoi: Math.round(priceOptimization.potentialRevenueIncreasePercent * 10),
      confidence: 88,
      baselineMetrics: {
        totalProducts: priceOptimization.totalProducts,
        optimizableCount: priceOptimization.optimizableCount,
      },
    });
    setShowApplyModal(true);
  };

  // 재고 최적화 적용
  const handleApplyInventoryOptimization = () => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'inventory_optimization',
      name: `재고 최적화 (${inventoryOptimization.orderRecommendations}건 발주)`,
      description: `${inventoryOptimization.stockoutPrevention}건 품절 방지`,
      settings: { totalItems: inventoryOptimization.totalItems },
      expectedRoi: 120,
      confidence: 90,
      baselineMetrics: {
        totalItems: inventoryOptimization.totalItems,
        orderRecommendations: inventoryOptimization.orderRecommendations,
      },
    });
    setShowApplyModal(true);
  };

  // AI 추천 전략 실행
  const handleApplyStrategy = (strategy: typeof strategyRecommendations[0]) => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'ai_recommendation',
      name: strategy.title,
      description: strategy.description,
      settings: { strategyId: strategy.id, priority: strategy.priority },
      expectedRoi: strategy.expectedResults.roi,
      expectedRevenue: strategy.expectedResults.revenueIncrease,
      confidence: strategy.confidence,
      baselineMetrics: {
        conversionIncrease: strategy.expectedResults.conversionIncrease,
      },
    });
    setShowApplyModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI 의사결정 허브
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          데이터 기반 예측 → 최적화 → 추천 → 실행 → 측정
        </p>
      </div>

      {/* 진행 중인 전략 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            진행 중인 전략
            <Badge variant="secondary">{activeStrategies.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" />
            새 전략
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      실행 중
                    </Badge>
                    <span className="font-medium truncate">{strategy.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>D+{strategy.daysActive}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      예상 ROI: {strategy.expectedROI}%
                      <ArrowRight className="w-3 h-3" />
                      <span className={cn(
                        'font-medium',
                        strategy.currentROI >= strategy.expectedROI ? 'text-green-500' : 'text-yellow-500'
                      )}>
                        현재: {strategy.currentROI}%
                      </span>
                      {strategy.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {strategy.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs">
                  상세보기
                </Button>
              </div>
              <Progress value={strategy.progress} className="h-1.5 mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* 1단계: 예측 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
            1
          </div>
          <h3 className="text-lg font-semibold">예측 (Predict)</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                수요 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">다음 7일 예상 매출</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(demandForecast.predictedRevenue)}
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-3 h-3" />
                전주 대비 +{demandForecast.percentChange}%
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                방문자 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">다음 7일 예상 방문</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visitorForecast.predictedVisitors.toLocaleString()}명
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-3 h-3" />
                전주 대비 +{visitorForecast.percentChange}%
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                시즌 트렌드
              </CardTitle>
              <p className="text-xs text-muted-foreground">계절성 분석</p>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">12월 성수기</div>
              <p className="text-sm text-muted-foreground">예상 피크: 12/20-25</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-red-500/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                리스크 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">위험 요소</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">높음</Badge>
                <span className="text-sm">2건</span>
              </div>
              <p className="text-sm text-muted-foreground">재고 부족 위험: 3품목</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* 2단계: 최적화 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
            2
          </div>
          <h3 className="text-lg font-semibold">최적화 (Optimize)</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded bg-yellow-500/20">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </div>
                가격 최적화
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  +{priceOptimization.potentialRevenueIncreasePercent}%
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">상세 보기</Button>
                <Button size="sm" className="flex-1 gap-1" onClick={handleApplyPriceOptimization}>
                  <CheckCircle className="w-3 h-3" />
                  적용
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded bg-green-500/20">
                  <Package className="h-4 w-4 text-green-500" />
                </div>
                재고 최적화
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">품절 방지</p>
                <p className="text-xl font-bold text-red-500">{inventoryOptimization.stockoutPrevention}건</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">상세 보기</Button>
                <Button size="sm" className="flex-1 gap-1" onClick={handleApplyInventoryOptimization}>
                  <CheckCircle className="w-3 h-3" />
                  적용
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* 3단계: 추천 */}
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
            {strategyRecommendations.length > 0 ? (
              strategyRecommendations.map((strategy) => (
                <div
                  key={strategy.id}
                  className={cn(
                    'p-4 rounded-lg border border-l-4 transition-all hover:shadow-md',
                    strategy.rank === 1
                      ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                      : strategy.rank === 2
                      ? 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20'
                      : 'border-l-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <Badge className={cn(
                        'text-xs font-bold',
                        strategy.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        strategy.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                        'bg-orange-600/20 text-orange-600'
                      )}>
                        {strategy.rank}위
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{strategy.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{strategy.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      신뢰도 {strategy.confidence}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {strategy.targetAudience}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {strategy.duration}일
                    </div>
                  </div>

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
                        +{strategy.expectedResults.conversionIncrease}%p
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">예상 ROI</p>
                      <p className="text-sm font-bold text-purple-500">
                        {strategy.expectedResults.roi}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => navigate('/studio')}>
                      <FlaskConical className="w-3 h-3" />
                      시뮬레이션
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Settings className="w-3 h-3" />
                      상세 설정
                    </Button>
                    <Button size="sm" className="flex-1 gap-1" onClick={() => handleApplyStrategy(strategy)}>
                      <Play className="w-3 h-3" />
                      실행하기
                    </Button>
                  </div>
                </div>
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

      {/* ROI 측정 - 별도 페이지로 이동 */}
      <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">
            적용된 전략의 ROI를 측정하고 성과를 추적하세요
          </p>
          <Button variant="outline" onClick={() => navigate('/roi')} className="gap-2">
            <TrendingUp className="w-4 h-4" />
            ROI 측정 대시보드 바로가기
          </Button>
        </div>
      </div>

      {/* 적용 전략 모달 */}
      {showApplyModal && applyModalData && (
        <ApplyStrategyModal
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            setApplyModalData(null);
          }}
          strategyData={applyModalData}
        />
      )}
    </div>
  );
}
