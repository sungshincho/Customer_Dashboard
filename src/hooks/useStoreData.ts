/**
 * 통합 Store 데이터 Hook (DB 테이블 기반)
 * 
 * 수정됨: Storage CSV 파일 대신 DB 테이블 직접 조회
 * 
 * 아키텍처:
 * - 고객 업로드 → Storage → ETL → DB 테이블
 * - 모든 기능 → DB 테이블 직접 조회
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { useAuth } from './useAuth';

export interface StoreDataset {
  customers: any[];
  products: any[];
  purchases: any[];
  visits: any[];
  staff: any[];
}

/**
 * 전체 데이터셋 로드 Hook (DB 테이블 기반)
 */
export function useStoreDataset() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  
  return useQuery({
    queryKey: ['store-dataset-db', selectedStore?.id, orgId],
    queryFn: async (): Promise<StoreDataset> => {
      if (!selectedStore?.id || !orgId) {
        return {
          customers: [],
          products: [],
          purchases: [],
          visits: [],
          staff: [],
        };
      }

      // 병렬로 모든 테이블 조회
      const [
        customersResult,
        productsResult,
        purchasesResult,
        visitsResult,
        staffResult,
      ] = await Promise.all([
        // customers 테이블
        supabase
          .from('customers')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId),
        
        // products 테이블
        supabase
          .from('products')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId),
        
        // purchases 테이블 (오늘 날짜 기준, 최근 100건)
        supabase
          .from('purchases')
          .select(`
            *,
            product:products(product_name, category, price)
          `)
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .order('purchase_date', { ascending: false })
          .limit(100),
        
        // visits 테이블 (오늘 날짜 기준, 최근 100건)
        supabase
          .from('visits')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .order('visit_date', { ascending: false })
          .limit(100),
        
        // staff 테이블 (있는 경우)
        supabase
          .from('staff')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .limit(50),
      ]);

      // purchases에 product_name 추가 (조인 결과 매핑)
      const purchasesWithProduct = (purchasesResult.data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name || '상품',
        category: p.product?.category,
      }));

      return {
        customers: customersResult.data || [],
        products: productsResult.data || [],
        purchases: purchasesWithProduct,
        visits: visitsResult.data || [],
        staff: staffResult.data || [],
      };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000, // 2분 캐싱
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/**
 * 고객 데이터 Hook (DB 기반)
 */
export function useCustomers() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['customers-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 상품 데이터 Hook (DB 기반)
 */
export function useProducts() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['products-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 구매 데이터 Hook (DB 기반)
 */
export function usePurchases(options?: { limit?: number; todayOnly?: boolean }) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const limit = options?.limit || 100;
  const todayOnly = options?.todayOnly || false;

  return useQuery({
    queryKey: ['purchases-db', selectedStore?.id, orgId, limit, todayOnly],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      let query = supabase
        .from('purchases')
        .select(`
          *,
          product:products(product_name, category, price)
        `)
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('purchase_date', { ascending: false })
        .limit(limit);

      if (todayOnly) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('purchase_date', `${today}T00:00:00`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // product_name 매핑
      return (data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name || '상품',
        category: p.product?.category,
      }));
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 방문 데이터 Hook (DB 기반)
 */
export function useVisits(options?: { limit?: number; todayOnly?: boolean }) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const limit = options?.limit || 100;
  const todayOnly = options?.todayOnly || false;

  return useQuery({
    queryKey: ['visits-db', selectedStore?.id, orgId, limit, todayOnly],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      let query = supabase
        .from('visits')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('visit_date', { ascending: false })
        .limit(limit);

      if (todayOnly) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('visit_date', `${today}T00:00:00`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 직원 데이터 Hook (DB 기반)
 */
export function useStaff() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['staff-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        // staff 테이블이 없을 수 있음
        console.warn('Staff table query failed:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 단일 데이터 파일 로드 Hook (하위 호환성)
 * @deprecated DB 기반 개별 Hook 사용 권장
 */
export function useStoreDataFile(fileType: string) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['store-data-file', fileType, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const tableName = fileType.replace('.csv', '');
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .limit(100);

      if (error) {
        console.warn(`Table ${tableName} query failed:`, error);
        return { data: [] };
      }

      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * WiFi 트래킹 데이터 Hook (DB 기반)
 */
export function useWiFiTracking() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['wifi-tracking-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 데이터 새로고침 유틸리티
 */
export function useRefreshStoreData() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return {
    refreshAll: () => {
      // React Query의 invalidateQueries 사용
      // queryClient.invalidateQueries(['store-dataset-db', selectedStore?.id, orgId]);
    },
    refreshTable: (tableName: string) => {
      // queryClient.invalidateQueries([`${tableName}-db`, selectedStore?.id, orgId]);
    }
  };
}
