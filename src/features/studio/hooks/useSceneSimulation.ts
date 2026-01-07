/**
 * useSceneSimulation.ts
 *
 * 씬 기반 AI 시뮬레이션 통합 훅
 * - As-is 씬 데이터를 AI에 전달
 * - 시뮬레이션 결과로 To-be 씬 생성
 * - 씬 비교 및 적용 관리
 * - 🆕 슬롯 기반 제품 배치 정보 추출
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
import type {
  SceneRecipe,
  SavedScene,
  LayoutSimulationResultType,
  FlowSimulationResultType,
  CongestionSimulationResultType,
  StaffingSimulationResultType,
  FurnitureAsset,
  // 🆕 Ultimate 타입
  UltimateOptimizationResponse,
  FlowAnalysisSummary,
  EnvironmentSummary,
  AssociationSummary,
  PredictionSummary,
  ConversionPredictionSummary,
  VMDAnalysis,
  LearningSession,
} from '../types';

// ============================================================================
// 🆕 슬롯 기반 제품 배치 타입
// ============================================================================

export interface ProductPlacementInfo {
  productId: string;
  productSku: string;
  productName: string;
  category?: string;
  displayType?: string;
  furnitureId: string;
  furnitureCode?: string;
  furnitureName?: string;
  slotId?: string;
  slotType?: string;
  position?: { x: number; y: number; z: number };
}

export interface AvailableSlotInfo {
  slotId: string;
  slotCode?: string;
  furnitureId: string;
  furnitureCode?: string;
  furnitureName?: string;
  slotType?: string;
  compatibleDisplayTypes?: string[];
  position?: { x: number; y: number; z: number };
}

// ============================================================================
// 🆕 제품 배치 및 슬롯 정보 추출 함수
// ============================================================================

/**
 * 가구의 childProducts에서 현재 제품 배치 정보 추출
 */
function extractProductPlacements(furniture: FurnitureAsset[]): ProductPlacementInfo[] {
  const placements: ProductPlacementInfo[] = [];

  furniture.forEach((f) => {
    const childProducts = (f as any).childProducts || [];
    childProducts.forEach((cp: any) => {
      placements.push({
        productId: cp.id,
        productSku: cp.sku || cp.metadata?.sku || '',
        productName: cp.metadata?.product_name || cp.metadata?.name || cp.sku || '상품',
        category: cp.metadata?.category,
        displayType: cp.display_type || cp.metadata?.display_type,
        furnitureId: f.id,
        furnitureCode: f.metadata?.furniture_code || f.metadata?.code,
        furnitureName: f.metadata?.name || f.furniture_type,
        slotId: cp.metadata?.slot_id || cp.slot_id,
        slotType: cp.metadata?.slot_type,
        position: cp.position ? {
          x: cp.position.x ?? cp.position[0] ?? 0,
          y: cp.position.y ?? cp.position[1] ?? 0,
          z: cp.position.z ?? cp.position[2] ?? 0,
        } : undefined,
      });
    });
  });

  console.log('[useSceneSimulation] extractProductPlacements:', placements.length, 'products');
  return placements;
}

/**
 * 사용 가능한 빈 슬롯 목록 추출
 * (DB의 furniture_slots 테이블에서 로드된 슬롯 정보와 현재 제품 배치 비교)
 */
