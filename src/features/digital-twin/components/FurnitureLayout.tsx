import { useGLTF } from '@react-three/drei';
import type { FurnitureAsset } from '@/types/scene3d';

interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
}

export function FurnitureLayout({ furniture, onClick }: FurnitureLayoutProps) {
  return (
    <group>
      {furniture.map((item) => (
        <FurnitureItem key={item.id} asset={item} onClick={() => onClick?.(item.id)} />
      ))}
    </group>
  );
}

function FurnitureItem({ asset, onClick }: { asset: FurnitureAsset; onClick: () => void }) {
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
    
    return (
      <primitive
        object={scene.clone()}
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[asset.rotation.x, asset.rotation.y, asset.rotation.z]}
        scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
        onClick={onClick}
      />
    );
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
