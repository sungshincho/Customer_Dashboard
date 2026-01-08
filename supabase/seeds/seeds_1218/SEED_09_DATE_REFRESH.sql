-- =====================================================
-- SEED_09_DATE_REFRESH.sql (v3.1 - 전체 L3 재생성)
--
-- 인사이트 허브 데이터 날짜 업데이트 및 보강
-- 수정일: 2026-01-08
--
-- 핵심 변경 (v3.1):
-- - PART 3: 전체 L3 데이터 삭제 (7일만이 아닌 전체)
-- - PART 4: 전체 기간 L3 데이터 재생성 (7일만이 아닌 전체)
-- - 이를 통해 모든 기간에서 L2-L3 값 일관성 보장
--
-- v3 변경:
-- - PART 1: L2 날짜 shift 시 L3 테이블도 함께 shift
--
-- v2 변경:
-- - L2 데이터 먼저 생성 (funnel_events, transactions, line_items, zone_events)
-- - L3 집계 데이터는 L2에서 파생 (SEED_06_DERIVED 방식 적용)
-- =====================================================

-- 대상 store_id (동적으로 조회)

-- =====================================================
-- PART 1: 기존 데이터 날짜 업데이트 (동적 shift)
-- 가장 최근 데이터와 현재 날짜의 차이만큼 shift
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_max_date DATE;
  v_shift_days INT;
BEGIN
  -- Store/Org 정보 가져오기
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'stores 테이블에 데이터가 없습니다.';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_09 v2: L2 기반 날짜 갱신 시작';
  RAISE NOTICE 'store_id: %', v_store_id;
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- 가장 최근 funnel_events 날짜 확인
  SELECT MAX(event_date) INTO v_max_date
  FROM funnel_events WHERE store_id = v_store_id;

  IF v_max_date IS NULL THEN
    RAISE NOTICE '기존 데이터 없음 - shift 스킵';
  ELSE
    v_shift_days := CURRENT_DATE - v_max_date;

    IF v_shift_days > 0 THEN
      RAISE NOTICE '[PART 1] 날짜 shift: %일', v_shift_days;

      -- L2 테이블들 날짜 업데이트
      UPDATE funnel_events SET event_date = event_date + (v_shift_days || ' days')::INTERVAL
      WHERE store_id = v_store_id AND event_date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - funnel_events 업데이트 완료';

      UPDATE transactions SET transaction_datetime = transaction_datetime + (v_shift_days || ' days')::INTERVAL
      WHERE store_id = v_store_id AND transaction_datetime::date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - transactions 업데이트 완료';

      UPDATE line_items SET transaction_date = transaction_date + v_shift_days
      WHERE store_id = v_store_id AND transaction_date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - line_items 업데이트 완료';

      UPDATE zone_events SET event_date = event_date + v_shift_days
      WHERE store_id = v_store_id AND event_date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - zone_events 업데이트 완료';

      UPDATE store_visits SET
        visit_date = visit_date + (v_shift_days || ' days')::INTERVAL,
        exit_date = CASE WHEN exit_date IS NOT NULL THEN exit_date + (v_shift_days || ' days')::INTERVAL ELSE NULL END
      WHERE store_id = v_store_id AND visit_date::date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - store_visits 업데이트 완료';

      UPDATE purchases SET purchase_date = purchase_date + v_shift_days
      WHERE store_id = v_store_id AND purchase_date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - purchases 업데이트 완료';

      -- L3 집계 테이블 날짜도 함께 shift (L2와 일관성 유지)
      RAISE NOTICE '[PART 1-B] L3 집계 테이블 날짜 shift...';

      UPDATE daily_kpis_agg SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - daily_kpis_agg 업데이트 완료';

      UPDATE daily_sales SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - daily_sales 업데이트 완료';

      UPDATE hourly_metrics SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - hourly_metrics 업데이트 완료';

      UPDATE zone_daily_metrics SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - zone_daily_metrics 업데이트 완료';

      UPDATE product_performance_agg SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - product_performance_agg 업데이트 완료';

      UPDATE customer_segments_agg SET date = date + v_shift_days
      WHERE store_id = v_store_id AND date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - customer_segments_agg 업데이트 완료';

      UPDATE zone_transitions SET transition_date = transition_date + v_shift_days
      WHERE store_id = v_store_id AND transition_date < CURRENT_DATE - v_shift_days;
      RAISE NOTICE '  - zone_transitions 업데이트 완료';

    ELSE
      RAISE NOTICE '[PART 1] 데이터가 이미 최신 상태 - shift 스킵';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 2: L2 데이터 보강 (최근 7일)
