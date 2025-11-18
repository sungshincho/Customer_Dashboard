import { useMemo } from 'react';
import { useWiFiTracking } from './useWiFiTracking';
import { useSelectedStore } from './useSelectedStore';
import { realToModel } from '@/features/digital-twin/utils/coordinateMapper';
import type { HeatPoint, StoreSpaceMetadata, StoreZone } from '@/features/digital-twin/types/iot.types';

/**
 * Determine which zone a coordinate falls into (using real-world coordinates)
 */
function getZoneId(x: number, z: number, zones?: StoreZone[]): string | undefined {
  if (!zones) return undefined;
  
  for (const zone of zones) {
    if (x >= zone.bounds.min_x && x <= zone.bounds.max_x &&
        z >= zone.bounds.min_z && z <= zone.bounds.max_z) {
      return zone.zone_id;
    }
  }
  
  return undefined;
}

/**
 * Convert WiFi tracking data to 3D heatmap points
 * Handles coordinate transformation and zone mapping
 */
export function useTrafficHeatmap(storeId: string | undefined, timeOfDay?: number) {
  const wifiData = useWiFiTracking(storeId);
  const { selectedStore } = useSelectedStore();
  
  return useMemo(() => {
    if (!selectedStore?.metadata?.storeSpaceMetadata) {
      console.warn('No store space metadata found for heatmap');
      return [];
    }
    
    const metadata = selectedStore.metadata.storeSpaceMetadata as StoreSpaceMetadata;
    let trackingData = wifiData.trackingData || [];
    
    // Filter by time of day if specified
    if (timeOfDay !== undefined) {
      trackingData = trackingData.filter(point => {
        const hour = new Date(point.timestamp).getHours();
        return hour === timeOfDay;
      });
    }
    
    // Transform coordinates and map zones
    const heatPoints: HeatPoint[] = trackingData
      .filter(point => point.x !== undefined && point.z !== undefined)
      .map(point => {
        // Convert real-world coordinates to 3D model coordinates
        const modelCoords = realToModel(point.x!, point.z!, metadata);
        
        // Determine which zone this point belongs to
        const zone_id = getZoneId(point.x!, point.z!, metadata.zones);
        
        return {
          x: modelCoords.x,
          z: modelCoords.z,
          intensity: point.accuracy || 0.5,
          zone_id,
          timestamp: new Date(point.timestamp).toISOString(),
          realCoords: { x: point.x!, z: point.z! }
        };
      });
    
    return heatPoints;
  }, [wifiData.trackingData, selectedStore, timeOfDay]);
}

/**
 * Calculate zone statistics from heat points
 */
export function useZoneStatistics(heatPoints: HeatPoint[], metadata?: StoreSpaceMetadata) {
  return useMemo(() => {
    if (!metadata?.zones) return [];
    
    return metadata.zones.map(zone => {
      const zonePoints = heatPoints.filter(p => p.zone_id === zone.zone_id);
      const avgIntensity = zonePoints.length > 0
        ? zonePoints.reduce((sum, p) => sum + p.intensity, 0) / zonePoints.length
        : 0;
      
      return {
        ...zone,
        visitCount: zonePoints.length,
        avgIntensity,
        maxIntensity: Math.max(...zonePoints.map(p => p.intensity), 0)
      };
    });
  }, [heatPoints, metadata]);
}
