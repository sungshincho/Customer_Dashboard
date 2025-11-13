import { useMemo } from 'react';
import * as THREE from 'three';

interface HeatPoint {
  x: number;
  z: number;
  intensity: number; // 0-1
}

interface HeatmapOverlay3DProps {
  heatPoints: HeatPoint[];
  gridSize?: number;
  heightScale?: number;
}

export function HeatmapOverlay3D({ 
  heatPoints, 
  gridSize = 20, 
  heightScale = 2 
}: HeatmapOverlay3DProps) {
  
  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 32, 32);
    const positions = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(positions.length);
    
    // Create height map and color based on heat intensity
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      // Find closest heat point and calculate intensity
      let maxIntensity = 0;
      heatPoints.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2)
        );
        const influence = Math.max(0, 1 - distance / 3) * point.intensity;
        maxIntensity = Math.max(maxIntensity, influence);
      });
      
      // Set height based on intensity
      positions[i + 2] = maxIntensity * heightScale;
      
      // Set color based on intensity (blue -> green -> yellow -> red)
      const color = getHeatColor(maxIntensity);
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();
    
    return { geometry: geo, colors: colorArray };
  }, [heatPoints, gridSize, heightScale]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function getHeatColor(intensity: number): { r: number; g: number; b: number } {
  // Blue (cold) -> Cyan -> Green -> Yellow -> Red (hot)
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    return { r: 0, g: t, b: 1 };
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    return { r: 0, g: 1, b: 1 - t };
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    return { r: t, g: 1, b: 0 };
  } else {
    const t = (intensity - 0.75) / 0.25;
    return { r: 1, g: 1 - t, b: 0 };
  }
}
