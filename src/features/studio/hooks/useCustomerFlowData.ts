/**
 * useCustomerFlowData.ts
 *
 * 고객 동선 데이터 훅
 * - 동선 오버레이와 시뮬레이션 모두에서 사용
 * - zone_transitions 테이블 기반
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ===== 타입 정의 =====
export interface ZoneInfo {
  id: string;
  zone_name: string;
  zone_code: string;
  zone_type?: string;
  center: { x: number; y: number; z: number };
  boundary?: { x: number; z: number }[];
}

export interface FlowPath {
  id: string;
  from_zone_id: string;
  to_zone_id: string;
  from_zone: ZoneInfo;
  to_zone: ZoneInfo;
  transition_count: number;       // 총 이동 횟수
  transition_probability: number; // 이동 확률 (0-1)
  avg_duration_seconds: number;   // 평균 이동 시간
  daily_avg_count: number;        // 일평균 이동 횟수
}

export interface FlowBottleneck {
  zone: ZoneInfo;
  inbound: number;
  outbound: number;
  bottleneckScore: number;
}

export interface CustomerFlowData {
  zones: ZoneInfo[];
  flowPaths: FlowPath[];
  transitionMatrix: Map<string, FlowPath[]>; // from_zone_id → 가능한 경로들
  totalTransitions: number;
  maxTransitionCount: number;
  avgPathDuration: number;                   // 평균 경로 이동 시간
  entranceZone: ZoneInfo | null;
  exitZones: ZoneInfo[];
  hotspotZones: ZoneInfo[];                  // 트래픽 높은 존 (상위 3개)
  bottlenecks: FlowBottleneck[];             // 병목 지점
}

interface UseCustomerFlowDataOptions {
  storeId: string;
  daysRange?: number; // 최근 N일 데이터 (기본 30일)
  minTransitionCount?: number; // 최소 이동 횟수 필터
  enabled?: boolean;
}

export const useCustomerFlowData = ({
  storeId,
  daysRange = 30,
  minTransitionCount = 20,
  enabled = true,
}: UseCustomerFlowDataOptions) => {
  // 디버그: 훅 호출 시 파라미터 확인
  console.log('[useCustomerFlowData] 호출:', { storeId, daysRange, minTransitionCount, enabled });

  return useQuery({
    queryKey: ['customer-flow-data', storeId, daysRange, minTransitionCount],
    queryFn: async (): Promise<CustomerFlowData> => {
      console.log('[useCustomerFlowData] queryFn 실행, storeId:', storeId);

      // 1. 존 정보 가져오기 (zones_dim 테이블)
      // boundary 컬럼은 optional - 일부 스키마에만 존재할 수 있음
      const { data: zones, error: zonesError } = await supabase
        .from('zones_dim')
        .select('id, zone_name, zone_code, zone_type, position_x, position_y, position_z')
        .eq('store_id', storeId)
        .order('zone_code');

      console.log('[useCustomerFlowData] zones_dim 쿼리 결과:', {
        count: zones?.length ?? 0,
        error: zonesError,
        storeId
      });

      if (zonesError) {
        console.error('[useCustomerFlowData] 존 데이터 로드 실패:', zonesError);
        throw zonesError;
      }

      if (!zones || zones.length === 0) {
        console.warn('[useCustomerFlowData] 존 데이터가 없습니다. storeId:', storeId);
        // 빈 데이터 반환 (모든 필드 포함)
        return {
          zones: [],
          flowPaths: [],
          transitionMatrix: new Map(),
          totalTransitions: 0,
          maxTransitionCount: 0,
          avgPathDuration: 0,
          entranceZone: null,
          exitZones: [],
          hotspotZones: [],
          bottlenecks: [],
        };
      }

      // 존 맵 생성 (좌표 변환)
      const zoneMap = new Map<string, ZoneInfo>();
      zones.forEach(z => {
        const center = {
          x: z.position_x ?? 0,
          y: z.position_y ?? 0,
          z: z.position_z ?? 0,
        };

        zoneMap.set(z.id, {
          id: z.id,
          zone_name: z.zone_name || z.zone_code || 'Unknown',
          zone_code: z.zone_code || '',
          zone_type: z.zone_type ?? undefined,
          center,
          // boundary는 optional이며 별도 컬럼이 필요할 경우 추가
        });
      });

      // 2. 존 간 이동 데이터 집계 (zone_transitions 테이블)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysRange);

      const { data: transitions, error: transitionsError } = await supabase
        .from('zone_transitions')
        .select('from_zone_id, to_zone_id, transition_count, avg_duration_seconds, transition_date')
        .eq('store_id', storeId)
        .gte('transition_date', startDate.toISOString().split('T')[0]);

      // zone_transitions 테이블이 없거나 데이터가 없으면 zones_dim만으로 생성
      if (transitionsError || !transitions || transitions.length === 0) {
        console.warn('[useCustomerFlowData] 전환 데이터 없음, 존 기반 더미 데이터 생성');

        // 존 기반 기본 동선 생성
        const { flowPaths, transitionMatrix, maxTransitionCount } = generateDefaultFlowPaths(
          Array.from(zoneMap.values())
        );

        const entranceZone = findEntranceZone(zones, zoneMap);
        const exitZones = findExitZones(zones, zoneMap);

        return {
          zones: Array.from(zoneMap.values()),
          flowPaths,
          transitionMatrix,
          totalTransitions: flowPaths.reduce((sum, f) => sum + f.transition_count, 0),
          maxTransitionCount,
          avgPathDuration: 45, // 기본값
          entranceZone,
          exitZones,
          hotspotZones: [],
          bottlenecks: [],
        };
      }

      // 3. 존 쌍별로 집계 (days 추가)
      const aggregated = new Map<string, {
        from_zone_id: string;
        to_zone_id: string;
        total_count: number;
        total_duration_weighted: number;
        days: Set<string>;
      }>();

      transitions.forEach(t => {
        const key = `${t.from_zone_id}->${t.to_zone_id}`;
        const existing = aggregated.get(key);

        if (existing) {
          existing.total_count += t.transition_count || 1;
          existing.total_duration_weighted += (t.avg_duration_seconds || 60) * (t.transition_count || 1);
          if (t.transition_date) existing.days.add(t.transition_date);
        } else {
          aggregated.set(key, {
            from_zone_id: t.from_zone_id,
            to_zone_id: t.to_zone_id,
            total_count: t.transition_count || 1,
            total_duration_weighted: (t.avg_duration_seconds || 60) * (t.transition_count || 1),
            days: new Set(t.transition_date ? [t.transition_date] : []),
          });
        }
      });

      // 4. 존별 총 이탈/유입 횟수 계산 (확률 및 병목 계산용)
      const zoneOutboundTotal = new Map<string, number>();
      const zoneInboundTotal = new Map<string, number>();
      aggregated.forEach(agg => {
        // 유출
        const outCurrent = zoneOutboundTotal.get(agg.from_zone_id) || 0;
        zoneOutboundTotal.set(agg.from_zone_id, outCurrent + agg.total_count);
        // 유입
        const inCurrent = zoneInboundTotal.get(agg.to_zone_id) || 0;
        zoneInboundTotal.set(agg.to_zone_id, inCurrent + agg.total_count);
      });

      // 5. FlowPath 배열 생성
      const flowPaths: FlowPath[] = [];
      let maxTransitionCount = 0;
      let totalDuration = 0;
      let totalPathCount = 0;

      aggregated.forEach((agg) => {
        if (agg.total_count < minTransitionCount) return;

        const fromZone = zoneMap.get(agg.from_zone_id);
        const toZone = zoneMap.get(agg.to_zone_id);

        if (!fromZone || !toZone) return;

        const outboundTotal = zoneOutboundTotal.get(agg.from_zone_id) || agg.total_count;
        const probability = agg.total_count / outboundTotal;
        const avgDuration = Math.round(agg.total_duration_weighted / agg.total_count);
        const dailyAvg = Math.round(agg.total_count / Math.max(agg.days.size, 1));

        maxTransitionCount = Math.max(maxTransitionCount, agg.total_count);
        totalDuration += avgDuration;
        totalPathCount++;

        flowPaths.push({
          id: `${agg.from_zone_id}->${agg.to_zone_id}`,
          from_zone_id: agg.from_zone_id,
          to_zone_id: agg.to_zone_id,
          from_zone: fromZone,
          to_zone: toZone,
          transition_count: agg.total_count,
          transition_probability: probability,
          avg_duration_seconds: avgDuration,
          daily_avg_count: dailyAvg,
        });
      });

      // 6. Transition Matrix 생성 (시뮬레이션용)
      const transitionMatrix = new Map<string, FlowPath[]>();
      flowPaths.forEach(path => {
        const existing = transitionMatrix.get(path.from_zone_id) || [];
        existing.push(path);
        transitionMatrix.set(path.from_zone_id, existing);
      });

      // 확률 기준 정렬
      transitionMatrix.forEach((paths) => {
        paths.sort((a, b) => b.transition_probability - a.transition_probability);
      });

      // 7. 입구/출구 존 식별
      const entranceZone = findEntranceZone(zones, zoneMap);
      const exitZones = findExitZones(zones, zoneMap);

      // 8. 핫스팟 존 식별 (트래픽 상위 3개)
      const zoneTraffic = new Map<string, number>();
      flowPaths.forEach(p => {
        zoneTraffic.set(p.to_zone_id, (zoneTraffic.get(p.to_zone_id) || 0) + p.transition_count);
      });
      const hotspotZones = Array.from(zoneTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([zoneId]) => zoneMap.get(zoneId)!)
        .filter(Boolean);

      // 9. 병목 분석 (유입 > 유출인 존)
      const bottlenecks: FlowBottleneck[] = Array.from(zoneMap.values())
        .map(zone => {
          const inbound = zoneInboundTotal.get(zone.id) || 0;
          const outbound = zoneOutboundTotal.get(zone.id) || 0;
          // 병목 점수: 유입이 많고 유출이 적으면 높음
          const bottleneckScore = inbound > 0 ? Math.round((inbound - outbound) / inbound * 100) : 0;
          return { zone, inbound, outbound, bottleneckScore };
        })
        .filter(b => b.bottleneckScore > 20) // 20% 이상 병목
        .sort((a, b) => b.bottleneckScore - a.bottleneckScore);

      // 10. 이동 횟수 기준 정렬
      flowPaths.sort((a, b) => b.transition_count - a.transition_count);

      console.log('[useCustomerFlowData] 로드 완료:', {
        zones: zones.length,
        flowPaths: flowPaths.length,
        totalTransitions: flowPaths.reduce((sum, f) => sum + f.transition_count, 0),
        maxTransitionCount,
        hotspots: hotspotZones.length,
        bottlenecks: bottlenecks.length,
      });

      return {
        zones: Array.from(zoneMap.values()),
        flowPaths,
        transitionMatrix,
        totalTransitions: flowPaths.reduce((sum, f) => sum + f.transition_count, 0),
        maxTransitionCount,
        avgPathDuration: totalPathCount > 0 ? Math.round(totalDuration / totalPathCount) : 0,
        entranceZone,
        exitZones,
        hotspotZones,
        bottlenecks,
      };
    },
    enabled: enabled && !!storeId,
    staleTime: 10 * 60 * 1000, // 10분 캐시
  });
};

// ===== 헬퍼 함수들 =====

function findEntranceZone(
  zones: any[],
  zoneMap: Map<string, ZoneInfo>
): ZoneInfo | null {
  const entrance = zones.find(z =>
    z.zone_type === 'entrance' ||
    z.zone_name?.includes('입구') ||
    z.zone_code === 'Z001' ||
    z.zone_name?.toLowerCase().includes('entrance')
  );
  return entrance ? zoneMap.get(entrance.id) || null : null;
}

function findExitZones(
  zones: any[],
  zoneMap: Map<string, ZoneInfo>
): ZoneInfo[] {
  return zones
    .filter(z =>
      z.zone_type === 'checkout' ||
      z.zone_type === 'exit' ||
      z.zone_name?.includes('계산대') ||
      z.zone_name?.includes('출구') ||
      z.zone_code === 'Z006'
    )
    .map(z => zoneMap.get(z.id))
    .filter((z): z is ZoneInfo => !!z);
}

/**
 * zone_transitions 데이터가 없을 때 zones_dim 기반으로 기본 동선 생성
 */
