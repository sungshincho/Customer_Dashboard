import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSelectedStore } from './useSelectedStore';

/**
 * 실제 업로드된 샘플 데이터를 가져오는 Hook
 * 하드코딩 금지 - 실제 user_data_imports 테이블에서 데이터 조회
 */

export function useRealCustomers() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-customers', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('user_data_imports')
        .select('raw_data')
        .eq('user_id', user.id)
        .eq('data_type', 'customers');

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // raw_data에서 실제 고객 데이터 추출
      const customers = data?.flatMap(item => item.raw_data as any[]) || [];
      return customers;
    },
    enabled: !!user,
  });
}

export function useRealPurchases() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-purchases', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('user_data_imports')
        .select('raw_data')
        .eq('user_id', user.id)
        .eq('data_type', 'purchases');

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const purchases = data?.flatMap(item => item.raw_data as any[]) || [];
      return purchases;
    },
    enabled: !!user,
  });
}

export function useRealProducts() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-products', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('user_data_imports')
        .select('raw_data')
        .eq('user_id', user.id)
        .eq('data_type', 'products');

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const products = data?.flatMap(item => item.raw_data as any[]) || [];
      return products;
    },
    enabled: !!user,
  });
}

export function useRealVisits() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-visits', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('user_data_imports')
        .select('raw_data')
        .eq('user_id', user.id)
        .eq('data_type', 'visits');

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const visits = data?.flatMap(item => item.raw_data as any[]) || [];
      return visits;
    },
    enabled: !!user,
  });
}

export function useRealWiFiTracking() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-wifi-tracking', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      // wifi_tracking 테이블에서 직접 조회
      const query = supabase
        .from('wifi_tracking')
        .select('*')
        .eq('user_id', user.id);

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
}

export function useRealZones() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-zones', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('wifi_zones')
        .select('*')
        .eq('user_id', user.id);

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * 전체 데이터 통계
 */
export function useRealDataSummary() {
  const customers = useRealCustomers();
  const purchases = useRealPurchases();
  const products = useRealProducts();
  const visits = useRealVisits();
  const wifiTracking = useRealWiFiTracking();

  return {
    customerCount: customers.data?.length || 0,
    purchaseCount: purchases.data?.length || 0,
    productCount: products.data?.length || 0,
    visitCount: visits.data?.length || 0,
    wifiTrackingCount: wifiTracking.data?.length || 0,
    
    isLoading: customers.isLoading || purchases.isLoading || products.isLoading || 
               visits.isLoading || wifiTracking.isLoading,
    
    hasData: (customers.data?.length || 0) > 0 || 
             (purchases.data?.length || 0) > 0 || 
             (products.data?.length || 0) > 0,
  };
}
