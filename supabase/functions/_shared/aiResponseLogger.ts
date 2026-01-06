/**
 * aiResponseLogger.ts
 *
 * AI 응답 로깅 유틸리티
 *
 * 목적:
 * - AI 시뮬레이션/최적화 응답을 자동으로 기록
 * - 파인튜닝용 학습 데이터 수집
 * - 에러 발생 시에도 메인 프로세스에 영향 없도록 처리
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 시뮬레이션 유형
 */
export type SimulationType =
  | 'layout'           // 레이아웃 최적화
  | 'flow'             // 동선 시뮬레이션
  | 'congestion'       // 혼잡도 시뮬레이션
  | 'staffing'         // 인력 배치 최적화 (🆕 generate-optimization에서 통합)
  | 'ultimate'         // Ultimate AI 최적화
  | 'layout_optimization' // advanced-ai-inference layout (deprecated)
  | 'flow_simulation'  // advanced-ai-inference flow (deprecated)
  | 'zone_analysis'    // 존 분석
  | 'product'          // 상품 배치 최적화
  | 'furniture'        // 가구 배치 최적화
  | 'both'             // 가구 + 상품 최적화
  // 🆕 run-simulation 시뮬레이션 타입
  | 'traffic_flow'     // 트래픽 플로우 시뮬레이션
  | 'demand_prediction' // 수요 예측 시뮬레이션
  // 🆕 프리셋 시나리오 시뮬레이션 (동적 타입)
  | `scenario_${string}`; // scenario_christmas, scenario_blackFriday 등

/**
 * 함수명
 */
export type FunctionName =
  | 'generate-optimization'
  | 'advanced-ai-inference'
  | 'retail-ai-inference'
  | 'unified-ai'
  | 'run-simulation';

/**
 * 컨텍스트 메타데이터 (입력 크기 요약)
 */
export interface ContextMetadata {
  furnitureCount?: number;
  productCount?: number;
  zoneCount?: number;
  slotCount?: number;
  transitionCount?: number;
  hasWeatherData?: boolean;
  hasFlowData?: boolean;
  hasAssociationData?: boolean;
  hasVMDData?: boolean;
  associationRulesCount?: number;
  dataQuality?: string;
  [key: string]: unknown;
}

/**
 * 응답 요약 (빠른 조회용)
 */
export interface ResponseSummary {
  // 변경 사항
  furnitureChangesCount?: number;
  productChangesCount?: number;
  totalChangesCount?: number;

  // 예상 효과
  expectedRevenueIncrease?: number;
  expectedTrafficIncrease?: number;
  expectedConversionIncrease?: number;

  // VMD
  vmdScore?: number;
  vmdGrade?: string;

  // 동선
  flowHealthScore?: number;
  bottleneckCount?: number;
  deadZoneCount?: number;

  // 신뢰도
  confidence?: number;
  overallConfidence?: number;

  // 기타
  [key: string]: unknown;
}

/**
 * 로깅 입력 파라미터
 */
export interface AIResponseLogInput {
  // 필수 필드
  storeId: string;
  functionName: FunctionName;
  simulationType: SimulationType;
  inputVariables: Record<string, unknown>;
  aiResponse: Record<string, unknown>;

  // 선택 필드
  userId?: string;
  responseSummary?: ResponseSummary;
  contextMetadata?: ContextMetadata;
  executionTimeMs?: number;
  modelUsed?: string;
  promptTokens?: number;
  completionTokens?: number;

  // 에러 정보
  hadError?: boolean;
  errorMessage?: string;
}

/**
 * 로깅 결과
 */
export interface AIResponseLogResult {
  success: boolean;
  logId?: string;
  error?: string;
}

// ============================================================================
// 메인 로깅 함수
// ============================================================================

/**
 * AI 응답을 로그 테이블에 저장
 *
 * @param supabase - Supabase 클라이언트 (service_role 키 사용 권장)
 * @param input - 로깅 입력 데이터
 * @returns 로깅 결과
 *
 * 주의: 이 함수는 에러 발생 시에도 메인 프로세스를 중단시키지 않습니다.
 * 항상 try-catch로 감싸서 호출하거나, 반환된 success 값을 확인하세요.
 */