async function extractAvailableSlots(
  storeId: string,
  furniture: FurnitureAsset[],
  currentPlacements: ProductPlacementInfo[]
): Promise<AvailableSlotInfo[]> {
  // DB에서 슬롯 데이터 로드
  const { data: dbSlots, error } = await supabase
    .from('furniture_slots')
    .select('*')
    .eq('store_id', storeId);

  if (error || !dbSlots) {
    console.warn('[useSceneSimulation] Failed to load slots:', error);
    return [];
  }

  // 현재 점유된 슬롯 ID 세트
  const occupiedSlotIds = new Set(currentPlacements.map((p) => p.slotId).filter(Boolean));

  // 가구 ID -> 가구 정보 맵
  const furnitureMap = new Map<string, FurnitureAsset>();
  furniture.forEach((f) => furnitureMap.set(f.id, f));

  // 빈 슬롯 필터링
  const availableSlots: AvailableSlotInfo[] = dbSlots
    .filter((s: any) => !s.is_occupied && !occupiedSlotIds.has(s.slot_id))
    .map((s: any) => {
      const furn = furnitureMap.get(s.furniture_id);
      return {
        slotId: s.id,
        slotCode: s.slot_id,
        furnitureId: s.furniture_id,
        furnitureCode: furn?.metadata?.furniture_code || furn?.metadata?.code,
        furnitureName: furn?.metadata?.name || furn?.furniture_type,
        slotType: s.slot_type,
        compatibleDisplayTypes: s.compatible_display_types,
        position: s.slot_position ? {
          x: s.slot_position.x ?? 0,
          y: s.slot_position.y ?? 0,
          z: s.slot_position.z ?? 0,
        } : undefined,
      };
    });

  console.log('[useSceneSimulation] extractAvailableSlots:', availableSlots.length, 'slots');
  return availableSlots;
}

