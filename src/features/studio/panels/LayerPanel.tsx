/**
 * LayerPanel.tsx
 *
 * 레이어 관리 패널 (v2 - Zone 기반 계층 구조)
 * - Zone별 가구 그룹핑
 * - 가구 → 제품 계층 표시
 * - 검색/필터 기능
 * - 가시성 토글
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Box,
  Folder,
  Trash2,
  Save,
  FolderOpen,
  Check,
  Loader2,
  Search,
  MapPin,
  Package,
  Focus,
  Home,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScene } from '../core/SceneProvider';
import { useScenePersistence } from '../hooks/useScenePersistence';
import { useStoreBounds } from '../hooks/useStoreBounds';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { LayerNode } from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

interface ZoneGroup {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  furniture: FurnitureWithChildren[];
}

interface FurnitureWithChildren {
  id: string;
  name: string;
  visible: boolean;
  zoneId?: string;
  children: ChildProduct[];
}

interface ChildProduct {
  id: string;
  name: string;
  visible: boolean;
  sku?: string;
  slotCode?: string;
}

// ============================================================================
// LayerPanel 컴포넌트
// ============================================================================
export function LayerPanel() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { models, selectedId, select, updateModel, removeModel, loadScene, toggleProductVisibility, isProductVisible, focusOnModel } = useScene();
  const { zones } = useStoreBounds();

  // 확장 상태
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['space', 'furniture', 'zones']));
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedFurniture, setExpandedFurniture] = useState<Set<string>>(new Set());

  // 검색/필터
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'furniture' | 'product'>('all');

  // 씬 저장/불러오기 훅
  const {
    scenes,
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

  // Zone ID → Name 매핑
  const zoneNameMap = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>();
    if (zones) {
      zones.forEach((zone) => {
        map.set(zone.id, { name: zone.zone_name, type: zone.zone_type });
      });
    }
    return map;
  }, [zones]);

  // 모델을 Zone별로 그룹화 (가구 → 제품 계층)
  const { spaceModel, zoneGroups, unassignedFurniture, childProductMap, stats } = useMemo(() => {
    let space: LayerNode | null = null;
    const groups = new Map<string, ZoneGroup>();
    const unassigned: FurnitureWithChildren[] = [];
    const cpMap = new Map<string, string>(); // childProductId → furnitureId
    let totalFurniture = 0;
    let totalProducts = 0;

    if (!models || !Array.isArray(models)) {
      return {
        spaceModel: null,
        zoneGroups: [],
        unassignedFurniture: [],
        childProductMap: cpMap,
        stats: { furniture: 0, products: 0 }
      };
    }

    models.forEach((model) => {
      // 공간 모델
      if (model.type === 'space') {
        space = {
          id: model.id,
          name: model.name,
          type: 'model',
          visible: model.visible,
          locked: false,
          modelId: model.id,
        };
        return;
      }

      // 가구 모델
      if (model.type === 'furniture') {
        totalFurniture++;
        const zoneId = (model.metadata as any)?.zoneId;
        const childProducts = (model.metadata as any)?.childProducts || [];

        // childProduct 매핑 생성
        childProducts.forEach((cp: any) => {
          cpMap.set(cp.id, model.id);
          totalProducts++;
        });

        const furnitureItem: FurnitureWithChildren = {
          id: model.id,
          name: model.name,
          visible: model.visible,
          zoneId,
          children: childProducts.map((cp: any) => ({
            id: cp.id,
            name: cp.name || cp.metadata?.productName || 'Product',
            visible: cp.visible !== false,
            sku: cp.metadata?.sku,
            slotCode: cp.metadata?.slotCode,
          })),
        };

        if (zoneId && zoneNameMap.has(zoneId)) {
          const zoneInfo = zoneNameMap.get(zoneId)!;
          if (!groups.has(zoneId)) {
            groups.set(zoneId, {
              zoneId,
              zoneName: zoneInfo.name,
              zoneType: zoneInfo.type,
              furniture: [],
            });
          }
          groups.get(zoneId)!.furniture.push(furnitureItem);
        } else {
          unassigned.push(furnitureItem);
        }
      }

      // 독립 제품 (placement가 아닌 경우)
      if (model.type === 'product' && !(model.metadata as any)?.isRelativePosition) {
        totalProducts++;
        // 독립 제품은 미배정 그룹에 추가
        unassigned.push({
          id: model.id,
          name: model.name,
          visible: model.visible,
          children: [],
        });
      }
    });

    // Zone 정렬 (zone_type 우선순위: entrance > display > checkout > fitting > other)
    const zoneTypeOrder: Record<string, number> = {
      entrance: 0,
      entry: 0,
      display: 1,
      clothing: 1,
      accessory: 1,
      cosmetics: 1,
      checkout: 2,
      fitting: 3,
      exit: 4,
    };

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      const orderA = zoneTypeOrder[a.zoneType.toLowerCase()] ?? 5;
      const orderB = zoneTypeOrder[b.zoneType.toLowerCase()] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return a.zoneName.localeCompare(b.zoneName);
    });

    return {
      spaceModel: space,
      zoneGroups: sortedGroups,
      unassignedFurniture: unassigned,
      childProductMap: cpMap,
      stats: { furniture: totalFurniture, products: totalProducts }
    };
  }, [models, zoneNameMap]);

  // 검색 필터링
  const filteredZoneGroups = useMemo(() => {
    if (!searchQuery && filterType === 'all') return zoneGroups;

    const query = searchQuery.toLowerCase();

    return zoneGroups.map((group) => ({
      ...group,
      furniture: group.furniture.filter((f) => {
        // 타입 필터
        if (filterType === 'product') return false;
        if (filterType === 'furniture') {
          return f.name.toLowerCase().includes(query);
        }

        // 검색 필터
        if (!query) return true;
        if (f.name.toLowerCase().includes(query)) return true;
        return f.children.some((c) =>
          c.name.toLowerCase().includes(query) ||
          c.sku?.toLowerCase().includes(query)
        );
      }),
    })).filter((group) => group.furniture.length > 0);
  }, [zoneGroups, searchQuery, filterType]);

  // 토글 핸들러
  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleZone = (zoneId: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const toggleFurnitureExpand = (furnitureId: string) => {
    setExpandedFurniture((prev) => {
      const next = new Set(prev);
      if (next.has(furnitureId)) next.delete(furnitureId);
      else next.add(furnitureId);
      return next;
    });
  };

  // 가시성 토글 (childProduct인 경우 개별 가시성 토글)
  const handleVisibilityToggle = useCallback((modelId: string) => {
    // 직접 모델인 경우
    const model = models.find((m) => m.id === modelId);
    if (model) {
      updateModel(modelId, { visible: !model.visible });
      return;
    }

    // childProduct인 경우
    if (childProductMap.has(modelId)) {
      toggleProductVisibility(modelId);
    }
  }, [models, childProductMap, updateModel, toggleProductVisibility]);

  // 모델 또는 childProduct의 가시성 확인
  const getModelVisibility = useCallback((modelId: string): boolean => {
    const model = models.find((m) => m.id === modelId);
    if (model) return model.visible;

    const parentFurnitureId = childProductMap.get(modelId);
    if (parentFurnitureId) {
      const parentModel = models.find((m) => m.id === parentFurnitureId);
      const parentVisible = parentModel?.visible ?? true;
      return parentVisible && isProductVisible(modelId);
    }

    return true;
  }, [models, childProductMap, isProductVisible]);

  // 카메라 포커스
  const handleFocus = useCallback((modelId: string) => {
    if (focusOnModel) {
      focusOnModel(modelId);
    }
    select(modelId);
  }, [focusOnModel, select]);

  // 씬 저장 핸들러
  const handleSaveScene = async () => {
    if (!newSceneName.trim()) {
      toast.error('씬 이름을 입력하세요');
      return;
    }

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
      lighting: { name: 'default', description: 'Default lighting', lights: [] },
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
    };

    if (!currentSceneData.space) {
      toast.error('저장할 공간 모델이 없습니다');
      return;
    }

    try {
      await saveScene(currentSceneData as any, newSceneName.trim());
      setNewSceneName('');
    } catch {
      // 에러는 useScenePersistence에서 처리됨
    }
  };

  // 씬 불러오기 핸들러
  const handleLoadScene = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.recipe_data) {
      const recipe = scene.recipe_data;
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

  const handleSetDefault = async (sceneId: string) => {
    await setActiveScene(sceneId);
    toast.success('기본 씬으로 설정되었습니다');
  };

  const handleDeleteScene = async (sceneId: string) => {
    await deleteScene(sceneId);
  };

  // Zone 타입별 아이콘
  const getZoneIcon = (zoneType: string) => {
    const type = zoneType.toLowerCase();
    if (type.includes('entrance') || type.includes('entry')) return '🚪';
    if (type.includes('checkout') || type.includes('counter')) return '💳';
    if (type.includes('fitting')) return '👔';
    if (type.includes('clothing') || type.includes('clothes')) return '👕';
    if (type.includes('accessory')) return '👜';
    if (type.includes('cosmetic')) return '💄';
    return '📍';
  };

  return (
    <div className="p-3 space-y-4">
      {/* ========== 검색 & 필터 ========== */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <Input
            placeholder="이름 또는 SKU로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 bg-white/5 border-white/10 text-sm h-8 text-white placeholder:text-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(['all', 'furniture', 'product'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'flex-1 px-2 py-1 text-[10px] rounded transition-colors',
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              {type === 'all' ? '전체' : type === 'furniture' ? '가구' : '제품'}
            </button>
          ))}
        </div>
      </div>

      {/* ========== 통계 ========== */}
      <div className="flex items-center gap-3 px-2 py-1.5 bg-white/5 rounded-lg text-[10px]">
        <div className="flex items-center gap-1 text-white/50">
          <Box className="h-3 w-3 text-yellow-400" />
          <span>가구 {stats.furniture}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50">
          <Package className="h-3 w-3 text-blue-400" />
          <span>제품 {stats.products}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50">
          <MapPin className="h-3 w-3 text-purple-400" />
          <span>존 {zoneGroups.length}</span>
        </div>
      </div>

      {/* ========== 공간 섹션 ========== */}
      {spaceModel && (
        <div className="space-y-1">
          <div
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => toggleGroup('space')}
          >
            <button className="p-0.5">
              {expandedGroups.has('space') ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </button>
            <Home className="w-4 h-4 text-green-400" />
            <span className="flex-1 text-sm text-white font-medium">공간</span>
          </div>

          {expandedGroups.has('space') && (
            <div className="ml-4">
              <div
                className={cn(
                  'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                  selectedId === spaceModel.modelId ? 'bg-primary/20' : 'hover:bg-white/5'
                )}
                onClick={() => select(spaceModel.modelId || null)}
              >
                <Checkbox
                  checked={spaceModel.visible}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (spaceModel.modelId) handleVisibilityToggle(spaceModel.modelId);
                  }}
                  className="h-3.5 w-3.5 border-white/40 data-[state=checked]:bg-primary"
                />
                <Folder className="w-4 h-4 text-green-400" />
                <span className="flex-1 text-sm text-white truncate">{spaceModel.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (spaceModel.modelId) handleFocus(spaceModel.modelId);
                  }}
                >
                  <Focus className="w-3 h-3 text-blue-400" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 가구 섹션 (Zone별 그룹) ========== */}
      <div className="space-y-1">
        <div
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => toggleGroup('furniture')}
        >
          <button className="p-0.5">
            {expandedGroups.has('furniture') ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            )}
          </button>
          <Box className="w-4 h-4 text-yellow-400" />
          <span className="flex-1 text-sm text-white font-medium">
            가구 ({stats.furniture})
          </span>
        </div>

        {expandedGroups.has('furniture') && (
          <div className="ml-2 space-y-1">
            {/* Zone별 그룹 */}
            {filteredZoneGroups.map((group) => {
              const isZoneExpanded = expandedZones.has(group.zoneId);
              const visibleFurniture = group.furniture.filter(f => f.visible).length;

              return (
                <div key={group.zoneId} className="space-y-1">
                  {/* Zone 헤더 */}
                  <div
                    className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors ml-2"
                    onClick={() => toggleZone(group.zoneId)}
                  >
                    <button className="p-0.5">
                      {isZoneExpanded ? (
                        <ChevronDown className="w-3 h-3 text-white/60" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-white/60" />
                      )}
                    </button>
                    <span className="text-sm">{getZoneIcon(group.zoneType)}</span>
                    <span className="flex-1 text-xs text-white font-medium truncate">
                      {group.zoneName}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {visibleFurniture}/{group.furniture.length}
                    </span>
                  </div>

                  {/* Zone 내 가구 목록 */}
                  {isZoneExpanded && (
                    <div className="ml-6 space-y-0.5">
                      {group.furniture.map((furniture) => {
                        const isFurnitureExpanded = expandedFurniture.has(furniture.id);
                        const hasChildren = furniture.children.length > 0;
                        const isSelected = selectedId === furniture.id;
                        const visibleChildren = furniture.children.filter(c =>
                          getModelVisibility(c.id)
                        ).length;

                        return (
                          <div key={furniture.id} className="space-y-0.5">
                            {/* 가구 아이템 */}
                            <div
                              className={cn(
                                'flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors group',
                                isSelected ? 'bg-primary/20' : 'hover:bg-white/5'
                              )}
                              onClick={() => select(furniture.id)}
                            >
                              {hasChildren ? (
                                <button
                                  className="p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFurnitureExpand(furniture.id);
                                  }}
                                >
                                  {isFurnitureExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-white/60" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-white/60" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}

                              <Checkbox
                                checked={furniture.visible}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisibilityToggle(furniture.id);
                                }}
                                className="h-3 w-3 border-white/40 data-[state=checked]:bg-primary"
                              />

                              <Box className="w-3.5 h-3.5 text-yellow-400" />

                              <span
                                className={cn(
                                  'flex-1 text-xs truncate',
                                  furniture.visible ? 'text-white' : 'text-white/40'
                                )}
                              >
                                {furniture.name}
                              </span>

                              {hasChildren && (
                                <span className="text-[9px] text-white/30">
                                  ({visibleChildren}/{furniture.children.length})
                                </span>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFocus(furniture.id);
                                }}
                              >
                                <Focus className="w-2.5 h-2.5 text-blue-400" />
                              </Button>
                            </div>

                            {/* 가구 내 제품 (childProducts) */}
                            {isFurnitureExpanded && hasChildren && (
                              <div className="ml-6 space-y-0.5">
                                {furniture.children.map((child) => {
                                  const isChildVisible = getModelVisibility(child.id);
                                  const isChildSelected = selectedId === child.id;

                                  return (
                                    <div
                                      key={child.id}
                                      className={cn(
                                        'flex items-center gap-1.5 py-0.5 px-2 rounded cursor-pointer transition-colors group',
                                        isChildSelected ? 'bg-blue-500/20' : 'hover:bg-white/5'
                                      )}
                                      onClick={() => select(child.id)}
                                    >
                                      <Checkbox
                                        checked={isChildVisible}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVisibilityToggle(child.id);
                                        }}
                                        className="h-2.5 w-2.5 border-yellow-500/50 data-[state=checked]:bg-yellow-600"
                                      />

                                      <Package className="w-3 h-3 text-blue-400" />

                                      <span
                                        className={cn(
                                          'flex-1 text-[10px] truncate',
                                          isChildVisible ? 'text-white/80' : 'text-white/30'
                                        )}
                                      >
                                        {child.name}
                                      </span>

                                      {child.slotCode && (
                                        <span className="text-[8px] text-white/30 font-mono">
                                          [{child.slotCode}]
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 미배정 가구 */}
            {unassignedFurniture.length > 0 && (
              <div className="space-y-1">
                <div
                  className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors ml-2"
                  onClick={() => toggleZone('unassigned')}
                >
                  <button className="p-0.5">
                    {expandedZones.has('unassigned') ? (
                      <ChevronDown className="w-3 h-3 text-white/60" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/60" />
                    )}
                  </button>
                  <span className="text-sm">📦</span>
                  <span className="flex-1 text-xs text-white/60 font-medium">
                    미배정
                  </span>
                  <span className="text-[10px] text-white/40">
                    {unassignedFurniture.length}
                  </span>
                </div>

                {expandedZones.has('unassigned') && (
                  <div className="ml-6 space-y-0.5">
                    {unassignedFurniture.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors group',
                          selectedId === item.id ? 'bg-primary/20' : 'hover:bg-white/5'
                        )}
                        onClick={() => select(item.id)}
                      >
                        <Checkbox
                          checked={item.visible}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVisibilityToggle(item.id);
                          }}
                          className="h-3 w-3 border-white/40 data-[state=checked]:bg-primary"
                        />
                        <Box className="w-3.5 h-3.5 text-white/40" />
                        <span className={cn(
                          'flex-1 text-xs truncate',
                          item.visible ? 'text-white/60' : 'text-white/30'
                        )}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 빈 상태 */}
      {models.length === 0 && (
        <div className="text-center py-4 text-white/40">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">모델이 없습니다</p>
        </div>
      )}

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
        <div className="space-y-1 max-h-32 overflow-y-auto">
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
                  className="flex-1 text-left text-xs text-white truncate"
                >
                  {scene.name}
                  {scene.is_active && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded">
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
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteScene(scene.id)}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
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
