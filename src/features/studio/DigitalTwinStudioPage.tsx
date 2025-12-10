/**
 * DigitalTwinStudioPage.tsx
 *
 * 디지털트윈 스튜디오 - 통합 3D 편집 + 시뮬레이션 + 분석
 * 3가지 모드: 편집, 시뮬레이션, 분석
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Box,
  Pencil,
  Play,
  BarChart3,
  Layers,
  Save,
  RefreshCw,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  Sparkles,
  Network,
  Grid3x3,
  TrendingUp,
  Package,
  DollarSign,
  Target,
  History,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useStoreScene } from '@/hooks/useStoreScene';
import { toast } from 'sonner';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { GlobalDateFilter } from '@/components/common/GlobalDateFilter';

// 편집 모드 컴포넌트들
import { SceneComposer } from '@/features/simulation/components/digital-twin';
import { ModelLayerManager } from '@/features/simulation/components/digital-twin/ModelLayerManager';
import { StorageToInstanceConverter } from '@/features/simulation/components/digital-twin/StorageToInstanceConverter';
import type { ModelLayer } from '@/features/simulation/components/digital-twin/ModelLayerManager';
import { loadUserModels } from '@/features/simulation/utils/modelLayerLoader';
import type { SceneRecipe, LightingPreset } from '@/types/scene3d';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

// 시뮬레이션 모드 컴포넌트들
import { DataSourceMappingCard } from '@/features/simulation/components/DataSourceMappingCard';
import {
  AIModelSelector,
  defaultScenarios,
  defaultParameters,
  type SimulationScenario,
  type SimulationParameters,
} from '@/features/simulation/components/AIModelSelector';
import { SimulationResultCard, SimulationResultGrid } from '@/features/simulation/components/SimulationResultCard';
import { useDataSourceMapping } from '@/features/simulation/hooks/useDataSourceMapping';
import { useEnhancedAIInference } from '@/features/simulation/hooks/useEnhancedAIInference';
import { useStoreContext } from '@/features/simulation/hooks/useStoreContext';
import { useDateFilterStore } from '@/store/dateFilterStore';

// 분석 모드용 - 히트맵, 동선 분석
import { SharedDigitalTwinScene } from '@/features/simulation/components/digital-twin';

type StudioMode = 'edit' | 'simulation' | 'analysis';

export default function DigitalTwinStudioPage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { activeScene, allScenes, saveScene, setActiveScene, deleteScene, isSaving } = useStoreScene();
  const { dateRange, getDays } = useDateFilterStore();

  const [mode, setMode] = useState<StudioMode>('edit');

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', {
      page: location.pathname,
      page_name: 'Digital Twin Studio',
      mode,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, mode]);

  // ========== 편집 모드 상태 ==========
  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');
  const [entityTypes, setEntityTypes] = useState<Array<{ id: string; name: string; label: string }>>([]);

  const loadModels = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);
      setModels(loadedModels);
    } catch (error) {
      toast.error('모델 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityTypes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('ontology_entity_types')
        .select('id, name, label')
        .eq('user_id', user.id);

      if (data) {
        setEntityTypes(data);
      }
    } catch (error) {
      console.error('Failed to load entity types:', error);
    }
  };

  useEffect(() => {
    loadModels();
    loadEntityTypes();
  }, [user, selectedStore]);

  useEffect(() => {
    if (activeScene?.recipe_data) {
      const recipe = activeScene.recipe_data;
      const layerIds: string[] = [];
      if (recipe.space) layerIds.push(recipe.space.id);
      recipe.furniture?.forEach((f: any) => layerIds.push(f.id));
      recipe.products?.forEach((p: any) => layerIds.push(p.id));
      setActiveLayers(layerIds);
      setSceneName(activeScene.name || '');
    } else if (models.length > 0 && activeLayers.length === 0) {
      setActiveLayers(models.map((m) => m.id));
    }
  }, [activeScene, models]);

  const currentRecipe = useMemo<SceneRecipe | null>(() => {
    const activeModels = models.filter((m) => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;

    const spaceModel = activeModels.find((m) => m.type === 'space');
    if (!spaceModel) return null;

    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 5 } },
      ],
    };

    return {
      space: {
        id: spaceModel.id,
        model_url: spaceModel.model_url,
        type: 'space',
        position: spaceModel.position || { x: 0, y: 0, z: 0 },
        rotation: spaceModel.rotation || { x: 0, y: 0, z: 0 },
        scale: spaceModel.scale || { x: 1, y: 1, z: 1 },
        dimensions: spaceModel.dimensions,
        metadata: spaceModel.metadata,
      },
      furniture: activeModels
        .filter((m) => m.type === 'furniture')
        .map((m) => ({
          id: m.id,
          model_url: m.model_url,
          type: 'furniture',
          furniture_type: m.name,
          position: m.position || { x: 0, y: 0, z: 0 },
          rotation: m.rotation || { x: 0, y: 0, z: 0 },
          scale: m.scale || { x: 1, y: 1, z: 1 },
          dimensions: m.dimensions,
          movable: true,
          metadata: m.metadata,
        })),
      products: activeModels
        .filter((m) => m.type === 'product')
        .map((m) => ({
          id: m.id,
          model_url: m.model_url,
          type: 'product',
          product_id: m.metadata?.entityId,
          sku: m.name,
          position: m.position || { x: 0, y: 0, z: 0 },
          rotation: m.rotation || { x: 0, y: 0, z: 0 },
          scale: m.scale || { x: 1, y: 1, z: 1 },
          dimensions: m.dimensions,
          movable: true,
          metadata: m.metadata,
        })),
      lighting: lightingPreset,
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
    };
  }, [models, activeLayers]);

  // ========== 시뮬레이션 모드 상태 ==========
  const days = getDays();
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id, days);
  const { mappingStatus, isAdmin } = useDataSourceMapping();
  const {
    loading: isInferring,
    ontologyContext,
    inferWithOntology,
    loadOntologyContext,
  } = useEnhancedAIInference();

  const [useOntologyMode, setUseOntologyMode] = useState(true);
  const [selectedScenarios, setSelectedScenarios] = useState<SimulationScenario[]>([
    'demand',
    'inventory',
    'layout',
  ]);
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);

  // ========== 분석 모드 상태 ==========
  const [analysisType, setAnalysisType] = useState<'heatmap' | 'flow' | 'zone'>('heatmap');

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Box className="h-8 w-8 text-primary" />
              디지털트윈 스튜디오
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedStore.store_name} - 3D 편집, 시뮬레이션, 분석
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalDateFilter compact />
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {/* 모드 선택 탭 */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as StudioMode)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="edit" className="gap-2">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">편집 모드</span>
            </TabsTrigger>
            <TabsTrigger value="simulation" className="gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">시뮬레이션</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">분석 모드</span>
            </TabsTrigger>
          </TabsList>

          {/* 편집 모드 */}
          <TabsContent value="edit" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">모델 로딩 중...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽 패널 */}
                <div className="lg:col-span-1 space-y-6">
                  <ModelLayerManager
                    models={models}
                    activeLayers={activeLayers}
                    onLayersChange={setActiveLayers}
                    userId={user?.id}
                    storeId={selectedStore?.id}
                    onModelsReload={loadModels}
                  />

                  {selectedStore && (
                    <StorageToInstanceConverter
                      storageModels={models.filter((m) => m.id.startsWith('storage-'))}
                      entityTypes={entityTypes}
                      userId={user!.id}
                      storeId={selectedStore.id}
                      onConversionComplete={loadModels}
                    />
                  )}

                  {/* 씬 저장 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">씬 저장</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="씬 이름"
                        value={sceneName}
                        onChange={(e) => setSceneName(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          if (!currentRecipe) return;
                          const finalSceneName = sceneName || activeScene?.name || `씬 ${Date.now()}`;
                          saveScene(currentRecipe, finalSceneName, activeScene?.id)
                            .then(() => {
                              toast.success('씬이 저장되었습니다');
                              logActivity('feature_use', {
                                feature: 'scene_save',
                                scene_name: finalSceneName,
                                layer_count: activeLayers.length,
                                store_id: selectedStore?.id,
                              });
                            })
                            .catch((err) => {
                              toast.error('씬 저장 실패: ' + err.message);
                            });
                        }}
                        disabled={!currentRecipe || isSaving}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? '저장 중...' : activeScene ? '씬 업데이트' : '새 씬 저장'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 저장된 씬 목록 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">저장된 씬 ({allScenes.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                      {allScenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="flex justify-between items-center p-2 border rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[100px]">{scene.name}</span>
                            {scene.is_active && <Badge variant="secondary">활성</Badge>}
                          </div>
                          <div className="flex gap-1">
                            {!scene.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setActiveScene(scene.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => deleteScene(scene.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* 오른쪽 - 3D 뷰 */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        3D 프리뷰
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentRecipe ? (
                        <div style={{ height: '600px' }}>
                          <SceneComposer recipe={currentRecipe} />
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <Layers className="w-16 h-16 mx-auto opacity-20" />
                          <p className="text-muted-foreground mt-4">레이어를 선택하세요</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 시뮬레이션 모드 */}
          <TabsContent value="simulation" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={useOntologyMode ? 'default' : 'outline'} className="gap-1">
                  <Network className="h-3 w-3" />
                  온톨로지 {useOntologyMode ? 'ON' : 'OFF'}
                </Badge>
                {ontologyContext && (
                  <Badge variant="secondary">
                    {ontologyContext.entities.total}개 엔티티
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseOntologyMode(!useOntologyMode)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                온톨로지 모드 전환
              </Button>
            </div>

            {contextLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">데이터 로딩 중...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 시뮬레이션 시나리오 카드들 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      수요 예측
                    </CardTitle>
                    <CardDescription>과거 데이터 기반 수요 예측</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">데이터 범위</span>
                        <span>{parameters.dataRange}일</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">예측 기간</span>
                        <span>{parameters.forecastPeriod}일</span>
                      </div>
                      <Button className="w-full gap-2" disabled={isInferring}>
                        <Play className="h-4 w-4" />
                        시뮬레이션 실행
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-500" />
                      재고 최적화
                    </CardTitle>
                    <CardDescription>최적 재고 수준 분석</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">현재 재고</span>
                        <span>{contextData?.inventory?.length || 0}개 품목</span>
                      </div>
                      <Button className="w-full gap-2" disabled={isInferring}>
                        <Play className="h-4 w-4" />
                        시뮬레이션 실행
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3x3 className="h-5 w-5 text-cyan-500" />
                      레이아웃 최적화
                    </CardTitle>
                    <CardDescription>AI 기반 매장 레이아웃 최적화</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">엔티티 수</span>
                        <span>{contextData?.entities?.length || 0}개</span>
                      </div>
                      <Button className="w-full gap-2" disabled={isInferring}>
                        <Play className="h-4 w-4" />
                        시뮬레이션 실행
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      가격 최적화
                    </CardTitle>
                    <CardDescription>수익 극대화를 위한 가격 전략</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">상품 수</span>
                        <span>{contextData?.products?.length || 0}개</span>
                      </div>
                      <Button className="w-full gap-2" disabled={isInferring}>
                        <Play className="h-4 w-4" />
                        시뮬레이션 실행
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 전체 실행 버튼 */}
            <Card>
              <CardContent className="py-4">
                <Button className="w-full gap-2" size="lg" disabled={isInferring}>
                  <Sparkles className="h-5 w-5" />
                  모든 시뮬레이션 실행
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 모드 */}
          <TabsContent value="analysis" className="space-y-6">
            {/* 분석 유형 선택 */}
            <div className="flex gap-2">
              <Button
                variant={analysisType === 'heatmap' ? 'default' : 'outline'}
                onClick={() => setAnalysisType('heatmap')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                히트맵
              </Button>
              <Button
                variant={analysisType === 'flow' ? 'default' : 'outline'}
                onClick={() => setAnalysisType('flow')}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                동선 분석
              </Button>
              <Button
                variant={analysisType === 'zone' ? 'default' : 'outline'}
                onClick={() => setAnalysisType('zone')}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                존 분석
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* 3D 분석 뷰 */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {analysisType === 'heatmap' && '방문자 히트맵'}
                      {analysisType === 'flow' && '동선 분석'}
                      {analysisType === 'zone' && '존별 분석'}
                    </CardTitle>
                    <CardDescription>
                      {analysisType === 'heatmap' && '매장 내 방문자 밀집 구역 시각화'}
                      {analysisType === 'flow' && '고객 이동 경로 패턴 분석'}
                      {analysisType === 'zone' && '존별 성과 지표 분석'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentRecipe ? (
                      <div style={{ height: '500px' }}>
                        <SharedDigitalTwinScene
                          overlayType={analysisType === 'heatmap' ? 'heatmap' : analysisType === 'flow' ? 'flow' : 'zone'}
                        />
                      </div>
                    ) : (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <p>씬 데이터가 없습니다</p>
                          <p className="text-sm">편집 모드에서 씬을 먼저 생성해주세요</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 분석 결과 패널 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">분석 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisType === 'heatmap' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">가장 인기 구역</span>
                          <span className="font-medium">입구 / 디스플레이</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">평균 체류시간</span>
                          <span className="font-medium">8.5분</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">저활용 구역</span>
                          <span className="font-medium text-yellow-600">2개</span>
                        </div>
                      </>
                    )}
                    {analysisType === 'flow' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">주요 동선</span>
                          <span className="font-medium">입구→디스플레이→계산대</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">평균 이동거리</span>
                          <span className="font-medium">45m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">병목 지점</span>
                          <span className="font-medium text-red-600">1개</span>
                        </div>
                      </>
                    )}
                    {analysisType === 'zone' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">총 존 수</span>
                          <span className="font-medium">5개</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">최고 전환존</span>
                          <span className="font-medium text-green-600">피팅룸</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">개선 필요 존</span>
                          <span className="font-medium text-yellow-600">액세서리</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI 인사이트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        입구 근처 체류시간이 짧아 시선을 끄는 디스플레이가 필요합니다.
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        우측 코너 구역 활성화를 위해 프로모션 상품 배치를 권장합니다.
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        계산대 대기열 개선으로 고객 경험을 향상시킬 수 있습니다.
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
