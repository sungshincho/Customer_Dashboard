// src/hooks/useSimulationEngine.ts

/**
 * 실시간 시뮬레이션 엔진 훅
 *
 * - 고객 에이전트 생성 및 관리
 * - 상태 전환 로직
 * - 애니메이션 루프
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore, CustomerAgent, STATE_COLORS, CustomerState } from '@/stores/simulationStore';

// ============================================
// 타입 정의
// ============================================

interface Zone {
  id: string;
  zone_name?: string;
  x?: number;
  z?: number;
  width?: number;
  depth?: number;
  zone_type?: string;
  coordinates?: {
    x?: number;
    z?: number;
    width?: number;
    depth?: number;
  };
}

interface UseSimulationEngineProps {
  zones: Zone[];
  enabled?: boolean;
}

// ============================================
// 유틸리티 함수
// ============================================

function generateId(): string {
  return `customer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getZonePosition(zone: Zone): { x: number; z: number; width: number; depth: number } {
  return {
    x: zone.x ?? zone.coordinates?.x ?? 0,
    z: zone.z ?? zone.coordinates?.z ?? 0,
    width: zone.width ?? zone.coordinates?.width ?? 2,
    depth: zone.depth ?? zone.coordinates?.depth ?? 2,
  };
}

function getRandomPositionInZone(zone: Zone): [number, number, number] {
  const { x, z, width, depth } = getZonePosition(zone);
  const rx = x + (Math.random() - 0.5) * width * 0.7;
  const rz = z + (Math.random() - 0.5) * depth * 0.7;
  return [rx, 0.5, rz];
}

function findZoneAtPosition(zones: Zone[], px: number, pz: number): Zone | null {
  return zones.find((zone) => {
    const { x, z, width, depth } = getZonePosition(zone);
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    return (
      px >= x - halfWidth &&
      px <= x + halfWidth &&
      pz >= z - halfDepth &&
      pz <= z + halfDepth
    );
  }) || null;
}

function isEntryZone(zone: Zone): boolean {
  const name = (zone.zone_name || '').toLowerCase();
  const type = (zone.zone_type || '').toLowerCase();
  return (
    type === 'entrance' ||
    type === 'entry' ||
    name.includes('입구') ||
    name.includes('entry') ||
    name.includes('entrance')
  );
}

function isExitZone(zone: Zone): boolean {
  const name = (zone.zone_name || '').toLowerCase();
  const type = (zone.zone_type || '').toLowerCase();
  return (
    type === 'exit' ||
    name.includes('출구') ||
    name.includes('exit') ||
    name.includes('checkout') ||
    name.includes('계산')
  );
}

// ============================================
// 메인 훅
// ============================================

export function useSimulationEngine({ zones, enabled = true }: UseSimulationEngineProps) {
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // 🔧 FIX: ref로 최신 값 유지 (effect 재시작 방지)
  const zonesRef = useRef(zones);
  const configRef = useRef<typeof config | null>(null);

  const {
    isRunning,
    isPaused,
    customers,
    config,
    addCustomer,
    updateCustomer,
    removeCustomer,
    updateKPI,
    recordConversion,
    tick,
  } = useSimulationStore();

  // refs 업데이트
  zonesRef.current = zones;
  configRef.current = config;

  // 🔧 FIX: 존 찾기 함수들 (ref 기반으로 동적 조회)
  const findEntryZone = useCallback((): Zone | null => {
    const currentZones = zonesRef.current;
    if (!currentZones || currentZones.length === 0) return null;

    // 1. zone_type이 'entrance'인 존 찾기
    const byType = currentZones.find(z =>
      (z.zone_type || '').toLowerCase() === 'entrance' ||
      (z.zone_type || '').toLowerCase() === 'entry'
    );
    if (byType) return byType;

    // 2. zone_name에 '입구' 포함된 존 찾기
    const byName = currentZones.find(z => {
      const name = (z.zone_name || '').toLowerCase();
      return name.includes('입구') || name.includes('entrance') || name.includes('entry');
    });
    if (byName) return byName;

    // 3. 가장 낮은 z 좌표를 가진 존 (일반적으로 입구가 앞쪽에 위치)
    const sorted = [...currentZones].sort((a, b) => {
      const zA = a.z ?? a.coordinates?.z ?? 0;
      const zB = b.z ?? b.coordinates?.z ?? 0;
      return zA - zB;
    });

    console.log('[useSimulationEngine] Entry zone not found by type/name, using zone with lowest Z:', sorted[0]?.zone_name);
    return sorted[0] || null;
  }, []);

  const findExitZone = useCallback((): Zone | null => {
    const currentZones = zonesRef.current;
    if (!currentZones || currentZones.length === 0) return null;
    return currentZones.find(isExitZone) || findEntryZone();
  }, [findEntryZone]);

  const findBrowseZones = useCallback((): Zone[] => {
    const currentZones = zonesRef.current;
    if (!currentZones) return [];
    return currentZones.filter((z) => !isEntryZone(z) && !isExitZone(z));
  }, []);

  // 🔧 DEBUG: zones 정보 로깅 (더 상세한 정보)
  useEffect(() => {
    const entryZone = findEntryZone();
    const exitZone = findExitZone();
    const browseZones = findBrowseZones();

    console.log('[useSimulationEngine] Zones updated:', {
      total: zones.length,
      entryZone: entryZone ? {
        name: entryZone.zone_name,
        type: entryZone.zone_type,
        x: entryZone.x ?? entryZone.coordinates?.x,
        z: entryZone.z ?? entryZone.coordinates?.z,
      } : null,
      exitZone: exitZone?.zone_name || exitZone?.id,
      browseZones: browseZones.length,
      enabled,
      isRunning,
    });

    if (zones.length > 0 && !entryZone) {
      console.warn('[useSimulationEngine] ⚠️ Entry zone not detected! Available zones:',
        zones.map(z => ({ name: z.zone_name, type: z.zone_type }))
      );
    }
  }, [zones, enabled, isRunning, findEntryZone, findExitZone, findBrowseZones]);

  // 🔧 FIX: 고객 수를 ref로 추적 (effect 재시작 방지)
  const customersRef = useRef(customers);
  customersRef.current = customers;

  // 새 고객 생성 (의존성에서 customers.length 제거)
  // 🔧 FIX: 동적으로 입구 존을 찾아 고객 생성
  const spawnCustomer = useCallback(() => {
    // ref에서 최신 고객 수 및 설정 확인
    const currentCustomerCount = customersRef.current.length;
    const currentConfig = configRef.current;

    // 🔧 FIX: 실시간으로 입구 존 찾기 (ref 기반)
    const entryZone = findEntryZone();
    const browseZones = findBrowseZones();

    if (!entryZone) {
      console.log('[useSimulationEngine] No entry zone found, cannot spawn customer');
      return;
    }
    if (currentCustomerCount >= (currentConfig?.maxCustomers || 30)) {
      return;
    }

    const position = getRandomPositionInZone(entryZone);
    const targetZone = browseZones.length > 0
      ? browseZones[Math.floor(Math.random() * browseZones.length)]
      : entryZone;
    const targetPosition = getRandomPositionInZone(targetZone);

    const customer: CustomerAgent = {
      id: generateId(),
      position,
      targetPosition,
      targetZone: targetZone?.id || null,
      currentZone: entryZone.id,
      visitedZones: [entryZone.id],
      behavior: 'walking',
      state: 'entering',
      speed: 0.8 + Math.random() * 0.6,
      enteredAt: Date.now(),
      dwellTime: 0,
      purchaseProbability: currentConfig?.purchaseProbability || 0.164,
      color: STATE_COLORS.entering,
      path: [position],
    };

    console.log('[useSimulationEngine] 🚶 Spawning customer:', customer.id,
      'at', entryZone.zone_name || entryZone.id,
      `(x: ${position[0].toFixed(1)}, z: ${position[2].toFixed(1)})`);
    addCustomer(customer);
  }, [findEntryZone, findBrowseZones, addCustomer]);

  // 고객 상태 전환
  // 🔧 FIX: 동적으로 존 찾기 사용
  const transitionCustomerState = useCallback((
    customer: CustomerAgent,
    currentZone: Zone | null
  ): { newState: CustomerState; newTarget: [number, number, number]; shouldRemove: boolean } => {
    // 실시간으로 존 정보 가져오기
    const browseZones = findBrowseZones();
    const exitZone = findExitZone();
    const currentConfig = configRef.current;

    let newState: CustomerState = customer.state;
    let newTarget = customer.targetPosition;
    let shouldRemove = false;

    switch (customer.state) {
      case 'entering':
        newState = 'browsing';
        if (browseZones.length > 0) {
          const nextZone = browseZones[Math.floor(Math.random() * browseZones.length)];
          newTarget = getRandomPositionInZone(nextZone);
        }
        break;

      case 'browsing':
        const browseRoll = Math.random();
        if (browseRoll < 0.25) {
          newState = 'engaged';
        } else if (browseRoll < 0.1) {
          newState = 'exiting';
          if (exitZone) newTarget = getRandomPositionInZone(exitZone);
        } else {
          // 다른 구역으로 이동
          if (browseZones.length > 0) {
            const nextZone = browseZones[Math.floor(Math.random() * browseZones.length)];
            newTarget = getRandomPositionInZone(nextZone);
          }
        }
        break;

      case 'engaged':
        const engageRoll = Math.random();
        if (engageRoll < 0.35) {
          newState = 'fitting';
        } else if (engageRoll < 0.15) {
          newState = 'exiting';
          if (exitZone) newTarget = getRandomPositionInZone(exitZone);
        } else {
          newState = 'browsing';
          if (browseZones.length > 0) {
            const nextZone = browseZones[Math.floor(Math.random() * browseZones.length)];
            newTarget = getRandomPositionInZone(nextZone);
          }
        }
        break;

      case 'fitting':
        if (Math.random() < (currentConfig?.purchaseProbability || 0.164) * 2.5) {
          newState = 'purchasing';
        } else {
          newState = 'exiting';
          if (exitZone) newTarget = getRandomPositionInZone(exitZone);
        }
        break;

      case 'purchasing':
        // 구매 기록
        const revenue = Math.floor(30000 + Math.random() * 150000);
        recordConversion(revenue);
        newState = 'exiting';
        if (exitZone) newTarget = getRandomPositionInZone(exitZone);
        break;

      case 'exiting':
        shouldRemove = true;
        break;
    }

    return { newState, newTarget, shouldRemove };
  }, [findBrowseZones, findExitZone, recordConversion]);

  // 고객 업데이트
  const updateCustomers = useCallback((deltaTime: number) => {
    const speedMultiplier = config.speed;

    customers.forEach((customer) => {
      const [cx, cy, cz] = customer.position;
      const [tx, ty, tz] = customer.targetPosition;

      // 거리 계산
      const dx = tx - cx;
      const dz = tz - cz;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // 체류시간 업데이트
      const newDwellTime = customer.dwellTime + deltaTime * speedMultiplier;

      if (distance < 0.2) {
        // 목표 도달 - 상태 전환
        const currentZone = findZoneAtPosition(zones, cx, cz);
        const { newState, newTarget, shouldRemove } = transitionCustomerState(customer, currentZone);

        if (shouldRemove) {
          removeCustomer(customer.id);
        } else {
          updateCustomer(customer.id, {
            state: newState,
            targetPosition: newTarget,
            color: STATE_COLORS[newState],
            currentZone: currentZone?.id || null,
            dwellTime: newDwellTime,
            path: [...customer.path, newTarget],
          });
        }
      } else {
        // 이동
        const moveSpeed = customer.speed * speedMultiplier * deltaTime * 0.5;
        const ratio = Math.min(moveSpeed / distance, 1);

        const newPosition: [number, number, number] = [
          cx + dx * ratio,
          cy,
          cz + dz * ratio,
        ];

        updateCustomer(customer.id, {
          position: newPosition,
          dwellTime: newDwellTime,
          currentZone: findZoneAtPosition(zones, newPosition[0], newPosition[2])?.id || null,
        });
      }
    });

    // 구역별 점유율 업데이트
    const zoneOccupancy: Record<string, number> = {};
    zones.forEach((zone) => {
      const count = customers.filter((c) => c.currentZone === zone.id).length;
      zoneOccupancy[zone.id] = count;
    });
    updateKPI({ zoneOccupancy });

  }, [customers, config.speed, zones, transitionCustomerState, updateCustomer, removeCustomer, updateKPI]);

  // 🔧 FIX: refs로 콜백 추적 (effect 재시작 방지)
  const spawnCustomerRef = useRef(spawnCustomer);
  const updateCustomersRef = useRef(updateCustomers);
  const tickRef = useRef(tick);

  spawnCustomerRef.current = spawnCustomer;
  updateCustomersRef.current = updateCustomers;
  tickRef.current = tick;

  // 메인 애니메이션 루프
  useEffect(() => {
    // 🔧 FIX: zones.length === 0 조건 제거 - zones가 나중에 로드될 수 있음
    if (!enabled || !isRunning || isPaused) {
      console.log('[useSimulationEngine] Animation loop not starting:', { enabled, isRunning, isPaused });
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    console.log('[useSimulationEngine] Starting animation loop');
    let isActive = true;

    const animate = (time: number) => {
      if (!isActive) return;

      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      // 최대 델타 시간 제한 (탭 전환 등으로 인한 큰 점프 방지)
      const clampedDelta = Math.min(deltaTime, 0.1);

      // 시간 업데이트
      tickRef.current(clampedDelta);

      // 🔧 FIX: zones가 로드되었을 때만 고객 생성
      const currentZones = zonesRef.current;
      const currentConfig = configRef.current;

      if (currentZones && currentZones.length > 0 && currentConfig) {
        // 고객 생성 (확률적)
        const spawnProb = currentConfig.spawnRate * clampedDelta * currentConfig.speed;
        if (Math.random() < spawnProb) {
          spawnCustomerRef.current();
        }

        // 고객 업데이트
        updateCustomersRef.current(clampedDelta);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      console.log('[useSimulationEngine] Stopping animation loop');
      isActive = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, isRunning, isPaused]);  // 🔧 FIX: 최소 의존성으로 변경

  return {
    spawnCustomer,
    isActive: isRunning && !isPaused,
  };
}

export default useSimulationEngine;
