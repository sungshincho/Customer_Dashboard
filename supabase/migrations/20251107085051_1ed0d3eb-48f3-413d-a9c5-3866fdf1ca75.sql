-- 온톨로지 엔티티 타입 테이블
CREATE TABLE public.ontology_entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  properties JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 온톨로지 관계 타입 테이블
CREATE TABLE public.ontology_relation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  source_entity_type TEXT NOT NULL,
  target_entity_type TEXT NOT NULL,
  directionality TEXT DEFAULT 'directed' CHECK (directionality IN ('directed', 'undirected')),
  properties JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 온톨로지 스키마 버전 테이블
CREATE TABLE public.ontology_schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  schema_data JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, version_number)
);

-- RLS 정책 활성화
ALTER TABLE public.ontology_entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_relation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_schema_versions ENABLE ROW LEVEL SECURITY;

-- 엔티티 타입 RLS 정책
CREATE POLICY "Users can view their own entity types"
  ON public.ontology_entity_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entity types"
  ON public.ontology_entity_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entity types"
  ON public.ontology_entity_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entity types"
  ON public.ontology_entity_types FOR DELETE
  USING (auth.uid() = user_id);

-- 관계 타입 RLS 정책
CREATE POLICY "Users can view their own relation types"
  ON public.ontology_relation_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relation types"
  ON public.ontology_relation_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relation types"
  ON public.ontology_relation_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relation types"
  ON public.ontology_relation_types FOR DELETE
  USING (auth.uid() = user_id);

-- 스키마 버전 RLS 정책
CREATE POLICY "Users can view their own schema versions"
  ON public.ontology_schema_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schema versions"
  ON public.ontology_schema_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_ontology_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entity_types_updated_at
  BEFORE UPDATE ON public.ontology_entity_types
  FOR EACH ROW EXECUTE FUNCTION update_ontology_updated_at();

CREATE TRIGGER update_relation_types_updated_at
  BEFORE UPDATE ON public.ontology_relation_types
  FOR EACH ROW EXECUTE FUNCTION update_ontology_updated_at();

-- 기본 엔티티 타입 샘플 (선택사항)
-- INSERT INTO public.ontology_entity_types (user_id, name, label, description, color, icon) VALUES
-- (auth.uid(), 'Customer', '고객', '구매 고객', '#3b82f6', 'User'),
-- (auth.uid(), 'Product', '제품', '판매 제품', '#10b981', 'Package'),
-- (auth.uid(), 'Store', '매장', '판매 매장', '#f59e0b', 'Store');