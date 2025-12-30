/**
 * AISimulationTab.tsx
 *
 * AI 시뮬레이션 탭 - 통합 시뮬레이션 컨트롤
 * - 실시간/AI 예측 시뮬레이션 타입 선택
 * - 하나의 통합 실행 버튼
 * - 시뮬레이션 옵션 설정
 */

import { useState, useCallback, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Users, Activity, Thermometer, Monitor, Eye, Lightbulb, Lock, Loader2, TrendingUp, Clock, DollarSign, AlertTriangle, Zap, Sparkles, Sun, ChevronDown, ChevronUp, Cloud, CloudRain, CloudSnow, Calendar, Settings } from 'lucide-react';
import { useEnvironmentContext } from '../hooks/useEnvironmentContext';
import { SimulationEnvironmentSettings } from '../components/SimulationEnvironmentSettings';
import type { SimulationEnvironmentConfig } from '../types/simulationEnvironment.types';
import { createDefaultSimulationConfig, calculateSimulationImpacts } from '../types/simulationEnvironment.types';
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

// 시뮬레이션 타입
type SimulationType = 'realtime' | 'prediction';
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
  /** 환경 설정 변경 시 콜백 */
  onEnvironmentConfigChange?: (config: SimulationEnvironmentConfig) => void;
}
export function AISimulationTab({
  storeId,
  sceneData,
  onOverlayToggle,
  simulationZones,
  onResultsUpdate,
  onNavigateToOptimization,
  onEnvironmentConfigChange
}: AISimulationTabProps) {
  // 실시간 시뮬레이션 스토어
  const {
    isRunning: isRealtimeRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start: startRealtime,
    pause,
    resume,
    stop: stopRealtime,
    reset: resetRealtime,
    setSpeed
  } = useSimulationStore();

  // AI 예측 시뮬레이션 스토어
  const {
    isLoading: isAIPredictionLoading,
    progress: aiProgress,
    error: aiError,
    result: aiResult,
    diagnosticIssues: aiDiagnosticIssues,
    realtimeKpis,
    options: aiOptions,
    setOptions: setAIOptions,
    runSimulation: runAIPrediction,
    reset: resetAIPrediction,
    getIssuesForOptimization
  } = useAISimulationStore();

  // 🆕 환경 컨텍스트 (날씨, 공휴일, 이벤트)
  const {
    context: envContext,
    impact: envImpact,
    aiContext: envAiContext,
    isLoading: isEnvLoading,
    currentTime
  } = useEnvironmentContext({
    storeId,
    enabled: !!storeId,
    autoRefresh: true
  });

  // ===== 통합 시뮬레이션 상태 =====
  const [simulationType, setSimulationType] = useState<SimulationType>('realtime');
  const [customerCount, setCustomerCount] = useState(100);
  const [duration, setDuration] = useState(60);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // 🆕 시뮬레이션 환경 설정 상태
  const [showEnvironmentSettings, setShowEnvironmentSettings] = useState(true); // 기본 열림
  const [simulationEnvConfig, setSimulationEnvConfig] = useState<SimulationEnvironmentConfig>(() => {
    const config = createDefaultSimulationConfig();
    config.calculatedImpact = calculateSimulationImpacts(config);
    return config;
  });

  // 🔧 FIX: 환경 설정 변경 시 부모에게 알림 (디버그 로그 추가)
  useEffect(() => {
    console.log('[AISimulationTab] Environment config useEffect triggered:', {
      hasCallback: !!onEnvironmentConfigChange,
      mode: simulationEnvConfig.mode,
      weather: simulationEnvConfig.manualSettings?.weather
    });
    if (onEnvironmentConfigChange) {
      onEnvironmentConfigChange(simulationEnvConfig);
    }
  }, [simulationEnvConfig, onEnvironmentConfigChange]);

  // 시각화 옵션
  const [showCustomerLabels, setShowCustomerLabels] = useState(false);
  const [showCongestionHeatmap, setShowCongestionHeatmap] = useState(false);

  // 진단 결과
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);

  // 현재 실행 중 여부 통합 체크
  const isAnyRunning = isRealtimeRunning || isAIPredictionLoading;

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.max(0, Math.abs(seconds));
    const m = Math.floor(absSeconds / 60);
    const s = Math.floor(absSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `₩${(amount / 1000000).toFixed(1)}M`;
    }
    return `₩${(amount / 10000).toFixed(0)}만`;
  };

  // ===== 🔧 통합 시뮬레이션 실행 =====
  const handleRunSimulation = useCallback(async () => {
    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }
    if (simulationType === 'realtime') {
      // 실시간 시뮬레이션 시작
      onOverlayToggle('avatar', true);
      if (showCongestionHeatmap) {
        onOverlayToggle('heatmap', true);
      }
      startRealtime();
      toast.success('실시간 시뮬레이션이 시작되었습니다');
    } else {
      // AI 예측 시뮬레이션 실행
      try {
        // 🆕 환경 설정에 따른 옵션 구성
        const envConfigForAI = simulationEnvConfig.mode === 'simulation' ? {
          weather: simulationEnvConfig.weather,
          temperature: simulationEnvConfig.temperature,
          humidity: simulationEnvConfig.humidity,
          holiday_type: simulationEnvConfig.holidayType,
          day_of_week: simulationEnvConfig.dayOfWeek,
          time_of_day: simulationEnvConfig.timeOfDay,
          impact: simulationEnvConfig.calculatedImpact
        } : envAiContext; // 실시간 모드면 실제 환경 데이터 사용

        // 옵션 설정 - 시간대는 환경 설정에서 가져옴
        const timeOfDayFromConfig = simulationEnvConfig.mode === 'manual' ? simulationEnvConfig.manualSettings?.timeOfDay : simulationEnvConfig.timeOfDay || 'afternoon';
        setAIOptions({
          customer_count: customerCount,
          duration_minutes: duration,
          time_of_day: timeOfDayFromConfig,
          environment_context: envConfigForAI // 환경 컨텍스트 추가
        });
        toast.loading('AI 예측 시뮬레이션 실행 중...', {
          id: 'ai-sim'
        });
        await runAIPrediction(storeId);
        toast.success('AI 시뮬레이션 완료!', {
          id: 'ai-sim'
        });

        // 혼잡도 히트맵 표시 (옵션에 따라)
        if (showCongestionHeatmap) {
          onOverlayToggle('congestionHeatmap', true);
        }
      } catch (err: any) {
        toast.error(`시뮬레이션 실패: ${err.message}`, {
          id: 'ai-sim'
        });
      }
    }
  }, [storeId, simulationType, customerCount, duration, showCongestionHeatmap, startRealtime, runAIPrediction, setAIOptions, onOverlayToggle, simulationEnvConfig, envAiContext]);

  // 시뮬레이션 중지
  const handleStopSimulation = useCallback(() => {
    if (simulationType === 'realtime') {
      stopRealtime();
      onOverlayToggle('avatar', false);
    }
    resetAIPrediction();
    setDiagnosticIssues([]);
  }, [simulationType, stopRealtime, resetAIPrediction, onOverlayToggle]);

  // 일시정지/재개 토글
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, resume, pause]);

  // 최적화 탭으로 이동
  const handleNavigateToOptimization = useCallback(() => {
    const issues = getIssuesForOptimization();
    if (onNavigateToOptimization) {
      onNavigateToOptimization(issues);
      toast.info(`${issues.length}개 이슈를 AI 최적화로 전달합니다`);
    }
  }, [getIssuesForOptimization, onNavigateToOptimization]);
  const criticalCount = aiDiagnosticIssues.filter(i => i.severity === 'critical').length;
  const warningCount = aiDiagnosticIssues.filter(i => i.severity === 'warning').length;
  return <div className="flex flex-col h-full overflow-hidden">
      {/* ===== 헤더 ===== */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          AI 시뮬레이션
        </h3>
        <p className="text-xs text-white/50 mt-1">
          매장 고객 흐름을 시뮬레이션하고 AI 예측 분석을 실행합니다.
        </p>
      </div>

      {/* ===== 설정 영역 ===== */}
      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* 시뮬레이션 타입 선택 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white">시뮬레이션 타입</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSimulationType('realtime')} disabled={isAnyRunning} className={cn("p-3 rounded-lg border text-left transition", simulationType === 'realtime' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70", isAnyRunning && "opacity-50 cursor-not-allowed")}>
              <div className="flex items-center gap-2 font-medium text-sm">
                <Play className="w-4 h-4" />
                실시간
              </div>
              <p className="text-xs text-white/40 mt-1">
                3D 고객 아바타 애니메이션
              </p>
            </button>

            <button onClick={() => setSimulationType('prediction')} disabled={isAnyRunning} className={cn("p-3 rounded-lg border text-left transition", simulationType === 'prediction' ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70", isAnyRunning && "opacity-50 cursor-not-allowed")}>
              <div className="flex items-center gap-2 font-medium text-sm">
                <Zap className="w-4 h-4" />
                AI 예측
              </div>
              <p className="text-xs text-white/40 mt-1">
                AI 기반 분석 및 인사이트
              </p>
            </button>
          </div>
        </div>

        {/* 🆕 환경 상태 표시 */}
        {envContext && <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1 text-white">
                <Cloud className="w-3 h-3" />
                현재 환경
              </span>
              {!isEnvLoading && envImpact && <span className={cn("text-xs px-1.5 py-0.5 rounded", envImpact.trafficMultiplier > 1.1 ? "bg-green-500/20 text-green-400" : envImpact.trafficMultiplier < 0.9 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/60")}>
                  트래픽 {(envImpact.trafficMultiplier * 100).toFixed(0)}%
                </span>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* 날씨 */}
              <div className="flex items-center gap-1.5">
                {envContext.weather?.condition === 'rain' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                {envContext.weather?.condition === 'snow' && <CloudSnow className="w-3.5 h-3.5 text-blue-200" />}
                {envContext.weather?.condition === 'clear' && <Sun className="w-3.5 h-3.5 text-yellow-400" />}
                {envContext.weather?.condition === 'clouds' && <Cloud className="w-3.5 h-3.5 text-gray-400" />}
                {!envContext.weather && <Cloud className="w-3.5 h-3.5 text-white/30" />}
                <span className="text-xs text-white">
                  {envContext.weather ? `${Math.round(envContext.weather.temperature)}°C` : '-'}
                </span>
              </div>

              {/* 공휴일 */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs truncate text-white">
                  {envContext.holiday ? envContext.holiday.name : currentTime.isWeekend ? '주말' : '평일'}
                </span>
              </div>

              {/* 이벤트 */}
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-white">
                  {envContext.activeEvents.length > 0 ? `${envContext.activeEvents.length}개 이벤트` : '없음'}
                </span>
              </div>
            </div>

            {/* 영향도 요약 */}
            {envImpact && <div className="text-[10px] text-white/40 pt-1 border-t border-white/10">
                {envImpact.summary}
              </div>}
          </div>}

        {/* 🆕 환경 설정 패널 (접기/펼치기) */}
        <div className="border border-white/10 rounded-lg">
          <button onClick={() => setShowEnvironmentSettings(!showEnvironmentSettings)} className="w-full flex items-center justify-between p-3 text-sm text-white/80">
            <span className="font-medium flex items-center gap-2 text-inherit">
              <Settings className="w-4 h-4" />
              환경 설정 (시뮬레이션)
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs px-1.5 py-0.5 rounded", simulationEnvConfig.mode === 'realtime' ? "bg-blue-500/20 text-blue-400" : simulationEnvConfig.mode === 'dateSelect' ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400")}>
                {simulationEnvConfig.mode === 'realtime' ? '실시간' : simulationEnvConfig.mode === 'dateSelect' ? '날짜선택' : '직접설정'}
              </span>
              {showEnvironmentSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showEnvironmentSettings && <div className="p-3 pt-0 border-t border-white/10">
              <SimulationEnvironmentSettings config={simulationEnvConfig} onChange={config => {
            console.log('[AISimulationTab] SimulationEnvironmentSettings onChange:', config.mode);
            setSimulationEnvConfig(config);
          }} storeId={storeId} compact={true} />
            </div>}
        </div>

        {/* 예상 고객 수 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">예상 고객 수</label>
            <span className="text-sm font-bold text-white">{customerCount}명</span>
          </div>
          <Slider value={[customerCount]} onValueChange={([v]) => setCustomerCount(v)} min={10} max={300} step={10} disabled={isAnyRunning} className="w-full" />
          <div className="flex justify-between text-xs text-white/40">
            <span>10명</span>
            <span>300명</span>
          </div>
        </div>

        {/* 시뮬레이션 시간 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">시뮬레이션 시간</label>
            <span className="text-sm font-bold text-white">{duration}분</span>
          </div>
          <Slider value={[duration]} onValueChange={([v]) => setDuration(v)} min={15} max={180} step={15} disabled={isAnyRunning} className="w-full" />
          <div className="flex justify-between text-xs text-white/40">
            <span>15분</span>
            <span>180분</span>
          </div>
        </div>

        {/* 고급 옵션 (접기/펼치기) */}
        <div className="border border-white/10 rounded-lg">
          <button onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="w-full flex items-center justify-between p-3 text-sm text-white/80">
            <span className="font-medium">시각화 옵션</span>
            {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedOptions && <div className="p-3 pt-0 space-y-3 border-t border-white/10">
              {/* 고객 상태 범례 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showCustomerLabels} onChange={e => setShowCustomerLabels(e.target.checked)} disabled={isAnyRunning} className="w-4 h-4 rounded bg-white/10" />
                <div>
                  <div className="text-sm text-white/80">고객 상태 범례</div>
                  <div className="text-xs text-white/40">
                    고객 상태별 색상을 표시합니다
                  </div>
                </div>
              </label>

              {/* 혼잡도 히트맵 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showCongestionHeatmap} onChange={e => setShowCongestionHeatmap(e.target.checked)} disabled={isAnyRunning} className="w-4 h-4 rounded bg-white/10" />
                <div>
                  <div className="text-sm text-white/80">혼잡도 시뮬레이션</div>
                  <div className="text-xs text-white/40">
                    AI가 시간대별 혼잡도 히트맵을 생성합니다
                  </div>
                </div>
              </label>

              {/* 고객 상태 범례 표시 */}
              {showCustomerLabels && <div className="pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-2">상태 범례</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(STATE_LABELS).map(([state, label]) => <div key={state} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: STATE_COLORS[state as keyof typeof STATE_COLORS]
                }} />
                        <span className="text-[10px] text-white/50">{label}</span>
                      </div>)}
                  </div>
                </div>}
            </div>}
        </div>

        {/* AI 예측 로딩 프로그레스 */}
        {isAIPredictionLoading && <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300" style={{
          width: `${aiProgress}%`
        }} />
          </div>}

        {/* 에러 표시 */}
        {aiError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {aiError}
            </div>
          </div>}

        {/* 실시간 시뮬레이션 KPI (실행 중일 때) */}
        {isRealtimeRunning && simulationType === 'realtime' && <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">경과 시간</span>
              <span className="text-lg font-mono text-white">{formatTime(simulationTime)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="h-3 w-3" />
                  현재 고객
                </div>
                <div className="text-lg font-bold text-white">{kpi.currentCustomers}</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">매출</div>
                <div className="text-lg font-bold text-green-400">{formatCurrency(kpi.totalRevenue)}</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">전환율</div>
                <div className="text-lg font-bold text-blue-400">{kpi.conversionRate.toFixed(1)}%</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">평균 체류</div>
                <div className="text-lg font-bold text-purple-400">{kpi.avgDwellTime.toFixed(0)}분</div>
              </div>
            </div>

            {/* 속도 조절 */}
            <div className="flex gap-1">
              {[1, 2, 4, 10].map(speed => <Button key={speed} onClick={() => setSpeed(speed)} size="sm" variant={config.speed === speed ? 'default' : 'outline'} className={cn('flex-1 text-xs h-7', config.speed === speed ? 'bg-blue-600' : 'border-white/20 text-white/60')}>
                  {speed}x
                </Button>)}
            </div>
          </div>}

        {/* AI 예측 결과 표시 */}
        {aiResult && simulationType === 'prediction' && <div className="space-y-3">
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
                  {formatCurrency(realtimeKpis.revenue)}
                </div>
              </div>
            </div>

            {/* 진단 이슈 요약 */}
            {aiDiagnosticIssues.length > 0 && <div className="p-3 bg-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <AlertTriangle className="h-4 w-4" />
                    발견된 이슈
                  </div>
                  <div className="flex gap-1">
                    {criticalCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {criticalCount}
                      </span>}
                    {warningCount > 0 && <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                        {warningCount}
                      </span>}
                  </div>
                </div>

                {/* 이슈 목록 (최대 3개) */}
                <div className="space-y-1.5">
                  {aiDiagnosticIssues.slice(0, 3).map(issue => <div key={issue.id} className={cn('p-2 rounded text-xs', issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' : issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300')}>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-white/50 mt-0.5">{issue.zone_name}</div>
                    </div>)}
                  {aiDiagnosticIssues.length > 3 && <div className="text-xs text-white/40 text-center">
                      +{aiDiagnosticIssues.length - 3}개 더
                    </div>}
                </div>

                {/* AI 최적화로 이동 버튼 */}
                {(criticalCount > 0 || warningCount > 0) && onNavigateToOptimization && <Button onClick={handleNavigateToOptimization} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm" size="sm">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    AI 최적화로 해결하기 ({criticalCount + warningCount}개 이슈)
                  </Button>}
              </div>}

            {/* AI 인사이트 */}
            {aiResult.ai_insights && aiResult.ai_insights.length > 0 && <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-white/80 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  AI 인사이트
                </div>
                <ul className="space-y-1.5">
                  {aiResult.ai_insights.slice(0, 3).map((insight, idx) => <li key={idx} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      {insight}
                    </li>)}
                </ul>
              </div>}
          </div>}
      </div>

      {/* ===== 🔧 통합 실행 버튼 영역 ===== */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {!isAnyRunning ? <Button onClick={handleRunSimulation} disabled={!storeId} className={cn("w-full py-3 font-medium text-white transition flex items-center justify-center gap-2", simulationType === 'realtime' ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700")}>
            {simulationType === 'realtime' ? <>
                <Play className="w-4 h-4" />
                실시간 시뮬레이션 시작
              </> : <>
                <Zap className="w-4 h-4" />
                AI 예측 시뮬레이션 실행
              </>}
          </Button> : <div className="flex gap-2">
            {/* 일시정지/재개 (실시간만) */}
            {simulationType === 'realtime' && isRealtimeRunning && <Button onClick={handleTogglePause} className="flex-1 py-3 font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition flex items-center justify-center gap-2">
                {isPaused ? <>
                    <Play className="w-4 h-4" />
                    재개
                  </> : <>
                    <Pause className="w-4 h-4" />
                    일시정지
                  </>}
              </Button>}

            {/* 중지 */}
            <Button onClick={handleStopSimulation} className={cn("py-3 font-medium bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2", simulationType === 'realtime' && isRealtimeRunning ? "flex-1" : "w-full")}>
              <Square className="w-4 h-4" />
              중지
            </Button>
          </div>}

        {/* 실시간 시뮬레이션 상태 표시 */}
        {isRealtimeRunning && simulationType === 'realtime' && <div className="text-center text-xs text-white/50">
            <Clock className="w-3 h-3 inline mr-1" />
            경과 시간: {formatTime(simulationTime)}
            {' | '}
            <Users className="w-3 h-3 inline mx-1" />
            활동중: {kpi.currentCustomers}명
          </div>}

        {/* AI 예측 로딩 상태 */}
        {isAIPredictionLoading && <div className="text-center text-xs text-white/50">
            <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
            AI 분석 중... {aiProgress}%
          </div>}
      </div>
    </div>;
}
export default AISimulationTab;