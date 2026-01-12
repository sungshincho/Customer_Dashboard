/**
 * PRESCRIPTIVE_JSON_SCHEMA.ts
 *
 * 통합 AI 응답 TypeScript 인터페이스
 * 모든 AI Edge Function이 준수해야 할 응답 스키마
 *
 * 작성일: 2026-01-12
 * 프로젝트: NEURALTWIN - AI 고도화 스프린트
 */

// ============================================================================
// 공통 타입 정의
// ============================================================================

/** 3D 좌표 */
export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

/** 우선순위 레벨 */
export type Priority = 'high' | 'medium' | 'low';

/** 리스크 레벨 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 구현 난이도 */
export type ImplementationDifficulty = 'easy' | 'medium' | 'hard';

/** 선반 레벨 (VMD 골든존 분석용) */
export type ShelfLevel = 'floor' | 'bottom' | 'middle' | 'eye_level' | 'top';

// ============================================================================
// VMD 원칙 및 배치 전략
// ============================================================================

/** VMD 원칙 */
export type VMDPrinciple =
  | 'focal_point_creation'      // 포컬포인트 생성
  | 'traffic_flow_optimization' // 동선 최적화
  | 'bottleneck_resolution'     // 병목 해소
  | 'dead_zone_activation'      // 데드존 활성화
  | 'sightline_improvement'     // 시야선 개선
  | 'accessibility_enhancement' // 접근성 향상
  | 'cross_sell_proximity'      // 크로스셀 근접 배치
  | 'negative_space_balance';   // 여백 균형

/** 배치 전략 */
export type PlacementStrategy =
  | 'golden_zone_placement'     // 골든존 배치
  | 'eye_level_optimization'    // 아이레벨 최적화
  | 'impulse_buy_position'      // 충동구매 위치
  | 'cross_sell_bundle'         // 크로스셀 번들
  | 'high_margin_spotlight'     // 고마진 스포트라이트
  | 'slow_mover_activation'     // 저회전 상품 활성화
  | 'seasonal_highlight'        // 시즌 하이라이트
  | 'new_arrival_feature'       // 신상품 피처링
  | 'clearance_optimization'    // 클리어런스 최적화
  | 'hero_product_display';     // 히어로 상품 진열

/** 인력 배치 전략 */
export type StaffingStrategy =
  | 'peak_coverage'             // 피크타임 커버리지
  | 'bottleneck_support'        // 병목 지원
  | 'high_value_zone_focus'     // 고가치 존 집중
  | 'cross_zone_flexibility'    // 교차 존 유연배치
  | 'customer_service_boost'    // 고객 서비스 강화
  | 'queue_management'          // 대기줄 관리
  | 'fitting_room_priority'     // 피팅룸 우선 배치
  | 'entrance_greeting';        // 입구 환영 서비스

// ============================================================================
// 최적화 액션 타입
// ============================================================================

/** 액션 타입 */
export type ActionType = 'MOVE' | 'ADD' | 'REMOVE' | 'ROTATE' | 'SWAP' | 'RESIZE';

/** 기본 액션 인터페이스 */
export interface BaseAction {
  action_type: ActionType;
  target: {
    id: string;
    name: string;
    type: 'furniture' | 'product' | 'zone' | 'staff';
  };
  instruction: {
    from?: Coordinate;
    to?: Coordinate;
    rotation_delta?: Coordinate;
    reason: string;
    rule_applied?: string;  // VMD 룰 코드 참조 (예: "VMD-001")
    data_evidence?: string; // 데이터 기반 근거
  };
  impact_prediction: {
    metric: string;
    current_value?: number;
    predicted_value: number;
    change_percent: number;
    confidence: number;
    calculation_breakdown?: {
      step: string;
      value: number;
      formula: string;
    }[];
  };
}

// ============================================================================
// 가구 변경 스키마
// ============================================================================

export interface FurnitureChange {
  furniture_id: string;
  furniture_type: string;
  movable: boolean;

  current: {
    zone_id: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  suggested: {
    zone_id: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  vmd_principle: VMDPrinciple;
  reason: string;
  priority: Priority;

  expected_impact: {
    traffic_change: number;      // -0.5 ~ 0.5
    dwell_time_change?: number;
    visibility_score?: number;   // 0-100
    confidence: number;          // 0-1
  };

  risk_level?: RiskLevel;
  implementation_difficulty?: ImplementationDifficulty;
}

// ============================================================================
// 상품 변경 스키마
// ============================================================================

export interface ProductChange {
  product_id: string;
  sku: string;

  current: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
  };

  suggested: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
  };

  placement_strategy: {
    type: PlacementStrategy;
    associated_products?: string[];  // 연관 상품 ID
    association_rule?: {
      confidence: number;  // 0-1
      lift: number;        // 1 이상
      support: number;     // 0-1
    };
  };

  reason: string;
  priority: Priority;

