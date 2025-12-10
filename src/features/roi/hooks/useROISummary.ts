/**
 * ROI 요약 데이터 훅
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { ROISummary, DateRange } from '../types/roi.types';

const getDaysFromRange = (range: DateRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return 3650; // ~10년
    default:
      return 90;
  }
};

export const useROISummary = (dateRange: DateRange) => {
  const { selectedStore } = useSelectedStore();

  return useQuery<ROISummary>({
    queryKey: ['roi-summary', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) {
        throw new Error('Store not selected');
      }

      const days = getDaysFromRange(dateRange);

      // RPC 함수 호출
      const { data, error } = await supabase.rpc('get_roi_summary', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) {
        console.error('ROI summary fetch error:', error);
        // 데이터가 없는 경우 기본값 반환
        return {
          totalApplied: 0,
          activeCount: 0,
          successCount: 0,
          failedCount: 0,
          successRate: 0,
          averageRoi: 0,
          totalRevenueImpact: 0,
          expectedRevenueTotal: 0,
          revenueChangePercent: 0,
        };
      }

      return {
        totalApplied: data?.totalApplied || 0,
        activeCount: data?.activeCount || 0,
        successCount: data?.successCount || 0,
        failedCount: data?.failedCount || 0,
        successRate: data?.successRate || 0,
        averageRoi: data?.averageRoi || 0,
        totalRevenueImpact: data?.totalRevenueImpact || 0,
        expectedRevenueTotal: data?.expectedRevenueTotal || 0,
        revenueChangePercent: 0, // TODO: 전월 대비 계산
      };
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

export default useROISummary;
