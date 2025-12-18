-- ============================================================================
-- NEURALTWIN v8.6 SEED_04: 트랜잭션 데이터
-- ============================================================================
-- 실행 순서: SEED_03 이후
-- 목적: store_visits, purchases, transactions, line_items, funnel_events, zone_events, zone_transitions
-- 예상 레코드: ~87,000건
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_zones UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,
    'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID,
    'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID,
    'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  v_products UUID[];
  v_customers UUID[];
  v_count INT;
  v_day INT;
  v_hour INT;
  v_visit_id UUID;
  v_purchase_id UUID;
  v_transaction_id UUID;
  v_customer_id UUID;
  v_product_id UUID;
  v_zone_id UUID;
  v_visit_time TIMESTAMPTZ;
  v_base_date DATE;
  v_daily_visits INT;
  v_purchase_rate NUMERIC;
  v_i INT;
  v_j INT;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_04: 트랜잭션 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();

  -- 고객 및 상품 ID 배열 로드
  SELECT ARRAY_AGG(id) INTO v_customers FROM customers WHERE store_id = v_store_id LIMIT 500;
  SELECT ARRAY_AGG(id) INTO v_products FROM products WHERE store_id = v_store_id;

  v_base_date := CURRENT_DATE - INTERVAL '90 days';

  -- ============================================================================
  -- STEP 7.1: store_visits (~7,500건 = 90일 × ~83건/일)
  -- ============================================================================
  RAISE NOTICE '  [STEP 7.1] store_visits 시딩...';

  FOR v_day IN 0..89 LOOP
    -- 요일별 방문객 수 조정 (주말 더 많음)
    v_daily_visits := CASE EXTRACT(DOW FROM v_base_date + v_day)
      WHEN 0 THEN 100  -- 일요일
      WHEN 6 THEN 110  -- 토요일
      ELSE 70 + (RANDOM() * 20)::INT  -- 평일
    END;

    FOR v_i IN 1..v_daily_visits LOOP
      v_visit_id := gen_random_uuid();
      v_customer_id := v_customers[1 + (RANDOM() * (array_length(v_customers,1) - 1))::INT];
      v_hour := 10 + (RANDOM() * 11)::INT;  -- 10시~21시
      v_visit_time := (v_base_date + v_day)::TIMESTAMP + (v_hour || ' hours')::INTERVAL + ((RANDOM() * 59)::INT || ' minutes')::INTERVAL;

      INSERT INTO store_visits (
        id, store_id, user_id, org_id, customer_id, visit_date, entry_time, exit_time,
        duration_minutes, entry_zone_id, exit_zone_id, device_type, created_at
      ) VALUES (
        v_visit_id, v_store_id, v_user_id, v_org_id, v_customer_id,
        (v_base_date + v_day)::DATE,
        v_visit_time,
        v_visit_time + ((15 + RANDOM() * 45)::INT || ' minutes')::INTERVAL,
        15 + (RANDOM() * 45)::INT,
        v_zones[1],  -- 입구로 입장
        CASE WHEN RANDOM() > 0.5 THEN v_zones[6] ELSE v_zones[1] END,  -- 계산대 또는 입구로 퇴장
        CASE (RANDOM() * 3)::INT WHEN 0 THEN 'mobile' WHEN 1 THEN 'wifi' ELSE 'beacon' END,
        NOW()
      );

      -- 7.2: purchases (~50% 전환율)
      IF RANDOM() < 0.5 THEN
        v_purchase_id := gen_random_uuid();
        INSERT INTO purchases (
          id, store_id, user_id, org_id, customer_id, visit_id, purchase_date,
          total_amount, discount_amount, final_amount, payment_method, status, created_at
        ) VALUES (
          v_purchase_id, v_store_id, v_user_id, v_org_id, v_customer_id, v_visit_id,
          (v_base_date + v_day)::DATE,
          (50000 + RANDOM() * 450000)::NUMERIC(12,2),
          (RANDOM() * 20000)::NUMERIC(12,2),
          (50000 + RANDOM() * 430000)::NUMERIC(12,2),
          CASE (RANDOM() * 3)::INT WHEN 0 THEN 'card' WHEN 1 THEN 'cash' ELSE 'mobile' END,
          'completed',
          NOW()
        );

        -- 8.1: transactions
        v_transaction_id := gen_random_uuid();
        INSERT INTO transactions (
          id, store_id, user_id, org_id, visit_id, purchase_id, transaction_date,
          transaction_type, amount, payment_method, status, created_at
        ) VALUES (
          v_transaction_id, v_store_id, v_user_id, v_org_id, v_visit_id, v_purchase_id,
          v_visit_time + ((RANDOM() * 30)::INT || ' minutes')::INTERVAL,
          'sale',
          (50000 + RANDOM() * 430000)::NUMERIC(12,2),
          CASE (RANDOM() * 3)::INT WHEN 0 THEN 'card' WHEN 1 THEN 'cash' ELSE 'mobile' END,
          'completed',
          NOW()
        );

        -- 8.2: line_items (거래당 1~3개)
        FOR v_j IN 1..(1 + (RANDOM() * 2)::INT) LOOP
          v_product_id := v_products[1 + (RANDOM() * (array_length(v_products,1) - 1))::INT];
          INSERT INTO line_items (
            id, store_id, user_id, org_id, purchase_id, transaction_id, product_id,
            quantity, unit_price, discount_amount, line_total, created_at
          ) VALUES (
            gen_random_uuid(), v_store_id, v_user_id, v_org_id, v_purchase_id, v_transaction_id, v_product_id,
            1 + (RANDOM() * 2)::INT,
            (30000 + RANDOM() * 200000)::NUMERIC(12,2),
            (RANDOM() * 5000)::NUMERIC(12,2),
            (30000 + RANDOM() * 195000)::NUMERIC(12,2),
            NOW()
          );
        END LOOP;
      END IF;

      -- 9.1: funnel_events (방문당 3~5개)
      INSERT INTO funnel_events (store_id, user_id, org_id, customer_id, visit_id, event_type, event_time, zone_id, created_at)
      VALUES
        (v_store_id, v_user_id, v_org_id, v_customer_id, v_visit_id, 'enter', v_visit_time, v_zones[1], NOW()),
        (v_store_id, v_user_id, v_org_id, v_customer_id, v_visit_id, 'browse', v_visit_time + '5 minutes'::INTERVAL, v_zones[2 + (RANDOM()*4)::INT], NOW()),
        (v_store_id, v_user_id, v_org_id, v_customer_id, v_visit_id, 'engage', v_visit_time + '10 minutes'::INTERVAL, v_zones[3], NOW());

      -- 9.2: zone_events (방문당 3~5개 존 방문)
      FOR v_j IN 1..(3 + (RANDOM() * 2)::INT) LOOP
        v_zone_id := v_zones[1 + (RANDOM() * 6)::INT];
        INSERT INTO zone_events (
          store_id, user_id, org_id, zone_id, customer_id, event_type,
          event_time, dwell_time_seconds, created_at
        ) VALUES (
          v_store_id, v_user_id, v_org_id, v_zone_id, v_customer_id, 'zone_enter',
          v_visit_time + ((v_j * 5) || ' minutes')::INTERVAL,
          60 + (RANDOM() * 300)::INT,
          NOW()
        );
      END LOOP;

    END LOOP;

    -- 진행 상황 로그 (10일마다)
    IF v_day % 10 = 0 THEN
      RAISE NOTICE '    Day %/90 완료...', v_day;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM store_visits WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ store_visits: % rows', v_count;

  SELECT COUNT(*) INTO v_count FROM purchases WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ purchases: % rows', v_count;

  SELECT COUNT(*) INTO v_count FROM transactions WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ transactions: % rows', v_count;

  SELECT COUNT(*) INTO v_count FROM line_items WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ line_items: % rows', v_count;

  SELECT COUNT(*) INTO v_count FROM funnel_events WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ funnel_events: % rows', v_count;

  SELECT COUNT(*) INTO v_count FROM zone_events WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ zone_events: % rows', v_count;

  -- ============================================================================
  -- STEP 9.4: zone_transitions (90일 × 17패턴 ≈ 1,530건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 9.4] zone_transitions 시딩...';

  FOR v_day IN 0..89 LOOP
    -- 주요 이동 패턴
    INSERT INTO zone_transitions (store_id, from_zone_id, to_zone_id, transition_date, transition_count, avg_duration_seconds, created_at) VALUES
    (v_store_id, v_zones[1], v_zones[2], (v_base_date + v_day)::DATE, 50 + (RANDOM()*30)::INT, 30 + (RANDOM()*60)::INT, NOW()),  -- 입구→메인홀
    (v_store_id, v_zones[2], v_zones[3], (v_base_date + v_day)::DATE, 40 + (RANDOM()*25)::INT, 45 + (RANDOM()*90)::INT, NOW()),  -- 메인홀→의류존
    (v_store_id, v_zones[2], v_zones[4], (v_base_date + v_day)::DATE, 35 + (RANDOM()*20)::INT, 40 + (RANDOM()*80)::INT, NOW()),  -- 메인홀→액세서리존
    (v_store_id, v_zones[3], v_zones[5], (v_base_date + v_day)::DATE, 20 + (RANDOM()*15)::INT, 60 + (RANDOM()*120)::INT, NOW()), -- 의류존→피팅룸
    (v_store_id, v_zones[5], v_zones[3], (v_base_date + v_day)::DATE, 18 + (RANDOM()*12)::INT, 180 + (RANDOM()*300)::INT, NOW()), -- 피팅룸→의류존
    (v_store_id, v_zones[3], v_zones[6], (v_base_date + v_day)::DATE, 25 + (RANDOM()*15)::INT, 30 + (RANDOM()*60)::INT, NOW()),  -- 의류존→계산대
    (v_store_id, v_zones[4], v_zones[6], (v_base_date + v_day)::DATE, 20 + (RANDOM()*12)::INT, 25 + (RANDOM()*50)::INT, NOW()),  -- 액세서리존→계산대
    (v_store_id, v_zones[6], v_zones[7], (v_base_date + v_day)::DATE, 15 + (RANDOM()*10)::INT, 20 + (RANDOM()*40)::INT, NOW()),  -- 계산대→휴식공간
    (v_store_id, v_zones[7], v_zones[1], (v_base_date + v_day)::DATE, 12 + (RANDOM()*8)::INT, 300 + (RANDOM()*600)::INT, NOW()), -- 휴식공간→입구(퇴장)
    (v_store_id, v_zones[6], v_zones[1], (v_base_date + v_day)::DATE, 30 + (RANDOM()*20)::INT, 60 + (RANDOM()*120)::INT, NOW()), -- 계산대→입구(퇴장)
    (v_store_id, v_zones[2], v_zones[7], (v_base_date + v_day)::DATE, 10 + (RANDOM()*8)::INT, 45 + (RANDOM()*90)::INT, NOW()),   -- 메인홀→휴식공간
    (v_store_id, v_zones[3], v_zones[4], (v_base_date + v_day)::DATE, 15 + (RANDOM()*10)::INT, 35 + (RANDOM()*70)::INT, NOW()),  -- 의류존→액세서리존
    (v_store_id, v_zones[4], v_zones[3], (v_base_date + v_day)::DATE, 12 + (RANDOM()*8)::INT, 30 + (RANDOM()*60)::INT, NOW()),   -- 액세서리존→의류존
    (v_store_id, v_zones[2], v_zones[1], (v_base_date + v_day)::DATE, 8 + (RANDOM()*5)::INT, 20 + (RANDOM()*40)::INT, NOW()),    -- 메인홀→입구(이탈)
    (v_store_id, v_zones[3], v_zones[2], (v_base_date + v_day)::DATE, 25 + (RANDOM()*15)::INT, 40 + (RANDOM()*80)::INT, NOW()),  -- 의류존→메인홀
    (v_store_id, v_zones[4], v_zones[2], (v_base_date + v_day)::DATE, 20 + (RANDOM()*12)::INT, 35 + (RANDOM()*70)::INT, NOW()),  -- 액세서리존→메인홀
    (v_store_id, v_zones[5], v_zones[6], (v_base_date + v_day)::DATE, 8 + (RANDOM()*5)::INT, 25 + (RANDOM()*50)::INT, NOW())     -- 피팅룸→계산대
    ON CONFLICT (store_id, from_zone_id, to_zone_id, transition_date) DO UPDATE SET
      transition_count = EXCLUDED.transition_count,
      avg_duration_seconds = EXCLUDED.avg_duration_seconds;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM zone_transitions WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ zone_transitions: % rows', v_count;

  -- ============================================================================
  -- 완료 리포트
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_04 완료: 트랜잭션 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;
