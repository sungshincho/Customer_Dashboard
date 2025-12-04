import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSelectedStore } from './useSelectedStore';

/**
 * 실제 DB 테이블에서 데이터 조회 (수정됨)
 * 
 * 수정: user_data_imports.raw_data → 실제 테이블 직접 조회
 */

export function useRealCustomers() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-customers', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('customers query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

export function useRealPurchases() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-purchases', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products(id, product_name, category, price, cost_price)
        `)
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.warn('purchases query error:', error);
        return [];
      }

      // product 정보 매핑 + price 필드 추가
      return (data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name,
        category: p.product?.category,
        price: p.total_price || p.unit_price || p.product?.price || 0,
        cost_price: p.product?.cost_price,
      }));
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

export function useRealProducts() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-products', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('products query error:', error);
        return [];
      }

      // 필드명 호환성 (product_id, name 추가)
      return (data || []).map((p: any) => ({
        ...p,
        product_id: p.id,
        name: p.product_name,
      }));
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

export function useRealVisits() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-visits', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('visit_date', { ascending: false });

      if (error) {
        console.warn('visits query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

export function useRealWiFiTracking() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-wifi-tracking', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('wifi_tracking query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

export function useRealZones() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-zones', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('wifi_zones')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('wifi_zones query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 퍼널 이벤트 조회 (L2 테이블)
 */
export function useRealFunnelEvents() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-funnel-events', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('funnel_events')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('event_timestamp', { ascending: false });

      if (error) {
        console.warn('funnel_events query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 상품 성과 조회 (L3 테이블)
 */
export function useRealProductPerformance() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-product-performance', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('product_performance_agg')
        .select(`
          *,
          product:products(id, product_name, category, price, stock, cost_price)
        `)
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('revenue', { ascending: false });

      if (error) {
        console.warn('product_performance_agg query error:', error);
        return [];
      }

      // product 정보 매핑
      return (data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name,
        name: p.product?.product_name,
        category: p.product?.category,
        stock: p.product?.stock,
        price: p.product?.price,
        cost_price: p.product?.cost_price,
      }));
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 고객 세그먼트 조회 (L3 테이블)
 */
export function useRealCustomerSegments() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['real-customer-segments', user?.id, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('customer_count', { ascending: false });

      if (error) {
        console.warn('customer_segments_agg query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 일일 KPI 조회 (L3 테이블)
 */
export function useRealDailyKPIs(date?: string) {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['real-daily-kpis', user?.id, selectedStore?.id, orgId, targetDate],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return null;

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .eq('date', targetDate)
        .maybeSingle();

      if (error) {
        console.warn('daily_kpis_agg query error:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 시간대별 메트릭 조회 (L3 테이블)
 */
export function useRealHourlyMetrics(date?: string) {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['real-hourly-metrics', user?.id, selectedStore?.id, orgId, targetDate],
    queryFn: async () => {
      if (!user || !orgId || !selectedStore) return [];

      const { data, error } = await supabase
        .from('hourly_metrics')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .eq('date', targetDate)
        .order('hour', { ascending: true });

      if (error) {
        console.warn('hourly_metrics query error:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && !!orgId && !!selectedStore,
  });
}

/**
 * 전체 데이터 통계 - 실제 데이터 카운트
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
