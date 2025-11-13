import { useState } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
}

interface CustomerPathOverlayProps {
  paths: PathPoint[][];
  animate?: boolean;
  color?: string;
}

function AnimatedPath({ points, color = '#1B6BFF' }: { points: PathPoint[], color?: string }) {
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    setProgress(prev => Math.min(prev + delta * 0.2, 1));
  });

  const positions = points
    .slice(0, Math.max(2, Math.floor(points.length * progress)))
    .map(p => [p.x, p.y, p.z] as [number, number, number]);

  if (positions.length < 2) return null;

  return (
    <Line
      points={positions}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.7}
    />
  );
}

export function CustomerPathOverlay({ paths, animate = true, color = '#1B6BFF' }: CustomerPathOverlayProps) {
  return (
    <group>
      {paths.map((path, index) => (
        <group key={index}>
          {animate ? (
            <AnimatedPath points={path} color={color} />
          ) : (
            <Line
              points={path.map(p => [p.x, p.y, p.z] as [number, number, number])}
              color={color}
              lineWidth={2}
              transparent
              opacity={0.7}
            />
          )}
          
          {/* Start point marker */}
          {path.length > 0 && (
            <mesh position={[path[0].x, path[0].y + 0.5, path[0].z]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} />
            </mesh>
          )}
          
          {/* End point marker */}
          {path.length > 1 && (
            <mesh position={[path[path.length - 1].x, path[path.length - 1].y + 0.5, path[path.length - 1].z]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
