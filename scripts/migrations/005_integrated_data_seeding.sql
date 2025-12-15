-- ============================================================================
-- NEURALTWIN 통합 데이터 시딩 v5.0
-- ============================================================================
-- 목표: 모든 데이터 연결이 완전한 90일치 정합성 있는 데이터셋
--
-- 실행 순서:
--   STEP 1: 변수 및 기존 데이터 확인
--   STEP 2: purchases 테이블 시딩 (line_items 기반)
--   STEP 3: line_items.customer_id 연결
--   STEP 4: visits 테이블 90일 확장
--   STEP 5: daily_kpis_agg 재계산
--   STEP 6: graph_relations 시딩
--   STEP 7: 검증 및 통계
-- ============================================================================

-- ============================================================================
-- STEP 1: 변수 설정 및 기존 데이터 확인
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_line_items_count INT;
  v_customers_count INT;
  v_products_count INT;
  v_visits_count INT;
  v_zones_count INT;
BEGIN
  -- 기본 매장 정보 조회 (첫 번째 매장 사용)
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No stores found. Please seed stores first.';
  END IF;

  -- 기존 데이터 현황 확인
  SELECT COUNT(*) INTO v_line_items_count FROM line_items WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_customers_count FROM customers WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_products_count FROM products WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_visits_count FROM visits WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_zones_count FROM zones_dim WHERE store_id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 1: 기존 데이터 현황';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Store ID: %', v_store_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Org ID: %', v_org_id;
  RAISE NOTICE 'Line Items: %', v_line_items_count;
  RAISE NOTICE 'Customers: %', v_customers_count;
  RAISE NOTICE 'Products: %', v_products_count;
  RAISE NOTICE 'Visits: %', v_visits_count;
  RAISE NOTICE 'Zones: %', v_zones_count;
END $$;


-- ============================================================================
-- STEP 2: purchases 테이블 시딩
-- ============================================================================
-- line_items의 transaction_id 기준으로 purchases 레코드 생성

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_count INT;
  v_inserted INT := 0;
  rec RECORD;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 기존 purchases 확인
  SELECT COUNT(*) INTO v_count FROM purchases WHERE store_id = v_store_id;

  IF v_count > 0 THEN
    RAISE NOTICE 'STEP 2 스킵: purchases 이미 % 건 존재', v_count;
  ELSE
    RAISE NOTICE 'STEP 2: purchases 생성 시작...';

    -- line_items의 각 고유 transaction_id에 대해 purchase 생성
    FOR rec IN
      SELECT
        transaction_id,
        MIN(transaction_date) as purchase_date,
        SUM(line_total) as total_amount,
        COUNT(*) as item_count
      FROM line_items
      WHERE store_id = v_store_id
      GROUP BY transaction_id
    LOOP
      INSERT INTO purchases (
        id, user_id, org_id, store_id, customer_id, visit_id,
        product_id, purchase_date, quantity, unit_price, total_price, created_at
      )
      SELECT
        gen_random_uuid(),
        v_user_id,
        v_org_id,
        v_store_id,
        -- 랜덤 고객 할당
        (SELECT id FROM customers WHERE store_id = v_store_id ORDER BY random() LIMIT 1),
        -- 해당 날짜 근처의 방문 연결 시도
        (SELECT id FROM visits
         WHERE store_id = v_store_id
           AND DATE(visit_date) = rec.purchase_date
         ORDER BY random() LIMIT 1),
        -- 대표 상품 (첫 번째 라인아이템)
        (SELECT product_id FROM line_items
         WHERE transaction_id = rec.transaction_id AND store_id = v_store_id
         LIMIT 1),
        rec.purchase_date::timestamptz,
        rec.item_count,
        rec.total_amount / NULLIF(rec.item_count, 0),
        rec.total_amount,
        NOW();

      v_inserted := v_inserted + 1;
    END LOOP;

    RAISE NOTICE 'STEP 2 완료: purchases % 건 생성됨', v_inserted;
  END IF;
END $$;


