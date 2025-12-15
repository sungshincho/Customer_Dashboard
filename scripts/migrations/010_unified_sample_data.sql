-- ============================================================================
-- NEURALTWIN 통합 샘플 데이터셋 v6.0 - 완전 일관성 버전
-- ============================================================================
-- v4.0 마스터 데이터 구조 + v5.0 데이터 일관성 로직 통합
-- 모든 데이터가 한번에 생성되며, 테이블 간 수학적 일관성 보장
--
-- 생성 데이터:
--   • stores: 1건
--   • zones_dim: 7건
--   • products: 25건
--   • customers: 500건
--   • store_visits: ~1,250건 (25% 재방문률)
--   • daily_kpis_agg: 90건
--   • zone_daily_metrics: 630건
--   • hourly_metrics: 1,080건
--   • zone_events: ~5,000건
--   • funnel_events: ~6,000건 (store_visits 기반)
--   • purchases: ~175건 (14% 전환율)
--   • line_items: ~350건
--   • product_performance_agg: 2,250건
--   • customer_segments_agg: 540건
--   • applied_strategies: 10건
--   • inventory_levels: 25건
--   • ontology_entity_types: 11건
--   • ontology_relation_types: 4건
--   • graph_entities: 30건
--   • graph_relations: 30건
--   • store_scenes: 1건
--   • ai_recommendations: 4건
-- ============================================================================

-- ============================================================================
-- STEP 0: 기존 데이터 전체 삭제
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 0: 기존 데이터 전체 삭제';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 메트릭/집계 데이터 삭제
  DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  DELETE FROM hourly_metrics WHERE store_id = v_store_id;
  DELETE FROM product_performance_agg WHERE store_id = v_store_id;
  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;

  -- 이벤트 데이터 삭제
  DELETE FROM zone_events WHERE store_id = v_store_id;
  DELETE FROM funnel_events WHERE store_id = v_store_id;

  -- 트랜잭션 데이터 삭제
  DELETE FROM line_items WHERE store_id = v_store_id;
  DELETE FROM purchases WHERE store_id = v_store_id;

  -- 방문 및 고객 삭제
  DELETE FROM store_visits WHERE store_id = v_store_id;
  DELETE FROM customers WHERE store_id = v_store_id;

  -- 전략 관련 삭제
  DELETE FROM strategy_daily_metrics WHERE strategy_id IN (SELECT id FROM applied_strategies WHERE store_id = v_store_id);
  DELETE FROM applied_strategies WHERE store_id = v_store_id;
  DELETE FROM ai_recommendations WHERE store_id = v_store_id;

  -- 그래프 데이터 삭제
  DELETE FROM graph_relations WHERE store_id = v_store_id;
  DELETE FROM graph_entities WHERE store_id = v_store_id;

  -- 재고 삭제
  DELETE FROM inventory_levels WHERE product_id IN (SELECT id FROM products WHERE store_id = v_store_id);

  -- 마스터 데이터 삭제
  DELETE FROM store_scenes WHERE store_id = v_store_id;
  DELETE FROM products WHERE store_id = v_store_id;
  DELETE FROM zones_dim WHERE store_id = v_store_id;
  DELETE FROM stores WHERE id = v_store_id;

  -- 온톨로지 삭제 (org 기준)
  DELETE FROM ontology_relation_types WHERE id IN (
    'c0000001-0000-0000-0000-000000000001'::UUID,
    'c0000002-0000-0000-0000-000000000002'::UUID,
    'c0000003-0000-0000-0000-000000000003'::UUID,
    'c0000004-0000-0000-0000-000000000004'::UUID
  );
  DELETE FROM ontology_entity_types WHERE id IN (
    'b0000001-0000-0000-0000-000000000001'::UUID,
    'b0000002-0000-0000-0000-000000000002'::UUID,
    'b0000003-0000-0000-0000-000000000003'::UUID,
    'b0000004-0000-0000-0000-000000000004'::UUID,
    'b0000005-0000-0000-0000-000000000005'::UUID,
    'b0000006-0000-0000-0000-000000000006'::UUID,
    'b0000007-0000-0000-0000-000000000007'::UUID,
    'b0000008-0000-0000-0000-000000000008'::UUID,
    'b0000009-0000-0000-0000-000000000009'::UUID,
    'b0000010-0000-0000-0000-000000000010'::UUID,
    'b0000011-0000-0000-0000-000000000011'::UUID
  );

  RAISE NOTICE '  ✓ 기존 데이터 전체 삭제 완료';
END $$;