// 타입 별칭 (기존 코드와 호환성 유지)
type LayoutSimulationResult = LayoutSimulationResultType;
type FlowSimulationResult = FlowSimulationResultType;
type CongestionSimulationResult = CongestionSimulationResultType;
type StaffingSimulationResult = StaffingSimulationResultType;

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
  // 🆕 Ultimate 분석 결과
  ultimateAnalysis?: {
    flowAnalysis?: FlowAnalysisSummary;
    environment?: EnvironmentSummary;
    association?: AssociationSummary;
    prediction?: PredictionSummary;
    conversionPrediction?: ConversionPredictionSummary;
    vmd?: VMDAnalysis;
    learningSession?: LearningSession | null;
    overallConfidence?: number;
  };
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
  runAllSimulations: (params?: Partial<Record<SimulationType, Record<string, any>>>, scene?: SceneRecipe) => Promise<SimulationResults>;

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

  // 전체 시뮬레이션 실행 (scene 파라미터로 직접 씬을 전달할 수 있음)
  const runAllSimulations = useCallback(
    async (params?: Partial<Record<SimulationType, Record<string, any>>>, scene?: SceneRecipe): Promise<SimulationResults> => {
      console.log('[useSceneSimulation] runAllSimulations called', {
        hasParams: !!params,
        paramsKeys: params ? Object.keys(params) : [],
        hasScene: !!scene,
        storeId: selectedStore?.id,
        orgId,
      });

      // 직접 전달된 씬 또는 state의 asIsScene 사용
      const targetScene = scene || state.asIsScene;

      if (!targetScene || !selectedStore?.id || !orgId) {
        console.error('[useSceneSimulation] Missing required data:', {
          hasTargetScene: !!targetScene,
          storeId: selectedStore?.id,
          orgId,
        });
        toast({
          title: '씬을 먼저 선택해주세요',
          variant: 'destructive',
        });
        return {};
      }

      // 직접 전달된 씬이 있으면 state도 업데이트
      if (scene) {
        setState((prev) => ({
          ...prev,
          asIsScene: scene,
          toBeScene: null,
          comparison: null,
          results: {},
          selectedChanges: [],
        }));
      }

      setIsSimulating(true);

      try {
        // 🆕 슬롯 기반 제품 배치 정보 추출
        const productPlacements = extractProductPlacements(targetScene.furniture);
        const availableSlots = await extractAvailableSlots(
          selectedStore.id,
          targetScene.furniture,
          productPlacements
        );

        console.log('[useSceneSimulation] Product placements for AI:', productPlacements.length);
        console.log('[useSceneSimulation] Available slots for AI:', availableSlots.length);

        // 씬 데이터 준비 (🆕 슬롯 기반 정보 포함)
        const sceneData = {
          furniture: targetScene.furniture.map((f) => ({
            id: f.id,
            type: f.furniture_type,
            code: f.metadata?.furniture_code || f.metadata?.code,
            name: f.metadata?.name || f.furniture_type,
            position: f.position,
            rotation: f.rotation,
            dimensions: f.dimensions,
          })),
          products: targetScene.products.map((p) => ({
            id: p.id,
            sku: p.sku,
            position: p.position,
            dimensions: p.dimensions,
          })),
          space: {
            dimensions: targetScene.space.dimensions,
          },
          // 🆕 슬롯 기반 제품 배치 정보
          productPlacements: productPlacements.map((p) => ({
            productId: p.productId,
            productSku: p.productSku,
            productName: p.productName,
            category: p.category,
            displayType: p.displayType,
            furnitureId: p.furnitureId,
            furnitureCode: p.furnitureCode,
            furnitureName: p.furnitureName,
            slotId: p.slotId,
            slotType: p.slotType,
          })),
          // 🆕 사용 가능한 빈 슬롯
          availableSlots: availableSlots.map((s) => ({
            slotId: s.slotId,
            slotCode: s.slotCode,
            furnitureId: s.furnitureId,
            furnitureCode: s.furnitureCode,
            furnitureName: s.furnitureName,
            slotType: s.slotType,
            compatibleDisplayTypes: s.compatibleDisplayTypes,
          })),
        };

        // 병렬로 시뮬레이션 실행
        console.log('[useSceneSimulation] Invoking Edge Functions...');
        console.log('[useSceneSimulation] Store ID:', selectedStore.id);
        console.log('[useSceneSimulation] Org ID:', orgId);
        console.log('[useSceneSimulation] Scene data:', {
          furnitureCount: sceneData.furniture.length,
          productCount: sceneData.products.length,
          spaceDimensions: sceneData.space.dimensions,
        });
        console.log('[useSceneSimulation] Supabase URL:', (supabase as any).supabaseUrl || 'not accessible');

        // 🔍 DEBUG: 실제 Edge Function 호출 직전 로그
        console.log('[useSceneSimulation] 🚀 Starting Edge Function calls NOW...');

        const [layoutRes, flowRes, staffingRes, ultimateRes] = await Promise.allSettled([
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
          // 🆕 Ultimate AI 최적화 호출 (동선/환경/연관/VMD 분석 포함)
          supabase.functions.invoke('generate-optimization', {
            body: {
              store_id: selectedStore.id,
              optimization_type: 'both',
              parameters: {
                prioritize_revenue: params?.layout?.goal === 'revenue',
                // 🔧 P0 FIX: Frontend intensity 설정 연동
                max_changes: (params?.layout?.settings?.products?.maxRelocations || 30) +
                             (params?.layout?.settings?.furniture?.maxMoves || 12),
                max_product_changes: params?.layout?.settings?.products?.maxRelocations || 30,
                max_furniture_changes: params?.layout?.settings?.furniture?.maxMoves || 12,
                intensity: params?.layout?.settings?.intensity || 'medium',
                // 🔧 P1 FIX: 환경 컨텍스트 전달
                environment_context: params?.layout?.environment_context || null,
                // 🔧 P1 FIX: 진단 이슈 전달
                diagnostic_issues: params?.layout?.diagnostic_issues || null,
                // 최적화 목표 전달
                goal: params?.layout?.settings?.objective || params?.layout?.goal || 'balanced',
              },
            },
          }),
        ]);

        console.log('[useSceneSimulation] Edge Function responses:', {
          layout: layoutRes.status === 'fulfilled' ? { data: layoutRes.value.data, error: layoutRes.value.error } : { reason: layoutRes.reason },
          flow: flowRes.status === 'fulfilled' ? { data: flowRes.value.data, error: flowRes.value.error } : { reason: flowRes.reason },
          staffing: staffingRes.status === 'fulfilled' ? { data: staffingRes.value.data, error: staffingRes.value.error } : { reason: staffingRes.reason },
          ultimate: ultimateRes.status === 'fulfilled' ? { success: ultimateRes.value.data?.success } : { reason: ultimateRes.reason },
        });

        const results: SimulationResults = {};
        if (layoutRes.status === 'fulfilled' && layoutRes.value.data?.result) {
          // 🔧 FIX: productPlacements가 result 외부에 있을 수 있으므로 병합
          const layoutData = layoutRes.value.data;
          results.layout = {
            ...layoutData.result,
            // productPlacements는 result 내부 또는 외부에 있을 수 있음
            productPlacements: layoutData.result?.productPlacements ||
                               layoutData.productPlacements ||
                               layoutData.result?.productMoves ||
                               layoutData.productMoves ||
                               [],
          };
          console.log('[useSceneSimulation] Layout result with productPlacements:', {
            resultHasProductPlacements: !!layoutData.result?.productPlacements,
            dataHasProductPlacements: !!layoutData.productPlacements,
            productPlacementsCount: results.layout.productPlacements?.length || 0,
          });
        } else {
          console.warn('[useSceneSimulation] No layout result:', layoutRes);
        }
        if (flowRes.status === 'fulfilled' && flowRes.value.data?.result) {
          results.flow = flowRes.value.data.result;
          console.log('[useSceneSimulation] Flow result extracted:', results.flow);
        } else {
          console.warn('[useSceneSimulation] No flow result:', flowRes);
        }
        if (staffingRes.status === 'fulfilled') {
          const staffingData = staffingRes.value.data;
          // 🔧 FIX: staffing result가 다양한 위치에 있을 수 있음
          const staffingResult = staffingData?.result || staffingData?.staffing || staffingData;

          if (staffingResult && (staffingResult.staffPositions || staffingResult.metrics || staffingResult.zoneCoverage)) {
            results.staffing = {
              ...staffingResult,
              // staffPositions가 다른 이름일 수 있음
              staffPositions: staffingResult.staffPositions ||
                              staffingResult.staff_positions ||
                              staffingResult.positions ||
                              [],
            };
            console.log('[useSceneSimulation] Staffing result extracted:', {
              hasStaffPositions: !!results.staffing.staffPositions?.length,
              positionsCount: results.staffing.staffPositions?.length || 0,
              hasMetrics: !!staffingResult.metrics,
              hasZoneCoverage: !!staffingResult.zoneCoverage,
            });
          } else {
            console.warn('[useSceneSimulation] Staffing data structure unknown:', staffingData);
          }
        } else {
          console.warn('[useSceneSimulation] No staffing result:', staffingRes);
        }

        // 🆕 Ultimate 분석 결과 처리
        if (ultimateRes.status === 'fulfilled' && ultimateRes.value.data?.success) {
          const ultimateData = ultimateRes.value.data as UltimateOptimizationResponse;
          console.log('[useSceneSimulation] 🎯 Ultimate analysis received:', {
            hasFlowAnalysis: !!ultimateData.flow_analysis_summary,
            hasVMD: !!ultimateData.vmd_analysis,
            hasEnvironment: !!ultimateData.environment_summary,
            hasAssociation: !!ultimateData.association_summary,
            hasPrediction: !!ultimateData.prediction_summary,
          });

          results.ultimateAnalysis = {
            flowAnalysis: ultimateData.flow_analysis_summary,
            environment: ultimateData.environment_summary,
            association: ultimateData.association_summary,
            prediction: ultimateData.prediction_summary,
            conversionPrediction: ultimateData.conversion_prediction_summary,
            vmd: ultimateData.vmd_analysis,
            learningSession: ultimateData.learning_session,
            overallConfidence: ultimateData.prediction_summary?.overall_confidence ?? 75,
          };
        } else {
          console.warn('[useSceneSimulation] No Ultimate analysis result:', ultimateRes);
        }

        // 통합 To-be 씬 생성
        const comparison = generateCombinedOptimizedScene(targetScene, results);

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

        return results;
      } catch (err) {
        setError(err as Error);
        toast({
          title: '시뮬레이션 실패',
          variant: 'destructive',
        });
        return {};
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

      const { error } = await supabase.from('store_scenes').insert([{
        user_id: user.id,
        org_id: user.id,
        store_id: selectedStore.id,
        scene_name: name,
        recipe_data: state.toBeScene as any,
        is_active: false,
      }]);

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
