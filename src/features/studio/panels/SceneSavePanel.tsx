/**
 * SceneSavePanel.tsx
 *
 * 씬 저장/불러오기 패널
 */

import { useState } from 'react';
import { Save, FolderOpen, Trash2, Clock, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SavedScene } from '../types';

// ============================================================================
// Props
// ============================================================================
interface SceneSavePanelProps {
  currentSceneName?: string;
  savedScenes?: SavedScene[];
  isSaving?: boolean;
  isDirty?: boolean;
  onSave?: (name: string) => void;
  onLoad?: (sceneId: string) => void;
  onDelete?: (sceneId: string) => void;
  onNew?: () => void;
  /** 최대 저장 가능한 씬 개수 (기본값: 무제한) */
  maxScenes?: number;
}

// ============================================================================
// SceneSavePanel 컴포넌트
// ============================================================================
export function SceneSavePanel({
  currentSceneName = '',
  savedScenes = [],
  isSaving = false,
  isDirty = false,
  onSave,
  onLoad,
  onDelete,
  onNew,
  maxScenes,
}: SceneSavePanelProps) {
  const [sceneName, setSceneName] = useState(currentSceneName);

  // 최대 개수 제한 (maxScenes가 설정된 경우)
  const displayedScenes = maxScenes ? savedScenes.slice(0, maxScenes) : savedScenes;
  const canSaveNew = maxScenes ? savedScenes.length < maxScenes : true;

  const handleSave = () => {
    if (!sceneName.trim()) return;
    onSave?.(sceneName.trim());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {/* 저장 섹션 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Save className="w-3.5 h-3.5 text-white/60" />
          <span className="text-xs font-medium text-white">씬 저장</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="저장되지 않은 변경사항" />
          )}
        </div>
        <Input
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
          placeholder="씬 이름"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-xs"
        />
        <Button
          className="w-full bg-primary/80 hover:bg-primary text-white h-7 text-xs"
          onClick={handleSave}
          disabled={!sceneName.trim() || isSaving || !canSaveNew}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              저장
            </>
          )}
        </Button>
      </div>

      {/* 새 씬 버튼 */}
      <Button
        variant="outline"
        className="w-full border-white/10 text-white/80 hover:text-white hover:bg-white/5 h-7 text-xs"
        onClick={onNew}
      >
        <Plus className="w-3 h-3 mr-1" />
        새 씬
      </Button>

      {/* 저장된 씬 목록 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white">저장된 씬</span>
          <span className="text-[10px] text-white/40">
            {displayedScenes.length}{maxScenes ? `/${maxScenes}` : ''}
          </span>
        </div>

        {displayedScenes.length === 0 ? (
          <p className="text-[10px] text-white/40 py-3 text-center">저장된 씬이 없습니다</p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {displayedScenes.map((scene) => (
              <div
                key={scene.id}
                className={cn(
                  'flex items-center gap-1.5 p-1.5 rounded transition-colors group',
                  scene.is_active ? 'bg-primary/20' : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white truncate flex items-center gap-1">
                    {scene.name}
                    {scene.is_active && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-primary/30 text-primary-foreground">
                        활성
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] text-white/40 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(scene.updated_at || scene.created_at)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onLoad?.(scene.id)}
                  disabled={scene.is_active}
                >
                  <FolderOpen className="w-3 h-3 text-white/60" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete?.(scene.id)}
                >
                  <Trash2 className="w-3 h-3 text-red-400/60" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SceneSavePanel;
