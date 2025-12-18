-- ============================================================================
-- NEURALTWIN v8.6 SEED_06: 집계 데이터 + 검증
-- ============================================================================
-- 실행 순서: SEED_05 이후 (마지막 스크립트)
-- 목적: daily_kpis_agg, daily_sales, hourly_metrics, zone_daily_metrics, product_performance_agg, customer_segments_agg + 검증
-- 예상 레코드: ~4,500건
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
  v_segments TEXT[] := ARRAY['VIP', 'Regular', 'New', 'Dormant'];
  v_count INT;
  v_day INT;
  v_hour INT;
  v_base_date DATE;
  v_product_id UUID;
  v_zone_id UUID;
  v_daily_revenue NUMERIC;
  v_daily_visitors INT;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_06: 집계 데이터 + 검증';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();

  v_base_date := CURRENT_DATE - INTERVAL '90 days';

  -- ============================================================================
  -- STEP 13.1: daily_kpis_agg (90건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 13.1] daily_kpis_agg 시딩 (90건)...';

  FOR v_day IN 0..89 LOOP
    -- 요일별 변동
    v_daily_visitors := CASE EXTRACT(DOW FROM v_base_date + v_day)
      WHEN 0 THEN 100 + (RANDOM() * 30)::INT  -- 일요일
      WHEN 6 THEN 110 + (RANDOM() * 35)::INT  -- 토요일
      ELSE 70 + (RANDOM() * 25)::INT          -- 평일
    END;
    v_daily_revenue := v_daily_visitors * (120000 + RANDOM() * 60000);

    INSERT INTO daily_kpis_agg (
      id, store_id, user_id, org_id, kpi_date,
      total_visitors, total_transactions, total_revenue, avg_transaction_value,
      conversion_rate, avg_dwell_time_minutes, peak_hour, peak_hour_visitors,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      (v_base_date + v_day)::DATE,
      v_daily_visitors,
      (v_daily_visitors * (0.4 + RANDOM() * 0.2))::INT,
      v_daily_revenue,
      v_daily_revenue / GREATEST((v_daily_visitors * 0.5)::INT, 1),
      (30 + RANDOM() * 20)::NUMERIC(5,2),
      (25 + RANDOM() * 20)::NUMERIC(5,2),
      14 + (RANDOM() * 4)::INT,
      (v_daily_visitors * 0.15)::INT,
      NOW(), NOW()
    );
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM daily_kpis_agg WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ daily_kpis_agg: % rows', v_count;

  -- ============================================================================
  -- STEP 13.2: daily_sales (90건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 13.2] daily_sales 시딩 (90건)...';

  FOR v_day IN 0..89 LOOP
    v_daily_revenue := (3000000 + RANDOM() * 5000000)::NUMERIC(12,2);

    INSERT INTO daily_sales (
      id, store_id, user_id, org_id, sale_date,
      gross_sales, net_sales, discount_total, refund_total,
      transaction_count, items_sold, avg_basket_size,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      (v_base_date + v_day)::DATE,
      v_daily_revenue,
      v_daily_revenue * 0.92,
      v_daily_revenue * 0.05,
      v_daily_revenue * 0.03,
      (30 + RANDOM() * 50)::INT,
      (80 + RANDOM() * 120)::INT,
      (1.8 + RANDOM() * 1.2)::NUMERIC(4,2),
      NOW(), NOW()
    );
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM daily_sales WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ daily_sales: % rows', v_count;

  -- ============================================================================
  -- STEP 13.3: hourly_metrics (90일 × 12시간 = 1,080건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 13.3] hourly_metrics 시딩 (1,080건)...';

  FOR v_day IN 0..89 LOOP
    FOR v_hour IN 10..21 LOOP
      INSERT INTO hourly_metrics (
        id, store_id, user_id, org_id, metric_date, hour_of_day,
        visitor_count, transaction_count, revenue, avg_dwell_time,
        created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_user_id, v_org_id,
        (v_base_date + v_day)::DATE, v_hour,
        CASE
          WHEN v_hour BETWEEN 14 AND 17 THEN (10 + RANDOM() * 15)::INT  -- 피크타임
          WHEN v_hour BETWEEN 10 AND 12 THEN (5 + RANDOM() * 8)::INT    -- 오전
          ELSE (8 + RANDOM() * 10)::INT                                  -- 저녁
        END,
        (2 + RANDOM() * 8)::INT,
        (200000 + RANDOM() * 500000)::NUMERIC(12,2),
        (20 + RANDOM() * 25)::NUMERIC(5,2),
        NOW()
      );
    END LOOP;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM hourly_metrics WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ hourly_metrics: % rows', v_count;

  -- ============================================================================
  -- STEP 14.1: zone_daily_metrics (90일 × 7존 = 630건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 14.1] zone_daily_metrics 시딩 (630건)...';

  FOR v_day IN 0..89 LOOP
    FOR v_zone_id IN SELECT unnest(v_zones) LOOP
      INSERT INTO zone_daily_metrics (
        id, store_id, user_id, org_id, zone_id, metric_date,
        visitor_count, unique_visitors, avg_dwell_time_seconds, max_dwell_time_seconds,
        entry_count, exit_count, conversion_rate,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_user_id, v_org_id, v_zone_id,
        (v_base_date + v_day)::DATE,
        (50 + RANDOM() * 80)::INT,
        (40 + RANDOM() * 60)::INT,
        (120 + RANDOM() * 300)::INT,
        (600 + RANDOM() * 1200)::INT,
        (45 + RANDOM() * 70)::INT,
        (40 + RANDOM() * 65)::INT,
        (25 + RANDOM() * 30)::NUMERIC(5,2),
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM zone_daily_metrics WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ zone_daily_metrics: % rows', v_count;

  -- ============================================================================
  -- STEP 14.2: product_performance_agg (90일 × 25상품 = 2,250건, 샘플링)
  -- ============================================================================
  RAISE NOTICE '  [STEP 14.2] product_performance_agg 시딩...';

  FOR v_day IN 0..89 LOOP
    IF v_day % 3 = 0 THEN  -- 3일마다 샘플링 (30일분 × 25상품 = 750건)
      FOR v_product_id IN SELECT id FROM products WHERE store_id = v_store_id LOOP
        INSERT INTO product_performance_agg (
          id, store_id, user_id, org_id, product_id, metric_date,
          view_count, add_to_cart_count, purchase_count, revenue,
          conversion_rate, avg_time_to_purchase_minutes,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_user_id, v_org_id, v_product_id,
          (v_base_date + v_day)::DATE,
          (20 + RANDOM() * 50)::INT,
          (5 + RANDOM() * 15)::INT,
          (1 + RANDOM() * 8)::INT,
          (50000 + RANDOM() * 300000)::NUMERIC(12,2),
          (15 + RANDOM() * 25)::NUMERIC(5,2),
          (10 + RANDOM() * 30)::NUMERIC(5,2),
          NOW(), NOW()
        );
      END LOOP;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM product_performance_agg WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ product_performance_agg: % rows', v_count;

  -- ============================================================================
  -- STEP 14.3: customer_segments_agg (90일 × 4세그먼트 = 360건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 14.3] customer_segments_agg 시딩 (360건)...';

  FOR v_day IN 0..89 LOOP
    INSERT INTO customer_segments_agg (
      id, store_id, user_id, org_id, segment_name, metric_date,
      customer_count, visit_count, transaction_count, total_revenue, avg_order_value,
      created_at, updated_at
    ) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'VIP', (v_base_date + v_day)::DATE,
     250, (50 + RANDOM()*30)::INT, (30 + RANDOM()*20)::INT, (2000000 + RANDOM()*1500000)::NUMERIC(12,2), (250000 + RANDOM()*100000)::NUMERIC(12,2), NOW(), NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Regular', (v_base_date + v_day)::DATE,
     1250, (100 + RANDOM()*50)::INT, (50 + RANDOM()*30)::INT, (3000000 + RANDOM()*2000000)::NUMERIC(12,2), (120000 + RANDOM()*50000)::NUMERIC(12,2), NOW(), NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'New', (v_base_date + v_day)::DATE,
     750, (30 + RANDOM()*20)::INT, (15 + RANDOM()*10)::INT, (800000 + RANDOM()*500000)::NUMERIC(12,2), (80000 + RANDOM()*40000)::NUMERIC(12,2), NOW(), NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Dormant', (v_base_date + v_day)::DATE,
     250, (5 + RANDOM()*5)::INT, (2 + RANDOM()*3)::INT, (200000 + RANDOM()*150000)::NUMERIC(12,2), (100000 + RANDOM()*50000)::NUMERIC(12,2), NOW(), NOW());
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM customer_segments_agg WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ customer_segments_agg: % rows', v_count;

  -- ============================================================================
  -- 완료 리포트
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_06 완료: 집계 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- STEP 15: 전체 검증 쿼리
-- ============================================================================
\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  NEURALTWIN v8.6 전체 시딩 검증'
\echo '════════════════════════════════════════════════════════════════════════════'

