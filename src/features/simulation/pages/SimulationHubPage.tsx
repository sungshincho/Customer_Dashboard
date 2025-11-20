import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Sparkles, Play, Grid3x3, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIInference, useScenarioManager } from '../hooks';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from '@/features/digital-twin/components';
import { LayoutParamsForm } from '../components/params/LayoutParamsForm';
import { DemandParamsForm } from '../components/params/DemandParamsForm';
import { InventoryParamsForm } from '../components/params/InventoryParamsForm';
import { PricingParamsForm } from '../components/params/PricingParamsForm';
import { RecommendationParamsForm } from '../components/params/RecommendationParamsForm';
import { PredictionResultCard, BeforeAfterComparison, KpiDeltaChart } from '../components';
import { DemandForecastResult } from '../components/DemandForecastResult';
import { InventoryOptimizationResult } from '../components/InventoryOptimizationResult';
import { PricingOptimizationResult } from '../components/PricingOptimizationResult';
import { RecommendationStrategyResult } from '../components/RecommendationStrategyResult';
import { LayoutParams, DemandParams, InventoryParams, PricingParams, RecommendationParams, KpiSnapshot } from '../types';

type SimType = 'layout' | 'demand' | 'inventory' | 'pricing' | 'recommendation';

interface AISimulationRecommendation {
  type: 'layout' | 'pricing' | 'demand-inventory' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  expectedImpact: string;
}

interface LayoutScenario {
  id: string;
  name: string;
  description: string;
  changes: string[];
  expectedImpact: {
    conversionRate?: number;
    dwellTime?: number;
    salesPerSqm?: number;
  };
}

