// ============================================================================
// Data Control Tower Types
// ============================================================================

export interface DataSourceStatus {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  last_sync: string | null;
  record_count?: number;
}

export interface DataSourceCoverage {
  available: boolean;
  record_count: number;
  completeness?: number;
  label: string;
}

export interface DataQualityScore {
  success: boolean;
  store_id: string;
  store_name?: string;
  date?: string;
  overall_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  coverage: {
    pos: DataSourceCoverage;
    sensor: DataSourceCoverage;
    crm: DataSourceCoverage;
    product: DataSourceCoverage;
    zone?: DataSourceCoverage;
    raw_imports?: {
      total_count: number;
      completed_count: number;
      failed_count: number;
      pending_count: number;
      latest_import: string | null;
    };
  };
  warnings: DataWarning[] | Array<{ type: string; source: string; severity: string; message: string }>;
  warning_count: number;
  calculated_at?: string;
}

export interface DataWarning {
  type: 'missing' | 'stale' | 'anomaly';
  source: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  affected_metrics: string[];
}

export interface RawImport {
  id: string;
  source_type: string;
  source_name: string | null;
  data_type: string | null;
  row_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ETLRun {
  id: string;
  etl_function: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  input_record_count: number;
  output_record_count: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface PipelineStats {
  raw_imports: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  etl_runs?: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  l2_records: number;
  l3_records: number;
}

export interface DataControlTowerStatus {
  success: boolean;
  store_id: string;
  quality_score: DataQualityScore;
  data_sources: Record<string, DataSourceStatus>;
  recent_imports: RawImport[];
  recent_etl_runs: ETLRun[];
  pipeline_stats: PipelineStats;
  queried_at: string;
}

export interface KPILineage {
  success: boolean;
  kpi_record: {
    id: string;
    date: string;
    store_id: string;
    [key: string]: any;
  };
  lineage: {
    source_trace: {
      raw_import_ids?: string[];
      source_tables?: string[];
      etl_run_id?: string;
      calculated_at?: string;
    };
    etl_run: ETLRun | null;
    raw_imports: RawImport[];
    lineage_path: {
      layer: string;
      table?: string;
      tables?: string[];
      description: string;
    }[];
  };
  metadata: {
    queried_at: string;
    kpi_table: string;
  };
}