export async function logAIResponse(
  supabase: SupabaseClient,
  input: AIResponseLogInput
): Promise<AIResponseLogResult> {
  try {
    const {
      storeId,
      functionName,
      simulationType,
      inputVariables,
      aiResponse,
      userId,
      responseSummary,
      contextMetadata,
      executionTimeMs,
      modelUsed,
      promptTokens,
      completionTokens,
      hadError = false,
      errorMessage,
    } = input;

    // 입력 검증
    if (!storeId || !functionName || !simulationType) {
      return {
        success: false,
        error: 'Missing required fields: storeId, functionName, or simulationType',
      };
    }

    // 로그 레코드 생성
    const logRecord = {
      store_id: storeId,
      user_id: userId || null,
      function_name: functionName,
      simulation_type: simulationType,
      input_variables: sanitizeForJsonb(inputVariables),
      ai_response: sanitizeForJsonb(aiResponse),
      response_summary: responseSummary ? sanitizeForJsonb(responseSummary) : {},
      context_metadata: contextMetadata ? sanitizeForJsonb(contextMetadata) : {},
      execution_time_ms: executionTimeMs || null,
      model_used: modelUsed || null,
      prompt_tokens: promptTokens || null,
      completion_tokens: completionTokens || null,
      had_error: hadError,
      error_message: errorMessage || null,
    };

    // 데이터베이스에 삽입
    const { data, error } = await supabase
      .from('ai_response_logs')
      .insert(logRecord)
      .select('id')
      .single();

    if (error) {
      console.error('[AIResponseLogger] Insert failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[AIResponseLogger] Logged response: ${data?.id} (${functionName}/${simulationType})`);

    return {
      success: true,
      logId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AIResponseLogger] Exception:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// 요약 생성 헬퍼 함수들
// ============================================================================

/**
 * generate-optimization 응답에서 요약 생성
 */
export function createOptimizationSummary(result: any): ResponseSummary {
  return {
    furnitureChangesCount: result.furniture_changes?.length || 0,
    productChangesCount: result.product_changes?.length || 0,
    totalChangesCount:
      (result.furniture_changes?.length || 0) + (result.product_changes?.length || 0),
    expectedRevenueIncrease: result.summary?.expected_revenue_improvement,
    expectedTrafficIncrease: result.summary?.expected_traffic_improvement,
    expectedConversionIncrease: result.summary?.expected_conversion_improvement,
    vmdScore: result.vmd_analysis?.score?.overall,
    vmdGrade: result.vmd_analysis?.score?.grade,
    flowHealthScore: result.flow_analysis_summary?.flow_health_score,
    bottleneckCount: result.flow_analysis_summary?.bottleneck_count,
    deadZoneCount: result.flow_analysis_summary?.dead_zone_count,
    confidence: result.prediction_summary?.overall_confidence,
  };
}

/**
 * generate-optimization 입력에서 컨텍스트 메타데이터 생성
 */
export function createOptimizationContextMetadata(
  layoutData: any,
  slotsData: any[],
  flowAnalysis?: any,
  associationData?: any,
  environmentData?: any,
  vmdAnalysis?: any
): ContextMetadata {
  return {
    furnitureCount: layoutData?.furniture?.length || 0,
    productCount: layoutData?.products?.length || 0,
    zoneCount: layoutData?.zones?.length || 0,
    slotCount: slotsData?.length || 0,
    transitionCount: flowAnalysis?.summary?.totalTransitions || 0,
    hasWeatherData: !!environmentData?.weather,
    hasFlowData: !!flowAnalysis,
    hasAssociationData: !!associationData,
    hasVMDData: !!vmdAnalysis,
    associationRulesCount: associationData?.summary?.totalRulesFound || 0,
    dataQuality: environmentData?.dataQuality?.overall || 'unknown',
    flowHealthScore: flowAnalysis?.summary?.flowHealthScore,
    vmdScore: vmdAnalysis?.score?.overall,
  };
}

/**
 * advanced-ai-inference 응답에서 요약 생성
 */
export function createInferenceSummary(result: any, simulationType: SimulationType): ResponseSummary {
  const summary: ResponseSummary = {};

  switch (simulationType) {
    case 'layout':
    case 'layout_optimization':
      summary.furnitureChangesCount = result.furnitureMoves?.length || result.layoutChanges?.length || 0;
      summary.productChangesCount = result.productPlacements?.length || 0;
      summary.expectedRevenueIncrease = result.optimizationSummary?.expectedRevenueIncreasePercent;
      summary.confidence = result.confidence;
      break;

    case 'flow':
    case 'flow_simulation':
      summary.bottleneckCount = result.bottlenecks?.length || 0;
      summary.flowHealthScore = result.summary?.flowHealthScore;
      summary.expectedConversionIncrease = result.summary?.conversionRate;
      summary.confidence = result.confidence;
      break;

    case 'congestion':
      summary.bottleneckCount = result.congestionPoints?.length || 0;
      summary.confidence = result.confidence;
      break;

    case 'staffing':
      summary.confidence = result.confidence;
      break;

    default:
      summary.confidence = result.confidence;
  }

  return summary;
}

/**
 * advanced-ai-inference 입력에서 컨텍스트 메타데이터 생성
 */
export function createInferenceContextMetadata(
  storeContext: any,
  params: any
): ContextMetadata {
  return {
    furnitureCount: storeContext?.entities?.filter((e: any) => e.type === 'furniture')?.length || 0,
    productCount: storeContext?.entities?.filter((e: any) => e.type === 'product')?.length || 0,
    zoneCount: storeContext?.zones?.length || 0,
    hasFlowData: !!storeContext?.zoneTransitions?.length,
    transitionCount: storeContext?.zoneTransitions?.length || 0,
    dataQuality: storeContext?.dataQuality?.overallScore?.toString() || 'unknown',
    salesDataDays: storeContext?.dataQuality?.salesDataDays,
    visitorDataDays: storeContext?.dataQuality?.visitorDataDays,
    hasZoneData: storeContext?.dataQuality?.hasZoneData,
    analysisDepth: params?.analysisDepth,
    customerCount: params?.customerCount,
    duration: params?.duration,
  };
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * JSONB 저장을 위해 객체를 정리
 * - undefined 값 제거
 * - 순환 참조 방지
 * - 큰 데이터 제한
 */
function sanitizeForJsonb(obj: unknown, maxDepth = 10): unknown {
  if (maxDepth <= 0) {
    return '[Max depth exceeded]';
  }

  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj !== 'object') {
    // 문자열이 너무 길면 자르기
    if (typeof obj === 'string' && obj.length > 10000) {
      return obj.substring(0, 10000) + '... [truncated]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    // 배열이 너무 크면 일부만 저장
    const maxArrayLength = 100;
    const truncated = obj.length > maxArrayLength;
    const sliced = obj.slice(0, maxArrayLength);
    const result = sliced.map(item => sanitizeForJsonb(item, maxDepth - 1));
    if (truncated) {
      result.push(`[... ${obj.length - maxArrayLength} more items]`);
    }
    return result;
  }

  // 객체 처리
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForJsonb(value, maxDepth - 1);
    }
  }
  return result;
}

/**
 * 실행 시간 측정 헬퍼
 */
export function createExecutionTimer(): {
  start: () => void;
  getElapsedMs: () => number;
} {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
    },
    getElapsedMs: () => {
      return Math.round(performance.now() - startTime);
    },
  };
}

/**
 * 비동기 로깅 (메인 응답 반환 후 백그라운드에서 실행)
 *
 * 주의: Deno Deploy에서는 응답 반환 후 백그라운드 작업이
 * 즉시 종료될 수 있습니다. 가능하면 동기적으로 로깅하세요.
 */
export function logAIResponseAsync(
  supabase: SupabaseClient,
  input: AIResponseLogInput
): void {
  // Fire-and-forget 방식
  logAIResponse(supabase, input).catch(err => {
    console.error('[AIResponseLogger] Async logging failed:', err);
  });
}

// ============================================================================
// Export
// ============================================================================

export default {
  logAIResponse,
  logAIResponseAsync,
  createOptimizationSummary,
  createOptimizationContextMetadata,
  createInferenceSummary,
  createInferenceContextMetadata,
  createExecutionTimer,
};