-- ============================================================================
-- STEP 3: line_items.customer_id 및 purchase_id 연결
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_updated INT := 0;
  v_null_customer_count INT;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;

  -- customer_id가 NULL인 line_items 개수 확인
  SELECT COUNT(*) INTO v_null_customer_count
  FROM line_items
  WHERE store_id = v_store_id AND customer_id IS NULL;

  IF v_null_customer_count = 0 THEN
    RAISE NOTICE 'STEP 3 스킵: 모든 line_items에 customer_id 존재';
  ELSE
    RAISE NOTICE 'STEP 3: line_items customer_id 연결 시작 (% 건)...', v_null_customer_count;

    -- purchase_id 연결
    UPDATE line_items li
    SET purchase_id = p.id
    FROM purchases p
    WHERE li.store_id = v_store_id
      AND p.store_id = v_store_id
      AND DATE(p.purchase_date) = li.transaction_date
      AND li.purchase_id IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'purchase_id 연결: % 건', v_updated;

    -- customer_id 연결 (purchases에서 또는 랜덤 할당)
    UPDATE line_items li
    SET customer_id = COALESCE(
      (SELECT p.customer_id FROM purchases p WHERE p.id = li.purchase_id),
      (SELECT c.id FROM customers c WHERE c.store_id = v_store_id ORDER BY random() LIMIT 1)
    )
    WHERE li.store_id = v_store_id
      AND li.customer_id IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'STEP 3 완료: customer_id % 건 연결됨', v_updated;
  END IF;
END $$;


-- ============================================================================
-- STEP 4: visits 테이블 90일 확장
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_min_date DATE;
  v_target_start DATE;
  v_current_date DATE;
  v_inserted INT := 0;
  v_existing_count INT;
  v_daily_visits INT;
  v_customer_ids UUID[];
  v_zone_names TEXT[];
  i INT;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 현재 visits 날짜 범위 확인
  SELECT MIN(DATE(visit_date)), COUNT(*) INTO v_min_date, v_existing_count
  FROM visits WHERE store_id = v_store_id;

  -- 90일 전 날짜 계산
  v_target_start := CURRENT_DATE - INTERVAL '90 days';

  IF v_min_date <= v_target_start THEN
    RAISE NOTICE 'STEP 4 스킵: visits 이미 90일 이상 데이터 존재 (최소 날짜: %)', v_min_date;
  ELSE
    RAISE NOTICE 'STEP 4: visits 확장 시작 (% → % 까지)...', v_target_start, v_min_date - 1;

    -- 고객 ID 배열 준비
    SELECT ARRAY_AGG(id) INTO v_customer_ids
    FROM customers WHERE store_id = v_store_id;

    -- 존 이름 배열 준비
    SELECT ARRAY_AGG(zone_name) INTO v_zone_names
    FROM zones_dim WHERE store_id = v_store_id;

    -- 누락된 날짜에 대해 방문 데이터 생성
    v_current_date := v_target_start;
    WHILE v_current_date < COALESCE(v_min_date, CURRENT_DATE) LOOP
      -- 요일에 따른 방문자 수 결정 (주말 더 많음)
      v_daily_visits := CASE EXTRACT(DOW FROM v_current_date)
        WHEN 0 THEN 45 + (random() * 20)::INT  -- 일요일
        WHEN 6 THEN 50 + (random() * 25)::INT  -- 토요일
        ELSE 30 + (random() * 15)::INT         -- 평일
      END;

      -- 해당 일자의 방문 레코드 생성
      FOR i IN 1..v_daily_visits LOOP
        INSERT INTO visits (
          id, user_id, org_id, store_id, customer_id,
          visit_date, duration_minutes, zones_visited, created_at
        ) VALUES (
          gen_random_uuid(),
          v_user_id,
          v_org_id,
          v_store_id,
          v_customer_ids[1 + (random() * (array_length(v_customer_ids, 1) - 1))::INT],
          (v_current_date + (TIME '09:00:00' + (random() * INTERVAL '10 hours')))::timestamptz,
          5 + (random() * 55)::INT,  -- 5-60분
          ARRAY[
            v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT],
            v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT]
          ],
          NOW()
        );
        v_inserted := v_inserted + 1;
      END LOOP;

      v_current_date := v_current_date + 1;
    END LOOP;

    RAISE NOTICE 'STEP 4 완료: visits % 건 추가됨', v_inserted;
  END IF;
END $$;


