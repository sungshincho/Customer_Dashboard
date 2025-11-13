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
}