  expected_impact: {
    revenue_change: number;      // -0.5 ~ 1.0
    visibility_change?: number;
    conversion_change?: number;
    units_per_transaction_change?: number;
    confidence: number;
  };

  slot_compatibility?: {
    is_compatible: boolean;
    display_type_match: boolean;
    size_fit: 'exact' | 'acceptable' | 'tight';
  };
}

// ============================================================================
// 레이아웃 최적화 응답 스키마
// ============================================================================

export interface LayoutOptimizationResponse {
  /** 추론 요약 (500자 이내) */
  reasoning_summary?: string;

  /** 가구 변경 목록 */
  furniture_changes: FurnitureChange[];

  /** 상품 변경 목록 */
  product_changes: ProductChange[];

  /** 종합 요약 */
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;

    expected_revenue_improvement: number;  // 0.05 = 5%
    expected_traffic_improvement?: number;
    expected_conversion_improvement: number;

    confidence_score: number;  // 0-1

    key_strategies?: string[];  // 핵심 전략 (3개 이내)
    ai_insights: string[];      // AI 인사이트 (3-5개)

    issues_addressed?: {
      issue_id: string;
      issue_type: string;
      resolution_approach: string;
      expected_resolution_rate: number;
    }[];

    risk_factors?: string[];
    environmental_adaptations?: string[];
  };

  /** 메타데이터 */
  _meta?: {
    model_version: string;
    generation_timestamp: string;
    processing_time_ms: number;
    fallback_used: boolean;
  };
}

// ============================================================================
// 인력 배치 최적화 응답 스키마
// ============================================================================

export interface StaffPosition {
  staffId: string;
  staffCode?: string;
  staffName?: string;
  role: string;
  currentPosition: Coordinate;
  suggestedPosition: Coordinate;
  current_zone?: string;
  suggested_zone?: string;
  assignment_strategy: StaffingStrategy;
  coverageGain?: number;
  reason: string;
}

export interface ZoneCoverage {
  zoneId: string;
  zoneName: string;
  currentCoverage: number;
  suggestedCoverage: number;
  requiredStaff?: number;
  currentStaff?: number;
}

export interface StaffOptimizationResponse {
  staffPositions: StaffPosition[];
  zoneCoverage: ZoneCoverage[];
  metrics: {
    totalCoverage: number;
    avgResponseTime?: number;
    coverageGain: number;
    customerServiceRateIncrease: number;
  };
  insights: string[];
  confidence: number;
}

// ============================================================================
// 시뮬레이션 응답 스키마
// ============================================================================

export interface DiagnosticIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type?: string;
  title: string;
  message?: string;
  zone?: string;
  zone_id?: string;
  zone_name?: string;
  recommendation?: string;
  impact?: {
    metric: string;
    current_value: number;
    potential_improvement: number;
  };
}

export interface ZoneAnalytic {
  zone_id: string;
  zone_name: string;
  zone_type: string;
  metrics: {
    visitor_count: number;
    avg_dwell_time_seconds: number;
    conversion_rate: number;
    congestion_score: number;  // 0-1
    revenue_contribution: number;
  };
  issues?: DiagnosticIssue[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  z: number;
  intensity: number;  // 0-1
  type: 'traffic' | 'dwell' | 'conversion';
}

export interface SimulationResponse {
  scenario_id: string;
  scenario_type: 'baseline' | 'what-if' | 'comparison';

  metrics: {
    total_visitors: number;
    conversion_rate: number;
    avg_dwell_time: number;
    revenue_estimate: number;
    avg_basket_size?: number;
    peak_hour?: number;
  };

  zone_analytics: ZoneAnalytic[];
  heatmap_data: HeatmapPoint[];
  diagnostic_issues: DiagnosticIssue[];

  comparison?: {
    baseline_metrics: SimulationResponse['metrics'];
    improvement: {
      visitors_change: number;
      conversion_change: number;
      revenue_change: number;
    };
  };

  confidence: number;

  /** 폴백 여부 표시 */
  _fallback?: boolean;
}

// ============================================================================
// 통합 AI 응답 타입
// ============================================================================

export type AIResponseType =
  | 'layout_optimization'
  | 'staff_optimization'
  | 'simulation'
  | 'demand_forecast'
  | 'customer_segment'
  | 'recommendation';

export interface AIResponse<T = unknown> {
  success: boolean;
  type: AIResponseType;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    request_id: string;
    model_used: string;
    processing_time_ms: number;
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timestamp: string;
  };
}

// ============================================================================
// 타입 가드 함수
// ============================================================================

export function isLayoutOptimizationResponse(
  data: unknown
): data is LayoutOptimizationResponse {
  const obj = data as LayoutOptimizationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.furniture_changes) &&
    Array.isArray(obj.product_changes) &&
    typeof obj.summary === 'object' &&
    typeof obj.summary.confidence_score === 'number'
  );
}

export function isSimulationResponse(
  data: unknown
): data is SimulationResponse {
  const obj = data as SimulationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.scenario_id === 'string' &&
    typeof obj.metrics === 'object' &&
    Array.isArray(obj.zone_analytics)
  );
}

