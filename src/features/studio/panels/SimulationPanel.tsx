/**
 * SimulationPanel.tsx
 *
 * AI 시뮬레이션 패널
 * - 시뮬레이션 시나리오 관리
 * - 설정 및 실행
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Package,
  Layout,
  DollarSign,
  Users,
  Play,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SimulationScenario, SimulationConfig } from '../types';

// ============================================================================
// Props
// ============================================================================
interface SimulationPanelProps {
  onRunSimulation?: (scenarios: SimulationScenario[]) => void;
  isRunning?: boolean;
  contextData?: {
    inventory?: any[];
    entities?: any[];
    products?: any[];
  };
}

// ============================================================================
// SimulationPanel 컴포넌트
// ============================================================================
export function SimulationPanel({
  onRunSimulation,
  isRunning = false,
  contextData,
}: SimulationPanelProps) {
  const [simulations, setSimulations] = useState<SimulationConfig[]>([
    {
      id: 'demand',
      name: '수요 예측',
      description: '과거 데이터 기반 수요 예측',
      enabled: true,
      parameters: {
        dataRange: 30,
        forecastPeriod: 7,
      },
    },
    {
      id: 'inventory',
      name: '재고 최적화',
      description: '최적 재고 수준 분석',
      enabled: false,
      parameters: {
        items: contextData?.inventory?.length || 0,
      },
    },
    {
      id: 'layout',
      name: '레이아웃 최적화',
      description: 'AI 기반 매장 레이아웃 최적화',
      enabled: true,
      parameters: {
        entities: contextData?.entities?.length || 0,
      },
    },
    {
      id: 'pricing',
      name: '가격 최적화',
      description: '수익 극대화를 위한 가격 전략',
      enabled: false,
      parameters: {
        products: contextData?.products?.length || 0,
      },
    },
    {
      id: 'staffing',
      name: '인력 배치',
      description: '최적 인력 배치 및 스케줄링',
      enabled: false,
      parameters: {},
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>('demand');

  const icons: Record<SimulationScenario, typeof TrendingUp> = {
    demand: TrendingUp,
    inventory: Package,
    layout: Layout,
    pricing: DollarSign,
    marketing: Users,
    staffing: Users,
    congestion: Users,
    flow: TrendingUp,
  };

  const iconColors: Record<SimulationScenario, string> = {
    demand: 'text-blue-400',
    inventory: 'text-green-400',
    layout: 'text-cyan-400',
    pricing: 'text-yellow-400',
    marketing: 'text-purple-400',
    staffing: 'text-orange-400',
    congestion: 'text-red-400',
    flow: 'text-pink-400',
  };

  const toggleEnabled = (id: string) => {
    setSimulations((prev) =>
      prev.map((sim) => (sim.id === id ? { ...sim, enabled: !sim.enabled } : sim))
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRunAll = () => {
    const enabledScenarios = simulations
      .filter((sim) => sim.enabled)
      .map((sim) => sim.id as SimulationScenario);
    onRunSimulation?.(enabledScenarios);
  };

  const enabledCount = simulations.filter((sim) => sim.enabled).length;

  return (
    <div className="p-3 space-y-2">
      {simulations.map((sim) => {
        const Icon = icons[sim.id as SimulationScenario] || TrendingUp;
        const iconColor = iconColors[sim.id as SimulationScenario] || 'text-gray-400';
        const isExpanded = expandedId === sim.id;

        return (
          <div
            key={sim.id}
            className={cn(
              'rounded-lg border transition-colors',
              sim.enabled ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/10'
            )}
          >
            {/* 헤더 */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => toggleExpanded(sim.id)}
            >
              <Switch
                checked={sim.enabled}
                onCheckedChange={() => toggleEnabled(sim.id)}
                onClick={(e) => e.stopPropagation()}
              />

              <div
                className={cn(
                  'p-1.5 rounded',
                  sim.enabled ? 'bg-primary/20' : 'bg-white/10'
                )}
              >
                <Icon className={cn('w-4 h-4', sim.enabled ? iconColor : 'text-white/40')} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white">{sim.name}</h4>
                <p className="text-xs text-white/50 truncate">{sim.description}</p>
              </div>

              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </div>

            {/* 설정 (확장 시) */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/10">
                <div className="pt-2">
                  {Object.entries(sim.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs py-1">
                      <span className="text-white/40 capitalize">
                        {key === 'dataRange' && '데이터 범위'}
                        {key === 'forecastPeriod' && '예측 기간'}
                        {key === 'items' && '현재 재고'}
                        {key === 'entities' && '엔티티 수'}
                        {key === 'products' && '상품 수'}
                        {!['dataRange', 'forecastPeriod', 'items', 'entities', 'products'].includes(key) && key}
                      </span>
                      <span className="text-white/80">
                        {typeof value === 'number' && key.includes('Range')
                          ? `${value}일`
                          : typeof value === 'number' && key.includes('Period')
                          ? `${value}일`
                          : typeof value === 'number'
                          ? `${value}개`
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={!sim.enabled || isRunning}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunSimulation?.([sim.id as SimulationScenario]);
                  }}
                >
                  {isRunning ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  실행
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {/* 전체 실행 버튼 */}
      <Button
        className="w-full gap-2 mt-4"
        disabled={enabledCount === 0 || isRunning}
        onClick={handleRunAll}
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        선택된 시뮬레이션 실행 ({enabledCount})
      </Button>
    </div>
  );
}

export default SimulationPanel;
