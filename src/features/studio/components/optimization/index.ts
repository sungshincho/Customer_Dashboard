/**
 * optimization/index.ts
 *
 * 최적화 설정 컴포넌트 모듈 익스포트
 */

export { OptimizationSettingsPanel } from './OptimizationSettingsPanel';
export { ObjectiveSelector } from './ObjectiveSelector';
export { FurnitureSelector } from './FurnitureSelector';
export { ProductSelector } from './ProductSelector';
export { IntensitySlider } from './IntensitySlider';

// 타입 재export
export type {
  OptimizationSettings,
  OptimizationObjective,
  OptimizationIntensity,
  FurnitureSettings,
  ProductSettings,
  FurnitureItem,
  ProductItem,
} from '../../types/optimization.types';

export { DEFAULT_OPTIMIZATION_SETTINGS, INTENSITY_LIMITS } from '../../types/optimization.types';
