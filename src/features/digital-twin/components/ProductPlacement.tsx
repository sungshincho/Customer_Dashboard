import { useGLTF } from '@react-three/drei';
import type { ProductAsset } from '@/types/scene3d';

interface ProductPlacementProps {
  products: ProductAsset[];
  onClick?: (id: string) => void;
}

export function ProductPlacement({ products, onClick }: ProductPlacementProps) {
  return (
    <group>
      {products.map((item) => (
        <ProductItem key={item.id} asset={item} onClick={() => onClick?.(item.id)} />
      ))}
    </group>
  );
}

function ProductItem({ asset, onClick }: { asset: ProductAsset; onClick: () => void }) {
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
