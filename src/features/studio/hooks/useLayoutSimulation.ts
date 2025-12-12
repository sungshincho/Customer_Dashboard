/**
 * useLayoutSimulation.ts
 *
 * 레이아웃 최적화 시뮬레이션 훅
 * - AI 기반 가구/존 배치 최적화
 * - advanced-ai-inference Edge Function 연동
 * - 3D 시각화용 데이터 제공
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/components/ui/use-toast';
import type {
  LayoutOptimizationResult,
  FurnitureMove,
  ZoneChange,
  SimulationStatus,
  ConfidenceDetails
} from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

export interface LayoutSimulationParams {
  goal: 'revenue' | 'dwell_time' | 'traffic';
  constraints?: {
    fixedFurniture?: string[];
    maxMoves?: number;
    preserveZones?: string[];
  };
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export interface LayoutSimulationResult {
  id: string;
  status: SimulationStatus;
  timestamp: string;
  params: LayoutSimulationParams;

  // 메트릭
  currentEfficiency: number;
  optimizedEfficiency: number;
  expectedROI: number;

  // 예상 개선 효과
  improvements: {
    revenueIncrease: number;
    revenueIncreasePercent: number;
    dwellTimeIncrease: number;
    conversionIncrease: number;
    trafficIncrease: number;
  };

  // 변경 사항
  furnitureMoves: FurnitureMove[];
  zoneChanges: ZoneChange[];

  // 신뢰도
  confidence: ConfidenceDetails;

  // AI 인사이트
  insights: string[];
  warnings?: string[];

  // 3D 시각화 데이터
  visualization: {
    beforeHeatmap: Array<{ x: number; z: number; intensity: number }>;
    afterHeatmap: Array<{ x: number; z: number; intensity: number }>;
    flowPaths: Array<{
      id: string;
      points: Array<{ x: number; y: number; z: number }>;
      type: 'current' | 'optimized';
    }>;
    highlightZones: Array<{
      zoneId: string;
      color: string;
      opacity: number;
      changeType: 'improved' | 'degraded' | 'new' | 'removed';
    }>;
  };
}

export interface UseLayoutSimulationReturn {
  // 상태
  isSimulating: boolean;
  result: LayoutSimulationResult | null;
  error: Error | null;
  progress: number;

  // 액션
  runSimulation: (params: LayoutSimulationParams) => Promise<LayoutSimulationResult>;
  applyChanges: () => Promise<void>;
  resetResult: () => void;

  // 3D 시각화 데이터
  getVisualizationData: () => LayoutSimulationResult['visualization'] | null;

  // 히스토리
  history: LayoutSimulationResult[];
  loadHistory: () => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useLayoutSimulation(): UseLayoutSimulationReturn {
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  const [result, setResult] = useState<LayoutSimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<LayoutSimulationResult[]>([]);

  // 시뮬레이션 히스토리 조회
  const { refetch: fetchHistory } = useQuery<any[], Error, any[], string[]>({
    queryKey: ['layout-simulation-history', selectedStore?.id || ''],
    queryFn: async () => {
      if (!selectedStore?.id) return [] as any[];

      const { data } = await supabase
        .from('ai_inference_results')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('inference_type', 'layout_optimization')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []) as any[];
    },
    enabled: false,
  });

  // 시뮬레이션 실행 mutation
  const simulationMutation = useMutation({
    mutationFn: async (params: LayoutSimulationParams): Promise<LayoutSimulationResult> => {
      if (!selectedStore?.id || !orgId) {
        throw new Error('매장 또는 조직 정보가 없습니다.');
      }

      setProgress(10);

      // advanced-ai-inference Edge Function 호출
      const { data, error } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          type: 'layout_optimization',
          storeId: selectedStore.id,
          orgId,
          params: {
            goal: params.goal,
            constraints: params.constraints || {},
            analysisDepth: params.analysisDepth || 'standard',
          },
        },
      });

      setProgress(80);

      if (error) throw error;
      if (!data?.result) throw new Error('시뮬레이션 결과를 받지 못했습니다.');

      // 결과 변환
      const simulationResult = transformLayoutResult(data.result, params);

      setProgress(100);

      return simulationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: '레이아웃 최적화 완료',
        description: `예상 매출 증가: +${data.improvements.revenueIncreasePercent.toFixed(1)}%`,
      });
    },
    onError: (error) => {
      console.error('Layout simulation failed:', error);
      toast({
        title: '시뮬레이션 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  // 변경 사항 적용
  const applyChangesMutation = useMutation({
    mutationFn: async () => {
      if (!result || !selectedStore?.id) {
        throw new Error('적용할 결과가 없습니다.');
      }

      // 가구 위치 업데이트
      for (const move of result.furnitureMoves) {
        await supabase
          .from('furniture')
          .update({
            position: move.toPosition,
            rotation: move.rotation || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', move.furnitureId);
      }

      // 존 변경 적용
      for (const zoneChange of result.zoneChanges) {
        if (zoneChange.changeType === 'resize' || zoneChange.changeType === 'move') {
          await supabase
            .from('zones')
            .update({
              bounds: zoneChange.after,
              updated_at: new Date().toISOString(),
            })
            .eq('id', zoneChange.zoneId);
        }
      }

      // 적용 이력 저장
      await supabase.from('applied_strategies').insert([{
        org_id: orgId,
        store_id: selectedStore.id,
        name: 'Layout Optimization',
        source: 'ai_simulation',
        source_module: 'layout',
        expected_roi: result.expectedROI,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: result as any,
      }]);
    },
    onSuccess: () => {
      toast({
        title: '레이아웃 변경 적용됨',
        description: '3D 뷰에서 변경된 배치를 확인하세요.',
      });
    },
    onError: (error) => {
      console.error('Apply changes failed:', error);
      toast({
        title: '변경 적용 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });

  // 시뮬레이션 실행
  const runSimulation = useCallback(async (params: LayoutSimulationParams) => {
    return simulationMutation.mutateAsync(params);
  }, [simulationMutation]);

  // 변경 적용
  const applyChanges = useCallback(async () => {
    await applyChangesMutation.mutateAsync();
  }, [applyChangesMutation]);

  // 결과 초기화
  const resetResult = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  // 시각화 데이터 가져오기
  const getVisualizationData = useCallback(() => {
    return result?.visualization || null;
  }, [result]);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    const { data } = await fetchHistory();
    if (data) {
      setHistory(data.map(transformHistoryItem));
    }
  }, [fetchHistory]);

  return {
    isSimulating: simulationMutation.isPending,
    result,
    error: simulationMutation.error as Error | null,
    progress,

    runSimulation,
    applyChanges,
    resetResult,

    getVisualizationData,

    history,
    loadHistory,
  };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function transformLayoutResult(
  rawResult: any,
  params: LayoutSimulationParams
): LayoutSimulationResult {
  // AI 응답을 LayoutSimulationResult 형식으로 변환
  const furnitureMoves: FurnitureMove[] = (rawResult.layoutChanges || rawResult.changes || []).map(
    (change: any, idx: number) => ({
      furnitureId: change.id || `furniture-${idx}`,
      furnitureName: change.item || change.name || `가구 ${idx + 1}`,
      fromPosition: change.from || change.currentPosition || { x: 0, y: 0, z: 0 },
      toPosition: change.to || change.suggestedPosition || { x: 0, y: 0, z: 0 },
      rotation: change.rotation,
    })
  );

  const zoneChanges: ZoneChange[] = (rawResult.zoneChanges || []).map(
    (change: any, idx: number) => ({
      zoneId: change.zoneId || `zone-${idx}`,
      zoneName: change.zoneName || `존 ${idx + 1}`,
      changeType: change.changeType || 'resize',
      before: change.before || {},
      after: change.after || {},
    })
  );

  // 신뢰도 정보
  const confidence: ConfidenceDetails = {
    overall: rawResult.confidence || 0.75,
    factors: {
      dataQuality: rawResult.confidenceFactors?.dataQuality || 0.8,
      modelAccuracy: rawResult.confidenceFactors?.modelAccuracy || 0.75,
      sampleSize: rawResult.confidenceFactors?.sampleSize || 0.7,
      variability: rawResult.confidenceFactors?.variability || 0.72,
    },
  };

  // 시각화 데이터 생성
  const visualization = generateVisualizationData(rawResult, furnitureMoves);

  return {
    id: rawResult.id || `sim-${Date.now()}`,
    status: 'completed',
    timestamp: new Date().toISOString(),
    params,

    currentEfficiency: rawResult.currentEfficiency || 72,
    optimizedEfficiency: rawResult.optimizedEfficiency ||
      (rawResult.currentEfficiency || 72) + (rawResult.optimizationSummary?.efficiencyGain || 15),
    expectedROI: rawResult.expectedROI || rawResult.optimizationSummary?.expectedROI || 12,

    improvements: {
      revenueIncrease: rawResult.optimizationSummary?.expectedRevenueIncrease || 2400000,
      revenueIncreasePercent: rawResult.optimizationSummary?.expectedRevenueIncreasePercent ||
        ((rawResult.optimizationSummary?.expectedRevenueIncrease || 2400000) / 20000000) * 100,
      dwellTimeIncrease: rawResult.optimizationSummary?.expectedDwellTimeIncrease || 8,
      conversionIncrease: rawResult.optimizationSummary?.expectedConversionIncrease || 3.2,
      trafficIncrease: rawResult.optimizationSummary?.expectedTrafficIncrease || 5,
    },

    furnitureMoves,
    zoneChanges,
    confidence,

    insights: rawResult.insights || [
      '입구 근처 메인 테이블 이동으로 첫 노출 증가',
      '동선 교차점에 프로모션 디스플레이 배치 추천',
    ],
    warnings: rawResult.warnings,

    visualization,
  };
}

function generateVisualizationData(
  rawResult: any,
  furnitureMoves: FurnitureMove[]
): LayoutSimulationResult['visualization'] {
  // 히트맵 데이터 생성
  const beforeHeatmap = generateHeatmapData(rawResult.heatmapBefore || null, 'before');
  const afterHeatmap = generateHeatmapData(rawResult.heatmapAfter || null, 'after');

  // 동선 경로 생성
  const flowPaths = furnitureMoves.map((move, idx) => ({
    id: `path-${idx}`,
    points: [
      { x: move.fromPosition.x, y: 0.5, z: move.fromPosition.z },
      { x: move.toPosition.x, y: 0.5, z: move.toPosition.z },
    ],
    type: 'optimized' as const,
  }));

  // 하이라이트 존 생성
  const highlightZones = (rawResult.zoneChanges || []).map((change: any) => ({
    zoneId: change.zoneId,
    color: change.changeType === 'improved' ? '#22c55e' :
           change.changeType === 'new' ? '#3b82f6' : '#f59e0b',
    opacity: 0.4,
    changeType: change.changeType || 'improved',
  }));

  return {
    beforeHeatmap,
    afterHeatmap,
    flowPaths,
    highlightZones,
  };
}

function generateHeatmapData(
  rawData: any[] | null,
  type: 'before' | 'after'
): Array<{ x: number; z: number; intensity: number }> {
  if (rawData && Array.isArray(rawData)) {
    return rawData.map((point) => ({
      x: point.x || 0,
      z: point.z || point.y || 0,
      intensity: point.intensity || point.value || 0.5,
    }));
  }

  // 샘플 데이터 생성
  const baseIntensity = type === 'before' ? 0.5 : 0.7;
  return Array.from({ length: 20 }, (_, i) => ({
    x: (i % 5) * 2 - 4,
    z: Math.floor(i / 5) * 2 - 4,
    intensity: baseIntensity + Math.random() * 0.3,
  }));
}

function transformHistoryItem(item: any): LayoutSimulationResult {
  return {
    id: item.id,
    status: item.status || 'completed',
    timestamp: item.created_at,
    params: item.parameters || { goal: 'revenue' },
    currentEfficiency: item.result?.currentEfficiency || 72,
    optimizedEfficiency: item.result?.optimizedEfficiency || 85,
    expectedROI: item.result?.expectedROI || 10,
    improvements: item.result?.improvements || {
      revenueIncrease: 0,
      revenueIncreasePercent: 0,
      dwellTimeIncrease: 0,
      conversionIncrease: 0,
      trafficIncrease: 0,
    },
    furnitureMoves: item.result?.furnitureMoves || [],
    zoneChanges: item.result?.zoneChanges || [],
    confidence: item.result?.confidence || {
      overall: 0.7,
      factors: { dataQuality: 0.7, modelAccuracy: 0.7, sampleSize: 0.7, variability: 0.7 },
    },
    insights: item.result?.insights || [],
    visualization: item.result?.visualization || {
      beforeHeatmap: [],
      afterHeatmap: [],
      flowPaths: [],
      highlightZones: [],
    },
  };
}

export default useLayoutSimulation;