-- ============================================================================
-- STEP 5: daily_kpis_agg 재계산 (line_items 기반)
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_deleted INT;
  v_inserted INT;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  RAISE NOTICE 'STEP 5: daily_kpis_agg 재계산 시작...';

  -- 기존 데이터 삭제
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '기존 daily_kpis_agg % 건 삭제', v_deleted;

  -- line_items + visits 기반으로 재계산
  INSERT INTO daily_kpis_agg (
    date, store_id, org_id,
    total_visitors, unique_visitors, returning_visitors,
    total_transactions, total_revenue, avg_transaction_value,
    conversion_rate, avg_visit_duration_seconds, sales_per_sqm,
    weather_condition, is_holiday
  )
  SELECT
    COALESCE(li.transaction_date, DATE(v.visit_date)) as date,
    v_store_id,
    v_org_id,
    -- 방문자 수
    COALESCE(visitor_stats.total_visitors, 0),
    COALESCE(visitor_stats.unique_visitors, 0),
    GREATEST(0, COALESCE(visitor_stats.total_visitors, 0) - COALESCE(visitor_stats.unique_visitors, 0)),
    -- 거래 수
    COALESCE(sales_stats.total_transactions, 0),
    COALESCE(sales_stats.total_revenue, 0),
    CASE WHEN sales_stats.total_transactions > 0
         THEN sales_stats.total_revenue / sales_stats.total_transactions
         ELSE 0 END,
    -- 전환율
    CASE WHEN visitor_stats.total_visitors > 0
         THEN (sales_stats.total_transactions::FLOAT / visitor_stats.total_visitors * 100)
         ELSE 0 END,
    -- 평균 체류 시간 (초)
    COALESCE(visitor_stats.avg_duration_seconds, 0),
    -- 평방미터당 매출
    COALESCE(sales_stats.total_revenue, 0) / NULLIF((SELECT floor_area_sqm FROM stores WHERE id = v_store_id), 0),
    -- 날씨/휴일 (weather_data에서 조회 또는 기본값)
    COALESCE(
      (SELECT w.weather_condition FROM weather_data w
       WHERE w.store_id = v_store_id AND w.date = COALESCE(li.transaction_date, DATE(v.visit_date))
       LIMIT 1),
      'sunny'
    ),
    FALSE
  FROM (
    -- 모든 날짜 생성 (90일)
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '90 days',
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as date
  ) dates
  LEFT JOIN LATERAL (
    -- 해당 날짜의 판매 통계
    SELECT
      li2.transaction_date,
      COUNT(DISTINCT li2.transaction_id) as total_transactions,
      SUM(li2.line_total) as total_revenue
    FROM line_items li2
    WHERE li2.store_id = v_store_id
      AND li2.transaction_date = dates.date
    GROUP BY li2.transaction_date
  ) sales_stats ON TRUE
  LEFT JOIN LATERAL (
    -- 해당 날짜의 방문자 통계
    SELECT
      DATE(v2.visit_date) as visit_date,
      COUNT(*) as total_visitors,
      COUNT(DISTINCT v2.customer_id) as unique_visitors,
      AVG(v2.duration_minutes * 60) as avg_duration_seconds
    FROM visits v2
    WHERE v2.store_id = v_store_id
      AND DATE(v2.visit_date) = dates.date
    GROUP BY DATE(v2.visit_date)
  ) visitor_stats ON TRUE
  LEFT JOIN line_items li ON li.store_id = v_store_id AND li.transaction_date = dates.date
  LEFT JOIN visits v ON v.store_id = v_store_id AND DATE(v.visit_date) = dates.date
  WHERE COALESCE(li.transaction_date, DATE(v.visit_date)) IS NOT NULL
  GROUP BY
    COALESCE(li.transaction_date, DATE(v.visit_date)),
    visitor_stats.total_visitors, visitor_stats.unique_visitors, visitor_stats.avg_duration_seconds,
    sales_stats.total_transactions, sales_stats.total_revenue;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'STEP 5 완료: daily_kpis_agg % 건 생성됨', v_inserted;
END $$;


