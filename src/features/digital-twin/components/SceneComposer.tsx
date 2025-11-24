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
  // Provide safe defaults for all required fields
  const safeRecipe: SceneRecipe = {
    space: recipe?.space || {
      id: 'default-space',
      type: 'space' as const,
      model_url: '',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    furniture: recipe?.furniture || [],
    products: recipe?.products || [],
    lighting: recipe?.lighting || {
      name: 'Default Lighting',
      description: 'Basic ambient and directional lighting',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 0.8, position: { x: 5, y: 10, z: 5 } }
      ]
    },
    effects: recipe?.effects || [],
    camera: recipe?.camera || {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[safeRecipe.camera.position.x, safeRecipe.camera.position.y, safeRecipe.camera.position.z]}
          fov={safeRecipe.camera.fov}
        />
        
        <Suspense fallback={null}>
          {/* Base Environment */}
          <Environment preset="apartment" />
          
          {/* Custom Lighting */}
          <LightingPreset preset={safeRecipe.lighting} />
          
          {/* Space/Store Model */}
          <StoreSpace 
            asset={safeRecipe.space}
            onClick={() => onAssetClick?.(safeRecipe.space.id, 'space')}
          />
          
          {/* Furniture Layer */}
          <FurnitureLayout 
            furniture={safeRecipe.furniture}
            onClick={(id) => onAssetClick?.(id, 'furniture')}
          />
          
          {/* Product Layer */}
          <ProductPlacement 
            products={safeRecipe.products}
            onClick={(id) => onAssetClick?.(id, 'product')}
          />
          
          {/* Effect Layers */}
          {safeRecipe.effects?.map((effect, idx) => {
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
            safeRecipe.camera.target.x,
            safeRecipe.camera.target.y,
            safeRecipe.camera.target.z
          ]}
          enableDamping
          dampingFactor={0.05}
        />
        
        <gridHelper args={[20, 20, 0x888888, 0x444444]} />
      </Canvas>
    </div>
  );
}
