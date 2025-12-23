/**
 * AISimulationTab.tsx
 *
 * AI 시뮬레이션 탭 - 실시간 시뮬레이션 + 혼잡도/고객경로 분석 + 진단
 * - 실시간 고객 AI 에이전트 시뮬레이션
 * - 고객 경로 표시/상태 범례
 * - 혼잡도 AI 시뮬레이션
 * - 진단 결과 및 AI 최적화 연계
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Play, Pause, Square, RotateCcw, Users, Route, Activity,
  Thermometer, Monitor, Eye, Lightbulb, Lock, Loader2,
  TrendingUp, TrendingDown, Sparkles, Zap, Clock, DollarSign, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSimulationStore, STATE_COLORS, STATE_LABELS } from '@/stores/simulationStore';
import { useSimulationStore as useAISimulationStore } from '../stores/simulationStore';
import { buildStoreContext } from '../utils/store-context-builder';
import { DiagnosticIssueList, type DiagnosticIssue } from '../components/DiagnosticIssueList';
import type { SceneRecipe } from '../types';

type SimulationType =
  | 'realtime'
  | 'customerPath'
  | 'customerState'
  | 'congestion'
  | 'display'
  | 'gaze'
  | 'lighting';

interface SimulationOption {
  id: SimulationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  locked: boolean;
}

const simulationOptions: SimulationOption[] = [
  {
    id: 'realtime',
    label: '실시간 시뮬레이션',
    description: '고객 AI 에이전트가 실시간으로 이동합니다',
    icon: Play,
    locked: false,
  },
  {
    id: 'customerState',
    label: '고객 상태 범례',
    description: '고객 상태별 색상을 표시합니다',
    icon: Users,
    locked: false,
  },
  {
    id: 'congestion',
    label: '혼잡도 시뮬레이션',
    description: 'AI가 시간대별 혼잡도 히트맵을 생성합니다',
    icon: Thermometer,
    locked: false,
  },
  // 동선 분석(customerPath)는 오버레이_고객 시뮬레이션으로 통합됨
  {
    id: 'display',
    label: '디스플레이 효과',
    description: 'AI가 신상품 배치 효과를 시뮬레이션합니다',
    icon: Monitor,
    locked: true,
  },
  {
    id: 'gaze',
    label: '시선 흐름 분석',
    description: 'AI가 고객 시선 방향과 주목 지점을 분석합니다',
    icon: Eye,
    locked: true,
  },
  {
    id: 'lighting',
    label: '조명/환경 효과',
    description: 'AI가 조명 변화에 따른 행동 변화를 분석합니다',
    icon: Lightbulb,
    locked: true,
  },
];

interface SimulationZone {
  id: string;
  zone_name: string;
  zone_type: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

interface AISimulationTabProps {
  storeId: string;
  sceneData: SceneRecipe | null;
  onOverlayToggle: (overlayType: string, visible: boolean) => void;
  simulationZones: SimulationZone[];
  onResultsUpdate?: (type: 'congestion' | 'flow' | 'layout' | 'staffing', result: any) => void;
  onNavigateToOptimization?: (diagnosticIssues?: DiagnosticIssue[]) => void;
}

export function AISimulationTab({
  storeId,
  sceneData,
  onOverlayToggle,
  simulationZones,
  onResultsUpdate,
  onNavigateToOptimization,
}: AISimulationTabProps) {
  // 시뮬레이션 스토어
  const {
    isRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start,
    pause,
    resume,
    stop,
    reset,
    setSpeed,
  } = useSimulationStore();

  // 선택된 시뮬레이션 옵션
  const [selectedSimulations, setSelectedSimulations] = useState<SimulationType[]>(['realtime']);

  // AI 시뮬레이션 실행 상태
  const [isAIRunning, setIsAIRunning] = useState(false);
  const [aiResults, setAIResults] = useState<Record<string, any>>({});

  // 진단 결과 상태
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);

  // 시간 포맷팅 (초 → HH:MM:SS) - 음수는 0으로 처리
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.max(0, Math.abs(seconds));
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = Math.floor(absSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `₩${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 체크박스 토글
  const toggleSimulation = (type: SimulationType) => {
    const option = simulationOptions.find(o => o.id === type);
    if (option?.locked) return;

    setSelectedSimulations((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // 실시간 시뮬레이션 시작/정지
  const handleRealtimeControl = useCallback(() => {
    if (!isRunning) {
      start();
      toast.success('실시간 시뮬레이션이 시작되었습니다');
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isRunning, isPaused, start, resume, pause]);

  // AI 시뮬레이션 실행 (혼잡도, 동선 분석 등)
  const runAISimulations = useCallback(async () => {
    console.log('[AISimulationTab] runAISimulations clicked', {
      selectedSimulations,
      storeId,
      hasSceneData: !!sceneData,
    });

    const aiSimTypes = selectedSimulations.filter(t =>
      (t === 'congestion' || t === 'customerPath') &&
      !simulationOptions.find(o => o.id === t)?.locked
    );

    console.log('[AISimulationTab] AI simulation types to run:', aiSimTypes);

    if (aiSimTypes.length === 0) {
      toast.error('실행할 AI 시뮬레이션이 없습니다');
      return;
    }

    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    setIsAIRunning(true);
    const newResults: Record<string, any> = {};

    try {
      console.log('[AISimulationTab] Building store context...');
      const storeContext = await buildStoreContext(storeId);
      console.log('[AISimulationTab] Store context built:', {
        hasZones: storeContext.zones?.length,
        hasVisits: storeContext.visits?.length,
        hasHourlyMetrics: storeContext.hourlyMetrics?.length,
      });

      const promises = aiSimTypes.map(async (type) => {
        if (type === 'congestion') {
          console.log('[AISimulationTab] Invoking congestion_simulation Edge Function...');
          const { data, error } = await supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'congestion_simulation',
              storeId,
              params: {
                sceneData: sceneData ? {
                  furniture: sceneData.furniture,
                  products: sceneData.products,
                  space: sceneData.space,
                } : null,
                storeContext,
              },
            },
          });

          console.log('[AISimulationTab] congestion_simulation response:', { data, error });
          if (error) throw error;
          return { type, result: data.result };
        }
        if (type === 'customerPath') {
          console.log('[AISimulationTab] Invoking flow_simulation Edge Function...');
          const { data, error } = await supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'flow_simulation',
              storeId,
              params: {
                sceneData: sceneData ? {
                  furniture: sceneData.furniture,
                  products: sceneData.products,
                  space: sceneData.space,
                } : null,
                storeContext,
                duration: '1hour',
                customerCount: 100,
              },
            },
          });

          console.log('[AISimulationTab] flow_simulation response:', { data, error });
          if (error) throw error;
          return { type: 'flow', result: data.result };
        }
        return { type, result: null };
      });

      const settledResults = await Promise.allSettled(promises);
      console.log('[AISimulationTab] All simulation results:', settledResults);

      settledResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.result) {
          const { type, result: data } = result.value;
          newResults[type] = data;

          // 오버레이 활성화
          if (type === 'congestion') {
            onOverlayToggle('congestionHeatmap', true);
          }

          // 결과를 부모에게 전달하여 오른쪽 패널에 표시
          if (onResultsUpdate && data) {
            // 혼잡도 결과를 결과 패널 형식으로 변환
            if (type === 'congestion') {
              const congestionResult = {
                date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' }),
                peakHours: `${data.summary?.peakHour || 14}:00 - ${(data.summary?.peakHour || 14) + 2}:00`,
                peakCongestion: Math.round((data.summary?.peakDensity || 0.85) * 100),
                maxCapacity: data.summary?.maxCapacity || 50,
                hourlyData: data.hourlyPredictions?.map((h: any) => ({
                  hour: `${h.hour}:00`,
                  congestion: Math.round((h.predictedDensity || 0) * 100),
                })) || [],
                zoneData: data.zoneCongestion?.map((z: any) => ({
                  zone: z.zoneName || z.zone_name,
                  congestion: Math.round((z.congestionLevel || 0) * 100),
                })) || [],
                recommendations: data.recommendations || [],
              };
              onResultsUpdate('congestion', congestionResult);
            }
            // 동선 분석 결과를 결과 패널 형식으로 변환
            if (type === 'flow') {
              const flowResult = {
                currentPathLength: data.summary?.averagePathLength || 45,
                optimizedPathLength: Math.round((data.summary?.averagePathLength || 45) * 0.85),
                bottlenecks: data.bottlenecks?.map((b: any) => ({
                  location: b.location || b.zoneName,
                  congestion: Math.round((b.severity || b.congestionLevel || 0.7) * 100),
                  cause: b.cause || '통로 혼잡',
                  suggestion: b.suggestion || b.recommendation || '통로 확장 권장',
                })) || [],
                improvements: [
                  { metric: '평균 이동 시간', value: `-${Math.round((1 - (data.summary?.optimizedEfficiency || 0.85)) * 100)}%` },
                  { metric: '병목 해소율', value: `${Math.round((data.summary?.bottleneckReduction || 0.8) * 100)}%` },
                  { metric: '고객 만족도', value: `+${Math.round((data.summary?.satisfactionIncrease || 0.12) * 100)}%` },
                ],
              };
              onResultsUpdate('flow', flowResult);
              onOverlayToggle('flow', true);
            }
          }
        }
      });

      setAIResults((prev) => ({ ...prev, ...newResults }));

      // 진단 이슈 생성
      const issues: DiagnosticIssue[] = [];
      let issueId = 0;

      // 혼잡도 결과에서 이슈 추출
      if (newResults.congestion) {
        const congestionData = newResults.congestion;
        const zoneCongestion = congestionData.zoneCongestion || [];

        zoneCongestion.forEach((zone: any) => {
          const congestionLevel = zone.congestionLevel || 0;
          if (congestionLevel >= 0.8) {
            issues.push({
              id: `issue-${issueId++}`,
              severity: 'critical',
              zone: zone.zoneName || zone.zone_name || '알 수 없음',
              title: '심각한 병목현상',
              metric: `혼잡도 ${Math.round(congestionLevel * 100)}%`,
              impact: `매출 -${Math.round((congestionLevel - 0.5) * 30)}% 예상`,
              recommendation: '통로 확장 또는 가구 재배치 권장',
            });
          } else if (congestionLevel >= 0.6) {
            issues.push({
              id: `issue-${issueId++}`,
              severity: 'warning',
              zone: zone.zoneName || zone.zone_name || '알 수 없음',
              title: '혼잡 주의 구역',
              metric: `혼잡도 ${Math.round(congestionLevel * 100)}%`,
              impact: '',
              recommendation: '피크 시간대 모니터링 필요',
            });
          }
        });

        // 낮은 방문율 존 추가
        zoneCongestion.forEach((zone: any) => {
          const visitRate = zone.visitRate || zone.congestionLevel || 0;
          if (visitRate < 0.15 && zone.zone_type !== 'entrance' && zone.zone_type !== 'checkout') {
            issues.push({
              id: `issue-${issueId++}`,
              severity: 'info',
              zone: zone.zoneName || zone.zone_name || '알 수 없음',
              title: '저조한 방문율',
              metric: `방문율 ${Math.round(visitRate * 100)}%`,
              impact: '',
              recommendation: '시선 유도 디스플레이 추가 권장',
            });
          }
        });
      }

      // 동선 결과에서 이슈 추출
      if (newResults.flow) {
        const flowData = newResults.flow;
        const bottlenecks = flowData.bottlenecks || [];

        bottlenecks.forEach((bottleneck: any) => {
          const severity = bottleneck.severity || 0.7;
          issues.push({
            id: `issue-${issueId++}`,
            severity: severity >= 0.8 ? 'critical' : 'warning',
            zone: bottleneck.location || bottleneck.zoneName || '알 수 없음',
            title: '동선 병목 지점',
            metric: `혼잡도 ${Math.round(severity * 100)}%`,
            impact: bottleneck.cause || '고객 흐름 저하',
            recommendation: bottleneck.suggestion || bottleneck.recommendation || '경로 재설계 권장',
          });
        });
      }

      setDiagnosticIssues(issues);
      toast.success('AI 시뮬레이션이 완료되었습니다');
    } catch (error) {
      console.error('AI Simulation error:', error);
      toast.error('AI 시뮬레이션 실행에 실패했습니다');
    } finally {
      setIsAIRunning(false);
    }
  }, [selectedSimulations, storeId, sceneData, onOverlayToggle, onResultsUpdate]);

  const hasAISimSelected = selectedSimulations.includes('congestion') || selectedSimulations.includes('customerPath');

  return (
    <div className="p-4 space-y-4">
      {/* ========== 실시간 시뮬레이션 컨트롤 ========== */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-400" />
          실시간 컨트롤
        </div>

        {/* 시간 표시 */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-2xl font-mono text-white tracking-wider">
            {formatTime(simulationTime)}
          </div>
          <div className="text-xs text-white/40 mt-1">시뮬레이션 경과 시간</div>
        </div>

        {/* 재생/일시정지/정지 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={handleRealtimeControl}
            size="sm"
            className={cn(
              'flex-1',
              isRunning && !isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
            )}
          >
            {!isRunning ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                시작
              </>
            ) : isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                재개
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                일시정지
              </>
            )}
          </Button>
          <Button
            onClick={stop}
            disabled={!isRunning}
            size="sm"
            variant="destructive"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            onClick={reset}
            size="sm"
            variant="outline"
            className="border-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* 속도 조절 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/50">
            <span>재생 속도</span>
            <span className="text-blue-400">{config.speed}x</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 4, 10].map((speed) => (
              <Button
                key={speed}
                onClick={() => setSpeed(speed)}
                size="sm"
                variant={config.speed === speed ? 'default' : 'outline'}
                className={cn(
                  'flex-1 text-xs h-7',
                  config.speed === speed ? 'bg-blue-600' : 'border-white/20 text-white/60'
                )}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>

        {/* 실시간 KPI (개선된 버전 - 트렌드 표시) */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="h-3 w-3" />
                  현재 고객
                </div>
                {kpi.currentCustomers > 10 && (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                )}
              </div>
              <div className="text-lg font-bold text-white">
                {kpi.currentCustomers}
                <span className="text-xs text-white/40 font-normal ml-1">
                  / {kpi.totalVisitors}
                </span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">매출</div>
                {kpi.totalRevenue > 0 && (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                )}
              </div>
              <div className="text-lg font-bold text-green-400">
                {formatCurrency(kpi.totalRevenue)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">전환</div>
                {kpi.conversions > 0 && (
                  <span className="text-[10px] text-green-400">+{kpi.conversions}</span>
                )}
              </div>
              <div className="text-lg font-bold text-blue-400">
                {kpi.conversionRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">평균 체류</div>
              </div>
              <div className="text-lg font-bold text-purple-400">
                {kpi.avgDwellTime.toFixed(1)}분
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== AI 예측 시뮬레이션 (새 Edge Function) ========== */}
      <AISimulationSection
        storeId={storeId}
        onNavigateToOptimization={onNavigateToOptimization}
      />

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 진단 결과 섹션 ========== */}
      {diagnosticIssues.length > 0 && (
        <>
          <DiagnosticIssueList
            issues={diagnosticIssues}
            onNavigateToOptimization={onNavigateToOptimization ? (issues) => {
              onNavigateToOptimization(issues);
              toast.info('AI 최적화 탭으로 이동합니다');
            } : undefined}
          />
          <div className="border-t border-white/10" />
        </>
      )}

      {/* ========== 시뮬레이션 옵션 ========== */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-white/80">시뮬레이션 옵션</div>

        <div className="space-y-2">
          {simulationOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedSimulations.includes(option.id);
            const isLocked = option.locked;

            return (
              <label
                key={option.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-all',
                  'border border-transparent',
                  isLocked
                    ? 'bg-white/[0.02] cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'bg-green-500/20 border-green-500/50 cursor-pointer'
                      : 'bg-white/5 hover:bg-white/10 cursor-pointer'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSimulation(option.id)}
                  disabled={isLocked}
                  className="mt-1 w-4 h-4 rounded border-white/40 text-green-600 focus:ring-green-500 bg-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      'h-4 w-4',
                      isLocked ? 'text-white/30' : isSelected ? 'text-green-400' : 'text-white/50'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      isLocked ? 'text-white/30' : isSelected ? 'text-white' : 'text-white/70'
                    )}>
                      {option.label}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-white/10 text-white/40 rounded">
                        <Lock className="h-3 w-3" />
                        P2
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* AI 시뮬레이션 실행 버튼 */}
        <Button
          onClick={runAISimulations}
          disabled={isAIRunning || !hasAISimSelected}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
        >
          {isAIRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI 분석 중...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              AI 시뮬레이션 실행
            </>
          )}
        </Button>
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 고객 상태 범례 ========== */}
      {selectedSimulations.includes('customerState') && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80">고객 상태 범례</div>
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(STATE_LABELS).map(([state, label]) => (
              <div key={state} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATE_COLORS[state as keyof typeof STATE_COLORS] }}
                />
                <span className="text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== AI 시뮬레이션 결과 ========== */}
      {aiResults.congestion && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80">혼잡도 분석 결과</div>
          <div className="p-3 bg-white/5 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-white/50">피크 시간</span>
              <span className="text-white">{aiResults.congestion.summary?.peakHour || 14}:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">최대 혼잡도</span>
              <span className="text-red-400">
                {Math.round((aiResults.congestion.summary?.peakDensity || 0.85) * 100)}%
              </span>
            </div>
            {aiResults.congestion.recommendations && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs text-white/50 mb-1">AI 권장사항</div>
                <ul className="text-xs text-white/70 space-y-1">
                  {aiResults.congestion.recommendations.slice(0, 2).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-yellow-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== AI 예측 시뮬레이션 섹션 (새 Edge Function 사용) =====
interface AISimulationSectionProps {
  storeId: string;
  onNavigateToOptimization?: (issues?: DiagnosticIssue[]) => void;
}

function AISimulationSection({ storeId, onNavigateToOptimization }: AISimulationSectionProps) {
  const {
    isLoading,
    progress,
    error,
    options,
    result,
    diagnosticIssues: aiDiagnosticIssues,
    realtimeKpis,
    setOptions,
    runSimulation,
    reset: resetAISimulation,
    getIssuesForOptimization,
  } = useAISimulationStore();

  // 시뮬레이션 실행
  const handleRunAISimulation = async () => {
    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    try {
      toast.loading('AI 예측 시뮬레이션 실행 중...', { id: 'ai-sim' });
      await runSimulation(storeId);
      toast.success('AI 시뮬레이션 완료!', { id: 'ai-sim' });
    } catch (err: any) {
      toast.error(`시뮬레이션 실패: ${err.message}`, { id: 'ai-sim' });
    }
  };

  // 최적화 탭으로 이동
  const handleNavigateToOptimization = () => {
    const issues = getIssuesForOptimization();
    if (onNavigateToOptimization) {
      onNavigateToOptimization(issues);
      toast.info(`${issues.length}개 이슈를 AI 최적화로 전달합니다`);
    }
  };

  const criticalCount = aiDiagnosticIssues.filter(i => i.severity === 'critical').length;
  const warningCount = aiDiagnosticIssues.filter(i => i.severity === 'warning').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          AI 예측 시뮬레이션
        </div>
        {result && (
          <span className="text-xs text-white/40">
            신뢰도: {result.confidence_score}%
          </span>
        )}
      </div>

      {/* 시뮬레이션 파라미터 */}
      <div className="space-y-3 p-3 bg-white/5 rounded-lg">
        {/* 시간대 선택 */}
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">시간대</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: 'morning', label: '오전', icon: '🌅' },
              { value: 'afternoon', label: '오후', icon: '☀️' },
              { value: 'evening', label: '저녁', icon: '🌆' },
              { value: 'peak', label: '피크', icon: '🔥' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setOptions({ time_of_day: value as any })}
                className={cn(
                  'px-2 py-1.5 rounded text-xs transition-all',
                  options.time_of_day === value
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                )}
              >
                <span className="mr-1">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 예상 고객 수 */}
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">
            예상 고객 수: {options.customer_count}명
          </label>
          <Slider
            value={[options.customer_count]}
            onValueChange={([v]) => setOptions({ customer_count: v })}
            min={20}
            max={200}
            step={10}
            className="w-full"
          />
        </div>

        {/* 시뮬레이션 시간 */}
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">
            시뮬레이션 시간: {options.duration_minutes}분
          </label>
          <Slider
            value={[options.duration_minutes]}
            onValueChange={([v]) => setOptions({ duration_minutes: v })}
            min={15}
            max={180}
            step={15}
            className="w-full"
          />
        </div>
      </div>

      {/* 로딩 프로그레스 */}
      {isLoading && (
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 실행 버튼 */}
      <Button
        onClick={handleRunAISimulation}
        disabled={isLoading || !storeId}
        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI 분석 중... {progress}%
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            AI 예측 시뮬레이션 실행
          </>
        )}
      </Button>

      {/* 에러 표시 */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="space-y-3">
          {/* KPI 요약 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                <Users className="h-3 w-3" />
                예상 방문객
              </div>
              <div className="text-lg font-bold text-white">
                {realtimeKpis.visitors.toLocaleString()}
                <span className="text-xs text-white/40 font-normal ml-0.5">명</span>
              </div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                <TrendingUp className="h-3 w-3" />
                전환율
              </div>
              <div className="text-lg font-bold text-blue-400">
                {(realtimeKpis.conversion * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                <Clock className="h-3 w-3" />
                평균 체류
              </div>
              <div className="text-lg font-bold text-purple-400">
                {Math.round(realtimeKpis.avgDwell / 60)}분
              </div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                <DollarSign className="h-3 w-3" />
                예상 매출
              </div>
              <div className="text-lg font-bold text-green-400">
                ₩{(realtimeKpis.revenue / 10000).toFixed(0)}만
              </div>
            </div>
          </div>

          {/* 진단 이슈 요약 */}
          {aiDiagnosticIssues.length > 0 && (
            <div className="p-3 bg-white/5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <AlertTriangle className="h-4 w-4" />
                  발견된 이슈
                </div>
                <div className="flex gap-1">
                  {criticalCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {criticalCount}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                      {warningCount}
                    </span>
                  )}
                </div>
              </div>

              {/* 이슈 목록 (최대 3개) */}
              <div className="space-y-1.5">
                {aiDiagnosticIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-2 rounded text-xs',
                      issue.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-blue-500/20 text-blue-300'
                    )}
                  >
                    <div className="font-medium">{issue.title}</div>
                    <div className="text-white/50 mt-0.5">{issue.zone_name}</div>
                  </div>
                ))}
                {aiDiagnosticIssues.length > 3 && (
                  <div className="text-xs text-white/40 text-center">
                    +{aiDiagnosticIssues.length - 3}개 더
                  </div>
                )}
              </div>

              {/* AI 최적화로 이동 버튼 */}
              {(criticalCount > 0 || warningCount > 0) && onNavigateToOptimization && (
                <Button
                  onClick={handleNavigateToOptimization}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
                  size="sm"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  AI 최적화로 해결하기 ({criticalCount + warningCount}개 이슈)
                </Button>
              )}
            </div>
          )}

          {/* AI 인사이트 */}
          {result.ai_insights && result.ai_insights.length > 0 && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-sm text-white/80 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                AI 인사이트
              </div>
              <ul className="space-y-1.5">
                {result.ai_insights.slice(0, 3).map((insight, idx) => (
                  <li key={idx} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 초기화 버튼 */}
          <Button
            onClick={resetAISimulation}
            variant="outline"
            size="sm"
            className="w-full border-white/20 text-white/60 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            결과 초기화
          </Button>
        </div>
      )}
    </div>
  );
}

export default AISimulationTab;
