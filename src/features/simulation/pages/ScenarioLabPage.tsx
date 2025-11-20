import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, Play, History } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import {
  ScenarioTypeSelector,
  PredictionResultCard,
  BeforeAfterComparison,
  KpiDeltaChart,
  ScenarioSaveDialog,
} from '../components';
import {
  useAIInference,
  useScenarioManager,
  useKpiComparison,
} from '../hooks';
import { ScenarioType, KpiSnapshot } from '../types';
import { LayoutParamsForm } from '../components/params/LayoutParamsForm';
import { PricingParamsForm } from '../components/params/PricingParamsForm';
import { InventoryParamsForm } from '../components/params/InventoryParamsForm';
import { DemandParamsForm } from '../components/params/DemandParamsForm';
import { RecommendationParamsForm } from '../components/params/RecommendationParamsForm';
import { ScenarioList } from '../components/ScenarioList';

export default function ScenarioLabPage() {
  const { selectedStore } = useSelectedStore();
  const [scenarioType, setScenarioType] = useState<ScenarioType>('layout');
  const [params, setParams] = useState<Record<string, any>>({});
  const [baselineKpi, setBaselineKpi] = useState<KpiSnapshot | undefined>();
  const [predictedKpi, setPredictedKpi] = useState<KpiSnapshot | undefined>();
  const [confidenceScore, setConfidenceScore] = useState<number | undefined>();
  const [aiInsights, setAiInsights] = useState<string | undefined>();

  const { infer, loading: isInferring } = useAIInference();
  const { createScenario, updatePrediction, isCreating } = useScenarioManager(selectedStore?.id);
  const { deltas } = useKpiComparison(baselineKpi, predictedKpi);

  const handleRunSimulation = async () => {
    if (!selectedStore) {
      return;
    }

    // Mock baseline KPI
    const mockBaseline: KpiSnapshot = {
      conversionRate: 15.5,
      totalVisits: 1000,
      totalPurchases: 155,
      totalRevenue: 15500000,
      averageTransactionValue: 100000,
      salesPerSqm: 450000,
      opex: 5000000,
      netProfit: 3500000,
    };

    setBaselineKpi(mockBaseline);

    const result = await infer(scenarioType, params, selectedStore.id);

    if (result) {
      setPredictedKpi(result.predictedKpi);
      setConfidenceScore(result.confidenceScore);
      setAiInsights(result.aiInsights);
    }
  };

  const handleSaveScenario = async (name: string, description?: string) => {
    if (!selectedStore) return;

    const scenario = await createScenario({
      scenarioType,
      name,
      description,
      params,
      storeId: selectedStore.id,
    });

    if (scenario && predictedKpi && confidenceScore && aiInsights) {
      await updatePrediction({
        id: scenario.id,
        predictedKpi,
        confidenceScore,
        aiInsights,
      });
    }
  };

  const handleLoadScenario = (loadedParams: Record<string, any>, loadedType: ScenarioType) => {
    setScenarioType(loadedType);
    setParams(loadedParams);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧪 Scenario Lab</h1>
          <p className="text-muted-foreground mt-2">
            시나리오 생성: 레이아웃, 스태핑, 프로모션, 가격/재고 | KPI 예측: ΔCVR, ΔATV, ΔSales/㎡, ΔOpex, ΔProfit
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 시나리오 설정 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시나리오 설정</CardTitle>
                <CardDescription>시뮬레이션할 시나리오 타입과 파라미터를 설정하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 시나리오 타입 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">시나리오 타입</label>
                  <ScenarioTypeSelector value={scenarioType} onChange={setScenarioType} />
                </div>

                {/* 타입별 파라미터 폼 */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  {scenarioType === 'layout' && (
                    <LayoutParamsForm params={params} onChange={setParams} />
                  )}
                  {scenarioType === 'pricing' && (
                    <PricingParamsForm params={params} onChange={setParams} />
                  )}
                  {scenarioType === 'inventory' && (
                    <InventoryParamsForm params={params} onChange={setParams} />
                  )}
                  {scenarioType === 'demand' && (
                    <DemandParamsForm params={params} onChange={setParams} />
                  )}
                  {scenarioType === 'recommendation' && (
                    <RecommendationParamsForm params={params} onChange={setParams} />
                  )}
                  {(scenarioType === 'staffing' || scenarioType === 'promotion') && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{scenarioType === 'staffing' ? '스태핑' : '프로모션'} 시뮬레이션 파라미터는 곧 추가됩니다.</p>
                    </div>
                  )}
                </div>

                {/* 실행 버튼 */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRunSimulation}
                    disabled={!selectedStore || isInferring}
                    className="flex-1 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isInferring ? '시뮬레이션 실행 중...' : '시뮬레이션 실행'}
                  </Button>
                  {predictedKpi && (
                    <ScenarioSaveDialog
                      onSave={handleSaveScenario}
                      isSaving={isCreating}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 예측 결과 */}
            {predictedKpi && (
              <Tabs defaultValue="result" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="result">예측 결과</TabsTrigger>
                  <TabsTrigger value="comparison">Before/After</TabsTrigger>
                  <TabsTrigger value="delta">변화량 차트</TabsTrigger>
                </TabsList>
                <TabsContent value="result" className="mt-4">
                  <PredictionResultCard
                    predictedKpi={predictedKpi}
                    baselineKpi={baselineKpi}
                    confidenceScore={confidenceScore}
                    aiInsights={aiInsights}
                  />
                </TabsContent>
                <TabsContent value="comparison" className="mt-4">
                  <BeforeAfterComparison baseline={baselineKpi} predicted={predictedKpi} />
                </TabsContent>
                <TabsContent value="delta" className="mt-4">
                  <KpiDeltaChart deltas={deltas} />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* 우측: 저장된 시나리오 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  <CardTitle>저장된 시나리오</CardTitle>
                </div>
                <CardDescription>이전에 저장한 시나리오를 불러올 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioList
                  storeId={selectedStore?.id}
                  onLoad={handleLoadScenario}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
