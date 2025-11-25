import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface HQStoreMaster {
  id: string;
  user_id: string;
  hq_store_code: string;
  hq_store_name: string;
  store_format?: string;
  region?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  opening_date?: string;
  area_sqm?: number;
  status: string;
  external_system_id?: string;
  external_system_name?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreMapping {
  id: string;
  user_id: string;
  hq_store_id: string;
  local_store_id: string;
  mapping_status: string;
  sync_enabled: boolean;
  last_synced_at?: string;
  sync_direction: string;
  created_at: string;
  updated_at: string;
}

export interface HQSyncLog {
  id: string;
  user_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_synced: number;
  records_failed: number;
  error_message?: string;
  created_at: string;
}

export function useHQStoreMaster() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hq-store-master', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hq_store_master')
        .select('*')
        .eq('user_id', user.id)
        .order('hq_store_code', { ascending: true });

      if (error) throw error;
      return (data || []) as HQStoreMaster[];
    },
    enabled: !!user,
  });
}

export function useStoreMappings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['store-mappings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('store_mappings')
        .select(`
          *,
          hq_store_master!inner(hq_store_code, hq_store_name, region, district),
          stores!inner(store_code, store_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useHQSyncLogs(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hq-sync-logs', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hq_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as HQSyncLog[];
    },
    enabled: !!user,
  });
}

export function useSyncHQStores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { external_system_id?: string; external_api_url?: string; api_key?: string }) => {
      const { data, error } = await supabase.functions.invoke('sync-hq-stores', {
        body: params || { external_system_id: 'demo' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hq-store-master'] });
      queryClient.invalidateQueries({ queryKey: ['hq-sync-logs'] });
      toast.success('HQ 매장 마스터 동기화가 완료되었습니다');
    },
    onError: (error) => {
      console.error('Error syncing HQ stores:', error);
      toast.error('동기화에 실패했습니다');
    },
  });
}

export function useMapStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { hq_store_id: string; local_store_id: string; sync_enabled?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('map-store', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('매장 매핑이 완료되었습니다');
    },
    onError: (error) => {
      console.error('Error mapping store:', error);
      toast.error('매장 매핑에 실패했습니다');
    },
  });
}