-- funnel_events, transactions, line_items, zone_events
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_user_id UUID;
  v_date DATE;
  v_hour INT;
  v_count INT;
  v_existing_count INT;
  v_visitors INT;
  v_browse INT;
  v_engage INT;
  v_fitting INT;
  v_purchase INT;
  v_transaction_id UUID;
  v_customer_id UUID;
  v_product_id UUID;
  v_product_ids UUID[];
  v_zone_ids UUID[];
  v_i INT;
  v_tx_amount NUMERIC;
BEGIN
  -- Store/Org/User 정보 가져오기
  SELECT id, org_id, user_id INTO v_store_id, v_org_id, v_user_id FROM stores LIMIT 1;

  -- 상품/존 ID 배열
  SELECT ARRAY_AGG(id) INTO v_product_ids FROM products WHERE store_id = v_store_id;
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zone_ids FROM zones_dim WHERE store_id = v_store_id;

  RAISE NOTICE '[PART 2] L2 데이터 보강 (최근 7일)...';

  -- 최근 7일 반복
  FOR v_date IN SELECT d::DATE FROM generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LOOP
    -- 해당 날짜 funnel_events 확인
    SELECT COUNT(*) INTO v_existing_count
    FROM funnel_events WHERE store_id = v_store_id AND event_date = v_date;

    IF v_existing_count < 100 THEN
      RAISE NOTICE '  - % 날짜 L2 데이터 생성 중...', v_date;

      -- 시간대별 이벤트 생성 (10시~21시)
      FOR v_hour IN 10..21 LOOP
        -- 시간대별 방문자 수 (피크 시간대 더 많음)
        v_visitors := CASE
          WHEN v_hour BETWEEN 14 AND 17 THEN 12 + FLOOR(RANDOM() * 8)::INT
          WHEN v_hour BETWEEN 11 AND 13 THEN 8 + FLOOR(RANDOM() * 6)::INT
          WHEN v_hour BETWEEN 18 AND 20 THEN 8 + FLOOR(RANDOM() * 6)::INT
          ELSE 4 + FLOOR(RANDOM() * 4)::INT
        END;

        -- 퍼널 비율 (SEED_04와 동일)
        v_browse := FLOOR(v_visitors * 0.87)::INT;
        v_engage := FLOOR(v_browse * 0.75)::INT;
        v_fitting := FLOOR(v_engage * 0.30)::INT;
        v_purchase := FLOOR(v_visitors * 0.50)::INT;  -- 50% 전환율

        -- entry 이벤트
        FOR v_i IN 1..v_visitors LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);

          INSERT INTO funnel_events (id, store_id, org_id, customer_id, event_type, event_date, event_hour, zone_id, created_at)
          VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, 'entry', v_date, v_hour, v_zone_ids[1], NOW());
        END LOOP;

        -- browse 이벤트
        FOR v_i IN 1..v_browse LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);
          INSERT INTO funnel_events (id, store_id, org_id, customer_id, event_type, event_date, event_hour, zone_id, created_at)
          VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, 'browse', v_date, v_hour,
                  v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT], NOW());
        END LOOP;

        -- engage 이벤트
        FOR v_i IN 1..v_engage LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);
          INSERT INTO funnel_events (id, store_id, org_id, customer_id, event_type, event_date, event_hour, zone_id, created_at)
          VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, 'engage', v_date, v_hour,
                  v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT], NOW());
        END LOOP;

        -- fitting 이벤트
        FOR v_i IN 1..v_fitting LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);
          INSERT INTO funnel_events (id, store_id, org_id, customer_id, event_type, event_date, event_hour, zone_id, created_at)
          VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, 'fitting', v_date, v_hour, v_zone_ids[5], NOW());
        END LOOP;

        -- purchase 이벤트 + transactions + line_items
        FOR v_i IN 1..v_purchase LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);
          v_transaction_id := gen_random_uuid();
          v_tx_amount := 50000 + FLOOR(RANDOM() * 400000)::NUMERIC;
          v_product_id := v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT];

          -- funnel_events purchase
          INSERT INTO funnel_events (id, store_id, org_id, customer_id, event_type, event_date, event_hour, zone_id,
                                     metadata, created_at)
          VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, 'purchase', v_date, v_hour, v_zone_ids[6],
                  jsonb_build_object('transaction_id', v_transaction_id), NOW());

          -- transactions
          INSERT INTO transactions (id, store_id, org_id, user_id, customer_id, transaction_datetime, channel,
                                    payment_method, total_amount, discount_amount, net_amount, created_at)
          VALUES (v_transaction_id, v_store_id, v_org_id, v_user_id, v_customer_id,
                  v_date + (v_hour || ' hours')::INTERVAL + (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL,
                  'in_store',
                  (ARRAY['card','cash','mobile'])[1 + FLOOR(RANDOM() * 3)::INT],
                  v_tx_amount,
                  FLOOR(v_tx_amount * 0.05)::NUMERIC,
                  v_tx_amount - FLOOR(v_tx_amount * 0.05)::NUMERIC,
                  NOW());

          -- line_items (1~2개)
          FOR v_count IN 1..(1 + FLOOR(RANDOM() * 2)::INT) LOOP
            v_product_id := v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT];
            INSERT INTO line_items (id, store_id, org_id, transaction_id, product_id, customer_id,
                                    quantity, unit_price, line_total, transaction_date, transaction_hour,
                                    payment_method, created_at)
            VALUES (gen_random_uuid(), v_store_id, v_org_id, v_transaction_id::text, v_product_id, v_customer_id,
                    1 + FLOOR(RANDOM() * 2)::INT,
                    (SELECT price FROM products WHERE id = v_product_id),
                    (SELECT price FROM products WHERE id = v_product_id) * (1 + FLOOR(RANDOM() * 2)::INT),
                    v_date, v_hour,
                    (ARRAY['card','cash','mobile'])[1 + FLOOR(RANDOM() * 3)::INT],
                    NOW());
          END LOOP;
        END LOOP;

        -- zone_events (방문자당 3~5개)
        FOR v_i IN 1..v_visitors LOOP
          v_customer_id := (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY RANDOM() LIMIT 1);
          FOR v_count IN 1..(3 + FLOOR(RANDOM() * 3)::INT) LOOP
            INSERT INTO zone_events (id, store_id, org_id, zone_id, event_type, event_date, event_timestamp,
                                     customer_id, duration_seconds, created_at)
            VALUES (gen_random_uuid(), v_store_id, v_org_id,
                    v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT],
                    (ARRAY['enter','dwell','exit'])[1 + FLOOR(RANDOM() * 3)::INT],
                    v_date,
                    v_date + (v_hour || ' hours')::INTERVAL + ((v_count * 5) || ' minutes')::INTERVAL,
                    v_customer_id,
                    60 + FLOOR(RANDOM() * 300)::INT,
                    NOW());
          END LOOP;
        END LOOP;

      END LOOP; -- hour loop
    END IF;
  END LOOP; -- date loop

  RAISE NOTICE '[PART 2] L2 데이터 보강 완료';
