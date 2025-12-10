/**
 * CustomerAvatarOverlay.tsx
 *
 * 고객 아바타 오버레이 - 실시간 고객 위치 시각화
 * - InstancedMesh로 100+ 아바타 효율적 렌더링
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CustomerAvatarOverlayProps, CustomerAvatar, CustomerStatus } from '../types';

// ============================================================================
// 기본 색상
// ============================================================================
const DEFAULT_COLORS: Record<CustomerStatus, string> = {
  browsing: '#3b82f6', // blue
  purchasing: '#22c55e', // green
  leaving: '#6b7280', // gray
  idle: '#a855f7', // purple
};

// ============================================================================
// CustomerAvatarOverlay 컴포넌트
// ============================================================================
export function CustomerAvatarOverlay({
  customers,
  showTrails = false,
  trailLength = 10,
  scale = 1,
  colors = DEFAULT_COLORS,
}: CustomerAvatarOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 색상별 고객 그룹화
  const groupedCustomers = useMemo(() => {
    const groups: Record<CustomerStatus, CustomerAvatar[]> = {
      browsing: [],
      purchasing: [],
      leaving: [],
      idle: [],
    };

    customers.forEach((customer) => {
      groups[customer.status].push(customer);
    });

    return groups;
  }, [customers]);

  // 인스턴스 업데이트
  useFrame(() => {
    if (!meshRef.current) return;

    let instanceIndex = 0;
    customers.forEach((customer) => {
      dummy.position.set(
        customer.position[0],
        customer.position[1] + 0.5 * scale,
        customer.position[2]
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(instanceIndex, dummy.matrix);

      // 색상 설정
      const color = new THREE.Color(colors[customer.status] || colors.browsing);
      meshRef.current!.setColorAt(instanceIndex, color);

      instanceIndex++;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const maxInstances = Math.max(customers.length, 100);

  return (
    <group>
      {/* 아바타 인스턴스 */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, maxInstances]}
        frustumCulled={false}
      >
        <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.9}
          roughness={0.5}
          metalness={0.1}
        />
      </instancedMesh>

      {/* 트레일 (옵션) */}
      {showTrails &&
        customers.map((customer) => (
          <CustomerTrail
            key={customer.id}
            customer={customer}
            length={trailLength}
            color={colors[customer.status]}
          />
        ))}
    </group>
  );
}

// ============================================================================
// CustomerTrail 컴포넌트
// ============================================================================
interface CustomerTrailProps {
  customer: CustomerAvatar;
  length: number;
  color: string;
}

function CustomerTrail({ customer, length, color }: CustomerTrailProps) {
  const trailRef = useRef<THREE.Vector3[]>([]);

  useFrame(() => {
    const currentPos = new THREE.Vector3(...customer.position);

    // 트레일 업데이트
    trailRef.current.unshift(currentPos);
    if (trailRef.current.length > length) {
      trailRef.current.pop();
    }
  });

  if (trailRef.current.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={trailRef.current.length}
          array={new Float32Array(trailRef.current.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={2} />
    </line>
  );
}

export default CustomerAvatarOverlay;
