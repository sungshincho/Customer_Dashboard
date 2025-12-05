/**
 * useLayoutApply.ts
 * 레이아웃 변경사항을 DB에 저장하는 Hook
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

  /**
   * 레이아웃 변경사항을 DB에 적용
   */
  const applyLayoutChanges = useCallback(async (
    changes: LayoutChange[],
    options?: {
      createSnapshot?: boolean;  // 적용 전 스냅샷 생성
      storeId?: string;
    }
  ): Promise<ApplyResult> => {
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
      // 1. 스냅샷 생성 (옵션)
      if (options?.createSnapshot && options?.storeId) {
        await createLayoutSnapshot(options.storeId, changes);
      }

      // 2. 각 변경사항 적용
      for (const change of changes) {
        if (!change.entityId || !change.suggestedPosition) {
          result.failedCount++;
          result.errors.push(`Invalid change data for ${change.entityLabel || 'unknown'}`);
          continue;
        }

        try {
          const { error } = await supabase
            .from('graph_entities')
            .update({
              model_3d_position: change.suggestedPosition,
              updated_at: new Date().toISOString(),
            })
            .eq('id', change.entityId);

          if (error) {
            result.failedCount++;
            result.errors.push(`${change.entityLabel}: ${error.message}`);
          } else {
            result.updatedCount++;
          }
        } catch (e) {
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // 3. 결과 처리
      result.success = result.failedCount === 0;
      setLastApplyResult(result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 업데이트되었습니다.`);
      } else if (result.updatedCount > 0) {
        toast.warning(`${result.updatedCount}개 성공, ${result.failedCount}개 실패`);
      } else {
        toast.error('레이아웃 적용에 실패했습니다.');
      }

      return result;
    } catch (error) {
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

  /**
   * 일괄 적용 (트랜잭션)
   */
  const applyLayoutChangesBatch = useCallback(async (
    changes: LayoutChange[],
    storeId: string
  ): Promise<ApplyResult> => {
    if (!changes || changes.length === 0) {
      toast.warning('적용할 변경사항이 없습니다.');
      return { success: false, updatedCount: 0, failedCount: 0, errors: ['No changes to apply'] };
    }

    setIsApplying(true);

    try {
      // Edge Function을 통한 일괄 업데이트 (트랜잭션 보장)
      const { data, error } = await supabase.functions.invoke('apply-layout-changes', {
        body: {
          store_id: storeId,
          changes: changes.map(c => ({
            entity_id: c.entityId,
            new_position: c.suggestedPosition,
          })),
          create_snapshot: true,
        },
      });

      if (error) throw error;

      const result: ApplyResult = {
        success: data.success,
        updatedCount: data.updated_count || 0,
        failedCount: data.failed_count || 0,
        errors: data.errors || [],
      };

      setLastApplyResult(result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 업데이트되었습니다.`);
      } else {
        toast.error('레이아웃 적용에 실패했습니다.');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: ApplyResult = {
        success: false,
        updatedCount: 0,
        failedCount: changes.length,
        errors: [errorMessage],
      };
      setLastApplyResult(result);
      
      // Edge Function이 없으면 개별 업데이트로 폴백
      console.warn('Batch update failed, falling back to individual updates:', errorMessage);
      return applyLayoutChanges(changes, { createSnapshot: true, storeId });
    } finally {
      setIsApplying(false);
    }
  }, [applyLayoutChanges]);

  /**
   * 레이아웃 스냅샷 생성 (변경 전 상태 저장)
   */
  const createLayoutSnapshot = async (storeId: string, changes: LayoutChange[]) => {
    try {
      // 현재 상태를 스냅샷으로 저장
      const snapshot = {
        store_id: storeId,
        snapshot_type: 'layout_before_optimization',
        created_at: new Date().toISOString(),
        data: {
          changes_count: changes.length,
          entities: changes.map(c => ({
            id: c.entityId,
            label: c.entityLabel,
            position_before: c.currentPosition,
            position_after: c.suggestedPosition,
            reason: c.reason,
            impact: c.impact,
          })),
        },
      };

      // layout_snapshots 테이블이 있다면 저장
      // 없으면 simulation_configs에 저장
      const { error } = await supabase
        .from('simulation_configs')
        .insert({
          store_id: storeId,
          scenario_type: 'layout_snapshot',
          config: snapshot,
          is_active: false,
        });

      if (error) {
        console.warn('Failed to create snapshot:', error.message);
      } else {
        console.log('Layout snapshot created');
      }
    } catch (e) {
      console.warn('Snapshot creation error:', e);
    }
  };

  /**
   * 변경사항 되돌리기
   */
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
    applyLayoutChangesBatch,
    revertLayoutChanges,
  };
}

export default useLayoutApply;
