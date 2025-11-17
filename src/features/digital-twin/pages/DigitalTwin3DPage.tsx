import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SceneComposer } from "../components";
import { Store3DViewer } from "../components/Store3DViewer";
import { WiFiTrackingOverlay } from "../components/overlays/WiFiTrackingOverlay";
import { generateSceneRecipe } from "../utils/sceneRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useOntologyEntities, transformToGraphData } from "@/hooks/useOntologyData";
import { useWiFiTracking } from "@/hooks/useWiFiTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Box, Lightbulb, Layout, Database, Sparkles, Wifi, MapPin } from "lucide-react";
import type { SceneRecipe, AILayoutResult } from "@/types/scene3d";

export default function DigitalTwin3DPage() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [recipe, setRecipe] = useState<SceneRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingLayout, setAnalyzingLayout] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; type: string } | null>(null);
  const [wifiMode, setWifiMode] = useState<'realtime' | 'heatmap' | 'paths'>('realtime');
  
  // WiFi 트래킹 데이터 로드
  const { 
    zones, 
    trackingData, 
    loading: wifiLoading, 
    error: wifiError,
    refresh: refreshWiFi 
  } = useWiFiTracking(selectedStore?.id);

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
      toast.error("3D 모델이 있는 온톨로지 엔티티가 없습니다. '통합 데이터 관리' 페이지에서 3D 모델을 업로드하세요.");
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
            <Tabs value={recipe ? "scene" : "wifi"} className="h-[600px]">
              <div className="border-b px-4">
                <TabsList>
                  <TabsTrigger value="scene" disabled={!recipe}>
                    <Box className="w-4 h-4 mr-2" />
                    씬 에디터
                  </TabsTrigger>
                  <TabsTrigger value="wifi">
                    <Wifi className="w-4 h-4 mr-2" />
                    WiFi 트래킹
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="scene" className="h-[calc(100%-3rem)] m-0">
                <div className="h-full bg-background">
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
              </TabsContent>

              <TabsContent value="wifi" className="h-[calc(100%-3rem)] m-0">
                <div className="h-full bg-background">
                  {!selectedStore ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>먼저 매장을 선택하세요</p>
                      </div>
                    </div>
                  ) : wifiLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : wifiError ? (
                    <div className="h-full flex items-center justify-center text-destructive">
                      <div className="text-center">
                        <p>WiFi 데이터 로드 실패</p>
                        <Button onClick={refreshWiFi} className="mt-4" variant="outline">
                          다시 시도
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Store3DViewer height="100%" overlay={
                      <WiFiTrackingOverlay 
                        trackingData={trackingData} 
                        mode={wifiMode}
                      />
                    } />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Controls Panel */}
          <Card className="p-6">
            <Tabs defaultValue="lighting">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lighting">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  조명
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layout className="w-4 h-4 mr-2" />
                  레이아웃
                </TabsTrigger>
                <TabsTrigger value="wifi">
                  <Wifi className="w-4 h-4 mr-2" />
                  WiFi
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

              <TabsContent value="wifi" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">시각화 모드</h3>
                  <div className="space-y-2">
                    <Button
                      variant={wifiMode === 'realtime' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setWifiMode('realtime')}
                    >
                      실시간 트래킹
                    </Button>
                    <Button
                      variant={wifiMode === 'heatmap' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setWifiMode('heatmap')}
                    >
                      히트맵
                    </Button>
                    <Button
                      variant={wifiMode === 'paths' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setWifiMode('paths')}
                    >
                      고객 경로
                    </Button>
                  </div>
                </div>

                {selectedStore && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">매장:</span>
                        <Badge variant="outline">{selectedStore.store_name}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zone 수:</span>
                        <Badge>{zones.length}개</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">트래킹 데이터:</span>
                        <Badge>{trackingData.length}개</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={refreshWiFi} 
                      className="w-full mt-4"
                      variant="outline"
                      size="sm"
                    >
                      새로고침
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
