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
