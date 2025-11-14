import { supabase } from '@/integrations/supabase/client';
import type { SensorPosition, TrackingData } from '@/features/digital-twin/types/iot.types';

// CSV 파싱 함수
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

// Storage에서 CSV 다운로드
async function loadCSVFromStorage(userId: string, storeId: string, filename: string): Promise<any[]> {
  try {
    const filePath = `${userId}/${storeId}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('store-data')
      .download(filePath);
    
    if (error) {
      console.error(`Failed to download ${filename}:`, error);
      return [];
    }
    
    const csvText = await data.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// public/samples에서 CSV 로드 (테스트용)
async function loadCSVFromPublic(filename: string): Promise<any[]> {
  try {
    const response = await fetch(`/samples/${filename}`);
    if (!response.ok) {
      console.error(`Failed to load /samples/${filename}`);
      return [];
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading /samples/${filename}:`, error);
    return [];
  }
}

// 센서 CSV를 SensorPosition 타입으로 변환
function parseSensorData(rawData: any[]): SensorPosition[] {
  return rawData.map(row => ({
    sensor_id: row.sensor_id || row.id,
    sensor_type: 'wifi' as const,
    x: parseFloat(row.x) || 0,
    y: parseFloat(row.y) || 2.5,
    z: parseFloat(row.z) || 0,
    coverage_radius: parseFloat(row.coverage_radius) || 10
  }));
}

// 트래킹 CSV를 TrackingData 타입으로 변환
function parseTrackingData(rawData: any[]): TrackingData[] {
  return rawData.map(row => ({
    customer_id: row.mac_address || row.customer_id,
    timestamp: new Date(row.timestamp).getTime(),
    sensor_id: row.sensor_id,
    signal_strength: parseFloat(row.rssi) || -100,
    x: row.x ? parseFloat(row.x) : undefined,
    z: row.z ? parseFloat(row.z) : undefined,
    accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
    status: row.status || 'browsing'
  }));
}

// WiFi 트래킹 데이터 로드 (메인 함수)
export async function loadWiFiTrackingData(
  userId?: string,
  storeId?: string
): Promise<{ sensors: SensorPosition[]; trackingData: TrackingData[] }> {
  let sensorData: any[] = [];
  let trackingRawData: any[] = [];

  // Storage에서 로드 시도
  if (userId && storeId) {
    const [sensors, tracking] = await Promise.all([
      loadCSVFromStorage(userId, storeId, 'wifi_sensors.csv'),
      loadCSVFromStorage(userId, storeId, 'wifi_tracking.csv')
    ]);
    
    if (sensors.length > 0 && tracking.length > 0) {
      sensorData = sensors;
      trackingRawData = tracking;
    }
  }

  // Storage에 없으면 public/samples에서 로드 (테스트/데모용)
  if (sensorData.length === 0 || trackingRawData.length === 0) {
    console.log('Loading WiFi data from /public/samples...');
    const [sensors, tracking] = await Promise.all([
      loadCSVFromPublic('wifi_sensors.csv'),
      loadCSVFromPublic('wifi_tracking.csv')
    ]);
    sensorData = sensors;
    trackingRawData = tracking;
  }

  return {
    sensors: parseSensorData(sensorData),
    trackingData: parseTrackingData(trackingRawData)
  };
}

// 시간 범위 필터링
export function filterByTimeRange(
  data: TrackingData[],
  startTime: number,
  endTime: number
): TrackingData[] {
  return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
}

// 시간 윈도우로 그룹핑 (애니메이션용)
export function groupByTimeWindow(
  data: TrackingData[],
  windowMs: number = 5000 // 5초 기본값
): Map<number, TrackingData[]> {
  const groups = new Map<number, TrackingData[]>();
  
  data.forEach(point => {
    const windowKey = Math.floor(point.timestamp / windowMs) * windowMs;
    if (!groups.has(windowKey)) {
      groups.set(windowKey, []);
    }
    groups.get(windowKey)!.push(point);
  });
  
  return groups;
}

// 히트맵 데이터로 변환 (그리드 기반 집계)
export function convertToHeatmapData(
  data: TrackingData[],
  gridSize: number = 1.0 // 1미터 그리드
): Array<{ x: number; z: number; intensity: number }> {
  const heatMap = new Map<string, number>();
  
  data.forEach(point => {
    if (point.x === undefined || point.z === undefined) return;
    
    const gridX = Math.floor(point.x / gridSize) * gridSize;
    const gridZ = Math.floor(point.z / gridSize) * gridSize;
    const key = `${gridX},${gridZ}`;
    
    heatMap.set(key, (heatMap.get(key) || 0) + 1);
  });
  
  const maxCount = Math.max(...Array.from(heatMap.values()));
  
  return Array.from(heatMap.entries()).map(([key, count]) => {
    const [x, z] = key.split(',').map(Number);
    return {
      x,
      z,
      intensity: count / maxCount // 0~1 정규화
    };
  });
}

// 개별 고객 경로 추출
export function extractCustomerPaths(
  data: TrackingData[]
): Map<string, TrackingData[]> {
  const paths = new Map<string, TrackingData[]>();
  
  data.forEach(point => {
    if (!paths.has(point.customer_id)) {
      paths.set(point.customer_id, []);
    }
    paths.get(point.customer_id)!.push(point);
  });
  
  // 각 경로를 시간순으로 정렬
  paths.forEach((path, customerId) => {
    path.sort((a, b) => a.timestamp - b.timestamp);
  });
  
  return paths;
}
