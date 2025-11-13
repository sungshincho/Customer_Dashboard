import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SceneComposer } from "../components";
import { generateSceneRecipe } from "../utils/sceneRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useOntologyEntities, transformToGraphData } from "@/hooks/useOntologyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Box, Lightbulb, Layout, Database, Sparkles } from "lucide-react";
import type { SceneRecipe, AILayoutResult } from "@/types/scene3d";

export default function DigitalTwin3DPage() {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<SceneRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingLayout, setAnalyzingLayout] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; type: string } | null>(null);

  // 온톨로지 데이터 로드
  const { data: allEntities = [], isLoading: entitiesLoading } = useOntologyEntities();
  
  // 엔티티 타입별 통계
  const entityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allEntities.forEach((entity: any) => {
      const typeName = entity.entity_type?.name || 'unknown';
      stats[typeName] = (stats[typeName] || 0) + 1;
    });
    return stats;
  }, [allEntities]);

  // 3D 모델이 있는 엔티티만 필터링
  const entitiesWithModels = useMemo(() => {
    return allEntities.filter((entity: any) => 
      entity.entity_type?.model_3d_url
    );
  }, [allEntities]);

  const handleGenerateScene = async () => {
    if (!user) return;
    
    if (entitiesWithModels.length === 0) {
      toast.error("3D 모델이 있는 온톨로지 엔티티가 없습니다. 먼저 '3D 데이터 설정' 페이지에서 샘플 데이터를 추가하세요.");
      return;
    }
    
    setLoading(true);
    try {
      // 실제 온톨로지 엔티티 기반으로 레이아웃 구성
      const furniture = entitiesWithModels
        .filter((e: any) => ['shelf', 'displaytable', 'furniture'].includes(e.entity_type?.name?.toLowerCase()))
        .map((e: any, idx: number) => ({
          furniture_id: e.id,
          entity_type: e.entity_type?.name || 'Unknown',
          movable: true,
          current_position: e.model_3d_position || { x: (idx - 1) * 3, y: 0, z: -5 },
          position: e.model_3d_position || { x: (idx - 1) * 3, y: 0, z: -5 },
          rotation: e.model_3d_rotation || { x: 0, y: 0, z: 0 }
        }));

      const products = entitiesWithModels
        .filter((e: any) => e.entity_type?.name?.toLowerCase() === 'product')
        .map((e: any, idx: number) => ({
          product_id: e.id,
          entity_type: e.entity_type?.name || 'Product',
          movable: true,
          current_position: e.model_3d_position || { x: (idx - 1) * 2, y: 1, z: -4 },
          position: e.model_3d_position || { x: (idx - 1) * 2, y: 1, z: -4 }
        }));

      const aiResult: AILayoutResult = {
        zones: [
          {
            zone_id: 'main-zone',
            zone_type: 'retail',
            furniture,
            products
          }
        ],
        lighting_suggestion: 'warm-retail'
      };

      const generatedRecipe = await generateSceneRecipe(aiResult, user.id);
      setRecipe(generatedRecipe);
      toast.success("온톨로지 기반 3D 씬이 생성되었습니다");
    } catch (error) {
      console.error('Scene generation error:', error);
      toast.error("씬 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleAILayoutOptimization = async () => {
    if (!user || !recipe) return;
    
    setAnalyzingLayout(true);
    try {
      const graphData = transformToGraphData(allEntities, []);
      
      const layoutData = {
        currentLayout: {
          furniture: recipe.furniture.map(f => ({
            id: f.id,
            type: f.furniture_type,
            position: f.position
          })),
          products: recipe.products.map(p => ({
            id: p.id,
            sku: p.sku,
            position: p.position
          }))
        },
        constraints: {
          spaceWidth: 20,
          spaceDepth: 15,
          minSpacing: 1.5
        }
      };

      const { data: result, error } = await supabase.functions.invoke('analyze-store-data', {
        body: { 
          analysisType: 'layout-simulator',
          data: layoutData,
          userId: user.id,
          graphData
        }
      });

      if (error) throw error;

      toast.success("AI 레이아웃 최적화 제안이 생성되었습니다");
      
      // 분석 결과를 표시 (여기서는 토스트로 간단히)
      if (result?.analysis) {
        console.log("AI Layout Suggestion:", result.analysis);
      }
    } catch (error: any) {
      console.error('AI layout optimization error:', error);
      toast.error("AI 최적화 분석 중 오류가 발생했습니다");
    } finally {
      setAnalyzingLayout(false);
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
          <div className="flex gap-2">
            {recipe && (
              <Button 
                onClick={handleAILayoutOptimization} 
                disabled={analyzingLayout}
                variant="outline"
              >
                {analyzingLayout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 최적화 제안
                  </>
                )}
              </Button>
            )}
            <Button onClick={handleGenerateScene} disabled={loading || entitiesLoading}>
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
        </div>

        {/* 온톨로지 데이터 상태 */}
        {allEntities.length > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="flex flex-wrap gap-3">
                <span className="font-semibold">온톨로지 엔티티:</span>
                {Object.entries(entityStats).map(([type, count]) => (
                  <span key={type} className="text-sm">
                    {type}: {count}개
                  </span>
                ))}
                <span className="text-sm text-blue-600">
                  (3D 모델 보유: {entitiesWithModels.length}개)
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {allEntities.length === 0 && !entitiesLoading && (
          <Alert variant="destructive">
            <Database className="h-4 w-4" />
            <AlertDescription>
              온톨로지 엔티티가 없습니다. '3D 데이터 설정' 페이지에서 샘플 데이터를 추가하세요.
            </AlertDescription>
          </Alert>
        )}

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