END $$;

-- =====================================================
-- PART 3: L3 집계 데이터 삭제 (전체 재생성 전 정리)
-- v3.1: 7일만이 아닌 전체 삭제로 변경
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 3] 전체 L3 집계 데이터 삭제 (L2 기반 완전 재생성 준비)...';

  DELETE FROM daily_kpis_agg WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM daily_sales WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM hourly_metrics WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM zone_daily_metrics WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM product_performance_agg WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM customer_segments_agg WHERE org_id = v_org_id AND store_id = v_store_id;

  RAISE NOTICE '[PART 3] L3 전체 삭제 완료';
END $$;

-- =====================================================
-- PART 4: L3 집계 데이터 파생 (L2 기반 - 전체 기간)
-- v3.1: 7일만이 아닌 전체 기간 재생성
-- SEED_06_DERIVED 방식 적용
-- =====================================================

-- 4-1. daily_kpis_agg 파생
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 4-1] daily_kpis_agg 파생 (funnel_events + transactions 기반)...';

  INSERT INTO daily_kpis_agg (
    org_id, store_id, date,
    total_visitors, unique_visitors, returning_visitors,
    avg_visit_duration_seconds,
    total_transactions, total_revenue, total_units_sold,
    avg_basket_size, avg_transaction_value,
    conversion_rate, browse_to_engage_rate, engage_to_purchase_rate,
    sales_per_sqm, sales_per_visitor,
    labor_hours, sales_per_labor_hour,
    calculated_at, metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    fe.event_date,
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(DISTINCT CASE WHEN fe.event_type = 'entry' THEN fe.customer_id END), 0),
    FLOOR(COALESCE(COUNT(DISTINCT CASE WHEN fe.event_type = 'entry' THEN fe.customer_id END), 0) * 0.25),
    900 + FLOOR(RANDOM() * 600),
    COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0),
    COALESCE(tx.total_revenue, 0),
    COALESCE(li.total_units, 0),
    CASE
      WHEN COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) > 0
      THEN ROUND(COALESCE(li.total_units, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 2)
      ELSE 0
    END,
    CASE
      WHEN COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) > 0
      THEN ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0)
      ELSE 0
    END,
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END,
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'browse' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'browse' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END,
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END,
    ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / 500, 0),
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0)
      ELSE 0
    END,
    64,
    ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / 64, 0),
    NOW(),
    jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'funnel_events + transactions')
  FROM funnel_events fe
  LEFT JOIN (
    SELECT transaction_datetime::date as tx_date, SUM(total_amount) as total_revenue
    FROM transactions WHERE store_id = v_store_id GROUP BY transaction_datetime::date
  ) tx ON tx.tx_date = fe.event_date
  LEFT JOIN (
    SELECT transaction_date, SUM(quantity) as total_units
    FROM line_items WHERE store_id = v_store_id GROUP BY transaction_date
  ) li ON li.transaction_date = fe.event_date
  WHERE fe.store_id = v_store_id
  GROUP BY fe.event_date, tx.total_revenue, li.total_units
  ON CONFLICT (store_id, date) DO UPDATE SET
    total_visitors = EXCLUDED.total_visitors,
    total_transactions = EXCLUDED.total_transactions,
    total_revenue = EXCLUDED.total_revenue,
    calculated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - daily_kpis_agg: %건 삽입/갱신', v_count;
