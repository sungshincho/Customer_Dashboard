// ============================================================================
// Hooks Index - 중앙 집중식 훅 내보내기
// ============================================================================

// ============================================================================
// 인증 및 스토어 선택
// ============================================================================
export { useAuth } from './useAuth';
export { useSelectedStore } from './useSelectedStore';

// ============================================================================
// AI 훅 (통합)
// ============================================================================
export {
  useAI,
  useSimulationAI,
  useGenerateRecommendations,
  useOntologyRecommendation,
  useInferRelations,
  useAnomalyDetection,
  usePatternAnalysis,
  useRetailAIInference,
  useAIInferenceHistory,
  useAIRecommendations,
} from './useAI';

export type {
  UnifiedAIAction,
  RetailAIInferenceType,
  AIInferenceType,
  AIRequest,
  AIRecommendation,
  AIInferenceResult,
} from './useAI';

// Legacy AI hooks (하위 호환성)
export { useUnifiedAI } from './useUnifiedAI';
export type {
  UnifiedAIRequest,
  GeneratedRecommendation,
  OntologyRecommendation,
  DetectedAnomaly,
  GraphPattern,
  InferredRelation,
} from './useUnifiedAI';

export { useAIRecommendations as useLegacyAIRecommendations } from './useAIRecommendations';
export { useOntologyInference } from './useOntologyInference';

// ============================================================================
// 리테일 데이터 훅
// ============================================================================
export {
  useZones,
  useZoneDailyMetrics,
  useDailyKPIs,
  useLatestKPI,
  useStoreVisits,
  useRetailConcepts,
  useZoneConversionFunnel,
  useCrossSellAffinity,
  useDataSources,
  useSyncDataSource,
} from './useRetailData';

export type {
  ZoneDim,
  ZoneDailyMetric,
  DailyKPI,
  StoreVisit,
  DataSource,
} from './useRetailData';

// ============================================================================
// 온톨로지 훅
// ============================================================================
export * from './useOntologyData';
export { useOntologySchema } from './useOntologySchema';
export * from './useRetailOntology';

// ============================================================================
// 대시보드 KPI 훅
// ============================================================================
export { useDashboardKPI } from './useDashboardKPI';
export * from './useDashboardKPIAgg';

// ============================================================================
// 고객 분석 훅
// ============================================================================
export { useCustomerJourney } from './useCustomerJourney';
export { useCustomerSegments } from './useCustomerSegments';
export { useCustomerSegmentsAgg } from './useCustomerSegmentsAgg';
export { usePurchasePatterns } from './usePurchasePatterns';

// ============================================================================
// 구역/트래픽 훅
// ============================================================================
export * from './useZoneMetrics';
export { useZoneTransition } from './useZoneTransition';
export { useTrafficHeatmap } from './useTrafficHeatmap';
export { useDwellTime } from './useDwellTime';
export { useFootfallAnalysis } from './useFootfallAnalysis';
export { useFunnelAnalysis } from './useFunnelAnalysis';

// ============================================================================
// 상품 훅
// ============================================================================
export * from './useProductPerformance';

// ============================================================================
// 매장 훅
// ============================================================================
export * from './useStoreData';
export { useStoreScene } from './useStoreScene';
export { useRealtimeInventory } from './useRealtimeInventory';

// ============================================================================
// 데이터 관리 훅
// ============================================================================
export { useDataReadiness } from './useDataReadiness';
export { useImportProgress } from './useImportProgress';
export { useUploadSession } from './useUploadSession';
export { useSchemaMetadata } from './useSchemaMetadata';
export { usePOSIntegration } from './usePOSIntegration';
export * from './useRealSampleData';
export { useWiFiTracking } from './useWiFiTracking';

// ============================================================================
// 알림 및 목표 훅
// ============================================================================
export { useAlerts } from './useAlerts';
export * from './useGoals';

// ============================================================================
// ROI 및 학습 훅
// ============================================================================
export * from './useROITracking';
export * from './useLearningFeedback';

// ============================================================================
// 온보딩 및 커뮤니케이션 훅
// ============================================================================
export * from './useOnboarding';
export * from './useHQCommunication';

// ============================================================================
// 유틸리티 훅
// ============================================================================
export { useClearCache } from './useClearCache';
export { useToast, toast } from './use-toast';

// ============================================================================
// 시뮬레이션 훅
// ============================================================================
export { useSimulationEngine } from './useSimulationEngine';
