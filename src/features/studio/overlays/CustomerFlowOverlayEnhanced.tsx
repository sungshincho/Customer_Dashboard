/**
 * CustomerFlowOverlayEnhanced.tsx
 *
 * 고객 동선 흐름 오버레이 (개선 버전)
 * - 존 간 평균 이동 패턴을 라인 + 애니메이션으로 표시
 * - 라인 두께/색상 = 이동 빈도
 * - 애니메이션 점 = 이동 방향
 * - useCustomerFlowData 훅 사용
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useCustomerFlowData, FlowPath, ZoneInfo } from '../hooks/useCustomerFlowData';

interface CustomerFlowOverlayEnhancedProps {
  visible: boolean;
  storeId: string;
  showLabels?: boolean;
  minOpacity?: number;
}

export const CustomerFlowOverlayEnhanced: React.FC<CustomerFlowOverlayEnhancedProps> = ({
  visible,
  storeId,
  showLabels = true,
  minOpacity = 0.3,
}) => {
  const { data, isLoading, error } = useCustomerFlowData({
    storeId,
    daysRange: 30,
    minTransitionCount: 10,
    enabled: visible,
  });

  if (!visible) return null;

  if (isLoading) {
    return (
      <Html center>
        <div className="px-4 py-2 bg-black/80 rounded-lg text-sm text-white">
          동선 데이터 로딩 중...
        </div>
      </Html>
    );
  }

  if (error || !data || data.flowPaths.length === 0) {
    console.warn('[CustomerFlowOverlayEnhanced] 데이터 없음:', error);
    return null;
  }

  return (
    <group name="customer-flow-overlay-enhanced">
      {/* 동선 라인들 */}
      {data.flowPaths.map((path) => (
        <FlowPathLine
          key={path.id}
          path={path}
          maxCount={data.maxTransitionCount}
          showLabel={showLabels}
          minOpacity={minOpacity}
        />
      ))}

      {/* 존 마커 (선택적) */}
      {data.zones.map((zone) => (
        <ZoneMarker key={zone.id} zone={zone} />
      ))}
    </group>
  );
};

// ===== 개별 동선 라인 =====
interface FlowPathLineProps {
  path: FlowPath;
  maxCount: number;
  showLabel: boolean;
  minOpacity: number;
}

const FlowPathLine: React.FC<FlowPathLineProps> = ({
  path,
  maxCount,
  showLabel,
  minOpacity,
}) => {
  const dotRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(Math.random()); // 시작 위치 랜덤

  // 정규화 (0-1)
  const normalizedCount = maxCount > 0 ? path.transition_count / maxCount : 0.5;

  // 라인 스타일
  const lineWidth = 1 + normalizedCount * 4; // 1-5px
  const opacity = minOpacity + normalizedCount * (1 - minOpacity);

  // 색상: 빈도에 따라 (초록 → 노랑 → 빨강)
  const color = useMemo(() => {
    if (normalizedCount < 0.33) {
      return '#22c55e'; // 초록 (낮은 빈도)
    } else if (normalizedCount < 0.66) {
      return '#eab308'; // 노랑 (중간 빈도)
    } else {
      return '#ef4444'; // 빨강 (높은 빈도)
    }
  }, [normalizedCount]);

  // 경로 포인트 (베지어 곡선)
  const { points, midPoint } = useMemo(() => {
    const from = new THREE.Vector3(
      path.from_zone.center.x,
      0.15,
      path.from_zone.center.z
    );
    const to = new THREE.Vector3(
      path.to_zone.center.x,
      0.15,
      path.to_zone.center.z
    );

    // 중간점 (위로 살짝 곡선)
    const mid = new THREE.Vector3()
      .addVectors(from, to)
      .multiplyScalar(0.5);
    mid.y = 0.3 + normalizedCount * 0.3; // 빈도가 높을수록 더 높은 곡선

    // 베지어 곡선
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const curvePoints = curve.getPoints(30);

    return { points: curvePoints, midPoint: mid };
  }, [path, normalizedCount]);

  // 애니메이션: 점이 경로를 따라 이동
  useFrame((_, delta) => {
    if (dotRef.current && points.length > 1) {
      // 속도: 이동 시간에 반비례 (빠른 경로 = 빠른 애니메이션)
      const speed = 60 / Math.max(path.avg_duration_seconds, 30); // 30-180초 → 0.33-2 속도
      progressRef.current = (progressRef.current + delta * speed * 0.5) % 1;

      const idx = Math.floor(progressRef.current * (points.length - 1));
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const t = (progressRef.current * (points.length - 1)) % 1;

      const pos = new THREE.Vector3().lerpVectors(points[idx], points[nextIdx], t);
      dotRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* 경로 라인 */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />

      {/* 이동하는 점 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.1 + normalizedCount * 0.1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* 방향 화살표 */}
      <FlowArrow
        points={points}
        color={color}
        size={0.15 + normalizedCount * 0.1}
      />

      {/* 라벨 */}
      {showLabel && normalizedCount > 0.3 && (
        <Html position={midPoint.toArray()} center distanceFactor={20}>
          <div className="px-2 py-1 bg-black/90 backdrop-blur-sm rounded-lg text-xs whitespace-nowrap border border-white/20 shadow-lg pointer-events-none">
            <div className="font-medium text-white">
              {path.from_zone.zone_name} → {path.to_zone.zone_name}
            </div>
            <div className="text-white/70 flex items-center gap-2">
              <span>{path.transition_count.toLocaleString()}회</span>
              <span>•</span>
              <span>평균 {Math.round(path.avg_duration_seconds)}초</span>
              <span>•</span>
              <span>{Math.round(path.transition_probability * 100)}%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ===== 방향 화살표 =====
interface FlowArrowProps {
  points: THREE.Vector3[];
  color: string;
  size: number;
}

const FlowArrow: React.FC<FlowArrowProps> = ({ points, color, size }) => {
  const arrowMesh = useMemo(() => {
    if (points.length < 3) return null;

    // 끝에서 약간 앞 위치에 화살표
    const endIdx = points.length - 1;
    const prevIdx = Math.max(0, endIdx - 3);

    const direction = new THREE.Vector3()
      .subVectors(points[endIdx], points[prevIdx])
      .normalize();

    const position = points[endIdx].clone().sub(direction.clone().multiplyScalar(0.3));

    // 화살표 방향 회전
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(up, direction);

    return { position, quaternion };
  }, [points]);

  if (!arrowMesh) return null;

  return (
    <mesh position={arrowMesh.position} quaternion={arrowMesh.quaternion}>
      <coneGeometry args={[size, size * 2.5, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

// ===== 존 마커 =====
const ZoneMarker: React.FC<{ zone: ZoneInfo }> = ({ zone }) => {
  return (
    <group position={[zone.center.x, 0.05, zone.center.z]}>
      {/* 존 중심 원 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export default CustomerFlowOverlayEnhanced;
