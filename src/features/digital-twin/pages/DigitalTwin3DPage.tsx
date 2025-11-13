import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SceneComposer } from "../components";
import { generateSceneRecipe } from "../utils/sceneRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Box, Lightbulb, Layout } from "lucide-react";
import type { SceneRecipe, AILayoutResult } from "@/types/scene3d";

export default function DigitalTwin3DPage() {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<SceneRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; type: string } | null>(null);

  const handleGenerateScene = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Mock AI layout result - in production, this would come from AI inference
      const mockAIResult: AILayoutResult = {
        zones: [
          {
            zone_id: 'entrance',
            zone_type: 'entry',
            furniture: [
              {
                furniture_id: 'shelf-001',
                position: { x: -5, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
              }
            ],
            products: [
              {
                product_id: 'product-001',
                position: { x: -5, y: 1, z: 0 }
              }
            ]
          }
        ],
        lighting_suggestion: 'warm-retail'
      };

      const generatedRecipe = await generateSceneRecipe(mockAIResult, user.id);
      setRecipe(generatedRecipe);
      toast.success("3D 씬이 생성되었습니다");
    } catch (error) {
      console.error('Scene generation error:', error);
      toast.error("씬 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = (assetId: string, assetType: string) => {
    setSelectedAsset({ id: assetId, type: assetType });
  };

  const changeLighting = async (preset: string) => {
    if (!recipe) return;
    
    try {
      const response = await fetch(`/lighting-presets/${preset}.json`);
      if (response.ok) {
        const lightingPreset = await response.json();
        setRecipe({ ...recipe, lighting: lightingPreset });
        toast.success(`조명을 ${preset}로 변경했습니다`);
      }
    } catch (error) {
      toast.error("조명 프리셋 로드 실패");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">디지털 트윈 3D</h1>
            <p className="text-muted-foreground mt-2">
              온톨로지 기반 3D 모델 자동 조합 및 시각화
            </p>
          </div>
          <Button onClick={handleGenerateScene} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Box className="w-4 h-4 mr-2" />
                씬 생성
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewport */}
          <Card className="lg:col-span-3 p-0 overflow-hidden">
            <div className="h-[600px] bg-background">
              {recipe ? (
                <SceneComposer recipe={recipe} onAssetClick={handleAssetClick} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>씬 생성 버튼을 클릭하여 3D 모델을 조합하세요</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Controls Panel */}
          <Card className="p-6">
            <Tabs defaultValue="lighting">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lighting">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  조명
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layout className="w-4 h-4 mr-2" />
                  레이아웃
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lighting" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">조명 프리셋</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => changeLighting('warm-retail')}
                    >
                      따뜻한 매장
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => changeLighting('cool-modern')}
                    >
                      모던한 매장
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => changeLighting('dramatic-spot')}
                    >
                      프리미엄 스팟
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                {selectedAsset ? (
                  <div>
                    <h3 className="font-semibold mb-2">선택된 오브젝트</h3>
                    <p className="text-sm text-muted-foreground">
                      타입: {selectedAsset.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedAsset.id}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    3D 뷰에서 오브젝트를 클릭하세요
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
