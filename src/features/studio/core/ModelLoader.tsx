/**
 * ModelLoader.tsx
 *
 * 3D 모델 로딩 컴포넌트
 * - GLTF/GLB 모델 로드
 * - 선택/호버 상태 표시
 * - 에러 처리
 */

import { useRef, useMemo, useState, useEffect } from 'react';
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

  // 🔍 디버그: 실제 렌더링에 사용되는 위치 로깅
  useEffect(() => {
    if (modelId?.includes('product')) {
      console.log(`[ModelLoader] Rendering ${modelId} at position:`, position);
    }
  }, [modelId, position]);

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

    return cloned;
  }, [scene, castShadow, receiveShadow, shouldUseBaked]);

  // 선택/호버 하이라이트 애니메이션
  useFrame((_, delta) => {
    if (!groupRef.current) return;
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
      {selected && <SelectionOutline />}
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
function SelectionOutline() {
  const outlineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (outlineRef.current) {
      // 펄스 애니메이션
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      outlineRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={outlineRef}>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
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
