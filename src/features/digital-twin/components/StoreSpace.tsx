import { useGLTF } from '@react-three/drei';
import type { SpaceAsset } from '@/types/scene3d';

interface StoreSpaceProps {
  asset: SpaceAsset;
  onClick?: () => void;
}

export function StoreSpace({ asset, onClick }: StoreSpaceProps) {
  // Skip rendering if no valid model URL
  if (!asset.model_url || asset.model_url.includes('/models/default-store.glb')) {
    // Render a simple floor plane as fallback
    return (
      <mesh
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
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
    console.warn('Failed to load store model:', error);
    // Fallback to simple plane
    return (
      <mesh
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    );
  }
}
