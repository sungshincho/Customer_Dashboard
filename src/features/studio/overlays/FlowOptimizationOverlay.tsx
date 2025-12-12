/**
 * FlowOptimizationOverlay.tsx
 *
 * 동선 최적화 3D 오버레이
 * - 애니메이션 경로 시각화
 * - 병목 지점 마커
 * - 동선 히트맵
 * - 존 간 이동 화살표
 */

import { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { FlowSimulationResult, FlowPath, FlowBottleneck } from '../hooks/useFlowSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

interface FlowOptimizationOverlayProps {
  result: FlowSimulationResult | null;
  showPaths?: boolean;
  showBottlenecks?: boolean;
  showHeatmap?: boolean;
  showFlowArrows?: boolean;
  animatePaths?: boolean;
  pathOpacity?: number;
  selectedPathId?: string | null;
  onPathClick?: (pathId: string) => void;
  onBottleneckClick?: (bottleneckId: string) => void;
  /** 매장 경계 (좌표 클램핑용) */
  storeBounds?: {
    width: number;
    depth: number;
  };
}

// ============================================================================
// 좌표 클램핑 헬퍼
// ============================================================================

/**
 * 3D 좌표를 매장 경계 내로 클램핑
 * 매장은 원점 중심으로 배치되므로 x: [-width/2, width/2], z: [-depth/2, depth/2]
 */
function clampToStoreBounds(
  x: number,
  z: number,
  bounds: { width: number; depth: number }
): { x: number; z: number } {
  const halfWidth = bounds.width / 2;
  const halfDepth = bounds.depth / 2;

  // 약간의 패딩을 두어 경계 바로 위에 표시되지 않도록 함
  const padding = 0.5;

  return {
    x: Math.max(-halfWidth + padding, Math.min(halfWidth - padding, x)),
    z: Math.max(-halfDepth + padding, Math.min(halfDepth - padding, z)),
  };
}

// ============================================================================
// 컴포넌트
// ============================================================================

// 기본 매장 경계값 (일반적인 소매점 크기)
const DEFAULT_STORE_BOUNDS = { width: 17.4, depth: 16.6 };

export function FlowOptimizationOverlay({
  result,
  showPaths = true,
  showBottlenecks = true,
  showHeatmap = true,
  showFlowArrows = true,
  animatePaths = true,
  pathOpacity = 0.8,
  selectedPathId,
  onPathClick,
  onBottleneckClick,
  storeBounds = DEFAULT_STORE_BOUNDS,
}: FlowOptimizationOverlayProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredBottleneck, setHoveredBottleneck] = useState<string | null>(null);

  if (!result) return null;

  const { visualization, paths, bottlenecks } = result;

  // 안전 체크: visualization 속성 확인
  const hasVisualization = visualization && typeof visualization === 'object';
  const hasFlowHeatmap = hasVisualization && Array.isArray(visualization.flowHeatmap) && visualization.flowHeatmap.length > 0;
  const hasZoneFlowArrows = hasVisualization && Array.isArray(visualization.zoneFlowArrows);
  const hasPaths = Array.isArray(paths);
  const hasBottlenecks = Array.isArray(bottlenecks);

  return (
    <group name="flow-optimization-overlay">
      {/* 동선 히트맵 */}
      {showHeatmap && hasFlowHeatmap && (
        <FlowHeatmap data={visualization.flowHeatmap} />
      )}

      {/* 존 간 이동 화살표 */}
      {showFlowArrows && hasZoneFlowArrows && visualization.zoneFlowArrows.map((arrow, idx) => (
        <FlowArrow key={idx} arrow={arrow} storeBounds={storeBounds} />
      ))}

      {/* 애니메이션 경로 */}
      {showPaths && hasPaths && paths.slice(0, 15).map((path) => (
        <AnimatedPath
          key={path.id}
          path={path}
          storeBounds={storeBounds}
          animate={animatePaths}
          opacity={pathOpacity}
          isSelected={selectedPathId === path.id}
          isHovered={hoveredPath === path.id}
          onClick={() => onPathClick?.(path.id)}
          onHover={(hovered) => setHoveredPath(hovered ? path.id : null)}
        />
      ))}

      {/* 병목 지점 마커 */}
      {showBottlenecks && hasBottlenecks && bottlenecks.map((bottleneck) => (
        <BottleneckMarker
          key={bottleneck.id}
          bottleneck={bottleneck}
          storeBounds={storeBounds}
          isHovered={hoveredBottleneck === bottleneck.id}
          onClick={() => onBottleneckClick?.(bottleneck.id)}
          onHover={(hovered) => setHoveredBottleneck(hovered ? bottleneck.id : null)}
        />
      ))}

      {/* 경로 정보 패널 */}
      {selectedPathId && hasPaths && paths.find(p => p.id === selectedPathId) && (
        <PathInfoPanel
          path={paths.find(p => p.id === selectedPathId)!}
          onClose={() => onPathClick?.(selectedPathId)}
        />
      )}
    </group>
  );
}

