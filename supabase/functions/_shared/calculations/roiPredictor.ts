/**
 * roiPredictor.ts
 *
 * ROI 예측 계산 모듈
 * 상품 배치 변경의 예상 ROI를 계산하는 순수 함수들
 *
 * 공식: ROI = (노출수 × 전환율 × 객단가 - 비용) / 비용 × 100
 *
 * Sprint 1 Task: S1-2
 * 작성일: 2026-01-12
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** ROI 계산 입력 */
export interface ROIInput {
  // 노출 관련
  /** Zone 일일 방문자 수 */
  zone_traffic: number;
  /** 상품 가시성 (0-1) */
  product_visibility: number;
  /** 선택적: 위치 보너스 (눈높이 등) */
  position_bonus?: number;

  // 전환 관련
  /** 기본 전환율 (0-1) */
  base_conversion_rate: number;
  /** 배치 보너스 (-0.2 ~ 0.5) */
  placement_bonus: number;
  /** 선택적: 카테고리 평균 전환율 */
  category_avg_conversion?: number;

  // 매출 관련
  /** 상품 가격 */
  product_price: number;
  /** 마진율 (0-1) */
  product_margin: number;
  /** 선택적: 평균 구매 수량 */
  avg_purchase_quantity?: number;

  // 비용 (선택)
  /** 구현/변경 비용 (선택적) */
  implementation_cost?: number;
  /** 기회 비용 (선택적) */
  opportunity_cost?: number;

  // 메타데이터 (선택)
  product_id?: string;
  product_name?: string;
  zone_id?: string;
  zone_name?: string;
}

/** ROI 계산 출력 */
export interface ROIOutput {
  /** 예상 노출수 (일일) */
  expected_impressions: number;
  /** 예상 전환수 (일일) */
  expected_conversions: number;
  /** 예상 매출 (일일) */
  expected_revenue: number;
  /** 예상 이익 (일일) */
  expected_profit: number;
  /** ROI 퍼센트 */
  roi_percent: number;
  /** 계산 신뢰도 (0-1) */
  confidence: number;
  /** 계산 상세 내역 */
  calculation_breakdown: ROICalculationStep[];
  /** 권장 사항 */
  recommendation: ROIRecommendation;
  /** 비교 지표 */
  comparison_metrics: ComparisonMetrics;
}

/** ROI 계산 단계 */
export interface ROICalculationStep {
  step: string;
  value: number;
  formula: string;
  unit?: string;
}

/** ROI 기반 권장 사항 */
export interface ROIRecommendation {
  action: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommend' | 'strongly_not_recommend';
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  payback_period_days?: number;
}

