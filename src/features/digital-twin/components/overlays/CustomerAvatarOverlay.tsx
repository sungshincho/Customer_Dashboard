import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CustomerAvatar, CustomerAvatarOverlayProps, AvatarColors } from '../../types/avatar.types';

// 아바타 색상 설정
const AVATAR_COLORS: AvatarColors = {
  browsing: '#1B6BFF',   // Electric Blue
  purchasing: '#10B981', // Green
  leaving: '#6B7280'     // Gray
};

/**
 * CustomerAvatarOverlay
 * 
 * Instanced Rendering을 활용하여 100명 이상의 고객 아바타를 효율적으로 렌더링합니다.
 * 
 * 성능 최적화:
 * - InstancedMesh: 단일 draw call로 모든 아바타 렌더링
 * - useMemo: geometry와 material 캐싱
 * - useFrame: 효율적인 위치 업데이트
 * - Frustum Culling: 자동으로 화면 밖 오브젝트 제외
 */
export function CustomerAvatarOverlay({
  customers,
  maxInstances = 200,
  animationSpeed = 1.0,
  showTrails = false
}: CustomerAvatarOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailsRef = useRef<Map<string, THREE.Vector3[]>>(new Map());
  const timeRef = useRef(0);

  // Geometry와 Material을 useMemo로 캐싱 (재생성 방지)
  const geometry = useMemo(() => {
    // 캡슐 형태의 아바타 (실린더 + 구)
    return new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
  }, []);

  const materials = useMemo(() => ({
    browsing: new THREE.MeshStandardMaterial({
      color: AVATAR_COLORS.browsing,
      emissive: AVATAR_COLORS.browsing,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7
    }),
    purchasing: new THREE.MeshStandardMaterial({
      color: AVATAR_COLORS.purchasing,
      emissive: AVATAR_COLORS.purchasing,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7
    }),
    leaving: new THREE.MeshStandardMaterial({
      color: AVATAR_COLORS.leaving,
      emissive: AVATAR_COLORS.leaving,
      emissiveIntensity: 0.1,
      metalness: 0.5,
      roughness: 0.8
    })
  }), []);

  // 임시 객체 재사용 (가비지 컬렉션 감소)
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // 초기 인스턴스 설정
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const count = Math.min(customers.length, maxInstances);

    customers.slice(0, count).forEach((customer, i) => {
      // 위치 설정
      tempObject.position.set(
        customer.position.x,
        customer.position.y + 0.6, // 바닥에서 살짝 띄움
        customer.position.z
      );

      // 랜덤 회전 (자연스러움)
      tempObject.rotation.y = Math.random() * Math.PI * 2;
      
      // 스케일 (약간의 변화)
      const scale = 0.9 + Math.random() * 0.2;
      tempObject.scale.set(scale, scale, scale);

      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // 색상 설정
      const color = AVATAR_COLORS[customer.status];
      tempColor.set(color);
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [customers, maxInstances, tempObject, tempColor]);

  // 애니메이션 프레임 업데이트
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta * animationSpeed;
    const mesh = meshRef.current;
    const count = Math.min(customers.length, maxInstances);

    customers.slice(0, count).forEach((customer, i) => {
      // 현재 매트릭스 가져오기
      mesh.getMatrixAt(i, tempObject.matrix);
      tempObject.matrix.decompose(
        tempObject.position,
        tempObject.quaternion,
        tempObject.scale
      );

      // 부드러운 이동 (속도가 있는 경우)
      if (customer.velocity) {
        tempObject.position.x += customer.velocity.x * delta * animationSpeed;
        tempObject.position.z += customer.velocity.z * delta * animationSpeed;
      }

      // 미세한 상하 움직임 (걷는 효과)
      const bobAmount = customer.status === 'browsing' ? 0.05 : 0.02;
      const bobSpeed = customer.status === 'browsing' ? 4 : 2;
      tempObject.position.y = 
        customer.position.y + 0.6 + 
        Math.sin(timeRef.current * bobSpeed + i) * bobAmount;

      // 방향 전환 애니메이션
      if (customer.velocity) {
        const targetRotation = Math.atan2(customer.velocity.x, customer.velocity.z);
        tempObject.rotation.y = THREE.MathUtils.lerp(
          tempObject.rotation.y,
          targetRotation,
          delta * 5
        );
      }

      // 매트릭스 업데이트
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // 트레일 업데이트 (옵션)
      if (showTrails) {
        let trail = trailsRef.current.get(customer.id);
        if (!trail) {
          trail = [];
          trailsRef.current.set(customer.id, trail);
        }
        trail.push(tempObject.position.clone());
        if (trail.length > 20) trail.shift(); // 최대 20개 포인트
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Instanced Mesh - 모든 아바타를 단일 draw call로 렌더링 */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, materials.browsing, maxInstances]}
        frustumCulled={true} // 화면 밖 자동 제외
      >
        {/* Geometry와 Material은 args로 전달 */}
      </instancedMesh>

      {/* 상태별 보조 표시 */}
      {customers.slice(0, Math.min(customers.length, maxInstances)).map((customer, i) => (
        <group key={customer.id} position={[customer.position.x, 0.01, customer.position.z]}>
          {/* 바닥 원형 인디케이터 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.5, 16]} />
            <meshBasicMaterial
              color={AVATAR_COLORS[customer.status]}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 구매 중일 때 위쪽 링 */}
          {customer.status === 'purchasing' && (
            <mesh position={[0, 2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 0.4, 16]} />
              <meshBasicMaterial
                color="#10B981"
                transparent
                opacity={0.6 + Math.sin(timeRef.current * 3) * 0.2}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* 조명 (아바타가 잘 보이도록) */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  );
}
