import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TrackingData, SensorPosition } from '@/features/simulation/types/iot.types';

interface WiFiZone {
  id: string;
  zone_id: number;
  x: number;
  y: number;
  z: number;
  metadata: any;
}

interface WiFiRawSignal {
  id: string;
  timestamp: string;
  mac_address: string;
  sensor_id: string;
  rssi: number;
}

interface WiFiTrackingRecord {
  id: string;
  timestamp: string;
  session_id: string;
  x: number;
  z: number;
  accuracy?: number;
  status?: string;
}

interface HeatmapCache {
  date: string;
  hour: number;
  grid_x: number;
  grid_z: number;
  visit_count: number;
}

export function useWiFiTracking(storeId?: string) {
  const [zones, setZones] = useState<SensorPosition[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [rawSignals, setRawSignals] = useState<WiFiRawSignal[]>([]);
  const [heatmapCache, setHeatmapCache] = useState<HeatmapCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    loadWiFiData();

    // Realtime 구독
    const trackingChannel = supabase
      .channel('wifi-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wifi_tracking',
          filter: `store_id=eq.${storeId}`
        },
        () => {
          loadTrackingData();
        }
      )
      .subscribe();

    // wifi_heatmap_cache 테이블이 존재하지 않으므로 구독 제거

    return () => {
      supabase.removeChannel(trackingChannel);
    };
  }, [storeId]);

  async function loadWiFiData() {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadZones(),
        loadTrackingData(),
        // 존재하지 않는 테이블은 에러 무시
        loadRawSignals().catch(() => console.warn('wifi_raw_signals table not found')),
        loadHeatmapCache().catch(() => console.warn('wifi_heatmap_cache table not found'))
      ]);
    } catch (err) {
      console.error('Failed to load WiFi data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load WiFi data');
    } finally {
      setLoading(false);
    }
  }

  async function loadZones() {
    const { data, error } = await supabase
      .from('wifi_zones' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('zone_id', { ascending: true });

    if (error) throw error;

    if (data) {
      // WiFi zones를 SensorPosition 형식으로 변환
      const sensors: SensorPosition[] = (data as any[]).map((zone: any) => ({
        sensor_id: `zone_${zone.zone_id}`,
        sensor_type: 'wifi' as const,
        x: zone.x,
        y: zone.y,
        z: zone.z || 0,
        coverage_radius: 5
      }));
      setZones(sensors);
    }
  }

  async function loadTrackingData() {
    const { data, error } = await supabase
      .from('wifi_tracking' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    if (data) {
      const tracking: TrackingData[] = (data as any[]).map((record: any) => ({
        customer_id: record.session_id,
        timestamp: new Date(record.timestamp).getTime(),
        sensor_id: 'tracking',
        x: record.x,
        z: record.z,
        accuracy: record.accuracy,
        status: record.status as any
      }));
      setTrackingData(tracking);
    }
  }

  async function loadRawSignals() {
    const { data, error } = await supabase
      .from('wifi_raw_signals' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) throw error;

    if (data) {
      setRawSignals(data as any[]);
    }
  }

  async function loadHeatmapCache() {
    const { data, error } = await supabase
      .from('wifi_heatmap_cache' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .order('hour', { ascending: false })
      .limit(1000);

    if (error) throw error;

    if (data) {
      setHeatmapCache(data as any[]);
    }
  }

  const refresh = () => {
    loadWiFiData();
  };

  return {
    zones,
    trackingData,
    rawSignals,
    heatmapCache,
    loading,
    error,
    refresh
  };
}
