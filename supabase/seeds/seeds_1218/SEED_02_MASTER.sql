-- ============================================================================
-- NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터
-- ============================================================================
-- 실행 순서: SEED_01 이후
-- 목적: zones_dim, retail_concepts, data_sources, customers, staff,
--       store_goals, store_scenes, customer_segments 시딩
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_entrance UUID;
  v_zone_main UUID;
  v_zone_clothing UUID;
  v_zone_accessory UUID;
  v_zone_fitting UUID;
  v_zone_checkout UUID;
  v_zone_lounge UUID;
  v_count INT;
  i INT;
  v_customer_type TEXT;
  v_segment TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store가 없습니다. stores 테이블에 데이터가 필요합니다.';
  END IF;

  RAISE NOTICE '  Store ID: %', v_store_id;
  RAISE NOTICE '  User ID: %', v_user_id;
  RAISE NOTICE '  Org ID: %', v_org_id;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.1: zones_dim (7개 존)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.1] zones_dim 시딩 (7개)...';

  INSERT INTO zones_dim (
  id, store_id, user_id, org_id, 
  zone_code, zone_name, zone_type, description, 
  floor_level, area_sqm, capacity, 
  position, boundaries, metadata, 
  is_active, created_at, updated_at
) VALUES
  -- Z001: 입구 (하단 중앙, 4건)
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z001', '입구', 'entrance', '매장 입구 및 환영 공간', 
    1, 40.0, 30, 
    '{"x":0,"y":0,"z":-8}', 
    '{"min":{"x":-4,"y":0,"z":-10},"max":{"x":4,"y":3,"z":-6}}', 
    '{"color":"#FFC107","priority":1,"furnitureCount":4}', 
    true, NOW(), NOW()
  ),
  
  -- Z002: 메인홀 (중앙, 13건) - 가장 큰 중앙 공간
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z002', '메인홀', 'main', '중앙 디스플레이 및 프로모션 공간', 
    1, 100.0, 60, 
    '{"x":0,"y":0,"z":0}', 
    '{"min":{"x":-5,"y":0,"z":-6},"max":{"x":5,"y":3,"z":4}}', 
    '{"color":"#FF5722","priority":2,"furnitureCount":13}', 
    true, NOW(), NOW()
  ),
  
  -- Z003: 의류존 (좌측 하단, 26건) - 가장 많은 가구
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z003', '의류존', 'clothing', '의류 전문 진열 공간', 
    1, 80.0, 50, 
    '{"x":-7,"y":0,"z":-2}', 
    '{"min":{"x":-10,"y":0,"z":-6},"max":{"x":-4,"y":3,"z":2}}', 
    '{"color":"#E91E63","priority":3,"furnitureCount":26}', 
    true, NOW(), NOW()
  ),
  
  -- Z004: 액세서리존 (우측 하단, 11건)
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z004', '액세서리존', 'accessory', '액세서리 및 신발 전문 공간', 
    1, 60.0, 40, 
    '{"x":7,"y":0,"z":-2}', 
    '{"min":{"x":4,"y":0,"z":-6},"max":{"x":10,"y":3,"z":2}}', 
    '{"color":"#FF9800","priority":4,"furnitureCount":11}', 
    true, NOW(), NOW()
  ),
  
  -- Z005: 피팅룸 (좌측 상단, 4건)
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z005', '피팅룸', 'fitting', '피팅룸 공간', 
    1, 24.0, 8, 
    '{"x":-7,"y":0,"z":7}', 
    '{"min":{"x":-10,"y":0,"z":5},"max":{"x":-4,"y":3,"z":10}}', 
    '{"color":"#9C27B0","priority":5,"furnitureCount":4,"fittingRooms":4}', 
    true, NOW(), NOW()
  ),
  
  -- Z006: 계산대 (우측 상단, 4건)
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z006', '계산대', 'checkout', '결제 및 포장 공간', 
    1, 24.0, 15, 
    '{"x":7,"y":0,"z":7}', 
    '{"min":{"x":4,"y":0,"z":5},"max":{"x":10,"y":3,"z":10}}', 
    '{"color":"#FF9800","priority":6,"furnitureCount":4,"posCount":2}', 
    true, NOW(), NOW()
  ),
  
  -- Z007: 휴식공간 (상단 중앙, 6건)
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z007', '휴식공간', 'lounge', '고객 휴식 및 대기 공간', 
    1, 32.0, 20, 
    '{"x":0,"y":0,"z":8}', 
    '{"min":{"x":-4,"y":0,"z":5},"max":{"x":4,"y":3,"z":10}}', 
    '{"color":"#4CAF50","priority":7,"furnitureCount":6}', 
    true, NOW(), NOW()
  );

  -- Zone ID 가져오기
  SELECT id INTO v_zone_entrance FROM zones_dim WHERE zone_code = 'Z001' AND store_id = v_store_id;
  SELECT id INTO v_zone_main FROM zones_dim WHERE zone_code = 'Z002' AND store_id = v_store_id;
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;
  SELECT id INTO v_zone_fitting FROM zones_dim WHERE zone_code = 'Z005' AND store_id = v_store_id;
  SELECT id INTO v_zone_checkout FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id;
  SELECT id INTO v_zone_lounge FROM zones_dim WHERE zone_code = 'Z007' AND store_id = v_store_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ zones_dim: 7건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.2: retail_concepts (12개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.2] retail_concepts 시딩 (12개)...';

  INSERT INTO retail_concepts (id, store_id, org_id, user_id, concept_name, concept_code, description, category, metadata, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '시즌 프로모션', 'PROMO_SEASON', '계절별 시즌 상품 프로모션 전략', 'promotion', '{"target_increase":15,"duration_days":30}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '신상품 론칭', 'LAUNCH_NEW', '신상품 출시 집중 노출 전략', 'launch', '{"visibility_boost":200,"featured_days":14}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'VIP 고객 케어', 'VIP_CARE', 'VIP 고객 전용 서비스 및 혜택', 'customer_service', '{"discount_rate":10,"priority_service":true}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '크로스셀링', 'CROSS_SELL', '관련 상품 교차 판매 전략', 'sales', '{"recommendation_count":3,"bundle_discount":5}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '업셀링', 'UP_SELL', '상위 상품 업그레이드 판매 전략', 'sales', '{"upgrade_threshold":20,"bonus_points":100}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '재고 최적화', 'STOCK_OPT', '재고 회전율 최적화 전략', 'inventory', '{"target_turnover":4,"reorder_point_days":7}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '동선 최적화', 'FLOW_OPT', '고객 동선 최적화 배치 전략', 'layout', '{"heat_map_analysis":true,"zone_sequence":["Z001","Z002","Z003","Z004","Z005","Z006"]}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '체류시간 증가', 'DWELL_TIME', '존별 체류시간 증가 전략', 'engagement', '{"target_dwell_minutes":8,"engagement_activities":3}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '전환율 향상', 'CONV_BOOST', '방문-구매 전환율 향상 전략', 'conversion', '{"target_rate":55,"touchpoint_count":4}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '객단가 향상', 'AOV_BOOST', '평균 객단가 향상 전략', 'revenue', '{"target_aov":180000,"bundle_count":2}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '재방문 유도', 'RETENTION', '고객 재방문율 향상 전략', 'loyalty', '{"target_return_rate":40,"reward_program":true}', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '피크타임 관리', 'PEAK_MGMT', '피크 시간대 효율적 운영 전략', 'operations', '{"staff_ratio":1.5,"queue_management":true}', true, NOW(), NOW());

  RAISE NOTICE '    ✓ retail_concepts: 12건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.3: data_sources (5개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.3] data_sources 시딩 (5개)...';

  INSERT INTO data_sources (id, store_id, org_id, user_id, name, source_type, connection_info, is_active, sync_frequency, last_sync_at, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'POS 시스템', 'pos', '{"host":"pos.internal","port":5432,"database":"pos_db"}', true, 'realtime', NOW() - INTERVAL '5 minutes', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'WiFi 트래킹', 'wifi', '{"host":"wifi.internal","api_key":"xxx"}', true, 'hourly', NOW() - INTERVAL '1 hour', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '비콘 시스템', 'beacon', '{"host":"beacon.internal","api_key":"xxx"}', true, 'realtime', NOW() - INTERVAL '2 minutes', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'CCTV 분석', 'camera', '{"host":"cctv.internal","stream_count":12}', true, 'hourly', NOW() - INTERVAL '30 minutes', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'CRM 시스템', 'crm', '{"host":"crm.internal","api_endpoint":"/api/v1"}', true, 'daily', NOW() - INTERVAL '6 hours', NOW(), NOW());

  RAISE NOTICE '    ✓ data_sources: 5건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.1: customers (2,500명)
  -- VIP 250, Regular 1250, New 750, Dormant 250
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.1] customers 시딩 (2,500명)...';

  -- VIP 고객 (250명)
  FOR i IN 1..250 LOOP
    INSERT INTO customers (id, store_id, org_id, user_id, customer_code, customer_name, email, phone, segment, tier, total_visits, total_purchases, total_spent, avg_basket_size, last_visit_date, first_visit_date, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_user_id,
      'VIP-' || LPAD(i::TEXT, 4, '0'),
      '고객 VIP-' || i,
      'vip' || i || '@example.com',
      '010-' || LPAD((1000 + i)::TEXT, 4, '0') || '-' || LPAD((1000 + i)::TEXT, 4, '0'),
      'VIP', 'PLATINUM',
      (20 + FLOOR(RANDOM() * 30))::INT,
      (15 + FLOOR(RANDOM() * 25))::INT,
      (2000000 + FLOOR(RANDOM() * 3000000))::NUMERIC,
      (150000 + FLOOR(RANDOM() * 100000))::NUMERIC,
      CURRENT_DATE - (FLOOR(RANDOM() * 14))::INT,
      CURRENT_DATE - INTERVAL '2 years' + (FLOOR(RANDOM() * 365))::INT * INTERVAL '1 day',
      NOW(), NOW()
    );
  END LOOP;
  RAISE NOTICE '    - VIP: 250명';

  -- Regular 고객 (1,250명)
  FOR i IN 1..1250 LOOP
    INSERT INTO customers (id, store_id, org_id, user_id, customer_code, customer_name, email, phone, segment, tier, total_visits, total_purchases, total_spent, avg_basket_size, last_visit_date, first_visit_date, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_user_id,
      'REG-' || LPAD(i::TEXT, 5, '0'),
      '고객 REG-' || i,
      'regular' || i || '@example.com',
      '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((2000 + i)::TEXT, 4, '0'),
      'Regular', 'GOLD',
      (5 + FLOOR(RANDOM() * 15))::INT,
      (3 + FLOOR(RANDOM() * 12))::INT,
      (300000 + FLOOR(RANDOM() * 700000))::NUMERIC,
      (80000 + FLOOR(RANDOM() * 60000))::NUMERIC,
      CURRENT_DATE - (FLOOR(RANDOM() * 30))::INT,
      CURRENT_DATE - INTERVAL '1 year' + (FLOOR(RANDOM() * 300))::INT * INTERVAL '1 day',
      NOW(), NOW()
    );
  END LOOP;
  RAISE NOTICE '    - Regular: 1,250명';

  -- New 고객 (750명)
  FOR i IN 1..750 LOOP
    INSERT INTO customers (id, store_id, org_id, user_id, customer_code, customer_name, email, phone, segment, tier, total_visits, total_purchases, total_spent, avg_basket_size, last_visit_date, first_visit_date, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_user_id,
      'NEW-' || LPAD(i::TEXT, 5, '0'),
      '고객 NEW-' || i,
      'new' || i || '@example.com',
      '010-' || LPAD((4000 + i)::TEXT, 4, '0') || '-' || LPAD((4000 + i)::TEXT, 4, '0'),
      'New', 'SILVER',
      (1 + FLOOR(RANDOM() * 3))::INT,
      (0 + FLOOR(RANDOM() * 2))::INT,
      (0 + FLOOR(RANDOM() * 200000))::NUMERIC,
      (50000 + FLOOR(RANDOM() * 50000))::NUMERIC,
      CURRENT_DATE - (FLOOR(RANDOM() * 30))::INT,
      CURRENT_DATE - (FLOOR(RANDOM() * 60))::INT * INTERVAL '1 day',
      NOW(), NOW()
    );
  END LOOP;
  RAISE NOTICE '    - New: 750명';

  -- Dormant 고객 (250명)
  FOR i IN 1..250 LOOP
    INSERT INTO customers (id, store_id, org_id, user_id, customer_code, customer_name, email, phone, segment, tier, total_visits, total_purchases, total_spent, avg_basket_size, last_visit_date, first_visit_date, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_user_id,
      'DOR-' || LPAD(i::TEXT, 4, '0'),
      '고객 DOR-' || i,
      'dormant' || i || '@example.com',
      '010-' || LPAD((5000 + i)::TEXT, 4, '0') || '-' || LPAD((5000 + i)::TEXT, 4, '0'),
      'Dormant', 'BRONZE',
      (3 + FLOOR(RANDOM() * 10))::INT,
      (2 + FLOOR(RANDOM() * 5))::INT,
      (200000 + FLOOR(RANDOM() * 400000))::NUMERIC,
      (70000 + FLOOR(RANDOM() * 40000))::NUMERIC,
      CURRENT_DATE - (90 + FLOOR(RANDOM() * 180))::INT,
      CURRENT_DATE - INTERVAL '18 months' + (FLOOR(RANDOM() * 180))::INT * INTERVAL '1 day',
      NOW(), NOW()
    );
  END LOOP;
  RAISE NOTICE '    - Dormant: 250명';
  RAISE NOTICE '    ✓ customers: 2,500건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.2: staff (8명)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.2] staff 시딩 (8명)...';

  INSERT INTO staff (id, store_id, user_id, staff_code, staff_name, role, zone_id, avatar_url, avatar_position, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP001', '매니저', 'manager', v_zone_main,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_manager_01.glb',
   '{"x": 0, "y": 0, "z": -2}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP002', '판매직원 1', 'sales', v_zone_clothing,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_sales_01.glb',
   '{"x": -7, "y": 0, "z": -3}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP003', '판매직원 2', 'sales', v_zone_accessory,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_sales_02.glb',
   '{"x": 6.5, "y": 0, "z": -3.5}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP004', '계산원 1', 'cashier', v_zone_checkout,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_cashier_01.glb',
   '{"x": 7, "y": 0, "z": 6.5}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP005', '계산원 2', 'cashier', v_zone_checkout,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_cashier_02.glb',
   '{"x": 7, "y": 0, "z": 5.5}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP006', '보안요원', 'security', v_zone_entrance,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_security_01.glb',
   '{"x": 0, "y": 0, "z": -8.5}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP007', '피팅룸 담당', 'fitting', v_zone_fitting,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_fitting_01.glb',
   '{"x": -8.5, "y": 0, "z": 5}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP008', '안내직원', 'greeter', v_zone_entrance,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/staff/avatar_greeter_01.glb',
   '{"x": 1.5, "y": 0, "z": -8}'::jsonb, true, NOW(), NOW());

  RAISE NOTICE '    ✓ staff: 8건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.3: store_goals (6개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.3] store_goals 시딩 (6개)...';

  INSERT INTO store_goals (id, store_id, org_id, user_id, goal_name, goal_type, target_value, current_value, unit, period_start, period_end, status, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '월간 매출 목표', 'revenue', 500000000, 420000000, 'KRW', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '일일 방문자 수', 'traffic', 100, 85, 'visitors', CURRENT_DATE, CURRENT_DATE, 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '전환율 목표', 'conversion', 55, 48.5, 'percent', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '평균 객단가', 'aov', 180000, 165000, 'KRW', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'VIP 고객 방문', 'vip_visits', 50, 42, 'visitors', DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '재고 회전율', 'inventory_turnover', 4, 3.8, 'times', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW());

  RAISE NOTICE '    ✓ store_goals: 6건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.4: store_scenes (2개: As-Is, To-Be)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.4] store_scenes 시딩 (2개)...';

  INSERT INTO store_scenes (id, store_id, org_id, user_id, scene_name, scene_type, description, layout_data, is_active, is_default, version, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '현재 레이아웃 (As-Is)', 'as_is', '현재 매장 레이아웃 및 가구 배치',
   '{"zones":7,"furniture_count":68,"last_optimized":null,"optimization_score":72}', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, '최적화 레이아웃 (To-Be)', 'to_be', 'AI 추천 최적화 레이아웃',
   '{"zones":7,"furniture_count":68,"last_optimized":"2024-12-15","optimization_score":89,"changes":[{"type":"move","furniture_id":"RACK-001","from":{"x":-8.5,"z":-2},"to":{"x":-8.0,"z":-2.5}}]}', true, false, 1, NOW(), NOW());

  RAISE NOTICE '    ✓ store_scenes: 2건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.5: customer_segments (4개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.5] customer_segments 시딩 (4개)...';

  INSERT INTO customer_segments (id, store_id, org_id, segment_name, segment_code, description, criteria, customer_count, avg_ltv, avg_purchase_frequency, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, 'VIP 고객', 'VIP', '최상위 고객 세그먼트 - 높은 구매력과 충성도',
   '{"min_total_spent":2000000,"min_visits":20,"tier":"PLATINUM"}', 250, 3500000, 12.5, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '일반 고객', 'REGULAR', '정기적으로 방문하는 일반 고객',
   '{"min_total_spent":300000,"min_visits":5,"tier":"GOLD"}', 1250, 650000, 6.2, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '신규 고객', 'NEW', '최근 3개월 내 신규 가입 고객',
   '{"max_visits":3,"first_visit_within_days":90,"tier":"SILVER"}', 750, 95000, 1.5, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '휴면 고객', 'DORMANT', '90일 이상 방문하지 않은 고객',
   '{"last_visit_over_days":90,"tier":"BRONZE"}', 250, 350000, 0.5, NOW(), NOW());

  RAISE NOTICE '    ✓ customer_segments: 4건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_02 완료: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ zones_dim: 7건';
  RAISE NOTICE '  ✓ retail_concepts: 12건';
  RAISE NOTICE '  ✓ data_sources: 5건';
  RAISE NOTICE '  ✓ customers: 2,500건 (VIP:250, Regular:1250, New:750, Dormant:250)';
  RAISE NOTICE '  ✓ staff: 8건';
  RAISE NOTICE '  ✓ store_goals: 6건';
  RAISE NOTICE '  ✓ store_scenes: 2건';
  RAISE NOTICE '  ✓ customer_segments: 4건';
  RAISE NOTICE '  총 삽입: ~2,544건';
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'zones_dim' as table_name, COUNT(*) as row_count FROM zones_dim
UNION ALL SELECT 'retail_concepts', COUNT(*) FROM retail_concepts
UNION ALL SELECT 'data_sources', COUNT(*) FROM data_sources
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'store_goals', COUNT(*) FROM store_goals
UNION ALL SELECT 'store_scenes', COUNT(*) FROM store_scenes
UNION ALL SELECT 'customer_segments', COUNT(*) FROM customer_segments
ORDER BY table_name;