function generateDefaultFlowPaths(zones: ZoneInfo[]): {
  flowPaths: FlowPath[];
  transitionMatrix: Map<string, FlowPath[]>;
  maxTransitionCount: number;
} {
  const flowPaths: FlowPath[] = [];
  const transitionMatrix = new Map<string, FlowPath[]>();
  let maxTransitionCount = 0;

  // 입구 존 찾기
  const entranceZones = zones.filter(z =>
    z.zone_type === 'entrance' || z.zone_name?.includes('입구')
  );

  // 디스플레이 존 찾기
  const displayZones = zones.filter(z =>
    z.zone_type === 'display' || (!z.zone_type && !z.zone_name?.includes('입구') && !z.zone_name?.includes('계산대'))
  );

  // 계산대 존 찾기
  const checkoutZones = zones.filter(z =>
    z.zone_type === 'checkout' || z.zone_name?.includes('계산대')
  );

  // 입구 → 디스플레이
  entranceZones.forEach(entrance => {
    displayZones.slice(0, 3).forEach((display, idx) => {
      const count = 100 - idx * 20;
      maxTransitionCount = Math.max(maxTransitionCount, count);

      const path: FlowPath = {
        id: `${entrance.id}->${display.id}`,
        from_zone_id: entrance.id,
        to_zone_id: display.id,
        from_zone: entrance,
        to_zone: display,
        transition_count: count,
        transition_probability: (100 - idx * 15) / 100,
        avg_duration_seconds: 30 + idx * 10,
        daily_avg_count: Math.round(count / 30), // 30일 평균
      };

      flowPaths.push(path);

      const existing = transitionMatrix.get(entrance.id) || [];
      existing.push(path);
      transitionMatrix.set(entrance.id, existing);
    });
  });

  // 디스플레이 → 디스플레이 (인접 존 간)
  displayZones.forEach((from, i) => {
    displayZones.forEach((to, j) => {
      if (i !== j && Math.abs(i - j) <= 2) {
        const count = 50 - Math.abs(i - j) * 10;
        maxTransitionCount = Math.max(maxTransitionCount, count);

        const path: FlowPath = {
          id: `${from.id}->${to.id}`,
          from_zone_id: from.id,
          to_zone_id: to.id,
          from_zone: from,
          to_zone: to,
          transition_count: count,
          transition_probability: 0.3 / Math.abs(i - j),
          avg_duration_seconds: 45,
          daily_avg_count: Math.round(count / 30),
        };

        flowPaths.push(path);

        const existing = transitionMatrix.get(from.id) || [];
        existing.push(path);
        transitionMatrix.set(from.id, existing);
      }
    });
  });

  // 디스플레이 → 계산대
  displayZones.forEach((display, idx) => {
    checkoutZones.forEach(checkout => {
      const count = 40 + (displayZones.length - idx) * 5;
      maxTransitionCount = Math.max(maxTransitionCount, count);

      const path: FlowPath = {
        id: `${display.id}->${checkout.id}`,
        from_zone_id: display.id,
        to_zone_id: checkout.id,
        from_zone: display,
        to_zone: checkout,
        transition_count: count,
        transition_probability: 0.2,
        avg_duration_seconds: 60,
        daily_avg_count: Math.round(count / 30),
      };

      flowPaths.push(path);

      const existing = transitionMatrix.get(display.id) || [];
      existing.push(path);
      transitionMatrix.set(display.id, existing);
    });
  });

  return { flowPaths, transitionMatrix, maxTransitionCount };
}

// ===== 유틸리티 함수들 (export) =====

/**
 * 확률 기반으로 다음 존 선택 (시뮬레이션용)
 */
export const selectNextZone = (
  currentZoneId: string,
  transitionMatrix: Map<string, FlowPath[]>
): FlowPath | null => {
  const possiblePaths = transitionMatrix.get(currentZoneId);
  if (!possiblePaths || possiblePaths.length === 0) return null;

  // 확률 기반 선택 (룰렛 휠)
  const random = Math.random();
  let cumulative = 0;

  for (const path of possiblePaths) {
    cumulative += path.transition_probability;
    if (random <= cumulative) {
      return path;
    }
  }

  // fallback: 첫 번째 경로
  return possiblePaths[0];
};

/**
 * 존 중심에서 랜덤 오프셋 위치 생성
 */
export const getRandomPositionInZone = (zone: ZoneInfo): { x: number; y: number; z: number } => {
  const center = zone.center;
  const offset = 2; // 중심에서 ±2m 범위

  return {
    x: center.x + (Math.random() - 0.5) * offset * 2,
    y: 0,
    z: center.z + (Math.random() - 0.5) * offset * 2,
  };
};

export default useCustomerFlowData;
