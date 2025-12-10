/**
 * simulation.types.ts
 *
 * 시뮬레이션 관련 타입 정의
 */

// 시뮬레이션 시나리오 타입
export type SimulationScenario =
  | 'demand'
  | 'inventory'
  | 'layout'
  | 'pricing'
  | 'marketing'
  | 'staffing'
  | 'congestion'
  | 'flow';

// 시뮬레이션 상태
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error';

// 시뮬레이션 설정
export interface SimulationConfig {
  id: SimulationScenario;
  name: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

// 시뮬레이션 파라미터
export interface SimulationParameters {
  dataRange: number; // days
  forecastPeriod: number; // days
  confidenceLevel: number; // 0-1
  targetMetric?: string;
  constraints?: Record<string, any>;
}

// 시뮬레이션 결과
export interface SimulationResult {
  scenarioId: SimulationScenario;
  status: SimulationStatus;
  startTime: string;
  endTime?: string;
  kpis: KpiDelta[];
  recommendations: Recommendation[];
  confidence: ConfidenceDetails;
  insights: string[];
  visualData?: any;
}

// KPI 델타
export interface KpiDelta {
  name: string;
  baseline: number;
  predicted: number;
  delta: number;
  deltaPercent: number;
  unit?: string;
}

// 추천 사항
export interface Recommendation {
  id: string;
  type: 'action' | 'insight' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: string;
  priority: number;
}

// 신뢰도 상세
export interface ConfidenceDetails {
  overall: number;
  factors: {
    dataQuality: number;
    modelAccuracy: number;
    sampleSize: number;
    variability: number;
  };
}

// 수요 예측 결과
export interface DemandForecastResult {
  productId: string;
  productName: string;
  currentDemand: number;
  predictedDemand: number;
  trend: 'up' | 'down' | 'stable';
  seasonality: number[];
  confidence: number;
}

// 재고 최적화 결과
export interface InventoryOptimizationResult {
  productId: string;
  productName: string;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  stockoutRisk: number;
  overstockCost: number;
}

// 가격 최적화 결과
export interface PricingOptimizationResult {
  productId: string;
  productName: string;
  currentPrice: number;
  optimalPrice: number;
  elasticity: number;
  expectedRevenue: number;
  expectedVolume: number;
  margin: number;
}

// 레이아웃 최적화 결과
export interface LayoutOptimizationResult {
  zoneChanges: ZoneChange[];
  furnitureMoves: FurnitureMove[];
  expectedImprovement: {
    traffic: number;
    conversion: number;
    revenue: number;
  };
  heatmapBefore?: any;
  heatmapAfter?: any;
}

// 존 변경
export interface ZoneChange {
  zoneId: string;
  zoneName: string;
  changeType: 'resize' | 'move' | 'merge' | 'split';
  before: any;
  after: any;
}

// 가구 이동
export interface FurnitureMove {
  furnitureId: string;
  furnitureName: string;
  fromPosition: { x: number; y: number; z: number };
  toPosition: { x: number; y: number; z: number };
  rotation?: number;
}

// 동선 시뮬레이션 결과
export interface FlowSimulationResult {
  paths: SimulatedPath[];
  bottlenecks: Bottleneck[];
  avgTravelTime: number;
  avgTravelDistance: number;
  congestionPoints: CongestionPoint[];
}

// 시뮬레이션된 경로
export interface SimulatedPath {
  id: string;
  points: { x: number; y: number; z: number; t: number }[];
  customerType: string;
  totalTime: number;
  totalDistance: number;
}

// 병목 지점
export interface Bottleneck {
  position: { x: number; y: number; z: number };
  severity: number;
  avgWaitTime: number;
  frequency: number;
}

// 혼잡 지점
export interface CongestionPoint {
  position: { x: number; y: number; z: number };
  density: number;
  peakTime: string;
  duration: number;
}

// 인력 배치 시뮬레이션 결과
export interface StaffingSimulationResult {
  currentStaff: number;
  optimalStaff: number;
  schedule: StaffSchedule[];
  costSavings: number;
  serviceImprovement: number;
}

// 인력 스케줄
export interface StaffSchedule {
  timeSlot: string;
  requiredStaff: number;
  currentStaff: number;
  gap: number;
}

// 시뮬레이션 히스토리 항목
export interface SimulationHistoryItem {
  id: string;
  scenario: SimulationScenario;
  status: SimulationStatus;
  createdAt: string;
  completedAt?: string;
  parameters: SimulationParameters;
  result?: SimulationResult;
  userId: string;
  storeId: string;
}
