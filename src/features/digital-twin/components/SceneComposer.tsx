import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import type { SceneRecipe } from '@/types/scene3d';
import { StoreSpace } from './StoreSpace';
import { FurnitureLayout } from './FurnitureLayout';
import { ProductPlacement } from './ProductPlacement';
import { LightingPreset } from './LightingPreset';
import { HeatmapOverlay } from './HeatmapOverlay';

interface SceneComposerProps {
  recipe: SceneRecipe;
  onAssetClick?: (assetId: string, assetType: string) => void;
  overlay?: ReactNode;
}

export function SceneComposer({ recipe, onAssetClick, overlay }: SceneComposerProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[recipe.camera?.position.x || 0, recipe.camera?.position.y || 10, recipe.camera?.position.z || 15]}
          fov={recipe.camera?.fov || 50}
        />
        
        <Suspense fallback={null}>
          {/* Base Environment */}
          <Environment preset="apartment" />
          
          {/* Custom Lighting */}
          <LightingPreset preset={recipe.lighting} />
          
          {/* Space/Store Model */}
          <StoreSpace 
            asset={recipe.space}
            onClick={() => onAssetClick?.(recipe.space.id, 'space')}
          />
          
          {/* Furniture Layer */}
          <FurnitureLayout 
            furniture={recipe.furniture}
            onClick={(id) => onAssetClick?.(id, 'furniture')}
          />
          
          {/* Product Layer */}
          <ProductPlacement 
            products={recipe.products}
            onClick={(id) => onAssetClick?.(id, 'product')}
          />
          
          {/* Effect Layers */}
          {recipe.effects?.map((effect, idx) => {
            if (effect.type === 'heatmap') {
              return (
                <HeatmapOverlay 
                  key={idx}
                  data={effect.data}
                  opacity={effect.opacity}
                />
              );
            }
            return null;
          })}
          
          {/* Custom Overlay (e.g., customer avatars, tracking) */}
          {overlay}
        </Suspense>
        
        <OrbitControls 
          target={[
            recipe.camera?.target.x || 0,
            recipe.camera?.target.y || 0,
            recipe.camera?.target.z || 0
          ]}
          enableDamping
          dampingFactor={0.05}
        />
        
        <gridHelper args={[20, 20, 0x888888, 0x444444]} />
      </Canvas>
    </div>
  );
}
