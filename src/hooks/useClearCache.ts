/**
 * React Query 캐시 초기화 Hook
 * 스토리지/데이터베이스 초기화 시 사용
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useClearCache() {
  const queryClient = useQueryClient();

  const clearAllCache = () => {
    // 모든 쿼리 캐시 초기화
    queryClient.clear();
    toast.success('캐시가 초기화되었습니다');
  };

  const clearStoreDataCache = (storeId?: string) => {
    if (storeId) {
      // 특정 매장의 데이터 캐시만 초기화
      queryClient.removeQueries({ queryKey: ['store-data', storeId] });
      queryClient.removeQueries({ queryKey: ['store-dataset', storeId] });
    } else {
      // 모든 매장 데이터 캐시 초기화
      queryClient.removeQueries({ queryKey: ['store-data'] });
      queryClient.removeQueries({ queryKey: ['store-dataset'] });
    }
    toast.success('데이터 캐시가 초기화되었습니다');
  };

  const invalidateStoreData = (storeId?: string) => {
    // 캐시를 무효화하고 다시 가져오기
    if (storeId) {
      queryClient.invalidateQueries({ queryKey: ['store-data', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-dataset', storeId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['store-data'] });
      queryClient.invalidateQueries({ queryKey: ['store-dataset'] });
    }
  };

  return {
    clearAllCache,
    clearStoreDataCache,
    invalidateStoreData
  };
}
