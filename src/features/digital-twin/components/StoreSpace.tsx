import { useGLTF } from '@react-three/drei';
import type { SpaceAsset } from '@/types/scene3d';

interface StoreSpaceProps {
  asset: SpaceAsset;
  onClick?: () => void;
}

export function StoreSpace({ asset, onClick }: StoreSpaceProps) {
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
