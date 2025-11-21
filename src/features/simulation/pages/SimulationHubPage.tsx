import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Grid3x3, TrendingUp, DollarSign, Target, Package, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIInference, useStoreContext } from '../hooks';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from '@/features/digital-twin/components';
import { DemandForecastResult } from '../components/DemandForecastResult';
import { InventoryOptimizationResult } from '../components/InventoryOptimizationResult';
import { PricingOptimizationResult } from '../components/PricingOptimizationResult';
import { RecommendationStrategyResult } from '../components/RecommendationStrategyResult';

interface SimulationResult {
  type: 'demand' | 'layout' | 'inventory' | 'pricing' | 'recommendation';
  title: string;
  icon: React.ReactNode;
  data: any;
  loading: boolean;
}

export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { infer, loading: isInferring } = useAIInference();
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id);

  // Simulation results
  const [demandForecast, setDemandForecast] = useState<any>(null);
  const [layoutOptimization, setLayoutOptimization] = useState<any>(null);
  const [inventoryOptimization, setInventoryOptimization] = useState<any>(null);
  const [pricingOptimization, setPricingOptimization] = useState<any>(null);
  const [recommendationStrategy, setRecommendationStrategy] = useState<any>(null);
  
  const [loadingStates, setLoadingStates] = useState({
    demand: false,
    layout: false,
    inventory: false,
    pricing: false,
    recommendation: false
  });

  // 자동 시뮬레이션 실행
  const runSimulation = async (type: 'demand' | 'layout' | 'inventory' | 'pricing' | 'recommendation') => {
    if (!selectedStore || !contextData) {
      toast.error('매장 데이터를 불러오는 중입니다');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [type]: true }));

    try {
      const result = await infer(type, {}, selectedStore.id, contextData);
      
      if (result) {
        switch (type) {
          case 'demand':
            setDemandForecast((result as any).demandForecast || result);
            break;
          case 'layout':
            setLayoutOptimization(result);
            break;
          case 'inventory':
            setInventoryOptimization((result as any).inventoryOptimization || result);
            break;
          case 'pricing':
            setPricingOptimization((result as any).pricingOptimization || result);
            break;
          case 'recommendation':
            setRecommendationStrategy((result as any).recommendationStrategy || result);
            break;
        }
        toast.success(`${getSimulationTitle(type)} 완료`);
      }
    } catch (error) {
      console.error(`${type} simulation error:`, error);
      toast.error(`${getSimulationTitle(type)} 실패`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const runAllSimulations = async () => {
    if (!selectedStore || !contextData) {
      toast.error('매장을 선택하고 데이터를 불러온 후 시도하세요');
      return;
    }

    toast.info('전체 시뮬레이션을 시작합니다...');
    
    await Promise.all([
      runSimulation('demand'),
      runSimulation('layout'),
      runSimulation('inventory'),
      runSimulation('pricing'),
      runSimulation('recommendation')
    ]);

    toast.success('모든 시뮬레이션이 완료되었습니다');
  };

  const getSimulationTitle = (type: string) => {
    const titles: Record<string, string> = {
      demand: '수요 예측',
      layout: '레이아웃 최적화',
      inventory: '재고 최적화',
      pricing: '가격 최적화',
      recommendation: '마케팅 전략'
    };
    return titles[type] || type;
  };

  // 매장 선택 시 자동으로 전체 시뮬레이션 실행
  useEffect(() => {
    if (selectedStore && contextData && !contextLoading) {
      // 이미 실행된 시뮬레이션이 없을 때만 자동 실행
      if (!demandForecast && !layoutOptimization && !inventoryOptimization && !pricingOptimization && !recommendationStrategy) {
        runAllSimulations();
      }
    }
  }, [selectedStore, contextData, contextLoading]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              시뮬레이션 허브
            </h1>
            <p className="text-muted-foreground mt-2">
              임포트된 데이터와 매장 현황을 AI가 자동 분석하여 최적화 방안을 제안합니다
            </p>
            {contextData && (
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary">
                  <Package className="h-3 w-3 mr-1" />
                  엔티티 {contextData.entities.length}개
                </Badge>
                <Badge variant="secondary">
                  상품 {contextData.products.length}개
                </Badge>
                <Badge variant="secondary">
                  재고 {contextData.inventory.length}개
                </Badge>
                <Badge variant="secondary">
                  KPI {contextData.recentKpis.length}일
                </Badge>
              </div>
            )}
          </div>
          <Button 
            onClick={runAllSimulations}
            disabled={!selectedStore || !contextData || contextLoading || isInferring}
            size="lg"
          >
            {contextLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                데이터 로딩 중...
              </>
            ) : isInferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                전체 재분석
              </>
            )}
          </Button>
        </div>

        {!selectedStore && (
          <Alert>
            <AlertDescription>
              매장을 선택하면 AI가 자동으로 데이터를 분석하여 최적화 방안을 제안합니다.
            </AlertDescription>
          </Alert>
        )}

        {contextLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              매장 데이터를 불러오는 중입니다...
            </AlertDescription>
          </Alert>
        )}

        {/* 레이아웃 최적화 - 상단 전체 너비 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-cyan-500" />
                레이아웃 최적화
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => runSimulation('layout')}
                disabled={loadingStates.layout || !contextData}
              >
                {loadingStates.layout ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              고객 동선 분석을 기반으로 최적의 매장 레이아웃을 3D로 제안합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStates.layout && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            )}
            {!loadingStates.layout && layoutOptimization && (
              <div className="space-y-4">
                <div className="h-96 bg-muted rounded-lg">
                  <SharedDigitalTwinScene overlayType="layout" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">추천 변경사항</h4>
                  <p className="text-sm text-muted-foreground">
                    {layoutOptimization.aiInsights || '레이아웃 최적화 제안을 생성 중입니다...'}
                  </p>
                  {layoutOptimization.predictedKpi && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">전환율</div>
                        <div className="text-lg font-bold text-green-500">
                          +{((layoutOptimization.predictedKpi.conversionRate - 0.12) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">매출/㎡</div>
                        <div className="text-lg font-bold text-green-500">
                          +{((layoutOptimization.predictedKpi.salesPerSqm - 850000) / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!loadingStates.layout && !layoutOptimization && contextData && (
              <div className="text-center py-8 text-muted-foreground">
                <p>분석을 시작하려면 새로고침 버튼을 클릭하세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 나머지 4개 시뮬레이션 - 2x2 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. 수요 예측 */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-cyan-500" />
                  레이아웃 최적화
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runSimulation('layout')}
                  disabled={loadingStates.layout || !contextData}
                >
                  {loadingStates.layout ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                고객 동선 분석을 기반으로 최적의 매장 레이아웃을 3D로 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.layout && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              )}
              {!loadingStates.layout && layoutOptimization && (
                <div className="space-y-4">
                  <div className="h-64 bg-muted rounded-lg">
                    <SharedDigitalTwinScene overlayType="layout" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">추천 변경사항</h4>
                    <p className="text-sm text-muted-foreground">
                      {layoutOptimization.aiInsights || '레이아웃 최적화 제안을 생성 중입니다...'}
                    </p>
                    {layoutOptimization.predictedKpi && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">전환율</div>
                          <div className="text-lg font-bold text-green-500">
                            +{((layoutOptimization.predictedKpi.conversionRate - 0.12) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">매출/㎡</div>
                          <div className="text-lg font-bold text-green-500">
                            +{((layoutOptimization.predictedKpi.salesPerSqm - 850000) / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!loadingStates.layout && !layoutOptimization && contextData && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>분석을 시작하려면 새로고침 버튼을 클릭하세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. 재고 최적화 */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  재고 최적화
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runSimulation('inventory')}
                  disabled={loadingStates.inventory || !contextData}
                >
                  {loadingStates.inventory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                현재 재고 상태를 분석하여 최적 재고 수준과 발주 시점을 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.inventory && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              )}
              {!loadingStates.inventory && inventoryOptimization && (
                <InventoryOptimizationResult 
                  recommendations={inventoryOptimization.recommendations}
                  summary={inventoryOptimization.summary}
                />
              )}
              {!loadingStates.inventory && !inventoryOptimization && contextData && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>분석을 시작하려면 새로고침 버튼을 클릭하세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. 가격 최적화 */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  가격 최적화
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runSimulation('pricing')}
                  disabled={loadingStates.pricing || !contextData}
                >
                  {loadingStates.pricing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                가격 탄력성과 경쟁사 분석을 통해 최적 가격 전략을 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.pricing && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
              )}
              {!loadingStates.pricing && pricingOptimization && (
                <PricingOptimizationResult 
                  recommendations={pricingOptimization.recommendations}
                  summary={pricingOptimization.summary}
                />
              )}
              {!loadingStates.pricing && !pricingOptimization && contextData && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>분석을 시작하려면 새로고침 버튼을 클릭하세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. 마케팅/프로모션 전략 */}
          <Card className="relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  추천 마케팅·프로모션 전략
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runSimulation('recommendation')}
                  disabled={loadingStates.recommendation || !contextData}
                >
                  {loadingStates.recommendation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                고객 세그먼트 분석을 통해 개인화된 마케팅 전략과 프로모션을 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.recommendation && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              )}
              {!loadingStates.recommendation && recommendationStrategy && (
                <RecommendationStrategyResult 
                  strategies={recommendationStrategy.strategies}
                  summary={recommendationStrategy.summary}
                  performanceMetrics={recommendationStrategy.performanceMetrics}
                />
              )}
              {!loadingStates.recommendation && !recommendationStrategy && contextData && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>분석을 시작하려면 새로고침 버튼을 클릭하세요</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
