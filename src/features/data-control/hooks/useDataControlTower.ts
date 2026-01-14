// ============================================================================
// Data Control Tower Hooks
// ============================================================================

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
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
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<DataControlTowerStatus>({
    queryKey: ['data-control-tower', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      // Try RPC first, fallback to direct queries if not available
      try {
        const { data, error } = await supabase
          .rpc('get_data_control_tower_status', {
            p_store_id: storeId,
            p_limit: 20,
          });

        if (error) throw error;
        return data as unknown as DataControlTowerStatus;
      } catch (rpcError) {
        // Fallback: build status from direct queries
        console.warn('RPC not available, using fallback queries:', rpcError);
        return await buildControlTowerStatusFallback(storeId);
      }
    },
    enabled: !!storeId,
    refetchInterval: 30000, // 30초마다 새로고침
  });
}

// Fallback function when RPC is not available
async function buildControlTowerStatusFallback(storeId: string): Promise<DataControlTowerStatus> {
  // 1. Recent imports
  const { data: recentImports } = await supabase
    .from('raw_imports')
    .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 2. Recent ETL runs
  const { data: etlRuns } = await supabase
    .from('etl_runs')
    .select('id, etl_function, status, input_record_count, output_record_count, duration_ms, started_at, completed_at')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false })
    .limit(20);

  // 3. Pipeline stats
  const { count: totalImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: completedImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'completed');

  const { count: failedImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'failed');

  // 4. Data source checks
  // POS 데이터는 transactions 테이블만 카운트 (RPC 함수와 동일하게)
  // purchases 테이블은 API 매핑 대상이 아니므로 제외
  const { count: posCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const totalPosCount = posCount || 0;

  const { count: sensorCount } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // 5. L2/L3 counts
  const { count: l2Count } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: l3Count } = await supabase
    .from('daily_kpis_agg')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Calculate quality score
  const sources = [totalPosCount, sensorCount, customerCount, productCount];
  const availableSources = sources.filter(c => (c || 0) > 0).length;
  const overallScore = Math.round((availableSources / 4) * 100);

  return {
    success: true,
    store_id: storeId,
    quality_score: {
      success: true,
      store_id: storeId,
      overall_score: overallScore,
      confidence_level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      coverage: {
        pos: { available: totalPosCount > 0, record_count: totalPosCount, label: 'POS/매출 데이터' },
        sensor: { available: (sensorCount || 0) > 0, record_count: sensorCount || 0, label: 'NEURALSENSE 센서' },
        crm: { available: (customerCount || 0) > 0, record_count: customerCount || 0, label: 'CRM/고객 데이터' },
        product: { available: (productCount || 0) > 0, record_count: productCount || 0, label: '상품 마스터' },
      },
      warnings: [],
      warning_count: 0,
    },
    data_sources: {
      pos: { name: 'POS', description: '매출/거래 데이터', status: totalPosCount > 0 ? 'active' : 'inactive' },
      sensor: { name: 'NEURALSENSE', description: 'WiFi/BLE 센서', status: (sensorCount || 0) > 0 ? 'active' : 'inactive' },
      crm: { name: 'CRM', description: '고객/CDP 데이터', status: (customerCount || 0) > 0 ? 'active' : 'inactive' },
      product: { name: 'ERP', description: '재고/상품 데이터', status: (productCount || 0) > 0 ? 'active' : 'inactive' },
    },
    recent_imports: (recentImports || []) as unknown as RawImport[],
    recent_etl_runs: (etlRuns || []) as unknown as ETLRun[],
    pipeline_stats: {
      raw_imports: {
        total: totalImports || 0,
        completed: completedImports || 0,
        failed: failedImports || 0,
        pending: (totalImports || 0) - (completedImports || 0) - (failedImports || 0),
      },
      l2_records: l2Count || 0,
      l3_records: l3Count || 0,
    },
    queried_at: new Date().toISOString(),
  };
}

