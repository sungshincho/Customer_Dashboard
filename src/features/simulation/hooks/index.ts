// SimulationHub v2 Phase 3 Hooks

// Phase 2
export { useDataSourceMapping } from './useDataSourceMapping';
export type { 
  ImportedDataSource, 
  PresetApiSource, 
  CustomApiSource, 
  OntologyMappingStatus,
  ApiConfig
} from './useDataSourceMapping';

// Phase 3 - NEW
export { useEnhancedAIInference } from './useEnhancedAIInference';
export type {
  SimulationScenario,
  OntologyContext,
  SimulationParams,
  InferenceResult,
  OntologyInferenceResult,
} from './useEnhancedAIInference';
