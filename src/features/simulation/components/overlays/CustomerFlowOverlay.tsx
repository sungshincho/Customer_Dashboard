import { useMemo } from 'react';
import { Vector3 } from 'three';

interface FlowPoint {
  x: number;
  z: number;
  intensity: number; // 0-1
}

interface CustomerFlowData {
  paths?: Array<{ points: FlowPoint[]; weight: number }>;
  heatmap?: FlowPoint[];
  dwellZones?: Array<{ x: number; z: number; radius: number; time: number }>;
  kpiChanges?: {
    conversionRate: number;
    dwellTime: number;
    flowEfficiency: number;
  };
}

interface CustomerFlowOverlayProps {
  flowData: CustomerFlowData;
  opacity?: number;
}

export function CustomerFlowOverlay({ flowData, opacity = 1 }: CustomerFlowOverlayProps) {
  // Generate heatmap grid
  const heatmapGrid = useMemo(() => {
    if (!flowData.heatmap) return [];
    
    const grid: Array<{ position: Vector3; intensity: number }> = [];
    const gridSize = 0.5;
    
    flowData.heatmap.forEach(point => {
      grid.push({
        position: new Vector3(point.x, 0.01, point.z),
        intensity: point.intensity,
      });
    });
    
    return grid;
  }, [flowData.heatmap]);

  // Generate flow paths
  const flowPaths = useMemo(() => {
    if (!flowData.paths) return [];
    
    return flowData.paths.map(path => {
      const points = path.points.map(p => new Vector3(p.x, 0.5, p.z));
      return { points, weight: path.weight };
    });
  }, [flowData.paths]);

  return (
    <group>
      {/* Heatmap Layer */}
      {heatmapGrid.map((cell, idx) => {
        const color = cell.intensity > 0.7 
          ? '#ff0000' 
          : cell.intensity > 0.4 
          ? '#ff9900' 
          : '#ffff00';
        
        return (
          <mesh key={`heatmap-${idx}`} position={cell.position} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 16]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={cell.intensity * 0.6 * opacity}
            />
          </mesh>
        );
      })}

      {/* Flow Path Lines */}
      {flowPaths.map((path, pathIdx) => (
        <group key={`path-${pathIdx}`}>
          {path.points.map((point, idx) => {
            if (idx === 0) return null;
            const prev = path.points[idx - 1];
            
            return (
              <line key={`segment-${idx}`}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      prev.x, prev.y, prev.z,
                      point.x, point.y, point.z,
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial 
                  color="#00ffff" 
                  linewidth={path.weight * 3}
                  transparent
                  opacity={0.7 * opacity}
                />
              </line>
            );
          })}

          {/* Path direction arrows */}
          {path.points.map((point, idx) => {
            if (idx === 0 || idx % 3 !== 0) return null;
            const prev = path.points[idx - 1];
            const direction = new Vector3()
              .subVectors(point, prev)
              .normalize();
            
            return (
              <mesh key={`arrow-${idx}`} position={point}>
                <coneGeometry args={[0.1, 0.3, 8]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.8 * opacity} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Dwell Time Zones */}
      {flowData.dwellZones?.map((zone, idx) => (
        <group key={`dwell-${idx}`}>
          {/* Zone circle */}
          <mesh position={[zone.x, 0.02, zone.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[zone.radius * 0.8, zone.radius, 32]} />
            <meshBasicMaterial 
              color="#ff00ff" 
              transparent 
              opacity={0.4 * opacity}
              side={2}
            />
          </mesh>

          {/* Time indicator */}
          <mesh position={[zone.x, 0.5, zone.z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial 
              color="#ff00ff" 
              transparent 
              opacity={0.6 * opacity}
            />
          </mesh>

          {/* Pulse effect */}
          {Array.from({ length: 3 }).map((_, pulseIdx) => (
            <mesh
              key={`pulse-${pulseIdx}`}
              position={[zone.x, 0.02, zone.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry 
                args={[
                  zone.radius + pulseIdx * 0.3, 
                  zone.radius + pulseIdx * 0.3 + 0.1, 
                  32
                ]} 
              />
              <meshBasicMaterial 
                color="#ff00ff" 
                transparent 
                opacity={0.2 * (1 - pulseIdx * 0.3) * opacity}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Legend - Always visible in corner */}
      <group position={[8, 2, 8]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[2, 1.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7 * opacity} />
        </mesh>
        
        {/* Legend items would be rendered here with text sprites */}
      </group>
    </group>
  );
}
