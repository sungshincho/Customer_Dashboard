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
  | { type: 'REVERT_SIMULATION' }  // 🆕 시뮬레이션 결과 되돌리기
  | { type: 'TOGGLE_PRODUCT_VISIBILITY'; payload: string }  // 🆕 제품 개별 가시성 토글
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

      // 🔧 FIX: childProducts 재배치를 위한 사전 처리
      // productPlacements에서 이동할 제품 목록을 미리 구성
      const childProductMoves = new Map<string, {
        productId: string;
        fromFurnitureId: string;
        toFurnitureId: string;
        productData: any;
        newPosition: { x: number; y: number; z: number };
        newSlotId: string | null;
        reason?: string;
      }>();

      if (hasProductPlacements) {
        // 모든 가구의 childProducts를 검색하여 이동할 제품 식별
        state.models.forEach((model) => {
          if (model.type === 'furniture' && (model.metadata as any)?.childProducts) {
            const childProducts = (model.metadata as any).childProducts as any[];
            childProducts.forEach((cp) => {
              const placement = productPlacements!.find(
                (p) => p.productId === cp.id || p.productSku === cp.metadata?.sku || p.productSku === cp.name
              );
              if (placement && placement.toFurnitureId && placement.toFurnitureId !== model.id) {
                // 다른 가구로 이동해야 하는 제품 발견
                childProductMoves.set(cp.id, {
                  productId: cp.id,
                  fromFurnitureId: model.id,
                  toFurnitureId: placement.toFurnitureId,
                  productData: cp,
                  newPosition: placement.toSlotPosition || placement.toPosition || cp.position,
                  newSlotId: placement.toSlotId || null,
                  reason: placement.reason,
                });
              }
            });
          }
        });
      }

      console.log('[SceneProvider] APPLY_SIMULATION - childProduct moves:', childProductMoves.size);

      // 모델 위치 업데이트
      const updatedModels = state.models.map((model) => {
        // 1️⃣ 가구 이동 처리 + childProducts 재배치
        if (model.type === 'furniture') {
          let updatedModel = model;
          let needsUpdate = false;

          // 가구 위치 이동 처리
          if (hasFurnitureMoves) {
            // 🔧 FIX: Edge Function은 raw UUID 반환, 3D 모델은 "furniture-{uuid}" 형식 사용
            // metadata.furnitureId에 raw UUID가 저장되어 있으므로 이것도 매칭 대상에 추가
            const modelFurnitureId = (model.metadata as any)?.furnitureId;
            const move = furnitureMoves!.find(
              (m) => m.furnitureId === model.id ||
                     m.furnitureId === modelFurnitureId ||
                     m.furnitureName === model.name
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

              updatedModel = {
                ...updatedModel,
                position: newPosition,
                rotation: newRotation,
                metadata: {
                  ...updatedModel.metadata,
                  movedBySimulation: true,
                  previousPosition: model.position,
                  previousRotation: model.rotation, // 🔧 FIX: 회전값도 저장
                  simulationType: 'furniture_move',
                },
              };
              needsUpdate = true;
            }
          }

          // 🔧 FIX: childProducts 재배치 처리
          if (childProductMoves.size > 0) {
            const currentChildProducts = ((updatedModel.metadata as any)?.childProducts as any[]) || [];

            // 이 가구에서 제거할 제품들 (다른 가구로 이동)
            // 🔧 FIX: modelFurnitureId (raw UUID)도 매칭 대상에 추가
            const productsToRemove = new Set<string>();
            childProductMoves.forEach((move, productId) => {
              if (move.fromFurnitureId === model.id || move.fromFurnitureId === modelFurnitureId) {
                productsToRemove.add(productId);
              }
            });

            // 이 가구로 추가할 제품들 (다른 가구에서 이동)
            const productsToAdd: any[] = [];
            childProductMoves.forEach((move) => {
              if (move.toFurnitureId === model.id || move.toFurnitureId === modelFurnitureId) {
                productsToAdd.push({
                  ...move.productData,
                  position: move.newPosition,
                  metadata: {
                    ...move.productData.metadata,
                    slot_id: move.newSlotId,
                    movedBySimulation: true,
                    placementReason: move.reason,
                  },
                });
              }
            });

            if (productsToRemove.size > 0 || productsToAdd.length > 0) {
              console.log(`[SceneProvider] Furniture ${model.id}: removing ${productsToRemove.size}, adding ${productsToAdd.length} products`);

              const newChildProducts = [
                ...currentChildProducts.filter((cp) => !productsToRemove.has(cp.id)),
                ...productsToAdd,
              ];

              updatedModel = {
                ...updatedModel,
                metadata: {
                  ...updatedModel.metadata,
                  childProducts: newChildProducts,
                  childProductsModified: true,
                },
              };
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            return updatedModel;
          }
        }

        // 2️⃣ 상품 재배치 처리 (슬롯 기반)
        if (hasProductPlacements && model.type === 'product') {
          // 🔧 FIX: Edge Function은 raw UUID 반환, 3D 모델은 "product-{uuid}" 형식 사용
          const modelProductId = (model.metadata as any)?.productId;
          const placement = productPlacements!.find(
            (p) => p.productId === model.id ||
                   p.productId === modelProductId ||
                   p.productSku === model.metadata?.sku
          );

          if (placement) {
            let newPosition: Vector3Tuple = model.position;

            // 🔧 FIX: toPosition이 있으면 그 값을 직접 사용 (가장 정확)
            if (placement.toPosition) {
              newPosition = [
                placement.toPosition.x,
                placement.toPosition.y,
                placement.toPosition.z,
              ];
              console.log(`[SceneProvider] Product ${model.name} moved to toPosition:`, newPosition);
            }
            // toSlotPosition이 있으면 가구 위치 + 슬롯 오프셋 계산
            else if (placement.toSlotPosition) {
              const targetFurniture = state.models.find(
                (m) => m.id === placement.toFurnitureId ||
                       m.id === `furniture-${placement.toFurnitureId}` ||
                       m.metadata?.furnitureId === placement.toFurnitureId
              );

              if (targetFurniture) {
                newPosition = [
                  targetFurniture.position[0] + placement.toSlotPosition.x,
                  targetFurniture.position[1] + placement.toSlotPosition.y,
                  targetFurniture.position[2] + placement.toSlotPosition.z,
                ];
                console.log(`[SceneProvider] Product ${model.name} moved to furniture + slot offset:`, newPosition);
              }
            }
            // Fallback: 하드코딩된 슬롯 타입별 오프셋 (레거시 지원)
            else {
              const targetFurniture = state.models.find(
                (m) => m.id === placement.toFurnitureId ||
                       m.id === `furniture-${placement.toFurnitureId}` ||
                       m.metadata?.furnitureId === placement.toFurnitureId
              );

              if (targetFurniture) {
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
                console.warn(`[SceneProvider] Product ${model.name} using fallback offset (toPosition/toSlotPosition not provided):`, newPosition);
              }
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

    // 🆕 제품 개별 가시성 토글 (가구의 childProducts 내 visible 속성 직접 수정)
    case 'TOGGLE_PRODUCT_VISIBILITY': {
      const productId = action.payload;

      // 모든 가구의 childProducts를 검색하여 해당 제품 찾기
      const updatedModels = state.models.map((model) => {
        if (model.type !== 'furniture') return model;

        const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
        if (!childProducts) return model;

        // 해당 제품이 이 가구의 childProducts에 있는지 확인
        const productIndex = childProducts.findIndex((cp) => cp.id === productId);
        if (productIndex === -1) return model;

        // childProducts 배열 복사 후 visible 토글
        const newChildProducts = childProducts.map((cp, idx) => {
          if (idx !== productIndex) return cp;
          // visible이 undefined면 기본 true로 처리 후 false로, 있으면 토글
          const currentVisible = cp.visible !== false;
          return { ...cp, visible: !currentVisible };
        });

        console.log(`[SceneProvider] TOGGLE_PRODUCT_VISIBILITY: ${productId} -> visible: ${!childProducts[productIndex].visible}`);

        return {
          ...model,
          metadata: {
            ...model.metadata,
            childProducts: newChildProducts,
          },
        };
      });

      return {
        ...state,
        models: updatedModels,
        isDirty: true,
      };
    }

    // 🆕 시뮬레이션 결과 되돌리기 (reducer 기반으로 stale closure 방지)
    case 'REVERT_SIMULATION': {
      const revertedModels = state.models.map((model) => {
        if (model.metadata?.movedBySimulation && model.metadata?.previousPosition) {
          return {
            ...model,
            position: model.metadata.previousPosition as Vector3Tuple,
            // 🔧 FIX: 회전값도 복원 (저장되어 있는 경우)
            rotation: (model.metadata.previousRotation as Vector3Tuple) || model.rotation,
            metadata: {
              ...model.metadata,
              movedBySimulation: false,
              previousPosition: undefined,
              previousRotation: undefined,
            },
          };
        }
        return model;
      });
      
      return {
        ...state,
        models: revertedModels,
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

  // 🆕 제품 개별 가시성 제어 (childProduct.visible 방식)
  toggleProductVisibility: (productId: string) => void;
  isProductVisible: (productId: string) => boolean;

  // 🆕 카메라 포커스 (특정 모델에 포커싱)
  focusOnModel?: (modelId: string) => void;
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

  // 🔧 시뮬레이션 변경 되돌리기 (dispatch 기반으로 stale closure 방지)
  const revertSimulationChanges = useCallback(() => {
    dispatch({ type: 'REVERT_SIMULATION' });
  }, []);

  // 🆕 제품 개별 가시성 토글 (가구의 childProducts 내 visible 속성 직접 수정)
  const toggleProductVisibility = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_PRODUCT_VISIBILITY', payload: productId });
  }, []);

  // 🆕 제품 가시성 확인 (가구의 childProducts 내 visible 속성 확인)
  const isProductVisible = useCallback((productId: string) => {
    // 모든 가구의 childProducts를 검색하여 해당 제품의 visible 상태 확인
    for (const model of state.models) {
      if (model.type !== 'furniture') continue;

      const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
      if (!childProducts) continue;

      const product = childProducts.find((cp) => cp.id === productId);
      if (product) {
        // visible이 undefined면 기본 true로 처리
        return product.visible !== false;
      }
    }
    // 찾지 못하면 기본 true
    return true;
  }, [state.models]);

  // 🆕 카메라 포커스 (특정 모델에 포커싱)
  const focusOnModel = useCallback((modelId: string) => {
    // 모델 찾기 (직접 모델 또는 childProduct)
    let targetModel = state.models.find(m => m.id === modelId);
    let parentFurniture: Model3D | undefined;

    // childProduct인 경우 부모 가구 찾기
    if (!targetModel) {
      for (const model of state.models) {
        if (model.type === 'furniture') {
          const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
          if (childProducts) {
            const child = childProducts.find((cp: any) => cp.id === modelId);
            if (child) {
              parentFurniture = model;
              // childProduct의 절대 위치 계산 (부모 가구 위치 + 상대 위치)
              const childPos = child.position || { x: 0, y: 0, z: 0 };
              targetModel = {
                ...model,
                id: modelId,
                position: [
                  model.position[0] + childPos.x,
                  model.position[1] + childPos.y,
                  model.position[2] + childPos.z,
                ] as Vector3Tuple,
                // 부모 가구의 회전값 사용
                rotation: model.rotation,
              };
              break;
            }
          }
        }
      }
    }

    if (!targetModel) {
      select(modelId);
      return;
    }

    const [x, y, z] = targetModel.position;
    const rotationY = targetModel.rotation[1]; // 라디안 값

    // 카메라 제한 사항
    const FOCUS_DISTANCE = 10;  // minDistance(8) ~ maxDistance(40) 범위 내
    const POLAR_ANGLE = Math.PI / 4;  // 45도 (17° ~ 72° 범위 내)

    // 회전 적용된 카메라 오프셋 계산
    const horizontalDist = FOCUS_DISTANCE * Math.sin(POLAR_ANGLE);
    const verticalDist = FOCUS_DISTANCE * Math.cos(POLAR_ANGLE);

    // 모델 정면에서 바라보도록 회전 적용
    const cameraOffset = {
      x: horizontalDist * Math.sin(rotationY),
      y: verticalDist,
      z: horizontalDist * Math.cos(rotationY),
    };

    // 타겟 위치 클램핑 (OrbitControls 제한 범위 내)
    const clampedTarget = {
      x: Math.max(-12, Math.min(12, x)),
      y: Math.max(0, Math.min(5, y)),
      z: Math.max(-12, Math.min(12, z)),
    };

    // 카메라 위치 계산
    const cameraPosition = {
      x: clampedTarget.x + cameraOffset.x,
      y: clampedTarget.y + cameraOffset.y,
      z: clampedTarget.z + cameraOffset.z,
    };

    console.log('[SceneProvider] focusOnModel:', {
      modelId,
      targetPosition: [x, y, z],
      rotationY: (rotationY * 180 / Math.PI).toFixed(1) + '°',
      cameraTarget: clampedTarget,
      cameraPosition,
    });

    // 카메라 상태 업데이트
    dispatch({
      type: 'SET_CAMERA',
      payload: {
        target: clampedTarget,
        position: cameraPosition,
      },
    });

    // 모델 선택
    select(modelId);
  }, [state.models, select, dispatch]);

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
    // 🆕 제품 개별 가시성 제어 (childProduct.visible 방식)
    toggleProductVisibility,
    isProductVisible,
    // 🆕 카메라 포커스 (특정 모델에 포커싱)
    focusOnModel,
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
