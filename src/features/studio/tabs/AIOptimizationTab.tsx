/**
 * AIOptimizationTab.tsx
 *
 * AI 최적화 탭 - 레이아웃/동선/인력배치 최적화
 * - 다중 선택 가능
 * - As-Is / To-Be 결과 비교
 * - 3D 씬에 결과 자동 반영
 */

import { useState, useCallback } from 'react';
import { Sparkles, Layout, Route, Users, Loader2, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { buildStoreContext } from '../utils/store-context-builder';
import { OptimizationResultPanel } from '../panels/OptimizationResultPanel';
import { useScene } from '../core/SceneProvider';
import type { UseSceneSimulationReturn } from '../hooks/useSceneSimulation';
import type { SceneRecipe } from '../types';

type OptimizationType = 'layout' | 'flow' | 'staffing';

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
    id: 'flow',
    label: '동선 최적화',
    description: 'AI가 최적의 고객 동선을 제안합니다',
    icon: Route,
  },
  {
    id: 'staffing',
    label: '인력 배치 최적화',
    description: 'AI가 최적의 직원 배치를 제안합니다',
    icon: Users,
  },
];

interface AIOptimizationTabProps {
  storeId: string;
  sceneData: SceneRecipe | null;
  sceneSimulation: UseSceneSimulationReturn;
  onSceneUpdate?: (newScene: any) => void;
  onOverlayToggle: (overlayType: string, visible: boolean) => void;
}

export function AIOptimizationTab({
  storeId,
  sceneData,
  sceneSimulation,
  onSceneUpdate,
  onOverlayToggle,
}: AIOptimizationTabProps) {
  // SceneProvider에서 applySimulationResults 가져오기
  const { applySimulationResults } = useScene();

  // 선택된 최적화 유형들
  const [selectedOptimizations, setSelectedOptimizations] = useState<OptimizationType[]>(['layout']);

  // 실행 상태
  const [runningTypes, setRunningTypes] = useState<OptimizationType[]>([]);

  // 결과 패널 펼침/접힘
  const [isResultExpanded, setIsResultExpanded] = useState(true);

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
      const storeContext = await buildStoreContext(storeId);

      // 선택된 최적화만 실행하도록 파라미터 구성
      const params: Record<string, Record<string, any>> = {};

      if (selectedOptimizations.includes('layout')) {
        params.layout = {
          goal: 'revenue',
          storeContext,
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
        params.staffing = {
          staffCount: 3,
          goal: 'customer_service',
          storeContext,
        };
      }

      // useSceneSimulation의 runAllSimulations 호출
      await sceneSimulation.runAllSimulations(params, sceneData);

      // 결과 적용
      const results = sceneSimulation.state.results;

      // 레이아웃 결과가 있으면 오버레이 활성화
      if (results.layout) {
        onOverlayToggle('layoutOptimization', true);
      }

      // 동선 결과가 있으면 오버레이 활성화
      if (results.flow) {
        onOverlayToggle('flowOptimization', true);
      }

      // 인력배치 결과가 있으면 오버레이 활성화
      if (results.staffing) {
        onOverlayToggle('staffingOptimization', true);
      }

      toast.success(`${selectedOptimizations.length}개 최적화가 완료되었습니다`);
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('최적화 실행 중 오류가 발생했습니다');
    } finally {
      setRunningTypes([]);
    }
  }, [selectedOptimizations, storeId, sceneData, sceneSimulation, onOverlayToggle]);

  // As-Is 씬으로 복원
  const handleRevertToAsIs = useCallback(() => {
    sceneSimulation.clearScenes();
    onOverlayToggle('layoutOptimization', false);
    onOverlayToggle('flowOptimization', false);
    onOverlayToggle('staffingOptimization', false);
    toast.info('원래 씬으로 복원되었습니다');
  }, [sceneSimulation, onOverlayToggle]);

  // To-Be 씬 적용 - 3D 모델 위치 실제 변경
  const handleApplyToBe = useCallback(async () => {
    try {
      const results = sceneSimulation.state.results;

      // 레이아웃 최적화 결과가 있으면 가구 이동 적용
      if (results.layout?.furnitureMoves && results.layout.furnitureMoves.length > 0) {
        applySimulationResults({
          furnitureMoves: results.layout.furnitureMoves,
        });
      }

      // 내부 상태도 업데이트
      await sceneSimulation.applyAllChanges();

      toast.success('최적화된 레이아웃이 3D 씬에 적용되었습니다');
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