// ============================================================================
// useDataQualityScore - 데이터 품질 점수 조회
// ============================================================================
export function useDataQualityScore(date?: string) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<DataQualityScore>({
    queryKey: ['data-quality-score', storeId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      // Try RPC first, fallback if not available
      try {
        const { data, error } = await supabase
          .rpc('calculate_data_quality_score', {
            p_store_id: storeId,
            p_date: date || new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
        return data as unknown as DataQualityScore;
      } catch (rpcError) {
        console.warn('Quality score RPC not available, using fallback:', rpcError);
        return await buildQualityScoreFallback(storeId);
      }
    },
    enabled: !!storeId,
  });
}

// Fallback quality score calculation
async function buildQualityScoreFallback(storeId: string): Promise<DataQualityScore> {
  // POS 데이터는 transactions 테이블만 카운트 (RPC 함수와 동일하게)
  // purchases 테이블은 API 매핑 대상이 아니므로 제외
  const { count: posCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const totalPosCount = posCount || 0;

  const { count: sensorCount } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const sources = [totalPosCount, sensorCount, customerCount, productCount];
  const availableSources = sources.filter(c => (c || 0) > 0).length;
  const overallScore = Math.round((availableSources / 4) * 100);

  const warnings: Array<{ type: string; source: string; severity: string; message: string }> = [];

  if (totalPosCount === 0) {
    warnings.push({ type: 'missing', source: 'pos', severity: 'high', message: 'POS 데이터가 없습니다.' });
  }
  if (!sensorCount || sensorCount === 0) {
    warnings.push({ type: 'missing', source: 'sensor', severity: 'high', message: 'NEURALSENSE 데이터가 없습니다.' });
  }
  if (!customerCount || customerCount === 0) {
    warnings.push({ type: 'missing', source: 'crm', severity: 'low', message: '고객 데이터가 없습니다.' });
  }
  if (!productCount || productCount === 0) {
    warnings.push({ type: 'missing', source: 'product', severity: 'medium', message: '상품 데이터가 없습니다.' });
  }

  return {
    success: true,
    store_id: storeId,
    overall_score: overallScore,
    confidence_level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
    coverage: {
      pos: { available: totalPosCount > 0, record_count: totalPosCount, label: 'POS/매출 데이터' },
      sensor: { available: (sensorCount || 0) > 0, record_count: sensorCount || 0, label: 'NEURALSENSE 센서' },
      crm: { available: (customerCount || 0) > 0, record_count: customerCount || 0, label: 'CRM/고객 데이터' },
      product: { available: (productCount || 0) > 0, record_count: productCount || 0, label: '상품 마스터' },
    },
    warnings,
    warning_count: warnings.length,
  };
}

// ============================================================================
// useRecentImports - 최근 Import 목록 조회
// ============================================================================
export function useRecentImports(limit: number = 20) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<RawImport[]>({
    queryKey: ['recent-imports', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await (supabase as any)
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
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<ETLRun[]>({
    queryKey: ['etl-history', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await (supabase as any)
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
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['etl-health', storeId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('etl-health', {
          body: {
            store_id: storeId,
            check_type: 'quick',
            time_range_hours: 24,
          },
        });

        if (error) throw error;
        return data;
      } catch (err) {
        // Fallback: return basic health status
        console.warn('ETL health check failed, using fallback:', err);
        return {
          success: true,
          overall_health: 'unknown',
          message: 'ETL 헬스체크 함수가 배포되지 않았습니다.',
          checks: [],
        };
      }
    },
    enabled: !!storeId,
    refetchInterval: 60000, // 1분마다 새로고침
  });
}

// ============================================================================
// useKPILineage - KPI Lineage 조회
// ============================================================================
export function useKPILineage(kpiTable: string, kpiId?: string, date?: string) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<KPILineage | null>({
    queryKey: ['kpi-lineage', kpiTable, kpiId, storeId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      try {
        const { data, error } = await supabase
          .rpc('get_kpi_lineage', {
            p_kpi_table: kpiTable,
            p_kpi_id: kpiId || null,
            p_store_id: storeId,
            p_date: date || null,
          });

        if (error) throw error;
        return data as unknown as KPILineage;
      } catch (rpcError) {
        console.warn('KPI lineage RPC not available, using fallback:', rpcError);
        return buildKPILineageFallback(storeId, kpiTable, kpiId, date);
      }
    },
    enabled: !!storeId && !!kpiTable && (!!kpiId || !!date),
  });
}

// Fallback KPI lineage builder
async function buildKPILineageFallback(
  storeId: string,
  kpiTable: string,
  kpiId?: string,
  date?: string
): Promise<KPILineage | null> {
  // Try to get KPI record
  let kpiRecord = null;

  if (kpiTable === 'daily_kpis_agg') {
    const query = supabase
      .from('daily_kpis_agg')
      .select('*')
      .eq('store_id', storeId);

    if (kpiId) {
      query.eq('id', kpiId);
    } else if (date) {
      query.eq('date', date);
    }

    const { data } = await query.limit(1).single();
    kpiRecord = data;
  }

  if (!kpiRecord) {
    return null;
  }

  // Get related raw imports
  const { data: rawImports } = await supabase
    .from('raw_imports')
    .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    success: true,
    kpi_record: {
      id: kpiRecord.id,
      date: kpiRecord.date,
      store_id: kpiRecord.store_id,
      ...kpiRecord,
    },
    lineage: {
      source_trace: kpiRecord.source_trace || {},
      etl_run: null,
      raw_imports: (rawImports || []) as unknown as RawImport[],
      lineage_path: [
        { layer: 'L3', table: kpiTable, description: '집계 KPI 테이블' },
        { layer: 'L2', tables: ['zone_events', 'line_items'], description: 'Fact 테이블' },
        { layer: 'L1', tables: ['raw_imports'], description: 'Raw 원본 데이터' },
      ],
    },
    metadata: {
      queried_at: new Date().toISOString(),
      kpi_table: kpiTable,
    },
  };
}
