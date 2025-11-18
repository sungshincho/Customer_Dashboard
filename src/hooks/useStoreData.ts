/**
 * 통합 Store 데이터 Hook (React Query 기반)
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { loadDataFile, loadMultipleFiles } from '@/lib/storage/loader';
import type { DataFileType, DataFileMap, LoadOptions, StoreDataset } from '@/lib/storage/types';

/**
 * 단일 데이터 파일 로드 Hook
 */
export function useStoreDataFile<K extends DataFileType>(
  fileType: K,
  options: LoadOptions = { fallbackToSample: true }
) {
  const { selectedStore } = useSelectedStore();
  
  return useQuery({
    queryKey: ['store-data', fileType, selectedStore?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStore) {
        throw new Error('User or store not found');
      }
      
      const result = await loadDataFile(
        user.id,
        selectedStore.id,
        fileType,
        options
      );
      
      if (result.error && !result.data.length) {
        throw new Error(result.error);
      }
      
      return result;
    },
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    gcTime: 10 * 60 * 1000,   // 10분 가비지 컬렉션
  });
}

/**
 * 전체 데이터셋 로드 Hook
 */
export function useStoreDataset(
  options: LoadOptions = { fallbackToSample: true }
) {
  const { selectedStore } = useSelectedStore();
  
  const fileTypes: DataFileType[] = [
    'customers',
    'products',
    'purchases',
    'visits',
    'staff'
  ];
  
  return useQuery({
    queryKey: ['store-dataset', selectedStore?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStore) {
        throw new Error('User or store not found');
      }
      
      const results = await loadMultipleFiles(
        user.id,
        selectedStore.id,
        fileTypes,
        options
      );
      
      // LoadResult를 StoreDataset 형태로 변환
      const dataset: StoreDataset = {};
      Object.entries(results).forEach(([key, result]) => {
        if (result && result.data) {
          dataset[key as keyof StoreDataset] = result.data as any;
        }
      });
      
      return dataset;
    },
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * 여러 데이터 파일 동시 로드 Hook
 */
export function useMultipleStoreDataFiles<K extends DataFileType>(
  fileTypes: K[],
  options: LoadOptions = { fallbackToSample: true }
) {
  const { selectedStore } = useSelectedStore();
  
  return useQueries({
    queries: fileTypes.map(fileType => ({
      queryKey: ['store-data', fileType, selectedStore?.id],
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !selectedStore) {
          throw new Error('User or store not found');
        }
        
        const result = await loadDataFile(
          user.id,
          selectedStore.id,
          fileType,
          options
        );
        
        if (result.error && !result.data.length) {
          throw new Error(result.error);
        }
        
        return result;
      },
      enabled: !!selectedStore,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }))
  });
}

/**
 * 고객 데이터 Hook (타입 안전)
 */
export function useCustomers(options?: LoadOptions) {
  return useStoreDataFile('customers', options);
}

/**
 * 상품 데이터 Hook (타입 안전)
 */
export function useProducts(options?: LoadOptions) {
  return useStoreDataFile('products', options);
}

/**
 * 구매 데이터 Hook (타입 안전)
 */
export function usePurchases(options?: LoadOptions) {
  return useStoreDataFile('purchases', options);
}

/**
 * 방문 데이터 Hook (타입 안전)
 */
export function useVisits(options?: LoadOptions) {
  return useStoreDataFile('visits', options);
}

/**
 * 직원 데이터 Hook (타입 안전)
 */
export function useStaff(options?: LoadOptions) {
  return useStoreDataFile('staff', options);
}

/**
 * WiFi 센서 데이터 Hook
 */
export function useWiFiSensors(options?: LoadOptions) {
  return useStoreDataFile('wifi_sensors', options);
}

/**
 * WiFi 트래킹 데이터 Hook
 */
export function useWiFiTracking(options?: LoadOptions) {
  return useStoreDataFile('wifi_tracking', options);
}

/**
 * 데이터 새로고침 유틸리티
 */
export function useRefreshStoreData() {
  const { selectedStore } = useSelectedStore();
  
  return {
    refreshAll: () => {
      // queryClient.invalidateQueries(['store-data', selectedStore?.id]);
      // queryClient.invalidateQueries(['store-dataset', selectedStore?.id]);
    },
    refreshFile: (fileType: DataFileType) => {
      // queryClient.invalidateQueries(['store-data', fileType, selectedStore?.id]);
    }
  };
}
