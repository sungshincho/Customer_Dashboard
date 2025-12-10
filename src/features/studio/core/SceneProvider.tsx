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
} from '../types';

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