-- ============================================================================
-- STEP 6: graph_relations 시딩
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_existing_count INT;
  v_inserted INT := 0;
  v_entity RECORD;
  v_other_entity RECORD;
  v_relation_type_id UUID;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 기존 relations 확인
  SELECT COUNT(*) INTO v_existing_count
  FROM graph_relations WHERE store_id = v_store_id;

  IF v_existing_count > 0 THEN
    RAISE NOTICE 'STEP 6 스킵: graph_relations 이미 % 건 존재', v_existing_count;
  ELSE
    RAISE NOTICE 'STEP 6: graph_relations 생성 시작...';

    -- 1. Zone contains Product 관계
    SELECT id INTO v_relation_type_id
    FROM ontology_relation_types
    WHERE name = 'contains'
      AND (user_id IS NULL OR user_id = v_user_id)
    LIMIT 1;

    IF v_relation_type_id IS NOT NULL THEN
      FOR v_entity IN
        SELECT ge.id, ge.name, et.name as type_name
        FROM graph_entities ge
        JOIN ontology_entity_types et ON ge.entity_type_id = et.id
        WHERE ge.store_id = v_store_id
          AND et.name IN ('Zone', 'DisplayZone', 'CheckoutZone')
      LOOP
        -- 각 존에 랜덤 엔티티 연결
        FOR v_other_entity IN
          SELECT ge2.id
          FROM graph_entities ge2
          JOIN ontology_entity_types et2 ON ge2.entity_type_id = et2.id
          WHERE ge2.store_id = v_store_id
            AND et2.name IN ('Product', 'Furniture', 'Display', 'Shelf')
            AND ge2.id != v_entity.id
          ORDER BY random()
          LIMIT 3
        LOOP
          INSERT INTO graph_relations (
            id, user_id, org_id, store_id,
            relation_type_id, source_entity_id, target_entity_id,
            properties, weight, created_at
          ) VALUES (
            gen_random_uuid(), v_user_id, v_org_id, v_store_id,
            v_relation_type_id, v_entity.id, v_other_entity.id,
            '{"auto_generated": true}'::jsonb, 1.0, NOW()
          );
          v_inserted := v_inserted + 1;
        END LOOP;
      END LOOP;
    END IF;

    -- 2. Product related_to Product 관계 (연관 상품)
    SELECT id INTO v_relation_type_id
    FROM ontology_relation_types
    WHERE name = 'related_to'
      AND (user_id IS NULL OR user_id = v_user_id)
    LIMIT 1;

    IF v_relation_type_id IS NOT NULL THEN
      FOR v_entity IN
        SELECT ge.id
        FROM graph_entities ge
        JOIN ontology_entity_types et ON ge.entity_type_id = et.id
        WHERE ge.store_id = v_store_id
          AND et.name = 'Product'
        LIMIT 20
      LOOP
        FOR v_other_entity IN
          SELECT ge2.id
          FROM graph_entities ge2
          JOIN ontology_entity_types et2 ON ge2.entity_type_id = et2.id
          WHERE ge2.store_id = v_store_id
            AND et2.name = 'Product'
            AND ge2.id != v_entity.id
          ORDER BY random()
          LIMIT 2
        LOOP
          INSERT INTO graph_relations (
            id, user_id, org_id, store_id,
            relation_type_id, source_entity_id, target_entity_id,
            properties, weight, created_at
          ) VALUES (
            gen_random_uuid(), v_user_id, v_org_id, v_store_id,
            v_relation_type_id, v_entity.id, v_other_entity.id,
            '{"relationship": "frequently_bought_together", "confidence": 0.85}'::jsonb,
            0.8 + (random() * 0.2),
            NOW()
          );
          v_inserted := v_inserted + 1;
        END LOOP;
      END LOOP;
    END IF;

    -- 3. Customer visits Zone 관계
    SELECT id INTO v_relation_type_id
    FROM ontology_relation_types
    WHERE name IN ('visits', 'interacts_with')
      AND (user_id IS NULL OR user_id = v_user_id)
    LIMIT 1;

    IF v_relation_type_id IS NOT NULL THEN
      FOR v_entity IN
        SELECT ge.id
        FROM graph_entities ge
        JOIN ontology_entity_types et ON ge.entity_type_id = et.id
        WHERE ge.store_id = v_store_id
          AND et.name = 'Customer'
        LIMIT 50
      LOOP
        FOR v_other_entity IN
          SELECT ge2.id
          FROM graph_entities ge2
          JOIN ontology_entity_types et2 ON ge2.entity_type_id = et2.id
          WHERE ge2.store_id = v_store_id
            AND et2.name IN ('Zone', 'DisplayZone')
          ORDER BY random()
          LIMIT 3
        LOOP
          INSERT INTO graph_relations (
            id, user_id, org_id, store_id,
            relation_type_id, source_entity_id, target_entity_id,
            properties, weight, created_at
          ) VALUES (
            gen_random_uuid(), v_user_id, v_org_id, v_store_id,
            v_relation_type_id, v_entity.id, v_other_entity.id,
            jsonb_build_object(
              'visit_count', (1 + (random() * 10)::INT),
              'avg_dwell_time_seconds', (30 + (random() * 300)::INT)
            ),
            0.5 + (random() * 0.5),
            NOW()
          );
          v_inserted := v_inserted + 1;
        END LOOP;
      END LOOP;
    END IF;

    -- 4. Staff assigned_to Zone 관계
    SELECT id INTO v_relation_type_id
    FROM ontology_relation_types
    WHERE name IN ('assigned_to', 'manages')
      AND (user_id IS NULL OR user_id = v_user_id)
    LIMIT 1;

    IF v_relation_type_id IS NOT NULL THEN
      FOR v_entity IN
        SELECT ge.id
        FROM graph_entities ge
        JOIN ontology_entity_types et ON ge.entity_type_id = et.id
        WHERE ge.store_id = v_store_id
          AND et.name = 'Staff'
      LOOP
        FOR v_other_entity IN
          SELECT ge2.id
          FROM graph_entities ge2
          JOIN ontology_entity_types et2 ON ge2.entity_type_id = et2.id
          WHERE ge2.store_id = v_store_id
            AND et2.name IN ('Zone', 'CheckoutZone', 'DisplayZone')
          ORDER BY random()
          LIMIT 2
        LOOP
          INSERT INTO graph_relations (
            id, user_id, org_id, store_id,
            relation_type_id, source_entity_id, target_entity_id,
            properties, weight, created_at
          ) VALUES (
            gen_random_uuid(), v_user_id, v_org_id, v_store_id,
            v_relation_type_id, v_entity.id, v_other_entity.id,
            '{"role": "primary", "shift": "morning"}'::jsonb,
            1.0,
            NOW()
          );
          v_inserted := v_inserted + 1;
        END LOOP;
      END LOOP;
    END IF;

    -- 5. Furniture located_in Zone 관계
    SELECT id INTO v_relation_type_id
    FROM ontology_relation_types
    WHERE name IN ('located_in', 'placed_in')
      AND (user_id IS NULL OR user_id = v_user_id)
    LIMIT 1;

    IF v_relation_type_id IS NOT NULL THEN
      FOR v_entity IN
        SELECT ge.id
        FROM graph_entities ge
        JOIN ontology_entity_types et ON ge.entity_type_id = et.id
        WHERE ge.store_id = v_store_id
          AND et.name IN ('Furniture', 'Shelf', 'Display', 'Table', 'Counter')
        LIMIT 30
      LOOP
        FOR v_other_entity IN
          SELECT ge2.id
          FROM graph_entities ge2
          JOIN ontology_entity_types et2 ON ge2.entity_type_id = et2.id
          WHERE ge2.store_id = v_store_id
            AND et2.name IN ('Zone', 'DisplayZone', 'StorageZone')
          ORDER BY random()
          LIMIT 1
        LOOP
          INSERT INTO graph_relations (
            id, user_id, org_id, store_id,
            relation_type_id, source_entity_id, target_entity_id,
            properties, weight, created_at
          ) VALUES (
            gen_random_uuid(), v_user_id, v_org_id, v_store_id,
            v_relation_type_id, v_entity.id, v_other_entity.id,
            '{"permanent": true}'::jsonb,
            1.0,
            NOW()
          );
          v_inserted := v_inserted + 1;
        END LOOP;
      END LOOP;
    END IF;

    RAISE NOTICE 'STEP 6 완료: graph_relations % 건 생성됨', v_inserted;
  END IF;
