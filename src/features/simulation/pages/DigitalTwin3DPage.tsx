import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SceneComposer } from "../components/digital-twin";
import { ModelLayerManager } from "../components/digital-twin/ModelLayerManager";
import { StorageToInstanceConverter } from "../components/digital-twin/StorageToInstanceConverter";
import type { ModelLayer } from "../components/digital-twin/ModelLayerManager";
import { loadUserModels } from "../utils/modelLayerLoader";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreScene } from "@/hooks/useStoreScene";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Layers, Eye, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import type { SceneRecipe, LightingPreset } from "@/types/scene3d";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

export default function DigitalTwin3DPage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { activeScene, allScenes, saveScene, setActiveScene, deleteScene, isSaving } = useStoreScene();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Digital Twin 3D',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

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
      // activeLayers는 activeScene이 로드될 때 설정되므로 여기서 초기화하지 않음
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
      // 저장된 씬에서 레이어 복원
      const recipe = activeScene.recipe_data;
      const layerIds: string[] = [];
      if (recipe.space) layerIds.push(recipe.space.id);
      recipe.furniture?.forEach(f => layerIds.push(f.id));
      recipe.products?.forEach(p => layerIds.push(p.id));
      setActiveLayers(layerIds);
      setSceneName(activeScene.name || '');
    } else if (models.length > 0 && activeLayers.length === 0) {
      // 저장된 씬이 없으면 모든 모델을 활성화 (초기 상태)
      setActiveLayers(models.map(m => m.id));
    }
  }, [activeScene, models]);

  const currentRecipe = useMemo<SceneRecipe | null>(() => {
    const activeModels = models.filter(m => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;

    const spaceModel = activeModels.find(m => m.type === 'space');
    if (!spaceModel) return null;

    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 5 } }
      ]
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
        metadata: spaceModel.metadata
      },
      furniture: activeModels.filter(m => m.type === 'furniture').map(m => ({
        id: m.id,
        model_url: m.model_url,
        type: 'furniture',
        furniture_type: m.name,
        position: m.position || { x: 0, y: 0, z: 0 },
        rotation: m.rotation || { x: 0, y: 0, z: 0 },
        scale: m.scale || { x: 1, y: 1, z: 1 },
        dimensions: m.dimensions,
        movable: true,
        metadata: m.metadata
      })),
      products: activeModels.filter(m => m.type === 'product').map(m => ({
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
        metadata: m.metadata
      })),
      lighting: lightingPreset,
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 }
    };
  }, [models, activeLayers]);

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>매장을 선택하세요</AlertDescription></Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">디지털 트윈 3D 씬 관리</h1>
            <p className="text-muted-foreground mt-2">{selectedStore.store_name} - 레이어를 조합하여 씬 생성</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />새로고침
          </Button>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                storageModels={models.filter(m => m.id.startsWith('storage-'))}
                entityTypes={entityTypes}
                userId={user!.id}
                storeId={selectedStore.id}
                onConversionComplete={loadModels}
              />
            )}
              <Card>
                <CardHeader><CardTitle>씬 저장</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="씬 이름" value={sceneName} onChange={(e) => setSceneName(e.target.value)} />
                  <Button 
                    onClick={() => {
                      if (!currentRecipe) return;
                      const finalSceneName = sceneName || activeScene?.name || `씬 ${Date.now()}`;
                      saveScene(currentRecipe, finalSceneName, activeScene?.id)
                        .then(() => {
                          toast.success('씬이 저장되었습니다');
                        })
                        .catch((err) => {
                          toast.error('씬 저장 실패: ' + err.message);
                        });
                    }} 
                    disabled={!currentRecipe || isSaving} 
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? '저장 중...' : (activeScene ? '씬 업데이트' : '새 씬 저장')}
                  </Button>
                  {activeScene && (
                    <p className="text-xs text-muted-foreground">
                      현재 활성 씬: {activeScene.name}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>저장된 씬 ({allScenes.length})</CardTitle></CardHeader>
                <CardContent>
                  {allScenes.map(scene => (
                    <div key={scene.id} className="flex justify-between p-3 border rounded mb-2">
                      <div>
                        <p className="font-medium">{scene.name}</p>
                        {scene.is_active && <Badge>활성</Badge>}
                      </div>
                      <div className="flex gap-1">
                        {!scene.is_active && <Button size="sm" variant="ghost" onClick={() => setActiveScene(scene.id)}><Eye className="w-4 h-4" /></Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteScene(scene.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle><Layers className="w-5 h-5 inline mr-2" />3D 프리뷰</CardTitle></CardHeader>
                <CardContent>
                  {currentRecipe ? (
                    <div style={{ height: '600px' }}><SceneComposer recipe={currentRecipe} /></div>
                  ) : (
                    <div className="text-center py-20"><Layers className="w-16 h-16 mx-auto opacity-20" /><p>레이어를 선택하세요</p></div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