-- ============================================================================
-- STEP 1: 매장 생성 (1건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_user_id IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'User or Organization not found';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: 매장 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO stores (id, user_id, org_id, store_name, store_code, address, floor_area_sqm, area_sqm, is_active, max_capacity, staff_count, created_at)
  VALUES (v_store_id, v_user_id, v_org_id, 'A매장', 'A001', '서울특별시 강남구 테헤란로 123 TCAG 강남점 1F', 250, 250, true, 100, 5, NOW());

  RAISE NOTICE '  ✓ stores: 1건 생성';
END $$;

-- ============================================================================
-- STEP 2: 존 생성 (7건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: 존 생성 (7건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO zones_dim (id, store_id, user_id, org_id, zone_code, zone_name, zone_type, area_sqm,
    position_x, position_y, position_z, size_width, size_depth, size_height, color, capacity, is_active,
    coordinates, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'Z001', '입구', 'entrance', 3,
   2.5, 0, -7.5, 3, 1, 3, '#4CAF50', 3, true, '{"x":2.5,"y":0,"z":-7.5,"width":3,"depth":1}'::jsonb, NOW()),
  ('a0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'Z002', '메인홀', 'main', 80,
   0, 0, 0, 10, 8, 3, '#2196F3', 40, true, '{"x":0,"y":0,"z":0,"width":10,"depth":8}'::jsonb, NOW()),
  ('a0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'Z003', '의류존', 'display', 36,
   -5, 0, 3, 6, 6, 3, '#9C27B0', 18, true, '{"x":-5,"y":0,"z":3,"width":6,"depth":6}'::jsonb, NOW()),
  ('a0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'Z004', '액세서리존', 'display', 36,
   5, 0, 3, 6, 6, 3, '#FF9800', 18, true, '{"x":5,"y":0,"z":3,"width":6,"depth":6}'::jsonb, NOW()),
  ('a0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'Z005', '피팅룸', 'fitting', 16,
   -5, 0, -5, 4, 4, 3, '#E91E63', 4, true, '{"x":-5,"y":0,"z":-5,"width":4,"depth":4}'::jsonb, NOW()),
  ('a0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, 'Z006', '계산대', 'checkout', 9,
   4.5, 0, 5.5, 3, 3, 3, '#00BCD4', 4, true, '{"x":4.5,"y":0,"z":5.5,"width":3,"depth":3}'::jsonb, NOW()),
  ('a0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, 'Z007', '휴식공간', 'lounge', 16,
   0, 0, 7, 8, 2, 3, '#8BC34A', 8, true, '{"x":0,"y":0,"z":7,"width":8,"depth":2}'::jsonb, NOW());

  RAISE NOTICE '  ✓ zones_dim: 7건 생성';
END $$;

-- ============================================================================
-- STEP 3: 상품 생성 (25건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  i INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: 상품 생성 (25건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..25 LOOP
    INSERT INTO products (id, store_id, user_id, org_id, product_name, sku, category, price, cost_price, stock, created_at)
    VALUES (
      ('f000' || LPAD(i::TEXT, 4, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      CASE i
        WHEN 1 THEN '프리미엄 캐시미어 코트' WHEN 2 THEN '울 테일러드 재킷' WHEN 3 THEN '다운 패딩'
        WHEN 4 THEN '트렌치 코트' WHEN 5 THEN '레더 자켓' WHEN 6 THEN '실크 블라우스'
        WHEN 7 THEN '캐주얼 니트 스웨터' WHEN 8 THEN '옥스포드 셔츠' WHEN 9 THEN '린넨 탑'
        WHEN 10 THEN '폴로 셔츠' WHEN 11 THEN '리넨 와이드 팬츠' WHEN 12 THEN '슬림핏 데님'
        WHEN 13 THEN '치노 팬츠' WHEN 14 THEN '조거 팬츠' WHEN 15 THEN 'A라인 스커트'
        WHEN 16 THEN '가죽 토트백' WHEN 17 THEN '실버 목걸이' WHEN 18 THEN '가죽 벨트'
        WHEN 19 THEN '스카프 세트' WHEN 20 THEN '울 머플러' WHEN 21 THEN '프리미엄 로퍼'
        WHEN 22 THEN '하이힐 펌프스' WHEN 23 THEN '스니커즈' WHEN 24 THEN '프리미엄 스킨케어 세트'
        ELSE '립스틱 컬렉션'
      END,
      CASE
        WHEN i<=5 THEN 'SKU-OUT-'||LPAD(i::TEXT,3,'0')
        WHEN i<=10 THEN 'SKU-TOP-'||LPAD((i-5)::TEXT,3,'0')
        WHEN i<=15 THEN 'SKU-BTM-'||LPAD((i-10)::TEXT,3,'0')
        WHEN i<=20 THEN 'SKU-ACC-'||LPAD((i-15)::TEXT,3,'0')
        WHEN i<=23 THEN 'SKU-SHO-'||LPAD((i-20)::TEXT,3,'0')
        ELSE 'SKU-COS-'||LPAD((i-23)::TEXT,3,'0')
      END,
      CASE
        WHEN i<=5 THEN '아우터'
        WHEN i<=10 THEN '상의'
        WHEN i<=15 THEN '하의'
        WHEN i<=20 THEN '액세서리'
        WHEN i<=23 THEN '신발'
        ELSE '화장품'
      END,
      CASE
        WHEN i<=5 THEN 350000+(i*50000)
        WHEN i<=10 THEN 80000+((i-5)*20000)
        WHEN i<=15 THEN 120000+((i-10)*25000)
        WHEN i<=20 THEN 150000+((i-15)*40000)
        WHEN i<=23 THEN 200000+((i-20)*80000)
        ELSE 80000+((i-23)*30000)
      END,
      CASE
        WHEN i<=5 THEN (350000+(i*50000))*0.4
        WHEN i<=10 THEN (80000+((i-5)*20000))*0.4
        WHEN i<=15 THEN (120000+((i-10)*25000))*0.4
        WHEN i<=20 THEN (150000+((i-15)*40000))*0.4
        WHEN i<=23 THEN (200000+((i-20)*80000))*0.4
        ELSE (80000+((i-23)*30000))*0.4
      END,
      CASE
        WHEN i IN (3,7,12,17) THEN 5+floor(random()*5)::INT
        WHEN i IN (1,6,16,21,24) THEN 80+floor(random()*40)::INT
        ELSE 30+floor(random()*40)::INT
      END,
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ products: 25건 생성';
END $$;

-- ============================================================================
-- STEP 4: 고객 생성 (500명) - 세그먼트 분포 유지
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  i INT;
  v_segment TEXT;
  v_total_purchases INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: 고객 생성 (500명)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..2500 LOOP
    -- 세그먼트: VIP 5% (125명), Regular 20% (500명), New 75% (1,875명)
    IF i <= 125 THEN
      v_segment := 'vip';
      v_total_purchases := 3000000 + floor(random() * 2000000)::INT;
    ELSIF i <= 625 THEN
      v_segment := 'regular';
      v_total_purchases := 500000 + floor(random() * 1000000)::INT;
    ELSE
      v_segment := 'new';
      v_total_purchases := floor(random() * 300000)::INT;
    END IF;

    INSERT INTO customers (id, store_id, user_id, org_id, customer_name, email, phone, segment, total_purchases, created_at)
    VALUES (
      ('c' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      (ARRAY['김','이','박','최','정','강','조','윤','장','임'])[1+floor(random()*10)::INT] ||
      (ARRAY['민수','지영','현우','수진','준호','예진','도윤','서연','시우','하윤'])[1+floor(random()*10)::INT],
      'customer' || i || '@example.com',
      '010-' || LPAD(floor(random()*9000+1000)::TEXT, 4, '0') || '-' || LPAD(floor(random()*9000+1000)::TEXT, 4, '0'),
      v_segment,
      v_total_purchases,
      NOW() - ((random()*365)||' days')::INTERVAL
    );
  END LOOP;

  RAISE NOTICE '  ✓ customers: 500명 생성 (VIP 25, Regular 75, New 400)';
END $$;

-- ============================================================================
-- STEP 5: store_visits 생성 (~1,250건) - 재방문 패턴 포함
-- ============================================================================
-- 500명 고객 중:
--   - 375명 (75%): 1회 방문
--   - 75명 (15%): 2회 방문 = 150건
--   - 35명 (7%): 3회 방문 = 105건
--   - 15명 (3%): 4회 방문 = 60건
-- 총: 375 + 150 + 105 + 60 = 690건 (식별 고객)
-- + 익명 방문 560건 = ~1,250건
-- 재방문률: (75+35+15)/500 = 25%
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,
    'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID,
    'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID,
    'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  i INT;
  v INT;
  v_customer_id UUID;
  v_visit_count INT;
  v_visit_date TIMESTAMPTZ;
  v_duration INT;
  v_path UUID[];
  v_made_purchase BOOLEAN;
  v_visit_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: store_visits 생성 (~1,250건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 식별 고객 방문 생성
  FOR i IN 1..500 LOOP
    v_customer_id := ('c' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;

    -- 방문 횟수 결정: 1회(75%), 2회(15%), 3회(7%), 4회(3%)
    IF i <= 375 THEN
      v_visit_count := 1;
    ELSIF i <= 450 THEN
      v_visit_count := 2;
    ELSIF i <= 485 THEN
      v_visit_count := 3;
    ELSE
      v_visit_count := 4;
    END IF;

    FOR v IN 1..v_visit_count LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                     - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;

      -- 존 방문 경로 생성 (입구부터 시작)
      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;

      -- VIP/Regular 고객은 구매 확률 높음
      IF i <= 25 THEN
        v_made_purchase := random() > 0.4;  -- VIP: 60%
      ELSIF i <= 100 THEN
        v_made_purchase := random() > 0.7;  -- Regular: 30%
      ELSE
        v_made_purchase := random() > 0.9;  -- New: 10%
      END IF;

      v_visit_id := gen_random_uuid();

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
        duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        v_visit_id, v_store_id, v_org_id, v_customer_id,
        v_visit_date,
        v_visit_date + (v_duration||' seconds')::INTERVAL,
        floor(v_duration/60)::INT,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
    END LOOP;
  END LOOP;

  -- 익명 방문 생성 (~560건)
  FOR i IN 1..560 LOOP
    v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                   - ((floor(random()*10) + 10)||' hours')::INTERVAL;
    v_duration := 180 + floor(random()*900)::INT;

    v_path := ARRAY[v_zone_ids[1]];
    FOR j IN 2..(2+floor(random()*4)::INT) LOOP
      v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
    END LOOP;

    v_made_purchase := random() > 0.95;  -- 익명: 5%

    INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
      duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, NULL,
      v_visit_date,
      v_visit_date + (v_duration||' seconds')::INTERVAL,
      floor(v_duration/60)::INT,
      v_path,
      '{}'::jsonb,
      v_made_purchase,
      v_visit_date
    );
  END LOOP;

  RAISE NOTICE '  ✓ store_visits: ~1,250건 생성 (식별 690, 익명 560)';
  RAISE NOTICE '  ✓ 재방문률: 25%% (125/500 고객)';
END $$;

-- ============================================================================
-- STEP 6: purchases & line_items 생성 (store_visits.made_purchase 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_purchase_id UUID;
  v_tx_id TEXT;
  v_item_count INT;
  v_product_id UUID;
  v_price NUMERIC;
  v_qty INT;
  v_total NUMERIC;
  v_purchase_count INT := 0;
  v_line_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6: purchases & line_items 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date
    FROM store_visits
    WHERE store_id = v_store_id AND made_purchase = true
  LOOP
    v_purchase_id := gen_random_uuid();
    v_tx_id := 'TX-' || TO_CHAR(v_visit.visit_date, 'YYYYMMDD') || '-' || LPAD(v_purchase_count::TEXT, 4, '0');
    v_item_count := 1 + floor(random()*3)::INT;
    v_total := 0;

    -- purchase 생성
    INSERT INTO purchases (id, store_id, org_id, customer_id, visit_id, transaction_id,
      purchase_date, total_amount, item_count, payment_method, created_at)
    VALUES (
      v_purchase_id, v_store_id, v_org_id, v_visit.customer_id, v_visit.id, v_tx_id,
      v_visit.visit_date + '15 minutes'::INTERVAL,
      0,  -- 나중에 업데이트
      v_item_count,
      (ARRAY['card', 'cash', 'mobile'])[1+floor(random()*3)::INT],
      v_visit.visit_date
    );

    -- line_items 생성
    FOR item_num IN 1..v_item_count LOOP
      v_product_id := ('f000' || LPAD((1+floor(random()*25))::TEXT, 4, '0') || '-0000-0000-0000-000000000000')::UUID;
      SELECT price INTO v_price FROM products WHERE id = v_product_id;
      v_price := COALESCE(v_price, 100000);
      v_qty := 1 + floor(random()*2)::INT;

      INSERT INTO line_items (id, store_id, org_id, transaction_id, product_id, quantity,
        unit_price, line_total, discount_amount, transaction_date, transaction_hour, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_tx_id, v_product_id, v_qty,
        v_price,
        v_price * v_qty,
        floor(v_price * v_qty * random() * 0.1),
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        v_visit.visit_date
      );

      v_total := v_total + (v_price * v_qty);
      v_line_count := v_line_count + 1;
    END LOOP;

    -- purchase total 업데이트
    UPDATE purchases SET total_amount = v_total WHERE id = v_purchase_id;
    v_purchase_count := v_purchase_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ purchases: %건 생성', v_purchase_count;
  RAISE NOTICE '  ✓ line_items: %건 생성', v_line_count;
END $$;

-- ============================================================================
-- STEP 7: daily_kpis_agg 생성 (90일) - store_visits 기반 집계
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_dow INT;
  v_total_visitors INT;
  v_unique_visitors INT;
  v_returning INT;
  v_transactions INT;
  v_revenue NUMERIC;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 7: daily_kpis_agg 생성 (90일)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;
    v_dow := EXTRACT(DOW FROM v_date)::INT;

    -- store_visits에서 해당 날짜 통계 집계
    SELECT
      COUNT(*),
      COUNT(DISTINCT customer_id),
      COUNT(*) FILTER (WHERE made_purchase = true)
    INTO v_total_visitors, v_unique_visitors, v_transactions
    FROM store_visits
    WHERE store_id = v_store_id AND visit_date::DATE = v_date;

    -- 방문이 없는 날은 기본값 사용
    IF v_total_visitors = 0 THEN
      v_total_visitors := CASE WHEN v_dow IN (0,6) THEN 15 + floor(random()*5)::INT ELSE 10 + floor(random()*5)::INT END;
      v_unique_visitors := floor(v_total_visitors * 0.85)::INT;
      v_transactions := floor(v_total_visitors * 0.14)::INT;
    END IF;

    -- 재방문 고객 수
    SELECT COUNT(*) INTO v_returning
    FROM (
      SELECT customer_id
      FROM store_visits
      WHERE store_id = v_store_id
        AND visit_date::DATE <= v_date
        AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING COUNT(*) >= 2
    ) t;

    -- 매출 계산 (line_items에서)
    SELECT COALESCE(SUM(line_total - COALESCE(discount_amount, 0)), 0) INTO v_revenue
    FROM line_items
    WHERE store_id = v_store_id AND transaction_date = v_date;

    IF v_revenue = 0 THEN
      v_revenue := v_transactions * (150000 + floor(random()*50000));
    END IF;

    INSERT INTO daily_kpis_agg (id, store_id, org_id, date, total_revenue, total_transactions, avg_transaction_value,
      total_visitors, unique_visitors, returning_visitors, conversion_rate, avg_visit_duration_seconds,
      total_units_sold, avg_basket_size, labor_hours, sales_per_labor_hour, sales_per_visitor, calculated_at, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_date,
      v_revenue,
      v_transactions,
      CASE WHEN v_transactions > 0 THEN v_revenue / v_transactions ELSE 0 END,
      v_total_visitors,
      v_unique_visitors,
      v_returning,
      CASE WHEN v_total_visitors > 0 THEN (v_transactions::NUMERIC / v_total_visitors * 100) ELSE 0 END,
      1200 + floor(random()*600)::INT,
      floor(v_transactions * 1.5)::INT,
      CASE WHEN v_transactions > 0 THEN 1.5 + random() ELSE 0 END,
      CASE WHEN v_dow IN (0,6) THEN 64 ELSE 48 END,
      v_revenue / CASE WHEN v_dow IN (0,6) THEN 64 ELSE 48 END,
      CASE WHEN v_total_visitors > 0 THEN v_revenue / v_total_visitors ELSE 0 END,
      NOW(), NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ daily_kpis_agg: 90건 생성 (store_visits 기반)';
END $$;

-- ============================================================================
-- STEP 8: funnel_events 생성 (store_visits 기반 1:1 매핑)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_session TEXT;
  v_stages INT;
  v_funnel TEXT[] := ARRAY['visit', 'browse', 'interest', 'try', 'purchase'];
  v_funnel_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 8: funnel_events 생성 (store_visits 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, made_purchase, duration_minutes
    FROM store_visits
    WHERE store_id = v_store_id
  LOOP
    v_session := 'session-' || v_visit.id::TEXT;

    -- 구매자: 모든 스테이지 (visit → browse → interest → try → purchase)
    -- 비구매자: 일부 스테이지만
    IF v_visit.made_purchase THEN
      v_stages := 5;
    ELSE
      v_stages := CASE
        WHEN random() < 0.3 THEN 2   -- 30%: visit, browse
        WHEN random() < 0.6 THEN 3   -- 30%: + interest
        ELSE 4                        -- 40%: + try
      END;
    END IF;

    FOR stage_num IN 1..v_stages LOOP
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type,
        event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_session,
        COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
        v_funnel[stage_num],
        v_visit.visit_date + ((stage_num * 3)||' minutes')::INTERVAL,
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        60 + floor(random()*180)::INT,
        '{"source":"store_visit"}'::jsonb,
        v_visit.visit_date
      );
      v_funnel_count := v_funnel_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ funnel_events: %건 생성 (store_visits와 1:1 매핑)', v_funnel_count;
END $$;

-- ============================================================================
-- STEP 9: zone_events 생성 (store_visits.zones_visited 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_zone_id UUID;
  v_zone_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 9: zone_events 생성 (zones_visited 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, zones_visited, duration_minutes
    FROM store_visits
    WHERE store_id = v_store_id AND zones_visited IS NOT NULL
  LOOP
    FOR i IN 1..array_length(v_visit.zones_visited, 1) LOOP
      v_zone_id := v_visit.zones_visited[i];

      -- enter 이벤트
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type,
        event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone_id,
        COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
        'enter',
        v_visit.visit_date + ((i * 2)||' minutes')::INTERVAL,
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        30 + floor(random()*120)::INT,
        '{"source":"store_visit"}'::jsonb,
        v_visit.visit_date
      );
      v_zone_count := v_zone_count + 1;

      -- dwell 이벤트 (50% 확률)
      IF random() > 0.5 THEN
        INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type,
          event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
        VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_zone_id,
          COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
          'dwell',
          v_visit.visit_date + ((i * 2 + 1)||' minutes')::INTERVAL,
          v_visit.visit_date::DATE,
          EXTRACT(HOUR FROM v_visit.visit_date)::INT,
          60 + floor(random()*180)::INT,
          '{"source":"store_visit"}'::jsonb,
          v_visit.visit_date
        );
        v_zone_count := v_zone_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_events: %건 생성', v_zone_count;
END $$;

-- ============================================================================
-- STEP 10: zone_daily_metrics 생성 (90일 x 7존)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_zone_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,
    'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID,
    'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID,
    'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  v_zone_weights NUMERIC[] := ARRAY[1.0, 0.9, 0.7, 0.5, 0.3, 0.4, 0.2];
  v_base_visitors INT;
  v_dow INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 10: zone_daily_metrics 생성 (630건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;
    v_dow := EXTRACT(DOW FROM v_date)::INT;

    -- 해당 날짜 총 방문자 수
    SELECT COALESCE(total_visitors, 10) INTO v_base_visitors
    FROM daily_kpis_agg WHERE store_id = v_store_id AND date = v_date;

    FOR zone_idx IN 1..7 LOOP
      INSERT INTO zone_daily_metrics (id, store_id, org_id, zone_id, date, total_visitors, unique_visitors,
        avg_dwell_seconds, peak_hour, peak_occupancy, conversion_count, heatmap_intensity, calculated_at, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[zone_idx], v_date,
        floor(v_base_visitors * v_zone_weights[zone_idx] * (0.8 + random()*0.4))::INT,
        floor(v_base_visitors * v_zone_weights[zone_idx] * 0.85)::INT,
        CASE zone_idx
          WHEN 1 THEN 30 WHEN 2 THEN 120 WHEN 3 THEN 180
          WHEN 4 THEN 150 WHEN 5 THEN 300 WHEN 6 THEN 180 ELSE 240
        END + floor(random()*60),
        CASE WHEN v_dow IN (0,6) THEN 14+floor(random()*4)::INT ELSE 12+floor(random()*3)::INT END,
        floor(v_base_visitors * v_zone_weights[zone_idx] * 0.15)::INT,
        CASE zone_idx WHEN 6 THEN floor(v_base_visitors*0.1) ELSE floor(v_base_visitors*0.02) END,
        CASE zone_idx
          WHEN 1 THEN 0.9 + random()*0.1  -- 입구: 높음
          WHEN 2 THEN 0.7 + random()*0.2  -- 메인홀: 높음
          WHEN 6 THEN 0.6 + random()*0.2  -- 계산대: 중간
          ELSE 0.3 + random()*0.3         -- 기타: 낮음~중간
        END,
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_daily_metrics: 630건 생성';
END $$;

-- ============================================================================
-- STEP 11: hourly_metrics 생성 (90일 x 12시간)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_base_visitors INT;
  v_hour_mult NUMERIC;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 11: hourly_metrics 생성 (1,080건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    SELECT COALESCE(total_visitors, 10) INTO v_base_visitors
    FROM daily_kpis_agg WHERE store_id = v_store_id AND date = v_date;

    FOR v_hour IN 10..21 LOOP
      v_hour_mult := CASE
        WHEN v_hour BETWEEN 12 AND 14 THEN 1.3  -- 점심
        WHEN v_hour BETWEEN 17 AND 19 THEN 1.5  -- 저녁
        WHEN v_hour <= 11 THEN 0.7              -- 오전
        WHEN v_hour >= 20 THEN 0.8              -- 늦은 저녁
        ELSE 1.0
      END;

      INSERT INTO hourly_metrics (id, store_id, org_id, date, hour, visitor_count, transaction_count, revenue, conversion_rate, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date, v_hour,
        floor(v_base_visitors / 12 * v_hour_mult * (0.8 + random()*0.4))::INT,
        floor(v_base_visitors / 12 * 0.14 * (0.8 + random()*0.4))::INT,
        floor(v_base_visitors / 12 * 120000 * v_hour_mult * (0.8 + random()*0.4)),
        10 + floor(random()*8),
        NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ hourly_metrics: 1,080건 생성';
END $$;

-- ============================================================================
-- STEP 12: product_performance_agg 생성 (90일 x 25상품)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_pid UUID;
  v_views INT;
  v_sales INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 12: product_performance_agg 생성 (2,250건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    FOR prod_num IN 1..25 LOOP
      v_pid := ('f000' || LPAD(prod_num::TEXT, 4, '0') || '-0000-0000-0000-000000000000')::UUID;

      -- 인기 상품은 더 많은 조회/판매
      v_views := CASE
        WHEN prod_num IN (1,6,16,21) THEN 40 + floor(random()*20)::INT
        WHEN prod_num IN (3,7,12,17) THEN 10 + floor(random()*10)::INT
        ELSE 20 + floor(random()*15)::INT
      END;
      v_sales := floor(v_views * (0.08 + random()*0.07))::INT;

      INSERT INTO product_performance_agg (id, store_id, org_id, product_id, date, units_sold, transactions, revenue,
        conversion_rate, avg_selling_price, return_rate, stock_level, category_rank, store_rank, calculated_at, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_pid, v_date,
        v_sales,
        floor(v_sales * 0.8)::INT,
        v_sales * (100000 + prod_num * 20000),
        CASE WHEN v_views > 0 THEN (v_sales::NUMERIC / v_views * 100) ELSE 0 END,
        100000 + prod_num * 20000,
        2 + floor(random()*5),
        30 + floor(random()*50)::INT,
        1 + floor(random()*10)::INT,
        1 + floor(random()*25)::INT,
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ product_performance_agg: 2,250건 생성';
END $$;

-- ============================================================================
-- STEP 13: customer_segments_agg 생성 (90일 x 6세그먼트)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_seg_names TEXT[] := ARRAY['VIP', 'Regular', 'New', 'Dormant', 'At-Risk', 'Churned'];
  v_seg_types TEXT[] := ARRAY['value', 'frequency', 'lifecycle', 'lifecycle', 'risk', 'risk'];
  v_cnt INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 13: customer_segments_agg 생성 (540건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    FOR seg_idx IN 1..6 LOOP
      v_cnt := CASE seg_idx
        WHEN 1 THEN 15  -- VIP
        WHEN 2 THEN 50  -- Regular
        WHEN 3 THEN 100 -- New
        WHEN 4 THEN 80  -- Dormant
        WHEN 5 THEN 60  -- At-Risk
        ELSE 30         -- Churned
      END + floor(random()*20)::INT;

      INSERT INTO customer_segments_agg (id, store_id, org_id, date, segment_name, segment_type, customer_count,
        total_revenue, avg_transaction_value, avg_basket_size, visit_frequency, ltv_estimate, churn_risk_score, calculated_at, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date, v_seg_names[seg_idx], v_seg_types[seg_idx], v_cnt,
        v_cnt * CASE seg_idx WHEN 1 THEN 500000 WHEN 2 THEN 200000 WHEN 3 THEN 100000 ELSE 50000 END,
        CASE seg_idx WHEN 1 THEN 350000 WHEN 2 THEN 180000 WHEN 3 THEN 120000 ELSE 80000 END,
        CASE seg_idx WHEN 1 THEN 3.2 WHEN 2 THEN 2.1 ELSE 1.5 END,
        CASE seg_idx WHEN 1 THEN 8 WHEN 2 THEN 4 WHEN 3 THEN 1.5 ELSE 0.5 END,
        CASE seg_idx WHEN 1 THEN 5000000 WHEN 2 THEN 2000000 WHEN 3 THEN 500000 ELSE 150000 END,
        CASE seg_idx WHEN 1 THEN 5 WHEN 2 THEN 15 WHEN 3 THEN 25 WHEN 5 THEN 70 WHEN 6 THEN 90 ELSE 40 END + floor(random()*10),
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ customer_segments_agg: 540건 생성';
END $$;

-- ============================================================================
-- STEP 14: applied_strategies & strategy_daily_metrics 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_sid UUID;
  v_sources TEXT[] := ARRAY['2d_simulation', '3d_simulation', '2d_simulation', '3d_simulation', '2d_simulation'];
  v_modules TEXT[] := ARRAY['pricing_optimization', 'layout_optimization', 'inventory_management', 'staffing_optimization', 'flow_optimization'];
  v_names TEXT[] := ARRAY['가격 최적화', '레이아웃 재배치', '재고 최적화', '인력 배치', '동선 개선', '프로모션', '디스플레이 변경', 'VIP 이벤트', '예약 시스템', '셀프 결제'];
  v_start DATE;
  v_end DATE;
  v_status TEXT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 14: applied_strategies 생성 (10건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..10 LOOP
    v_sid := gen_random_uuid();
    v_start := CURRENT_DATE - ((i*8)||' days')::INTERVAL;
    v_end := v_start + '7 days'::INTERVAL;
    v_status := CASE
      WHEN v_end < CURRENT_DATE THEN 'completed'
      WHEN v_start > CURRENT_DATE THEN 'pending'
      ELSE 'active'
    END;

    INSERT INTO applied_strategies (id, store_id, org_id, user_id, created_by, source, source_module, name, description, settings,
      start_date, end_date, expected_roi, target_roi, current_roi, final_roi, expected_revenue, actual_revenue,
      status, result, baseline_metrics, created_at, updated_at)
    VALUES (
      v_sid, v_store_id, v_org_id, v_user_id, v_user_id,
      v_sources[1+(i%5)], v_modules[1+(i%5)], v_names[i], '전략 설명 '||i,
      '{"value": 50}'::jsonb, v_start, v_end,
      15 + floor(random()*25), 15 + floor(random()*25),
      CASE WHEN v_status IN ('active','completed') THEN 10 + floor(random()*20) ELSE NULL END,
      CASE WHEN v_status = 'completed' THEN 12 + floor(random()*25) ELSE NULL END,
      1000000 + floor(random()*2000000)::INT,
      CASE WHEN v_status = 'completed' THEN 800000 + floor(random()*2500000)::INT ELSE NULL END,
      v_status,
      CASE WHEN v_status = 'completed' THEN 'success' ELSE NULL END,
      '{"revenue": 2500000}'::jsonb,
      NOW() - (i*8||' days')::INTERVAL, NOW()
    );

    -- 완료된 전략의 일별 메트릭
    IF v_status = 'completed' THEN
      FOR day_num IN 0..6 LOOP
        INSERT INTO strategy_daily_metrics (id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at)
        VALUES (
          gen_random_uuid(), v_sid, v_start + (day_num||' days')::INTERVAL,
          jsonb_build_object(
            'revenue', 350000 + floor(random()*200000)::INT,
            'visitors', 120 + floor(random()*60)::INT,
            'conversion_rate', 12 + floor(random()*8)
          ),
          10 + floor(random()*15),
          (day_num+1) * (10 + floor(random()*15)),
          NOW()
        );
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '  ✓ applied_strategies: 10건 생성';
END $$;

-- ============================================================================
-- STEP 15: inventory_levels 생성 (25건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_product RECORD;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 15: inventory_levels 생성 (25건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_product IN SELECT id, stock, category FROM products WHERE store_id = v_store_id LOOP
    INSERT INTO inventory_levels (id, product_id, user_id, org_id, current_stock, minimum_stock, optimal_stock, weekly_demand, last_updated, created_at)
    VALUES (
      gen_random_uuid(), v_product.id, v_user_id, v_org_id,
      COALESCE(v_product.stock, 50),
      CASE v_product.category WHEN '아우터' THEN 5 WHEN '상의' THEN 10 WHEN '하의' THEN 8 ELSE 15 END,
      CASE v_product.category WHEN '아우터' THEN 50 WHEN '상의' THEN 100 WHEN '하의' THEN 80 ELSE 120 END,
      CASE v_product.category WHEN '아우터' THEN 3 WHEN '상의' THEN 8 WHEN '하의' THEN 6 ELSE 10 END,
      NOW(), NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ inventory_levels: 25건 생성';
END $$;

-- ============================================================================
-- STEP 16: ontology_entity_types 생성 (11건)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 16: ontology_entity_types 생성 (11건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ontology_entity_types (id, user_id, org_id, name, label, description, color, icon, properties, created_at) VALUES
    ('b0000001-0000-0000-0000-000000000001'::UUID, v_user_id, v_org_id, 'Shelf', '선반', '선반/진열대', '#8B4513', 'archive', '[]'::jsonb, NOW()),
    ('b0000002-0000-0000-0000-000000000002'::UUID, v_user_id, v_org_id, 'Rack', '행거', '의류 행거', '#4682B4', 'shirt', '[]'::jsonb, NOW()),
    ('b0000003-0000-0000-0000-000000000003'::UUID, v_user_id, v_org_id, 'DisplayTable', '테이블', '진열 테이블', '#DEB887', 'table', '[]'::jsonb, NOW()),
    ('b0000004-0000-0000-0000-000000000004'::UUID, v_user_id, v_org_id, 'CheckoutCounter', '계산대', '계산대', '#2F4F4F', 'credit-card', '[]'::jsonb, NOW()),
    ('b0000005-0000-0000-0000-000000000005'::UUID, v_user_id, v_org_id, 'FittingRoom', '탈의실', '탈의실', '#DB7093', 'door-closed', '[]'::jsonb, NOW()),
    ('b0000006-0000-0000-0000-000000000006'::UUID, v_user_id, v_org_id, 'Entrance', '출입구', '출입구', '#228B22', 'door-open', '[]'::jsonb, NOW()),
    ('b0000007-0000-0000-0000-000000000007'::UUID, v_user_id, v_org_id, 'Clothing', '의류', '의류', '#9370DB', 'shirt', '[]'::jsonb, NOW()),
    ('b0000008-0000-0000-0000-000000000008'::UUID, v_user_id, v_org_id, 'Shoes', '신발', '신발', '#CD853F', 'footprints', '[]'::jsonb, NOW()),
    ('b0000009-0000-0000-0000-000000000009'::UUID, v_user_id, v_org_id, 'Zone', '존', '매장 영역', '#4CAF50', 'map-pin', '[]'::jsonb, NOW()),
    ('b0000010-0000-0000-0000-000000000010'::UUID, v_user_id, v_org_id, 'Accessory', '액세서리', '액세서리', '#FFD700', 'gem', '[]'::jsonb, NOW()),
    ('b0000011-0000-0000-0000-000000000011'::UUID, v_user_id, v_org_id, 'Cosmetics', '화장품', '화장품', '#FF69B4', 'sparkles', '[]'::jsonb, NOW());

  RAISE NOTICE '  ✓ ontology_entity_types: 11건 생성';
END $$;

-- ============================================================================
-- STEP 17: ontology_relation_types 생성 (4건)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 17: ontology_relation_types 생성 (4건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ontology_relation_types (id, user_id, org_id, name, label, description, source_entity_type, target_entity_type, properties, created_at) VALUES
    ('c0000001-0000-0000-0000-000000000001'::UUID, v_user_id, v_org_id, 'displayed_on', '진열됨', '제품이 가구에 진열됨', 'product', 'furniture', '[]'::jsonb, NOW()),
    ('c0000002-0000-0000-0000-000000000002'::UUID, v_user_id, v_org_id, 'located_near', '인접함', '가구 간 인접 관계', 'furniture', 'furniture', '[]'::jsonb, NOW()),
    ('c0000003-0000-0000-0000-000000000003'::UUID, v_user_id, v_org_id, 'belongs_to_zone', '존 소속', '가구/구조물이 존에 속함', 'furniture', 'zone', '[]'::jsonb, NOW()),
    ('c0000004-0000-0000-0000-000000000004'::UUID, v_user_id, v_org_id, 'cross_sells_with', '교차판매', '제품 간 교차판매 관계', 'product', 'product', '[]'::jsonb, NOW());

  RAISE NOTICE '  ✓ ontology_relation_types: 4건 생성';
END $$;

-- ============================================================================
-- STEP 18: graph_entities 생성 (30건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 18: graph_entities 생성 (30건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 가구 (6건)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('d0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000001-0000-0000-0000-000000000001'::UUID, '벽면 선반',
   '{"category":"display","material":"wood","capacity":30,"model_url":"shelf_wall.glb"}'::jsonb,
   '{"x":-4.2,"y":0,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000001-0000-0000-0000-000000000001'::UUID, '계단식 선반 (신발용)',
   '{"category":"display","material":"wood","capacity":15,"model_url":"shelf_step.glb"}'::jsonb,
   '{"x":-7.7,"y":0.05,"z":-0.6}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000002-0000-0000-0000-000000000002'::UUID, '의류 행거',
   '{"category":"hanging","material":"metal","hanging_capacity":13,"model_url":"rack_clothing.glb"}'::jsonb,
   '{"x":5,"y":0,"z":1.6}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000003-0000-0000-0000-000000000003'::UUID, '진열 테이블',
   '{"category":"display","material":"wood","display_type":"island_table","model_url":"table_display.glb"}'::jsonb,
   '{"x":-3,"y":0,"z":1.2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000004-0000-0000-0000-000000000004'::UUID, '계산대',
   '{"category":"checkout","has_pos":true,"has_packaging":true,"model_url":"counter_checkout.glb"}'::jsonb,
   '{"x":3,"y":0,"z":-4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000003-0000-0000-0000-000000000003'::UUID, '화장품 카운터',
   '{"category":"display","display_type":"counter","has_mirror":true,"model_url":"counter_cosmetics.glb"}'::jsonb,
   '{"x":7.7,"y":0.05,"z":1.1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  -- 구조물 (2건)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('d0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000005-0000-0000-0000-000000000005'::UUID, '탈의실',
   '{"has_mirror":true,"has_seat":true,"has_hooks":4,"model_url":"fitting_room.glb"}'::jsonb,
   '{"x":-7.4,"y":0,"z":-7.2}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000006-0000-0000-0000-000000000006'::UUID, '출입구',
   '{"entrance_type":"main","has_sensor":true,"door_type":"automatic","model_url":"entrance_door.glb"}'::jsonb,
   '{"x":2.5,"y":0,"z":8.4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  -- Zone 엔티티 (7건) - graph_relations FK용
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('a0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '입구 Zone',
   '{"zone_code":"Z001","zone_type":"entrance"}'::jsonb,
   '{"x":2.5,"y":0,"z":-7.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":3,"y":3,"z":1}'::jsonb, NOW(), NOW()),
  ('a0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '메인홀 Zone',
   '{"zone_code":"Z002","zone_type":"main"}'::jsonb,
   '{"x":0,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":10,"y":3,"z":8}'::jsonb, NOW(), NOW()),
  ('a0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '의류존 Zone',
   '{"zone_code":"Z003","zone_type":"display"}'::jsonb,
   '{"x":-5,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":6,"y":3,"z":6}'::jsonb, NOW(), NOW()),
  ('a0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '액세서리존 Zone',
   '{"zone_code":"Z004","zone_type":"display"}'::jsonb,
   '{"x":5,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":6,"y":3,"z":6}'::jsonb, NOW(), NOW()),
  ('a0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '피팅룸 Zone',
   '{"zone_code":"Z005","zone_type":"fitting"}'::jsonb,
   '{"x":-5,"y":0,"z":-5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":4,"y":3,"z":4}'::jsonb, NOW(), NOW()),
  ('a0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '계산대 Zone',
   '{"zone_code":"Z006","zone_type":"checkout"}'::jsonb,
   '{"x":4.5,"y":0,"z":5.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":3,"y":3,"z":3}'::jsonb, NOW(), NOW()),
  ('a0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '휴식공간 Zone',
   '{"zone_code":"Z007","zone_type":"lounge"}'::jsonb,
   '{"x":0,"y":0,"z":7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":8,"y":3,"z":2}'::jsonb, NOW(), NOW());

  -- 제품 (15건)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  -- 의류 (5)
  ('e0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '프리미엄 캐시미어 코트',
   '{"sku":"SKU-OUT-001","display_type":"hanging","parent_furniture":"d0000003-0000-0000-0000-000000000003"}'::jsonb,
   '{"x":5.01,"y":0.25,"z":1.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '울 테일러드 재킷',
   '{"sku":"SKU-OUT-002","display_type":"hanging","parent_furniture":"d0000003-0000-0000-0000-000000000003"}'::jsonb,
   '{"x":5,"y":0.6,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '실크 블라우스',
   '{"sku":"SKU-TOP-001","display_type":"folded","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3,"y":0.91,"z":1.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '리넨 와이드 팬츠',
   '{"sku":"SKU-BTM-001","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-3.7,"y":1.62,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '캐주얼 니트 스웨터',
   '{"sku":"SKU-TOP-002","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-4.5,"y":0.52,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 신발 (3)
  ('e0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '프리미엄 로퍼',
   '{"sku":"SKU-SHO-001","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.7,"y":1.53,"z":-1.1}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '하이힐 펌프스',
   '{"sku":"SKU-SHO-002","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.3,"y":1.1,"z":-0.62}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '스니커즈',
   '{"sku":"SKU-SHO-003","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.3,"y":0.67,"z":-0.2}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 액세서리 (4)
  ('e0000009-0000-0000-0000-000000000009'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '가죽 토트백',
   '{"sku":"SKU-ACC-001","display_type":"showcase","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-2.2,"y":0.93,"z":0.8}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '실버 목걸이',
   '{"sku":"SKU-ACC-002","display_type":"display_case","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3,"y":0.91,"z":1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '가죽 벨트',
   '{"sku":"SKU-ACC-003","display_type":"rolled","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3.6,"y":0.92,"z":0.9}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '스카프 세트',
   '{"sku":"SKU-ACC-004","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-3.8,"y":0.55,"z":-7.7}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 화장품 (3)
  ('e0000013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '프리미엄 스킨케어 세트',
   '{"sku":"SKU-COS-001","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.35,"y":0.78,"z":1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000014-0000-0000-0000-000000000014'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '향수 50ml',
   '{"sku":"SKU-COS-002","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.4,"y":0.78,"z":1.3}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000015-0000-0000-0000-000000000015'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '립스틱 컬렉션',
   '{"sku":"SKU-COS-003","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.3,"y":1.07,"z":1.1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  RAISE NOTICE '  ✓ graph_entities: 30건 생성 (가구 6, 구조물 2, Zone 7, 제품 15)';
END $$;

-- ============================================================================
-- STEP 19: graph_relations 생성 (30건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 19: graph_relations 생성 (30건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- displayed_on 관계 (제품 -> 가구) - 15건
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000001-0000-0000-0000-000000000001'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, '{"position":"hanging"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000002-0000-0000-0000-000000000002'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, '{"position":"hanging"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000004-0000-0000-0000-000000000004'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000005-0000-0000-0000-000000000005'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000006-0000-0000-0000-000000000006'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000007-0000-0000-0000-000000000007'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000008-0000-0000-0000-000000000008'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000009-0000-0000-0000-000000000009'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"showcase"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000010-0000-0000-0000-000000000010'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"display_case"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000011-0000-0000-0000-000000000011'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"rolled"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000012-0000-0000-0000-000000000012'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000013-0000-0000-0000-000000000013'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000014-0000-0000-0000-000000000014'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000015-0000-0000-0000-000000000015'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW());

  -- located_near 관계 (가구 간) - 5건
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, 'd0000007-0000-0000-0000-000000000007'::UUID, '{"distance":2.5}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"distance":3}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, 'd0000008-0000-0000-0000-000000000008'::UUID, '{"distance":4}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"distance":2}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, '{"distance":5}'::jsonb, 1.0, NOW());

  -- belongs_to_zone 관계 (가구/구조물 -> 존) - 6건
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000008-0000-0000-0000-000000000008'::UUID, 'a0000001-0000-0000-0000-000000000001'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, 'a0000002-0000-0000-0000-000000000002'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, 'a0000003-0000-0000-0000-000000000003'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, 'a0000004-0000-0000-0000-000000000004'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000007-0000-0000-0000-000000000007'::UUID, 'a0000005-0000-0000-0000-000000000005'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, 'a0000006-0000-0000-0000-000000000006'::UUID, '{}'::jsonb, 1.0, NOW());

  -- cross_sells_with 관계 (제품 간 교차판매) - 4건
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000001-0000-0000-0000-000000000001'::UUID, 'e0000012-0000-0000-0000-000000000012'::UUID, '{"correlation":0.75}'::jsonb, 0.75, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000003-0000-0000-0000-000000000003'::UUID, 'e0000004-0000-0000-0000-000000000004'::UUID, '{"correlation":0.68}'::jsonb, 0.68, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000007-0000-0000-0000-000000000007'::UUID, 'e0000009-0000-0000-0000-000000000009'::UUID, '{"correlation":0.62}'::jsonb, 0.62, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000013-0000-0000-0000-000000000013'::UUID, 'e0000015-0000-0000-0000-000000000015'::UUID, '{"correlation":0.85}'::jsonb, 0.85, NOW());

  RAISE NOTICE '  ✓ graph_relations: 30건 생성';
END $$;

-- ============================================================================
-- STEP 20: store_scenes 생성 (1건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 20: store_scenes 생성 (1건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO store_scenes (id, store_id, user_id, org_id, scene_name, scene_type, recipe_data, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '기본 레이아웃', '3d_layout',
    jsonb_build_object(
      'version', '2.0',
      'floor', jsonb_build_object('width', 15, 'depth', 16.67, 'material', 'wood'),
      'walls', jsonb_build_object('height', 3, 'material', 'white'),
      'lighting', jsonb_build_object('ambient', 0.5, 'directional', 0.8),
      'camera', jsonb_build_object(
        'position', jsonb_build_object('x', 0, 'y', 12, 'z', 18),
        'target', jsonb_build_object('x', 0, 'y', 0, 'z', 0)
      ),
      'store_model', 'Store_B_17.4x3.0x16.6.glb'
    ),
    true, NOW(), NOW()
  );

  RAISE NOTICE '  ✓ store_scenes: 1건 생성';
END $$;

-- ============================================================================
-- STEP 21: ai_recommendations 생성 (4건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 21: ai_recommendations 생성 (4건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ai_recommendations (id, store_id, user_id, org_id, title, description,
    recommendation_type, priority, action_category, data_source, expected_impact, evidence,
    status, is_displayed, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '저성과 상품 리포지셔닝: 다운 패딩',
   '다운 패딩 상품의 전환율이 5.2%로 낮습니다. 입구 근처로 위치 변경을 권장합니다.',
   'layout', 'high', 'revenue_increase', 'product_performance_agg',
   '{"potential_increase": 750000, "confidence": 78}'::jsonb,
   '{"views": 150, "purchases": 8, "conversion_rate": 5.2}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '혼잡 존 레이아웃 개선: 메인홀',
   '메인홀 존의 피크 시간대 방문자가 35명으로 용량(40) 대비 혼잡합니다.',
   'layout', 'high', 'operational_efficiency', 'zone_daily_metrics',
   '{"efficiency_gain": 15, "confidence": 82}'::jsonb,
   '{"zone": "메인홀", "peak_visitors": 35, "capacity": 40}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '피크타임 인력 보강: 18시',
   '18시에 평균 22명 방문. 직원 추가 배치 권장.',
   'staffing', 'medium', 'operational_efficiency', 'hourly_metrics',
   '{"service_improvement": 20, "confidence": 80}'::jsonb,
   '{"peak_hour": 18, "avg_visitors": 22}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   'VIP 고객 특별 이벤트 제안',
   'VIP 세그먼트 대상 전용 사전 구매 이벤트로 충성도 강화 권장.',
   'promotion', 'medium', 'customer_experience', 'customer_segments_agg',
   '{"potential_revenue": 500000, "confidence": 75}'::jsonb,
   '{"segment": "VIP"}'::jsonb,
   'active', true, NOW(), NOW());

  RAISE NOTICE '  ✓ ai_recommendations: 4건 생성';
END $$;

-- ============================================================================
-- STEP 22: 데이터 일관성 검증
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_customers INT;
  v_total_visits INT;
  v_unique_visitors INT;
  v_returning INT;
  v_repeat_rate NUMERIC;
  v_purchases INT;
  v_kpi_footfall INT;
  v_kpi_unique INT;
  v_funnel_visit INT;
  v_funnel_purchase INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 22: 데이터 일관성 검증';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 고객 수
  SELECT COUNT(*) INTO v_customers FROM customers WHERE store_id = v_store_id;

  -- 방문 통계
  SELECT COUNT(*), COUNT(DISTINCT customer_id) INTO v_total_visits, v_unique_visitors
  FROM store_visits WHERE store_id = v_store_id;

  -- 재방문 고객 수
  SELECT COUNT(*) INTO v_returning FROM (
    SELECT customer_id FROM store_visits WHERE store_id = v_store_id AND customer_id IS NOT NULL
    GROUP BY customer_id HAVING COUNT(*) >= 2
  ) t;

  v_repeat_rate := CASE WHEN v_customers > 0 THEN (v_returning::NUMERIC / v_customers * 100) ELSE 0 END;

  -- 구매 수
  SELECT COUNT(*) INTO v_purchases FROM purchases WHERE store_id = v_store_id;

  -- KPI 집계
  SELECT COALESCE(SUM(total_visitors), 0), COALESCE(SUM(unique_visitors), 0) INTO v_kpi_footfall, v_kpi_unique
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  -- 퍼널 이벤트
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'visit'),
    COUNT(*) FILTER (WHERE event_type = 'purchase')
  INTO v_funnel_visit, v_funnel_purchase
  FROM funnel_events WHERE store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ NEURALTWIN 통합 샘플 데이터셋 v6.0 시딩 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 생성된 데이터:';
  RAISE NOTICE '  customers:        % 명', v_customers;
  RAISE NOTICE '  store_visits:     % 건', v_total_visits;
  RAISE NOTICE '  unique_visitors:  % 명 (식별)', v_unique_visitors;
  RAISE NOTICE '  returning:        % 명 (%.1f%%)', v_returning, v_repeat_rate;
  RAISE NOTICE '  purchases:        % 건', v_purchases;
  RAISE NOTICE '';
  RAISE NOTICE '📈 일관성 검증:';
  RAISE NOTICE '  store_visits ≈ kpi_footfall:    % ≈ %', v_total_visits, v_kpi_footfall;
  RAISE NOTICE '  store_visits = funnel_visit:    % = % %',
    v_total_visits, v_funnel_visit,
    CASE WHEN v_total_visits = v_funnel_visit THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  purchases = funnel_purchase:    % = % %',
    v_purchases, v_funnel_purchase,
    CASE WHEN v_purchases = v_funnel_purchase THEN '✓' ELSE '✗' END;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Store ID: d9830554-2688-4032-af40-acccda787ac4';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