// ============================================================================
// 동선 히트맵 컴포넌트
// ============================================================================

interface FlowHeatmapProps {
  data: Array<{ x: number; z: number; density: number }>;
}

function FlowHeatmap({ data }: FlowHeatmapProps) {
  const geometry = useMemo(() => {
    const gridSize = 12;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 20, 20);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      // 가장 가까운 포인트의 밀도 찾기
      let density = 0;
      data.forEach((point) => {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < 2) {
          density = Math.max(density, point.density * (1 - dist / 2));
        }
      });

      // 높이 설정
      positions[i + 2] = density * 0.5;

      // 색상 설정 (파란색 -> 녹색 -> 노란색 -> 빨간색)
      const color = getFlowColor(density);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function getFlowColor(density: number): { r: number; g: number; b: number } {
  if (density < 0.25) {
    const t = density / 0.25;
    return { r: 0, g: t, b: 1 - t };
  } else if (density < 0.5) {
    const t = (density - 0.25) / 0.25;
    return { r: t, g: 1, b: 0 };
  } else if (density < 0.75) {
    const t = (density - 0.5) / 0.25;
    return { r: 1, g: 1 - t * 0.5, b: 0 };
  } else {
    const t = (density - 0.75) / 0.25;
    return { r: 1, g: 0.5 - t * 0.5, b: 0 };
  }
}

// ============================================================================
// 애니메이션 경로 컴포넌트
// ============================================================================

interface AnimatedPathProps {
  path: FlowPath;
  storeBounds: { width: number; depth: number };
  animate: boolean;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function AnimatedPath({
  path,
  storeBounds,
  animate,
  opacity,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: AnimatedPathProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(Math.random()); // 초기 위치 랜덤화

  // 좌표를 클램핑하여 경로 포인트 계산
  const clampedPoints = useMemo(() => {
    return path.points.map(p => {
      const clamped = clampToStoreBounds(p.x, p.z, storeBounds);
      return { x: clamped.x, y: p.y, z: clamped.z };
    });
  }, [path.points, storeBounds]);

  // 경로 애니메이션
  useFrame((_, delta) => {
    if (!animate || !markerRef.current || clampedPoints.length < 2) return;

    progressRef.current += delta * 0.2;
    if (progressRef.current > 1) progressRef.current = 0;

    const t = progressRef.current;
    const idx = Math.floor(t * (clampedPoints.length - 1));
    const nextIdx = Math.min(idx + 1, clampedPoints.length - 1);
    const localT = (t * (clampedPoints.length - 1)) % 1;

    const current = clampedPoints[idx];
    const next = clampedPoints[nextIdx];

    markerRef.current.position.set(
      current.x + (next.x - current.x) * localT,
      current.y + (next.y - current.y) * localT,
      current.z + (next.z - current.z) * localT
    );
  });

  const linePoints = clampedPoints.map(p => [p.x, p.y, p.z] as [number, number, number]);
  const color = path.converted ? '#22c55e' : '#f59e0b';
  const lineWidth = isSelected ? 4 : isHovered ? 3 : 2;

  return (
    <group>
      {/* 경로 선 */}
      <Line
        points={linePoints}
        color={isSelected ? '#ffffff' : color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity * (isSelected ? 1 : isHovered ? 0.9 : 0.6)}
      />

      {/* 이동 마커 */}
      {animate && (
        <mesh
          ref={markerRef}
          onClick={onClick}
          onPointerOver={() => onHover(true)}
          onPointerOut={() => onHover(false)}
        >
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* 시작점 마커 */}
      {clampedPoints.length > 0 && (
        <mesh position={[clampedPoints[0].x, clampedPoints[0].y, clampedPoints[0].z]}>
          <ringGeometry args={[0.15, 0.2, 16]} />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 끝점 마커 */}
      {clampedPoints.length > 1 && (
        <mesh
          position={[
            clampedPoints[clampedPoints.length - 1].x,
            clampedPoints[clampedPoints.length - 1].y,
            clampedPoints[clampedPoints.length - 1].z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color={path.converted ? '#22c55e' : '#ef4444'} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 존 간 이동 화살표 컴포넌트
// ============================================================================

interface FlowArrowProps {
  arrow: {
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
    volume: number;
  };
  storeBounds: { width: number; depth: number };
}

function FlowArrow({ arrow, storeBounds }: FlowArrowProps) {
  const arrowRef = useRef<THREE.Group>(null);

  // 화살표 펄스 애니메이션
  useFrame(({ clock }) => {
    if (arrowRef.current) {
      const pulse = (Math.sin(clock.elapsedTime * 2) + 1) / 2;
      arrowRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 0.3;
        }
      });
    }
  });

  // 좌표를 매장 경계 내로 클램핑
  const clampedFrom = clampToStoreBounds(arrow.from.x, arrow.from.z, storeBounds);
  const clampedTo = clampToStoreBounds(arrow.to.x, arrow.to.z, storeBounds);

  const from = [clampedFrom.x, arrow.from.y, clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, arrow.to.y, clampedTo.z] as [number, number, number];
  const midPoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.5,
    (from[2] + to[2]) / 2,
  ];

  // 화살표 방향 계산
  const direction = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  ).normalize();

  const opacity = 0.4 + arrow.volume * 0.4;
  const color = arrow.volume > 0.6 ? '#ef4444' : arrow.volume > 0.3 ? '#f59e0b' : '#22c55e';
  const width = 1 + arrow.volume * 2;

  return (
    <group ref={arrowRef}>
      {/* 곡선 경로 */}
      <Line
        points={[from, midPoint, to]}
        color={color}
        lineWidth={width}
        transparent
        opacity={opacity}
      />

      {/* 화살표 머리 */}
      <mesh
        position={to}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        )}
      >
        <coneGeometry args={[0.15 + arrow.volume * 0.1, 0.4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 볼륨 라벨 */}
      <Text
        position={midPoint}
        fontSize={0.25}
        color={color}
      >
        {`${Math.round(arrow.volume * 100)}%`}
      </Text>
    </group>
  );
}

// ============================================================================
// 병목 지점 마커 컴포넌트
// ============================================================================

interface BottleneckMarkerProps {
  bottleneck: FlowBottleneck;
  storeBounds: { width: number; depth: number };
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function BottleneckMarker({
  bottleneck,
  storeBounds,
  isHovered,
  onClick,
  onHover,
}: BottleneckMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 펄스 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // 좌표를 매장 경계 내로 클램핑
  const clampedPos = clampToStoreBounds(
    bottleneck.position.x,
    bottleneck.position.z,
    storeBounds
  );
  const position = [clampedPos.x, 0.5, clampedPos.z] as [number, number, number];
  const radius = 0.3 + bottleneck.severity * 0.5;
  const color = bottleneck.severity > 0.7 ? '#ef4444' :
                bottleneck.severity > 0.4 ? '#f59e0b' : '#fbbf24';

  return (
    <group>
      {/* 경고 원 */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.4}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 바닥 링 */}
      <mesh
        position={[position[0], 0.05, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[radius + 0.1, radius + 0.3, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 정보 패널 */}
      {isHovered && (
        <Html
          position={[position[0], position[1] + 1.5, position[2]]}
          center
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg min-w-[150px]">
            <h4 className="font-semibold text-xs text-destructive mb-1">
              병목 지점
            </h4>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">위치:</span>
                <span>{bottleneck.zoneName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">심각도:</span>
                <span style={{ color }}>{(bottleneck.severity * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">대기시간:</span>
                <span>{bottleneck.avgWaitTime}초</span>
              </div>
              <div className="text-muted-foreground mt-1 pt-1 border-t border-border">
                원인: {bottleneck.cause}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 경로 정보 패널 컴포넌트
// ============================================================================

interface PathInfoPanelProps {
  path: FlowPath;
  onClose: () => void;
}

function PathInfoPanel({ path, onClose }: PathInfoPanelProps) {
  if (!path || path.points.length === 0) return null;

  const lastPoint = path.points[path.points.length - 1];

  return (
    <Html
      position={[lastPoint.x, lastPoint.y + 1.5, lastPoint.z]}
      center
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">고객 동선</h4>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">타입:</span>
            <span>{path.customerType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 시간:</span>
            <span>{Math.floor(path.totalTime / 60)}분 {path.totalTime % 60}초</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">이동 거리:</span>
            <span>{path.totalDistance.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">구매 의향:</span>
            <span>{(path.purchaseIntent * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">결과:</span>
            <span className={path.converted ? 'text-green-500' : 'text-orange-500'}>
              {path.converted ? '구매' : '이탈'}
            </span>
          </div>
        </div>
        {path.dwellZones.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">체류 구역:</p>
            {path.dwellZones.map((zone, idx) => (
              <div key={idx} className="text-[10px] flex justify-between">
                <span>{zone.zoneName}</span>
                <span>{zone.duration}초</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Html>
  );
}

export default FlowOptimizationOverlay;
