-- ============================================================================
-- 20260115100001_fix_data_category_constraint.sql
-- data_category CHECK 제약조건 수정 및 컨텍스트 데이터 소스 레코드 삽입
-- ============================================================================

-- 1. 기존 CHECK 제약조건 삭제 및 새 제약조건 추가
-- api_connections 테이블의 data_category에 'weather', 'holidays' 추가
DO $$
BEGIN
  -- 기존 CHECK 제약조건 삭제 (있으면)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'api_connections_data_category_check'
    AND table_name = 'api_connections'
  ) THEN
    ALTER TABLE api_connections DROP CONSTRAINT api_connections_data_category_check;
  END IF;

  -- 새 CHECK 제약조건 추가 (weather, holidays 포함)
  ALTER TABLE api_connections
    ADD CONSTRAINT api_connections_data_category_check
    CHECK (data_category IN ('pos', 'crm', 'erp', 'ecommerce', 'analytics', 'sensor', 'custom', 'weather', 'holidays'));

  RAISE NOTICE 'api_connections data_category CHECK 제약조건 업데이트 완료';
END $$;

-- 2. 컨텍스트 데이터 소스 연결 레코드 삽입
-- 날씨 API 연결 (OpenWeatherMap)
INSERT INTO api_connections (
  id,
  org_id,
  store_id,
  name,
  provider,
  api_type,
  base_url,
  status,
  is_active,
  data_category,
  connection_category,
  is_system_managed,
  display_order,
  icon_name,
  description,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.org_id,
  s.id,
  '날씨 데이터 (OpenWeatherMap)',
  'openweathermap',
  'rest',
  'https://api.openweathermap.org/data/2.5',
  'active',
  true,
  'weather',
  'context',
  true,
  10,
  'cloud-sun',
  '실시간 날씨 정보를 수집하여 매장 운영 분석에 활용합니다.',
  NOW(),
  NOW()
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM api_connections ac
  WHERE ac.store_id = s.id
  AND ac.data_category = 'weather'
  AND ac.connection_category = 'context'
);

-- 공휴일/이벤트 API 연결 (공공데이터포털)
INSERT INTO api_connections (
  id,
  org_id,
  store_id,
  name,
  provider,
  api_type,
  base_url,
  status,
  is_active,
  data_category,
  connection_category,
  is_system_managed,
  display_order,
  icon_name,
  description,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.org_id,
  s.id,
  '공휴일/이벤트 (공공데이터포털)',
  'data-go-kr',
  'rest',
  'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService',
  'active',
  true,
  'holidays',
  'context',
  true,
  11,
  'calendar',
  '공휴일 및 특별 이벤트 정보를 수집하여 수요 예측에 활용합니다.',
  NOW(),
  NOW()
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM api_connections ac
  WHERE ac.store_id = s.id
  AND ac.data_category = 'holidays'
  AND ac.connection_category = 'context'
);

-- 3. 삽입된 레코드 수 확인
DO $$
DECLARE
  weather_count integer;
  holidays_count integer;
BEGIN
  SELECT COUNT(*) INTO weather_count FROM api_connections WHERE data_category = 'weather';
  SELECT COUNT(*) INTO holidays_count FROM api_connections WHERE data_category = 'holidays';

  RAISE NOTICE '컨텍스트 데이터 소스 레코드 삽입 완료: 날씨=%건, 공휴일=%건', weather_count, holidays_count;
END $$;

-- 4. ensure_system_context_connections RPC 함수도 수정 (data_category 사용)
CREATE OR REPLACE FUNCTION ensure_system_context_connections(
  p_org_id uuid,
  p_store_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weather_id uuid;
  v_holidays_id uuid;
  v_result jsonb;
BEGIN
  -- 날씨 연결 확인/생성
  SELECT id INTO v_weather_id
  FROM api_connections
  WHERE (p_store_id IS NULL OR store_id = p_store_id)
    AND org_id = p_org_id
    AND data_category = 'weather'
    AND connection_category = 'context'
  LIMIT 1;

  IF v_weather_id IS NULL THEN
    INSERT INTO api_connections (
      id, org_id, store_id, name, provider, api_type, base_url,
      status, is_active, data_category, connection_category,
      is_system_managed, display_order, icon_name, description,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      p_org_id,
      p_store_id,
      '날씨 데이터 (OpenWeatherMap)',
      'openweathermap',
      'rest',
      'https://api.openweathermap.org/data/2.5',
      'active',
      true,
      'weather',
      'context',
      true,
      10,
      'cloud-sun',
      '실시간 날씨 정보를 수집하여 매장 운영 분석에 활용합니다.',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_weather_id;
  END IF;

  -- 공휴일 연결 확인/생성
  SELECT id INTO v_holidays_id
  FROM api_connections
  WHERE (p_store_id IS NULL OR store_id = p_store_id)
    AND org_id = p_org_id
    AND data_category = 'holidays'
    AND connection_category = 'context'
  LIMIT 1;

  IF v_holidays_id IS NULL THEN
    INSERT INTO api_connections (
      id, org_id, store_id, name, provider, api_type, base_url,
      status, is_active, data_category, connection_category,
      is_system_managed, display_order, icon_name, description,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      p_org_id,
      p_store_id,
      '공휴일/이벤트 (공공데이터포털)',
      'data-go-kr',
      'rest',
      'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService',
      'active',
      true,
      'holidays',
      'context',
      true,
      11,
      'calendar',
      '공휴일 및 특별 이벤트 정보를 수집하여 수요 예측에 활용합니다.',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_holidays_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'weather_connection_id', v_weather_id,
    'holidays_connection_id', v_holidays_id
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION ensure_system_context_connections IS '시스템 컨텍스트 데이터 소스 연결 보장 (날씨, 공휴일)';
