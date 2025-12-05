/**
 * useLayoutApply.ts
 * 레이아웃 변경사항을 DB에 저장하는 Hook (v2 - 스냅샷 제거)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LayoutChange {
  entityId: string;
  entityLabel: string;
  entityType: string;
  currentPosition?: { x: number; y: number; z: number };
  suggestedPosition?: { x: number; y: number; z: number };
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

interface ApplyResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

export function useLayoutApply() {
  const [isApplying, setIsApplying] = useState(false);
  const [lastApplyResult, setLastApplyResult] = useState<ApplyResult | null>(null);

  const applyLayoutChanges = useCallback(async (
    changes: LayoutChange[],
    options?: {
      createSnapshot?: boolean;
      storeId?: string;
    }
  ): Promise<ApplyResult> => {
    console.log('🚀 applyLayoutChanges called!');
    console.log('Changes:', changes);

    if (!changes || changes.length === 0) {
      toast.warning('적용할 변경사항이 없습니다.');
      return { success: false, updatedCount: 0, failedCount: 0, errors: ['No changes to apply'] };
    }

    setIsApplying(true);
    const result: ApplyResult = {
      success: true,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      console.log('=== Applying Layout Changes ===');
      console.log('Changes count:', changes.length);

      for (const change of changes) {
        if (!change.entityId || !change.suggestedPosition) {
          console.warn('Invalid change (missing entityId or suggestedPosition):', change);
          result.failedCount++;
          result.errors.push(`Invalid change data for ${change.entityLabel || 'unknown'}`);
          continue;
        }

        console.log(`Updating ${change.entityLabel} (${change.entityId}) to position:`, change.suggestedPosition);

        const { data, error } = await supabase
          .from('graph_entities')
          .update({
            model_3d_position: change.suggestedPosition,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId)
          .select();

        if (error) {
          console.error(`❌ Error updating ${change.entityLabel}:`, error);
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: ${error.message}`);
        } else {
          console.log(`✅ Updated ${change.entityLabel}`, data);
          result.updatedCount++;
        }
      }

      result.success = result.failedCount === 0 && result.updatedCount > 0;
      setLastApplyResult(result);

      console.log('=== Apply Result ===', result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 업데이트되었습니다.`);
      } else if (result.updatedCount > 0) {
        toast.warning(`${result.updatedCount}개 성공, ${result.failedCount}개 실패`);
      } else {
        toast.error('레이아웃 적용에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('Apply layout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(errorMessage);
      setLastApplyResult(result);
      toast.error(`레이아웃 적용 실패: ${errorMessage}`);
      return result;
    } finally {
      setIsApplying(false);
    }
  }, []);

  const revertLayoutChanges = useCallback(async (
    changes: LayoutChange[]
  ): Promise<ApplyResult> => {
    if (!changes || changes.length === 0) {
      return { success: false, updatedCount: 0, failedCount: 0, errors: ['No changes to revert'] };
    }

    setIsApplying(true);
    const result: ApplyResult = {
      success: true,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      for (const change of changes) {
        if (!change.entityId || !change.currentPosition) {
          result.failedCount++;
          continue;
        }

        const { error } = await supabase
          .from('graph_entities')
          .update({
            model_3d_position: change.currentPosition,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);

        if (error) {
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: ${error.message}`);
        } else {
          result.updatedCount++;
        }
      }

      result.success = result.failedCount === 0;
      setLastApplyResult(result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 원래대로 복원되었습니다.`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(errorMessage);
      toast.error(`복원 실패: ${errorMessage}`);
      return result;
    } finally {
      setIsApplying(false);
    }
  }, []);

  return {
    isApplying,
    lastApplyResult,
    applyLayoutChanges,
    revertLayoutChanges,
  };
}

export default useLayoutApply;
```

---

**교체 후 "확인" 클릭하면 콘솔에 이 로그가 보여야 합니다:**
```
🚀 applyLayoutChanges called!
Changes: [{...}, {...}, ...]
=== Applying Layout Changes ===
Changes count: 5
Updating Shelf (...) to position: {...}
✅ Updated Shelf
