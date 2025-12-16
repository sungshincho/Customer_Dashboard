/**
 * SceneProvider.tsx
 *
 * 3D 씬 상태 관리 Context Provider
 * - 모델, 레이어, 선택, 오버레이 상태 통합 관리
 * - 모드 기반 동작 (편집/뷰/시뮬레이션)
 */

import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type {
  StudioMode,
  SceneState,
  Model3D,
  SceneLayer,
  CameraSettings,
  Vector3Tuple,
  ProductPlacement,
} from '../types';

// ============================================================================
// 시뮬레이션 결과 적용을 위한 타입
// ============================================================================
export interface FurnitureMove {
  furnitureId: string;
  furnitureName: string;
  fromPosition: { x: number; y: number; z: number };
  toPosition: { x: number; y: number; z: number };
  rotation?: number;
}

export interface SimulationResultsPayload {
  furnitureMoves?: FurnitureMove[];
  // 🆕 슬롯 기반 상품 배치
  productPlacements?: ProductPlacement[];
  animated?: boolean;
}

// ============================================================================
// 액션 타입
// ============================================================================
type SceneAction =
  | { type: 'SET_MODE'; payload: StudioMode }
  | { type: 'ADD_MODEL'; payload: Model3D }
  | { type: 'UPDATE_MODEL'; payload: { id: string; updates: Partial<Model3D> } }
  | { type: 'REMOVE_MODEL'; payload: string }
  | { type: 'SET_MODELS'; payload: Model3D[] }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'HOVER'; payload: string | null }
  | { type: 'ADD_LAYER'; payload: SceneLayer }
  | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<SceneLayer> } }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: string }
  | { type: 'TOGGLE_OVERLAY'; payload: string }
  | { type: 'SET_ACTIVE_OVERLAYS'; payload: string[] }
  | { type: 'SET_CAMERA'; payload: Partial<CameraSettings> }
  | { type: 'LOAD_SCENE'; payload: Partial<SceneState> }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'APPLY_SIMULATION'; payload: SimulationResultsPayload }
  | { type: 'RESET' };

