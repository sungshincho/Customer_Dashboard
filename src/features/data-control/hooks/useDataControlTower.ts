// ============================================================================
// Data Control Tower Hooks
// ============================================================================

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import type {
  DataControlTowerStatus,
  DataQualityScore,
  RawImport,
  ETLRun,
  KPILineage,
} from '../types';

// ============================================================================
// useDataControlTowerStatus - Control Tower 전체 상태 조회
// ============================================================================
export function useDataControlTowerStatus() {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery<DataControlTowerStatus>({
    queryKey: ['data-control-tower', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .rpc('get_data_control_tower_status', {
          p_store_id: storeId,
          p_limit: 20,
        });

      if (error) throw error;
      return data as DataControlTowerStatus;
    },
    enabled: !!storeId,
    refetchInterval: 30000, // 30초마다 새로고침
  });
}

// ============================================================================
// useDataQualityScore - 데이터 품질 점수 조회
// ============================================================================
export function useDataQualityScore(date?: string) {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery<DataQualityScore>({
    queryKey: ['data-quality-score', storeId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .rpc('calculate_data_quality_score', {
          p_store_id: storeId,
          p_date: date || new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
      return data as DataQualityScore;
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// useRecentImports - 최근 Import 목록 조회
// ============================================================================
export function useRecentImports(limit: number = 20) {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery<RawImport[]>({
    queryKey: ['recent-imports', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('raw_imports')
        .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RawImport[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// useETLHistory - ETL 실행 이력 조회
// ============================================================================
export function useETLHistory(limit: number = 20) {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery<ETLRun[]>({
    queryKey: ['etl-history', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('etl_runs')
        .select('id, etl_function, status, input_record_count, output_record_count, duration_ms, started_at, completed_at')
        .eq('store_id', storeId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ETLRun[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// useReplayImport - Import 재처리
// ============================================================================
export function useReplayImport() {
  const queryClient = useQueryClient();
  const [isReplaying, setIsReplaying] = useState(false);

  const replayMutation = useMutation({
    mutationFn: async ({ rawImportId, force = false }: { rawImportId: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('replay-import', {
        body: {
          raw_import_id: rawImportId,
          force,
        },
      });

      if (error) throw error;
      return data;
    },
    onMutate: () => setIsReplaying(true),
    onSettled: () => {
      setIsReplaying(false);
      // Refetch related queries
      queryClient.invalidateQueries({ queryKey: ['recent-imports'] });
      queryClient.invalidateQueries({ queryKey: ['etl-history'] });
      queryClient.invalidateQueries({ queryKey: ['data-control-tower'] });
    },
  });

  const replay = useCallback(
    (rawImportId: string, force?: boolean) => {
      return replayMutation.mutateAsync({ rawImportId, force });
    },
    [replayMutation]
  );

  return {
    replay,
    isReplaying,
    error: replayMutation.error,
  };
}

// ============================================================================
// useETLHealth - ETL 파이프라인 헬스체크
// ============================================================================
export function useETLHealth() {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['etl-health', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('etl-health', {
        body: {
          store_id: storeId,
          check_type: 'quick',
          time_range_hours: 24,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
    refetchInterval: 60000, // 1분마다 새로고침
  });
}

// ============================================================================
// useKPILineage - KPI Lineage 조회
// ============================================================================
export function useKPILineage(kpiTable: string, kpiId?: string, date?: string) {
  const { selectedStore } = useStore();
  const storeId = selectedStore?.id;

  return useQuery<KPILineage>({
    queryKey: ['kpi-lineage', kpiTable, kpiId, storeId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      const { data, error } = await supabase
        .rpc('get_kpi_lineage', {
          p_kpi_table: kpiTable,
          p_kpi_id: kpiId || null,
          p_store_id: storeId,
          p_date: date || null,
        });

      if (error) throw error;
      return data as KPILineage;
    },
    enabled: !!storeId && !!kpiTable && (!!kpiId || !!date),
  });
}