/** 비교 지표 */
export interface ComparisonMetrics {
  /** 업계 평균 ROI 대비 */
  vs_industry_avg: 'above' | 'at' | 'below';
  /** 매장 평균 ROI 대비 (선택) */
  vs_store_avg?: 'above' | 'at' | 'below';
  /** 예상 수익 등급 */
  revenue_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 전환율 등급 */
  conversion_grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 업계 평균 ROI (리테일) */
const INDUSTRY_AVG_ROI = 15; // 15%

/** 전환율 등급 기준 */
const CONVERSION_GRADE_THRESHOLDS = {
  A: 0.08,  // 8% 이상
  B: 0.05,  // 5% 이상
  C: 0.03,  // 3% 이상
  D: 0.01,  // 1% 이상
  F: 0,     // 1% 미만
};

/** 수익 등급 기준 (일일 이익, 원) */
const REVENUE_GRADE_THRESHOLDS = {
  A: 100000,   // 10만원 이상
  B: 50000,    // 5만원 이상
  C: 20000,    // 2만원 이상
  D: 5000,     // 5천원 이상
  F: 0,        // 5천원 미만
};

/** 배치 위치별 가시성 보너스 */
export const POSITION_VISIBILITY_BONUS: Record<string, number> = {
  eye_level: 0.4,         // 눈높이 (120-150cm)
  reach_level: 0.2,       // 손 닿는 높이 (90-120cm)
  bend_level: 0.0,        // 허리 높이 (60-90cm)
  floor_level: -0.15,     // 바닥 (60cm 미만)
  top_shelf: -0.25,       // 최상단 (150cm 이상)
  endcap: 0.35,           // 엔드캡 (통로 끝)
  checkout_adjacent: 0.25, // 계산대 인접
  entrance_adjacent: 0.2,  // 입구 인접
  dead_zone: -0.3,        // 데드존
};

/** VMD 원칙 기반 배치 보너스 */
export const VMD_PLACEMENT_BONUS: Record<string, number> = {
  golden_zone: 0.35,       // 골든존 배치
  focal_point: 0.25,       // 포컬 포인트
  cross_sell_adjacent: 0.2, // 연관 상품 인접
  traffic_flow_aligned: 0.15, // 동선 정렬
  impulse_zone: 0.2,       // 충동구매 존
  discovery_zone: 0.1,     // 발견 존
};

// ============================================================================
// 핵심 계산 함수
// ============================================================================

/**
 * ROI 예측 계산
 *
 * @param input - ROI 계산 입력 데이터
 * @returns ROIOutput
 *
 * @example
 * const result = calculateROI({
 *   zone_traffic: 500,
 *   product_visibility: 0.7,
 *   base_conversion_rate: 0.03,
 *   placement_bonus: 0.02,
 *   product_price: 45000,
 *   product_margin: 0.4,
 * });
 */
export function calculateROI(input: ROIInput): ROIOutput {
  const breakdown: ROICalculationStep[] = [];

  // Step 1: 노출수 계산
  // 노출수 = Zone 트래픽 × 가시성 × (1 + 위치 보너스)
  const positionBonus = input.position_bonus || 0;
  const effectiveVisibility = Math.min(1, Math.max(0, input.product_visibility * (1 + positionBonus)));
  const impressions = Math.round(input.zone_traffic * effectiveVisibility);

  breakdown.push({
    step: '예상 노출수',
    value: impressions,
    formula: `${input.zone_traffic}명 × ${input.product_visibility.toFixed(2)} × (1 + ${positionBonus.toFixed(2)}) = ${impressions}회`,
    unit: '회/일',
  });

  // Step 2: 유효 전환율 계산
  // 유효 전환율 = 기본 전환율 + 배치 보너스 (0-1 범위로 클램프)
  const effective_conversion = Math.max(0, Math.min(1,
    input.base_conversion_rate + input.placement_bonus
  ));

  breakdown.push({
    step: '유효 전환율',
    value: effective_conversion,
    formula: `${(input.base_conversion_rate * 100).toFixed(2)}% + ${(input.placement_bonus * 100).toFixed(2)}% = ${(effective_conversion * 100).toFixed(2)}%`,
    unit: '%',
  });

  // Step 3: 전환수 계산
  const conversions = Math.round(impressions * effective_conversion);

  breakdown.push({
    step: '예상 전환수',
    value: conversions,
    formula: `${impressions}회 × ${(effective_conversion * 100).toFixed(2)}% = ${conversions}건`,
    unit: '건/일',
  });

  // Step 4: 매출 계산
  const avgQuantity = input.avg_purchase_quantity || 1;
  const revenue = conversions * input.product_price * avgQuantity;

  breakdown.push({
    step: '예상 매출',
    value: revenue,
    formula: `${conversions}건 × ₩${input.product_price.toLocaleString()} × ${avgQuantity}개 = ₩${revenue.toLocaleString()}`,
    unit: '원/일',
  });

  // Step 5: 이익 계산
  const profit = revenue * input.product_margin;

  breakdown.push({
    step: '예상 이익',
    value: profit,
    formula: `₩${revenue.toLocaleString()} × ${(input.product_margin * 100).toFixed(0)}% = ₩${profit.toLocaleString()}`,
    unit: '원/일',
  });

  // Step 6: 총 비용 계산
  const totalCost = (input.implementation_cost || 0) + (input.opportunity_cost || 0);

  if (totalCost > 0) {
    breakdown.push({
      step: '총 비용',
      value: totalCost,
      formula: `구현비용(₩${(input.implementation_cost || 0).toLocaleString()}) + 기회비용(₩${(input.opportunity_cost || 0).toLocaleString()}) = ₩${totalCost.toLocaleString()}`,
      unit: '원',
    });
  }

  // Step 7: ROI 계산
  // ROI = (이익 - 비용) / 비용 × 100 (비용이 있을 경우)
  // ROI = 이익 기준 (비용이 없을 경우)
  let roi_percent: number;

  if (totalCost > 0) {
    // 월간 이익으로 ROI 계산 (30일 기준)
    const monthly_profit = profit * 30;
    roi_percent = ((monthly_profit - totalCost) / totalCost) * 100;

    breakdown.push({
      step: 'ROI',
      value: roi_percent,
      formula: `(₩${monthly_profit.toLocaleString()} - ₩${totalCost.toLocaleString()}) / ₩${totalCost.toLocaleString()} × 100 = ${roi_percent.toFixed(1)}%`,
      unit: '%/월',
    });
  } else {
    // 비용이 없으면 이익률 기반 ROI
    roi_percent = profit > 0 ? input.product_margin * 100 : 0;

    breakdown.push({
      step: 'ROI (마진 기준)',
      value: roi_percent,
      formula: `마진율 ${(input.product_margin * 100).toFixed(0)}% = ${roi_percent.toFixed(1)}%`,
      unit: '%',
    });
  }

  // Step 8: 신뢰도 계산
  const confidence = calculateROIConfidence(input);

  breakdown.push({
    step: '계산 신뢰도',
    value: confidence,
    formula: `입력 데이터 품질 기반 = ${(confidence * 100).toFixed(0)}%`,
  });

  // Step 9: 비교 지표 생성
  const comparison_metrics = generateComparisonMetrics(
    roi_percent,
    effective_conversion,
    profit,
    input.category_avg_conversion
  );

  // Step 10: 권장 사항 생성
  const recommendation = generateRecommendation(
    roi_percent,
    profit,
    totalCost,
    comparison_metrics
  );

  return {
    expected_impressions: impressions,
    expected_conversions: conversions,
    expected_revenue: revenue,
    expected_profit: profit,
    roi_percent: Math.round(roi_percent * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    calculation_breakdown: breakdown,
    recommendation,
    comparison_metrics,
  };
}

// ============================================================================
// 보조 계산 함수
// ============================================================================

/**
 * ROI 계산 신뢰도 산정
 */
function calculateROIConfidence(input: ROIInput): number {
  let score = 0.5; // 기본 점수

  // 필수 데이터 품질 확인
  if (input.zone_traffic > 0) score += 0.1;
  if (input.product_visibility > 0 && input.product_visibility <= 1) score += 0.1;
  if (input.base_conversion_rate > 0 && input.base_conversion_rate <= 1) score += 0.1;
  if (input.product_price > 0) score += 0.05;
  if (input.product_margin > 0 && input.product_margin <= 1) score += 0.05;

  // 선택적 데이터 존재 시 추가 점수
  if (input.category_avg_conversion !== undefined) score += 0.05;
  if (input.avg_purchase_quantity !== undefined) score += 0.025;
  if (input.position_bonus !== undefined) score += 0.025;

  return Math.min(1, score);
}

/**
 * 비교 지표 생성
 */
function generateComparisonMetrics(
  roi: number,
  conversionRate: number,
  profit: number,
  categoryAvgConversion?: number
): ComparisonMetrics {
  // ROI 업계 평균 대비
  const vs_industry_avg: ComparisonMetrics['vs_industry_avg'] =
    roi > INDUSTRY_AVG_ROI * 1.2 ? 'above' :
    roi < INDUSTRY_AVG_ROI * 0.8 ? 'below' : 'at';

  // 전환율 등급
  let conversion_grade: ComparisonMetrics['conversion_grade'] = 'F';
  for (const [grade, threshold] of Object.entries(CONVERSION_GRADE_THRESHOLDS)) {
    if (conversionRate >= threshold) {
      conversion_grade = grade as ComparisonMetrics['conversion_grade'];
      break;
    }
  }

  // 수익 등급
  let revenue_grade: ComparisonMetrics['revenue_grade'] = 'F';
  for (const [grade, threshold] of Object.entries(REVENUE_GRADE_THRESHOLDS)) {
    if (profit >= threshold) {
      revenue_grade = grade as ComparisonMetrics['revenue_grade'];
      break;
    }
  }

  return {
    vs_industry_avg,
    revenue_grade,
    conversion_grade,
  };
}

/**
 * 권장 사항 생성
 */
function generateRecommendation(
  roi: number,
  profit: number,
  cost: number,
  metrics: ComparisonMetrics
): ROIRecommendation {
  // ROI 기반 액션 결정
  let action: ROIRecommendation['action'];
  let priority: ROIRecommendation['priority'];
  let reasoning: string;

  if (roi >= 50) {
    action = 'strongly_recommend';
    priority = 'critical';
    reasoning = `ROI ${roi.toFixed(1)}%로 매우 우수합니다. 즉시 적용을 권장합니다.`;
  } else if (roi >= 25) {
    action = 'recommend';
    priority = 'high';
    reasoning = `ROI ${roi.toFixed(1)}%로 양호합니다. 적용 시 유의미한 수익 개선이 예상됩니다.`;
  } else if (roi >= 10) {
    action = 'recommend';
    priority = 'medium';
    reasoning = `ROI ${roi.toFixed(1)}%로 업계 평균 수준입니다. 다른 요소와 함께 고려해 결정하세요.`;
  } else if (roi >= 0) {
    action = 'neutral';
    priority = 'low';
    reasoning = `ROI ${roi.toFixed(1)}%로 낮습니다. 전략적 목적이 있는 경우에만 적용을 고려하세요.`;
  } else {
    action = 'not_recommend';
    priority = 'low';
    reasoning = `ROI ${roi.toFixed(1)}%로 음수입니다. 비용 대비 효과가 낮아 권장하지 않습니다.`;
  }

  // 수익 등급에 따른 우선순위 조정
  if (metrics.revenue_grade === 'A' && priority !== 'critical') {
    priority = 'high';
    reasoning += ` 일일 수익이 높아 우선순위를 상향합니다.`;
  }

  // 페이백 기간 계산 (비용이 있는 경우)
  let payback_period_days: number | undefined;
  if (cost > 0 && profit > 0) {
    payback_period_days = Math.ceil(cost / profit);
  }

  return {
    action,
    priority,
    reasoning,
    payback_period_days,
  };
}

// ============================================================================
// 배치 계산 함수
// ============================================================================

/**
 * 여러 상품의 ROI 일괄 계산
 */
export function calculateROIBatch(inputs: ROIInput[]): ROIOutput[] {
  return inputs.map(input => calculateROI(input));
}

/**
 * ROI 계산 결과 요약
 */
export interface ROISummary {
  total_expected_revenue: number;
  total_expected_profit: number;
  avg_roi: number;
  weighted_avg_roi: number;
  high_roi_items: number;
  recommend_count: number;
  total_items: number;
}

export function summarizeROIResults(outputs: ROIOutput[]): ROISummary {
  if (outputs.length === 0) {
    return {
      total_expected_revenue: 0,
      total_expected_profit: 0,
      avg_roi: 0,
      weighted_avg_roi: 0,
      high_roi_items: 0,
      recommend_count: 0,
      total_items: 0,
    };
  }

  const total_expected_revenue = outputs.reduce(
    (sum, o) => sum + o.expected_revenue, 0
  );

  const total_expected_profit = outputs.reduce(
    (sum, o) => sum + o.expected_profit, 0
  );

  const avg_roi = outputs.reduce(
    (sum, o) => sum + o.roi_percent, 0
  ) / outputs.length;

  // 매출 가중 평균 ROI
  const weighted_avg_roi = total_expected_revenue > 0
    ? outputs.reduce((sum, o) => sum + (o.roi_percent * o.expected_revenue), 0) / total_expected_revenue
    : 0;

  const high_roi_items = outputs.filter(o => o.roi_percent >= 25).length;

  const recommend_count = outputs.filter(o =>
    o.recommendation.action === 'strongly_recommend' ||
    o.recommendation.action === 'recommend'
  ).length;

  return {
    total_expected_revenue,
    total_expected_profit,
    avg_roi: Math.round(avg_roi * 10) / 10,
    weighted_avg_roi: Math.round(weighted_avg_roi * 10) / 10,
    high_roi_items,
    recommend_count,
    total_items: outputs.length,
  };
}

// ============================================================================
// Gemini Function Calling 스키마 정의
// ============================================================================

/**
 * Gemini Tool Use를 위한 Function 정의
 */
export const ROI_FUNCTION_DECLARATION = {
  name: 'calculate_roi',
  description: '상품 배치 변경의 예상 ROI를 계산합니다. 노출수, 전환수, 매출, 이익, ROI 퍼센트 등을 반환합니다.',
  parameters: {
    type: 'object' as const,
    properties: {
      zone_traffic: {
        type: 'integer' as const,
        description: 'Zone의 일일 방문자 수',
      },
      product_visibility: {
        type: 'number' as const,
        description: '상품 가시성 (0-1 범위, 1이 가장 높음)',
      },
      position_bonus: {
        type: 'number' as const,
        description: '위치 보너스 (-0.3 ~ 0.4, 눈높이=0.4, 바닥=-0.15 등)',
      },
      base_conversion_rate: {
        type: 'number' as const,
        description: '상품의 기본 전환율 (0-1 범위)',
      },
      placement_bonus: {
        type: 'number' as const,
        description: '배치 변경으로 인한 전환율 보너스 (-0.2 ~ 0.5)',
      },
      product_price: {
        type: 'number' as const,
        description: '상품 가격 (원)',
      },
      product_margin: {
        type: 'number' as const,
        description: '상품 마진율 (0-1 범위)',
      },
      avg_purchase_quantity: {
        type: 'number' as const,
        description: '평균 구매 수량 (선택적, 기본값 1)',
      },
      implementation_cost: {
        type: 'number' as const,
        description: '배치 변경 구현 비용 (선택적)',
      },
    },
    required: ['zone_traffic', 'product_visibility', 'base_conversion_rate', 'placement_bonus', 'product_price', 'product_margin'],
  },
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 배치 위치에 따른 가시성 보너스 계산
 */
export function getPositionBonus(
  position: keyof typeof POSITION_VISIBILITY_BONUS
): number {
  return POSITION_VISIBILITY_BONUS[position] || 0;
}

/**
 * VMD 원칙에 따른 배치 보너스 계산
 */
export function getVMDPlacementBonus(
  placements: (keyof typeof VMD_PLACEMENT_BONUS)[]
): number {
  // 여러 VMD 원칙 적용 시 합산 (최대 0.7로 클램프)
  const total = placements.reduce(
    (sum, p) => sum + (VMD_PLACEMENT_BONUS[p] || 0), 0
  );
  return Math.min(0.7, total);
}

/**
 * 배치 변경 전후 ROI 비교
 */
export interface ROIComparison {
  before: ROIOutput;
  after: ROIOutput;
  improvement: {
    impressions_change: number;
    conversions_change: number;
    revenue_change: number;
    profit_change: number;
    roi_change: number;
  };
  recommendation: string;
}

export function compareROI(before: ROIInput, after: ROIInput): ROIComparison {
  const beforeResult = calculateROI(before);
  const afterResult = calculateROI(after);

  const improvement = {
    impressions_change: afterResult.expected_impressions - beforeResult.expected_impressions,
    conversions_change: afterResult.expected_conversions - beforeResult.expected_conversions,
    revenue_change: afterResult.expected_revenue - beforeResult.expected_revenue,
    profit_change: afterResult.expected_profit - beforeResult.expected_profit,
    roi_change: afterResult.roi_percent - beforeResult.roi_percent,
  };

  let recommendation: string;
  if (improvement.profit_change > 0 && improvement.roi_change > 0) {
    recommendation = `배치 변경 시 일일 이익이 ₩${improvement.profit_change.toLocaleString()} 증가하고 ROI가 ${improvement.roi_change.toFixed(1)}%p 개선됩니다. 적용을 권장합니다.`;
  } else if (improvement.profit_change > 0) {
    recommendation = `배치 변경 시 이익은 증가하나 ROI 효율은 감소합니다. 전략적 판단이 필요합니다.`;
  } else {
    recommendation = `배치 변경 시 이익이 감소합니다. 다른 대안을 검토하세요.`;
  }

  return {
    before: beforeResult,
    after: afterResult,
    improvement,
    recommendation,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculateROI,
  calculateROIBatch,
  summarizeROIResults,
  compareROI,
  getPositionBonus,
  getVMDPlacementBonus,
  ROI_FUNCTION_DECLARATION,
  // 상수 export
  POSITION_VISIBILITY_BONUS,
  VMD_PLACEMENT_BONUS,
  INDUSTRY_AVG_ROI,
};
