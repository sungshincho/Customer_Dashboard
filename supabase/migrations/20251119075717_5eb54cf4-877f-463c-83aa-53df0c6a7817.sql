-- Overview 섹션을 위한 백엔드 테이블 생성

-- 1. 대시보드 KPI 집계 테이블
CREATE TABLE IF NOT EXISTS public.dashboard_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- 전사 KPI
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  sales_per_sqm DECIMAL(10,2) DEFAULT 0,
  labor_hours DECIMAL(10,2) DEFAULT 0,
  
  -- 퍼널 메트릭
  funnel_entry INTEGER DEFAULT 0,
  funnel_browse INTEGER DEFAULT 0,
  funnel_fitting INTEGER DEFAULT 0,
  funnel_purchase INTEGER DEFAULT 0,
  funnel_return INTEGER DEFAULT 0,
  
  -- 컨텍스트 정보 (날씨, 이벤트 등)
  weather_condition TEXT,
  is_holiday BOOLEAN DEFAULT FALSE,
  special_event TEXT,
  
  -- 외부 경제 지표
  consumer_sentiment_index DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. AI 추천 액션 테이블
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  recommendation_type TEXT NOT NULL, -- 'action', 'alert', 'insight'
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- 액션 정보
  action_category TEXT, -- 'inventory', 'layout', 'pricing', 'staffing'
  expected_impact JSONB, -- { "revenue_increase": 12.5, "cvr_increase": 2.3 }
  
  -- 근거 데이터
  data_source TEXT, -- 'analysis', 'simulation'
  evidence JSONB,
  
  -- 상태 관리
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
  is_displayed BOOLEAN DEFAULT TRUE,
  displayed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. 퍼널 상세 메트릭 테이블
CREATE TABLE IF NOT EXISTS public.funnel_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER, -- 시간대별 분석용 (0-23)
  
  -- 퍼널 단계
  stage TEXT NOT NULL, -- 'entry', 'browse', 'fitting', 'purchase', 'return'
  count INTEGER NOT NULL,
  duration_seconds INTEGER, -- 해당 단계 평균 체류시간
  
  -- 세그먼트
  customer_segment TEXT, -- 'new', 'returning', 'vip'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_dashboard_kpis_user_date ON public.dashboard_kpis(user_id, date DESC);
CREATE INDEX idx_dashboard_kpis_store_date ON public.dashboard_kpis(store_id, date DESC);

CREATE INDEX idx_ai_recommendations_user_status ON public.ai_recommendations(user_id, status, priority);
CREATE INDEX idx_ai_recommendations_store_created ON public.ai_recommendations(store_id, created_at DESC);
CREATE INDEX idx_ai_recommendations_displayed ON public.ai_recommendations(is_displayed, displayed_at DESC) WHERE is_displayed = TRUE;

CREATE INDEX idx_funnel_metrics_user_date ON public.funnel_metrics(user_id, date DESC);
CREATE INDEX idx_funnel_metrics_store_stage ON public.funnel_metrics(store_id, stage, date DESC);

-- RLS 정책 활성화
ALTER TABLE public.dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view their own dashboard KPIs"
  ON public.dashboard_kpis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard KPIs"
  ON public.dashboard_kpis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard KPIs"
  ON public.dashboard_kpis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard KPIs"
  ON public.dashboard_kpis FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI recommendations"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI recommendations"
  ON public.ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI recommendations"
  ON public.ai_recommendations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own funnel metrics"
  ON public.funnel_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel metrics"
  ON public.funnel_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 트리거 생성
CREATE TRIGGER update_dashboard_kpis_updated_at
  BEFORE UPDATE ON public.dashboard_kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();