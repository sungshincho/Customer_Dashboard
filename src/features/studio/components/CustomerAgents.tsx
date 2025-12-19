// src/features/studio/components/CustomerAgents.tsx

/**
 * 고객 에이전트 3D 컴포넌트
 *
 * - 3D 공간에 고객 에이전트 렌더링
 * - GLB 아바타 모델 지원 (avatar_url)
 * - 상태에 따른 색상 표시
 * - 선택적 경로 시각화
 */

import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Line, Html, useGLTF } from '@react-three/drei';
import { useSimulationStore, STATE_COLORS } from '@/stores/simulationStore';

interface CustomerAgentsProps {
  showPaths?: boolean;
  showLabels?: boolean;
}

// GLB 아바타 컴포넌트
interface GLBAvatarProps {
  url: string;
  color: string;
  position: [number, number, number];
}

function GLBAvatar({ url, color, position }: GLBAvatarProps) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 상태 색상으로 emissive 적용
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material.clone();
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = 0.2;
          child.material = mat;
        }
      }
    });
    return cloned;
  }, [scene, color]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[1, 1, 1]}
    />
  );
}

// 폴백 캡슐 아바타
interface FallbackAvatarProps {
  color: string;
}

function FallbackAvatar({ color }: FallbackAvatarProps) {
  return (
    <>
      {/* 고객 몸체 - 캡슐 형태 */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.12, 0.35, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* 머리 */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
}

// GLB 로드 에러 시 폴백으로 전환하는 래퍼
function AvatarWithFallback({ url, color }: { url: string; color: string }) {
  try {
    return (
      <Suspense fallback={<FallbackAvatar color={color} />}>
        <GLBAvatar url={url} color={color} position={[0, 0, 0]} />
      </Suspense>
    );
  } catch {
    return <FallbackAvatar color={color} />;
  }
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
      {customers.map((customer) => {
        // 상태에 따른 색상 (STATE_COLORS 사용)
        const stateColor = STATE_COLORS[customer.state] || customer.color;

        return (
          <group key={customer.id} position={customer.position}>
            {/* GLB 모델이 있으면 GLB, 없으면 캡슐 폴백 */}
            {customer.avatar_url ? (
              <AvatarWithFallback url={customer.avatar_url} color={stateColor} />
            ) : (
              <FallbackAvatar color={stateColor} />
            )}

            {/* 상태 표시 링 (위에 떠있음) */}
            <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.06, 0.1, 16]} />
              <meshBasicMaterial
                color={stateColor}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 바닥 그림자/표시 */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.2, 16]} />
              <meshBasicMaterial
                color={stateColor}
                transparent
                opacity={0.3}
              />
            </mesh>

            {/* 경로 표시 (옵션) */}
            {(showPaths || config.showAgentPaths) && customer.path && customer.path.length > 1 && (
              <Line
                points={customer.path}
                color={stateColor}
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
        );
      })}
    </group>
  );
}

export default CustomerAgents;
