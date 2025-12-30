-- =====================================================
-- SEED_09_DATE_REFRESH.sql
--
-- 인사이트 허브 데이터 날짜 업데이트 및 보강
-- 생성일: 2025-12-30
--
-- 문제: 기존 시드 데이터가 2025-12-18까지만 존재
-- 해결: 날짜를 현재 기준으로 업데이트 + 누락 데이터 추가
-- =====================================================

-- 대상 store_id
-- d9830554-2688-4032-af40-acccda787ac4

-- =====================================================
-- PART 1: 기존 데이터 날짜 업데이트 (12일 shift)
-- =====================================================

-- 1-1. daily_sales 날짜 업데이트
UPDATE daily_sales
SET date = date + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-2. store_visits 날짜 업데이트
UPDATE store_visits
SET visit_date = visit_date + INTERVAL '12 days',
    exit_date = CASE WHEN exit_date IS NOT NULL THEN exit_date + INTERVAL '12 days' ELSE NULL END,
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND visit_date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-3. zone_daily_metrics 날짜 업데이트
UPDATE zone_daily_metrics
SET date = date + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days',
    calculated_at = CASE WHEN calculated_at IS NOT NULL THEN calculated_at + INTERVAL '12 days' ELSE NULL END
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-4. daily_kpis_agg 날짜 업데이트 (있는 경우)
UPDATE daily_kpis_agg
SET date = date + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-5. funnel_events 날짜 업데이트 (있는 경우)
UPDATE funnel_events
SET event_date = event_date + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND event_date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-6. purchases 날짜 업데이트 (있는 경우)
UPDATE purchases
SET purchase_date = purchase_date + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND purchase_date <= CURRENT_DATE - INTERVAL '12 days';

-- 1-7. transactions 날짜 업데이트 (있는 경우)
UPDATE transactions
SET transaction_datetime = transaction_datetime + INTERVAL '12 days',
    created_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND transaction_datetime <= CURRENT_DATE - INTERVAL '12 days';

-- =====================================================
-- PART 2: zone_transitions 시드 데이터 생성 (90일)
-- 고객 동선 오버레이에 사용됨
-- =====================================================

-- 2-1. 기존 zone_transitions 삭제
DELETE FROM zone_transitions
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 2-2. 새 zone_transitions 데이터 생성
INSERT INTO zone_transitions (
  id, store_id, org_id, from_zone_id, to_zone_id,
  transition_date, transition_count, avg_duration_seconds, created_at
)
SELECT
  gen_random_uuid(),
  z1.store_id,
  s.org_id,
  z1.id as from_zone_id,
  z2.id as to_zone_id,
  d.date as transition_date,
  -- 요일별 + 랜덤 이동 횟수
  CASE
    WHEN EXTRACT(DOW FROM d.date) IN (0, 6) THEN 50 + FLOOR(RANDOM() * 80)::INTEGER  -- 주말
    WHEN EXTRACT(DOW FROM d.date) = 5 THEN 40 + FLOOR(RANDOM() * 60)::INTEGER        -- 금요일
    ELSE 20 + FLOOR(RANDOM() * 50)::INTEGER                                           -- 평일
  END as transition_count,
  -- 평균 이동 시간 (60~300초)
  (60 + FLOOR(RANDOM() * 240))::INTEGER as avg_duration_seconds,
  NOW()
FROM zones_dim z1
CROSS JOIN zones_dim z2
CROSS JOIN generate_series(
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE,
  INTERVAL '1 day'
) as d(date)
JOIN stores s ON s.id = z1.store_id
WHERE z1.store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND z2.store_id = z1.store_id
  AND z1.id != z2.id;

-- =====================================================
-- PART 3: 오늘 날짜 데이터 추가
-- =====================================================

-- 3-1. 오늘 daily_sales 추가
INSERT INTO daily_sales (
  id, store_id, org_id, date,
  total_revenue, total_transactions, total_customers, avg_transaction_value,
  created_at
)
SELECT
  gen_random_uuid(),
  'd9830554-2688-4032-af40-acccda787ac4',
  (SELECT org_id FROM stores WHERE id = 'd9830554-2688-4032-af40-acccda787ac4'),
  CURRENT_DATE,
  (850000 + FLOOR(RANDOM() * 350000))::NUMERIC as total_revenue,
  (85 + FLOOR(RANDOM() * 35))::INTEGER as total_transactions,
  (160 + FLOOR(RANDOM() * 80))::INTEGER as total_customers,
  (9000 + FLOOR(RANDOM() * 3000))::NUMERIC as avg_transaction_value,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM daily_sales
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date = CURRENT_DATE
);

