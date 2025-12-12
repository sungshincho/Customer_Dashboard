// src/features/studio/components/CustomerAgents.tsx

/**
 * 고객 에이전트 3D 컴포넌트
 *
 * - 3D 공간에 고객 에이전트 렌더링
 * - 상태에 따른 색상 표시
 * - 선택적 경로 시각화
 */

import { useRef } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useSimulationStore } from '@/stores/simulationStore';

interface CustomerAgentsProps {
  showPaths?: boolean;
  showLabels?: boolean;
}

export function CustomerAgents({ showPaths = false, showLabels = false }: CustomerAgentsProps) {
  const customers = useSimulationStore((state) => state.customers);
  const config = useSimulationStore((state) => state.config);
  const groupRef = useRef<THREE.Group>(null);

  // 고객이 없으면 렌더링하지 않음
  if (!customers || customers.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} name="customer-agents">
      {customers.map((customer) => (
        <group key={customer.id} position={customer.position}>
          {/* 고객 몸체 - 캡슐 형태 */}
          <mesh castShadow position={[0, 0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.35, 8, 16]} />
            <meshStandardMaterial
              color={customer.color}
              emissive={customer.color}
              emissiveIntensity={0.3}
              roughness={0.7}
            />
          </mesh>

          {/* 머리 */}
          <mesh castShadow position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={customer.color}
              emissive={customer.color}
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* 상태 표시 링 (위에 떠있음) */}
          <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.06, 0.1, 16]} />
            <meshBasicMaterial
              color={customer.color}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 바닥 그림자/표시 */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.2, 16]} />
            <meshBasicMaterial
              color={customer.color}
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* 경로 표시 (옵션) */}
          {(showPaths || config.showAgentPaths) && customer.path && customer.path.length > 1 && (
            <Line
              points={customer.path}
              color={customer.color}
              lineWidth={1}
              transparent
              opacity={0.3}
            />
          )}

          {/* 라벨 표시 (옵션) */}
          {showLabels && (
            <Html position={[0, 1.1, 0]} center>
              <div
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {customer.state}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

export default CustomerAgents;
