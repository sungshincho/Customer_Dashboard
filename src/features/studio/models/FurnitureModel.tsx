/**
 * FurnitureModel.tsx
 *
 * 가구 모델 렌더링
 */

import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FurnitureAsset } from '../types';

// ============================================================================
// Props
// ============================================================================
interface FurnitureModelProps {
  asset: FurnitureAsset;
  onClick?: () => void;
  selected?: boolean;
  hovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// ============================================================================
// FurnitureModel 컴포넌트
// ============================================================================
export function FurnitureModel({
  asset,
  onClick,
  selected = false,
  hovered = false,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
  if (!asset.model_url) {
    return (
      <FurniturePlaceholder
        asset={asset}
        onClick={onClick}
        selected={selected}
        hovered={hovered}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }

  return (
    <FurnitureGLTF
      asset={asset}
      onClick={onClick}
      selected={selected}
      hovered={hovered}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
}

// ============================================================================
// GLTF 로더
// ============================================================================
function FurnitureGLTF({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
  const { scene } = useGLTF(asset.model_url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  // GLB 모델의 BoundingBox 계산
  const boundingBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return { size, center };
  }, [clonedScene]);

  const position: [number, number, number] = [
    asset.position.x,
    asset.position.y,
    asset.position.z,
  ];

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    asset.rotation.x * Math.PI / 180,
    asset.rotation.y * Math.PI / 180,
    asset.rotation.z * Math.PI / 180,
  ];

  const scale: [number, number, number] = [
    asset.scale.x,
    asset.scale.y,
    asset.scale.z,
  ];

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
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
      {selected && (
        <SelectionIndicator 
          width={boundingBox.size.x} 
          height={boundingBox.size.y} 
          depth={boundingBox.size.z}
          center={boundingBox.center}
        />
      )}

      {/* 호버 표시 */}
      {hovered && !selected && (
        <HoverIndicator 
          width={boundingBox.size.x} 
          height={boundingBox.size.y} 
          depth={boundingBox.size.z}
          center={boundingBox.center}
        />
      )}
    </group>
  );
}

// ============================================================================
// 플레이스홀더
// ============================================================================
function FurniturePlaceholder({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
  const dimensions = asset.dimensions || { width: 1, height: 1, depth: 1 };

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    asset.rotation.x * Math.PI / 180,
    asset.rotation.y * Math.PI / 180,
    asset.rotation.z * Math.PI / 180,
  ];

  return (
    <group
      position={[asset.position.x, asset.position.y + dimensions.height / 2, asset.position.z]}
      rotation={rotation}
      scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
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
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial
          color={hovered ? '#93c5fd' : '#60a5fa'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {selected && (
        <SelectionIndicator 
          width={dimensions.width} 
          height={dimensions.height} 
          depth={dimensions.depth}
        />
      )}
    </group>
  );
}

// ============================================================================
// 표시자
// ============================================================================
interface IndicatorProps {
  width?: number;
  height?: number;
  depth?: number;
  center?: { x: number; y: number; z: number };
  size?: number; // 기존 호환용
}

function SelectionIndicator({ width, height, depth, center, size = 1.1 }: IndicatorProps) {
  // width/height/depth가 있으면 사용, 없으면 기존 size 사용
  const w = width ? width * 1.1 : size;
  const h = height ? height * 1.1 : size;
  const d = depth ? depth * 1.1 : size;
  
  // center가 있으면 해당 위치에, 없으면 원점에 배치
  const pos: [number, number, number] = center 
    ? [center.x, center.y, center.z] 
    : [0, 0, 0];
  
  return (
    <mesh position={pos}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.2}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function HoverIndicator({ width, height, depth, center, size = 1.05 }: IndicatorProps) {
  // width/height/depth가 있으면 사용, 없으면 기존 size 사용
  const w = width ? width * 1.05 : size;
  const h = height ? height * 1.05 : size;
  const d = depth ? depth * 1.05 : size;
  
  // center가 있으면 해당 위치에, 없으면 원점에 배치
  const pos: [number, number, number] = center 
    ? [center.x, center.y, center.z] 
    : [0, 0, 0];
  
  return (
    <mesh position={pos}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#60a5fa"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// FurnitureLayout - 여러 가구 렌더링
// ============================================================================
interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
  selectedId?: string;
  hoveredId?: string;
  onHover?: (id: string | null) => void;
}

export function FurnitureLayout({
  furniture,
  onClick,
  selectedId,
  hoveredId,
  onHover,
}: FurnitureLayoutProps) {
  return (
    <group>
      {furniture.map((item) => (
        <FurnitureModel
          key={item.id}
          asset={item}
          onClick={() => onClick?.(item.id)}
          selected={item.id === selectedId}
          hovered={item.id === hoveredId}
          onPointerOver={() => onHover?.(item.id)}
          onPointerOut={() => onHover?.(null)}
        />
      ))}
    </group>
  );
}

export default FurnitureModel;
