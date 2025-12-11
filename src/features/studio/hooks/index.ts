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
  FlowBottleneck,
  UseFlowSimulationReturn,
} from './useFlowSimulation';

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

// SceneProvider 훅들 re-export
export {
  useScene,
  useSceneMode,
  useSceneSelection,
  useSceneModels,
  useSceneOverlays,
  useSceneLayers,
} from '../core/SceneProvider';