export function isStaffOptimizationResponse(
  data: unknown
): data is StaffOptimizationResponse {
  const obj = data as StaffOptimizationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.staffPositions) &&
    Array.isArray(obj.zoneCoverage) &&
    typeof obj.metrics === 'object'
  );
}

// ============================================================================
// JSON Schema for Gemini API (런타임 스키마)
// ============================================================================

export const LAYOUT_OPTIMIZATION_JSON_SCHEMA = {
  type: 'object',
  required: ['furniture_changes', 'product_changes', 'summary'],
  additionalProperties: false,
  properties: {
    reasoning_summary: {
      type: 'string',
      description: '핵심 최적화 전략 요약 (500자 이내)',
    },
    furniture_changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['furniture_id', 'furniture_type', 'current', 'suggested',
                   'reason', 'priority', 'vmd_principle', 'expected_impact'],
        properties: {
          furniture_id: { type: 'string' },
          furniture_type: { type: 'string' },
          movable: { type: 'boolean' },
          current: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },
          suggested: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },
          vmd_principle: { type: 'string' },
          reason: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          expected_impact: {
            type: 'object',
            required: ['traffic_change', 'confidence'],
            properties: {
              traffic_change: { type: 'number' },
              dwell_time_change: { type: 'number' },
              visibility_score: { type: 'number' },
              confidence: { type: 'number' },
            },
          },
          risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          implementation_difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
      },
    },
    product_changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['product_id', 'sku', 'current', 'suggested',
                   'reason', 'priority', 'placement_strategy', 'expected_impact'],
        properties: {
          product_id: { type: 'string' },
          sku: { type: 'string' },
          current: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              shelf_level: { type: 'string' },
            },
          },
          suggested: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              shelf_level: { type: 'string' },
            },
          },
          placement_strategy: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string' },
              associated_products: { type: 'array', items: { type: 'string' } },
            },
          },
          reason: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          expected_impact: {
            type: 'object',
            required: ['revenue_change', 'confidence'],
            properties: {
              revenue_change: { type: 'number' },
              visibility_change: { type: 'number' },
              conversion_change: { type: 'number' },
              confidence: { type: 'number' },
            },
          },
        },
      },
    },
    summary: {
      type: 'object',
      required: ['total_furniture_changes', 'total_product_changes',
                 'expected_revenue_improvement', 'expected_conversion_improvement',
                 'confidence_score', 'ai_insights'],
      properties: {
        total_furniture_changes: { type: 'integer' },
        total_product_changes: { type: 'integer' },
        expected_revenue_improvement: { type: 'number' },
        expected_traffic_improvement: { type: 'number' },
        expected_conversion_improvement: { type: 'number' },
        confidence_score: { type: 'number' },
        key_strategies: { type: 'array', items: { type: 'string' } },
        ai_insights: { type: 'array', items: { type: 'string' } },
        risk_factors: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

export const SIMULATION_JSON_SCHEMA = {
  type: 'object',
  required: ['scenario_id', 'metrics', 'zone_analytics', 'diagnostic_issues', 'confidence'],
  additionalProperties: false,
  properties: {
    scenario_id: { type: 'string' },
    scenario_type: { type: 'string', enum: ['baseline', 'what-if', 'comparison'] },
    metrics: {
      type: 'object',
      required: ['total_visitors', 'conversion_rate', 'avg_dwell_time', 'revenue_estimate'],
      properties: {
        total_visitors: { type: 'integer' },
        conversion_rate: { type: 'number' },
        avg_dwell_time: { type: 'number' },
        revenue_estimate: { type: 'number' },
        avg_basket_size: { type: 'number' },
        peak_hour: { type: 'integer' },
      },
    },
    zone_analytics: {
      type: 'array',
      items: {
        type: 'object',
        required: ['zone_id', 'zone_name', 'zone_type', 'metrics'],
        properties: {
          zone_id: { type: 'string' },
          zone_name: { type: 'string' },
          zone_type: { type: 'string' },
          metrics: {
            type: 'object',
            properties: {
              visitor_count: { type: 'integer' },
              avg_dwell_time_seconds: { type: 'number' },
              conversion_rate: { type: 'number' },
              congestion_score: { type: 'number' },
              revenue_contribution: { type: 'number' },
            },
          },
        },
      },
    },
    heatmap_data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
          intensity: { type: 'number' },
          type: { type: 'string' },
        },
      },
    },
    diagnostic_issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'severity', 'title'],
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
          type: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          zone: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    confidence: { type: 'number' },
  },
} as const;

// ============================================================================
// Export
// ============================================================================

export default {
  LAYOUT_OPTIMIZATION_JSON_SCHEMA,
  SIMULATION_JSON_SCHEMA,
  isLayoutOptimizationResponse,
  isSimulationResponse,
  isStaffOptimizationResponse,
};