-- 3-2. 오늘 zone_daily_metrics 추가
INSERT INTO zone_daily_metrics (
  id, store_id, org_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds, peak_hour, peak_occupancy,
  interaction_count, conversion_count, revenue_attributed, heatmap_intensity,
  created_at, calculated_at
)
SELECT
  gen_random_uuid(),
  z.store_id,
  (SELECT org_id FROM stores WHERE id = z.store_id),
  z.id as zone_id,
  CURRENT_DATE as date,
  (60 + FLOOR(RANDOM() * 140))::INTEGER as total_visitors,
  (50 + FLOOR(RANDOM() * 100))::INTEGER as unique_visitors,
  (40 + FLOOR(RANDOM() * 100))::INTEGER as entry_count,
  (40 + FLOOR(RANDOM() * 100))::INTEGER as exit_count,
  (150 + FLOOR(RANDOM() * 250))::INTEGER as avg_dwell_seconds,
  (6000 + FLOOR(RANDOM() * 14000))::INTEGER as total_dwell_seconds,
  (11 + FLOOR(RANDOM() * 7))::INTEGER as peak_hour,
  (12 + FLOOR(RANDOM() * 28))::INTEGER as peak_occupancy,
  (25 + FLOOR(RANDOM() * 75))::INTEGER as interaction_count,
  (8 + FLOOR(RANDOM() * 22))::INTEGER as conversion_count,
  (60000 + FLOOR(RANDOM() * 180000))::NUMERIC as revenue_attributed,
  (RANDOM() * 0.6 + 0.4)::NUMERIC as heatmap_intensity,
  NOW(),
  NOW()
FROM zones_dim z
WHERE z.store_id = 'd9830554-2688-4032-af40-acccda787ac4'
AND NOT EXISTS (
  SELECT 1 FROM zone_daily_metrics
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND zone_id = z.id
  AND date = CURRENT_DATE
);

-- 3-3. 오늘 daily_kpis_agg 추가
INSERT INTO daily_kpis_agg (
  id, org_id, store_id, date,
  total_visitors, unique_visitors, returning_visitors, total_revenue,
  created_at
)
SELECT
  gen_random_uuid(),
  (SELECT org_id FROM stores WHERE id = 'd9830554-2688-4032-af40-acccda787ac4'),
  'd9830554-2688-4032-af40-acccda787ac4',
  CURRENT_DATE,
  (180 + FLOOR(RANDOM() * 70))::INTEGER as total_visitors,
  (140 + FLOOR(RANDOM() * 50))::INTEGER as unique_visitors,
  (30 + FLOOR(RANDOM() * 20))::INTEGER as returning_visitors,
  (850000 + FLOOR(RANDOM() * 350000))::NUMERIC as total_revenue,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM daily_kpis_agg
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date = CURRENT_DATE
);

-- =====================================================
-- PART 4: 최근 7일 빈 날짜 데이터 보강
-- =====================================================

-- 4-1. 최근 7일 daily_sales 보강
INSERT INTO daily_sales (
  id, store_id, org_id, date,
  total_revenue, total_transactions, total_customers, avg_transaction_value,
  created_at
)
SELECT
  gen_random_uuid(),
  'd9830554-2688-4032-af40-acccda787ac4',
  (SELECT org_id FROM stores WHERE id = 'd9830554-2688-4032-af40-acccda787ac4'),
  d.date,
  (700000 + FLOOR(RANDOM() * 500000))::NUMERIC,
  (70 + FLOOR(RANDOM() * 50))::INTEGER,
  (130 + FLOOR(RANDOM() * 70))::INTEGER,
  (8000 + FLOOR(RANDOM() * 4000))::NUMERIC,
  NOW()
FROM generate_series(
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) as d(date)
WHERE NOT EXISTS (
  SELECT 1 FROM daily_sales
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date = d.date
);

-- 4-2. 최근 7일 daily_kpis_agg 보강
INSERT INTO daily_kpis_agg (
  id, org_id, store_id, date,
  total_visitors, unique_visitors, returning_visitors, total_revenue,
  created_at
)
SELECT
  gen_random_uuid(),
  (SELECT org_id FROM stores WHERE id = 'd9830554-2688-4032-af40-acccda787ac4'),
  'd9830554-2688-4032-af40-acccda787ac4',
  d.date,
  (150 + FLOOR(RANDOM() * 80))::INTEGER as total_visitors,
  (120 + FLOOR(RANDOM() * 60))::INTEGER as unique_visitors,
  (25 + FLOOR(RANDOM() * 25))::INTEGER as returning_visitors,
  (700000 + FLOOR(RANDOM() * 500000))::NUMERIC as total_revenue,
  NOW()