END $$;

-- 4-2. daily_sales 파생 (테이블이 존재하는 경우에만 - ON CONFLICT 없이 DELETE+INSERT)
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
  v_table_exists BOOLEAN;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  -- daily_sales 테이블 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'daily_sales'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    RAISE NOTICE '[PART 4-2] daily_sales 테이블 없음 - 스킵';
    RETURN;
  END IF;

  RAISE NOTICE '[PART 4-2] daily_sales 파생 (transactions 기반)...';

  -- PART 3에서 이미 전체 삭제함, 여기서는 전체 기간 삽입
  INSERT INTO daily_sales (
    org_id, store_id, date,
    total_revenue, total_transactions, avg_transaction_value, total_customers,
    metadata
  )
  SELECT
    v_org_id, v_store_id, t.transaction_datetime::date,
    SUM(t.total_amount),
    COUNT(*),
    ROUND(AVG(t.total_amount), 0),
    COUNT(DISTINCT t.customer_id),
    jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'transactions')
  FROM transactions t
  WHERE t.store_id = v_store_id
  GROUP BY t.transaction_datetime::date;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - daily_sales: %건 삽입/갱신', v_count;
END $$;

-- 4-3. hourly_metrics 파생
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 4-3] hourly_metrics 파생 (funnel_events 기반)...';

  INSERT INTO hourly_metrics (
    org_id, store_id, date, hour,
    visitor_count, entry_count, exit_count,
    transaction_count, revenue, units_sold,
    avg_occupancy, peak_occupancy, conversion_rate,
    calculated_at, metadata
  )
  SELECT
    v_org_id, v_store_id, fe.event_date, fe.event_hour,
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0),
    FLOOR(COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) * 0.95),
    COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0),
    COALESCE(tx.hourly_revenue, 0),
    COALESCE(li.hourly_units, 0),
    FLOOR(COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) * 0.6),
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) + FLOOR(RANDOM() * 5),
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END,
    NOW(),
    jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'funnel_events')
  FROM funnel_events fe
  LEFT JOIN (
    SELECT transaction_datetime::date as tx_date, EXTRACT(HOUR FROM transaction_datetime)::INT as tx_hour,
           SUM(total_amount) as hourly_revenue
    FROM transactions WHERE store_id = v_store_id GROUP BY 1, 2
  ) tx ON tx.tx_date = fe.event_date AND tx.tx_hour = fe.event_hour
  LEFT JOIN (
    SELECT transaction_date, transaction_hour, SUM(quantity) as hourly_units
    FROM line_items WHERE store_id = v_store_id GROUP BY transaction_date, transaction_hour
  ) li ON li.transaction_date = fe.event_date AND li.transaction_hour = fe.event_hour
  WHERE fe.store_id = v_store_id
    AND fe.event_hour IS NOT NULL
  GROUP BY fe.event_date, fe.event_hour, tx.hourly_revenue, li.hourly_units
  ON CONFLICT (store_id, date, hour) DO UPDATE SET
    visitor_count = EXCLUDED.visitor_count,
    transaction_count = EXCLUDED.transaction_count,
    revenue = EXCLUDED.revenue;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - hourly_metrics: %건 삽입/갱신', v_count;
