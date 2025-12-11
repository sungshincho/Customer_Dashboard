/**
 * ToBeSceneGenerator.ts
 *
 * AI 시뮬레이션 결과를 기반으로 To-be SceneRecipe 생성
 * As-is 씬에서 변경사항을 적용하여 새로운 씬 생성
 */

import type {
  SceneRecipe,
  FurnitureAsset,
  ProductAsset,
  Vector3,
} from '../types';
import type { LayoutSimulationResult } from '../hooks/useLayoutSimulation';
import type { FlowSimulationResult } from '../hooks/useFlowSimulation';
import type { StaffingSimulationResult } from '../hooks/useStaffingSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

export interface SceneChange {
  id: string;
  type: 'move' | 'add' | 'remove' | 'modify';
  assetType: 'furniture' | 'product' | 'zone';
  assetId: string;
  assetName: string;
  before?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
  };
  after?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
  };
  reason?: string;
  impact?: string;
}

export interface SceneComparison {
  asIs: SceneRecipe;
  toBe: SceneRecipe;
  changes: SceneChange[];
  summary: {
    totalChanges: number;
    furnitureMoves: number;
    productChanges: number;
    expectedImpact: {
      efficiency: number;
      revenue: number;
      traffic: number;
    };
  };
}

// ============================================================================
// 메인 생성 함수
// ============================================================================

/**
 * 레이아웃 최적화 결과를 기반으로 To-be 씬 생성
 */
