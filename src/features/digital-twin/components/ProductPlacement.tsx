import { useRef } from 'react';
import { useGLTF, TransformControls } from '@react-three/drei';
import type { ProductAsset } from '@/types/scene3d';
import * as THREE from 'three';

interface ProductPlacementProps {
  products: ProductAsset[];
  onClick?: (id: string) => void;
  selectedId?: string | null;
  onPositionChange?: (id: string, position: { x: number; y: number; z: number }) => void;
  editMode?: boolean;
}

export function ProductPlacement({ 
  products, 
  onClick,
  selectedId,
  onPositionChange,
  editMode = false
}: ProductPlacementProps) {
  return (
    <group>
      {products.map((item) => (
        <ProductItem 
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

function ProductItem({ 
  asset, 
  onClick,
  isSelected,
  onPositionChange,
  editMode
}: { 
  asset: ProductAsset; 
  onClick: () => void;
  isSelected?: boolean;
  onPositionChange?: (id: string, position: { x: number; y: number; z: number }) => void;
  editMode?: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const dimensions = asset.dimensions || { width: 0.3, height: 0.4, depth: 0.2 };
  
  // Render placeholder if no model URL
  if (!asset.model_url) {
    return (
      <mesh
        position={[
          asset.position.x,
          asset.position.y + dimensions.height / 2,
          asset.position.z
        ]}
        onClick={onClick}
        castShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          metalness={0.3}
          roughness={0.7}
        />
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
    console.warn('Failed to load product model:', asset.sku, error);
    return (
      <mesh
        position={[
          asset.position.x,
          asset.position.y + dimensions.height / 2,
          asset.position.z
        ]}
        onClick={onClick}
        castShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    );
  }
}
