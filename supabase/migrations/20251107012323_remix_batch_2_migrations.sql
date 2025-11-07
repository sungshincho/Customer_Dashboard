
-- Migration: 20251106091743
-- AI 분석 히스토리 테이블 생성
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 히스토리만 조회 가능
CREATE POLICY "Users can view their own analysis history"
ON public.analysis_history
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 히스토리만 생성 가능
CREATE POLICY "Users can create their own analysis history"
ON public.analysis_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 히스토리만 삭제 가능
CREATE POLICY "Users can delete their own analysis history"
ON public.analysis_history
FOR DELETE
USING (auth.uid() = user_id);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON public.analysis_history(created_at DESC);
CREATE INDEX idx_analysis_history_type ON public.analysis_history(analysis_type);

-- Migration: 20251106093952
-- Create table for user data imports
CREATE TABLE public.user_data_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  data_type TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  row_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own imports" 
ON public.user_data_imports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imports" 
ON public.user_data_imports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imports" 
ON public.user_data_imports 
FOR DELETE 
USING (auth.uid() = user_id);
