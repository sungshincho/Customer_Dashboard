-- 날씨 데이터 테이블
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER,
  temperature NUMERIC,
  weather_condition TEXT, -- sunny, rainy, cloudy, snowy 등
  precipitation NUMERIC, -- 강수량 (mm)
  humidity NUMERIC, -- 습도 (%)
  wind_speed NUMERIC, -- 풍속 (m/s)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id, date, hour)
);

-- 공휴일/이벤트 데이터 테이블
CREATE TABLE IF NOT EXISTS public.holidays_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL, -- holiday, festival, promotion, local_event 등
  event_name TEXT NOT NULL,
  impact_level TEXT, -- high, medium, low
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 경제지표 데이터 테이블
CREATE TABLE IF NOT EXISTS public.economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  region TEXT, -- 지역 (전국, 서울, 경기 등)
  indicator_type TEXT NOT NULL, -- consumer_sentiment, retail_sales, unemployment 등
  indicator_value NUMERIC NOT NULL,
  unit TEXT, -- index, percentage, currency 등
  source TEXT, -- 데이터 출처
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, region, indicator_type)
);

-- 상권/지역 데이터 테이블
CREATE TABLE IF NOT EXISTS public.regional_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  data_type TEXT NOT NULL, -- floating_population, competitor_count, foot_traffic 등
  value NUMERIC NOT NULL,
  comparison_value NUMERIC, -- 전월 또는 전년 대비 값
  unit TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_data ENABLE ROW LEVEL SECURITY;

-- weather_data 정책
CREATE POLICY "Users can view their own weather data"
  ON public.weather_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weather data"
  ON public.weather_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weather data"
  ON public.weather_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weather data"
  ON public.weather_data FOR DELETE
  USING (auth.uid() = user_id);

-- holidays_events 정책
CREATE POLICY "Users can view their own holidays/events"
  ON public.holidays_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holidays/events"
  ON public.holidays_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holidays/events"
  ON public.holidays_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holidays/events"
  ON public.holidays_events FOR DELETE
  USING (auth.uid() = user_id);

-- economic_indicators 정책
CREATE POLICY "Users can view their own economic indicators"
  ON public.economic_indicators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own economic indicators"
  ON public.economic_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own economic indicators"
  ON public.economic_indicators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own economic indicators"
  ON public.economic_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- regional_data 정책
CREATE POLICY "Users can view their own regional data"
  ON public.regional_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own regional data"
  ON public.regional_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own regional data"
  ON public.regional_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own regional data"
  ON public.regional_data FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_weather_data_lookup 
  ON public.weather_data(user_id, store_id, date);

CREATE INDEX IF NOT EXISTS idx_holidays_events_lookup 
  ON public.holidays_events(user_id, store_id, date);

CREATE INDEX IF NOT EXISTS idx_economic_indicators_lookup 
  ON public.economic_indicators(user_id, date, region);

CREATE INDEX IF NOT EXISTS idx_regional_data_lookup 
  ON public.regional_data(user_id, store_id, date);

-- updated_at 트리거
CREATE TRIGGER update_weather_data_updated_at
  BEFORE UPDATE ON public.weather_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_events_updated_at
  BEFORE UPDATE ON public.holidays_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_economic_indicators_updated_at
  BEFORE UPDATE ON public.economic_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regional_data_updated_at
  BEFORE UPDATE ON public.regional_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();