FROM generate_series(
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) as d(date)
WHERE NOT EXISTS (
  SELECT 1 FROM daily_kpis_agg
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND date = d.date
);

-- 4-3. 최근 7일 zone_daily_metrics 보강
INSERT INTO zone_daily_metrics (
  id, store_id, org_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds, peak_hour, peak_occupancy,
  interaction_count, conversion_count, revenue_attributed, heatmap_intensity,
  created_at, calculated_at
)
SELECT
  gen_random_uuid(),
  z.store_id,
  (SELECT org_id FROM stores WHERE id = z.store_id),
  z.id as zone_id,
  d.date,
  (50 + FLOOR(RANDOM() * 130))::INTEGER as total_visitors,
  (40 + FLOOR(RANDOM() * 90))::INTEGER as unique_visitors,
  (35 + FLOOR(RANDOM() * 90))::INTEGER as entry_count,
  (35 + FLOOR(RANDOM() * 90))::INTEGER as exit_count,
  (130 + FLOOR(RANDOM() * 270))::INTEGER as avg_dwell_seconds,
  (5500 + FLOOR(RANDOM() * 13000))::INTEGER as total_dwell_seconds,
  (11 + FLOOR(RANDOM() * 7))::INTEGER as peak_hour,
  (10 + FLOOR(RANDOM() * 25))::INTEGER as peak_occupancy,
  (20 + FLOOR(RANDOM() * 70))::INTEGER as interaction_count,
  (6 + FLOOR(RANDOM() * 20))::INTEGER as conversion_count,
  (55000 + FLOOR(RANDOM() * 170000))::NUMERIC as revenue_attributed,
  (RANDOM() * 0.6 + 0.35)::NUMERIC as heatmap_intensity,
  NOW(),
  NOW()
FROM zones_dim z
CROSS JOIN generate_series(
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) as d(date)
WHERE z.store_id = 'd9830554-2688-4032-af40-acccda787ac4'
AND NOT EXISTS (
  SELECT 1 FROM zone_daily_metrics
  WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND zone_id = z.id
  AND date = d.date
);

-- =====================================================
-- PART 5: store_visits 오늘 + 최근 7일 보강
-- (PL/pgSQL 블록으로 실행)
-- =====================================================

DO $$
DECLARE
  v_date DATE;
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_count INTEGER;
  v_i INTEGER;
  v_zones UUID[];
BEGIN
  -- org_id 가져오기
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  -- 존 ID 배열 가져오기
  SELECT ARRAY_AGG(id) INTO v_zones FROM zones_dim WHERE store_id = v_store_id;

  -- 최근 7일 반복
  FOR v_date IN SELECT d::DATE FROM generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LOOP
    -- 해당 날짜 데이터 수 확인
    SELECT COUNT(*) INTO v_count
    FROM store_visits
    WHERE store_id = v_store_id AND DATE(visit_date) = v_date;

    -- 부족하면 추가 (목표: 100~200명)
    IF v_count < 100 THEN
      v_count := 100 + FLOOR(RANDOM() * 100)::INTEGER - v_count;

      FOR v_i IN 1..v_count LOOP
        INSERT INTO store_visits (
          id, store_id, org_id, customer_id, visit_date, exit_date,
          duration_minutes, entry_point, made_purchase, purchase_amount,
          device_type, data_source, created_at
        ) VALUES (
          gen_random_uuid(),
          v_store_id,
          v_org_id,
          gen_random_uuid(),
          v_date + (INTERVAL '9 hours' + (RANDOM() * INTERVAL '12 hours')),
          v_date + (INTERVAL '9 hours' + (RANDOM() * INTERVAL '12 hours')) + (INTERVAL '10 minutes' + (RANDOM() * INTERVAL '50 minutes')),
          (10 + FLOOR(RANDOM() * 50))::INTEGER,
          CASE WHEN RANDOM() > 0.3 THEN 'main' ELSE 'side' END,
          RANDOM() < 0.3,
          CASE WHEN RANDOM() < 0.3 THEN (15000 + FLOOR(RANDOM() * 85000))::NUMERIC ELSE 0 END,
          CASE FLOOR(RANDOM() * 3)::INTEGER WHEN 0 THEN 'mobile' WHEN 1 THEN 'tablet' ELSE 'sensor' END,
          'simulation',
          NOW()
        );
      END LOOP;

      RAISE NOTICE 'Added % visits for %', v_count, v_date;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PART 6: funnel_events 오늘 + 최근 7일 보강
-- =====================================================

