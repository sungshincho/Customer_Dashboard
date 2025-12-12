/**
 * 카테고리별 성과 훅
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { CategoryPerformance, DateRange, SimulationSource, SourceModule } from '../types/roi.types';

const getDaysFromRange = (range: DateRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return 3650;
    default:
      return 90;
  }
};

// 모든 가능한 모듈 목록 (데이터가 없어도 표시용)
const ALL_MODULES: Array<{ source: SimulationSource; module: SourceModule }> = [
  { source: '2d_simulation', module: 'price_optimization' },
  { source: '2d_simulation', module: 'inventory_optimization' },
  { source: '2d_simulation', module: 'promotion' },
  { source: '2d_simulation', module: 'demand_forecast' },
  { source: '3d_simulation', module: 'layout_optimization' },
  { source: '3d_simulation', module: 'flow_optimization' },
  { source: '3d_simulation', module: 'congestion_simulation' },
  { source: '3d_simulation', module: 'staffing_optimization' },
];

export const useCategoryPerformance = (dateRange: DateRange) => {
  const { selectedStore } = useSelectedStore();

  return useQuery<CategoryPerformance[]>({
    queryKey: ['category-performance', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) {
        throw new Error('Store not selected');
      }

      const days = getDaysFromRange(dateRange);

      // RPC 함수 호출 (함수가 없을 경우 applied_strategies에서 직접 집계)
      const { data, error } = await supabase.rpc('get_category_performance' as any, {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) {
        console.error('Category performance fetch error:', error);
        // 에러 시 빈 데이터로 기본 모듈 반환
        return ALL_MODULES.map(({ source, module }) => ({
          source,
          sourceModule: module,
          appliedCount: 0,
          successCount: 0,
          averageRoi: 0,
          totalImpact: 0,
          trend: 'stable' as const,
        }));
      }

      // RPC 결과를 CategoryPerformance로 변환
      const resultMap = new Map<string, CategoryPerformance>();

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const key = `${item.source}-${item.source_module}`;
          resultMap.set(key, {
            source: item.source,
            sourceModule: item.source_module,
            appliedCount: item.applied_count || 0,
            successCount: item.success_count || 0,
            averageRoi: item.average_roi || 0,
            totalImpact: item.total_impact || 0,
            trend: item.trend || 'stable',
          });
        });
      }

      // 모든 모듈에 대해 데이터 생성 (없는 것은 0으로)
      return ALL_MODULES.map(({ source, module }) => {
        const key = `${source}-${module}`;
        return (
          resultMap.get(key) || {
            source,
            sourceModule: module,
            appliedCount: 0,
            successCount: 0,
            averageRoi: 0,
            totalImpact: 0,
            trend: 'stable' as const,
          }
        );
      });
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 2D/3D 분리된 데이터
export const useCategoryPerformanceGrouped = (dateRange: DateRange) => {
  const { data, isLoading, error, refetch } = useCategoryPerformance(dateRange);

  const grouped = {
    '2d': data?.filter((item) => item.source === '2d_simulation') || [],
    '3d': data?.filter((item) => item.source === '3d_simulation') || [],
  };

  return { data: grouped, isLoading, error, refetch };
};

export default useCategoryPerformance;
