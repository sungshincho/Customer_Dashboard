-- 1. 3D 모델 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models',
  '3d-models',
  true,
  52428800, -- 50MB
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
);

-- 2. 3D 모델 스토리지 RLS 정책
CREATE POLICY "Anyone can view 3D models"
ON storage.objects FOR SELECT
USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can upload 3D models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '3d-models' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own 3D models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = '3d-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own 3D models"
ON storage.objects FOR DELETE
USING (
  bucket_id = '3d-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. AI 분석 결과 저장 테이블
CREATE TABLE IF NOT EXISTS public.ai_scene_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'visitor', 'heatmap', 'journey', 'inventory', 'layout'
  scene_data JSONB NOT NULL,
  insights JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI 분석 결과 RLS 정책
ALTER TABLE public.ai_scene_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scene analysis"
ON public.ai_scene_analysis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scene analysis"
ON public.ai_scene_analysis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scene analysis"
ON public.ai_scene_analysis FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scene analysis"
ON public.ai_scene_analysis FOR DELETE
USING (auth.uid() = user_id);

-- 5. 온톨로지 테이블 Realtime 활성화
ALTER TABLE public.graph_entities REPLICA IDENTITY FULL;
ALTER TABLE public.graph_relations REPLICA IDENTITY FULL;
ALTER TABLE public.ontology_entity_types REPLICA IDENTITY FULL;

-- 6. 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_ai_scene_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ai_scene_analysis_updated_at
BEFORE UPDATE ON public.ai_scene_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_scene_analysis_updated_at();