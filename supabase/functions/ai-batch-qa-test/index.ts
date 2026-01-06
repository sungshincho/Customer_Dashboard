/**
 * ai-batch-qa-test Edge Function
 *
 * AI 시뮬레이션/최적화 함수의 모든 변수 조합을 자동으로 테스트하고
 * 파인튜닝용 데이터셋 품질을 검증하는 배치 테스트 시스템
 *
 * 테스트 유형:
 * - simulation: run-simulation 다양한 변수 조합 테스트
 * - optimization: generate-optimization 다양한 변수 조합 테스트
 * - linked: 시뮬레이션 → 진단 이슈 추출 → 최적화 연결 테스트
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// 타입 정의
// ============================================================================

interface BatchTestRequest {
  store_id: string;
  test_type: 'simulation' | 'optimization' | 'linked' | 'all';
  mode: 'minimal' | 'sampled' | 'full';
  delay_ms?: number;
}

interface TestCombination {
  id: string;
  variables: Record<string, unknown>;
  request_body: Record<string, unknown>;
}

interface TestResult {
  combination_id: string;
  success: boolean;
  response_data?: Record<string, unknown>;
  error_message?: string;
  execution_time_ms: number;
  quality_score: number;
  response_metrics: Record<string, unknown>;
}

interface BatchSummary {
  total_tests: number;
  simulation: { total: number; success: number; failure: number; success_rate: number };
  optimization: { total: number; success: number; failure: number; success_rate: number };
  linked: { total: number; success: number; failure: number; success_rate: number };
}

// ============================================================================
// 프리셋 시나리오 정의 (코드베이스에서 추출)
// ============================================================================

const PRESET_SCENARIOS = [
  {
    id: 'christmas',
    name: '크리스마스 시즌',
    settings: {
      weather: 'snow',
      holidayType: 'christmas',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.8,
      discountPercent: 30,
      eventType: 'sale',
    },
    expectedImpact: {
      visitorsMultiplier: 1.8,
      conversionMultiplier: 1.2,
      basketMultiplier: 1.15,
      dwellTimeMultiplier: 1.1,
    },
    riskTags: ['혼잡 위험', '계산대 대기'],
  },
  {
    id: 'rainyWeekday',
    name: '비 오는 평일',
    settings: {
      weather: 'rain',
      holidayType: 'none',
      timeOfDay: 'afternoon',
      trafficMultiplier: 0.7,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 0.7,
      conversionMultiplier: 1.0,
      basketMultiplier: 1.05,
      dwellTimeMultiplier: 1.25,
    },
    riskTags: ['매출 감소'],
  },
  {
    id: 'blackFriday',
    name: '블랙프라이데이',
    settings: {
      weather: 'clear',
      holidayType: 'blackFriday',
      timeOfDay: 'peak',
      trafficMultiplier: 2.5,
      discountPercent: 50,
      eventType: 'sale',
    },
    expectedImpact: {
      visitorsMultiplier: 2.5,
      conversionMultiplier: 1.3,
      basketMultiplier: 0.85,
      dwellTimeMultiplier: 0.9,
    },
    riskTags: ['혼잡 위험', '인력 부족', '병목 위험'],
  },
  {
    id: 'newArrival',
    name: '신상품 런칭',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.2,
      eventType: 'newArrival',
    },
    expectedImpact: {
      visitorsMultiplier: 1.2,
      conversionMultiplier: 1.1,
      basketMultiplier: 1.1,
      dwellTimeMultiplier: 1.15,
    },
    riskTags: ['특정 존 집중'],
  },
  {
    id: 'normalWeekend',
    name: '평범한 주말',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.35,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 1.35,
      conversionMultiplier: 1.05,
      basketMultiplier: 1.0,
      dwellTimeMultiplier: 1.0,
    },
    riskTags: [],
  },
  {
    id: 'coldWave',
    name: '한파 주의보',
    settings: {
      weather: 'heavySnow',
      holidayType: 'none',
      timeOfDay: 'afternoon',
      trafficMultiplier: 0.6,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 0.6,
      conversionMultiplier: 1.0,
      basketMultiplier: 1.1,
      dwellTimeMultiplier: 0.85,
    },
    riskTags: ['매출 감소', '방문객 급감'],
  },
  {
    id: 'yearEndParty',
    name: '연말 파티 시즌',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'evening',
      trafficMultiplier: 1.5,
      eventType: 'seasonOpen',
    },
    expectedImpact: {
      visitorsMultiplier: 1.5,
      conversionMultiplier: 1.15,
      basketMultiplier: 1.2,
      dwellTimeMultiplier: 1.3,
    },
    riskTags: ['저녁 집중', '체류시간 증가'],
  },
];

// 시뮬레이션 옵션 값들
const TIME_OF_DAY_OPTIONS = ['morning', 'afternoon', 'evening', 'peak'] as const;
const SIMULATION_TYPE_OPTIONS = ['realtime', 'predictive', 'scenario'] as const;
const CUSTOMER_COUNT_OPTIONS = [50, 100, 150, 200];
const DURATION_OPTIONS = [30, 60, 120];

// 최적화 옵션 값들
const OPTIMIZATION_TYPE_OPTIONS = ['furniture', 'product', 'both', 'staffing'] as const;
const STAFFING_GOAL_OPTIONS = ['customer_service', 'sales', 'efficiency'] as const;
const MAX_CHANGES_OPTIONS = [10, 20, 30];

// ============================================================================
// 테스트 조합 생성
// ============================================================================

function generateSimulationCombinations(storeId: string, mode: string): TestCombination[] {
  const combinations: TestCombination[] = [];

  if (mode === 'minimal') {
    // 최소 모드: 각 프리셋 시나리오 1회씩
    for (const scenario of PRESET_SCENARIOS) {
      const id = `sim_${scenario.id}`;
      const environmentContext = {
        weather: scenario.settings.weather,
        holiday_type: scenario.settings.holidayType,
        time_of_day: scenario.settings.timeOfDay,
        impact: {
          trafficMultiplier: scenario.expectedImpact.visitorsMultiplier,
          dwellTimeMultiplier: scenario.expectedImpact.dwellTimeMultiplier,
          conversionMultiplier: scenario.expectedImpact.conversionMultiplier,
        },
        preset_scenario: {
          id: scenario.id,
          name: scenario.name,
          traffic_multiplier: scenario.settings.trafficMultiplier,
          discount_percent: scenario.settings.discountPercent || null,
          event_type: scenario.settings.eventType,
          expected_impact: scenario.expectedImpact,
          risk_tags: scenario.riskTags,
        },
      };

      combinations.push({
        id,
        variables: {
          preset_scenario: scenario.id,
          time_of_day: scenario.settings.timeOfDay,
          weather: scenario.settings.weather,
          customer_count: 100,
        },
        request_body: {
          store_id: storeId,
          options: {
            duration_minutes: 60,
            customer_count: 100,
            time_of_day: scenario.settings.timeOfDay,
            simulation_type: 'scenario',
          },
          environment_context: environmentContext,
        },
      });
    }
  } else if (mode === 'sampled') {
    // 샘플링 모드: 프리셋 + 추가 변수 조합
    for (const scenario of PRESET_SCENARIOS) {
      for (const customerCount of [50, 100, 200]) {
        const id = `sim_${scenario.id}_c${customerCount}`;
        combinations.push({
          id,
          variables: {
            preset_scenario: scenario.id,
            customer_count: customerCount,
          },
          request_body: {
            store_id: storeId,
            options: {
              duration_minutes: 60,
              customer_count: customerCount,
              time_of_day: scenario.settings.timeOfDay,
              simulation_type: 'scenario',
            },
            environment_context: {
              weather: scenario.settings.weather,
              holiday_type: scenario.settings.holidayType,
              time_of_day: scenario.settings.timeOfDay,
              impact: {
                trafficMultiplier: scenario.expectedImpact.visitorsMultiplier,
                dwellTimeMultiplier: scenario.expectedImpact.dwellTimeMultiplier,
                conversionMultiplier: scenario.expectedImpact.conversionMultiplier,
              },
              preset_scenario: {
                id: scenario.id,
                name: scenario.name,
                traffic_multiplier: scenario.settings.trafficMultiplier,
                expected_impact: scenario.expectedImpact,
                risk_tags: scenario.riskTags,
              },
            },
          },
        });
      }
    }

    // 프리셋 없이 기본 시뮬레이션
    for (const timeOfDay of ['morning', 'afternoon', 'peak']) {
      const id = `sim_basic_${timeOfDay}`;
      combinations.push({
        id,
        variables: { time_of_day: timeOfDay, simulation_type: 'predictive' },
        request_body: {
          store_id: storeId,
          options: {
            duration_minutes: 60,
            customer_count: 100,
            time_of_day: timeOfDay,
            simulation_type: 'predictive',
          },
        },
      });
    }
  } else {
    // full 모드: 제한된 전체 조합
    for (const scenario of PRESET_SCENARIOS.slice(0, 4)) {
      for (const customerCount of CUSTOMER_COUNT_OPTIONS) {
        for (const duration of [60, 120]) {
          const id = `sim_${scenario.id}_c${customerCount}_d${duration}`;
          combinations.push({
            id,
            variables: {
              preset_scenario: scenario.id,
              customer_count: customerCount,
              duration: duration,
            },
            request_body: {
              store_id: storeId,
              options: {
                duration_minutes: duration,
                customer_count: customerCount,
                time_of_day: scenario.settings.timeOfDay,
                simulation_type: 'scenario',
              },
              environment_context: {
                weather: scenario.settings.weather,
                holiday_type: scenario.settings.holidayType,
                preset_scenario: {
                  id: scenario.id,
                  name: scenario.name,
                  traffic_multiplier: scenario.settings.trafficMultiplier,
                  expected_impact: scenario.expectedImpact,
                },
              },
            },
          });
        }
      }
    }
  }

  return combinations;
}

function generateOptimizationCombinations(storeId: string, mode: string): TestCombination[] {
  const combinations: TestCombination[] = [];

  if (mode === 'minimal') {
    // 최소 모드: 각 최적화 타입 1회씩
    for (const optType of OPTIMIZATION_TYPE_OPTIONS) {
      const id = `opt_${optType}`;
      const params: Record<string, unknown> = {
        max_changes: 20,
        prioritize_revenue: true,
      };

      if (optType === 'staffing') {
        params.staffing_goal = 'customer_service';
        params.staff_count = 5;
      }

      combinations.push({
        id,
        variables: { optimization_type: optType },
        request_body: {
          store_id: storeId,
          optimization_type: optType,
          parameters: params,
        },
      });
    }
  } else if (mode === 'sampled') {
    // 샘플링 모드: 타입별 다양한 설정
    for (const optType of OPTIMIZATION_TYPE_OPTIONS) {
      if (optType === 'staffing') {
        for (const goal of STAFFING_GOAL_OPTIONS) {
          const id = `opt_staffing_${goal}`;
          combinations.push({
            id,
            variables: { optimization_type: optType, staffing_goal: goal },
            request_body: {
              store_id: storeId,
              optimization_type: optType,
              parameters: {
                staffing_goal: goal,
                staff_count: 5,
              },
            },
          });
        }
      } else {
        for (const maxChanges of [10, 30]) {
          const id = `opt_${optType}_mc${maxChanges}`;
          combinations.push({
            id,
            variables: { optimization_type: optType, max_changes: maxChanges },
            request_body: {
              store_id: storeId,
              optimization_type: optType,
              parameters: {
                max_changes: maxChanges,
                prioritize_revenue: true,
              },
            },
          });
        }
      }
    }
  } else {
    // full 모드
    for (const optType of OPTIMIZATION_TYPE_OPTIONS) {
      if (optType === 'staffing') {
        for (const goal of STAFFING_GOAL_OPTIONS) {
          for (const staffCount of [3, 5, 8]) {
            const id = `opt_staffing_${goal}_s${staffCount}`;
            combinations.push({
              id,
              variables: { optimization_type: optType, staffing_goal: goal, staff_count: staffCount },
              request_body: {
                store_id: storeId,
                optimization_type: optType,
                parameters: { staffing_goal: goal, staff_count: staffCount },
              },
            });
          }
        }
      } else {
        for (const maxChanges of MAX_CHANGES_OPTIONS) {
          for (const prioritize of ['revenue', 'visibility', 'accessibility']) {
            const id = `opt_${optType}_mc${maxChanges}_${prioritize}`;
            combinations.push({
              id,
              variables: { optimization_type: optType, max_changes: maxChanges, prioritize },
              request_body: {
                store_id: storeId,
                optimization_type: optType,
                parameters: {
                  max_changes: maxChanges,
                  prioritize_revenue: prioritize === 'revenue',
                  prioritize_visibility: prioritize === 'visibility',
                  prioritize_accessibility: prioritize === 'accessibility',
                },
              },
            });
          }
        }
      }
    }
  }

  return combinations;
}

// ============================================================================
// 품질 점수 계산
// ============================================================================

function calculateSimulationQuality(response: any): { score: number; metrics: Record<string, unknown> } {
  let score = 0;
  const metrics: Record<string, unknown> = {};

  // KPIs 완전성 (30점)
  const kpis = response?.kpis || {};
  const kpiFields = ['predicted_visitors', 'predicted_conversion_rate', 'predicted_revenue', 'avg_dwell_time_seconds', 'peak_congestion_percent'];
  const kpiCount = kpiFields.filter(f => kpis[f] !== undefined && kpis[f] !== null).length;
  score += Math.round((kpiCount / kpiFields.length) * 30);
  metrics.kpi_completeness = kpiCount;

  // AI Insights (20점)
  const insights = response?.ai_insights || [];
  const insightScore = Math.min(insights.length, 5) * 4;
  score += insightScore;
  metrics.insights_count = insights.length;

  // Diagnostic Issues (20점)
  const issues = response?.diagnostic_issues || [];
  const issueScore = Math.min(issues.length, 5) * 4;
  score += issueScore;
  metrics.diagnostic_issues_count = issues.length;

  // Zone Analysis (15점)
  const zoneAnalysis = response?.zone_analysis || [];
  const zoneScore = zoneAnalysis.length > 0 ? 15 : 0;
  score += zoneScore;
  metrics.zone_analysis_count = zoneAnalysis.length;

  // Confidence Score (15점)
  const confidence = response?.confidence_score || 0;
  score += Math.round((confidence / 100) * 15);
  metrics.confidence_score = confidence;

  return { score, metrics };
}

function calculateOptimizationQuality(response: any): { score: number; metrics: Record<string, unknown> } {
  let score = 0;
  const metrics: Record<string, unknown> = {};

  // Furniture Changes (20점)
  const furnitureChanges = response?.furniture_changes || [];
  const furnitureScore = furnitureChanges.length > 0 ? Math.min(furnitureChanges.length, 5) * 4 : 0;
  score += furnitureScore;
  metrics.furniture_changes_count = furnitureChanges.length;

  // Product Changes (20점)
  const productChanges = response?.product_changes || [];
  const productScore = productChanges.length > 0 ? Math.min(productChanges.length, 5) * 4 : 0;
  score += productScore;
  metrics.product_changes_count = productChanges.length;

  // Staffing Result (20점) - staffing 타입일 때
  const staffingResult = response?.staffing_result;
  if (staffingResult) {
    const staffPositions = staffingResult?.staffPositions || [];
    score += staffPositions.length > 0 ? 20 : 0;
    metrics.staffing_positions_count = staffPositions.length;
    metrics.staffing_coverage_gain = staffingResult?.metrics?.coverageGain || 0;
  } else {
    metrics.staffing_positions_count = 0;
  }

  // Summary & Impact (20점)
  const summary = response?.summary || {};
  const hasRevenueImpact = summary.expected_revenue_improvement !== undefined;
  const hasTrafficImpact = summary.expected_traffic_improvement !== undefined;
  score += (hasRevenueImpact ? 10 : 0) + (hasTrafficImpact ? 10 : 0);
  metrics.expected_revenue_improvement = summary.expected_revenue_improvement;
  metrics.expected_traffic_improvement = summary.expected_traffic_improvement;

  // AI Insights (20점)
  const insights = response?.ai_insights || [];
  score += Math.min(insights.length, 5) * 4;
  metrics.insights_count = insights.length;

  return { score, metrics };
}

// ============================================================================
// Edge Function 호출
// ============================================================================

async function callEdgeFunction(
  supabaseUrl: string,
  serviceRoleKey: string,
  functionName: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; data?: any; error?: string; timeMs: number }> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const timeMs = Date.now() - startTime;

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Failed to read error response';
      }
      return { success: false, error: `HTTP ${response.status}: ${errorText}`, timeMs };
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      return { success: false, error: 'Failed to parse response JSON', timeMs };
    }

    // 응답 데이터 내 에러 체크
    if (data?.error) {
      return {
        success: false,
        error: typeof data.error === 'string' ? data.error : data.error?.message || JSON.stringify(data.error),
        timeMs
      };
    }

    return { success: true, data, timeMs };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    return { success: false, error: errorMessage, timeMs };
  }
}

// ============================================================================
// 테스트 실행
// ============================================================================

async function runSimulationTests(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  storeId: string,
  batchId: string,
  mode: string,
  delayMs: number
): Promise<TestResult[]> {
  const combinations = generateSimulationCombinations(storeId, mode);
  const results: TestResult[] = [];

  console.log(`[BatchQA] Running ${combinations.length} simulation tests`);

  for (const combo of combinations) {
    let success = false;
    let data: any = null;
    let errorMessage: string | null = null;
    let timeMs = 0;

    try {
      const response = await callEdgeFunction(
        supabaseUrl,
        serviceRoleKey,
        'run-simulation',
        combo.request_body
      );
      success = response?.success ?? false;
      data = response?.data ?? null;
      errorMessage = response?.error ?? null;
      timeMs = response?.timeMs ?? 0;
    } catch (e) {
      success = false;
      errorMessage = e instanceof Error ? e.message : String(e ?? 'Unknown error');
      timeMs = 0;
    }

    const { score, metrics } = success && data != null
      ? calculateSimulationQuality(data)
      : { score: 0, metrics: {} };

    const result: TestResult = {
      combination_id: combo.id,
      success,
      response_data: success && data != null ? data : undefined,
      error_message: errorMessage ?? undefined,
      execution_time_ms: timeMs,
      quality_score: score,
      response_metrics: metrics,
    };

    results.push(result);

    // DB에 저장
    try {
      const { error: dbError } = await supabase.from('ai_batch_test_results').insert({
        test_type: 'simulation',
        test_batch_id: batchId,
        combination_id: combo.id,
        combination_variables: combo.variables ?? {},
        function_name: 'run-simulation',
        request_body: combo.request_body ?? {},
        success,
        response_data: success && data != null ? data : null,
        error_message: errorMessage,
        execution_time_ms: timeMs,
        response_quality_score: score,
        response_metrics: metrics,
      });
      if (dbError) {
        console.error(`[BatchQA] DB insert error for ${combo.id}:`, dbError.message);
      }
    } catch (dbErr) {
      console.error(`[BatchQA] DB insert exception for ${combo.id}:`, dbErr);
    }

    console.log(`[BatchQA] Simulation ${combo.id}: ${success ? 'OK' : 'FAIL'} (${timeMs}ms, score: ${score})`);

    // 딜레이
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

async function runOptimizationTests(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  storeId: string,
  batchId: string,
  mode: string,
  delayMs: number
): Promise<TestResult[]> {
  const combinations = generateOptimizationCombinations(storeId, mode);
  const results: TestResult[] = [];

  console.log(`[BatchQA] Running ${combinations.length} optimization tests`);

  for (const combo of combinations) {
    let success = false;
    let data: any = null;
    let errorMessage: string | null = null;
    let timeMs = 0;

    try {
      const response = await callEdgeFunction(
        supabaseUrl,
        serviceRoleKey,
        'generate-optimization',
        combo.request_body
      );
      success = response?.success ?? false;
      data = response?.data ?? null;
      errorMessage = response?.error ?? null;
      timeMs = response?.timeMs ?? 0;
    } catch (e) {
      success = false;
      errorMessage = e instanceof Error ? e.message : String(e ?? 'Unknown error');
      timeMs = 0;
    }

    const { score, metrics } = success && data != null
      ? calculateOptimizationQuality(data)
      : { score: 0, metrics: {} };

    const result: TestResult = {
      combination_id: combo.id,
      success,
      response_data: success && data != null ? data : undefined,
      error_message: errorMessage ?? undefined,
      execution_time_ms: timeMs,
      quality_score: score,
      response_metrics: metrics,
    };

    results.push(result);

    // DB에 저장
    try {
      const { error: dbError } = await supabase.from('ai_batch_test_results').insert({
        test_type: 'optimization',
        test_batch_id: batchId,
        combination_id: combo.id,
        combination_variables: combo.variables ?? {},
        function_name: 'generate-optimization',
        request_body: combo.request_body ?? {},
        success,
        response_data: success && data != null ? data : null,
        error_message: errorMessage,
        execution_time_ms: timeMs,
        response_quality_score: score,
        response_metrics: metrics,
      });
      if (dbError) {
        console.error(`[BatchQA] DB insert error for ${combo.id}:`, dbError.message);
      }
    } catch (dbErr) {
      console.error(`[BatchQA] DB insert exception for ${combo.id}:`, dbErr);
    }

    console.log(`[BatchQA] Optimization ${combo.id}: ${success ? 'OK' : 'FAIL'} (${timeMs}ms, score: ${score})`);

    // 딜레이
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

async function runLinkedTests(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  storeId: string,
  batchId: string,
  mode: string,
  delayMs: number
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 시나리오별로 연결 테스트 수행
  const scenariosToTest = mode === 'minimal'
    ? PRESET_SCENARIOS.slice(0, 3)
    : mode === 'sampled'
    ? PRESET_SCENARIOS.slice(0, 5)
    : PRESET_SCENARIOS;

  const optTypesToTest = mode === 'minimal'
    ? ['both', 'staffing']
    : mode === 'sampled'
    ? ['furniture', 'product', 'both', 'staffing']
    : OPTIMIZATION_TYPE_OPTIONS;

  console.log(`[BatchQA] Running ${scenariosToTest.length * optTypesToTest.length} linked tests`);

  for (const scenario of scenariosToTest) {
    // 1. 시뮬레이션 실행
    const simRequest = {
      store_id: storeId,
      options: {
        duration_minutes: 60,
        customer_count: 100,
        time_of_day: scenario.settings.timeOfDay,
        simulation_type: 'scenario',
      },
      environment_context: {
        weather: scenario.settings.weather,
        holiday_type: scenario.settings.holidayType,
        time_of_day: scenario.settings.timeOfDay,
        impact: {
          trafficMultiplier: scenario.expectedImpact.visitorsMultiplier,
          dwellTimeMultiplier: scenario.expectedImpact.dwellTimeMultiplier,
          conversionMultiplier: scenario.expectedImpact.conversionMultiplier,
        },
        preset_scenario: {
          id: scenario.id,
          name: scenario.name,
          traffic_multiplier: scenario.settings.trafficMultiplier,
          expected_impact: scenario.expectedImpact,
          risk_tags: scenario.riskTags,
        },
      },
    };

    // 시뮬레이션 호출 (안전한 처리)
    let simSuccess = false;
    let simData: any = null;
    let simError: string | null = null;
    let simTimeMs = 0;

    try {
      const simResponse = await callEdgeFunction(supabaseUrl, serviceRoleKey, 'run-simulation', simRequest);
      simSuccess = simResponse?.success ?? false;
      simData = simResponse?.data ?? null;
      simError = simResponse?.error ?? null;
      simTimeMs = simResponse?.timeMs ?? 0;
    } catch (e) {
      simSuccess = false;
      simError = e instanceof Error ? e.message : String(e ?? 'Unknown error');
      simTimeMs = 0;
    }

    const { score: simScore, metrics: simMetrics } = simSuccess && simData != null
      ? calculateSimulationQuality(simData)
      : { score: 0, metrics: {} };

    // 시뮬레이션 결과 저장
    let simRecordId: string | null = null;
    try {
      const { data: simRecord, error: dbError } = await supabase.from('ai_batch_test_results').insert({
        test_type: 'simulation',
        test_batch_id: batchId,
        combination_id: `linked_sim_${scenario.id}`,
        combination_variables: { preset_scenario: scenario.id, linked_test: true },
        function_name: 'run-simulation',
        request_body: simRequest,
        success: simSuccess,
        response_data: simSuccess && simData != null ? simData : null,
        error_message: simError,
        execution_time_ms: simTimeMs,
        response_quality_score: simScore,
        response_metrics: simMetrics,
      }).select('id').single();

      if (dbError) {
        console.error(`[BatchQA] DB insert error for linked_sim_${scenario.id}:`, dbError.message);
      }
      simRecordId = simRecord?.id ?? null;
    } catch (dbErr) {
      console.error(`[BatchQA] DB insert exception for linked_sim_${scenario.id}:`, dbErr);
    }

    if (!simSuccess) {
      console.log(`[BatchQA] Linked sim ${scenario.id}: FAIL - ${simError ?? 'Unknown error'}`);
      continue;
    }

    // 2. 진단 이슈 추출 (안전한 접근)
    const diagnosticIssues = Array.isArray(simData?.diagnostic_issues) ? simData.diagnostic_issues : [];
    const priorityIssues = diagnosticIssues.filter((i: any) =>
      i?.severity === 'critical' || i?.severity === 'warning'
    );

    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 3. 각 최적화 타입에 대해 연결 테스트
    for (const optType of optTypesToTest) {
      const optParams: Record<string, unknown> = {
        max_changes: 20,
        prioritize_revenue: true,
        diagnostic_issues: {
          priority_issues: priorityIssues,
          scenario_context: {
            id: scenario.id,
            name: scenario.name,
          },
          environment_context: simRequest.environment_context,
          simulation_kpis: simData?.kpis ?? null,
        },
      };

      if (optType === 'staffing') {
        optParams.staffing_goal = 'customer_service';
        optParams.staff_count = 5;
      }

      const optRequest = {
        store_id: storeId,
        optimization_type: optType,
        parameters: optParams,
      };

      // 최적화 호출 (안전한 처리)
      let optSuccess = false;
      let optData: any = null;
      let optError: string | null = null;
      let optTimeMs = 0;

      try {
        const optResponse = await callEdgeFunction(supabaseUrl, serviceRoleKey, 'generate-optimization', optRequest);
        optSuccess = optResponse?.success ?? false;
        optData = optResponse?.data ?? null;
        optError = optResponse?.error ?? null;
        optTimeMs = optResponse?.timeMs ?? 0;
      } catch (e) {
        optSuccess = false;
        optError = e instanceof Error ? e.message : String(e ?? 'Unknown error');
        optTimeMs = 0;
      }

      const { score: optScore, metrics: optMetrics } = optSuccess && optData != null
        ? calculateOptimizationQuality(optData)
        : { score: 0, metrics: {} };

      const linkedCombinationId = `linked_${scenario.id}_${optType}`;

      results.push({
        combination_id: linkedCombinationId,
        success: optSuccess,
        response_data: optSuccess && optData != null ? optData : undefined,
        error_message: optError ?? undefined,
        execution_time_ms: optTimeMs,
        quality_score: optScore,
        response_metrics: optMetrics,
      });

      // DB에 저장 (연결 정보 포함)
      try {
        const { error: dbError } = await supabase.from('ai_batch_test_results').insert({
          test_type: 'linked',
          test_batch_id: batchId,
          combination_id: linkedCombinationId,
          combination_variables: {
            preset_scenario: scenario.id,
            optimization_type: optType,
            issues_count: priorityIssues.length,
          },
          function_name: 'generate-optimization',
          request_body: optRequest,
          success: optSuccess,
          response_data: optSuccess && optData != null ? optData : null,
          error_message: optError,
          execution_time_ms: optTimeMs,
          response_quality_score: optScore,
          response_metrics: optMetrics,
          linked_simulation_id: simRecordId,
          diagnostic_issues_passed: {
            issue_count: priorityIssues.length,
            issues: priorityIssues.slice(0, 3),
          },
        });
        if (dbError) {
          console.error(`[BatchQA] DB insert error for ${linkedCombinationId}:`, dbError.message);
        }
      } catch (dbErr) {
        console.error(`[BatchQA] DB insert exception for ${linkedCombinationId}:`, dbErr);
      }

      console.log(`[BatchQA] Linked ${scenario.id}→${optType}: ${optSuccess ? 'OK' : 'FAIL'} (${optTimeMs}ms, score: ${optScore})`);

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  return results;
}

// ============================================================================
// 메인 핸들러
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: BatchTestRequest = await req.json();
    const { store_id, test_type, mode = 'minimal', delay_ms = 500 } = body;

    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 배치 ID 생성
    const batchId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`[BatchQA] Starting batch test: ${batchId}`);
    console.log(`[BatchQA] Store: ${store_id}, Type: ${test_type}, Mode: ${mode}`);

    const allResults: {
      simulation: TestResult[];
      optimization: TestResult[];
      linked: TestResult[];
    } = {
      simulation: [],
      optimization: [],
      linked: [],
    };

    // 테스트 실행
    if (test_type === 'simulation' || test_type === 'all') {
      allResults.simulation = await runSimulationTests(
        supabase, supabaseUrl, supabaseKey, store_id, batchId, mode, delay_ms
      );
    }

    if (test_type === 'optimization' || test_type === 'all') {
      allResults.optimization = await runOptimizationTests(
        supabase, supabaseUrl, supabaseKey, store_id, batchId, mode, delay_ms
      );
    }

    if (test_type === 'linked' || test_type === 'all') {
      allResults.linked = await runLinkedTests(
        supabase, supabaseUrl, supabaseKey, store_id, batchId, mode, delay_ms
      );
    }

    // 요약 생성
    const createStats = (results: TestResult[]) => ({
      total: results.length,
      success: results.filter(r => r.success).length,
      failure: results.filter(r => !r.success).length,
      success_rate: results.length > 0
        ? Math.round(100 * results.filter(r => r.success).length / results.length)
        : 0,
    });

    const summary: BatchSummary = {
      total_tests:
        allResults.simulation.length +
        allResults.optimization.length +
        allResults.linked.length,
      simulation: createStats(allResults.simulation),
      optimization: createStats(allResults.optimization),
      linked: createStats(allResults.linked),
    };

    const totalTimeMs = Date.now() - startTime;

    console.log(`[BatchQA] Completed in ${totalTimeMs}ms`);
    console.log(`[BatchQA] Summary:`, JSON.stringify(summary));

    return new Response(JSON.stringify({
      batch_id: batchId,
      total_time_ms: totalTimeMs,
      summary,
      details: {
        simulation: {
          count: allResults.simulation.length,
          results: allResults.simulation.map(r => ({
            id: r.combination_id,
            success: r.success,
            time_ms: r.execution_time_ms,
            quality: r.quality_score,
            error: r.error_message,
          })),
        },
        optimization: {
          count: allResults.optimization.length,
          results: allResults.optimization.map(r => ({
            id: r.combination_id,
            success: r.success,
            time_ms: r.execution_time_ms,
            quality: r.quality_score,
            error: r.error_message,
          })),
        },
        linked: {
          count: allResults.linked.length,
          results: allResults.linked.map(r => ({
            id: r.combination_id,
            success: r.success,
            time_ms: r.execution_time_ms,
            quality: r.quality_score,
            error: r.error_message,
          })),
        },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[BatchQA] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
