import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreContextData {
  // 온톨로지 데이터 (3D 정보 포함)
  entities: {
    id: string;
    label: string;
    entityType: string;
    entity_type_name: string;
    model_3d_type: string | null;
    model_3d_url?: string | null;
    dimensions?: any;
    properties: any;
    position?: { x: number; y: number; z: number };
    model_3d_position?: { x: number; y: number; z: number };
    model_3d_rotation?: { x: number; y: number; z: number };
    model_3d_scale?: { x: number; y: number; z: number };
  }[];
  
  // 🔥 관계 데이터 추가
  relations: {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    relation_type_id: string;
    relation_type_name?: string;
    properties: any;
  }[];
  
  // 🔥 방문 데이터 추가
  visits: {
    id: string;
    customer_id: string;
    visit_date: string;
    duration_minutes: number;
    zones_visited: string[];
  }[];
  
  // 🔥 거래 데이터 추가
  transactions: {
    id: string;
    customer_id?: string;
    total_amount: number;
    items?: any[];
    transaction_date: string;
  }[];
  
  // 🔥 일별 매출 데이터 추가
  dailySales: {
    id: string;
    date: string;
    total_revenue: number;
    transaction_count: number;
    avg_transaction_value: number;
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
    areaSqm?: number;
    width?: number;
    depth?: number;
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
          .select('id, store_name, store_code, area_sqm, metadata')
          .eq('id', storeId)
          .single();

        // 온톨로지 엔티티 (3D 정보 포함)
        const { data: entities } = await supabase
          .from('graph_entities')
          .select(`
            id,
            label,
            properties,
            model_3d_position,
            model_3d_rotation,
            model_3d_scale,
            entity_type_id,
            ontology_entity_types (
              name,
              label,
              model_3d_type,
              model_3d_url,
              model_3d_dimensions
            )
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(100);

        // 🔥 관계 데이터 조회
        const { data: relations } = await supabase
          .from('graph_relations')
          .select(`
            id,
            source_entity_id,
            target_entity_id,
            relation_type_id,
            properties,
            ontology_relation_types (
              name,
              label
            )
          `)
          .eq('store_id', storeId)
          .limit(200);

        // 🔥 방문 데이터 조회 (최근 30일)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: visits } = await supabase
          .from('visits')
          .select('id, customer_id, visit_date, duration_minutes, zones_visited')
          .eq('store_id', storeId)
          .gte('visit_date', thirtyDaysAgo.toISOString())
          .order('visit_date', { ascending: false })
          .limit(100);

        // 🔥 거래 데이터 조회 (최근 30일)
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id, customer_id, total_amount, items, transaction_date')
          .eq('store_id', storeId)
          .gte('transaction_date', thirtyDaysAgo.toISOString())
          .order('transaction_date', { ascending: false })
          .limit(100);

        // 🔥 일별 매출 데이터 조회
        const { data: dailySales } = await supabase
          .from('daily_sales')
          .select('id, date, total_revenue, transaction_count, avg_transaction_value')
          .eq('store_id', storeId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(30);

        // 최근 30일 KPI
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

        // 엔티티 매핑 (3D 정보 포함)
        const mappedEntities = (entities || []).map(e => {
          const entityType = e.ontology_entity_types as any;
          return {
            id: e.id,
            label: e.label,
            entityType: entityType?.name || 'unknown',
            entity_type_name: entityType?.name || 'unknown',
            model_3d_type: entityType?.model_3d_type || null,
            model_3d_url: entityType?.model_3d_url || null,
            dimensions: entityType?.model_3d_dimensions || null,
            properties: e.properties || {},
            position: e.model_3d_position ? {
              x: (e.model_3d_position as any).x || 0,
              y: (e.model_3d_position as any).y || 0,
              z: (e.model_3d_position as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_position: e.model_3d_position ? {
              x: (e.model_3d_position as any).x || 0,
              y: (e.model_3d_position as any).y || 0,
              z: (e.model_3d_position as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_rotation: e.model_3d_rotation ? {
              x: (e.model_3d_rotation as any).x || 0,
              y: (e.model_3d_rotation as any).y || 0,
              z: (e.model_3d_rotation as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_scale: e.model_3d_scale ? {
              x: (e.model_3d_scale as any).x || 1,
              y: (e.model_3d_scale as any).y || 1,
              z: (e.model_3d_scale as any).z || 1
            } : { x: 1, y: 1, z: 1 },
          };
        });

        // 가구 엔티티를 앞으로 정렬 (furniture, room, structure 우선)
        const sortedEntities = mappedEntities.sort((a, b) => {
          const priorityTypes = ['furniture', 'room', 'structure', 'building'];
          const aPriority = priorityTypes.includes(a.model_3d_type || '') ? 0 : 1;
          const bPriority = priorityTypes.includes(b.model_3d_type || '') ? 0 : 1;
          return aPriority - bPriority;
        });

        // 🔥 관계 매핑
        const mappedRelations = (relations || []).map(r => {
          const relationType = r.ontology_relation_types as any;
          return {
            id: r.id,
            source_entity_id: r.source_entity_id,
            target_entity_id: r.target_entity_id,
            relation_type_id: r.relation_type_id,
            relation_type_name: relationType?.name || 'unknown',
            properties: r.properties || {}
          };
        });

        // 매장 크기 추출 (metadata에서)
        const storeWidth = store?.metadata?.width || 17.4;
        const storeDepth = store?.metadata?.depth || 16.6;

        console.log('Store context loaded:', {
          entities: sortedEntities.length,
          relations: mappedRelations.length,
          visits: (visits || []).length,
          transactions: (transactions || []).length,
          dailySales: (dailySales || []).length,
          furniture: sortedEntities.filter(e => e.model_3d_type === 'furniture').length,
          products: (productsData || []).length,
        });

        setContextData({
          storeInfo: store ? {
            id: store.id,
            name: store.store_name,
            code: store.store_code,
            areaSqm: store.area_sqm,
            width: storeWidth,
            depth: storeDepth,
            metadata: store.metadata || {}
          } : null,
          
          entities: sortedEntities,
          
          relations: mappedRelations,
          
          visits: (visits || []).map(v => ({
            id: v.id,
            customer_id: v.customer_id,
            visit_date: v.visit_date,
            duration_minutes: v.duration_minutes || 0,
            zones_visited: v.zones_visited || []
          })),
          
          transactions: (transactions || []).map(t => ({
            id: t.id,
            customer_id: t.customer_id,
            total_amount: t.total_amount || 0,
            items: t.items || [],
            transaction_date: t.transaction_date
          })),
          
          dailySales: (dailySales || []).map(d => ({
            id: d.id,
            date: d.date,
            total_revenue: d.total_revenue || 0,
            transaction_count: d.transaction_count || 0,
            avg_transaction_value: d.avg_transaction_value || 0
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
