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
  showZoneHighlights?: boolean;
  animationSpeed?: number;
  onFurnitureClick?: (furnitureId: string) => void;
  /** 매장 경계 (좌표 클램핑용) */
  storeBounds?: {
    width: number;
    depth: number;
  };
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
  showZoneHighlights = true,
  animationSpeed = 1,
  onFurnitureClick,
  storeBounds = DEFAULT_STORE_BOUNDS,
}: LayoutOptimizationOverlayProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const animationRef = useRef(0);

  // 애니메이션 프레임
  useFrame((_, delta) => {
    animationRef.current += delta * animationSpeed;
  });

  if (!result) return null;

  const { visualization, furnitureMoves } = result;

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

      {/* 존 하이라이트 */}
      {showZoneHighlights && visualization.highlightZones.map((zone) => (
        <ZoneHighlight
          key={zone.zoneId}
          zone={zone}
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
// 가구 이동 인디케이터 컴포넌트
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

function FurnitureMoveIndicator({
  move,
  storeBounds,
  index,
  isSelected,
  onClick,
}: FurnitureMoveIndicatorProps) {
  const arrowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 화살표 애니메이션
  useFrame(({ clock }) => {
    if (arrowRef.current) {
      const t = (Math.sin(clock.elapsedTime * 2 + index) + 1) / 2;
      arrowRef.current.position.y = 0.5 + t * 0.2;
    }
  });

  // 좌표를 매장 경계 내로 클램핑
  const clampedFrom = clampToStoreBounds(move.fromPosition.x, move.fromPosition.z, storeBounds);
  const clampedTo = clampToStoreBounds(move.toPosition.x, move.toPosition.z, storeBounds);

  const from = [clampedFrom.x, 0.5, clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, 0.5, clampedTo.z] as [number, number, number];

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
  const color = colors[index % colors.length];

  return (
    <group>
      {/* 시작점 마커 */}
      <mesh
        position={from}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 도착점 마커 */}
      <mesh
        ref={arrowRef}
        position={to}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={hovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* 이동 경로 선 */}
      <Line
        points={[from, to]}
        color={isSelected ? '#ffffff' : color}
        lineWidth={isSelected ? 3 : 2}
        dashed={!isSelected}
        dashScale={2}
        dashSize={0.5}
        gapSize={0.2}
      />

      {/* 가구 이름 라벨 */}
      {(hovered || isSelected) && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            1,
            (from[2] + to[2]) / 2,
          ]}
          center
        >
          <div className="px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
            {move.furnitureName}
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
}

function ZoneHighlight({ zone }: ZoneHighlightProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 깜빡임 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
      material.opacity = zone.opacity * (0.7 + pulse * 0.3);
    }
  });

  // 존 위치 (임시 - 실제로는 존 데이터에서 가져와야 함)
  const zonePositions: Record<string, [number, number, number]> = {
    entrance: [-4, 0.02, 0],
    'zone-a': [0, 0.02, 2],
    'zone-b': [0, 0.02, -2],
    'zone-c': [4, 0.02, 0],
  };

  const position = zonePositions[zone.zoneId] || [0, 0.02, 0];

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3, 3]} />
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

export default LayoutOptimizationOverlay;