SELECT '=== 테이블별 레코드 수 ===' as info;

SELECT 'zones_dim' as table_name, COUNT(*) as count FROM zones_dim WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'customers', COUNT(*) FROM customers WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'staff', COUNT(*) FROM staff WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'furniture', COUNT(*) FROM furniture WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'furniture_slots', COUNT(*) FROM furniture_slots WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'products', COUNT(*) FROM products WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'product_placements', COUNT(*) FROM product_placements WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'store_visits', COUNT(*) FROM store_visits WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'purchases', COUNT(*) FROM purchases WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'line_items', COUNT(*) FROM line_items WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'funnel_events', COUNT(*) FROM funnel_events WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'zone_events', COUNT(*) FROM zone_events WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'zone_transitions', COUNT(*) FROM zone_transitions WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'graph_entities', COUNT(*) FROM graph_entities WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'graph_relations', COUNT(*) FROM graph_relations WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'applied_strategies', COUNT(*) FROM applied_strategies WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'daily_kpis_agg', COUNT(*) FROM daily_kpis_agg WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'daily_sales', COUNT(*) FROM daily_sales WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'hourly_metrics', COUNT(*) FROM hourly_metrics WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'zone_daily_metrics', COUNT(*) FROM zone_daily_metrics WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL SELECT 'customer_segments_agg', COUNT(*) FROM customer_segments_agg WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY table_name;

SELECT '=== FK 무결성 검증 ===' as info;

-- FK 무결성 확인 (orphan 레코드 없어야 함)
SELECT 'purchases→store_visits' as fk_check, COUNT(*) as orphans
FROM purchases p
LEFT JOIN store_visits sv ON p.visit_id = sv.id
WHERE p.store_id = 'd9830554-2688-4032-af40-acccda787ac4' AND sv.id IS NULL AND p.visit_id IS NOT NULL
UNION ALL
SELECT 'line_items→products', COUNT(*)
FROM line_items li
LEFT JOIN products pr ON li.product_id = pr.id
WHERE li.store_id = 'd9830554-2688-4032-af40-acccda787ac4' AND pr.id IS NULL
UNION ALL
SELECT 'furniture_slots→furniture', COUNT(*)
FROM furniture_slots fs
LEFT JOIN furniture f ON fs.furniture_id = f.id
WHERE fs.store_id = 'd9830554-2688-4032-af40-acccda787ac4' AND f.id IS NULL;

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  검증 완료!'
\echo '════════════════════════════════════════════════════════════════════════════'
