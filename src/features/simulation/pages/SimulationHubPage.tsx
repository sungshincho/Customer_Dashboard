import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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

export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { analyzeGoal, infer, loading: isAnalyzing } = useAIInference();
  const { createScenario, updatePrediction, isCreating } = useScenarioManager();

  // Scenario Lab state
  const [goalText, setGoalText] = useState('');
  const [recommendations, setRecommendations] = useState<AISimulationRecommendation[]>([]);

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
      setAiInsights(result.aiInsights);
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
                  <Alert key={idx} className="cursor-pointer hover:bg-accent/50" onClick={() => {
                    if (rec.type === 'demand-inventory') {
                      setActiveTab('demand');
                    } else if (rec.type === 'layout' || rec.type === 'pricing' || rec.type === 'recommendation') {
                      setActiveTab(rec.type);
                    }
                  }}>
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-semibold">{rec.title}</div>
                        <div className="text-sm">{rec.description}</div>
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
            {/* Parameters + 3D Scene */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Parameters */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>시뮬레이션 파라미터</CardTitle>
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
                    시뮬레이션 실행
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!predictedKpi || isCreating}
                    variant="outline"
                    className="flex-1"
                  >
                    시나리오 저장
                  </Button>
                </div>
              </div>

              {/* Right: 3D Scene */}
              <SharedDigitalTwinScene 
                overlayType={getOverlayType() as any}
                height="500px"
              />
            </div>

            {/* Results */}
            {predictedKpi && (
              <Tabs defaultValue="prediction" className="w-full">
                <TabsList>
                  <TabsTrigger value="prediction">예측 결과</TabsTrigger>
                  <TabsTrigger value="comparison">Before/After</TabsTrigger>
                  <TabsTrigger value="chart">KPI 변화</TabsTrigger>
                </TabsList>

                <TabsContent value="prediction" className="mt-4">
                  <PredictionResultCard
                    predictedKpi={predictedKpi}
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
            )}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
