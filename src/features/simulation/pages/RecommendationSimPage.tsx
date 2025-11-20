import { useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Play } from "lucide-react";
import { SharedDigitalTwinScene } from "@/features/digital-twin/components";
import { RecommendationParamsForm } from "../components/params/RecommendationParamsForm";
import { PredictionResultCard, BeforeAfterComparison, KpiDeltaChart } from "../components";
import { useAIInference, useScenarioManager } from "../hooks";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { RecommendationParams, KpiSnapshot } from "../types";
import { toast } from "sonner";

export default function RecommendationSimPage() {
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { infer, loading: isInferring } = useAIInference();
  const { createScenario, updatePrediction, isCreating } = useScenarioManager();

  const [params, setParams] = useState<RecommendationParams>({
    algorithm: "collaborative_filtering",
    maxRecommendations: 5,
    trendWeight: 0.3,
    diversityWeight: 0.2,
    boostNewProducts: false,
    boostHighMargin: true,
  });

  const [baselineKpi, setBaselineKpi] = useState<KpiSnapshot | null>(null);
  const [predictedKpi, setPredictedKpi] = useState<KpiSnapshot | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");

  const recommendation = location.state?.recommendation;
  const goalText = location.state?.goalText;

  const handleRunSimulation = async () => {
    if (!selectedStore) {
      toast.error("매장을 선택해주세요");
      return;
    }

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

    const result = await infer("recommendation", params, selectedStore.id);

    if (result) {
      setPredictedKpi(result.predictedKpi);
      setConfidenceScore(result.confidenceScore);
      setAiInsights(result.aiInsights);
      toast.success("추천 전략 시뮬레이션 완료");
    }
  };

  const handleSave = async () => {
    if (!selectedStore || !predictedKpi || confidenceScore === null) {
      toast.error("시뮬레이션을 먼저 실행해주세요");
      return;
    }

    const scenario = await createScenario({
      scenarioType: "recommendation",
      name: `추천 전략 - ${new Date().toLocaleDateString()}`,
      description: goalText || "추천 전략 시뮬레이션",
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
          <h1 className="text-3xl font-bold">🎯 Recommendation Strategy</h1>
          <p className="text-muted-foreground mt-2">AI 고객 추천 정책 실험 | 슬롯 수/위치/룰 변경 → uplift 예측</p>
        </div>

        {recommendation && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>AI 추천:</strong> {recommendation.description}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>추천 전략 파라미터</CardTitle>
                <CardDescription>시뮬레이션 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecommendationParamsForm params={params} onChange={setParams} />
                <Button
                  onClick={handleRunSimulation}
                  disabled={isInferring || !selectedStore}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  {isInferring ? "시뮬레이션 중..." : "시뮬레이션 실행"}
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

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>3D 시뮬레이션</CardTitle>
                <CardDescription>추천 전략을 3D로 시각화</CardDescription>
              </CardHeader>
              <CardContent>
                <SharedDigitalTwinScene overlayType="recommendation" height="400px" />
              </CardContent>
            </Card>

            {predictedKpi && baselineKpi && (
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
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