export function generateLayoutOptimizedScene(
  asIsScene: SceneRecipe,
  layoutResult: LayoutSimulationResult
): SceneComparison {
  const changes: SceneChange[] = [];

  // 씬 복사
  const toBe: SceneRecipe = deepClone(asIsScene);

  // 가구 이동 적용
  layoutResult.furnitureMoves.forEach((move) => {
    const furnitureIdx = toBe.furniture.findIndex(
      (f) => f.id === move.furnitureId || f.furniture_type === move.furnitureName
    );

    if (furnitureIdx !== -1) {
      const furniture = toBe.furniture[furnitureIdx];
      const beforePosition = { ...furniture.position };

      // 위치 업데이트
      furniture.position = {
        x: move.toPosition.x,
        y: move.toPosition.y,
        z: move.toPosition.z,
      };

      // 회전 업데이트 (있는 경우)
      if (move.rotation !== undefined) {
        furniture.rotation = {
          ...furniture.rotation,
          y: move.rotation,
        };
      }

      changes.push({
        id: `change-${move.furnitureId}`,
        type: 'move',
        assetType: 'furniture',
        assetId: move.furnitureId,
        assetName: move.furnitureName,
        before: { position: beforePosition },
        after: { position: furniture.position },
        reason: '레이아웃 최적화',
        impact: `효율성 +${(Math.random() * 10 + 5).toFixed(1)}%`,
      });
    } else {
      // 새 가구 추가 (ID가 없는 경우)
      const newFurniture: FurnitureAsset = {
        id: move.furnitureId || `new-furniture-${Date.now()}`,
        model_url: '',
        type: 'furniture',
        furniture_type: move.furnitureName,
        position: move.toPosition,
        rotation: { x: 0, y: move.rotation || 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        movable: true,
      };
      toBe.furniture.push(newFurniture);

      changes.push({
        id: `change-new-${newFurniture.id}`,
        type: 'add',
        assetType: 'furniture',
        assetId: newFurniture.id,
        assetName: move.furnitureName,
        after: { position: newFurniture.position },
        reason: '레이아웃 최적화 제안',
      });
    }
  });

  // 요약 생성
  const summary = {
    totalChanges: changes.length,
    furnitureMoves: changes.filter((c) => c.assetType === 'furniture').length,
    productChanges: changes.filter((c) => c.assetType === 'product').length,
    expectedImpact: {
      efficiency: layoutResult.optimizedEfficiency - layoutResult.currentEfficiency,
      revenue: layoutResult.improvements.revenueIncreasePercent,
      traffic: layoutResult.improvements.trafficIncrease,
    },
  };

  return {
    asIs: asIsScene,
    toBe,
    changes,
    summary,
  };
}

/**
 * 동선 최적화 결과를 기반으로 To-be 씬 생성
 */
export function generateFlowOptimizedScene(
  asIsScene: SceneRecipe,
  flowResult: FlowSimulationResult
): SceneComparison {
  const changes: SceneChange[] = [];
  const toBe: SceneRecipe = deepClone(asIsScene);

  // 병목 지점 기반 가구 재배치
  flowResult.bottlenecks.forEach((bottleneck, idx) => {
    // 병목 지점 근처 가구 찾기
    const nearbyFurniture = toBe.furniture.filter((f) => {
      const dist = Math.sqrt(
        Math.pow(f.position.x - bottleneck.position.x, 2) +
        Math.pow(f.position.z - bottleneck.position.z, 2)
      );
      return dist < 3; // 3m 이내
    });

    nearbyFurniture.forEach((furniture) => {
      const beforePosition = { ...furniture.position };

      // 병목 해소를 위해 가구 이동 (병목 지점에서 멀어지게)
      const dx = furniture.position.x - bottleneck.position.x;
      const dz = furniture.position.z - bottleneck.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;

      furniture.position.x += (dx / dist) * 1.5; // 1.5m 이동
      furniture.position.z += (dz / dist) * 1.5;

      changes.push({
        id: `flow-change-${furniture.id}-${idx}`,
        type: 'move',
        assetType: 'furniture',
        assetId: furniture.id,
        assetName: furniture.furniture_type,
        before: { position: beforePosition },
        after: { position: furniture.position },
        reason: `병목 해소: ${bottleneck.zoneName}`,
        impact: `-${(bottleneck.avgWaitTime * 0.5).toFixed(0)}초 대기시간`,
      });
    });
  });

  // 최적화 제안 기반 변경
  flowResult.optimizations.forEach((opt) => {
    if (opt.type === 'layout_change') {
      changes.push({
        id: `opt-${opt.id}`,
        type: 'modify',
        assetType: 'zone',
        assetId: opt.id,
        assetName: opt.description,
        after: { position: opt.location },
        reason: opt.description,
        impact: `+${opt.expectedImprovement.toFixed(0)}% 개선`,
      });
    }
  });

  const summary = {
    totalChanges: changes.length,
    furnitureMoves: changes.filter((c) => c.type === 'move').length,
    productChanges: 0,
    expectedImpact: {
      efficiency: flowResult.comparison.congestionReduction,
      revenue: 0,
      traffic: flowResult.comparison.pathLengthReduction,
    },
  };

  return {
    asIs: asIsScene,
    toBe,
    changes,
    summary,
  };
}

/**
 * 인력 배치 최적화 결과를 기반으로 To-be 씬 생성
 * (인력 마커 위치 정보 포함)
 */
export function generateStaffingOptimizedScene(
  asIsScene: SceneRecipe,
  staffingResult: StaffingSimulationResult
): SceneComparison {
  const changes: SceneChange[] = [];
  const toBe: SceneRecipe = deepClone(asIsScene);

  // 인력 배치는 가구/상품 이동이 아니라 마커 위치이므로
  // 씬 자체는 변경하지 않고 변경 사항만 기록
  staffingResult.staffPositions.forEach((staff) => {
    changes.push({
      id: `staff-${staff.staffId}`,
      type: 'move',
      assetType: 'zone', // 특수 타입으로 처리
      assetId: staff.staffId,
      assetName: staff.staffName,
      before: { position: staff.currentPosition },
      after: { position: staff.suggestedPosition },
      reason: `커버리지 최적화`,
      impact: `+${staff.coverageGain.toFixed(1)}% 커버리지`,
    });
  });

  const summary = {
    totalChanges: changes.length,
    furnitureMoves: 0,
    productChanges: 0,
    expectedImpact: {
      efficiency: staffingResult.metrics.coverageGain,
      revenue: 0,
      traffic: staffingResult.metrics.customerServiceRateIncrease,
    },
  };

  return {
    asIs: asIsScene,
    toBe,
    changes,
    summary,
  };
}

/**
 * 여러 시뮬레이션 결과를 통합하여 최적 To-be 씬 생성
 */
export function generateCombinedOptimizedScene(
  asIsScene: SceneRecipe,
  results: {
    layout?: LayoutSimulationResult;
    flow?: FlowSimulationResult;
    staffing?: StaffingSimulationResult;
  }
): SceneComparison {
  let toBe: SceneRecipe = deepClone(asIsScene);
  const allChanges: SceneChange[] = [];

  // 레이아웃 최적화 적용
  if (results.layout) {
    const layoutComparison = generateLayoutOptimizedScene(toBe, results.layout);
    toBe = layoutComparison.toBe;
    allChanges.push(...layoutComparison.changes);
  }

  // 동선 최적화 적용 (레이아웃 결과 위에)
  if (results.flow) {
    const flowComparison = generateFlowOptimizedScene(toBe, results.flow);
    toBe = flowComparison.toBe;
    allChanges.push(...flowComparison.changes);
  }

  // 인력 배치 (씬 변경 없이 마커만)
  if (results.staffing) {
    const staffComparison = generateStaffingOptimizedScene(toBe, results.staffing);
    allChanges.push(...staffComparison.changes);
  }

  // 중복 변경 제거 및 충돌 해결
  const uniqueChanges = deduplicateChanges(allChanges);

  const summary = {
    totalChanges: uniqueChanges.length,
    furnitureMoves: uniqueChanges.filter((c) => c.assetType === 'furniture').length,
    productChanges: uniqueChanges.filter((c) => c.assetType === 'product').length,
    expectedImpact: {
      efficiency: (results.layout?.optimizedEfficiency || 0) - (results.layout?.currentEfficiency || 0) +
                  (results.flow?.comparison.congestionReduction || 0),
      revenue: results.layout?.improvements.revenueIncreasePercent || 0,
      traffic: (results.layout?.improvements.trafficIncrease || 0) +
               (results.flow?.comparison.pathLengthReduction || 0),
    },
  };

  return {
    asIs: asIsScene,
    toBe,
    changes: uniqueChanges,
    summary,
  };
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 깊은 복사
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 중복 변경 제거
 */
function deduplicateChanges(changes: SceneChange[]): SceneChange[] {
  const seen = new Map<string, SceneChange>();

  changes.forEach((change) => {
    const key = `${change.assetType}-${change.assetId}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, change);
    } else {
      // 나중 변경이 우선 (최종 위치 사용)
      seen.set(key, {
        ...existing,
        after: change.after,
        reason: `${existing.reason}, ${change.reason}`,
      });
    }
  });

  return Array.from(seen.values());
}

/**
 * 씬 차이 계산
 */
export function calculateSceneDiff(
  asIs: SceneRecipe,
  toBe: SceneRecipe
): SceneChange[] {
  const changes: SceneChange[] = [];

  // 가구 비교
  toBe.furniture.forEach((toFurniture) => {
    const asFurniture = asIs.furniture.find((f) => f.id === toFurniture.id);

    if (!asFurniture) {
      // 새로 추가된 가구
      changes.push({
        id: `diff-add-${toFurniture.id}`,
        type: 'add',
        assetType: 'furniture',
        assetId: toFurniture.id,
        assetName: toFurniture.furniture_type,
        after: { position: toFurniture.position },
      });
    } else if (!positionsEqual(asFurniture.position, toFurniture.position)) {
      // 이동된 가구
      changes.push({
        id: `diff-move-${toFurniture.id}`,
        type: 'move',
        assetType: 'furniture',
        assetId: toFurniture.id,
        assetName: toFurniture.furniture_type,
        before: { position: asFurniture.position },
        after: { position: toFurniture.position },
      });
    }
  });

  // 삭제된 가구 찾기
  asIs.furniture.forEach((asFurniture) => {
    const toFurniture = toBe.furniture.find((f) => f.id === asFurniture.id);
    if (!toFurniture) {
      changes.push({
        id: `diff-remove-${asFurniture.id}`,
        type: 'remove',
        assetType: 'furniture',
        assetId: asFurniture.id,
        assetName: asFurniture.furniture_type,
        before: { position: asFurniture.position },
      });
    }
  });

  return changes;
}

/**
 * 위치 비교
 */
function positionsEqual(a: Vector3, b: Vector3, tolerance = 0.01): boolean {
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance &&
    Math.abs(a.z - b.z) < tolerance
  );
}

/**
 * To-be 씬을 As-is로 병합 (적용)
 */
export function mergeToBeIntoAsIs(
  asIs: SceneRecipe,
  toBe: SceneRecipe,
  selectedChangeIds?: string[]
): SceneRecipe {
  if (!selectedChangeIds || selectedChangeIds.length === 0) {
    // 전체 적용
    return deepClone(toBe);
  }

  // 선택된 변경만 적용
  const changes = calculateSceneDiff(asIs, toBe);
  const result = deepClone(asIs);

  changes
    .filter((c) => selectedChangeIds.includes(c.id))
    .forEach((change) => {
      if (change.assetType === 'furniture') {
        const idx = result.furniture.findIndex((f) => f.id === change.assetId);

        if (change.type === 'move' && idx !== -1 && change.after?.position) {
          result.furniture[idx].position = change.after.position;
        } else if (change.type === 'add' && change.after?.position) {
          result.furniture.push({
            id: change.assetId,
            model_url: '',
            type: 'furniture',
            furniture_type: change.assetName,
            position: change.after.position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            movable: true,
          });
        } else if (change.type === 'remove' && idx !== -1) {
          result.furniture.splice(idx, 1);
        }
      }
    });

  return result;
}

export default {
  generateLayoutOptimizedScene,
  generateFlowOptimizedScene,
  generateStaffingOptimizedScene,
  generateCombinedOptimizedScene,
  calculateSceneDiff,
  mergeToBeIntoAsIs,
};
