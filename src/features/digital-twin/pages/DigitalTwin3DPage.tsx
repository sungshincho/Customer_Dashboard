import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SceneComposer } from "../components";
import { ModelLayerManager } from "../components/ModelLayerManager";
import { StorageToInstanceConverter } from "../components/StorageToInstanceConverter";
import type { ModelLayer } from "../components/ModelLayerManager";
import { loadUserModels } from "../utils/modelLayerLoader";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreScene } from "@/hooks/useStoreScene";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Layers, Eye, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import type { SceneRecipe, LightingPreset } from "@/types/scene3d";

export default function DigitalTwin3DPage() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { activeScene, allScenes, saveScene, setActiveScene, deleteScene, isSaving } = useStoreScene();

  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');
  const [entityTypes, setEntityTypes] = useState<Array<{ id: string; name: string; label: string }>>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingPositions, setPendingPositions] = useState<Record<string, { x: number; y: number; z: number }>>({});

  const loadModels = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);
      setModels(loadedModels);
      if (loadedModels.length > 0 && activeLayers.length === 0) {
        setActiveLayers(loadedModels.map(m => m.id));
      }
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
      recipe.furniture?.forEach(f => layerIds.push(f.id));
      recipe.products?.forEach(p => layerIds.push(p.id));
      setActiveLayers(layerIds);
      setSceneName(activeScene.name || '');
    }
  }, [activeScene]);

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

  const handlePositionChange = (assetId: string, position: { x: number; y: number; z: number }) => {
    setPendingPositions(prev => ({
      ...prev,
      [assetId]: position
    }));
  };

  const savePositions = async () => {
    if (Object.keys(pendingPositions).length === 0) {
      toast.info('변경된 위치가 없습니다');
      return;
    }

    try {
      const updates = Object.entries(pendingPositions).map(async ([assetId, position]) => {
        // entity- 접두사 제거
        const entityId = assetId.replace('entity-', '');
        
        const { error } = await supabase
          .from('graph_entities')
          .update({ model_3d_position: position })
          .eq('id', entityId);
        
        if (error) throw error;
      });

      await Promise.all(updates);
      toast.success(`${Object.keys(pendingPositions).length}개 모델 위치 저장 완료`);
      setPendingPositions({});
      loadModels(); // 새로고침
    } catch (error) {
      console.error('Position save error:', error);
      toast.error('위치 저장 실패');
    }
  };

  const handleAssetClick = (assetId: string, assetType: string) => {
    if (editMode) {
      setSelectedAssetId(assetId);
      console.log('Selected asset:', assetId, assetType);
    }
  };

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
                  <Button onClick={() => saveScene(currentRecipe!, sceneName || `씬 ${Date.now()}`).then(() => toast.success('저장됨'))} disabled={!currentRecipe || isSaving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />{isSaving ? '저장 중...' : '씬 저장'}
                  </Button>
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
            <div className="lg:col-span-2 space-y-4">
              {/* 편집 모드 컨트롤 */}
              {currentRecipe && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Button
                          variant={editMode ? "default" : "outline"}
                          onClick={() => {
                            setEditMode(!editMode);
                            if (editMode) setSelectedAssetId(null);
                          }}
                        >
                          {editMode ? '편집 모드 종료' : '편집 모드 시작'}
                        </Button>
                        {editMode && selectedAssetId && (
                          <Badge variant="secondary">
                            선택됨: {models.find(m => m.id === selectedAssetId)?.name}
                          </Badge>
                        )}
                      </div>
                      {Object.keys(pendingPositions).length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {Object.keys(pendingPositions).length}개 변경
                          </Badge>
                          <Button onClick={savePositions} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            위치 저장
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader><CardTitle><Layers className="w-5 h-5 inline mr-2" />3D 프리뷰</CardTitle></CardHeader>
                <CardContent>
                  {currentRecipe ? (
                    <div style={{ height: '600px' }}>
                      <SceneComposer 
                        recipe={currentRecipe} 
                        selectedAssetId={selectedAssetId}
                        onAssetClick={handleAssetClick}
                        onPositionChange={handlePositionChange}
                        editMode={editMode}
                      />
                    </div>
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
