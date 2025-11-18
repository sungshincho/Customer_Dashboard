/**
 * WiFi 데이터 로더 - 새로운 중앙 집중식 시스템 사용
 */

import { supabase } from '@/integrations/supabase/client';
import { loadDataFile } from '@/lib/storage/loader';
import type { SensorPosition, TrackingData } from '@/features/digital-twin/types/iot.types';
import type { WiFiSensorData, WiFiTrackingData } from '@/lib/storage/types';

/**
 * 센서 데이터를 SensorPosition 타입으로 변환
 */
function parseSensorData(rawData: WiFiSensorData[]): SensorPosition[] {
  return rawData.map(row => ({
    sensor_id: row.sensor_id || (row as any).id,
    sensor_type: 'wifi' as const,
    x: row.x || 0,
    y: row.y || 2.5,
    z: row.z || 0,
    coverage_radius: row.coverage_radius || 10
  }));
}

/**
 * 트래킹 데이터를 TrackingData 타입으로 변환
 */
function parseTrackingData(rawData: WiFiTrackingData[]): TrackingData[] {
  return rawData.map(row => ({
    customer_id: row.mac_address || (row as any).customer_id,
    timestamp: new Date(row.timestamp).getTime(),
    sensor_id: row.sensor_id,
    signal_strength: row.rssi || -100,
    x: row.x,
    z: row.z,
    accuracy: row.accuracy,
    status: (row.status as any) || 'browsing'
  }));
}

/**
 * WiFi 트래킹 데이터 로드 (통합 버전)
 */
export async function loadWiFiTrackingData(
  userId?: string,
  storeId?: string
): Promise<{ sensors: SensorPosition[]; trackingData: TrackingData[] }> {
  
  // Storage에서 로드 시도
  if (userId && storeId) {
    try {
      const [sensorsResult, trackingResult] = await Promise.all([
        loadDataFile(userId, storeId, 'wifi_sensors', { fallbackToSample: true }),
        loadDataFile(userId, storeId, 'wifi_tracking', { fallbackToSample: true })
      ]);
      
      if (sensorsResult.data.length > 0 && trackingResult.data.length > 0) {
        return {
          sensors: parseSensorData(sensorsResult.data),
          trackingData: parseTrackingData(trackingResult.data)
        };
      }
    } catch (error) {
      console.error('Failed to load WiFi data from storage:', error);
    }
  }
  
  // Fallback은 이미 loadDataFile에서 처리됨
  return {
    sensors: [],
    trackingData: []
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

// 개별 고객 경로 추출 (MAC 랜덤화 고려)
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

// 세션 기반 그룹핑 (MAC 주소 랜덤화 대응)
// 유사한 RSSI 패턴과 시간 근접성을 기반으로 세션 묶기
export function groupBySession(
  data: TrackingData[],
  timeThresholdMs: number = 300000, // 5분
  rssiThreshold: number = 10 // dBm 차이 허용
): Map<string, TrackingData[]> {
  if (data.length === 0) return new Map();
  
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const sessions = new Map<string, TrackingData[]>();
  let sessionCounter = 0;

  // 첫 번째 데이터로 첫 세션 시작
  let currentSessionId = `session_${sessionCounter++}`;
  sessions.set(currentSessionId, [sorted[0]]);
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currentSession = sessions.get(currentSessionId)!;
    const lastInSession = currentSession[currentSession.length - 1];
    
    // 시간 차이와 RSSI 패턴 유사도 확인
    const timeDiff = current.timestamp - lastInSession.timestamp;
    const rssiDiff = Math.abs(
      (current.signal_strength || 0) - (lastInSession.signal_strength || 0)
    );
    
    // 위치 차이 (있는 경우)
    let locationSimilar = true;
    if (current.x !== undefined && lastInSession.x !== undefined) {
      const distance = Math.sqrt(
        Math.pow(current.x - lastInSession.x, 2) +
        Math.pow((current.z || 0) - (lastInSession.z || 0), 2)
      );
      locationSimilar = distance < 15; // 15m 이내
    }
    
    // 같은 세션으로 묶을 수 있는 조건
    if (
      timeDiff < timeThresholdMs &&
      rssiDiff < rssiThreshold &&
      locationSimilar
    ) {
      currentSession.push(current);
    } else {
      // 새 세션 시작
      currentSessionId = `session_${sessionCounter++}`;
      sessions.set(currentSessionId, [current]);
    }
  }
  
  // 너무 짧은 세션 제거 (노이즈 가능성)
  const filtered = new Map<string, TrackingData[]>();
  sessions.forEach((session, id) => {
    if (session.length >= 3) { // 최소 3개 이상 데이터 포인트
      filtered.set(id, session);
    }
  });
  
  return filtered;
}

// 통계 기반 고유 방문자 수 추정 (MAC 랜덤화 대응)
export function estimateUniqueVisitors(
  data: TrackingData[],
  timeWindowMs: number = 3600000 // 1시간
): number {
  const sessions = groupBySession(data);
  
  // 시간 윈도우별로 세션 수 집계
  const timeWindows = new Map<number, Set<string>>();
  
  sessions.forEach((sessionData, sessionId) => {
    if (sessionData.length === 0) return;
    
    const windowKey = Math.floor(sessionData[0].timestamp / timeWindowMs);
    if (!timeWindows.has(windowKey)) {
      timeWindows.set(windowKey, new Set());
    }
    timeWindows.get(windowKey)!.add(sessionId);
  });
  
  // 각 윈도우의 세션 수 평균
  const sessionCounts = Array.from(timeWindows.values()).map(s => s.size);
  return sessionCounts.length > 0
    ? Math.round(sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length)
    : 0;
}
