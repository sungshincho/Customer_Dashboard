import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SpaceAsset } from '@/types/scene3d';

interface StoreSpaceProps {
  asset: SpaceAsset;
  onClick?: () => void;
}

export function StoreSpace({ asset, onClick }: StoreSpaceProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Guard against undefined asset
  if (!asset) {
    return (
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    );
  }

  // Skip rendering if no valid model URL
  if (!asset.model_url || asset.model_url.includes('/models/default-store.glb')) {
    // Render a simple floor plane as fallback
    return (
      <mesh
        position={[asset.position?.x || 0, asset.position?.y || 0, asset.position?.z || 0]}
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
    
    // 모델 중심 정렬을 위한 effect
    useEffect(() => {
      if (groupRef.current && scene) {
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        
        // 모델을 중심점으로 이동 (오프셋 조정)
        scene.position.x = -center.x;
        scene.position.y = -center.y;
        scene.position.z = -center.z;
      }
    }, [scene]);
    
    return (
      <group
        ref={groupRef}
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[asset.rotation.x, asset.rotation.y, asset.rotation.z]}
        scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
        onClick={onClick}
      >
        <primitive object={scene.clone()} />
      </group>
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