-- 6-1. funnel_events 보강 (PL/pgSQL 블록)
DO $$
DECLARE
  v_date DATE;
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_count INTEGER;
  v_hour INTEGER;
  v_visitors INTEGER;
  v_browse INTEGER;
  v_engage INTEGER;
  v_fitting INTEGER;
  v_purchase INTEGER;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  FOR v_date IN SELECT d::DATE FROM generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LOOP
    -- 해당 날짜 데이터 수 확인
    SELECT COUNT(*) INTO v_count
    FROM funnel_events
    WHERE store_id = v_store_id AND event_date = v_date;

    IF v_count < 50 THEN
      -- 시간대별 이벤트 생성 (9시~21시)
      FOR v_hour IN 9..21 LOOP
        -- 시간대별 방문자 수 (피크 시간대 14-17시 더 많음)
        v_visitors := CASE
          WHEN v_hour BETWEEN 14 AND 17 THEN 15 + FLOOR(RANDOM() * 20)::INTEGER
          WHEN v_hour BETWEEN 11 AND 13 THEN 10 + FLOOR(RANDOM() * 15)::INTEGER
          WHEN v_hour BETWEEN 18 AND 20 THEN 8 + FLOOR(RANDOM() * 12)::INTEGER
          ELSE 3 + FLOOR(RANDOM() * 8)::INTEGER
        END;

        v_browse := FLOOR(v_visitors * 0.75)::INTEGER;
        v_engage := FLOOR(v_visitors * 0.45)::INTEGER;
        v_fitting := FLOOR(v_visitors * 0.25)::INTEGER;
        v_purchase := FLOOR(v_visitors * 0.15)::INTEGER;

        -- entry 이벤트
        FOR v_count IN 1..v_visitors LOOP
          INSERT INTO funnel_events (id, org_id, store_id, event_date, event_hour, event_type, created_at)
          VALUES (gen_random_uuid(), v_org_id, v_store_id, v_date, v_hour, 'entry', NOW());
        END LOOP;

        -- browse 이벤트
        FOR v_count IN 1..v_browse LOOP
          INSERT INTO funnel_events (id, org_id, store_id, event_date, event_hour, event_type, created_at)
          VALUES (gen_random_uuid(), v_org_id, v_store_id, v_date, v_hour, 'browse', NOW());
        END LOOP;

        -- engage 이벤트
        FOR v_count IN 1..v_engage LOOP
          INSERT INTO funnel_events (id, org_id, store_id, event_date, event_hour, event_type, created_at)
          VALUES (gen_random_uuid(), v_org_id, v_store_id, v_date, v_hour, 'engage', NOW());
        END LOOP;

        -- fitting 이벤트
        FOR v_count IN 1..v_fitting LOOP
          INSERT INTO funnel_events (id, org_id, store_id, event_date, event_hour, event_type, created_at)
          VALUES (gen_random_uuid(), v_org_id, v_store_id, v_date, v_hour, 'fitting', NOW());
        END LOOP;

        -- purchase 이벤트
        FOR v_count IN 1..v_purchase LOOP
          INSERT INTO funnel_events (id, org_id, store_id, event_date, event_hour, event_type, created_at)
          VALUES (gen_random_uuid(), v_org_id, v_store_id, v_date, v_hour, 'purchase', NOW());
        END LOOP;
      END LOOP;

      RAISE NOTICE 'Added funnel events for %', v_date;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PART 7: 결과 확인 쿼리
-- =====================================================

-- 날짜별 데이터 요약
SELECT 'daily_sales' as tbl,
       MIN(date) as min_dt,
       MAX(date) as max_dt,
       COUNT(*) as cnt,
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END) as today,
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END) as last_7d
FROM daily_sales
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'

UNION ALL

SELECT 'store_visits',
       MIN(DATE(visit_date)),
       MAX(DATE(visit_date)),
       COUNT(*),
       SUM(CASE WHEN DATE(visit_date) = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN DATE(visit_date) >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END)
FROM store_visits
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'

UNION ALL

SELECT 'zone_daily_metrics',
       MIN(date),
       MAX(date),
       COUNT(*),
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END)
FROM zone_daily_metrics
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'

UNION ALL

SELECT 'zone_transitions',
       MIN(transition_date),
       MAX(transition_date),
       COUNT(*),
       SUM(CASE WHEN transition_date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN transition_date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END)
FROM zone_transitions
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'

UNION ALL

SELECT 'daily_kpis_agg',
       MIN(date),
       MAX(date),
       COUNT(*),
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END)
FROM daily_kpis_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'

UNION ALL

SELECT 'funnel_events',
       MIN(event_date),
       MAX(event_date),
       COUNT(*),
       SUM(CASE WHEN event_date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END)
FROM funnel_events
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';
