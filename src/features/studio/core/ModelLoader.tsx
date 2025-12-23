/**
 * ModelLoader.tsx
 *
 * 3D 모델 로딩 컴포넌트
 * - GLTF/GLB 모델 로드
 * - 선택/호버 상태 표시
 * - 에러 처리
 */

import { useRef, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from '../types';
import {
  isBakedModel,
  prepareClonedSceneForBaked,
} from '@/features/simulation/utils/bakedMaterialUtils';


// ============================================================================
// Props
// ============================================================================
interface ModelLoaderProps {
  url: string;
  modelId?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ============================================================================
// ModelLoader 컴포넌트
// ============================================================================
export function ModelLoader({
  url,
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  castShadow = true,
  receiveShadow = true,
}: ModelLoaderProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);

  // 유효한 URL인지 확인
  const isValidUrl = useMemo(() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      // 상대 경로도 허용
      return url.startsWith('/') || url.startsWith('./');
    }
  }, [url]);

  if (!isValidUrl || hasError) {
    return (
      <FallbackModel
        modelId={modelId}
        position={position}
        rotation={rotation}
        scale={scale}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }

  return (
    <GLTFModel
      url={url}
      modelId={modelId}
      position={position}
      rotation={rotation}
      scale={scale}
      selected={selected}
      hovered={hovered}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onError={() => setHasError(true)}
    />
  );
}

// ============================================================================
// GLTF 모델 로더
// ============================================================================
interface GLTFModelProps extends ModelLoaderProps {
  onError?: () => void;
}

function GLTFModel({
  url,
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  castShadow = true,
  receiveShadow = true,
  onError,
}: GLTFModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [boundingBox, setBoundingBox] = useState<{ width: number; height: number; depth: number; centerY: number } | null>(null);
  const boundingBoxCalculated = useRef(false);

  // GLTF 로드
  const { scene } = useGLTF(url, true, true, (error) => {
    console.error('GLTF load error:', error);
    onError?.();
  });

  const shouldUseBaked = useMemo(() => isBakedModel(url), [url]);

  // 씬 클론 (여러 인스턴스 사용 가능)
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    // Baked 모델 처리
    if (shouldUseBaked) {
      prepareClonedSceneForBaked(cloned, {
        convertToBasic: true,
        disableShadows: true,
      });
    }

    // 그림자 설정
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });

    // 클론 변경 시 BoundingBox 재계산 필요
    boundingBoxCalculated.current = false;

    return cloned;
  }, [scene, castShadow, receiveShadow, shouldUseBaked]);

  // 실제 렌더링 후 BoundingBox 계산 (useFrame으로 한 번만 실행)
  useFrame(() => {
    if (!boundingBoxCalculated.current && groupRef.current) {
      // 스케일 적용 전 원본 크기 계산을 위해 임시로 스케일 리셋
      const originalScale = groupRef.current.scale.clone();
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.updateMatrixWorld(true);
      
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // 스케일 복원
      groupRef.current.scale.copy(originalScale);
      groupRef.current.updateMatrixWorld(true);
      
      // position을 빼서 로컬 좌표로 변환
      const localCenterY = center.y - (position[1] || 0);
      
      setBoundingBox({
        width: size.x,
        height: size.y,
        depth: size.z,
        centerY: localCenterY,
      });
      
      boundingBoxCalculated.current = true;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ modelId }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <primitive object={clonedScene} />

      {/* 선택 표시 */}
      {selected && boundingBox && (
        <SelectionOutline 
          width={boundingBox.width} 
          height={boundingBox.height} 
          depth={boundingBox.depth}
          centerY={boundingBox.centerY}
        />
      )}
    </group>
  );
}

// ============================================================================
// 폴백 모델 (에러 시 표시)
// ============================================================================
interface FallbackModelProps {
  modelId?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function FallbackModel({
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: FallbackModelProps) {
  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ modelId }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hovered ? '#6b7280' : '#4b5563'}
          wireframe={!selected}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 에러 표시 */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {selected && <SelectionOutline />}
    </group>
  );
}

// ============================================================================
// 선택 아웃라인
// ============================================================================
interface SelectionOutlineProps {
  width?: number;
  height?: number;
  depth?: number;
  centerY?: number;
}

function SelectionOutline({ width = 1, height = 1, depth = 1, centerY = 0.5 }: SelectionOutlineProps) {
  const outlineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (outlineRef.current) {
      // 펄스 애니메이션
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      outlineRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // 약간의 여백 추가 (10%)
  const w = width * 1.1;
  const h = height * 1.1;
  const d = depth * 1.1;

  return (
    <mesh ref={outlineRef} position={[0, centerY, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.2}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ============================================================================
// 모델 프리로드 유틸리티
// ============================================================================
export function preloadModel(url: string) {
  useGLTF.preload(url);
}

export function clearModelCache(url: string) {
  useGLTF.clear(url);
}

export default ModelLoader;
