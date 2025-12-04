// ========================================
// 기존 Hooks (유지)
// ========================================
export { useAIInference } from './useAIInference';
export { useStoreContext } from './useStoreContext';
export { useContextData, useWeatherForecast, useEventCalendar, useEconomicIndicators } from './useContextData';

// Digital Twin hooks
export { useRealtimeTracking } from './useRealtimeTracking';

// ========================================
// Phase 2: 데이터 소스 매핑 (NEW)
// ========================================
export { useDataSourceMapping } from './useDataSourceMapping';
export type { 
  ImportedDataSource, 
  PresetApiSource, 
  CustomApiSource, 
  OntologyMappingStatus,
  ApiConfig
} from './useDataSourceMapping';

// ========================================
// Phase 3: 온톨로지 강화 AI 추론 (NEW)
// ========================================
export { useEnhancedAIInference } from './useEnhancedAIInference';
export type {
  SimulationScenario,
  OntologyContext,
  OntologySchema,
  OntologyEntityType,
  OntologyRelationType,
  SimulationParams,
  InferenceResult,
  OntologyInferenceResult,
} from './useEnhancedAIInference';
