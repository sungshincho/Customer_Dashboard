/**
 * LayoutOptimizationOverlay.tsx
 *
 * 레이아웃 최적화 3D 오버레이
 * - 가구 이동 경로 시각화
 * - 변경 전/후 히트맵 비교
 * - 존 하이라이트
 */

import { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { LayoutSimulationResult } from '../hooks/useLayoutSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

interface LayoutOptimizationOverlayProps {
  result: LayoutSimulationResult | null;
  showBefore?: boolean;
  showAfter?: boolean;
  showMoves?: boolean;
  showProductMoves?: boolean;
  showZoneHighlights?: boolean;
  animationSpeed?: number;
  onFurnitureClick?: (furnitureId: string) => void;
  onProductClick?: (productId: string) => void;
  /** 매장 경계 (좌표 클램핑용) */
  storeBounds?: {
    width: number;
    depth: number;
  };
  /** 실제 존 위치 데이터 (zones_dim 기반) */
  zonePositions?: Record<string, [number, number, number]>;
  /** 실제 존 크기 데이터 (zones_dim 기반) */
  zoneSizes?: Record<string, { width: number; depth: number }>;
}

// ============================================================================
// 좌표 클램핑 헬퍼
// ============================================================================

const DEFAULT_STORE_BOUNDS = { width: 17.4, depth: 16.6 };

/**
 * 3D 좌표를 매장 경계 내로 클램핑
 */
function clampToStoreBounds(
  x: number,
  z: number,
  bounds: { width: number; depth: number }
): { x: number; z: number } {
  const halfWidth = bounds.width / 2;
  const halfDepth = bounds.depth / 2;
  const padding = 0.5;

  return {
    x: Math.max(-halfWidth + padding, Math.min(halfWidth - padding, x)),
    z: Math.max(-halfDepth + padding, Math.min(halfDepth - padding, z)),
  };
}

// ============================================================================
// 컴포넌트
// ============================================================================

export function LayoutOptimizationOverlay({
  result,
  showBefore = false,
  showAfter = true,
  showMoves = true,
  showProductMoves = true,
  showZoneHighlights = true,
  animationSpeed = 1,
  onFurnitureClick,
  onProductClick,
  storeBounds = DEFAULT_STORE_BOUNDS,
  zonePositions: externalZonePositions,
  zoneSizes: externalZoneSizes,
}: LayoutOptimizationOverlayProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const animationRef = useRef(0);

  // 애니메이션 프레임
  useFrame((_, delta) => {
    animationRef.current += delta * animationSpeed;
  });

  if (!result) return null;

  const { visualization, furnitureMoves } = result;
  // productPlacements 추출 (타입 캐스트)
  const productPlacements = (result as any).productPlacements || [];

  return (
    <group name="layout-optimization-overlay">
      {/* 변경 전 히트맵 */}
      {showBefore && visualization.beforeHeatmap.length > 0 && (
        <HeatmapMesh
          points={visualization.beforeHeatmap}
          color="#ef4444"
          opacity={0.3}
          heightScale={1}
          label="변경 전"
          storeBounds={storeBounds}
        />
      )}

      {/* 변경 후 히트맵 */}
      {showAfter && visualization.afterHeatmap.length > 0 && (
        <HeatmapMesh
          points={visualization.afterHeatmap}
          color="#22c55e"
          opacity={0.5}
          heightScale={1.5}
          label="변경 후"
          storeBounds={storeBounds}
        />
      )}

      {/* 가구 이동 경로 */}
      {showMoves && furnitureMoves.map((move, idx) => (
        <FurnitureMoveIndicator
          key={move.furnitureId}
          move={move}
          storeBounds={storeBounds}
          index={idx}
          isSelected={selectedMove === move.furnitureId}
          onClick={() => {
            setSelectedMove(move.furnitureId);
            onFurnitureClick?.(move.furnitureId);
          }}
        />
      ))}

      {/* 제품 재배치 경로 (슬롯 기반) */}
      {showProductMoves && productPlacements.map((placement: any, idx: number) => (
        <ProductMoveIndicator
          key={placement.productId || placement.product_id || `product-${idx}`}
          placement={placement}
          storeBounds={storeBounds}
          index={idx}
          isSelected={selectedProduct === (placement.productId || placement.product_id)}
          onClick={() => {
            const productId = placement.productId || placement.product_id;
            setSelectedProduct(productId);
            onProductClick?.(productId);
          }}
        />
      ))}

      {/* 존 하이라이트 */}
      {showZoneHighlights && visualization.highlightZones.map((zone) => (
        <ZoneHighlight
          key={zone.zoneId}
          zone={zone}
          externalZonePositions={externalZonePositions}
          externalZoneSizes={externalZoneSizes}
        />
      ))}

      {/* 선택된 이동 정보 패널 */}
      {selectedMove && (
        <MovementInfoPanel
          move={furnitureMoves.find(m => m.furnitureId === selectedMove)!}
          storeBounds={storeBounds}
          onClose={() => setSelectedMove(null)}
        />
      )}
    </group>
  );
}

// ============================================================================
// 히트맵 메시 컴포넌트
// ============================================================================

interface HeatmapMeshProps {
  points: Array<{ x: number; z: number; intensity: number }>;
  color: string;
  opacity: number;
  heightScale: number;
  label: string;
  storeBounds: { width: number; depth: number };
}

function HeatmapMesh({ points, color, opacity, heightScale, label, storeBounds }: HeatmapMeshProps) {
  // 히트맵 포인트 좌표를 클램핑
  const clampedPoints = useMemo(() => {
    return points.map(p => {
      const clamped = clampToStoreBounds(p.x, p.z, storeBounds);
      return { ...p, x: clamped.x, z: clamped.z };
    });
  }, [points, storeBounds]);

  const geometry = useMemo(() => {
    const gridSize = 12;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 20, 20);
    const positions = geo.attributes.position.array as Float32Array;

    // 히트맵 데이터로 높이 설정 (클램핑된 포인트 사용)
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      // 가장 가까운 포인트의 강도 찾기
      let intensity = 0;
      clampedPoints.forEach((point) => {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < 2) {
          intensity = Math.max(intensity, point.intensity * (1 - dist / 2));
        }
      });

      positions[i + 2] = intensity * heightScale;
    }

    geo.computeVertexNormals();
    return geo;
  }, [clampedPoints, heightScale]);

  return (
    <group>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 라벨 */}
      <Text
        position={[-5, 2, -5]}
        fontSize={0.4}
        color={color}
        anchorX="left"
      >
        {label}
      </Text>
    </group>
  );
}

