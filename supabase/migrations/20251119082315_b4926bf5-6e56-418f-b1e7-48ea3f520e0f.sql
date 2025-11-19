-- HQ 매장 마스터 테이블
CREATE TABLE IF NOT EXISTS public.hq_store_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hq_store_code TEXT NOT NULL,
  hq_store_name TEXT NOT NULL,
  store_format TEXT,
  region TEXT,
  district TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  opening_date DATE,
  area_sqm NUMERIC,
  status TEXT DEFAULT 'active',
  external_system_id TEXT,
  external_system_name TEXT,
  metadata JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, hq_store_code)
);

-- HQ 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS public.hq_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 매장 매핑 테이블 (HQ 마스터 <-> 로컬 매장)
CREATE TABLE IF NOT EXISTS public.store_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hq_store_id UUID NOT NULL REFERENCES public.hq_store_master(id) ON DELETE CASCADE,
  local_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  mapping_status TEXT DEFAULT 'active',
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT DEFAULT 'hq_to_local',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, hq_store_id, local_store_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hq_store_master_user_id ON public.hq_store_master(user_id);
CREATE INDEX IF NOT EXISTS idx_hq_store_master_code ON public.hq_store_master(user_id, hq_store_code);
CREATE INDEX IF NOT EXISTS idx_hq_sync_logs_user_id ON public.hq_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hq_sync_logs_status ON public.hq_sync_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_store_mappings_user_id ON public.store_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_store_mappings_hq_store ON public.store_mappings(hq_store_id);
CREATE INDEX IF NOT EXISTS idx_store_mappings_local_store ON public.store_mappings(local_store_id);

-- RLS 정책
ALTER TABLE public.hq_store_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_mappings ENABLE ROW LEVEL SECURITY;

-- HQ 매장 마스터 정책
CREATE POLICY "Users can view their own HQ store master"
  ON public.hq_store_master FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HQ store master"
  ON public.hq_store_master FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HQ store master"
  ON public.hq_store_master FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HQ store master"
  ON public.hq_store_master FOR DELETE
  USING (auth.uid() = user_id);

-- HQ 동기화 로그 정책
CREATE POLICY "Users can view their own sync logs"
  ON public.hq_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON public.hq_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 매장 매핑 정책
CREATE POLICY "Users can view their own store mappings"
  ON public.store_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store mappings"
  ON public.store_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store mappings"
  ON public.store_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store mappings"
  ON public.store_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거 생성
CREATE TRIGGER update_hq_store_master_updated_at
  BEFORE UPDATE ON public.hq_store_master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_mappings_updated_at
  BEFORE UPDATE ON public.store_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();