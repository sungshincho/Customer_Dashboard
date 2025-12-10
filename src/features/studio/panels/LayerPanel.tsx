/**
 * LayerPanel.tsx
 *
 * 레이어 관리 패널
 * - 레이어 트리 구조 표시
 * - 가시성 토글
 * - 잠금/잠금해제
 */

import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Box,
  Folder,
  Plus,
  Trash2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScene } from '../core/SceneProvider';
import type { LayerNode, ModelType } from '../types';

// ============================================================================
// LayerPanel 컴포넌트
// ============================================================================
export function LayerPanel() {
  const { models, selectedId, select, updateModel, removeModel } = useScene();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['space', 'furniture', 'product']));

  // 모델을 타입별로 그룹화
  const groupedLayers = useMemo(() => {
    const groups: Record<ModelType, LayerNode[]> = {
      space: [],
      furniture: [],
      product: [],
      custom: [],
    };

    models.forEach((model) => {
      groups[model.type].push({
        id: model.id,
        name: model.name,
        type: 'model',
        visible: model.visible,
        locked: false,
        modelId: model.id,
      });
    });

    return groups;
  }, [models]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVisibilityToggle = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (model) {
      updateModel(modelId, { visible: !model.visible });
    }
  };

  const handleDelete = (modelId: string) => {
    removeModel(modelId);
  };

  const folders: { type: ModelType; name: string; icon: typeof Box }[] = [
    { type: 'space', name: '매장 공간', icon: Folder },
    { type: 'furniture', name: '가구', icon: Box },
    { type: 'product', name: '상품', icon: Box },
    { type: 'custom', name: '기타', icon: Folder },
  ];

  return (
    <div className="p-3 space-y-1">
      {folders.map(({ type, name, icon: Icon }) => {
        const items = groupedLayers[type];
        const isExpanded = expanded.has(type);
        const visibleCount = items.filter((i) => {
          const model = models.find((m) => m.id === i.modelId);
          return model?.visible;
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
                  const model = models.find((m) => m.id === item.modelId);
                  const isSelected = selectedId === item.modelId;
                  const isVisible = model?.visible ?? true;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                        isSelected ? 'bg-primary/20' : 'hover:bg-white/5'
                      )}
                      onClick={() => select(item.modelId || null)}
                    >
                      {/* 가시성 체크박스 */}
                      <Checkbox
                        checked={isVisible}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.modelId) handleVisibilityToggle(item.modelId);
                        }}
                        className="border-white/40 data-[state=checked]:bg-primary h-3.5 w-3.5"
                      />

                      {/* 아이콘 */}
                      <Box className="w-4 h-4 text-blue-400" />

                      {/* 이름 */}
                      <span
                        className={cn(
                          'flex-1 text-sm truncate',
                          isVisible ? 'text-white' : 'text-white/40'
                        )}
                      >
                        {item.name}
                      </span>

                      {/* 삭제 버튼 */}
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
        <div className="text-center py-8 text-white/40">
          <Box className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">모델이 없습니다</p>
          <p className="text-xs mt-1">모델을 업로드하세요</p>
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