// ============================================================================
// 가구 이동 인디케이터 컴포넌트 (고스트 + 곡선 화살표)
// ============================================================================

interface FurnitureMoveIndicatorProps {
  move: {
    furnitureId: string;
    furnitureName: string;
    fromPosition: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    rotation?: number;
  };
  storeBounds: { width: number; depth: number };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * 두 점 사이의 곡선 경로 포인트 생성 (베지어 곡선)
 */
function generateCurvedPath(
  from: [number, number, number],
  to: [number, number, number],
  segments: number = 20
): [number, number, number][] {
  const points: [number, number, number][] = [];

  // 중간점 높이 계산 (거리에 비례)
  const distance = Math.sqrt(
    Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
  );
  const arcHeight = Math.min(distance * 0.3, 2); // 최대 높이 2m

  // 컨트롤 포인트 (중간 위로 올라감)
  const midX = (from[0] + to[0]) / 2;
  const midY = Math.max(from[1], to[1]) + arcHeight;
  const midZ = (from[2] + to[2]) / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // 2차 베지어 곡선
    const x = mt2 * from[0] + 2 * mt * t * midX + t2 * to[0];
    const y = mt2 * from[1] + 2 * mt * t * midY + t2 * to[1];
    const z = mt2 * from[2] + 2 * mt * t * midZ + t2 * to[2];

    points.push([x, y, z]);
  }

  return points;
}

