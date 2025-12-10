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
}: SceneSavePanelProps) {
  const [sceneName, setSceneName] = useState(currentSceneName);

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
    <div className="w-64 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* 저장 섹션 */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Save className="w-4 h-4" />
          씬 저장
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-yellow-500" title="저장되지 않은 변경사항" />
          )}
        </h3>
        <div className="space-y-2">
          <Input
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="씬 이름"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
          />
          <Button
            className="w-full bg-primary/80 hover:bg-primary text-white h-9"
            onClick={handleSave}
            disabled={!sceneName.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 새 씬 버튼 */}
      <div className="p-4 border-b border-white/10">
        <Button
          variant="outline"
          className="w-full border-white/10 text-white/80 hover:text-white hover:bg-white/5 h-9"
          onClick={onNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          새 씬
        </Button>
      </div>

      {/* 저장된 씬 목록 */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-white mb-2 flex items-center justify-between">
          <span>저장된 씬</span>
          <span className="text-xs text-white/40">{savedScenes.length}</span>
        </h4>

        {savedScenes.length === 0 ? (
          <p className="text-xs text-white/40 py-4 text-center">저장된 씬이 없습니다</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {savedScenes.map((scene) => (
              <div
                key={scene.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg transition-colors group',
                  scene.is_active ? 'bg-primary/20' : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate flex items-center gap-2">
                    {scene.name}
                    {scene.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/30 text-primary-foreground">
                        활성
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(scene.updated_at || scene.created_at)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onLoad?.(scene.id)}
                  disabled={scene.is_active}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-white/60" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete?.(scene.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
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
