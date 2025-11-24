-- 1. user_data_imports 테이블에 상태 추적 필드 추가
ALTER TABLE user_data_imports 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS error_details TEXT,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_pause BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_resume BOOLEAN DEFAULT false;

-- 2. 진행상황 실시간 업데이트를 위한 Realtime 활성화
ALTER TABLE user_data_imports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE user_data_imports;

-- 3. 매핑 캐시 테이블 생성 (동일한 파일 타입에 대한 매핑 재사용)
CREATE TABLE IF NOT EXISTS ontology_mapping_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  file_name_pattern TEXT NOT NULL,
  entity_mappings JSONB NOT NULL,
  relation_mappings JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 매핑 캐시 인덱스
CREATE INDEX IF NOT EXISTS idx_mapping_cache_user_type 
ON ontology_mapping_cache(user_id, data_type);

CREATE INDEX IF NOT EXISTS idx_mapping_cache_pattern 
ON ontology_mapping_cache(file_name_pattern);

-- 5. 매핑 캐시 RLS 정책
ALTER TABLE ontology_mapping_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mapping cache"
ON ontology_mapping_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mapping cache"
ON ontology_mapping_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mapping cache"
ON ontology_mapping_cache FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mapping cache"
ON ontology_mapping_cache FOR DELETE
USING (auth.uid() = user_id);

-- 6. user_data_imports에 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_user_data_imports_status 
ON user_data_imports(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_data_imports_store 
ON user_data_imports(store_id, status);

-- 7. 업로드 세션 테이블 (병렬 업로드 추적)
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  total_files INTEGER NOT NULL DEFAULT 0,
  completed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_user 
ON upload_sessions(user_id, status);

ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own upload sessions"
ON upload_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upload sessions"
ON upload_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload sessions"
ON upload_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- 8. user_data_imports에 session_id 추가
ALTER TABLE user_data_imports 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL;