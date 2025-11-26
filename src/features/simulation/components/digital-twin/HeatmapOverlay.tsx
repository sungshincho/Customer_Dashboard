import { useMemo } from 'react';
import { DoubleSide } from 'three';

interface HeatmapOverlayProps {
  data: any;
  opacity?: number;
}

export function HeatmapOverlay({ data, opacity = 0.6 }: HeatmapOverlayProps) {
  // Generate heatmap visualization from data
  const heatmapGeometry = useMemo(() => {
    // This would process the heatmap data and create a mesh
    // For now, return a simple plane as placeholder
    return null;
  }, [data]);

  if (!heatmapGeometry) {
    return null;
  }

  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 50, 50]} />
      <meshBasicMaterial
        color="#ff6b6b"
        transparent
        opacity={opacity}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
