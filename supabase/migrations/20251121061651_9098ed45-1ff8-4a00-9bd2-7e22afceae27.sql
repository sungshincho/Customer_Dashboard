-- API 연동 테이블 생성
CREATE TABLE public.api_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rest', 'graphql', 'webhook')),
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  headers JSONB DEFAULT '{}'::jsonb,
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'basic')),
  auth_value TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

-- 사용자별 접근 정책
CREATE POLICY "Users can view their own API connections"
  ON public.api_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API connections"
  ON public.api_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API connections"
  ON public.api_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API connections"
  ON public.api_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- 업데이트 트리거
CREATE TRIGGER update_api_connections_updated_at
  BEFORE UPDATE ON public.api_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 인덱스 추가
CREATE INDEX idx_api_connections_user_id ON public.api_connections(user_id);
CREATE INDEX idx_api_connections_is_active ON public.api_connections(is_active);
