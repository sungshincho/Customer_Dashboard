/**
 * SceneComposer.tsx
 * 
 * 고품질 3D 씬 컴포저
 * SceneRecipe를 받아 Three.js 씬으로 렌더링
 */

import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload } from '@react-three/drei';
import type { SceneRecipe } from '@/types/scene3d';
import { StoreSpace } from './StoreSpace';
import { FurnitureLayout } from './FurnitureLayout';
import { ProductPlacement } from './ProductPlacement';
import { SceneEnvironment } from './SceneEnvironment';
import { HeatmapOverlay3D } from '../overlays/HeatmapOverlay3D';

interface SceneComposerProps {
  recipe: SceneRecipe;
  onAssetClick?: (assetId: string, assetType: string) => void;
  overlay?: ReactNode;
  /** Environment 프리셋 오버라이드 */
  environmentPreset?: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse';
  /** 커스텀 HDRI 경로 */
  hdriPath?: string;
  /** 그리드 표시 여부 */
  showGrid?: boolean;
}

export function SceneComposer({ 
  recipe, 
  onAssetClick, 
  overlay,
  environmentPreset,
  hdriPath,
  showGrid = false 
}: SceneComposerProps) {
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
      description: 'Scene Environment handles lighting',
      lights: []
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
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[
            safeRecipe.camera.position.x, 
            safeRecipe.camera.position.y, 
            safeRecipe.camera.position.z
          ]}
          fov={safeRecipe.camera.fov}
          near={0.1}
          far={1000}
        />
        
        <Suspense fallback={<LoadingFallback />}>
          {/* 고품질 씬 환경 */}
          <SceneEnvironment 
            environmentPreset={environmentPreset}
            hdriPath={hdriPath}
          />
          
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
                <HeatmapOverlay3D 
                  key={idx}
                  heatPoints={effect.data || []}
                />
              );
            }
            return null;
          })}
          
          {/* Custom Overlay */}
          {overlay}
          
          {/* 에셋 프리로드 */}
          <Preload all />
        </Suspense>
        
        {/* Camera Controls */}
        <OrbitControls 
          target={[
            safeRecipe.camera.target.x,
            safeRecipe.camera.target.y,
            safeRecipe.camera.target.z
          ]}
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={0.1}
        />
        
        {/* Grid Helper */}
        {showGrid && (
          <gridHelper 
            args={[30, 30, '#333333', '#222222']} 
            position={[0, 0.001, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#4a90d9" 
        wireframe 
        transparent 
        opacity={0.5} 
      />
    </mesh>
  );
}

export default SceneComposer;
