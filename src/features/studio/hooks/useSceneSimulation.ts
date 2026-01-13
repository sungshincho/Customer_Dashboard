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

        // 🔧 아키텍처 통합: generate-optimization 단일 호출로 변경
        // (기존 advanced-ai-inference 3개 호출 제거 - 비용 75% 절감)
        console.log('[useSceneSimulation] 🚀 Starting generate-optimization call...');

        const { data: optimizationData, error: optimizationError } = await supabase.functions.invoke('generate-optimization', {
          body: {
            store_id: selectedStore.id,
            optimization_type: 'both',
            parameters: {
              prioritize_revenue: params?.layout?.goal === 'revenue',
              max_changes: (params?.layout?.settings?.products?.maxRelocations || 30) +
                           (params?.layout?.settings?.furniture?.maxMoves || 12),
              max_product_changes: params?.layout?.settings?.products?.maxRelocations || 30,
              max_furniture_changes: params?.layout?.settings?.furniture?.maxMoves || 12,
              intensity: params?.layout?.settings?.intensity || 'medium',
              environment_context: params?.layout?.environment_context || null,
              diagnostic_issues: params?.layout?.diagnostic_issues || null,
              goal: params?.layout?.settings?.objective || params?.layout?.goal || 'balanced',
            },
          },
        });

        if (optimizationError) {
          console.error('[useSceneSimulation] ❌ Edge Function error:', {
            message: optimizationError.message,
            context: optimizationError.context,
            name: optimizationError.name,
            details: JSON.stringify(optimizationError),
          });
          throw new Error(optimizationError.message || 'Optimization failed');
        }

        console.log('[useSceneSimulation] generate-optimization response:', {
          success: optimizationData?.success,
          hasResult: !!optimizationData?.result,
          hasVisualization: !!optimizationData?.visualization,
          hasFlowAnalysis: !!optimizationData?.flow_analysis_summary,
        });

        const results: SimulationResults = {};

        // 🆕 통합된 visualization 데이터에서 layout, flow, staffing 추출
        if (optimizationData?.success) {
          const vizData = optimizationData.visualization;
          const mainResult = optimizationData.result;

          // 1. Layout 결과 (visualization.layout + result에서 추출)
          results.layout = {
            furnitureMoves: vizData?.layout?.furnitureMoves || [],
            productPlacements: vizData?.layout?.productMoves || mainResult?.product_changes?.map((pc: any) => ({
              productId: pc.product_id,
              productSku: pc.sku,
              from: pc.current,
              to: pc.suggested,
              reason: pc.reason,
            })) || [],
            summary: mainResult?.summary || {},
            confidence: mainResult?.summary?.expected_revenue_improvement || 0,
          };
          console.log('[useSceneSimulation] Layout extracted:', {
            furnitureMovesCount: results.layout.furnitureMoves?.length || 0,
            productPlacementsCount: results.layout.productPlacements?.length || 0,
          });

          // 2. Flow 결과 (visualization.flow + flow_analysis_summary에서 추출)
          const flowSummary = optimizationData.flow_analysis_summary;
          results.flow = {
            visualization: {
              flowHeatmap: [],
              zoneFlowArrows: vizData?.flow?.zoneFlowArrows || [],
            },
            paths: vizData?.flow?.paths || flowSummary?.key_paths || [],
            bottlenecks: vizData?.flow?.bottlenecks || flowSummary?.bottlenecks?.map((b: any) => ({
              zoneId: b.zone,
              zoneName: b.zone,
              severity: b.severity,
              congestionScore: b.congestion,
            })) || [],
            deadZones: vizData?.flow?.deadZones || flowSummary?.dead_zones || [],
            summary: {
              flowHealthScore: flowSummary?.flow_health_score || 0,
              bottleneckCount: flowSummary?.bottleneck_count || 0,
              deadZoneCount: flowSummary?.dead_zone_count || 0,
              conversionRate: flowSummary?.overall_conversion_rate || 0,
            },
          };
          console.log('[useSceneSimulation] Flow extracted:', {
            zoneFlowArrowsCount: results.flow.visualization?.zoneFlowArrows?.length || 0,
            bottlenecksCount: results.flow.bottlenecks?.length || 0,
            flowHealthScore: results.flow.summary?.flowHealthScore,
          });

          // 3. Staffing 결과 (visualization.staffing + result.staffing_result에서 추출)
          const staffingResult = mainResult?.staffing_result;
          results.staffing = {
            staffPositions: vizData?.staffing?.staffMarkers?.map((sm: any) => ({
              staffId: sm.staffId,
              staffName: sm.staffName,
              role: sm.role,
              currentPosition: sm.currentPosition,
              suggestedPosition: sm.suggestedPosition,
            })) || staffingResult?.staffPositions || [],
            zoneCoverage: vizData?.staffing?.coverageZones || staffingResult?.zoneCoverage || [],
            metrics: staffingResult?.metrics || {
              currentCoverage: 0,
              optimizedCoverage: 0,
              customerServiceRateIncrease: 0,
              avgResponseTimeReduction: 0,
              efficiencyScore: 0,
            },
            visualization: {
              heatmap: [],
              coverageZones: vizData?.staffing?.coverageZones || [],
              movementPaths: vizData?.staffing?.movementPaths || [],
              staffMarkers: vizData?.staffing?.staffMarkers || [],
            },
            insights: staffingResult?.insights || [],
          };
          console.log('[useSceneSimulation] Staffing extracted:', {
            staffPositionsCount: results.staffing.staffPositions?.length || 0,
            coverageZonesCount: results.staffing.zoneCoverage?.length || 0,
          });

          // 4. Ultimate 분석 결과 (기존과 동일)
          results.ultimateAnalysis = {
            flowAnalysis: optimizationData.flow_analysis_summary,
            environment: optimizationData.environment_summary,
            association: optimizationData.association_summary,
            prediction: optimizationData.prediction_summary,
            conversionPrediction: optimizationData.conversion_prediction_summary,
            vmd: optimizationData.vmd_analysis,
            learningSession: optimizationData.learning_session,
            overallConfidence: optimizationData.prediction_summary?.overall_confidence ?? 75,
          };
          console.log('[useSceneSimulation] 🎯 Ultimate analysis:', {
            hasFlowAnalysis: !!results.ultimateAnalysis.flowAnalysis,
            hasVMD: !!results.ultimateAnalysis.vmd,
            hasEnvironment: !!results.ultimateAnalysis.environment,
            overallConfidence: results.ultimateAnalysis.overallConfidence,
          });
        } else {
          console.warn('[useSceneSimulation] Optimization failed or no data:', optimizationData);
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
        console.error('[useSceneSimulation] ❌ Simulation failed:', err);
        setError(err as Error);
        toast({
          title: '시뮬레이션 실패',
          description: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
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
