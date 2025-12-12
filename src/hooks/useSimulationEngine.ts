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

  // 특수 구역 찾기
  const entryZone = zones.find(isEntryZone) || zones[0];
  const exitZone = zones.find(isExitZone) || entryZone;
  const browseZones = zones.filter((z) => !isEntryZone(z) && !isExitZone(z));

  // 새 고객 생성
  const spawnCustomer = useCallback(() => {
    if (!entryZone || customers.length >= config.maxCustomers) return;

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
      purchaseProbability: config.purchaseProbability,
      color: STATE_COLORS.entering,
      path: [position],
    };

    addCustomer(customer);
  }, [entryZone, browseZones, customers.length, config.maxCustomers, config.purchaseProbability, addCustomer]);

  // 고객 상태 전환
  const transitionCustomerState = useCallback((
    customer: CustomerAgent,
    currentZone: Zone | null
  ): { newState: CustomerState; newTarget: [number, number, number]; shouldRemove: boolean } => {
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
        if (Math.random() < config.purchaseProbability * 2.5) {
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
  }, [browseZones, exitZone, config.purchaseProbability, recordConversion]);

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

  // 메인 애니메이션 루프
  useEffect(() => {
    if (!enabled || !isRunning || isPaused || zones.length === 0) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      // 최대 델타 시간 제한 (탭 전환 등으로 인한 큰 점프 방지)
      const clampedDelta = Math.min(deltaTime, 0.1);

      // 시간 업데이트
      tick(clampedDelta);

      // 고객 생성 (확률적)
      if (Math.random() < config.spawnRate * clampedDelta * config.speed) {
        spawnCustomer();
      }

      // 고객 업데이트
      updateCustomers(clampedDelta);

      frameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, isRunning, isPaused, zones, config, spawnCustomer, updateCustomers, tick]);

  return {
    spawnCustomer,
    isActive: isRunning && !isPaused,
  };
}

export default useSimulationEngine;
