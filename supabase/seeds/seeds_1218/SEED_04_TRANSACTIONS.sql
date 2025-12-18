-- ============================================================================
-- NEURALTWIN v8.6 SEED_04: 트랜잭션 데이터
-- ============================================================================
-- 실행 순서: SEED_03 이후
-- 목적: store_visits(~7500), purchases(~3750), transactions(~3750),
--       line_items(~7500), funnel_events(~22500), zone_events(~30000),
--       visit_zone_events(~15000), zone_transitions(~1500) 시딩
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[];
  v_zone_codes TEXT[] := ARRAY['Z001','Z002','Z003','Z004','Z005','Z006','Z007'];
  v_product_ids UUID[];
  v_customer_ids UUID[];
  v_visit_id UUID;
  v_purchase_id UUID;
  v_transaction_id UUID;
  v_visit_date DATE;
  v_visit_ts TIMESTAMPTZ;
  v_entry_time TIMESTAMPTZ;
  v_exit_time TIMESTAMPTZ;
  v_dwell_minutes INT;
  v_converted BOOLEAN;
  v_purchase_amount NUMERIC;
  v_customer_id UUID;
  v_zone_id UUID;
  v_product_id UUID;
  v_day INT;
  v_hour INT;
  v_visit_count INT;
  v_i INT;
  v_j INT;
  v_zone_index INT;
  v_total_visits INT := 0;
  v_total_purchases INT := 0;
  v_total_transactions INT := 0;
  v_total_line_items INT := 0;
  v_total_funnel_events INT := 0;
  v_total_zone_events INT := 0;
  v_total_visit_zone_events INT := 0;
  v_event_types TEXT[] := ARRAY['awareness','interest','consideration','intent','purchase'];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_04: 트랜잭션 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '  (대량 데이터 생성으로 수 분 소요될 수 있습니다)';
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  -- Zone IDs 배열로 가져오기
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zone_ids
  FROM zones_dim WHERE store_id = v_store_id;

  -- Product IDs 배열로 가져오기
  SELECT ARRAY_AGG(id) INTO v_product_ids
  FROM products WHERE store_id = v_store_id;

  -- Customer IDs 배열로 가져오기 (샘플)
  SELECT ARRAY_AGG(id) INTO v_customer_ids
  FROM (SELECT id FROM customers WHERE store_id = v_store_id LIMIT 500) sub;

  IF v_zone_ids IS NULL OR ARRAY_LENGTH(v_zone_ids, 1) = 0 THEN
    RAISE EXCEPTION 'zones_dim 데이터가 없습니다. SEED_02를 먼저 실행하세요.';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 7.1-9.4: 90일간 트랜잭션 데이터 생성
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7-9] 90일간 트랜잭션 데이터 생성...';

  FOR v_day IN 0..89 LOOP
    v_visit_date := CURRENT_DATE - v_day;

    -- 요일별 방문자 수 조절 (주말 30% 증가)
    IF EXTRACT(DOW FROM v_visit_date) IN (0, 6) THEN
      v_visit_count := 100 + FLOOR(RANDOM() * 30)::INT;
    ELSE
      v_visit_count := 75 + FLOOR(RANDOM() * 20)::INT;
    END IF;

    -- 일별 방문 생성
    FOR v_i IN 1..v_visit_count LOOP
      -- 랜덤 고객 선택
      v_customer_id := v_customer_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_customer_ids, 1))::INT];

      -- 방문 시간 (10:00-21:00)
      v_hour := 10 + FLOOR(RANDOM() * 11)::INT;
      v_entry_time := v_visit_date + (v_hour || ' hours')::INTERVAL + (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL;

      -- 체류 시간 (5-45분)
      v_dwell_minutes := 5 + FLOOR(RANDOM() * 40)::INT;
      v_exit_time := v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL;

      -- 구매 전환 (약 50%)
      v_converted := RANDOM() < 0.5;

      v_visit_id := gen_random_uuid();

      -- ══════════════════════════════════════════════════════════════════
      -- 7.1: store_visits
      -- ══════════════════════════════════════════════════════════════════
      INSERT INTO store_visits (
        id, store_id, org_id, user_id, customer_id, visit_date, entry_time, exit_time,
        dwell_time_minutes, converted, device_type, entry_zone_id, exit_zone_id,
        zones_visited, created_at
      ) VALUES (
        v_visit_id, v_store_id, v_org_id, v_user_id, v_customer_id, v_visit_date,
        v_entry_time, v_exit_time, v_dwell_minutes, v_converted,
        (ARRAY['mobile', 'desktop', 'tablet'])[1 + FLOOR(RANDOM() * 3)::INT],
        v_zone_ids[1], v_zone_ids[6],
        2 + FLOOR(RANDOM() * 5)::INT,
        NOW()
      );
      v_total_visits := v_total_visits + 1;

      -- ══════════════════════════════════════════════════════════════════
      -- 9.1: funnel_events (방문당 3-5개)
      -- ══════════════════════════════════════════════════════════════════
      FOR v_j IN 1..(3 + FLOOR(RANDOM() * 3)::INT) LOOP
        INSERT INTO funnel_events (
          id, store_id, org_id, user_id, customer_id, visit_id, event_type,
          event_date, event_timestamp, zone_id, product_id, metadata, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_customer_id, v_visit_id,
          v_event_types[LEAST(v_j, 5)],
          v_visit_date,
          v_entry_time + ((v_j * 3) || ' minutes')::INTERVAL,
          v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT],
          v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT],
          '{}'::jsonb,
          NOW()
        );
        v_total_funnel_events := v_total_funnel_events + 1;
      END LOOP;

      -- ══════════════════════════════════════════════════════════════════
      -- 9.2: zone_events (방문당 3-6개 존 방문)
      -- ══════════════════════════════════════════════════════════════════
      FOR v_j IN 1..(3 + FLOOR(RANDOM() * 4)::INT) LOOP
        v_zone_index := 1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT;
        INSERT INTO zone_events (
          id, store_id, org_id, user_id, zone_id, event_type, event_date,
          event_timestamp, visitor_count, dwell_seconds, metadata, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_user_id,
          v_zone_ids[v_zone_index],
          (ARRAY['enter', 'dwell', 'exit'])[1 + FLOOR(RANDOM() * 3)::INT],
          v_visit_date,
          v_entry_time + ((v_j * 5) || ' minutes')::INTERVAL,
          1,
          60 + FLOOR(RANDOM() * 300)::INT,
          '{}'::jsonb,
          NOW()
        );
        v_total_zone_events := v_total_zone_events + 1;
      END LOOP;

      -- ══════════════════════════════════════════════════════════════════
      -- 9.3: visit_zone_events (방문당 2-4개 존 상세)
      -- ══════════════════════════════════════════════════════════════════
      FOR v_j IN 1..(2 + FLOOR(RANDOM() * 3)::INT) LOOP
        v_zone_index := 1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT;
        INSERT INTO visit_zone_events (
          id, store_id, org_id, user_id, visit_id, zone_id,
          entry_time, exit_time, dwell_seconds, interaction_count, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_visit_id,
          v_zone_ids[v_zone_index],
          v_entry_time + ((v_j * 5) || ' minutes')::INTERVAL,
          v_entry_time + (((v_j * 5) + 3 + FLOOR(RANDOM() * 5)::INT) || ' minutes')::INTERVAL,
          180 + FLOOR(RANDOM() * 300)::INT,
          1 + FLOOR(RANDOM() * 5)::INT,
          NOW()
        );
        v_total_visit_zone_events := v_total_visit_zone_events + 1;
      END LOOP;

      -- ══════════════════════════════════════════════════════════════════
      -- 7.2, 8.1, 8.2: purchases, transactions, line_items (전환된 방문만)
      -- ══════════════════════════════════════════════════════════════════
      IF v_converted THEN
        v_purchase_id := gen_random_uuid();
        v_transaction_id := gen_random_uuid();
        v_purchase_amount := 50000 + FLOOR(RANDOM() * 400000)::NUMERIC;

        -- 7.2: purchases
        INSERT INTO purchases (
          id, store_id, org_id, user_id, customer_id, visit_id, purchase_date,
          total_amount, discount_amount, final_amount, payment_method,
          items_count, status, created_at
        ) VALUES (
          v_purchase_id, v_store_id, v_org_id, v_user_id, v_customer_id, v_visit_id,
          v_visit_date,
          v_purchase_amount,
          FLOOR(v_purchase_amount * 0.05)::NUMERIC,
          v_purchase_amount - FLOOR(v_purchase_amount * 0.05)::NUMERIC,
          (ARRAY['card', 'cash', 'mobile'])[1 + FLOOR(RANDOM() * 3)::INT],
          1 + FLOOR(RANDOM() * 3)::INT,
          'completed',
          NOW()
        );
        v_total_purchases := v_total_purchases + 1;

        -- 8.1: transactions
        INSERT INTO transactions (
          id, store_id, org_id, user_id, purchase_id, visit_id, transaction_type,
          transaction_date, amount, status, pos_id, receipt_number, created_at
        ) VALUES (
          v_transaction_id, v_store_id, v_org_id, v_user_id, v_purchase_id, v_visit_id,
          'sale',
          v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL,
          v_purchase_amount - FLOOR(v_purchase_amount * 0.05)::NUMERIC,
          'completed',
          'POS-00' || (1 + FLOOR(RANDOM() * 2)::INT),
          'RCP-' || TO_CHAR(v_visit_date, 'YYYYMMDD') || '-' || LPAD(v_total_transactions::TEXT, 5, '0'),
          NOW()
        );
        v_total_transactions := v_total_transactions + 1;

        -- 8.2: line_items (구매당 1-3개 상품)
        FOR v_j IN 1..(1 + FLOOR(RANDOM() * 3)::INT) LOOP
          v_product_id := v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT];
          INSERT INTO line_items (
            id, store_id, org_id, user_id, purchase_id, product_id, transaction_id,
            quantity, unit_price, discount_amount, line_total, created_at
          ) VALUES (
            gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_purchase_id, v_product_id, v_transaction_id,
            1 + FLOOR(RANDOM() * 2)::INT,
            (SELECT price FROM products WHERE id = v_product_id),
            FLOOR(RANDOM() * 10000)::NUMERIC,
            (SELECT price FROM products WHERE id = v_product_id) * (1 + FLOOR(RANDOM() * 2)::INT),
            NOW()
          );
          v_total_line_items := v_total_line_items + 1;
        END LOOP;
      END IF;

    END LOOP; -- v_i (방문)

    -- 진행상황 출력 (10일마다)
    IF v_day % 10 = 0 THEN
      RAISE NOTICE '    - Day %: visits=%, purchases=%', 90 - v_day, v_total_visits, v_total_purchases;
    END IF;

  END LOOP; -- v_day

  RAISE NOTICE '    ✓ store_visits: % 건', v_total_visits;
  RAISE NOTICE '    ✓ purchases: % 건', v_total_purchases;
  RAISE NOTICE '    ✓ transactions: % 건', v_total_transactions;
  RAISE NOTICE '    ✓ line_items: % 건', v_total_line_items;
  RAISE NOTICE '    ✓ funnel_events: % 건', v_total_funnel_events;
  RAISE NOTICE '    ✓ zone_events: % 건', v_total_zone_events;
  RAISE NOTICE '    ✓ visit_zone_events: % 건', v_total_visit_zone_events;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 9.4: zone_transitions (90일 × ~17 패턴/일)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 9.4] zone_transitions 시딩...';

  FOR v_day IN 0..89 LOOP
    v_visit_date := CURRENT_DATE - v_day;

    -- 주요 전이 패턴 (입구→메인홀, 메인홀→의류, 의류→피팅, 등)
    INSERT INTO zone_transitions (id, store_id, org_id, from_zone_id, to_zone_id, transition_date, transition_count, avg_duration_seconds, created_at) VALUES
    -- 입구(Z001) → 메인홀(Z002)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[1], v_zone_ids[2], v_visit_date, 70 + FLOOR(RANDOM() * 30)::INT, 30 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 메인홀(Z002) → 의류존(Z003)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[3], v_visit_date, 50 + FLOOR(RANDOM() * 25)::INT, 60 + FLOOR(RANDOM() * 120)::INT, NOW()),
    -- 메인홀(Z002) → 액세서리존(Z004)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[4], v_visit_date, 40 + FLOOR(RANDOM() * 20)::INT, 60 + FLOOR(RANDOM() * 90)::INT, NOW()),
    -- 의류존(Z003) → 피팅룸(Z005)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[5], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 120 + FLOOR(RANDOM() * 180)::INT, NOW()),
    -- 피팅룸(Z005) → 의류존(Z003)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[5], v_zone_ids[3], v_visit_date, 20 + FLOOR(RANDOM() * 15)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 의류존(Z003) → 계산대(Z006)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[6], v_visit_date, 30 + FLOOR(RANDOM() * 15)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 액세서리존(Z004) → 계산대(Z006)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[6], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 메인홀(Z002) → 휴식공간(Z007)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[7], v_visit_date, 15 + FLOOR(RANDOM() * 10)::INT, 180 + FLOOR(RANDOM() * 120)::INT, NOW()),
    -- 휴식공간(Z007) → 메인홀(Z002)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[7], v_zone_ids[2], v_visit_date, 12 + FLOOR(RANDOM() * 8)::INT, 120 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 계산대(Z006) → 입구(Z001) (퇴장)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[6], v_zone_ids[1], v_visit_date, 35 + FLOOR(RANDOM() * 20)::INT, 30 + FLOOR(RANDOM() * 30)::INT, NOW()),
    -- 메인홀(Z002) → 입구(Z001) (미구매 퇴장)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[1], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 20 + FLOOR(RANDOM() * 20)::INT, NOW()),
    -- 의류존(Z003) → 액세서리존(Z004)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[4], v_visit_date, 15 + FLOOR(RANDOM() * 10)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 액세서리존(Z004) → 의류존(Z003)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[3], v_visit_date, 10 + FLOOR(RANDOM() * 8)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 피팅룸(Z005) → 계산대(Z006)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[5], v_zone_ids[6], v_visit_date, 18 + FLOOR(RANDOM() * 12)::INT, 60 + FLOOR(RANDOM() * 30)::INT, NOW()),
    -- 휴식공간(Z007) → 의류존(Z003)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[7], v_zone_ids[3], v_visit_date, 8 + FLOOR(RANDOM() * 5)::INT, 120 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 휴식공간(Z007) → 액세서리존(Z004)
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[7], v_zone_ids[4], v_visit_date, 6 + FLOOR(RANDOM() * 4)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    -- 액세서리존(Z004) → 피팅룸(Z005) - 악세서리+의류 조합
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[5], v_visit_date, 5 + FLOOR(RANDOM() * 5)::INT, 120 + FLOOR(RANDOM() * 90)::INT, NOW());
  END LOOP;

  SELECT COUNT(*) INTO v_i FROM zone_transitions WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ zone_transitions: % 건', v_i;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_04 완료: 트랜잭션 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ store_visits: % 건', v_total_visits;
  RAISE NOTICE '  ✓ purchases: % 건', v_total_purchases;
  RAISE NOTICE '  ✓ transactions: % 건', v_total_transactions;
  RAISE NOTICE '  ✓ line_items: % 건', v_total_line_items;
  RAISE NOTICE '  ✓ funnel_events: % 건', v_total_funnel_events;
  RAISE NOTICE '  ✓ zone_events: % 건', v_total_zone_events;
  RAISE NOTICE '  ✓ visit_zone_events: % 건', v_total_visit_zone_events;
  RAISE NOTICE '  ✓ zone_transitions: % 건', v_i;
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'store_visits' as table_name, COUNT(*) as row_count FROM store_visits
UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'line_items', COUNT(*) FROM line_items
UNION ALL SELECT 'funnel_events', COUNT(*) FROM funnel_events
UNION ALL SELECT 'zone_events', COUNT(*) FROM zone_events
UNION ALL SELECT 'visit_zone_events', COUNT(*) FROM visit_zone_events
UNION ALL SELECT 'zone_transitions', COUNT(*) FROM zone_transitions
ORDER BY table_name;
