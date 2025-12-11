/**
 * useSceneSimulation.ts
 *
 * 씬 기반 AI 시뮬레이션 통합 훅
 * - As-is 씬 데이터를 AI에 전달
 * - 시뮬레이션 결과로 To-be 씬 생성
 * - 씬 비교 및 적용 관리
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/components/ui/use-toast';
import {
  generateLayoutOptimizedScene,
  generateFlowOptimizedScene,
  generateStaffingOptimizedScene,
  generateCombinedOptimizedScene,
  mergeToBeIntoAsIs,
  type SceneComparison,
  type SceneChange,
} from '../utils/ToBeSceneGenerator';
import type { SceneRecipe, SavedScene } from '../types';
import type { LayoutSimulationResult } from './useLayoutSimulation';
import type { FlowSimulationResult } from './useFlowSimulation';
import type { CongestionSimulationResult } from './useCongestionSimulation';
import type { StaffingSimulationResult } from './useStaffingSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

export type SimulationType = 'layout' | 'flow' | 'congestion' | 'staffing' | 'combined';

export interface SimulationRequest {
  type: SimulationType;
  params: Record<string, any>;
}

export interface SimulationResults {
  layout?: LayoutSimulationResult;
  flow?: FlowSimulationResult;
  congestion?: CongestionSimulationResult;
  staffing?: StaffingSimulationResult;
}

export interface SceneSimulationState {
  asIsScene: SceneRecipe | null;
  toBeScene: SceneRecipe | null;
  comparison: SceneComparison | null;
  activeSimulations: SimulationType[];
  results: SimulationResults;
  selectedChanges: string[];
  viewMode: 'asIs' | 'toBe' | 'split' | 'overlay';
}

export interface UseSceneSimulationReturn {
  // 상태
  state: SceneSimulationState;
  isSimulating: boolean;
  error: Error | null;

  // 씬 관리
  setAsIsScene: (scene: SceneRecipe | SavedScene) => void;
  clearScenes: () => void;

  // 시뮬레이션 실행
  runSimulation: (request: SimulationRequest) => Promise<void>;
  runAllSimulations: (params?: Record<SimulationType, Record<string, any>>) => Promise<void>;

  // 결과 관리
  getComparison: () => SceneComparison | null;
  getChanges: () => SceneChange[];

  // 변경 선택 및 적용
  selectChange: (changeId: string) => void;
  deselectChange: (changeId: string) => void;
  selectAllChanges: () => void;
  deselectAllChanges: () => void;
  applySelectedChanges: () => Promise<SceneRecipe>;
  applyAllChanges: () => Promise<SceneRecipe>;

  // 뷰 모드
  setViewMode: (mode: SceneSimulationState['viewMode']) => void;

  // To-be 씬 저장
  saveToBeScene: (name: string) => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useSceneSimulation(): UseSceneSimulationReturn {
  const { orgId, user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  // 상태
  const [state, setState] = useState<SceneSimulationState>({
    asIsScene: null,
    toBeScene: null,
    comparison: null,
    activeSimulations: [],
    results: {},
    selectedChanges: [],
    viewMode: 'split',
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // As-is 씬 설정
  const setAsIsScene = useCallback((scene: SceneRecipe | SavedScene) => {
    const recipe = 'recipe_data' in scene ? scene.recipe_data : scene;
    setState((prev) => ({
      ...prev,
      asIsScene: recipe,
      toBeScene: null,
      comparison: null,
      results: {},
      selectedChanges: [],
    }));
  }, []);

  // 씬 초기화
  const clearScenes = useCallback(() => {
    setState({
      asIsScene: null,
      toBeScene: null,
      comparison: null,
      activeSimulations: [],
      results: {},
      selectedChanges: [],
      viewMode: 'split',
    });
  }, []);

  // 시뮬레이션 실행
  const simulationMutation = useMutation({
    mutationFn: async (request: SimulationRequest): Promise<SimulationResults> => {
      if (!state.asIsScene || !selectedStore?.id || !orgId) {
        throw new Error('씬 또는 매장 정보가 없습니다.');
      }

      setIsSimulating(true);
      setState((prev) => ({
        ...prev,
        activeSimulations: [...prev.activeSimulations, request.type],
      }));

      // As-is 씬 데이터를 AI에 전달
      const sceneData = {
        furniture: state.asIsScene.furniture.map((f) => ({
          id: f.id,
          type: f.furniture_type,
          position: f.position,
          rotation: f.rotation,
          dimensions: f.dimensions,
        })),
        products: state.asIsScene.products.map((p) => ({
          id: p.id,
          sku: p.sku,
          position: p.position,
          dimensions: p.dimensions,
        })),
        space: {
          dimensions: state.asIsScene.space.dimensions,
        },
      };

      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          type: `${request.type}_optimization`,
          storeId: selectedStore.id,
          orgId,
          params: {
            ...request.params,
            sceneData, // As-is 씬 데이터 전달
          },
        },
      });

      if (error) throw error;
      if (!data?.result) throw new Error('시뮬레이션 결과를 받지 못했습니다.');

      return { [request.type]: data.result };
    },
    onSuccess: (newResults) => {
      setState((prev) => {
        const updatedResults = { ...prev.results, ...newResults };

        // To-be 씬 생성
        let comparison: SceneComparison | null = null;
        if (prev.asIsScene) {
          if (updatedResults.layout) {
            comparison = generateLayoutOptimizedScene(prev.asIsScene, updatedResults.layout);
          } else if (updatedResults.flow) {
            comparison = generateFlowOptimizedScene(prev.asIsScene, updatedResults.flow);
          } else if (updatedResults.staffing) {
            comparison = generateStaffingOptimizedScene(prev.asIsScene, updatedResults.staffing);
          }
        }

        return {
          ...prev,
          results: updatedResults,
          toBeScene: comparison?.toBe || prev.toBeScene,
          comparison,
          activeSimulations: prev.activeSimulations.filter(
            (s) => !Object.keys(newResults).includes(s)
          ),
        };
      });

      toast({
        title: '시뮬레이션 완료',
        description: 'To-be 씬이 생성되었습니다.',
      });
    },
    onError: (err) => {
      setError(err as Error);
      toast({
        title: '시뮬레이션 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSimulating(false);
    },
  });

  // 단일 시뮬레이션 실행
  const runSimulation = useCallback(
    async (request: SimulationRequest) => {
      await simulationMutation.mutateAsync(request);
    },
    [simulationMutation]
  );

  // 전체 시뮬레이션 실행
  const runAllSimulations = useCallback(
    async (params?: Record<SimulationType, Record<string, any>>) => {
      if (!state.asIsScene || !selectedStore?.id || !orgId) {
        toast({
          title: '씬을 먼저 선택해주세요',
          variant: 'destructive',
        });
        return;
      }

      setIsSimulating(true);

      try {
        // 씬 데이터 준비
        const sceneData = {
          furniture: state.asIsScene.furniture.map((f) => ({
            id: f.id,
            type: f.furniture_type,
            position: f.position,
            rotation: f.rotation,
            dimensions: f.dimensions,
          })),
          products: state.asIsScene.products.map((p) => ({
            id: p.id,
            sku: p.sku,
            position: p.position,
            dimensions: p.dimensions,
          })),
          space: {
            dimensions: state.asIsScene.space.dimensions,
          },
        };

        // 병렬로 시뮬레이션 실행
        const [layoutRes, flowRes, staffingRes] = await Promise.allSettled([
          supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'layout_optimization',
              storeId: selectedStore.id,
              orgId,
              params: { ...params?.layout, sceneData },
            },
          }),
          supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'flow_simulation',
              storeId: selectedStore.id,
              orgId,
              params: { ...params?.flow, sceneData },
            },
          }),
          supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'staffing_optimization',
              storeId: selectedStore.id,
              orgId,
              params: { ...params?.staffing, sceneData },
            },
          }),
        ]);

        const results: SimulationResults = {};
        if (layoutRes.status === 'fulfilled' && layoutRes.value.data?.result) {
          results.layout = layoutRes.value.data.result;
        }
        if (flowRes.status === 'fulfilled' && flowRes.value.data?.result) {
          results.flow = flowRes.value.data.result;
        }
        if (staffingRes.status === 'fulfilled' && staffingRes.value.data?.result) {
          results.staffing = staffingRes.value.data.result;
        }

        // 통합 To-be 씬 생성
        const comparison = generateCombinedOptimizedScene(state.asIsScene, results);

        setState((prev) => ({
          ...prev,
          results,
          toBeScene: comparison.toBe,
          comparison,
        }));

        toast({
          title: '전체 시뮬레이션 완료',
          description: `${comparison.summary.totalChanges}개의 최적화 제안이 생성되었습니다.`,
        });
      } catch (err) {
        setError(err as Error);
        toast({
          title: '시뮬레이션 실패',
          variant: 'destructive',
        });
      } finally {
        setIsSimulating(false);
      }
    },
    [state.asIsScene, selectedStore?.id, orgId, toast]
  );

  // 비교 결과 가져오기
  const getComparison = useCallback(() => state.comparison, [state.comparison]);

  // 변경 사항 가져오기
  const getChanges = useCallback(() => state.comparison?.changes || [], [state.comparison]);

  // 변경 선택/해제
  const selectChange = useCallback((changeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChanges: [...prev.selectedChanges, changeId],
    }));
  }, []);

  const deselectChange = useCallback((changeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChanges: prev.selectedChanges.filter((id) => id !== changeId),
    }));
  }, []);

  const selectAllChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedChanges: prev.comparison?.changes.map((c) => c.id) || [],
    }));
  }, []);

  const deselectAllChanges = useCallback(() => {
    setState((prev) => ({ ...prev, selectedChanges: [] }));
  }, []);

  // 선택된 변경 적용
  const applySelectedChanges = useCallback(async (): Promise<SceneRecipe> => {
    if (!state.asIsScene || !state.toBeScene) {
      throw new Error('씬이 없습니다.');
    }

    const merged = mergeToBeIntoAsIs(
      state.asIsScene,
      state.toBeScene,
      state.selectedChanges
    );

    setState((prev) => ({
      ...prev,
      asIsScene: merged,
      toBeScene: null,
      comparison: null,
      selectedChanges: [],
    }));

    toast({
      title: '변경 적용 완료',
      description: `${state.selectedChanges.length}개의 변경이 적용되었습니다.`,
    });

    return merged;
  }, [state, toast]);

  // 전체 변경 적용
  const applyAllChanges = useCallback(async (): Promise<SceneRecipe> => {
    if (!state.toBeScene) {
      throw new Error('To-be 씬이 없습니다.');
    }

    setState((prev) => ({
      ...prev,
      asIsScene: prev.toBeScene,
      toBeScene: null,
      comparison: null,
      selectedChanges: [],
    }));

    toast({
      title: '전체 변경 적용 완료',
    });

    return state.toBeScene;
  }, [state.toBeScene, toast]);

  // 뷰 모드 변경
  const setViewMode = useCallback((mode: SceneSimulationState['viewMode']) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  // To-be 씬 저장
  const saveToBeSceneMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!state.toBeScene || !user?.id || !selectedStore?.id) {
        throw new Error('저장할 씬이 없습니다.');
      }

      const { error } = await supabase.from('store_scenes').insert({
        user_id: user.id,
        store_id: selectedStore.id,
        name,
        recipe_data: state.toBeScene as any,
        is_active: false,
      });

      if (error) throw error;
    },
    onSuccess: (_, name) => {
      toast({
        title: 'To-be 씬 저장 완료',
        description: `"${name}" 씬이 저장되었습니다.`,
      });
    },
    onError: (err) => {
      toast({
        title: '씬 저장 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const saveToBeScene = useCallback(
    async (name: string) => {
      await saveToBeSceneMutation.mutateAsync(name);
    },
    [saveToBeSceneMutation]
  );

  return {
    state,
    isSimulating,
    error,

    setAsIsScene,
    clearScenes,

    runSimulation,
    runAllSimulations,

    getComparison,
    getChanges,

    selectChange,
    deselectChange,
    selectAllChanges,
    deselectAllChanges,
    applySelectedChanges,
    applyAllChanges,

    setViewMode,
    saveToBeScene,
  };
}

export default useSceneSimulation;
