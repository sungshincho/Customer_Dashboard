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
  // Skip if no valid model URL
  if (!asset.model_url) {
    return null;
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
    // Render fallback box
    return (
      <mesh
        position={[asset.position.x, asset.position.y + 0.5, asset.position.z]}
        onClick={onClick}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    );
  }
}