END $$;

-- 4-4. zone_daily_metrics 파생
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 4-4] zone_daily_metrics 파생 (zone_events 기반)...';

  INSERT INTO zone_daily_metrics (
    org_id, store_id, zone_id, date,
    total_visitors, unique_visitors, entry_count, exit_count,
    avg_dwell_seconds, total_dwell_seconds,
    interaction_count, conversion_count, revenue_attributed, heatmap_intensity,
    peak_hour, peak_occupancy,
    calculated_at, metadata
  )
  SELECT
    v_org_id, v_store_id, ze.zone_id, ze.event_date,
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(DISTINCT CASE WHEN ze.event_type = 'enter' THEN ze.customer_id END), 0),
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ze.event_type = 'exit' THEN 1 ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN ze.event_type = 'dwell' THEN ze.duration_seconds END), 0),
    COALESCE(SUM(CASE WHEN ze.event_type = 'dwell' THEN ze.duration_seconds ELSE 0 END), 0),
    FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (0.3 + RANDOM() * 0.3)),
    CASE
      WHEN zd.zone_type IN ('product_display', 'checkout', 'fitting_room')
      THEN FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (0.2 + RANDOM() * 0.15))
      ELSE FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * 0.05)
    END,
    CASE
      WHEN zd.zone_type IN ('product_display', 'checkout')
      THEN FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (50000 + RANDOM() * 30000))
      ELSE 0
    END,
    ROUND(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0)::NUMERIC / 100, 2),
    13 + FLOOR(RANDOM() * 8),
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) + FLOOR(RANDOM() * 10),
    NOW(),
    jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'zone_events', 'zone_code', zd.zone_code)
  FROM zone_events ze
  JOIN zones_dim zd ON zd.id = ze.zone_id
  WHERE ze.store_id = v_store_id
  GROUP BY ze.zone_id, ze.event_date, zd.zone_type, zd.zone_code
  ON CONFLICT (store_id, zone_id, date) DO UPDATE SET
    total_visitors = EXCLUDED.total_visitors,
    entry_count = EXCLUDED.entry_count,
    calculated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - zone_daily_metrics: %건 삽입/갱신', v_count;
END $$;

-- 4-5. product_performance_agg 파생
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 4-5] product_performance_agg 파생 (line_items 기반)...';

  INSERT INTO product_performance_agg (
    org_id, store_id, product_id, date,
    units_sold, revenue, transactions,
    conversion_rate, avg_selling_price,
    discount_rate, return_rate, stock_level, stockout_hours,
    category_rank, store_rank,
    calculated_at, metadata
  )
  SELECT
    v_org_id, v_store_id, li.product_id, li.transaction_date,
    COALESCE(SUM(li.quantity), 0),
    COALESCE(SUM(li.line_total), 0),
    COUNT(DISTINCT li.transaction_id),
    ROUND(((RANDOM() * 0.15 + 0.02) * 100)::NUMERIC, 2),
    CASE WHEN SUM(li.quantity) > 0 THEN ROUND(SUM(li.line_total)::NUMERIC / SUM(li.quantity), 0) ELSE 0 END,
    ROUND((RANDOM() * 0.2)::NUMERIC, 2),
    ROUND((RANDOM() * 0.05)::NUMERIC, 3),
    COALESCE(p.stock_quantity, 50 + FLOOR(RANDOM() * 100)::INT),
    CASE WHEN RANDOM() < 0.05 THEN FLOOR(RANDOM() * 4) ELSE 0 END,
    ROW_NUMBER() OVER (PARTITION BY li.transaction_date, p.category ORDER BY SUM(li.line_total) DESC),
    ROW_NUMBER() OVER (PARTITION BY li.transaction_date ORDER BY SUM(li.line_total) DESC),
    NOW(),
    jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'line_items', 'product_name', p.product_name)
  FROM line_items li
  JOIN products p ON p.id = li.product_id
  WHERE li.store_id = v_store_id
    AND li.product_id IS NOT NULL
  GROUP BY li.product_id, li.transaction_date, p.stock_quantity, p.product_name, p.category
  ON CONFLICT (store_id, product_id, date) DO UPDATE SET
    units_sold = EXCLUDED.units_sold,
    revenue = EXCLUDED.revenue,
    calculated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - product_performance_agg: %건 삽입/갱신', v_count;
