import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { SceneRecipe } from '@/types/scene3d';
import { StoreSpace } from './StoreSpace';
import { FurnitureLayout } from './FurnitureLayout';
import { ProductPlacement } from './ProductPlacement';
import { LightingPreset } from './LightingPreset';
import { HeatmapOverlay3D } from '../overlays/HeatmapOverlay3D';

interface SceneViewerProps {
  recipe: SceneRecipe;
  onAssetClick?: (assetId: string, assetType: string) => void;
  overlay?: 'visitor' | 'heatmap' | 'journey' | 'inventory' | 'layout' | null;
  overlayData?: any;
}

export function SceneViewer({ recipe, onAssetClick, overlay, overlayData }: SceneViewerProps) {
  const handleAssetClick = (id: string, type: string) => {
    console.log('Asset clicked:', { id, type });
    onAssetClick?.(id, type);
  };

  return (
    <div className="w-full h-[600px] bg-background rounded-lg overflow-hidden border">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[
            recipe.camera?.position.x || 0,
            recipe.camera?.position.y || 5,
            recipe.camera?.position.z || 10
          ]}
          fov={recipe.camera?.fov || 75}
        />
        <OrbitControls
          target={[
            recipe.camera?.target.x || 0,
            recipe.camera?.target.y || 0,
            recipe.camera?.target.z || 0
          ]}
          enableDamping
          dampingFactor={0.05}
        />

        <Suspense fallback={null}>
          {/* 기본 씬 */}
          {recipe.space && (
            <StoreSpace
              asset={recipe.space}
              onClick={() => handleAssetClick(recipe.space.id, 'space')}
            />
          )}

          {recipe.furniture && recipe.furniture.length > 0 && (
            <FurnitureLayout
              furniture={recipe.furniture}
              onClick={(id) => handleAssetClick(id, 'furniture')}
            />
          )}

          {recipe.products && recipe.products.length > 0 && (
            <ProductPlacement
              products={recipe.products}
              onClick={(id) => handleAssetClick(id, 'product')}
            />
          )}

          {/* 조명 */}
          <LightingPreset preset={recipe.lighting} />

          {/* 오버레이 */}
          {overlay === 'visitor' && overlayData && (
            <group>
              {overlayData.visitors?.map((visitor: any, idx: number) => (
                <mesh
                  key={`visitor-${idx}`}
                  position={[visitor.x, 1.5, visitor.z]}
                >
                  <sphereGeometry args={[0.2, 16, 16]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive="#10b981"
                    emissiveIntensity={0.5}
                  />
                </mesh>
              ))}
            </group>
          )}

          {overlay === 'heatmap' && overlayData && (
            <HeatmapOverlay3D heatPoints={overlayData.heatPoints || []} />
          )}

          {overlay === 'journey' && overlayData && (
            <group>
              {overlayData.paths?.map((path: any, idx: number) => (
                <line key={`path-${idx}`}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={path.points.length}
                      array={new Float32Array(path.points.flat())}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#3b82f6" linewidth={2} />
                </line>
              ))}
            </group>
          )}

          {overlay === 'inventory' && overlayData && (
            <group>
              {overlayData.items?.map((item: any, idx: number) => (
                <mesh
                  key={`inv-${idx}`}
                  position={[item.x, item.y + 1, item.z]}
                >
                  <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
                  <meshStandardMaterial
                    color={item.stock < item.min ? '#ef4444' : '#10b981'}
                    transparent
                    opacity={0.6}
                  />
                </mesh>
              ))}
            </group>
          )}

          {/* Grid helper */}
          <gridHelper args={[20, 20, '#555555', '#333333']} />
        </Suspense>
      </Canvas>
    </div>
  );
}