function FurnitureMoveIndicator({
  move,
  storeBounds,
  index,
  isSelected,
  onClick,
}: FurnitureMoveIndicatorProps) {
  const ghostRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 좌표를 매장 경계 내로 클램핑
  const clampedFrom = clampToStoreBounds(move.fromPosition.x, move.fromPosition.z, storeBounds);
  const clampedTo = clampToStoreBounds(move.toPosition.x, move.toPosition.z, storeBounds);

  const from = [clampedFrom.x, 0.3, clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, 0.3, clampedTo.z] as [number, number, number];

  // 곡선 경로 포인트 생성
  const curvedPath = useMemo(() => generateCurvedPath(from, to, 30), [from, to]);

  // 고스트 박스 펄스 애니메이션 + 파티클 이동
  useFrame(({ clock }) => {
    // 고스트 박스 펄스
    if (ghostRef.current) {
      const material = ghostRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 3 + index) + 1) / 2;
      material.opacity = 0.2 + pulse * 0.15;
    }

    // 파티클 경로 따라 이동
    if (particleRef.current && curvedPath.length > 0) {
      const t = ((clock.elapsedTime * 0.5 + index * 0.3) % 1);
      const pathIndex = Math.floor(t * (curvedPath.length - 1));
      const point = curvedPath[pathIndex];
      particleRef.current.position.set(point[0], point[1], point[2]);
    }
  });

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
  const color = colors[index % colors.length];

  return (
    <group>
      {/* ===== 시작점 (As-Is) 마커 ===== */}
      <mesh
        position={from}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={hovered ? 0.6 : 0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* As-Is 라벨 */}
      <Html position={[from[0], from[1] + 0.6, from[2]]} center>
        <div className="px-1.5 py-0.5 bg-red-600/90 text-white text-[9px] rounded font-medium">
          As-Is
        </div>
      </Html>

      {/* ===== 도착점 (To-Be) 고스트 박스 ===== */}
      <mesh
        ref={ghostRef}
        position={to}
        rotation={[0, move.rotation || 0, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.2, 1, 0.8]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
          wireframe={false}
        />
      </mesh>

      {/* 고스트 박스 테두리 */}
      <mesh position={to} rotation={[0, move.rotation || 0, 0]}>
        <boxGeometry args={[1.2, 1, 0.8]} />
        <meshBasicMaterial
          color="#22c55e"
          wireframe={true}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* To-Be 라벨 */}
      <Html position={[to[0], to[1] + 0.8, to[2]]} center>
        <div className="px-1.5 py-0.5 bg-green-600/90 text-white text-[9px] rounded font-medium">
          To-Be
        </div>
      </Html>

      {/* ===== 곡선 이동 경로 ===== */}
      <Line
        points={curvedPath}
        color={isSelected ? '#ffffff' : color}
        lineWidth={isSelected ? 3 : 2}
        dashed={true}
        dashScale={3}
        dashSize={0.3}
        gapSize={0.15}
      />

      {/* 이동하는 파티클 (작은 구) */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>

      {/* 끝점 화살표 헤드 */}
      <group position={to}>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.3, 6]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* ===== 가구 이름 라벨 (호버/선택 시) ===== */}
      {(hovered || isSelected) && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            Math.max(from[1], to[1]) + 1.5,
            (from[2] + to[2]) / 2,
          ]}
          center
        >
          <div className="px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg shadow-lg border border-white/20">
            <div className="font-medium">{move.furnitureName}</div>
            <div className="text-[10px] text-white/60 mt-0.5">
              {Math.sqrt(
                Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
              ).toFixed(1)}m 이동
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 존 하이라이트 컴포넌트
// ============================================================================

interface ZoneHighlightProps {
  zone: {
    zoneId: string;
    color: string;
    opacity: number;
    changeType: 'improved' | 'degraded' | 'new' | 'removed';
  };
  /** 실제 존 위치 데이터 (zones_dim 기반) */
  externalZonePositions?: Record<string, [number, number, number]>;
  /** 실제 존 크기 데이터 (zones_dim 기반) */
  externalZoneSizes?: Record<string, { width: number; depth: number }>;
}

