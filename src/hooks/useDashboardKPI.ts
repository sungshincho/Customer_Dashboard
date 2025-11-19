import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DashboardKPI {
  id: string;
  date: string;
  total_revenue: number;
  total_visits: number;
  total_purchases: number;
  conversion_rate: number;
  sales_per_sqm: number;
  labor_hours: number;
  funnel_entry: number;
  funnel_browse: number;
  funnel_fitting: number;
  funnel_purchase: number;
  funnel_return: number;
  weather_condition?: string;
  is_holiday: boolean;
  special_event?: string;
  consumer_sentiment_index?: number;
}

export function useDashboardKPI(storeId?: string, date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpi', storeId, date],
    queryFn: async () => {
      if (!user || !storeId) return null;

      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .maybeSingle();

      if (error) throw error;
      return data as DashboardKPI | null;
    },
    enabled: !!user && !!storeId,
  });
}

export function useLatestKPIs(storeId?: string, limit: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis-latest', storeId, limit],
    queryFn: async () => {
      if (!user || !storeId) return [];

      const { data, error } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as DashboardKPI[];
    },
    enabled: !!user && !!storeId,
  });
}

export function useKPIsByDateRange(storeId?: string, startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis-range', storeId, startDate, endDate],
    queryFn: async () => {
      if (!user || !storeId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as DashboardKPI[];
    },
    enabled: !!user && !!storeId && !!startDate && !!endDate,
  });
}