END $$;

-- 4-6. customer_segments_agg 파생
DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_date DATE;
  v_segment TEXT;
  v_segments TEXT[] := ARRAY['VIP', 'Regular', 'New', 'Dormant'];
  v_count INT := 0;
  v_seg_data RECORD;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 4-6] customer_segments_agg 파생 (transactions 기반)...';

  FOR v_date IN
    SELECT DISTINCT transaction_datetime::date
    FROM transactions
    WHERE store_id = v_store_id
    ORDER BY 1
  LOOP
    SELECT COUNT(DISTINCT customer_id), SUM(total_amount), AVG(total_amount)
    INTO v_seg_data
    FROM transactions
    WHERE store_id = v_store_id AND transaction_datetime::date = v_date;

    FOREACH v_segment IN ARRAY v_segments LOOP
      INSERT INTO customer_segments_agg (
        org_id, store_id, date, segment_type, segment_name,
        customer_count, total_revenue, avg_transaction_value, visit_frequency,
        avg_basket_size, churn_risk_score, ltv_estimate,
        metadata, calculated_at
      )
      SELECT
        v_org_id, v_store_id, v_date, 'customer_tier', v_segment,
        CASE v_segment
          WHEN 'VIP' THEN FLOOR(COALESCE(v_seg_data.count, 0) * 0.15) + FLOOR(RANDOM() * 5)
          WHEN 'Regular' THEN FLOOR(COALESCE(v_seg_data.count, 0) * 0.40) + FLOOR(RANDOM() * 10)
          WHEN 'New' THEN FLOOR(COALESCE(v_seg_data.count, 0) * 0.30) + FLOOR(RANDOM() * 8)
          WHEN 'Dormant' THEN FLOOR(COALESCE(v_seg_data.count, 0) * 0.15) + FLOOR(RANDOM() * 5)
        END,
        CASE v_segment
          WHEN 'VIP' THEN FLOOR(COALESCE(v_seg_data.sum, 0) * 0.45)
          WHEN 'Regular' THEN FLOOR(COALESCE(v_seg_data.sum, 0) * 0.35)
          WHEN 'New' THEN FLOOR(COALESCE(v_seg_data.sum, 0) * 0.15)
          WHEN 'Dormant' THEN FLOOR(COALESCE(v_seg_data.sum, 0) * 0.05)
        END,
        CASE v_segment
          WHEN 'VIP' THEN COALESCE(v_seg_data.avg, 100000) * 1.8
          WHEN 'Regular' THEN COALESCE(v_seg_data.avg, 100000) * 1.0
          WHEN 'New' THEN COALESCE(v_seg_data.avg, 100000) * 0.7
          WHEN 'Dormant' THEN COALESCE(v_seg_data.avg, 100000) * 0.5
        END,
        CASE v_segment WHEN 'VIP' THEN 3.5 + RANDOM() * 1.5 WHEN 'Regular' THEN 2.0 + RANDOM()
             WHEN 'New' THEN 1.0 + RANDOM() * 0.5 WHEN 'Dormant' THEN 0.2 + RANDOM() * 0.3 END,
        CASE v_segment WHEN 'VIP' THEN 2.5 + RANDOM() WHEN 'Regular' THEN 1.8 + RANDOM() * 0.5
             WHEN 'New' THEN 1.3 + RANDOM() * 0.4 WHEN 'Dormant' THEN 1.1 + RANDOM() * 0.2 END,
        CASE v_segment WHEN 'VIP' THEN 0.05 + RANDOM() * 0.05 WHEN 'Regular' THEN 0.15 + RANDOM() * 0.1
             WHEN 'New' THEN 0.30 + RANDOM() * 0.15 WHEN 'Dormant' THEN 0.60 + RANDOM() * 0.2 END,
        CASE v_segment WHEN 'VIP' THEN 5000000 + FLOOR(RANDOM() * 2000000) WHEN 'Regular' THEN 2000000 + FLOOR(RANDOM() * 800000)
             WHEN 'New' THEN 800000 + FLOOR(RANDOM() * 400000) WHEN 'Dormant' THEN 200000 + FLOOR(RANDOM() * 150000) END,
        jsonb_build_object('source', 'SEED_09_v3.1', 'derived_from', 'transactions', 'segment', v_segment),
        NOW()
      ON CONFLICT (store_id, date, segment_type, segment_name) DO UPDATE SET
        customer_count = EXCLUDED.customer_count,
        total_revenue = EXCLUDED.total_revenue,
        calculated_at = NOW();

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  - customer_segments_agg: %건 삽입/갱신', v_count;
END $$;

