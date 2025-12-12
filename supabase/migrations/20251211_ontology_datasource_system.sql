-- ============================================================================
-- 온톨로지-데이터소스-AI 추론 시스템 스키마
-- 버전: 1.0
-- 작성일: 2025-12-11
-- ============================================================================

-- 1. 데이터소스 정의 테이블
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pos', 'wifi', 'camera', 'sensor', 'crm', 'inventory', 'external', 'manual')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'syncing')),
  connection_config JSONB NOT NULL DEFAULT '{}',
  schema_definition JSONB,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  record_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 데이터소스 테이블 정의
CREATE TABLE IF NOT EXISTS data_source_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  display_name TEXT,
  columns JSONB NOT NULL DEFAULT '[]',
  row_count BIGINT DEFAULT 0,
  sample_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_source_id, table_name)
);

-- 3. 엔티티 매핑 정의
CREATE TABLE IF NOT EXISTS ontology_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  filter_condition TEXT,
  target_entity_type_id UUID NOT NULL REFERENCES ontology_entity_types(id),
  property_mappings JSONB NOT NULL DEFAULT '[]',
  label_template TEXT NOT NULL DEFAULT '${id}',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 관계 매핑 정의
CREATE TABLE IF NOT EXISTS ontology_relation_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  target_relation_type_id UUID NOT NULL REFERENCES ontology_relation_types(id),
  source_entity_resolver JSONB NOT NULL,
  target_entity_resolver JSONB NOT NULL,
  property_mappings JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 리테일 개념 정의
CREATE TABLE IF NOT EXISTS retail_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('behavior', 'metric', 'pattern', 'rule', 'kpi')),
  description TEXT,
  involved_entity_types TEXT[] DEFAULT '{}',
  involved_relation_types TEXT[] DEFAULT '{}',
  computation JSONB NOT NULL,
  ai_context JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 6. 개념 계산 결과 캐시
CREATE TABLE IF NOT EXISTS retail_concept_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES retail_concepts(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  value JSONB NOT NULL,
  parameters JSONB,
  valid_until TIMESTAMPTZ,
  UNIQUE(concept_id, store_id, computed_at)
);

-- 7. 동기화 로그
CREATE TABLE IF NOT EXISTS data_source_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  entities_created INT DEFAULT 0,
  entities_updated INT DEFAULT 0,
  relations_created INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  triggered_by TEXT
);

-- 8. AI 추론 결과 테이블 (retail-ai-inference에서 사용)
CREATE TABLE IF NOT EXISTS ai_inference_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  inference_type TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 인덱스
CREATE INDEX IF NOT EXISTS idx_data_sources_user ON data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_store ON data_sources(store_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_retail_concepts_category ON retail_concepts(category);
CREATE INDEX IF NOT EXISTS idx_retail_concepts_system ON retail_concepts(is_system);
CREATE INDEX IF NOT EXISTS idx_concept_values_store ON retail_concept_values(store_id);
CREATE INDEX IF NOT EXISTS idx_concept_values_concept ON retail_concept_values(concept_id);
CREATE INDEX IF NOT EXISTS idx_ai_inference_results_store ON ai_inference_results(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_inference_results_type ON ai_inference_results(inference_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON data_source_sync_logs(data_source_id);

-- 10. RLS 활성화
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_relation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_concept_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inference_results ENABLE ROW LEVEL SECURITY;

-- 11. RLS 정책
-- data_sources
CREATE POLICY "Users can manage own data sources" ON data_sources
  FOR ALL USING (auth.uid() = user_id);

-- data_source_tables
CREATE POLICY "Users can view own data source tables" ON data_source_tables
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own data source tables" ON data_source_tables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

-- ontology_entity_mappings
CREATE POLICY "Users can manage own entity mappings" ON ontology_entity_mappings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

-- ontology_relation_mappings
CREATE POLICY "Users can manage own relation mappings" ON ontology_relation_mappings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

-- retail_concepts
CREATE POLICY "Users can view system concepts and own concepts" ON retail_concepts
  FOR SELECT USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own concepts" ON retail_concepts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own concepts" ON retail_concepts
  FOR UPDATE USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own concepts" ON retail_concepts
  FOR DELETE USING (user_id = auth.uid() AND is_system = false);

-- retail_concept_values
CREATE POLICY "Users can view own concept values" ON retail_concept_values
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own concept values" ON retail_concept_values
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.user_id = auth.uid())
  );

-- data_source_sync_logs
CREATE POLICY "Users can view own sync logs" ON data_source_sync_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

CREATE POLICY "Users can create sync logs" ON data_source_sync_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = data_source_id AND ds.user_id = auth.uid())
  );

-- ai_inference_results
CREATE POLICY "Users can view own inference results" ON ai_inference_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can create inference results" ON ai_inference_results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.user_id = auth.uid())
  );

-- 12. updated_at 트리거 함수 (존재하지 않을 경우만 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. 트리거 생성
DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ontology_entity_mappings_updated_at ON ontology_entity_mappings;
CREATE TRIGGER update_ontology_entity_mappings_updated_at
  BEFORE UPDATE ON ontology_entity_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_retail_concepts_updated_at ON retail_concepts;
CREATE TRIGGER update_retail_concepts_updated_at
  BEFORE UPDATE ON retail_concepts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