// ============================================================================
// 초기 상태
// ============================================================================
const initialState: SceneState = {
  mode: 'view',
  models: [],
  layers: [],
  selectedId: null,
  hoveredId: null,
  activeOverlays: [],
  camera: {
    position: { x: 10, y: 10, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  isDirty: false,
};

// ============================================================================
// 리듀서
// ============================================================================
const sceneReducer = (state: SceneState, action: SceneAction): SceneState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'ADD_MODEL':
      return {
        ...state,
        models: [...state.models, action.payload],
        isDirty: true,
      };

    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
        isDirty: true,
      };

    case 'REMOVE_MODEL':
      return {
        ...state,
        models: state.models.filter((m) => m.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
        isDirty: true,
      };

    case 'SET_MODELS':
      return {
        ...state,
        models: action.payload,
        isDirty: true,
      };

    case 'SELECT':
      return { ...state, selectedId: action.payload };

    case 'HOVER':
      return { ...state, hoveredId: action.payload };

    case 'ADD_LAYER':
      return {
        ...state,
        layers: [...state.layers, action.payload],
        isDirty: true,
      };

    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.id ? { ...l, ...action.payload.updates } : l
        ),
        isDirty: true,
      };

    case 'REMOVE_LAYER':
      return {
        ...state,
        layers: state.layers.filter((l) => l.id !== action.payload),
        isDirty: true,
      };

    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload ? { ...l, visible: !l.visible } : l
        ),
        isDirty: true,
      };

    case 'TOGGLE_OVERLAY':
      return {
        ...state,
        activeOverlays: state.activeOverlays.includes(action.payload)
          ? state.activeOverlays.filter((o) => o !== action.payload)
          : [...state.activeOverlays, action.payload],
      };

    case 'SET_ACTIVE_OVERLAYS':
      return {
        ...state,
        activeOverlays: action.payload,
      };

    case 'SET_CAMERA':
      return {
        ...state,
        camera: { ...state.camera, ...action.payload },
      };

    case 'LOAD_SCENE':
      return {
        ...state,
        ...action.payload,
        isDirty: false,
      };

    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
      };

    case 'APPLY_SIMULATION': {
      const { furnitureMoves, productPlacements } = action.payload;

      // 변경할 내용이 없으면 반환
      const hasFurnitureMoves = furnitureMoves && furnitureMoves.length > 0;
      const hasProductPlacements = productPlacements && productPlacements.length > 0;
      if (!hasFurnitureMoves && !hasProductPlacements) return state;

      // 모델 위치 업데이트
      const updatedModels = state.models.map((model) => {
        // 1️⃣ 가구 이동 처리
        if (hasFurnitureMoves && model.type === 'furniture') {
          const move = furnitureMoves!.find(
            (m) => m.furnitureId === model.id || m.furnitureName === model.name
          );

          if (move) {
            const newPosition: Vector3Tuple = [
              move.toPosition.x,
              move.toPosition.y,
              move.toPosition.z,
            ];

            const newRotation: Vector3Tuple = move.rotation
              ? [model.rotation[0], move.rotation * (Math.PI / 180), model.rotation[2]]
              : model.rotation;

            return {
              ...model,
              position: newPosition,
              rotation: newRotation,
              metadata: {
                ...model.metadata,
                movedBySimulation: true,
                previousPosition: model.position,
                simulationType: 'furniture_move',
              },
            };
          }
        }

        // 2️⃣ 상품 재배치 처리 (슬롯 기반)
        if (hasProductPlacements && model.type === 'product') {
          const placement = productPlacements!.find(
            (p) => p.productId === model.id || p.productSku === model.metadata?.sku
          );

          if (placement) {
            // 슬롯 위치를 가구 위치 기준으로 계산
            // toFurnitureId에 해당하는 가구 찾기
            const targetFurniture = state.models.find(
              (m) => m.id === placement.toFurnitureId || m.metadata?.furniture_id === placement.toFurnitureId
            );

            let newPosition: Vector3Tuple = model.position;

            if (targetFurniture) {
              // 가구 위치를 기준으로 슬롯 오프셋 적용
              // 슬롯 타입에 따른 기본 오프셋
              const slotOffsets: Record<string, { x: number; y: number; z: number }> = {
                hanger: { x: 0, y: 1.5, z: 0 },
                mannequin: { x: 0, y: 1.0, z: 0 },
                shelf: { x: 0, y: 0.8, z: 0 },
                table: { x: 0, y: 0.75, z: 0 },
                rack: { x: 0, y: 1.2, z: 0 },
                hook: { x: 0, y: 1.4, z: 0 },
                drawer: { x: 0, y: 0.3, z: 0 },
              };

              const offset = slotOffsets[placement.slotType || 'shelf'] || { x: 0, y: 0.8, z: 0 };

              newPosition = [
                targetFurniture.position[0] + offset.x,
                targetFurniture.position[1] + offset.y,
                targetFurniture.position[2] + offset.z,
              ];
            }

            return {
              ...model,
              position: newPosition,
              metadata: {
                ...model.metadata,
                movedBySimulation: true,
                previousPosition: model.position,
                previousFurnitureId: model.metadata?.furniture_id,
                previousSlotId: model.metadata?.slot_id,
                furniture_id: placement.toFurnitureId,
                slot_id: placement.toSlotId,
                slot_type: placement.slotType,
                display_type: placement.displayType,
                simulationType: 'product_placement',
                placementReason: placement.reason,
              },
            };
          }
        }

        return model;
      });

      return {
        ...state,
        models: updatedModels,
        isDirty: true,
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

// ============================================================================
// Context 타입
// ============================================================================
interface SceneContextValue {
  // 상태
  state: SceneState;
  dispatch: React.Dispatch<SceneAction>;

  // 모드
  mode: StudioMode;
  setMode: (mode: StudioMode) => void;

  // 모델 관리
  models: Model3D[];
  addModel: (model: Model3D) => void;
  updateModel: (id: string, updates: Partial<Model3D>) => void;
  removeModel: (id: string) => void;
  setModels: (models: Model3D[]) => void;

  // 선택
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  selectedModel: Model3D | null;

  // 레이어
  layers: SceneLayer[];
  addLayer: (layer: SceneLayer) => void;
  updateLayer: (id: string, updates: Partial<SceneLayer>) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;

  // 오버레이
  activeOverlays: string[];
  toggleOverlay: (overlayId: string) => void;
  setActiveOverlays: (overlays: string[]) => void;
  isOverlayActive: (overlayId: string) => boolean;

  // 카메라
  camera: CameraSettings;
  setCamera: (settings: Partial<CameraSettings>) => void;

  // 씬 관리
  loadScene: (scene: Partial<SceneState>) => void;
  resetScene: () => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // 시뮬레이션 결과 적용
  applySimulationResults: (results: SimulationResultsPayload) => void;
  revertSimulationChanges: () => void;
}

// ============================================================================
// Context 생성
// ============================================================================
const SceneContext = createContext<SceneContextValue | null>(null);

// ============================================================================
// Provider 컴포넌트
// ============================================================================
interface SceneProviderProps {
  mode?: StudioMode;
  children: ReactNode;
  initialModels?: Model3D[];
}

export function SceneProvider({ mode = 'view', children, initialModels = [] }: SceneProviderProps) {
  const [state, dispatch] = useReducer(sceneReducer, {
    ...initialState,
    mode,
    models: initialModels,
  });

  // initialModels가 변경되면 상태 동기화 (비동기 로드 지원)
  useEffect(() => {
    if (initialModels.length > 0) {
      dispatch({ type: 'SET_MODELS', payload: initialModels });
    }
  }, [initialModels]);

  // 모드
  const setMode = useCallback((mode: StudioMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  // 모델 관리
  const addModel = useCallback((model: Model3D) => {
    dispatch({ type: 'ADD_MODEL', payload: model });
  }, []);

  const updateModel = useCallback((id: string, updates: Partial<Model3D>) => {
    dispatch({ type: 'UPDATE_MODEL', payload: { id, updates } });
  }, []);

  const removeModel = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MODEL', payload: id });
  }, []);

  const setModels = useCallback((models: Model3D[]) => {
    dispatch({ type: 'SET_MODELS', payload: models });
  }, []);

  // 선택
  const select = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT', payload: id });
  }, []);

  const hover = useCallback((id: string | null) => {
    dispatch({ type: 'HOVER', payload: id });
  }, []);

  const selectedModel = state.models.find((m) => m.id === state.selectedId) || null;

  // 레이어
  const addLayer = useCallback((layer: SceneLayer) => {
    dispatch({ type: 'ADD_LAYER', payload: layer });
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<SceneLayer>) => {
    dispatch({ type: 'UPDATE_LAYER', payload: { id, updates } });
  }, []);

  const removeLayer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LAYER', payload: id });
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: id });
  }, []);

  // 오버레이
  const toggleOverlay = useCallback((overlayId: string) => {
    dispatch({ type: 'TOGGLE_OVERLAY', payload: overlayId });
  }, []);

  const setActiveOverlays = useCallback((overlays: string[]) => {
    dispatch({ type: 'SET_ACTIVE_OVERLAYS', payload: overlays });
  }, []);

  const isOverlayActive = useCallback(
    (overlayId: string) => state.activeOverlays.includes(overlayId),
    [state.activeOverlays]
  );

  // 카메라
  const setCamera = useCallback((settings: Partial<CameraSettings>) => {
    dispatch({ type: 'SET_CAMERA', payload: settings });
  }, []);

  // 씬 관리
  const loadScene = useCallback((scene: Partial<SceneState>) => {
    dispatch({ type: 'LOAD_SCENE', payload: scene });
  }, []);

  const resetScene = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: dirty });
  }, []);

  // 시뮬레이션 결과 적용
  const applySimulationResults = useCallback((results: SimulationResultsPayload) => {
    dispatch({ type: 'APPLY_SIMULATION', payload: results });
  }, []);

  // 시뮬레이션 변경 되돌리기
  const revertSimulationChanges = useCallback(() => {
    // 이전 위치로 모델 복원
    const revertedModels = state.models.map((model) => {
      if (model.metadata?.movedBySimulation && model.metadata?.previousPosition) {
        return {
          ...model,
          position: model.metadata.previousPosition as Vector3Tuple,
          metadata: {
            ...model.metadata,
            movedBySimulation: false,
            previousPosition: undefined,
          },
        };
      }
      return model;
    });
    dispatch({ type: 'SET_MODELS', payload: revertedModels });
  }, [state.models]);

  const value: SceneContextValue = {
    state,
    dispatch,
    mode: state.mode,
    setMode,
    models: state.models,
    addModel,
    updateModel,
    removeModel,
    setModels,
    selectedId: state.selectedId,
    hoveredId: state.hoveredId,
    select,
    hover,
    selectedModel,
    layers: state.layers,
    addLayer,
    updateLayer,
    removeLayer,
    toggleLayerVisibility,
    activeOverlays: state.activeOverlays,
    toggleOverlay,
    setActiveOverlays,
    isOverlayActive,
    camera: state.camera,
    setCamera,
    loadScene,
    resetScene,
    isDirty: state.isDirty,
    setDirty,
    applySimulationResults,
    revertSimulationChanges,
  };

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================
export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within SceneProvider');
  }
  return context;
}

// 편의 훅들
export function useSceneMode() {
  const { mode, setMode } = useScene();
  return { mode, setMode };
}

export function useSceneSelection() {
  const { selectedId, hoveredId, select, hover, selectedModel } = useScene();
  return { selectedId, hoveredId, select, hover, selectedModel };
}

export function useSceneModels() {
  const { models, addModel, updateModel, removeModel, setModels } = useScene();
  return { models, addModel, updateModel, removeModel, setModels };
}

export function useSceneOverlays() {
  const { activeOverlays, toggleOverlay, setActiveOverlays, isOverlayActive } = useScene();
  return { activeOverlays, toggleOverlay, setActiveOverlays, isOverlayActive };
}

export function useSceneLayers() {
  const { layers, addLayer, updateLayer, removeLayer, toggleLayerVisibility } = useScene();
  return { layers, addLayer, updateLayer, removeLayer, toggleLayerVisibility };
}

export default SceneProvider;
