/**
 * AIOptimizationTab.tsx
 *
 * AI 최적화 탭 - 레이아웃/동선/인력배치 최적화
 * - 다중 선택 가능
 * - As-Is / To-Be 결과 비교
 * - 3D 씬에 결과 자동 반영
 * - 최적화 설정 패널 (가구/제품/강도)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Layout, Route, Users, Loader2, ChevronDown, ChevronUp, Check, RotateCcw, Eye, Layers, Target, TrendingUp, Clock, Footprints, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { buildStoreContext } from '../utils/store-context-builder';
import { OptimizationResultPanel } from '../panels/OptimizationResultPanel';
import { useScene } from '../core/SceneProvider';
import { OptimizationSettingsPanel } from '../components/optimization';
import type { UseSceneSimulationReturn } from '../hooks/useSceneSimulation';
import type { SceneRecipe } from '../types';
import type {
  OptimizationSettings,
  FurnitureItem,
  ProductItem,
} from '../types/optimization.types';
import { DEFAULT_OPTIMIZATION_SETTINGS, INTENSITY_LIMITS } from '../types/optimization.types';

type OptimizationType = 'layout' | 'flow' | 'staffing';
type ViewMode = 'all' | 'as-is' | 'to-be';
type OptimizationGoal = 'revenue' | 'dwell_time' | 'traffic' | 'conversion';

interface GoalOption {
  id: OptimizationGoal;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const goalOptions: GoalOption[] = [
  {
    id: 'revenue',
    label: '매출',
    description: '매출 극대화',
    icon: TrendingUp,
  },
  {
    id: 'dwell_time',
    label: '체류',
    description: '체류시간 증가',
    icon: Clock,
  },
  {
    id: 'traffic',
    label: '동선',
    description: '유동인구 분산',
    icon: Footprints,
  },
  {
    id: 'conversion',
    label: '전환',
    description: '전환율 개선',
    icon: Target,
  },
];

interface OptimizationOption {
  id: OptimizationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const optimizationOptions: OptimizationOption[] = [
  {
    id: 'layout',
    label: '레이아웃 최적화',
    description: 'AI가 가구/제품/장치 배치를 최적화합니다',
    icon: Layout,
  },
  {
    id: 'staffing',
    label: '인력 배치 최적화',
    description: 'AI가 최적의 직원 배치를 제안합니다',
    icon: Users,
  },
  // 동선 최적화는 오버레이_고객 시뮬레이션으로 통합됨
];

interface AIOptimizationTabProps {
  storeId: string;
  sceneData: SceneRecipe | null;
  sceneSimulation: UseSceneSimulationReturn;
  onSceneUpdate?: (newScene: any) => void;
  onOverlayToggle: (overlayType: string, visible: boolean) => void;
  onResultsUpdate?: (type: 'layout' | 'flow' | 'congestion' | 'staffing', result: any) => void;
}

export function AIOptimizationTab({
  storeId,
  sceneData,
  sceneSimulation,
  onSceneUpdate,
  onOverlayToggle,
  onResultsUpdate,
}: AIOptimizationTabProps) {
  // SceneProvider에서 applySimulationResults 가져오기
  const { applySimulationResults } = useScene();

  // 최적화 목표 선택
  const [selectedGoal, setSelectedGoal] = useState<OptimizationGoal>('revenue');

  // 선택된 최적화 유형들
  const [selectedOptimizations, setSelectedOptimizations] = useState<OptimizationType[]>(['layout']);

  // 실행 상태
  const [runningTypes, setRunningTypes] = useState<OptimizationType[]>([]);

  // 결과 패널 펼침/접힘
  const [isResultExpanded, setIsResultExpanded] = useState(true);

  // 비교 모드 (all: 전체, as-is: 변경 전, to-be: 변경 후)
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // 최적화 설정 상태
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>(DEFAULT_OPTIMIZATION_SETTINGS);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // sceneData에서 가구/제품 목록 추출
  const furnitureItems: FurnitureItem[] = useMemo(() => {
    if (!sceneData?.furniture) return [];
    return sceneData.furniture.map((f) => ({
      id: f.id,
      name: f.metadata?.name || f.furniture_type || '가구',
      furniture_type: f.furniture_type || 'unknown',
      movable: f.movable !== false, // 기본적으로 이동 가능
      position: f.position || { x: 0, y: 0, z: 0 },
      zone_id: f.metadata?.zone_id,
    }));
  }, [sceneData?.furniture]);

  const productItems: ProductItem[] = useMemo(() => {
    const products: ProductItem[] = [];

    // 1️⃣ sceneData.products에서 추출 (기존 방식)
    if (sceneData?.products) {
      sceneData.products.forEach((p) => {
        products.push({
          id: p.id,
          sku: p.sku || '',
          product_name: p.metadata?.product_name || p.metadata?.name || '상품',
          category: p.metadata?.category,
          furniture_id: p.metadata?.furniture_id,
          slot_id: p.metadata?.slot_id,
        });
      });
    }

    // 2️⃣ 가구의 childProducts에서 추출 (SEED 로더 방식)
    if (sceneData?.furniture) {
      sceneData.furniture.forEach((f) => {
        const childProducts = (f as any).childProducts || [];
        childProducts.forEach((cp: any) => {
          products.push({
            id: cp.id,
            sku: cp.sku || cp.metadata?.sku || '',
            product_name: cp.metadata?.product_name || cp.metadata?.name || cp.sku || '상품',
            category: cp.metadata?.category,
            furniture_id: f.id,
            slot_id: cp.metadata?.slot_id,
          });
        });
      });
    }

    // 🔍 DEBUG: 제품 추출 결과 로깅
    console.log('[AIOptimizationTab] productItems extracted:', {
      fromProducts: sceneData?.products?.length || 0,
      fromChildProducts: products.length - (sceneData?.products?.length || 0),
      total: products.length,
      furnitureCount: sceneData?.furniture?.length || 0,
    });

    return products;
  }, [sceneData?.products, sceneData?.furniture]);

  // 비교 모드 변경 시 오버레이 업데이트
  useEffect(() => {
    const { results } = sceneSimulation.state;
    const hasLayoutResult = !!results.layout;

    if (hasLayoutResult) {
      // viewMode에 따라 오버레이 설정
      // 'all' - 모든 변경 표시 (As-Is, To-Be, 화살표 모두)
      // 'as-is' - 원래 상태만
      // 'to-be' - 최적화 결과만
      onOverlayToggle('layoutOptimization', viewMode !== 'as-is');
    }
  }, [viewMode, sceneSimulation.state.results, onOverlayToggle]);

  // 체크박스 토글
  const toggleOptimization = (type: OptimizationType) => {
    setSelectedOptimizations((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // 전체 선택/해제
  const toggleAll = () => {
    if (selectedOptimizations.length === optimizationOptions.length) {
      setSelectedOptimizations([]);
    } else {
      setSelectedOptimizations(optimizationOptions.map((o) => o.id));
    }
  };

  // 최적화 실행
  const runOptimizations = useCallback(async () => {
    console.log('[AIOptimizationTab] runOptimizations clicked', {
      selectedOptimizations,
      selectedGoal,
      storeId,
      hasSceneData: !!sceneData,
      optimizationSettings,
    });

    if (selectedOptimizations.length === 0) {
      toast.error('최적화를 선택하세요');
      return;
    }

    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    if (!sceneData) {
      toast.error('씬 데이터가 없습니다');
      return;
    }

    setRunningTypes([...selectedOptimizations]);

    try {
      // Store Context 빌드 (온톨로지 + 데이터소스)
      console.log('[AIOptimizationTab] Building store context...');
      const storeContext = await buildStoreContext(storeId);
      console.log('[AIOptimizationTab] Store context built:', {
        hasZones: storeContext.zones?.length,
        hasFurniture: storeContext.productPlacements?.length,
        hasVisits: storeContext.visits?.length,
      });

      // 강도에 따른 제한 설정
      const intensityLimits = INTENSITY_LIMITS[optimizationSettings.intensity];

      // 선택된 최적화만 실행하도록 파라미터 구성
      const params: Record<string, Record<string, any>> = {};

      if (selectedOptimizations.includes('layout')) {
        // 목표를 설정 패널의 objective로 매핑
        const goalMapping: Record<string, OptimizationGoal> = {
          revenue: 'revenue',
          dwell_time: 'dwell_time',
          conversion: 'conversion',
          balanced: 'revenue', // balanced는 revenue로 기본 설정
        };

        params.layout = {
          goal: goalMapping[optimizationSettings.objective] || selectedGoal,
          storeContext,
          // 설정 패널의 상세 설정 전달
          settings: {
            objective: optimizationSettings.objective,
            furniture: {
              movableIds: optimizationSettings.furniture.movableIds,
              keepWallAttached: optimizationSettings.furniture.keepWallAttached,
              keepZoneBoundaries: optimizationSettings.furniture.keepZoneBoundaries,
              maxMoves: intensityLimits.maxFurnitureMoves,
            },
            products: {
              relocatableIds: optimizationSettings.products.relocateAll
                ? [] // 빈 배열 = 전체 제품
                : optimizationSettings.products.relocatableIds,
              relocateAll: optimizationSettings.products.relocateAll,
              respectDisplayType: optimizationSettings.products.respectDisplayType,
              keepCategory: optimizationSettings.products.keepCategory,
              maxRelocations: intensityLimits.maxProductRelocations,
            },
            intensity: optimizationSettings.intensity,
          },
        };
      }
      if (selectedOptimizations.includes('flow')) {
        params.flow = {
          duration: '1hour',
          customerCount: 100,
          storeContext,
        };
      }
      if (selectedOptimizations.includes('staffing')) {
        // 선택된 목표에 따라 직원 배치 전략 결정
        const staffingGoalMap: Record<OptimizationGoal, string> = {
          revenue: 'sales_support',
          dwell_time: 'customer_engagement',
          traffic: 'flow_guidance',
          conversion: 'customer_service',
        };
        params.staffing = {
          staffCount: 3,
          goal: staffingGoalMap[selectedGoal],
          storeContext,
        };
      }

      console.log('[AIOptimizationTab] Calling runAllSimulations with params:', Object.keys(params));

      // useSceneSimulation의 runAllSimulations 호출 - 결과를 직접 반환받음
      const results = await sceneSimulation.runAllSimulations(params, sceneData);

      console.log('[AIOptimizationTab] runAllSimulations returned:', {
        hasLayout: !!results.layout,
        hasFlow: !!results.flow,
        hasStaffing: !!results.staffing,
        results,
      });

      // 레이아웃 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.layout) {
        onOverlayToggle('layoutOptimization', true);

        // 오른쪽 패널용 결과 변환
        if (onResultsUpdate) {
          const layoutPanelResult = {
            currentEfficiency: results.layout.currentEfficiency || 1,
            optimizedEfficiency: results.layout.optimizedEfficiency || 75,
            revenueIncrease: results.layout.improvements?.revenueIncrease ||
                            results.layout.optimizationSummary?.expectedRevenueIncrease || 0,
            dwellTimeIncrease: results.layout.improvements?.dwellTimeIncrease || 0,
            conversionIncrease: results.layout.improvements?.conversionIncrease ||
                               results.layout.optimizationSummary?.expectedConversionIncrease || 0,
            // 가구 변경 사항 (layoutChanges 또는 furnitureMoves 지원)
            changes: (results.layout.layoutChanges || results.layout.furnitureMoves || []).map((move: any) => ({
              item: move.entityLabel || move.furnitureName || move.furnitureId || move.name || '가구',
              from: (move.currentPosition || move.fromPosition)
                ? `(${(move.currentPosition?.x || move.fromPosition?.x || 0).toFixed(1)}, ${(move.currentPosition?.z || move.fromPosition?.z || 0).toFixed(1)})`
                : 'As-Is',
              to: (move.suggestedPosition || move.toPosition)
                ? `(${(move.suggestedPosition?.x || move.toPosition?.x || 0).toFixed(1)}, ${(move.suggestedPosition?.z || move.toPosition?.z || 0).toFixed(1)})`
                : 'To-Be',
              effect: move.reason || '+효율성',
            })),
            // 🆕 제품 재배치 변경 사항 (슬롯 바인딩 기반)
            productChanges: (results.layout.productPlacements || []).map((placement: any) => ({
              productId: placement.productId || placement.product_id || '',
              productSku: placement.productSku || placement.sku || '',
              productName: placement.productName || placement.productLabel || placement.sku || '상품',
              // As-Is (현재 위치)
              fromFurniture: placement.fromFurnitureCode || placement.fromFurnitureName || placement.currentFurnitureLabel || '현재 가구',
              fromSlot: placement.fromSlotId || '-',
              // To-Be (제안 위치)
              toFurniture: placement.toFurnitureCode || placement.toFurnitureName || placement.suggestedFurnitureLabel || '추천 가구',
              toSlot: placement.toSlotId || '-',
              // 사유 및 예상 효과
              reason: placement.reason || '슬롯 최적화',
              expectedImpact: placement.expectedImpact ? {
                revenueChangePct: placement.expectedImpact.revenueChangePct || placement.expectedImpact.revenue_change_pct || 0,
                visibilityScore: placement.expectedImpact.visibilityScore || placement.expectedImpact.visibility_score || 0,
              } : undefined,
            })),
          };

          console.log('[AIOptimizationTab] layoutPanelResult:', {
            changesCount: layoutPanelResult.changes.length,
            productChangesCount: layoutPanelResult.productChanges.length,
            rawLayoutChanges: results.layout.layoutChanges?.length,
            rawFurnitureMoves: results.layout.furnitureMoves?.length,
            rawProductPlacements: results.layout.productPlacements?.length,
          });

          onResultsUpdate('layout', layoutPanelResult);
        }
      }

      // 동선 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.flow) {
        onOverlayToggle('flowOptimization', true);

        if (onResultsUpdate) {
          const flowPanelResult = {
            currentPathLength: results.flow.comparison?.currentPathLength || 45,
            optimizedPathLength: results.flow.comparison?.optimizedPathLength || 38,
            bottlenecks: results.flow.bottlenecks?.map((b: any) => ({
              location: b.location || b.zoneName || '구간',
              congestion: Math.round((b.severity || b.congestionLevel || 0.7) * 100),
              cause: b.cause || '통로 혼잡',
              suggestion: b.suggestions?.[0] || '통로 확장 권장',
            })) || [],
            improvements: [
              { metric: '동선 길이 감소', value: `${results.flow.comparison?.pathLengthReduction?.toFixed(1) || -15}%` },
              { metric: '이동 시간 감소', value: `${results.flow.comparison?.timeReduction?.toFixed(1) || -18}%` },
              { metric: '병목 해소율', value: `${Math.round((results.flow.comparison?.congestionReduction || 0.8) * 100)}%` },
            ],
          };
          onResultsUpdate('flow', flowPanelResult);
        }
      }

      // 인력배치 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.staffing) {
        onOverlayToggle('staffingOptimization', true);

        if (onResultsUpdate) {
          const currentCoverage = results.staffing.zoneCoverage?.[0]?.currentCoverage || 68;
          const optimizedCoverage = results.staffing.zoneCoverage?.[0]?.suggestedCoverage || 92;
          const staffingPanelResult = {
            currentCoverage,
            optimizedCoverage,
            staffCount: results.staffing.staffPositions?.length || 3,
            staffPositions: results.staffing.staffPositions?.map((p: any) => ({
              name: p.staffName || p.staffId || `직원`,
              current: p.currentPosition ? `(${p.currentPosition.x?.toFixed(1)}, ${p.currentPosition.z?.toFixed(1)})` : '현재 위치',
              suggested: p.suggestedPosition ? `(${p.suggestedPosition.x?.toFixed(1)}, ${p.suggestedPosition.z?.toFixed(1)})` : '제안 위치',
              coverageGain: `+${p.coverageGain || 10}%`,
            })) || [],
            improvements: [
              { metric: '고객 응대율', value: `+${Math.round((results.staffing.metrics?.customerServiceRateIncrease || 0.35) * 100)}%` },
              { metric: '대기 시간', value: `-${Math.round((1 / (results.staffing.metrics?.avgResponseTime || 1)) * 10)}%` },
              { metric: '커버리지 증가', value: `+${results.staffing.metrics?.coverageGain || 24}%` },
            ],
          };
          onResultsUpdate('staffing', staffingPanelResult);
        }
      }

      toast.success(`${selectedOptimizations.length}개 최적화가 완료되었습니다`);
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('최적화 실행 중 오류가 발생했습니다');
    } finally {
      setRunningTypes([]);
    }
  }, [selectedOptimizations, selectedGoal, storeId, sceneData, sceneSimulation, onOverlayToggle, onResultsUpdate, optimizationSettings]);

  // As-Is 씬으로 복원
  const handleRevertToAsIs = useCallback(() => {
    sceneSimulation.clearScenes();
    onOverlayToggle('layoutOptimization', false);
    onOverlayToggle('flowOptimization', false);
    onOverlayToggle('staffingOptimization', false);
    toast.info('원래 씬으로 복원되었습니다');
  }, [sceneSimulation, onOverlayToggle]);

  // To-Be 씬 적용 - 3D 모델 위치 실제 변경 (가구 + 상품)
  const handleApplyToBe = useCallback(async () => {
    try {
      const results = sceneSimulation.state.results;

      const payload: {
        furnitureMoves?: any[];
        productPlacements?: any[];
      } = {};

      // 1️⃣ 레이아웃 최적화 결과가 있으면 가구 이동 적용 (layoutChanges 또는 furnitureMoves)
      const furnitureMoves = results.layout?.layoutChanges || results.layout?.furnitureMoves || [];
      if (furnitureMoves.length > 0) {
        payload.furnitureMoves = furnitureMoves;
      }

      // 2️⃣ 상품 배치 결과가 있으면 상품 재배치 적용 (슬롯 기반)
      if (results.layout?.productPlacements && results.layout.productPlacements.length > 0) {
        payload.productPlacements = results.layout.productPlacements;
      }

      // 변경사항이 있을 때만 적용
      if (payload.furnitureMoves || payload.productPlacements) {
        applySimulationResults(payload);

        const moveCount = payload.furnitureMoves?.length || 0;
        const placementCount = payload.productPlacements?.length || 0;

        toast.success(
          `최적화 적용 완료: 가구 ${moveCount}개 이동, 상품 ${placementCount}개 재배치`
        );
      }

      // 내부 상태도 업데이트
      await sceneSimulation.applyAllChanges();

    } catch (error) {
      console.error('Apply To-Be error:', error);
      toast.error('적용에 실패했습니다');
    }
  }, [sceneSimulation, applySimulationResults]);

  // To-Be 씬 저장
  const handleSaveToBe = useCallback(async () => {
    try {
      const sceneName = `최적화 씬 ${new Date().toLocaleDateString('ko-KR')}`;
      await sceneSimulation.saveToBeScene(sceneName);
    } catch (error) {
      toast.error('저장에 실패했습니다');
    }
  }, [sceneSimulation]);

  const { results } = sceneSimulation.state;
  const hasResults = results.layout || results.flow || results.staffing;
  const isRunning = sceneSimulation.isSimulating || runningTypes.length > 0;

  return (
    <div className="p-4 space-y-4">
      {/* ========== 최적화 목표 선택 ========== */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-white/60 flex items-center gap-1.5">
          <Target className="h-3 w-3" />
          최적화 목표
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {goalOptions.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                disabled={isRunning}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg transition-all text-center',
                  isSelected
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                )}
              >
                <Icon className={cn('h-4 w-4 mb-1', isSelected ? 'text-white' : 'text-white/40')} />
                <span className="text-[10px] font-medium">{goal.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-white/40 text-center">
          {goalOptions.find(g => g.id === selectedGoal)?.description}
        </p>
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 최적화 선택 섹션 ========== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI 최적화
          </div>
          <button
            onClick={toggleAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {selectedOptimizations.length === optimizationOptions.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {/* 최적화 옵션 체크박스 */}
        <div className="space-y-2">
          {optimizationOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOptimizations.includes(option.id);
            const isRunningThis = runningTypes.includes(option.id);
            const hasResult = !!results[option.id];

            return (
              <label
                key={option.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
                  'border border-transparent',
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 hover:bg-white/10',
                  isRunningThis && 'opacity-70 cursor-wait'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOptimization(option.id)}
                  disabled={isRunning}
                  className="mt-1 w-4 h-4 rounded border-white/40 text-blue-600 focus:ring-blue-500 bg-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isSelected ? 'text-blue-400' : 'text-white/40')} />
                    <span className={cn('text-sm font-medium', isSelected ? 'text-white' : 'text-white/70')}>
                      {option.label}
                    </span>
                    {isRunningThis && <Loader2 className="h-3 w-3 animate-spin text-blue-400" />}
                    {hasResult && !isRunningThis && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-600 text-white rounded">완료</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* ========== 상세 설정 섹션 ========== */}
        <div className="space-y-2">
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="w-full flex items-center justify-between text-xs font-medium text-white/70 hover:text-white/90 transition-colors p-2 bg-white/5 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-purple-400" />
              상세 설정
              <span className="text-white/40">
                ({optimizationSettings.intensity === 'low' ? '보수적' : optimizationSettings.intensity === 'medium' ? '균형' : '적극적'})
              </span>
            </div>
            {isSettingsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isSettingsExpanded && (
            <OptimizationSettingsPanel
              settings={optimizationSettings}
              onChange={setOptimizationSettings}
              furniture={furnitureItems}
              products={productItems}
              disabled={isRunning}
              compact
            />
          )}
        </div>

        {/* 실행 버튼 */}
        <Button
          onClick={runOptimizations}
          disabled={isRunning || selectedOptimizations.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              최적화 실행 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              선택된 {selectedOptimizations.length}개 최적화 실행
            </>
          )}
        </Button>
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 결과 섹션 ========== */}
      <div className="space-y-3">
        <button
          onClick={() => setIsResultExpanded(!isResultExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-white/80"
        >
          <span>최적화 결과</span>
          {isResultExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </button>

        {isResultExpanded && (
          <div className="space-y-3">
            {!hasResults ? (
              <div className="text-center py-6 text-white/40 text-sm">
                최적화를 실행하면 결과가 여기에 표시됩니다.
              </div>
            ) : (
              <>
                {/* 레이아웃 최적화 결과 */}
                {results.layout && (
                  <OptimizationResultPanel
                    type="layout"
                    title="레이아웃 최적화"
                    result={results.layout}
                  />
                )}

                {/* 동선 최적화 결과 */}
                {results.flow && (
                  <OptimizationResultPanel
                    type="flow"
                    title="동선 최적화"
                    result={results.flow}
                    onToggleOverlay={(visible) => onOverlayToggle('flowOptimization', visible)}
                  />
                )}

                {/* 인력 배치 최적화 결과 */}
                {results.staffing && (
                  <OptimizationResultPanel
                    type="staffing"
                    title="인력 배치 최적화"
                    result={results.staffing}
                    onToggleOverlay={(visible) => onOverlayToggle('staffingOptimization', visible)}
                  />
                )}

                {/* 비교 모드 토글 */}
                <div className="p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                    <Eye className="h-3 w-3" />
                    3D 뷰 모드
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewMode('as-is')}
                      className={cn(
                        'flex-1 px-2 py-1.5 text-xs rounded transition-all',
                        viewMode === 'as-is'
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      )}
                    >
                      As-Is
                    </button>
                    <button
                      onClick={() => setViewMode('all')}
                      className={cn(
                        'flex-1 px-2 py-1.5 text-xs rounded transition-all',
                        viewMode === 'all'
                          ? 'bg-gradient-to-r from-red-600 to-green-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      )}
                    >
                      <Layers className="h-3 w-3 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('to-be')}
                      className={cn(
                        'flex-1 px-2 py-1.5 text-xs rounded transition-all',
                        viewMode === 'to-be'
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      )}
                    >
                      To-Be
                    </button>
                  </div>
                  <p className="text-[9px] text-white/40 mt-1.5 text-center">
                    {viewMode === 'as-is' && '원래 배치 상태'}
                    {viewMode === 'all' && '변경 비교 (화살표 표시)'}
                    {viewMode === 'to-be' && '최적화 후 배치'}
                  </p>
                </div>

                {/* As-Is / To-Be 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleRevertToAsIs}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    As-Is 복원
                  </Button>
                  <Button
                    onClick={handleApplyToBe}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    To-Be 적용
                  </Button>
                </div>

                {/* 저장 버튼 */}
                <Button
                  onClick={handleSaveToBe}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                >
                  최적화 씬 저장
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 비교 요약 */}
      {sceneSimulation.state.comparison && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-xs font-medium text-white/60 mb-2">변경 요약</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">총 변경 수</span>
              <span className="text-white">{sceneSimulation.state.comparison.summary.totalChanges}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">예상 매출 증가</span>
              <span className="text-green-400">
                +{sceneSimulation.state.comparison.summary.expectedImpact?.revenue?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">예상 체류시간 증가</span>
              <span className="text-blue-400">
                +{sceneSimulation.state.comparison.summary.expectedImpact?.traffic?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIOptimizationTab;