-- =====================================================
-- PART 5: zone_transitions 갱신 (zone_events 기반)
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  RAISE NOTICE '[PART 5] zone_transitions 갱신...';

  -- 최근 7일 데이터 삭제
  DELETE FROM zone_transitions
  WHERE store_id = v_store_id AND transition_date >= CURRENT_DATE - INTERVAL '6 days';

  -- zone_events 기반으로 zone_transitions 파생
  -- 연속된 zone 이벤트에서 from/to 추출
  INSERT INTO zone_transitions (
    id, store_id, org_id, from_zone_id, to_zone_id,
    transition_date, transition_count, avg_duration_seconds, created_at
  )
  SELECT
    gen_random_uuid(),
    v_store_id,
    v_org_id,
    z1.id as from_zone_id,
    z2.id as to_zone_id,
    d.date as transition_date,
    -- zone_events enter 이벤트 수 기반 이동 추정
    GREATEST(5, (
      SELECT COUNT(*) / 10 FROM zone_events
      WHERE store_id = v_store_id AND event_date = d.date AND zone_id IN (z1.id, z2.id)
    ) + FLOOR(RANDOM() * 20))::INT,
    (60 + FLOOR(RANDOM() * 240))::INT,
    NOW()
  FROM zones_dim z1
  CROSS JOIN zones_dim z2
  CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') as d(date)
  WHERE z1.store_id = v_store_id AND z2.store_id = v_store_id AND z1.id != z2.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - zone_transitions: %건 삽입', v_count;
END $$;

