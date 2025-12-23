/**
 * simulationStore.ts
 *
 * AI 시뮬레이션 상태 관리 Zustand 스토어
 */

import { create } from 'zustand';
import type {
  AISimulationResult,
  SimulationOptions,
  DiagnosticIssue,
} from '../types/simulation.types';

interface SimulationState {
  // 상태
  isRunning: boolean;
  isLoading: boolean;
  progress: number;
  error: string | null;

  // 옵션
  options: SimulationOptions;

  // 결과
  result: AISimulationResult | null;
  diagnosticIssues: DiagnosticIssue[];

  // 실시간 시뮬레이션 상태
  elapsedTime: number;
  activeCustomers: number;
  realtimeKpis: {
    visitors: number;
    revenue: number;
    conversion: number;
    avgDwell: number;
  };

  // 액션
  setOptions: (options: Partial<SimulationOptions>) => void;
  runSimulation: (storeId: string) => Promise<AISimulationResult>;
  reset: () => void;

  // 진단 → 최적화 연결
  getIssuesForOptimization: () => DiagnosticIssue[];
}

const DEFAULT_OPTIONS: SimulationOptions = {
  duration_minutes: 60,
  customer_count: 100,
  time_of_day: 'afternoon',
  simulation_type: 'predictive',
  realTimeVisualization: true,
  showCustomerStates: true,
  showHeatmap: true,
  showCongestion: true,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  isLoading: false,
  progress: 0,
  error: null,

  options: { ...DEFAULT_OPTIONS },

  result: null,
  diagnosticIssues: [],

  elapsedTime: 0,
  activeCustomers: 0,
  realtimeKpis: {
    visitors: 0,
    revenue: 0,
    conversion: 0,
    avgDwell: 0,
  },

  setOptions: (newOptions) =>
    set((state) => ({
      options: { ...state.options, ...newOptions },
    })),

  runSimulation: async (storeId: string) => {
    set({ isLoading: true, isRunning: true, progress: 0, error: null });

    try {
      // 진행 상태 업데이트 (가짜 진행률)
      const progressInterval = setInterval(() => {
        set((state) => ({
          progress: Math.min(state.progress + 5, 90),
        }));
      }, 500);

      const options = get().options;

      // Edge Function 호출
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/run-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          store_id: storeId,
          options: {
            duration_minutes: options.duration_minutes,
            customer_count: options.customer_count,
            time_of_day: options.time_of_day,
            simulation_type: options.simulation_type,
          },
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `시뮬레이션 실패: ${response.statusText}`);
      }

      const result: AISimulationResult = await response.json();

      set({
        result,
        diagnosticIssues: result.diagnostic_issues || [],
        isLoading: false,
        isRunning: false,
        progress: 100,
        realtimeKpis: {
          visitors: result.kpis?.predicted_visitors || 0,
          revenue: result.kpis?.predicted_revenue || 0,
          conversion: result.kpis?.predicted_conversion_rate || 0,
          avgDwell: result.kpis?.avg_dwell_time_seconds || 0,
        },
      });

      return result;
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
        isRunning: false,
        progress: 0,
      });
      throw error;
    }
  },

  reset: () =>
    set({
      isRunning: false,
      isLoading: false,
      progress: 0,
      error: null,
      result: null,
      diagnosticIssues: [],
      elapsedTime: 0,
      activeCustomers: 0,
      realtimeKpis: {
        visitors: 0,
        revenue: 0,
        conversion: 0,
        avgDwell: 0,
      },
    }),

  // 최적화 탭으로 전달할 이슈들 (critical, warning만)
  getIssuesForOptimization: () => {
    const { diagnosticIssues } = get();
    return diagnosticIssues.filter(
      (issue) => issue.severity === 'critical' || issue.severity === 'warning'
    );
  },
}));

export default useSimulationStore;
