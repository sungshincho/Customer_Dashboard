import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Grid3x3, Play, Eye, EyeOff } from "lucide-react";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";
import { LayoutParamsForm } from "../components/params/LayoutParamsForm";
import { PredictionResultCard, BeforeAfterComparison, KpiDeltaChart, BeforeAfterSceneComparison } from "../components";
import { useAIInference, useScenarioManager } from "../hooks";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { LayoutParams, KpiSnapshot } from "../types";
import { toast } from "sonner";
import { LayoutChangeOverlay } from "@/features/digital-twin/components/overlays/LayoutChangeOverlay";
import { CustomerFlowOverlay } from "@/features/digital-twin/components/overlays/CustomerFlowOverlay";

export default function LayoutSimPage() {
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { infer, loading: isInferring } = useAIInference();
  const { createScenario, updatePrediction, isCreating } = useScenarioManager();

  const [params, setParams] = useState<LayoutParams>({
    changedZones: [],
    movedFurniture: [],
  });

  const [baselineKpi, setBaselineKpi] = useState<KpiSnapshot | null>(null);
  const [predictedKpi, setPredictedKpi] = useState<KpiSnapshot | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [showPreview, setShowPreview] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictedFlowData, setPredictedFlowData] = useState<any>(null);

  const recommendation = location.state?.recommendation;
  const goalText = location.state?.goalText;

  const handleRunSimulation = async () => {
    if (!selectedStore) {
      toast.error("매장을 선택해주세요");
      return;
    }

    if (!params.changedZones || params.changedZones.length === 0) {
      toast.error("최소 하나의 존 변경을 추가해주세요");
      return;
    }

    setIsSimulating(true);

    try {
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

      // AI Inference with layout context
      const enrichedParams = {
        ...params,
        storeContext: {
          storeId: selectedStore.id,
          storeName: selectedStore.store_name,
          goalText: goalText || "레이아웃 최적화를 통한 매출 증대",
        },
      };

      const result = await infer("layout", enrichedParams, selectedStore.id);

      if (result) {
        setPredictedKpi(result.predictedKpi);
        setConfidenceScore(result.confidenceScore);
        setAiInsights(result.aiInsights);
        
        // Extract flow prediction data from AI response
        const metadata = result.metadata as any;
        if (metadata?.flowPrediction) {
          setPredictedFlowData(metadata.flowPrediction);
        } else {
          // Generate mock flow data for demonstration
          setPredictedFlowData({
            paths: [
              {
                points: [
                  { x: 0, z: 0, intensity: 1 },
                  { x: 2, z: 1, intensity: 0.8 },
                  { x: 4, z: 2, intensity: 0.6 },
                  { x: 5, z: 4, intensity: 0.9 },
                ],
                weight: 0.8,
              },
              {
                points: [
                  { x: 0, z: 0, intensity: 1 },
                  { x: 1, z: 3, intensity: 0.7 },
                  { x: 3, z: 5, intensity: 0.5 },
                ],
                weight: 0.6,
              },
            ],
            heatmap: [
              { x: 2, z: 1, intensity: 0.9 },
              { x: 4, z: 2, intensity: 0.7 },
              { x: 5, z: 4, intensity: 0.95 },
              { x: 3, z: 3, intensity: 0.6 },
            ],
            dwellZones: [
              { x: 4, z: 2, radius: 1.5, time: 3.2 },
              { x: 5, z: 4, radius: 1.2, time: 2.8 },
            ],
            kpiChanges: {
              conversionRate: 2.5,
              dwellTime: 1.2,
              flowEfficiency: 85,
            },
          });
        }
        
        toast.success("레이아웃 시뮬레이션 완료");
      }
    } catch (error) {
      console.error("Simulation error:", error);
      toast.error("시뮬레이션 실행 중 오류가 발생했습니다");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStore || !predictedKpi || confidenceScore === null) {
      toast.error("시뮬레이션을 먼저 실행해주세요");
      return;
    }

    const scenario = await createScenario({
      scenarioType: "layout",
      name: `레이아웃 시뮬레이션 - ${new Date().toLocaleDateString()}`,
      description: goalText || "레이아웃 변경 시뮬레이션",
      params,
      storeId: selectedStore.id,
    });

    if (scenario) {
      await updatePrediction({
        id: scenario.id,
        predictedKpi,
        confidenceScore,
        aiInsights,
      });
      toast.success("시나리오가 저장되었습니다");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🗺️ Layout Simulation</h1>
          <p className="text-muted-foreground mt-2">Digital Twin 3D 모델 위 레이아웃 What-if | 존 이동/페이싱 변경에 대한 KPI 예측</p>
        </div>

        {recommendation && (
          <Alert>
            <Grid3x3 className="h-4 w-4" />
            <AlertDescription>
              <strong>AI 추천:</strong> {recommendation.description}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Parameters */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>레이아웃 파라미터</CardTitle>
                <CardDescription>시뮬레이션 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LayoutParamsForm params={params} onChange={setParams} />
                <Button
                  onClick={handleRunSimulation}
                  disabled={isInferring || isSimulating || !selectedStore || !params.changedZones?.length}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  {isInferring || isSimulating ? "AI 추론 중..." : "시뮬레이션 실행"}
                </Button>
                {predictedKpi && (
                  <Button
                    onClick={handleSave}
                    disabled={isCreating}
                    variant="outline"
                    className="w-full"
                  >
                    {isCreating ? "저장 중..." : "시나리오 저장"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>3D 레이아웃 시뮬레이션</CardTitle>
                    <CardDescription>레이아웃 변경을 3D로 시각화하고 예측합니다</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="preview-mode"
                        checked={showPreview}
                        onCheckedChange={setShowPreview}
                      />
                      <Label htmlFor="preview-mode" className="cursor-pointer">
                        {showPreview ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            미리보기
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="w-4 h-4" />
                            꺼짐
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <SharedDigitalTwinScene
                    overlayType="none"
                    height="500px"
                    customOverlay={
                      <LayoutChangeOverlay
                        zoneChanges={params.changedZones}
                        furnitureMoves={params.movedFurniture}
                        showPreview={showPreview}
                      />
                    }
                  />
                  
                  {/* Simulation Status Overlay */}
                  {isSimulating && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">AI 추론 중...</p>
                      </div>
                    </div>
                  )}

                  {/* Layout Info Overlay */}
                  {showPreview && (params.changedZones?.length || 0) > 0 && (
                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold">레이아웃 변경 요약</div>
                        <div className="text-muted-foreground">
                          • 존 변경: {params.changedZones?.length || 0}개
                        </div>
                        <div className="text-muted-foreground">
                          • 가구 이동: {params.movedFurniture?.length || 0}개
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {predictedKpi && baselineKpi && (
              <>
                {/* Before/After 3D Scene Comparison */}
                <BeforeAfterSceneComparison
                  beforeZones={params.changedZones?.map(z => ({
                    ...z,
                    newPosition: z.originalPosition,
                    newSize: z.originalSize,
                  }))}
                  afterZones={params.changedZones}
                  beforeFurniture={params.movedFurniture?.map(f => ({
                    ...f,
                    toPosition: f.fromPosition,
                  }))}
                  afterFurniture={params.movedFurniture}
                  predictedFlowData={predictedFlowData}
                />

                {/* KPI Analysis Tabs */}
                <Tabs defaultValue="result" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="result">예측 결과</TabsTrigger>
                    <TabsTrigger value="comparison">비교 분석</TabsTrigger>
                    <TabsTrigger value="chart">KPI 변화</TabsTrigger>
                  </TabsList>
                  <TabsContent value="result">
                    <PredictionResultCard
                      predictedKpi={predictedKpi}
                      confidenceScore={confidenceScore || 0}
                      aiInsights={aiInsights}
                    />
                  </TabsContent>
                  <TabsContent value="comparison">
                    <BeforeAfterComparison baseline={baselineKpi} predicted={predictedKpi} />
                  </TabsContent>
                  <TabsContent value="chart">
                    <KpiDeltaChart baseline={baselineKpi} predicted={predictedKpi} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
