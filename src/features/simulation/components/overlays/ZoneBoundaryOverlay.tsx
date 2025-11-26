import { Line, Html } from '@react-three/drei';
import { getZoneBoundsInModel } from '@/features/digital-twin/utils/coordinateMapper';
import type { StoreZone, StoreSpaceMetadata } from '@/features/digital-twin/types/iot.types';

interface ZoneBoundaryOverlayProps {
  zones: StoreZone[];
  metadata: StoreSpaceMetadata;
  showLabels?: boolean;
  opacity?: number;
}

export function ZoneBoundaryOverlay({ 
  zones, 
  metadata, 
  showLabels = true,
  opacity = 0.8 
}: ZoneBoundaryOverlayProps) {
  return (
    <group>
      {zones.map((zone) => {
        const bounds = getZoneBoundsInModel(zone, metadata);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerZ = (bounds.minZ + bounds.maxZ) / 2;
        const color = zone.zone_color || '#3b82f6';
        
        // Create boundary line points (rectangle)
        const points = [
          [bounds.minX, 0.05, bounds.minZ],
          [bounds.maxX, 0.05, bounds.minZ],
          [bounds.maxX, 0.05, bounds.maxZ],
          [bounds.minX, 0.05, bounds.maxZ],
          [bounds.minX, 0.05, bounds.minZ]
        ] as [number, number, number][];
        
        return (
          <group key={zone.zone_id}>
            {/* Zone boundary line */}
            <Line
              points={points}
              color={color}
              lineWidth={3}
              transparent
              opacity={opacity}
            />
            
            {/* Semi-transparent floor plane */}
            <mesh 
              position={[centerX, 0.01, centerZ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry 
                args={[bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ]} 
              />
              <meshBasicMaterial 
                color={color}
                transparent
                opacity={0.1}
              />
            </mesh>
            
            {/* Zone label */}
            {showLabels && (
              <Html
                position={[centerX, 0.5, centerZ]}
                center
                distanceFactor={10}
              >
                <div 
                  className="px-2 py-1 rounded text-xs font-semibold text-white pointer-events-none"
                  style={{ 
                    backgroundColor: color,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {zone.zone_name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