export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { analyzeGoal, infer, loading: isAnalyzing } = useAIInference();
  const { createScenario, updatePrediction, isCreating } = useScenarioManager();

  // Scenario Lab state
  const [goalText, setGoalText] = useState('');
  const [recommendations, setRecommendations] = useState<AISimulationRecommendation[]>([]);
  const [layoutScenarios, setLayoutScenarios] = useState<LayoutScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Active simulation state
  const [activeTab, setActiveTab] = useState<SimType>('layout');
  const [layoutParams, setLayoutParams] = useState<LayoutParams>({ changedZones: [], movedFurniture: [] });
  const [demandParams, setDemandParams] = useState<DemandParams>({});
  const [inventoryParams, setInventoryParams] = useState<InventoryParams>({});
  const [pricingParams, setPricingParams] = useState<PricingParams>({});
  const [recommendationParams, setRecommendationParams] = useState<RecommendationParams>({});

  // Simulation results
  const [baselineKpi, setBaselineKpi] = useState<KpiSnapshot | null>(null);
  const [predictedKpi, setPredictedKpi] = useState<KpiSnapshot | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  
  // Specialized simulation results
  const [demandForecastData, setDemandForecastData] = useState<any>(null);
  const [inventoryOptimizationData, setInventoryOptimizationData] = useState<any>(null);
  const [pricingOptimizationData, setPricingOptimizationData] = useState<any>(null);
  const [recommendationStrategyData, setRecommendationStrategyData] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!goalText.trim()) {
      toast.error('목표를 입력해주세요');
      return;
    }

    if (!selectedStore) {
      toast.error('매장을 선택해주세요');
      return;
    }

    const result = await analyzeGoal(goalText, selectedStore.id);
    
    if (result) {
      setRecommendations(result);
      
      // 레이아웃 추천이 포함된 경우 5개 시나리오 생성
      const layoutRec = result.find(r => r.type === 'layout');
      if (layoutRec) {
        const scenarios: LayoutScenario[] = layoutRec.suggestedActions.slice(0, 5).map((action, idx) => ({
          id: `scenario-${idx + 1}`,
          name: `레이아웃 시나리오 ${idx + 1}`,
          description: action,
          changes: [action],
          expectedImpact: {
            conversionRate: 0.1 + (idx * 0.02),
            dwellTime: 1.5 + (idx * 0.3),
            salesPerSqm: 50000 + (idx * 10000)
          }
        }));
        setLayoutScenarios(scenarios);
      }
      
      toast.success('AI 분석이 완료되었습니다');
      
      // Auto-switch to first recommended simulation type
      if (result.length > 0) {
        const firstRec = result[0];
        if (firstRec.type === 'demand-inventory') {
          setActiveTab('demand');
        } else {
          setActiveTab(firstRec.type as SimType);
        }
      }
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedStore) {
      toast.error('매장을 선택해주세요');
      return;
    }

    // Mock baseline KPI
    const baseline: KpiSnapshot = {
      conversionRate: 0.12,
      averageTransactionValue: 45000,
      salesPerSqm: 850000,
      opex: 12000000,
      netProfit: 18000000,
      inventoryTurnover: 4.5,
      customerSatisfaction: 4.2,
    };
    setBaselineKpi(baseline);

    // Get params based on active tab
    let params: any;
    let scenarioType: string;
    
    switch (activeTab) {
      case 'layout':
        params = layoutParams;
        scenarioType = 'layout';
        break;
      case 'demand':
        params = demandParams;
        scenarioType = 'demand';
        break;
      case 'inventory':
        params = inventoryParams;
        scenarioType = 'inventory';
        break;
      case 'pricing':
        params = pricingParams;
        scenarioType = 'pricing';
        break;
      case 'recommendation':
        params = recommendationParams;
        scenarioType = 'recommendation';
        break;
      default:
        return;
    }

    const result = await infer(scenarioType as any, params, selectedStore.id);

    if (result) {
      setPredictedKpi(result.predictedKpi);
      setConfidenceScore(result.confidenceScore);
      setAiInsights(result.aiInsights || '');
      
      // 각 시뮬레이션 타입별 특화 데이터 설정 (Mock 데이터)
      if (activeTab === 'demand') {
        setDemandForecastData({
          forecastData: {
            dates: Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              return date.toISOString();
            }),
            predictedDemand: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 100),
            confidence: Array.from({ length: 30 }, () => 0.7 + Math.random() * 0.2),
            peakDays: [
              new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            ],
          },
          summary: {
            avgDailyDemand: 125,
            peakDemand: 180,
            totalForecast: 3750,
            trend: 'increasing' as const,
          },
        });
      } else if (activeTab === 'inventory') {
        setInventoryOptimizationData({
          recommendations: Array.from({ length: 15 }, (_, i) => ({
            productSku: `SKU-${1000 + i}`,
            productName: `상품 ${i + 1}`,
            currentStock: Math.floor(Math.random() * 100) + 20,
            optimalStock: Math.floor(Math.random() * 80) + 40,
            reorderPoint: Math.floor(Math.random() * 30) + 20,
            safetyStock: Math.floor(Math.random() * 20) + 10,
            orderQuantity: Math.floor(Math.random() * 50) + 30,
            urgency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
          })),
          summary: {
            totalProducts: 15,
            overstocked: 3,
            understocked: 5,
            optimal: 7,
            potentialSavings: 2500000,
            expectedTurnover: 6.5,
          },
        });
      } else if (activeTab === 'pricing') {
        setPricingOptimizationData({
          recommendations: Array.from({ length: 12 }, (_, i) => ({
            productSku: `SKU-${2000 + i}`,
            productName: `상품 ${i + 1}`,
            currentPrice: 50000 + Math.floor(Math.random() * 50000),
            optimalPrice: 50000 + Math.floor(Math.random() * 50000),
            priceChange: (Math.random() - 0.5) * 20,
            expectedDemandChange: (Math.random() - 0.3) * 15,
            expectedRevenueChange: Math.random() * 20 + 5,
            elasticity: Math.random() * 2 + 0.5,
          })),
          summary: {
            totalProducts: 12,
            avgPriceChange: -3.5,
            expectedRevenueIncrease: 4500000,
            expectedMarginIncrease: 2.3,
            recommendedDiscounts: 7,
            recommendedIncreases: 5,
          },
        });
      } else if (activeTab === 'recommendation') {
        setRecommendationStrategyData({
          strategies: [
            {
              strategyName: '교차 판매 전략 A',
              strategyType: 'cross-sell' as const,
              targetSegment: '신규 고객',
              expectedCTR: 15.3,
              expectedCVR: 8.2,
              expectedAOVIncrease: 12.5,
              productPairs: [
                { product1: '상품 A', product2: '상품 B', affinity: 0.85 },
                { product1: '상품 C', product2: '상품 D', affinity: 0.78 },
              ],
            },
            {
              strategyName: '개인화 추천 전략',
              strategyType: 'personalized' as const,
              targetSegment: 'VIP 고객',
              expectedCTR: 22.1,
              expectedCVR: 12.8,
              expectedAOVIncrease: 18.3,
              productPairs: [],
            },
          ],
          summary: {
            totalStrategies: 2,
            avgCTRIncrease: 18.7,
            avgCVRIncrease: 10.5,
            avgAOVIncrease: 15.4,
            expectedRevenueImpact: 8500000,
          },
          performanceMetrics: [
            { metric: 'CTR', current: 5.2, predicted: 6.2 },
            { metric: 'CVR', current: 2.8, predicted: 3.1 },
            { metric: 'AOV', current: 45000, predicted: 52000 },
          ],
        });
      }
      
      toast.success('시뮬레이션이 완료되었습니다');
    }
  };

  const handleSave = async () => {
    if (!selectedStore || !predictedKpi) {
      toast.error('시뮬레이션을 먼저 실행해주세요');
      return;
    }

    let params: any;
    let scenarioType: string;
    let name: string;
    
    switch (activeTab) {
      case 'layout':
        params = layoutParams;
        scenarioType = 'layout';
        name = '레이아웃 시뮬레이션';
        break;
      case 'demand':
        params = demandParams;
        scenarioType = 'demand';
        name = '수요 시뮬레이션';
        break;
      case 'inventory':
        params = inventoryParams;
        scenarioType = 'inventory';
        name = '재고 시뮬레이션';
        break;
      case 'pricing':
        params = pricingParams;
        scenarioType = 'pricing';
        name = '가격 시뮬레이션';
        break;
      case 'recommendation':
        params = recommendationParams;
        scenarioType = 'recommendation';
        name = '추천 시뮬레이션';
        break;
      default:
        return;
    }

    const scenario = await createScenario({
      name: `${name} - ${new Date().toLocaleDateString()}`,
      scenarioType: scenarioType as any,
      params,
      description: goalText || undefined,
      storeId: selectedStore.id,
    });

    if (scenario) {
      await updatePrediction({
        id: scenario.id,
        predictedKpi,
        confidenceScore: confidenceScore || 0,
        aiInsights,
      });
      
      toast.success('시나리오가 저장되었습니다');
    }
  };

  const getTabIcon = (type: SimType) => {
    switch (type) {
      case 'layout': return Grid3x3;
      case 'demand': return TrendingUp;
      case 'inventory': return TrendingUp;
      case 'pricing': return DollarSign;
      case 'recommendation': return Target;
    }
  };

  const renderParamsForm = () => {
    switch (activeTab) {
      case 'layout':
        return <LayoutParamsForm params={layoutParams} onChange={setLayoutParams} />;
      case 'demand':
        return <DemandParamsForm params={demandParams} onChange={setDemandParams} />;
      case 'inventory':
        return <InventoryParamsForm params={inventoryParams} onChange={setInventoryParams} />;
      case 'pricing':
        return <PricingParamsForm params={pricingParams} onChange={setPricingParams} />;
      case 'recommendation':
        return <RecommendationParamsForm params={recommendationParams} onChange={setRecommendationParams} />;
    }
  };

  const getOverlayType = () => {
    switch (activeTab) {
      case 'layout': return 'layout';
      case 'recommendation': return 'recommendation';
      default: return 'none';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">🔮 시뮬레이션 허브</h1>
          <p className="text-muted-foreground mt-2">
            Digital Twin 3D 기반 통합 시뮬레이션: 레이아웃, 수요, 재고, 가격, 추천 전략
          </p>
        </div>

        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            다양한 비즈니스 시나리오를 설정하고 AI 기반으로 KPI 변화량을 예측합니다.
          </AlertDescription>
        </Alert>

        {!selectedStore && (
          <Alert>
            <AlertDescription>
              매장을 선택하여 시뮬레이션을 시작하세요.
            </AlertDescription>
          </Alert>
        )}

        {/* Scenario Lab - Goal Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              시나리오 목표 분석
            </CardTitle>
            <CardDescription>
              비즈니스 목표를 입력하면 AI가 최적의 시뮬레이션 전략을 추천합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="예: 고객 체류 시간을 늘려 전환율을 높이고 싶습니다"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !selectedStore}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'AI 분석 중...' : 'AI 목표 분석'}
            </Button>

            {recommendations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold">AI 추천 전략</h3>
                {recommendations.map((rec, idx) => (
                  <Alert key={idx} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => {
                    if (rec.type === 'demand-inventory') {
                      setActiveTab('demand');
                    } else if (rec.type === 'layout' || rec.type === 'pricing' || rec.type === 'recommendation') {
                      setActiveTab(rec.type);
                    }
                  }}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {rec.title}
                              <Badge variant={rec.priority === 'high' ? 'default' : 'secondary'}>
                                {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}
                              </Badge>
                            </div>
                            <div className="text-sm mt-1">{rec.description}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          💡 예상 효과: {rec.expectedImpact}
                        </div>
                        {rec.suggestedActions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium">제안 액션:</div>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {rec.suggestedActions.slice(0, 3).map((action, i) => (
                                <li key={i}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SimType)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              레이아웃
            </TabsTrigger>
            <TabsTrigger value="demand" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              수요
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              재고
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              가격
            </TabsTrigger>
            <TabsTrigger value="recommendation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              추천
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-6">
            {/* Tab Description */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                {activeTab === 'layout' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">레이아웃 최적화 시뮬레이션</h3>
                    <p className="text-sm text-muted-foreground">
                      매장 내 구역 배치와 가구 이동을 시뮬레이션하여 고객 동선, 체류시간, 전환율에 미치는 영향을 예측합니다.
                      AI가 5가지 레이아웃 시나리오를 제안하고 각각의 예상 효과를 분석합니다.
                    </p>
                  </div>
                )}
                {activeTab === 'demand' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">수요 예측 시뮬레이션</h3>
                    <p className="text-sm text-muted-foreground">
                      날씨, 이벤트, 경제 지표 등 외부 요인을 고려하여 향후 수요를 예측합니다.
                      예측 결과를 바탕으로 재고 준비와 인력 배치를 최적화할 수 있습니다.
                    </p>
                  </div>
                )}
                {activeTab === 'inventory' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">재고 최적화 시뮬레이션</h3>
                    <p className="text-sm text-muted-foreground">
                      서비스 수준 목표, 리드타임, 발주 주기 등을 고려하여 최적의 재고 수준을 계산합니다.
                      재고 회전율을 높이고 재고 비용을 절감하면서도 품절을 최소화하는 전략을 제안합니다.
                    </p>
                  </div>
                )}
                {activeTab === 'pricing' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">가격 최적화 시뮬레이션</h3>
                    <p className="text-sm text-muted-foreground">
                      가격 변동, 할인 전략, 목표 마진 등을 시뮬레이션하여 매출과 수익에 미치는 영향을 예측합니다.
                      수요 탄력성과 경쟁 상황을 고려한 최적 가격 전략을 제안합니다.
                    </p>
                  </div>
                )}
                {activeTab === 'recommendation' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">추천 전략 시뮬레이션</h3>
                    <p className="text-sm text-muted-foreground">
                      상품 추천 알고리즘, 프로모션 전략, 마케팅 캠페인의 효과를 시뮬레이션합니다.
                      교차 판매율, 객단가, 고객 만족도 향상 효과를 예측하고 최적의 추천 전략을 제안합니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Layout Scenarios Selection (레이아웃 탭에서만 표시) */}
            {activeTab === 'layout' && layoutScenarios.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>AI 제안 레이아웃 시나리오 (5가지)</CardTitle>
                  <CardDescription>
                    시나리오를 선택하면 자동으로 파라미터가 설정됩니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {layoutScenarios.map((scenario) => (
                      <Card 
                        key={scenario.id}
                        className={`cursor-pointer transition-all ${
                          selectedScenarioId === scenario.id 
                            ? 'border-primary bg-primary/10 shadow-md' 
                            : 'hover:border-primary/50 hover:shadow'
                        }`}
                        onClick={() => {
                          setSelectedScenarioId(scenario.id);
                          // 시나리오 선택 시 레이아웃 파라미터 자동 설정
                          toast.success(`${scenario.name}이(가) 선택되었습니다`);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="font-semibold">{scenario.name}</div>
                            <div className="text-sm text-muted-foreground">{scenario.description}</div>
                            <div className="pt-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>전환율 향상:</span>
                                <span className="text-green-500 font-medium">
                                  +{(scenario.expectedImpact.conversionRate! * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>체류시간 증가:</span>
                                <span className="text-green-500 font-medium">
                                  +{scenario.expectedImpact.dwellTime?.toFixed(1)}분
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>평당매출 증가:</span>
                                <span className="text-green-500 font-medium">
                                  +{(scenario.expectedImpact.salesPerSqm! / 10000).toFixed(0)}만원
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parameters + 3D Scene (3D는 레이아웃만) */}
            {activeTab === 'layout' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Parameters */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>시뮬레이션 파라미터</CardTitle>
                      <CardDescription>
                        {layoutScenarios.length > 0 ? '위에서 시나리오를 선택하거나 직접 설정하세요' : '시뮬레이션에 필요한 파라미터를 입력하세요'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderParamsForm()}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRunSimulation}
                      disabled={isAnalyzing || !selectedStore}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isAnalyzing ? '실행 중...' : '시뮬레이션 실행'}
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={!predictedKpi || isCreating}
                      variant="outline"
                      className="flex-1"
                    >
                      {isCreating ? '저장 중...' : '시나리오 저장'}
                    </Button>
                  </div>
                </div>

                {/* Right: 3D Scene (레이아웃만) */}
                <SharedDigitalTwinScene 
                  overlayType={getOverlayType() as any}
                  height="500px"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>시뮬레이션 파라미터</CardTitle>
                    <CardDescription>
                      시뮬레이션에 필요한 파라미터를 입력하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderParamsForm()}
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRunSimulation}
                    disabled={isAnalyzing || !selectedStore}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isAnalyzing ? '실행 중...' : '시뮬레이션 실행'}
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!predictedKpi || isCreating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isCreating ? '저장 중...' : '시나리오 저장'}
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {predictedKpi && (
              <div className="space-y-4">
                {/* AI Insights 별도 표시 */}
                {aiInsights && (
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI 인사이트
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsights}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 시뮬레이션 타입별 특화 결과 표시 */}
                {activeTab === 'demand' && demandForecastData && (
                  <DemandForecastResult {...demandForecastData} />
                )}

                {activeTab === 'inventory' && inventoryOptimizationData && (
                  <InventoryOptimizationResult {...inventoryOptimizationData} />
                )}

                {activeTab === 'pricing' && pricingOptimizationData && (
                  <PricingOptimizationResult {...pricingOptimizationData} />
                )}

                {activeTab === 'recommendation' && recommendationStrategyData && (
                  <RecommendationStrategyResult {...recommendationStrategyData} />
                )}

                {/* 공통 KPI 비교 결과 */}
                <Tabs defaultValue="prediction" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="prediction">예측 KPI</TabsTrigger>
                    <TabsTrigger value="comparison">Before/After</TabsTrigger>
                    <TabsTrigger value="chart">KPI 변화</TabsTrigger>
                  </TabsList>

                  <TabsContent value="prediction" className="mt-4">
                    <PredictionResultCard
                      predictedKpi={predictedKpi}
                      baselineKpi={baselineKpi || undefined}
                      confidenceScore={confidenceScore || 0}
                      aiInsights={aiInsights}
                    />
                  </TabsContent>

                  <TabsContent value="comparison" className="mt-4">
                    {baselineKpi && (
                      <BeforeAfterComparison
                        baseline={baselineKpi}
                        predicted={predictedKpi}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="chart" className="mt-4">
                    {baselineKpi && (
                      <KpiDeltaChart
                        baseline={baselineKpi}
                        predicted={predictedKpi}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
