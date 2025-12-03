import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreContextData {
  // 온톨로지 데이터
  entities: {
    id: string;
    label: string;
    entityType: string;
    properties: any;
    position?: { x: number; y: number; z: number };
  }[];
  
  // KPI 데이터
  recentKpis: {
    date: string;
    totalVisits: number;
    totalRevenue: number;
    conversionRate: number;
    salesPerSqm: number;
  }[];
  
  // 재고 데이터
  inventory: {
    productSku: string;
    productName: string;
    currentStock: number;
    optimalStock: number;
    weeklyDemand: number;
  }[];
  
  // 상품 데이터
  products: {
    sku: string;
    name: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
  }[];
  
  // 매장 기본 정보
  storeInfo: {
    id: string;
    name: string;
    code: string;
    metadata: any;
  } | null;
}

export function useStoreContext(storeId: string | undefined) {
  const [contextData, setContextData] = useState<StoreContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) {
      setContextData(null);
      return;
    }

    const fetchStoreContext = async () => {
      setLoading(true);
      setError(null);

      try {
        // 매장 기본 정보
        const { data: store } = await supabase
          .from('stores')
          .select('id, store_name, store_code, metadata')
          .eq('id', storeId)
          .single();

        // 온톨로지 엔티티 (매장과 연결된)
        const { data: entities } = await supabase
          .from('graph_entities')
          .select(`
            id,
            label,
            properties,
            model_3d_position,
            entity_type_id,
            ontology_entity_types (
              name,
              label,
              model_3d_type
            )
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(50);

        // 최근 30일 KPI
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: kpis } = await supabase
          .from('dashboard_kpis')
          .select('date, total_visits, total_revenue, conversion_rate, sales_per_sqm')
          .eq('store_id', storeId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        // 재고 정보
        const { data: inventoryData } = await supabase
          .from('inventory_levels')
          .select(`
            current_stock,
            optimal_stock,
            minimum_stock,
            weekly_demand,
            products (
              sku,
              name
            )
          `)
          .order('last_updated', { ascending: false })
          .limit(100);

        // 상품 정보
        const { data: productsData } = await supabase
          .from('products')
          .select('sku, product_name, category, cost_price, price')
          .order('created_at', { ascending: false })
          .limit(100);

        setContextData({
          storeInfo: store ? {
            id: store.id,
            name: store.store_name,
            code: store.store_code,
            metadata: store.metadata || {}
          } : null,
          
          entities: (entities || []).map(e => ({
            id: e.id,
            label: e.label,
            entityType: (e.ontology_entity_types as any)?.name || 'unknown',
            properties: e.properties || {},
            position: e.model_3d_position ? {
              x: (e.model_3d_position as any).x || 0,
              y: (e.model_3d_position as any).y || 0,
              z: (e.model_3d_position as any).z || 0
            } : undefined
          })),
          
          recentKpis: (kpis || []).map(k => ({
            date: k.date,
            totalVisits: k.total_visits || 0,
            totalRevenue: k.total_revenue || 0,
            conversionRate: k.conversion_rate || 0,
            salesPerSqm: k.sales_per_sqm || 0
          })),
          
          inventory: (inventoryData || []).map(i => ({
            productSku: (i.products as any)?.sku || '',
            productName: (i.products as any)?.name || '',
            currentStock: i.current_stock || 0,
            optimalStock: i.optimal_stock || 0,
            weeklyDemand: i.weekly_demand || 0
          })),
          
          products: (productsData || []).map(p => ({
            sku: p.sku,
            name: p.product_name,
            category: p.category || '',
            costPrice: Number(p.cost_price) || 0,
            sellingPrice: Number(p.price) || 0
          }))
        });

      } catch (e) {
        console.error('Store context fetch error:', e);
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreContext();
  }, [storeId]);

  return { contextData, loading, error };
}
