-- 1. graph_entities 테이블에 store_id 컬럼 추가
ALTER TABLE graph_entities 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 2. graph_relations 테이블에 store_id 컬럼 추가
ALTER TABLE graph_relations 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 3. ai_scene_analysis 테이블에 store_id 컬럼 추가
ALTER TABLE ai_scene_analysis 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 4. user_data_imports 테이블에 store_id 컬럼 추가
ALTER TABLE user_data_imports 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 5. analysis_history 테이블에 store_id 컬럼 추가
ALTER TABLE analysis_history 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_graph_entities_store_id ON graph_entities(store_id);
CREATE INDEX idx_graph_relations_store_id ON graph_relations(store_id);
CREATE INDEX idx_ai_scene_analysis_store_id ON ai_scene_analysis(store_id);
CREATE INDEX idx_user_data_imports_store_id ON user_data_imports(store_id);
CREATE INDEX idx_analysis_history_store_id ON analysis_history(store_id);

-- 7. RLS 정책 업데이트 - graph_entities
DROP POLICY IF EXISTS "Users can view their own entities" ON graph_entities;
DROP POLICY IF EXISTS "Users can create their own entities" ON graph_entities;
DROP POLICY IF EXISTS "Users can update their own entities" ON graph_entities;
DROP POLICY IF EXISTS "Users can delete their own entities" ON graph_entities;

CREATE POLICY "Users can view their store entities" 
ON graph_entities FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_entities.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store entities" 
ON graph_entities FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_entities.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their store entities" 
ON graph_entities FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_entities.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store entities" 
ON graph_entities FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_entities.store_id AND stores.user_id = auth.uid()
  ))
);

-- 8. RLS 정책 업데이트 - graph_relations
DROP POLICY IF EXISTS "Users can view their own relations" ON graph_relations;
DROP POLICY IF EXISTS "Users can create their own relations" ON graph_relations;
DROP POLICY IF EXISTS "Users can update their own relations" ON graph_relations;
DROP POLICY IF EXISTS "Users can delete their own relations" ON graph_relations;

CREATE POLICY "Users can view their store relations" 
ON graph_relations FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_relations.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store relations" 
ON graph_relations FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_relations.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their store relations" 
ON graph_relations FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_relations.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store relations" 
ON graph_relations FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = graph_relations.store_id AND stores.user_id = auth.uid()
  ))
);

-- 9. RLS 정책 업데이트 - ai_scene_analysis
DROP POLICY IF EXISTS "Users can view their own scene analysis" ON ai_scene_analysis;
DROP POLICY IF EXISTS "Users can create their own scene analysis" ON ai_scene_analysis;
DROP POLICY IF EXISTS "Users can update their own scene analysis" ON ai_scene_analysis;
DROP POLICY IF EXISTS "Users can delete their own scene analysis" ON ai_scene_analysis;

CREATE POLICY "Users can view their store scene analysis" 
ON ai_scene_analysis FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store scene analysis" 
ON ai_scene_analysis FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their store scene analysis" 
ON ai_scene_analysis FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store scene analysis" 
ON ai_scene_analysis FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid()
  ))
);

-- 10. RLS 정책 업데이트 - user_data_imports
DROP POLICY IF EXISTS "Users can view their own imports" ON user_data_imports;
DROP POLICY IF EXISTS "Users can create their own imports" ON user_data_imports;
DROP POLICY IF EXISTS "Users can delete their own imports" ON user_data_imports;

CREATE POLICY "Users can view their store imports" 
ON user_data_imports FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = user_data_imports.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store imports" 
ON user_data_imports FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = user_data_imports.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store imports" 
ON user_data_imports FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = user_data_imports.store_id AND stores.user_id = auth.uid()
  ))
);

-- 11. RLS 정책 업데이트 - analysis_history
DROP POLICY IF EXISTS "Users can view their own analysis history" ON analysis_history;
DROP POLICY IF EXISTS "Users can create their own analysis history" ON analysis_history;
DROP POLICY IF EXISTS "Users can delete their own analysis history" ON analysis_history;

CREATE POLICY "Users can view their store analysis history" 
ON analysis_history FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analysis_history.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store analysis history" 
ON analysis_history FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analysis_history.store_id AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store analysis history" 
ON analysis_history FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analysis_history.store_id AND stores.user_id = auth.uid()
  ))
);

-- 12. 매장별 스토리지 폴더 자동 생성 함수
CREATE OR REPLACE FUNCTION create_store_storage_folders()
RETURNS TRIGGER AS $$
BEGIN
  -- 스토리지 폴더 구조는 애플리케이션 레벨에서 관리
  -- 이 트리거는 로깅 목적
  RAISE NOTICE 'Store created: % (ID: %). Storage path: %/%', NEW.store_name, NEW.id, NEW.user_id, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. 매장 생성 시 트리거
DROP TRIGGER IF EXISTS on_store_created ON stores;
CREATE TRIGGER on_store_created
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_store_storage_folders();
