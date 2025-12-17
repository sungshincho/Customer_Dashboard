/**
 * useStoreBounds.ts
 *
 * 매장 경계 및 입구 위치 훅
 * - zones_dim 테이블에서 전체 매장 경계 계산
 * - 입구(entrance) 존 위치 감지
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';

export interface StoreBounds {
  width: number;
  depth: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
}

export interface EntrancePosition {
  x: number;
  z: number;
  direction: 'north' | 'south' | 'east' | 'west';
}

export interface ZoneDimData {
  id: string;
  zone_name: string;
  zone_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  size_width: number;
  size_depth: number;
  size_height: number;
  coordinates: {
    x: number;
    y: number;
    z: number;
    width: number;
    depth: number;
  } | null;
}

const DEFAULT_STORE_BOUNDS: StoreBounds = {
  width: 17.4,
  depth: 16.6,
  minX: -8.7,
  maxX: 8.7,
  minZ: -8.3,
  maxZ: 8.3,
  centerX: 0,
  centerZ: 0,
};

const DEFAULT_ENTRANCE: EntrancePosition = {
  x: 0,
  z: -8,
  direction: 'south',
};

export function useStoreBounds() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  // zones_dim 데이터 조회
  const { data: zones, isLoading } = useQuery({
    queryKey: ['zones-dim-bounds', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('zones_dim')
        .select('id, zone_name, zone_type, position_x, position_y, position_z, size_width, size_depth, size_height, coordinates')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching zones_dim:', error);
        return [];
      }

      return (data || []) as ZoneDimData[];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 1000 * 60 * 10, // 10분 캐시
  });

  // 매장 경계 계산
  const storeBounds = useMemo<StoreBounds>(() => {
    if (!zones || zones.length === 0) {
      return DEFAULT_STORE_BOUNDS;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    zones.forEach((zone) => {
      const x = zone.position_x || zone.coordinates?.x || 0;
      const z = zone.position_z || zone.coordinates?.z || 0;
      const width = zone.size_width || zone.coordinates?.width || 0;
      const depth = zone.size_depth || zone.coordinates?.depth || 0;

      // 존의 경계 계산 (중심점 + 크기/2)
      const zoneMinX = x - width / 2;
      const zoneMaxX = x + width / 2;
      const zoneMinZ = z - depth / 2;
      const zoneMaxZ = z + depth / 2;

      minX = Math.min(minX, zoneMinX);
      maxX = Math.max(maxX, zoneMaxX);
      minZ = Math.min(minZ, zoneMinZ);
      maxZ = Math.max(maxZ, zoneMaxZ);
    });

    // 여백 추가 (10%)
    const padding = Math.max((maxX - minX), (maxZ - minZ)) * 0.1;
    minX -= padding;
    maxX += padding;
    minZ -= padding;
    maxZ += padding;

    const width = maxX - minX;
    const depth = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    console.log('[useStoreBounds] Calculated bounds:', { width, depth, minX, maxX, minZ, maxZ });

    return {
      width,
      depth,
      minX,
      maxX,
      minZ,
      maxZ,
      centerX,
      centerZ,
    };
  }, [zones]);

  // 입구 위치 계산
  const entrancePosition = useMemo<EntrancePosition>(() => {
    if (!zones || zones.length === 0) {
      return DEFAULT_ENTRANCE;
    }

    // entrance 타입 존 찾기
    const entranceZone = zones.find(
      (z) => z.zone_type === 'entrance' || z.zone_name.toLowerCase().includes('입구')
    );

    if (!entranceZone) {
      console.log('[useStoreBounds] No entrance zone found, using default');
      return DEFAULT_ENTRANCE;
    }

    const x = entranceZone.position_x || entranceZone.coordinates?.x || 0;
    const z = entranceZone.position_z || entranceZone.coordinates?.z || 0;

    // 입구 방향 결정 (매장 중심 대비 입구 위치)
    const centerX = storeBounds.centerX;
    const centerZ = storeBounds.centerZ;

    let direction: 'north' | 'south' | 'east' | 'west' = 'south';

    const dx = x - centerX;
    const dz = z - centerZ;

    if (Math.abs(dx) > Math.abs(dz)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dz > 0 ? 'north' : 'south';
    }

    console.log('[useStoreBounds] Entrance position:', { x, z, direction });

    return { x, z, direction };
  }, [zones, storeBounds]);

  // 존 위치 맵 (ZoneHighlight용)
  const zonePositions = useMemo<Record<string, [number, number, number]>>(() => {
    if (!zones || zones.length === 0) return {};

    const positions: Record<string, [number, number, number]> = {};

    zones.forEach((zone) => {
      const x = zone.position_x || zone.coordinates?.x || 0;
      const y = 0.02; // 바닥 약간 위
      const z = zone.position_z || zone.coordinates?.z || 0;
      positions[zone.id] = [x, y, z];
      positions[zone.zone_name.toLowerCase()] = [x, y, z];
      positions[zone.zone_type] = [x, y, z];
    });

    return positions;
  }, [zones]);

  // 존 크기 맵 (ZoneHighlight용)
  const zoneSizes = useMemo<Record<string, { width: number; depth: number }>>(() => {
    if (!zones || zones.length === 0) return {};

    const sizes: Record<string, { width: number; depth: number }> = {};

    zones.forEach((zone) => {
      const width = zone.size_width || zone.coordinates?.width || 3;
      const depth = zone.size_depth || zone.coordinates?.depth || 3;
      sizes[zone.id] = { width, depth };
      sizes[zone.zone_name.toLowerCase()] = { width, depth };
    });

    return sizes;
  }, [zones]);

  return {
    storeBounds,
    entrancePosition,
    zonePositions,
    zoneSizes,
    zones,
    isLoading,
  };
}

export default useStoreBounds;
