import { useRef } from 'react';
import { useGLTF, TransformControls } from '@react-three/drei';
import type { FurnitureAsset } from '@/types/scene3d';
import * as THREE from 'three';

interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
  selectedId?: string | null;
  onPositionChange?: (id: string, position: { x: number; y: number; z: number }) => void;
  editMode?: boolean;
}

export function FurnitureLayout({ 
  furniture, 
  onClick, 
  selectedId, 
  onPositionChange,
  editMode = false
}: FurnitureLayoutProps) {
  return (
    <group>
      {furniture.map((item) => (
        <FurnitureItem 
          key={item.id} 
          asset={item} 
          onClick={() => onClick?.(item.id)}
          isSelected={selectedId === item.id}
          onPositionChange={onPositionChange}
          editMode={editMode}
        />
      ))}
    </group>
  );
}

function FurnitureItem({ 
  asset, 
  onClick, 
  isSelected, 
  onPositionChange,
  editMode 
}: { 
  asset: FurnitureAsset; 
  onClick: () => void;
  isSelected?: boolean;
  onPositionChange?: (id: string, position: { x: number; y: number; z: number }) => void;
  editMode?: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  // Render placeholder if no model URL
  if (!asset.model_url) {
    const dimensions = asset.dimensions || { width: 2, height: 2, depth: 0.5 };
    const color = asset.furniture_type?.toLowerCase().includes('shelf') ? '#8b6914' : '#654321';
    
    return (
      <mesh
        position={[
          asset.position.x,
          asset.position.y + dimensions.height / 2,
          asset.position.z
        ]}
        rotation={[asset.rotation.x, asset.rotation.y, asset.rotation.z]}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  try {
    const { scene } = useGLTF(asset.model_url);
    
    const content = (
      <group ref={meshRef}>
        <primitive
          object={scene.clone()}
          position={[asset.position.x, asset.position.y, asset.position.z]}
          rotation={[asset.rotation.x, asset.rotation.y, asset.rotation.z]}
          scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
          onClick={onClick}
        />
      </group>
    );

    if (editMode && isSelected && meshRef.current) {
      return (
        <>
          {content}
          <TransformControls
            object={meshRef.current}
            mode="translate"
            onObjectChange={() => {
              if (meshRef.current && onPositionChange) {
                const pos = meshRef.current.position;
                onPositionChange(asset.id, { x: pos.x, y: pos.y, z: pos.z });
              }
            }}
          />
        </>
      );
    }
    
    return content;
  } catch (error) {
    console.warn('Failed to load furniture model:', asset.furniture_type, error);
    const dimensions = asset.dimensions || { width: 2, height: 2, depth: 0.5 };
    const color = asset.furniture_type?.toLowerCase().includes('shelf') ? '#8b6914' : '#654321';
    
    return (
      <mesh
        position={[
          asset.position.x,
          asset.position.y + dimensions.height / 2,
          asset.position.z
        ]}
        rotation={[asset.rotation.x, asset.rotation.y, asset.rotation.z]}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
}
