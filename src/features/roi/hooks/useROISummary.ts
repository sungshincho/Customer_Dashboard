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

      // RPC 함수 호출 (타입이 생성되지 않은 경우 as any 사용)
      const { data, error } = await supabase.rpc('get_roi_summary' as any, {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      // 기본값 정의
      const defaultSummary: ROISummary = {
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

      if (error) {
        console.error('ROI summary fetch error:', error);
        return defaultSummary;
      }

      // RPC 결과를 타입에 맞게 변환
      const result = data as any;
      return {
        totalApplied: result?.total_applied || result?.totalApplied || 0,
        activeCount: result?.active_count || result?.activeCount || 0,
        successCount: result?.success_count || result?.successCount || 0,
        failedCount: result?.failed_count || result?.failedCount || 0,
        successRate: result?.success_rate || result?.successRate || 0,
        averageRoi: result?.average_roi || result?.averageRoi || 0,
        totalRevenueImpact: result?.total_revenue_impact || result?.totalRevenueImpact || 0,
        expectedRevenueTotal: result?.expected_revenue_total || result?.expectedRevenueTotal || 0,
        revenueChangePercent: result?.revenue_change_percent || 0,
      };
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

export default useROISummary;