END $$;


-- ============================================================================
-- STEP 7: zone_daily_metrics 확장 (90일)
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_min_date DATE;
  v_target_start DATE;
  v_inserted INT := 0;
  v_zone RECORD;
  v_current_date DATE;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 현재 zone_daily_metrics 날짜 범위 확인
  SELECT MIN(date) INTO v_min_date
  FROM zone_daily_metrics WHERE store_id = v_store_id;

  v_target_start := CURRENT_DATE - INTERVAL '90 days';

  IF v_min_date IS NOT NULL AND v_min_date <= v_target_start THEN
    RAISE NOTICE 'STEP 7 스킵: zone_daily_metrics 이미 90일 이상 데이터 존재';
  ELSE
    RAISE NOTICE 'STEP 7: zone_daily_metrics 확장 시작...';

    FOR v_zone IN SELECT id, zone_name FROM zones_dim WHERE store_id = v_store_id LOOP
      v_current_date := v_target_start;
      WHILE v_current_date < COALESCE(v_min_date, CURRENT_DATE) LOOP
        INSERT INTO zone_daily_metrics (
          id, store_id, org_id, zone_id, date,
          visitor_count, avg_dwell_time, conversion_rate, revenue,
          created_at
        ) VALUES (
          gen_random_uuid(),
          v_store_id,
          v_org_id,
          v_zone.id,
          v_current_date,
          50 + (random() * 150)::INT,
          30 + (random() * 180)::INT,
          0.05 + (random() * 0.15),
          100000 + (random() * 500000)::INT,
          NOW()
        )
        ON CONFLICT DO NOTHING;

        v_inserted := v_inserted + 1;
        v_current_date := v_current_date + 1;
      END LOOP;
    END LOOP;

    RAISE NOTICE 'STEP 7 완료: zone_daily_metrics % 건 추가됨', v_inserted;
  END IF;
