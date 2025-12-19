/**
 * hooks/index.ts
 *
 * 커스텀 훅 익스포트
 */

export { useStudioMode } from './useStudioMode';
export { useOverlayVisibility } from './useOverlayVisibility';
export { useScenePersistence } from './useScenePersistence';

// AI 시뮬레이션 훅
export { useLayoutSimulation } from './useLayoutSimulation';
export { useFlowSimulation } from './useFlowSimulation';
export { useCongestionSimulation } from './useCongestionSimulation';
export { useStaffingSimulation } from './useStaffingSimulation';

// 씬 기반 시뮬레이션 통합 훅
export { useSceneSimulation } from './useSceneSimulation';

// SceneRecipe 연동 훅
export { useSceneRecipe, useSlotInfo, modelsToRecipe } from './useSceneRecipe';

// 가구 슬롯 관리 훅
export {
  useFurnitureSlots,
  calculateSlotWorldPosition,
  isSlotCompatible,
  doesProductFitSlot,
} from './useFurnitureSlots';

// AI 최적화 훅
export { useOptimization } from './useOptimization';

// 매장 경계/입구 위치 훅
export { useStoreBounds } from './useStoreBounds';
export type {
  StoreBounds,
  EntrancePosition,
  ZoneDimData,
} from './useStoreBounds';

// 스태프 데이터 훅
export { useStaffData, getStaffColor, STAFF_ROLE_COLORS } from './useStaffData';
export type { StaffMember } from './useStaffData';

// 배치 저장/관리 훅
export { usePlacement } from './usePlacement';

// 타입 re-export
export type {
  LayoutSimulationParams,
  LayoutSimulationResult,
  UseLayoutSimulationReturn,
} from './useLayoutSimulation';

export type {
  FlowSimulationParams,
  FlowSimulationResult,
  FlowPath,
  UseFlowSimulationReturn,
} from './useFlowSimulation';
// FlowBottleneck은 types/simulationResults.types.ts에서 export됨

export type {
  CongestionSimulationParams,
  CongestionSimulationResult,
  HourlyCongestion,
  ZoneCongestion,
  UseCongestionSimulationReturn,
} from './useCongestionSimulation';

export type {
  StaffingSimulationParams,
  StaffingSimulationResult,
  StaffPosition,
  ZoneCoverage,
  UseStaffingSimulationReturn,
} from './useStaffingSimulation';

export type {
  SimulationType,
  SimulationRequest,
  SimulationResults,
  SceneSimulationState,
  UseSceneSimulationReturn,
} from './useSceneSimulation';

export type {
  UseSceneRecipeOptions,
  UseSceneRecipeReturn,
} from './useSceneRecipe';

export type {
  UseFurnitureSlotsOptions,
  UseFurnitureSlotsReturn,
} from './useFurnitureSlots';

export type {
  UseOptimizationOptions,
  UseOptimizationReturn,
  OptimizationStatus,
  OptimizationHistoryItem,
  GenerateOptimizationParams,
} from './useOptimization';

export type {
  UsePlacementOptions,
  UsePlacementReturn,
  PlacementChange,
  PlacementHistoryEntry,
} from './usePlacement';

// SceneProvider 훅들 re-export
export {
  useScene,
  useSceneMode,
  useSceneSelection,
  useSceneModels,
  useSceneOverlays,
  useSceneLayers,
} from '../core/SceneProvider';