-- =====================================================
-- PART 6: 데이터 정합성 검증
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_funnel_entry INT;
  v_kpi_visitors INT;
  v_funnel_purchase INT;
  v_kpi_transactions INT;
  v_funnel_entry_all INT;
  v_kpi_visitors_all INT;
  v_funnel_purchase_all INT;
  v_kpi_transactions_all INT;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '[PART 6] 데이터 정합성 검증';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- 1. 전체 기간 검증
  RAISE NOTICE '[전체 기간]';

  SELECT COUNT(*) INTO v_funnel_entry_all
  FROM funnel_events WHERE store_id = v_store_id AND event_type = 'entry';

  SELECT COALESCE(SUM(total_visitors), 0) INTO v_kpi_visitors_all
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  IF v_funnel_entry_all = v_kpi_visitors_all THEN
    RAISE NOTICE '  ✓ 전체 entry = total_visitors: % = %', v_funnel_entry_all, v_kpi_visitors_all;
  ELSE
    RAISE WARNING '  ✗ 전체 entry ≠ total_visitors: % ≠ %', v_funnel_entry_all, v_kpi_visitors_all;
  END IF;

  SELECT COUNT(*) INTO v_funnel_purchase_all
  FROM funnel_events WHERE store_id = v_store_id AND event_type = 'purchase';

  SELECT COALESCE(SUM(total_transactions), 0) INTO v_kpi_transactions_all
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  IF v_funnel_purchase_all = v_kpi_transactions_all THEN
    RAISE NOTICE '  ✓ 전체 purchase = total_transactions: % = %', v_funnel_purchase_all, v_kpi_transactions_all;
  ELSE
    RAISE WARNING '  ✗ 전체 purchase ≠ total_transactions: % ≠ %', v_funnel_purchase_all, v_kpi_transactions_all;
  END IF;

  -- 2. 최근 7일 검증
  RAISE NOTICE '[최근 7일]';

  SELECT COUNT(*) INTO v_funnel_entry
  FROM funnel_events WHERE store_id = v_store_id
    AND event_type = 'entry' AND event_date >= CURRENT_DATE - INTERVAL '6 days';

  SELECT COALESCE(SUM(total_visitors), 0) INTO v_kpi_visitors
  FROM daily_kpis_agg WHERE store_id = v_store_id
    AND date >= CURRENT_DATE - INTERVAL '6 days';

  IF v_funnel_entry = v_kpi_visitors THEN
    RAISE NOTICE '  ✓ 7일 entry = total_visitors: % = %', v_funnel_entry, v_kpi_visitors;
  ELSE
    RAISE WARNING '  ✗ 7일 entry ≠ total_visitors: % ≠ %', v_funnel_entry, v_kpi_visitors;
  END IF;

  SELECT COUNT(*) INTO v_funnel_purchase
  FROM funnel_events WHERE store_id = v_store_id
    AND event_type = 'purchase' AND event_date >= CURRENT_DATE - INTERVAL '6 days';

  SELECT COALESCE(SUM(total_transactions), 0) INTO v_kpi_transactions
  FROM daily_kpis_agg WHERE store_id = v_store_id
    AND date >= CURRENT_DATE - INTERVAL '6 days';

  IF v_funnel_purchase = v_kpi_transactions THEN
    RAISE NOTICE '  ✓ 7일 purchase = total_transactions: % = %', v_funnel_purchase, v_kpi_transactions;
  ELSE
    RAISE WARNING '  ✗ 7일 purchase ≠ total_transactions: % ≠ %', v_funnel_purchase, v_kpi_transactions;
  END IF;

  -- 3. 날짜 범위 일치 확인
  RAISE NOTICE '[날짜 범위 일치]';
  PERFORM 1 FROM (
    SELECT 'funnel_events' as tbl, MIN(event_date) as min_dt, MAX(event_date) as max_dt
    FROM funnel_events WHERE store_id = v_store_id
    UNION ALL
    SELECT 'daily_kpis_agg', MIN(date), MAX(date)
    FROM daily_kpis_agg WHERE store_id = v_store_id
  ) t;
  RAISE NOTICE '  (PART 7 쿼리 결과로 확인)';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_09 v3.1 완료: 전체 L3 재생성으로 L2-L3 값 일관성 보장';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- PART 7: 결과 확인 쿼리
-- =====================================================

-- 테이블별 날짜 범위 및 기간별 레코드 수 확인
SELECT 'funnel_events' as tbl,
       MIN(event_date) as min_dt,
       MAX(event_date) as max_dt,
       COUNT(*) as cnt,
       SUM(CASE WHEN event_date = CURRENT_DATE THEN 1 ELSE 0 END) as today,
       SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END) as last_7d,
       SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '29 days' THEN 1 ELSE 0 END) as last_30d,
       SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '89 days' THEN 1 ELSE 0 END) as last_90d
FROM funnel_events

UNION ALL

SELECT 'daily_kpis_agg',
       MIN(date), MAX(date), COUNT(*),
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '29 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '89 days' THEN 1 ELSE 0 END)
FROM daily_kpis_agg

UNION ALL

SELECT 'transactions',
       MIN(transaction_datetime::date), MAX(transaction_datetime::date), COUNT(*),
       SUM(CASE WHEN transaction_datetime::date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN transaction_datetime::date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN transaction_datetime::date >= CURRENT_DATE - INTERVAL '29 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN transaction_datetime::date >= CURRENT_DATE - INTERVAL '89 days' THEN 1 ELSE 0 END)
FROM transactions

UNION ALL

SELECT 'hourly_metrics',
       MIN(date), MAX(date), COUNT(*),
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '29 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '89 days' THEN 1 ELSE 0 END)
FROM hourly_metrics

UNION ALL

SELECT 'zone_daily_metrics',
       MIN(date), MAX(date), COUNT(*),
       SUM(CASE WHEN date = CURRENT_DATE THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '6 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '29 days' THEN 1 ELSE 0 END),
       SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '89 days' THEN 1 ELSE 0 END)
FROM zone_daily_metrics

ORDER BY tbl;

-- =====================================================
-- End of SEED_09_DATE_REFRESH.sql (v3.1)
-- =====================================================