function ZoneHighlight({ zone, externalZonePositions, externalZoneSizes }: ZoneHighlightProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 깜빡임 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
      material.opacity = zone.opacity * (0.7 + pulse * 0.3);
    }
  });

  // 기본 폴백 위치 (외부 데이터 없을 경우)
  const fallbackPositions: Record<string, [number, number, number]> = {
    entrance: [2.5, 0.02, -7.5],
    'zone-a': [0, 0.02, 2],
    'zone-b': [0, 0.02, -2],
    'zone-c': [4, 0.02, 0],
    main: [0, 0.02, 0],
    메인홀: [0, 0.02, 0],
    입구: [2.5, 0.02, -7.5],
    의류존: [-5, 0.02, 3],
    액세서리존: [5, 0.02, 3],
    피팅룸: [-5, 0.02, -5],
    계산대: [4.5, 0.02, 5.5],
  };

  // 실제 존 위치 사용 (우선순위: externalZonePositions > fallbackPositions)
  const zonePositions = externalZonePositions || fallbackPositions;
  const position = zonePositions[zone.zoneId] || zonePositions[zone.zoneId.toLowerCase()] || [0, 0.02, 0];

  // 기본 폴백 크기
  const fallbackSizes: Record<string, { width: number; depth: number }> = {
    entrance: { width: 3, depth: 1 },
    main: { width: 10, depth: 8 },
    메인홀: { width: 10, depth: 8 },
    입구: { width: 3, depth: 1 },
    의류존: { width: 6, depth: 6 },
    액세서리존: { width: 6, depth: 6 },
    피팅룸: { width: 4, depth: 4 },
    계산대: { width: 3, depth: 3 },
  };

  // 실제 존 크기 사용 (우선순위: externalZoneSizes > fallbackSizes)
  const zoneSizes = externalZoneSizes || fallbackSizes;
  const size = zoneSizes[zone.zoneId] || zoneSizes[zone.zoneId.toLowerCase()] || { width: 3, depth: 3 };

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size.width, size.depth]} />
      <meshStandardMaterial
        color={zone.color}
        transparent
        opacity={zone.opacity}
        side={THREE.DoubleSide}
        emissive={zone.color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ============================================================================
// 이동 정보 패널 컴포넌트
// ============================================================================

interface MovementInfoPanelProps {
  move: {
    furnitureId: string;
    furnitureName: string;
    fromPosition: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
  };
  storeBounds: { width: number; depth: number };
  onClose: () => void;
}

function MovementInfoPanel({ move, storeBounds, onClose }: MovementInfoPanelProps) {
  const distance = Math.sqrt(
    Math.pow(move.toPosition.x - move.fromPosition.x, 2) +
    Math.pow(move.toPosition.z - move.fromPosition.z, 2)
  );

  // 패널 위치 클램핑
  const clampedTo = clampToStoreBounds(move.toPosition.x, move.toPosition.z, storeBounds);

  return (
    <Html
      position={[
        clampedTo.x,
        2,
        clampedTo.z,
      ]}
      center
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">{move.furnitureName}</h4>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">이동 전:</span>
            <span className="font-mono">
              ({move.fromPosition.x.toFixed(1)}, {move.fromPosition.z.toFixed(1)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">이동 후:</span>
            <span className="font-mono text-green-500">
              ({move.toPosition.x.toFixed(1)}, {move.toPosition.z.toFixed(1)})
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-muted-foreground">이동 거리:</span>
            <span className="font-semibold">{distance.toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// 제품 재배치 인디케이터 컴포넌트 (곡선 화살표)
// ============================================================================

interface ProductMoveIndicatorProps {
  placement: {
    productId?: string;
    product_id?: string;
    productName?: string;
    sku?: string;
    initial_placement?: {
      furniture_id?: string;
      slot_id?: string;
      position?: { x: number; y: number; z: number };
    };
    optimization_result?: {
      suggested_furniture_id?: string;
      suggested_slot_id?: string;
      suggested_position?: { x: number; y: number; z: number };
      optimization_reason?: string;
      expected_impact?: {
        revenue_change_pct?: number;
        visibility_score?: number;
      };
    };
    current?: { position?: { x: number; y: number; z: number } };
    suggested?: { position?: { x: number; y: number; z: number } };
  };
  storeBounds: { width: number; depth: number };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function ProductMoveIndicator({
  placement,
  storeBounds,
  index,
  isSelected,
  onClick,
}: ProductMoveIndicatorProps) {
  const particleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 위치 추출
  const fromPos = placement.current?.position ||
    placement.initial_placement?.position ||
    { x: -2 + (index % 3) * 2, y: 0.5, z: -1 + Math.floor(index / 3) * 2 };

  const toPos = placement.suggested?.position ||
    placement.optimization_result?.suggested_position ||
    { x: fromPos.x + 2, y: 0.5, z: fromPos.z + 1 };

  // 좌표 클램핑
  const clampedFrom = clampToStoreBounds(fromPos.x, fromPos.z, storeBounds);
  const clampedTo = clampToStoreBounds(toPos.x, toPos.z, storeBounds);

  const from = [clampedFrom.x, 0.8, clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, 0.8, clampedTo.z] as [number, number, number];

  // 곡선 경로 생성 (더 높은 아크)
  const curvedPath = useMemo(() => {
    const points: [number, number, number][] = [];
    const segments = 25;
    const distance = Math.sqrt(
      Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
    );
    const arcHeight = Math.min(distance * 0.5, 1.5);

    const midX = (from[0] + to[0]) / 2;
    const midY = Math.max(from[1], to[1]) + arcHeight;
    const midZ = (from[2] + to[2]) / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      const x = mt2 * from[0] + 2 * mt * t * midX + t2 * to[0];
      const y = mt2 * from[1] + 2 * mt * t * midY + t2 * to[1];
      const z = mt2 * from[2] + 2 * mt * t * midZ + t2 * to[2];

      points.push([x, y, z]);
    }
    return points;
  }, [from, to]);

  // 파티클 애니메이션
  useFrame(({ clock }) => {
    if (particleRef.current && curvedPath.length > 0) {
      const t = ((clock.elapsedTime * 0.8 + index * 0.2) % 1);
      const pathIndex = Math.floor(t * (curvedPath.length - 1));
      const point = curvedPath[pathIndex];
      particleRef.current.position.set(point[0], point[1], point[2]);
    }
  });

  const productName = placement.productName || placement.sku || '상품';
  const impact = placement.optimization_result?.expected_impact;

  // 제품별 다른 색상
  const productColors = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981'];
  const color = productColors[index % productColors.length];

  return (
    <group>
      {/* 시작점 (현재 위치) - 작은 박스 */}
      <mesh
        position={from}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={hovered ? 0.6 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 도착점 (추천 위치) - 작은 구 */}
      <mesh
        position={to}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>

      {/* 곡선 경로 (점선) */}
      <Line
        points={curvedPath}
        color={isSelected ? '#ffffff' : color}
        lineWidth={isSelected ? 2.5 : 1.5}
        dashed={true}
        dashScale={5}
        dashSize={0.15}
        gapSize={0.1}
      />

      {/* 이동 파티클 */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* 도착점 화살표 */}
      <mesh position={[to[0], to[1] + 0.25, to[2]]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 라벨 (호버/선택 시) */}
      {(hovered || isSelected) && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            Math.max(from[1], to[1]) + 1,
            (from[2] + to[2]) / 2,
          ]}
          center
        >
          <div className="px-2 py-1.5 bg-purple-900/95 text-white text-[10px] rounded-lg shadow-lg border border-purple-400/30 min-w-[100px]">
            <div className="font-medium text-xs">{productName}</div>
            <div className="text-purple-300 text-[9px] mt-0.5">
              {placement.initial_placement?.slot_id || '현재'} → {placement.optimization_result?.suggested_slot_id || '추천'}
            </div>
            {impact && (
              <div className="flex gap-1.5 mt-1 text-[9px]">
                {impact.revenue_change_pct !== undefined && (
                  <span className={impact.revenue_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    매출 {impact.revenue_change_pct >= 0 ? '+' : ''}{impact.revenue_change_pct.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default LayoutOptimizationOverlay;