END $$;


-- ============================================================================
-- STEP 8: 최종 검증 및 통계
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_purchases_count INT;
  v_line_items_with_customer INT;
  v_line_items_with_purchase INT;
  v_visits_count INT;
  v_visits_date_range TEXT;
  v_daily_kpis_count INT;
  v_daily_kpis_revenue NUMERIC;
  v_line_items_revenue NUMERIC;
  v_graph_relations_count INT;
  v_zone_metrics_count INT;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 통계 수집
  SELECT COUNT(*) INTO v_purchases_count FROM purchases WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_line_items_with_customer FROM line_items WHERE store_id = v_store_id AND customer_id IS NOT NULL;
  SELECT COUNT(*) INTO v_line_items_with_purchase FROM line_items WHERE store_id = v_store_id AND purchase_id IS NOT NULL;
  SELECT COUNT(*), MIN(DATE(visit_date))::TEXT || ' ~ ' || MAX(DATE(visit_date))::TEXT
    INTO v_visits_count, v_visits_date_range FROM visits WHERE store_id = v_store_id;
  SELECT COUNT(*), SUM(total_revenue) INTO v_daily_kpis_count, v_daily_kpis_revenue FROM daily_kpis_agg WHERE store_id = v_store_id;
  SELECT SUM(line_total) INTO v_line_items_revenue FROM line_items WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_graph_relations_count FROM graph_relations WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_zone_metrics_count FROM zone_daily_metrics WHERE store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '최종 데이터 현황';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'purchases: % 건', v_purchases_count;
  RAISE NOTICE 'line_items with customer_id: % 건', v_line_items_with_customer;
  RAISE NOTICE 'line_items with purchase_id: % 건', v_line_items_with_purchase;
  RAISE NOTICE 'visits: % 건 (%)', v_visits_count, v_visits_date_range;
  RAISE NOTICE 'daily_kpis_agg: % 건 (총 매출: %)', v_daily_kpis_count, v_daily_kpis_revenue;
  RAISE NOTICE 'line_items 총 매출: %', v_line_items_revenue;
  RAISE NOTICE 'graph_relations: % 건', v_graph_relations_count;
  RAISE NOTICE 'zone_daily_metrics: % 건', v_zone_metrics_count;
  RAISE NOTICE '';

  -- 정합성 검증
  IF ABS(COALESCE(v_daily_kpis_revenue, 0) - COALESCE(v_line_items_revenue, 0)) < 1000 THEN
    RAISE NOTICE '✅ 매출 정합성: daily_kpis_agg ↔ line_items 일치';
  ELSE
    RAISE NOTICE '⚠️ 매출 차이: % 원', ABS(COALESCE(v_daily_kpis_revenue, 0) - COALESCE(v_line_items_revenue, 0));
  END IF;

  IF v_graph_relations_count > 0 THEN
    RAISE NOTICE '✅ 온톨로지 관계 생성 완료';
  ELSE
    RAISE NOTICE '⚠️ graph_relations 미생성 (relation_types 확인 필요)';
  END IF;

  RAISE NOTICE '====================================';
END $$;
