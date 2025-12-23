/**
 * simulationResults.types.ts
 *
 * AI 시뮬레이션 결과 타입 정의
 * hooks와 utils 간 순환 참조를 방지하기 위해 분리
 */

import type {
  SimulationStatus,
  ConfidenceDetails,
  Bottleneck,
  SimulatedPath,
  DisplayType,
  SlotType,
  ProductPlacement,
  SlotCompatibilityInfo,
} from './simulation.types';

// ============================================================================
// 레이아웃 시뮬레이션 결과
// ============================================================================

export interface LayoutSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

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
  furnitureMoves: Array<{
    furnitureId: string;
    furnitureName?: string;
    fromPosition?: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    suggestedPosition?: { x: number; y: number; z: number };
    rotation?: number;
    reason?: string;
  }>;

  // 🆕 슬롯 기반 상품 배치 제안
  productPlacements?: ProductPlacement[];

  zoneChanges: Array<{
    zoneId: string;
    zoneName: string;
    changeType: string;
    before: any;
    after: any;
    reason?: string;
  }>;

  // 신뢰도 (확장)
  confidence: ConfidenceDetails & {
    factors: ConfidenceDetails['factors'] & {
      slotDataAvailable?: number;
    };
  };

  // AI 인사이트
  insights: string[];
  warnings?: string[];

  // 🆕 레이아웃 변경 사항 (furnitureMoves의 별칭으로 사용될 수 있음)
  layoutChanges?: Array<{
    furnitureId: string;
    furnitureName: string;
    fromPosition: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    rotation?: number;
    reason?: string;
  }>;

  // 🆕 최적화 요약 정보
  optimizationSummary?: {
    totalChanges: number;
    expectedRevenueIncrease: number;
    expectedConversionIncrease: number;
    confidence: number;
  };

  // 🆕 데이터 소스 메타데이터
  dataSource?: {
    usedRealData: boolean;
    usedSlotSystem: boolean;
    zonesAvailable: number;
    zoneMetricsAvailable: number;
    visitsAvailable: number;
    slotsAvailable: number;
    furnitureAvailable: number;
    productsAvailable: number;
    note: string;
  };

  // 🆕 슬롯 호환성 정보
  slotCompatibility?: SlotCompatibilityInfo | null;

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
      zoneId?: string;
      position?: { x: number; y: number; z: number };
      color?: string;
      opacity?: number;
      type?: string;
      changeType?: 'improved' | 'degraded' | 'new' | 'removed' | 'suggested';
    }>;
  };
}

// ============================================================================
// 동선 시뮬레이션 결과
// ============================================================================

// 동선 포인트
export interface FlowPoint {
  x: number;
  y: number;
  z: number;
  t: number;
  speed?: number;
  dwell?: boolean;
}

// 동선 경로
export interface FlowPath {
  id: string;
  customerId: string;
  customerType: string;
  points: FlowPoint[];
  totalTime: number;
  totalDistance: number;
  dwellZones: Array<{
    zoneId: string;
    zoneName: string;
    duration: number;
  }>;
  purchaseIntent: number;
  converted: boolean;
}

// 동선 병목
export interface FlowBottleneck {
  id: string;
  position: { x: number; y: number; z: number };
  zoneName: string;
  severity: number;
  avgWaitTime: number;
  frequency: number;
  cause: string;
  suggestions: string[];
  impactLevel: 'high' | 'medium' | 'low';
  affectedCustomers: number;
}

export interface FlowSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  summary: {
    totalCustomers: number;
    avgTravelTime: number;
    avgTravelDistance: number;
    avgDwellTime: number;
    conversionRate: number;
    bottleneckCount: number;
  };

  // 현재 vs 최적화 비교
  comparison: {
    currentPathLength: number;
    optimizedPathLength: number;
    pathLengthReduction: number;
    currentAvgTime: number;
    optimizedAvgTime: number;
    timeReduction: number;
    congestionReduction: number;
  };

  // 경로 데이터 (3D 시각화용)
  paths: FlowPath[];

  // 상세 데이터
  bottlenecks: FlowBottleneck[];

  optimizations: Array<{
    id: string;
    type: 'layout_change' | 'signage' | 'staff_position' | 'zone_resize';
    description: string;
    location: { x: number; y: number; z: number };
    expectedImprovement: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;

  // 존별 분석
  zoneAnalysis: Array<{
    zoneId: string;
    zoneName: string;
    visitCount: number;
    avgDwellTime: number;
    congestionLevel: number;
    conversionContribution: number;
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];

  // 3D 시각화 데이터
  visualization: {
    animatedPaths: Array<{
      id: string;
      points: FlowPoint[];
      color: string;
      type: 'current' | 'optimized';
    }>;
    bottleneckMarkers: Array<{
      position: { x: number; y: number; z: number };
      severity: number;
      radius: number;
    }>;
    flowHeatmap: Array<{
      x: number;
      z: number;
      density: number;
    }>;
    zoneFlowArrows: Array<{
      from: { x: number; y: number; z: number };
      to: { x: number; y: number; z: number };
      volume: number;
    }>;
  };
}

// ============================================================================
// 혼잡도 시뮬레이션 결과
// ============================================================================

export interface CongestionSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  summary: {
    peakHour: number;
    peakDensity: number;
    avgDensity: number;
    bottleneckCount: number;
  };

  // 시간별 혼잡도
  hourlyData: Array<{
    hour: number;
    avgDensity: number;
    peakDensity: number;
    customerCount: number;
  }>;

  // 존별 혼잡도
  zoneData: Array<{
    zoneId: string;
    zoneName: string;
    avgDensity: number;
    peakDensity: number;
    peakHour: number;
    recommendations: string[];
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];
}

// ============================================================================
// 인력 배치 시뮬레이션 결과
// ============================================================================

export interface StaffingSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  metrics: {
    totalCoverage: number;
    avgResponseTime: number;
    coverageGain: number;
    customerServiceRateIncrease: number;
  };

  // 인력 위치 데이터
  staffPositions: Array<{
    staffId: string;
    staffName: string;
    currentPosition: { x: number; y: number; z: number };
    suggestedPosition: { x: number; y: number; z: number };
    coverageGain: number;
    reason: string;
  }>;

  // 존별 커버리지
  zoneCoverage: Array<{
    zoneId: string;
    zoneName: string;
    currentCoverage: number;
    suggestedCoverage: number;
    requiredStaff: number;
    currentStaff: number;
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];
}
