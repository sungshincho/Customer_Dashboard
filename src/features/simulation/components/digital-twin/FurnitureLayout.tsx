import { useGLTF } from '@react-three/drei';
import type { FurnitureAsset } from '@/types/scene3d';
import { ChildProductItem } from './ChildProductItem';

interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
  onProductClick?: (id: string) => void;
}

export function FurnitureLayout({ furniture = [], onClick, onProductClick }: FurnitureLayoutProps) {
  const safeFurniture = Array.isArray(furniture) ? furniture : [];

  return (
    <group>
      {safeFurniture.map((item) => (
        <FurnitureItem
          key={item.id}
          asset={item}
          onClick={() => onClick?.(item.id)}
          onProductClick={onProductClick}
        />
      ))}
    </group>
  );
}

interface FurnitureItemProps {
  asset: FurnitureAsset;
  onClick: () => void;
  onProductClick?: (id: string) => void;
}

function FurnitureItem({ asset, onClick, onProductClick }: FurnitureItemProps) {
  const childProducts = asset.childProducts || [];
  
  // degrees → radians 변환
  const rotationX = (asset.rotation?.x || 0) * Math.PI / 180;
  const rotationY = (asset.rotation?.y || 0) * Math.PI / 180;
  const rotationZ = (asset.rotation?.z || 0) * Math.PI / 180;

  const dimensions = asset.dimensions || { width: 2, height: 2, depth: 0.5 };
  const color = asset.furniture_type?.toLowerCase().includes('shelf') ? '#8b6914' : '#654321';

  // 모델 URL이 없는 경우: 플레이스홀더 박스 렌더링
  if (!asset.model_url) {
    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
        scale={[asset.scale?.x || 1, asset.scale?.y || 1, asset.scale?.z || 1]}
      >
        <mesh
          position={[0, dimensions.height / 2, 0]}
          onClick={onClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  }

  // GLB 모델 로드 시도
  try {
    const { scene } = useGLTF(asset.model_url);

    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
        scale={[asset.scale?.x || 1, asset.scale?.y || 1, asset.scale?.z || 1]}
      >
        <primitive object={scene.clone()} onClick={onClick} />

        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  } catch (error) {
    console.warn('Failed to load furniture model:', asset.furniture_type, error);
    
    // 로드 실패 시: 플레이스홀더 박스 렌더링
    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
        scale={[asset.scale?.x || 1, asset.scale?.y || 1, asset.scale?.z || 1]}
      >
        <mesh
          position={[0, dimensions.height / 2, 0]}
          onClick={onClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  }
}
