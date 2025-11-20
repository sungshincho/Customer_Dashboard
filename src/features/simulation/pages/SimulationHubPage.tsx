import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Sparkles, Play, Grid3x3, TrendingUp, DollarSign, Target, Package } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIInference, useScenarioManager, useStoreContext } from '../hooks';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from '@/features/digital-twin/components';
import { LayoutParamsForm } from '../components/params/LayoutParamsForm';
import { DemandParamsForm } from '../components/params/DemandParamsForm';
import { InventoryParamsForm } from '../components/params/InventoryParamsForm';
import { PricingParamsForm } from '../components/params/PricingParamsForm';
import { RecommendationParamsForm } from '../components/params/RecommendationParamsForm';
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
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id);

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
      toast.error('비즈니스 목표를 입력해주세요');
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

    // 실제 데이터 기반 baseline KPI 생성
    const baseline: KpiSnapshot = contextData?.recentKpis.length ? {
      conversionRate: contextData.recentKpis[0].conversionRate || 0.12,
      averageTransactionValue: contextData.recentKpis[0].totalRevenue / Math.max(contextData.recentKpis[0].totalVisits, 1) || 45000,
      salesPerSqm: contextData.recentKpis[0].salesPerSqm || 850000,
      opex: 12000000,
      netProfit: 18000000,
      inventoryTurnover: 4.5,
      customerSatisfaction: 4.2,
    } : {
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

    // 실제 매장 컨텍스트를 AI에 전달
    const result = await infer(scenarioType as any, params, selectedStore.id, contextData);

    if (result) {
      setPredictedKpi(result.predictedKpi);
      setConfidenceScore(result.confidenceScore);
      setAiInsights(result.aiInsights || '');
      
      // 각 시뮬레이션 타입별 특화 데이터 설정
      if (activeTab === 'demand' && (result as any).demandForecast) {
        setDemandForecastData((result as any).demandForecast);
      } else if (activeTab === 'inventory' && (result as any).inventoryOptimization) {
        setInventoryOptimizationData((result as any).inventoryOptimization);
      } else if (activeTab === 'pricing' && (result as any).pricingOptimization) {
        setPricingOptimizationData((result as any).pricingOptimization);
      } else if (activeTab === 'recommendation' && (result as any).recommendationStrategy) {
        setRecommendationStrategyData((result as any).recommendationStrategy);
      }
      
      toast.success('시뮬레이션이 완료되었습니다');
    }
  };

  const handleSave = async () => {
    if (!predictedKpi || !selectedStore) {
      toast.error('먼저 시뮬레이션을 실행해주세요');
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
        name = '수요 예측';
        break;
      case 'inventory':
        params = inventoryParams;
        scenarioType = 'inventory';
        name = '재고 최적화';
        break;
      case 'pricing':
        params = pricingParams;
        scenarioType = 'pricing';
        name = '가격 최적화';
        break;
      case 'recommendation':
        params = recommendationParams;
        scenarioType = 'recommendation';
        name = '추천 전략';
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

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = layoutScenarios.find(s => s.id === scenarioId);
    
    if (scenario && activeTab === 'layout') {
      // Apply scenario parameters
      setLayoutParams({
        changedZones: scenario.changes.map((change, idx) => ({
          zoneId: `zone-${idx + 1}`,
          zoneName: `Zone ${idx + 1}`,
          newFunction: change,
          reason: scenario.description
        })),
        movedFurniture: []
      });
      
      toast.info(`"${scenario.name}" 시나리오가 적용되었습니다`);
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
    return activeTab === 'layout' ? 'layout' : 'none';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">🔮 시뮬레이션 허브</h1>
          <p className="text-muted-foreground mt-2">
            AI 기반 통합 시뮬레이션: 레이아웃, 수요, 재고, 가격, 추천 전략
          </p>
          {contextLoading && (
            <Badge variant="outline" className="mt-2">
              <Package className="h-3 w-3 mr-1" />
              매장 데이터 로딩 중...
            </Badge>
          )}
          {contextData && (
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                온톨로지 엔티티: {contextData.entities.length}개
              </Badge>
              <Badge variant="secondary">
                상품: {contextData.products.length}개
              </Badge>
              <Badge variant="secondary">
                재고 항목: {contextData.inventory.length}개
              </Badge>
            </div>
          )}
        </div>

        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            다양한 비즈니스 시나리오를 설정하고 AI 기반으로 KPI 변화량을 예측합니다.
            {contextData ? ' 실제 매장 데이터를 기반으로 분석합니다.' : ''}
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
              수요 예측
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              재고 최적화
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              가격 최적화
            </TabsTrigger>
            <TabsTrigger value="recommendation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              추천 전략
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>레이아웃 시뮬레이션</CardTitle>
                <CardDescription>
                  매장 레이아웃 변경에 따른 고객 동선과 체류 시간, 전환율 변화를 3D 디지털 트윈으로 시뮬레이션합니다
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI 제안 레이아웃 시나리오 */}
            {layoutScenarios.length > 0 && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI 제안 레이아웃 시나리오 (5개)
                  </CardTitle>
                  <CardDescription>
                    입력하신 비즈니스 목표를 달성하기 위한 레이아웃 변경 시나리오입니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {layoutScenarios.map((scenario) => (
                      <Card 
                        key={scenario.id}
                        className={`cursor-pointer transition-all ${
                          selectedScenarioId === scenario.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleScenarioSelect(scenario.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{scenario.name}</span>
                              {selectedScenarioId === scenario.id && (
                                <Badge variant="default" className="text-xs">선택됨</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{scenario.description}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                              <div className="flex justify-between">
                                <span>전환율 증가:</span>
                                <span className="text-green-500 font-medium">+{(scenario.expectedImpact.conversionRate! * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>체류 시간:</span>
                                <span className="text-green-500 font-medium">+{scenario.expectedImpact.dwellTime!.toFixed(1)}분</span>
                              </div>
                              <div className="flex justify-between">
                                <span>평당매출:</span>
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

            {/* Parameters + 3D Scene (레이아웃만) */}
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

            {/* Results */}
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
          </TabsContent>

          <TabsContent value="demand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>수요 예측</CardTitle>
                <CardDescription>
                  시계열 분석과 AI 추론을 통해 향후 수요를 예측하고 최적 재고 수준을 산정합니다
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시뮬레이션 파라미터</CardTitle>
                <CardDescription>
                  수요 예측에 필요한 파라미터를 입력하세요
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

            {/* Results */}
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

            {demandForecastData && (
              <DemandForecastResult {...demandForecastData} />
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>재고 최적화</CardTitle>
                <CardDescription>
                  AI 기반으로 적정 재고 수준을 산정하고 과재고/품절 위험을 최소화하는 발주 제안을 제공합니다
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시뮬레이션 파라미터</CardTitle>
                <CardDescription>
                  재고 최적화에 필요한 파라미터를 입력하세요
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

            {/* Results */}
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

            {inventoryOptimizationData && (
              <InventoryOptimizationResult {...inventoryOptimizationData} />
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>가격 최적화</CardTitle>
                <CardDescription>
                  가격 탄력성과 수요 곡선 분석을 통해 매출과 마진을 극대화하는 최적 가격을 제안합니다
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시뮬레이션 파라미터</CardTitle>
                <CardDescription>
                  가격 최적화에 필요한 파라미터를 입력하세요
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

            {/* Results */}
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

            {pricingOptimizationData && (
              <PricingOptimizationResult {...pricingOptimizationData} />
            )}
          </TabsContent>

          <TabsContent value="recommendation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>추천 전략 시뮬레이션</CardTitle>
                <CardDescription>
                  고객 세그먼트별 최적 추천 전략을 시뮬레이션하고 CTR, CVR, AOV 변화를 예측합니다
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시뮬레이션 파라미터</CardTitle>
                <CardDescription>
                  추천 전략에 필요한 파라미터를 입력하세요
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

            {/* Results */}
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

            {recommendationStrategyData && (
              <RecommendationStrategyResult {...recommendationStrategyData} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
