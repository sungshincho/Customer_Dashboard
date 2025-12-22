/**
 * LayerPanel.tsx
 *
 * 레이어 관리 패널
 * - 레이어 트리 구조 표시
 * - 가시성 토글
 * - 씬 저장/불러오기 관리
 */

import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Box,
  Folder,
  Trash2,
  Save,
  FolderOpen,
  Check,
  Loader2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScene } from '../core/SceneProvider';
import { useScenePersistence } from '../hooks/useScenePersistence';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { LayerNode, ModelType } from '../types';

// ============================================================================
// LayerPanel 컴포넌트
// ============================================================================
export function LayerPanel() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { models, selectedId, select, updateModel, removeModel, loadScene, toggleProductVisibility, isProductVisible } = useScene();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['space', 'furniture', 'product']));

  // 씬 저장/불러오기 훅
  const {
    scenes,
    activeScene,
    isSaving,
    isLoading: scenesLoading,
    saveScene,
    deleteScene,
    setActiveScene,
  } = useScenePersistence({
    userId: user?.id,
    storeId: selectedStore?.id,
  });

  // 씬 저장 관련 상태
  const [newSceneName, setNewSceneName] = useState('');

  // 모델을 타입별로 그룹화 (가구의 childProducts도 포함)
  // childProducts는 별도로 관리하여 가시성 체크 시 부모 가구 기준으로 처리
  const { groupedLayers, childProductMap } = useMemo(() => {
    const groups: Record<ModelType, LayerNode[]> = {
      space: [],
      furniture: [],
      product: [],
      custom: [],
      other: [],
    };
    // childProductId → parentFurnitureId 매핑
    const cpMap = new Map<string, string>();

    if (!models || !Array.isArray(models)) {
      return { groupedLayers: groups, childProductMap: cpMap };
    }

    let totalChildProducts = 0;

    models.forEach((model) => {
      const modelType: ModelType =
        model.type && groups[model.type as ModelType]
          ? (model.type as ModelType)
          : 'custom';

      groups[modelType].push({
        id: model.id,
        name: model.name,
        type: 'model',
        visible: model.visible,
        locked: false,
        modelId: model.id,
      });

      // 🔧 FIX: 가구의 childProducts를 상품 목록에 추가 (개별 visible 속성 사용)
      if (model.type === 'furniture' && (model.metadata as any)?.childProducts) {
        const childProducts = (model.metadata as any).childProducts as any[];
        totalChildProducts += childProducts.length;
        childProducts.forEach((cp) => {
          // childProduct → parentFurniture 매핑 저장
          cpMap.set(cp.id, model.id);

          groups.product.push({
            id: cp.id,
            name: cp.name || cp.metadata?.sku || 'Product',
            type: 'model',
            // 🔧 FIX: 개별 visible 속성 사용 (undefined면 기본 true)
            visible: cp.visible !== false,
            locked: false,
            modelId: cp.id,
            parentFurnitureId: model.id, // 부모 가구 ID 추가
          } as LayerNode & { parentFurnitureId?: string });
        });
      }
    });

    // 🔍 DEBUG: 그룹화 결과 로깅
    console.log('[LayerPanel] groupedLayers:', {
      furnitureCount: groups.furniture.length,
      productCount: groups.product.length,
      childProductMapSize: cpMap.size,
      totalChildProducts,
      furnitureWithChildren: models.filter(m => m.type === 'furniture' && (m.metadata as any)?.childProducts?.length > 0).length,
    });

    return { groupedLayers: groups, childProductMap: cpMap };
  }, [models]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 가시성 토글 (childProduct인 경우 개별 가시성 토글)
  const handleVisibilityToggle = (modelId: string) => {
    // 1️⃣ 직접 모델인 경우
    const model = models.find((m) => m.id === modelId);
    if (model) {
      updateModel(modelId, { visible: !model.visible });
      return;
    }

    // 2️⃣ childProduct인 경우 → 개별 가시성 토글 (SceneProvider의 toggleProductVisibility 사용)
    const parentFurnitureId = childProductMap.get(modelId);
    if (parentFurnitureId) {
      toggleProductVisibility(modelId);
    }
  };

  // 모델 또는 childProduct의 가시성 확인
  const getModelVisibility = (modelId: string): boolean => {
    // 1️⃣ 직접 모델인 경우
    const model = models.find((m) => m.id === modelId);
    if (model) {
      return model.visible;
    }

    // 2️⃣ childProduct인 경우 → 개별 가시성 확인 (SceneProvider의 isProductVisible 사용)
    const parentFurnitureId = childProductMap.get(modelId);
    if (parentFurnitureId) {
      // 부모 가구가 보이고 && 제품 자체도 보일 때만 true
      const parentModel = models.find((m) => m.id === parentFurnitureId);
      const parentVisible = parentModel?.visible ?? true;
      return parentVisible && isProductVisible(modelId);
    }

    return true; // 기본값
  };

  const handleDelete = (modelId: string) => {
    removeModel(modelId);
  };

  // 씬 저장 핸들러
  const handleSaveScene = async () => {
    if (!newSceneName.trim()) {
      toast.error('씬 이름을 입력하세요');
      return;
    }

    // 현재 씬 데이터 생성
    const currentSceneData = {
      space: models.find(m => m.type === 'space') ? {
        id: models.find(m => m.type === 'space')!.id,
        model_url: models.find(m => m.type === 'space')!.url,
        type: 'space' as const,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      } : null,
      furniture: models.filter(m => m.type === 'furniture').map(m => ({
        id: m.id,
        model_url: m.url,
        type: 'furniture' as const,
        furniture_type: m.name,
        position: { x: m.position[0], y: m.position[1], z: m.position[2] },
        rotation: { x: m.rotation[0], y: m.rotation[1], z: m.rotation[2] },
        scale: { x: m.scale[0], y: m.scale[1], z: m.scale[2] },
        movable: true,
      })),
      products: models.filter(m => m.type === 'product').map(m => ({
        id: m.id,
        model_url: m.url,
        type: 'product' as const,
        sku: m.name,
        position: { x: m.position[0], y: m.position[1], z: m.position[2] },
        rotation: { x: m.rotation[0], y: m.rotation[1], z: m.rotation[2] },
        scale: { x: m.scale[0], y: m.scale[1], z: m.scale[2] },
        movable: true,
      })),
      lighting: {
        name: 'default',
        description: 'Default lighting',
        lights: [],
      },
      camera: {
        position: { x: 10, y: 10, z: 15 },
        target: { x: 0, y: 0, z: 0 },
        fov: 50,
      },
    };

    if (!currentSceneData.space) {
      toast.error('저장할 공간 모델이 없습니다');
      return;
    }

    try {
      await saveScene(currentSceneData as any, newSceneName.trim());
      setNewSceneName('');
    } catch (error) {
      // 에러는 useScenePersistence에서 처리됨
    }
  };

  // 씬 불러오기 핸들러
  const handleLoadScene = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.recipe_data) {
      // SceneProvider의 loadScene 호출
      const recipe = scene.recipe_data;

      // recipe_data를 Model3D[] 형식으로 변환
      const loadedModels: any[] = [];

      if (recipe.space) {
        loadedModels.push({
          id: recipe.space.id,
          name: 'Space',
          url: recipe.space.model_url,
          position: [recipe.space.position?.x || 0, recipe.space.position?.y || 0, recipe.space.position?.z || 0],
          rotation: [recipe.space.rotation?.x || 0, recipe.space.rotation?.y || 0, recipe.space.rotation?.z || 0],
          scale: [recipe.space.scale?.x || 1, recipe.space.scale?.y || 1, recipe.space.scale?.z || 1],
          visible: true,
          type: 'space',
        });
      }

      recipe.furniture?.forEach((f: any) => {
        loadedModels.push({
          id: f.id,
          name: f.furniture_type || 'Furniture',
          url: f.model_url,
          position: [f.position?.x || 0, f.position?.y || 0, f.position?.z || 0],
          rotation: [f.rotation?.x || 0, f.rotation?.y || 0, f.rotation?.z || 0],
          scale: [f.scale?.x || 1, f.scale?.y || 1, f.scale?.z || 1],
          visible: true,
          type: 'furniture',
        });
      });

      recipe.products?.forEach((p: any) => {
        loadedModels.push({
          id: p.id,
          name: p.sku || 'Product',
          url: p.model_url,
          position: [p.position?.x || 0, p.position?.y || 0, p.position?.z || 0],
          rotation: [p.rotation?.x || 0, p.rotation?.y || 0, p.rotation?.z || 0],
          scale: [p.scale?.x || 1, p.scale?.y || 1, p.scale?.z || 1],
          visible: true,
          type: 'product',
        });
      });

      loadScene({ models: loadedModels });
      await setActiveScene(sceneId);
      toast.success(`"${scene.name}" 씬을 불러왔습니다`);
    }
  };

  // 기본 씬으로 설정
  const handleSetDefault = async (sceneId: string) => {
    await setActiveScene(sceneId);
    toast.success('기본 씬으로 설정되었습니다');
  };

  // 씬 삭제
  const handleDeleteScene = async (sceneId: string, sceneName: string) => {
    await deleteScene(sceneId);
  };

  const folders: { type: ModelType; name: string; icon: typeof Box }[] = [
    { type: 'space', name: '매장 공간', icon: Folder },
    { type: 'furniture', name: '가구', icon: Box },
    { type: 'product', name: '상품', icon: Box },
    { type: 'custom', name: '기타', icon: Folder },
  ];

  return (
    <div className="p-3 space-y-4">
      {/* ========== 모델 레이어 섹션 ========== */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-white/80 flex items-center gap-2 px-1 mb-2">
          <Eye className="h-4 w-4 text-blue-400" />
          모델 레이어
        </div>

        {folders.map(({ type, name, icon: Icon }) => {
          const items = groupedLayers[type];
          const isExpanded = expanded.has(type);
          // 🔧 FIX: childProduct도 부모 가구 기준으로 가시성 체크
          const visibleCount = items.filter((i) => {
            if (!i.modelId) return false;
            return getModelVisibility(i.modelId);
          }).length;

          if (items.length === 0) return null;

          return (
            <div key={type}>
              {/* 폴더 헤더 */}
              <div
                className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(type)}
              >
                <button className="p-0.5 hover:bg-white/10 rounded">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  )}
                </button>

                <Icon className="w-4 h-4 text-yellow-400" />

                <span className="flex-1 text-sm text-white font-medium">{name}</span>

                <span className="text-xs text-white/40">
                  {visibleCount}/{items.length}
                </span>
              </div>

              {/* 자식 아이템 */}
              {isExpanded && (
                <div className="ml-4">
                  {items.map((item) => {
                    const isSelected = selectedId === item.modelId;
                    // 🔧 FIX: childProduct도 부모 가구 기준으로 가시성 체크
                    const isVisible = item.modelId ? getModelVisibility(item.modelId) : true;
                    // childProduct인지 확인 (부모 가구 ID가 있으면 childProduct)
                    const isChildProduct = item.modelId ? childProductMap.has(item.modelId) : false;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                          isSelected ? 'bg-primary/20' : 'hover:bg-white/5',
                          isChildProduct && 'pl-4' // childProduct 들여쓰기
                        )}
                        onClick={() => select(item.modelId || null)}
                        title={isChildProduct ? '가구에 배치된 제품 (개별 표시/숨김 가능)' : undefined}
                      >
                        {/* 가시성 체크박스 */}
                        <Checkbox
                          checked={isVisible}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.modelId) handleVisibilityToggle(item.modelId);
                          }}
                          className={cn(
                            'h-3.5 w-3.5',
                            isChildProduct
                              ? 'border-yellow-500/50 data-[state=checked]:bg-yellow-600'
                              : 'border-white/40 data-[state=checked]:bg-primary'
                          )}
                        />

                        {/* 아이콘 - childProduct는 다른 색상 */}
                        <Box className={cn(
                          'w-4 h-4',
                          isChildProduct ? 'text-yellow-400' : 'text-blue-400'
                        )} />

                        {/* 이름 */}
                        <span
                          className={cn(
                            'flex-1 text-sm truncate',
                            isVisible ? 'text-white' : 'text-white/40'
                          )}
                        >
                          {item.name}
                        </span>

                        {/* childProduct 표시 */}
                        {isChildProduct && (
                          <span className="text-[10px] text-yellow-500/60 mr-1">📍</span>
                        )}

                        {/* 삭제 버튼 - childProduct는 삭제 비활성 */}
                        {!isChildProduct && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.modelId) handleDelete(item.modelId);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 빈 상태 */}
        {models.length === 0 && (
          <div className="text-center py-4 text-white/40">
            <Box className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">모델이 없습니다</p>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 씬 관리 섹션 ========== */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-white/80 flex items-center gap-2 px-1">
          <FolderOpen className="h-4 w-4 text-green-400" />
          씬 관리
        </div>

        {/* 새 씬 저장 */}
        <div className="flex gap-2">
          <Input
            placeholder="씬 이름 입력..."
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveScene()}
            className="flex-1 bg-white/5 border-white/10 text-sm h-8 text-white placeholder:text-white/30"
          />
          <Button
            onClick={handleSaveScene}
            disabled={!newSceneName.trim() || isSaving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 저장된 씬 목록 */}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {scenesLoading ? (
            <div className="text-xs text-white/40 text-center py-2">불러오는 중...</div>
          ) : scenes && scenes.length > 0 ? (
            scenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 group transition-colors"
              >
                <button
                  onClick={() => handleLoadScene(scene.id)}
                  className="flex-1 text-left text-sm text-white truncate"
                >
                  {scene.name}
                  {scene.is_active && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">
                      기본
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!scene.is_active && (
                    <button
                      onClick={() => handleSetDefault(scene.id)}
                      className="p-1 text-white/40 hover:text-blue-400 transition-colors"
                      title="기본 씬으로 설정"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteScene(scene.id, scene.name)}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-white/40 text-center py-2">
              저장된 씬이 없습니다
            </div>
          )}
        </div>

        <p className="text-[10px] text-white/40 px-1">
          기본 씬으로 설정하면 페이지 진입 시 자동으로 불러옵니다.
        </p>
      </div>
    </div>
  );
}

export default LayerPanel;
