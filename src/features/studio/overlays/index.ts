/**
 * overlays/index.ts
 *
 * 오버레이 컴포넌트 익스포트
 */

// 기본 오버레이 컴포넌트
export { HeatmapOverlay } from './HeatmapOverlay';
export { CustomerFlowOverlay } from './CustomerFlowOverlay';
export { ZoneBoundaryOverlay } from './ZoneBoundaryOverlay';
export { CustomerAvatarOverlay } from './CustomerAvatarOverlay';

// AI 시뮬레이션 오버레이 컴포넌트
export { LayoutOptimizationOverlay } from './LayoutOptimizationOverlay';
export { FlowOptimizationOverlay } from './FlowOptimizationOverlay';
export { CongestionOverlay } from './CongestionOverlay';
export { StaffingOverlay } from './StaffingOverlay';

// 슬롯 시각화 오버레이
export { SlotVisualizerOverlay, SlotCompatibilityPreview } from './SlotVisualizerOverlay';

// 기존 컴포넌트 re-export (호환성)
// 점진적 마이그레이션을 위해 기존 경로도 유지
export { HeatmapOverlay as HeatmapOverlay3D } from './HeatmapOverlay';
