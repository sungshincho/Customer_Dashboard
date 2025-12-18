-- ============================================================================
-- NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터
-- ============================================================================
-- 실행 순서: SEED_01_CLEANUP.sql 이후 실행
-- 목적: zones_dim, retail_concepts, data_sources, customers, staff, store_goals, store_scenes
-- 예상 레코드: ~2,540건
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_count INT;
  i INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2.1: zones_dim (7개 존)
  -- ============================================================================
  RAISE NOTICE '  [STEP 2.1] zones_dim 시딩 (7건)...';

  INSERT INTO zones_dim (id, store_id, user_id, org_id, zone_code, zone_name, zone_type, zone_color, floor_number, area_sqm, boundary_polygon, created_at, updated_at, metadata) VALUES
  ('a0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'Z001', '입구', 'entrance', '#4CAF50', 1, 25.0,
   '[{"x":-2,"y":0,"z":-10},{"x":2,"y":0,"z":-10},{"x":2,"y":0,"z":-7},{"x":-2,"y":0,"z":-7}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_entrance_01.glb"}'::jsonb),

  ('a0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'Z002', '메인홀', 'main', '#2196F3', 1, 80.0,
   '[{"x":-5,"y":0,"z":-7},{"x":5,"y":0,"z":-7},{"x":5,"y":0,"z":3},{"x":-5,"y":0,"z":3}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_main_01.glb"}'::jsonb),

  ('a0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'Z003', '의류존', 'clothing', '#9C27B0', 1, 60.0,
   '[{"x":-10,"y":0,"z":-7},{"x":-5,"y":0,"z":-7},{"x":-5,"y":0,"z":3},{"x":-10,"y":0,"z":3}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_clothing_01.glb"}'::jsonb),

  ('a0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'Z004', '액세서리존', 'accessory', '#FF9800', 1, 45.0,
   '[{"x":5,"y":0,"z":-7},{"x":10,"y":0,"z":-7},{"x":10,"y":0,"z":0},{"x":5,"y":0,"z":0}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_accessory_01.glb"}'::jsonb),

  ('a0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'Z005', '피팅룸', 'fitting', '#E91E63', 1, 30.0,
   '[{"x":-10,"y":0,"z":3},{"x":-6,"y":0,"z":3},{"x":-6,"y":0,"z":10},{"x":-10,"y":0,"z":10}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_fitting_01.glb"}'::jsonb),

  ('a0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, 'Z006', '계산대', 'checkout', '#F44336', 1, 25.0,
   '[{"x":5,"y":0,"z":3},{"x":10,"y":0,"z":3},{"x":10,"y":0,"z":10},{"x":5,"y":0,"z":10}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_checkout_01.glb"}'::jsonb),

  ('a0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, 'Z007', '휴식공간', 'lounge', '#00BCD4', 1, 35.0,
   '[{"x":-6,"y":0,"z":7},{"x":5,"y":0,"z":7},{"x":5,"y":0,"z":10},{"x":-6,"y":0,"z":10}]'::jsonb,
   NOW(), NOW(),
   '{"model_3d_url":"https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_lounge_01.glb"}'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    zone_name = EXCLUDED.zone_name,
    zone_type = EXCLUDED.zone_type,
    zone_color = EXCLUDED.zone_color,
    boundary_polygon = EXCLUDED.boundary_polygon,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ zones_dim: % rows inserted/updated', v_count;

  -- ============================================================================
  -- STEP 2.2: retail_concepts (12개)
  -- ============================================================================
  RAISE NOTICE '  [STEP 2.2] retail_concepts 시딩 (12건)...';

  INSERT INTO retail_concepts (id, store_id, user_id, org_id, name, category, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '프리미엄 경험', 'experience', '고급스러운 쇼핑 경험 제공', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '개인화 서비스', 'service', '고객 맞춤형 스타일링 제안', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '시즌 컬렉션', 'product', '계절별 신상품 큐레이션', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '지속가능성', 'value', '친환경 소재 및 공정무역 제품', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '한정판 아이템', 'product', '독점 한정판 상품 제공', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '스마트 피팅', 'technology', 'AR 가상 피팅 서비스', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '로열티 프로그램', 'loyalty', 'VIP 멤버십 혜택', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '옴니채널', 'channel', '온오프라인 통합 경험', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '트렌드 리더', 'positioning', '패션 트렌드 선도', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '커뮤니티 허브', 'experience', '패션 커뮤니티 공간', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '셀프 서비스', 'service', '무인 결제 및 셀프 체크아웃', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '브랜드 스토리', 'branding', '브랜드 히스토리 전시', NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ retail_concepts: % rows inserted', v_count;

  -- ============================================================================
  -- STEP 2.3: data_sources (5개)
  -- ============================================================================
  RAISE NOTICE '  [STEP 2.3] data_sources 시딩 (5건)...';

  INSERT INTO data_sources (id, store_id, user_id, org_id, name, source_type, connection_string, is_active, created_at, updated_at) VALUES
  ('d0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'POS 시스템', 'pos', 'pos://192.168.1.100:5432/pos_db', true, NOW(), NOW()),
  ('d0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'WiFi 트래킹', 'wifi', 'wifi://192.168.1.101:8080/tracking', true, NOW(), NOW()),
  ('d0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'CCTV 분석', 'camera', 'rtsp://192.168.1.102:554/stream', true, NOW(), NOW()),
  ('d0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'IoT 센서', 'iot', 'mqtt://192.168.1.103:1883/sensors', true, NOW(), NOW()),
  ('d0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'CRM 시스템', 'crm', 'https://crm.example.com/api/v1', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    source_type = EXCLUDED.source_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ data_sources: % rows inserted/updated', v_count;

  -- ============================================================================
  -- STEP 3.1: customers (2,500명)
  -- VIP: 250명 (10%), Regular: 1,250명 (50%), New: 750명 (30%), Dormant: 250명 (10%)
  -- ============================================================================
  RAISE NOTICE '  [STEP 3.1] customers 시딩 (2,500건)...';

  -- VIP 고객 (250명)
  FOR i IN 1..250 LOOP
    INSERT INTO customers (
      id, store_id, user_id, org_id, customer_code, customer_name,
      email, phone, gender, age_group, segment, loyalty_tier,
      total_purchases, total_spent, visit_count, last_visit_date,
      created_at, updated_at
    ) VALUES (
      ('c0000001-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID,
      v_store_id, v_user_id, v_org_id,
      'VIP-' || LPAD(i::TEXT, 4, '0'),
      '김VIP' || i,
      'vip' || i || '@example.com',
      '010-' || LPAD((1000 + i)::TEXT, 4, '0') || '-' || LPAD((i * 7 % 10000)::TEXT, 4, '0'),
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      CASE WHEN i % 5 = 0 THEN '20s' WHEN i % 5 = 1 THEN '30s' WHEN i % 5 = 2 THEN '40s' WHEN i % 5 = 3 THEN '50s' ELSE '60s+' END,
      'VIP',
      'platinum',
      50 + (i % 100),
      2500000 + (i * 50000),
      30 + (i % 50),
      CURRENT_DATE - (i % 30),
      NOW() - INTERVAL '1 year' * (i % 5),
      NOW()
    );
  END LOOP;

  -- Regular 고객 (1,250명)
  FOR i IN 1..1250 LOOP
    INSERT INTO customers (
      id, store_id, user_id, org_id, customer_code, customer_name,
      email, phone, gender, age_group, segment, loyalty_tier,
      total_purchases, total_spent, visit_count, last_visit_date,
      created_at, updated_at
    ) VALUES (
      ('c0000002-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID,
      v_store_id, v_user_id, v_org_id,
      'REG-' || LPAD(i::TEXT, 4, '0'),
      '이레귤러' || i,
      'regular' || i || '@example.com',
      '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((i * 11 % 10000)::TEXT, 4, '0'),
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      CASE WHEN i % 5 = 0 THEN '20s' WHEN i % 5 = 1 THEN '30s' WHEN i % 5 = 2 THEN '40s' WHEN i % 5 = 3 THEN '50s' ELSE '60s+' END,
      'Regular',
      CASE WHEN i % 3 = 0 THEN 'gold' WHEN i % 3 = 1 THEN 'silver' ELSE 'bronze' END,
      10 + (i % 40),
      300000 + (i * 10000),
      8 + (i % 20),
      CURRENT_DATE - (i % 60),
      NOW() - INTERVAL '6 months' * (i % 4),
      NOW()
    );
  END LOOP;

  -- New 고객 (750명)
  FOR i IN 1..750 LOOP
    INSERT INTO customers (
      id, store_id, user_id, org_id, customer_code, customer_name,
      email, phone, gender, age_group, segment, loyalty_tier,
      total_purchases, total_spent, visit_count, last_visit_date,
      created_at, updated_at
    ) VALUES (
      ('c0000003-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID,
      v_store_id, v_user_id, v_org_id,
      'NEW-' || LPAD(i::TEXT, 4, '0'),
      '박신규' || i,
      'new' || i || '@example.com',
      '010-' || LPAD((3000 + i)::TEXT, 4, '0') || '-' || LPAD((i * 13 % 10000)::TEXT, 4, '0'),
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      CASE WHEN i % 4 = 0 THEN '20s' WHEN i % 4 = 1 THEN '30s' WHEN i % 4 = 2 THEN '40s' ELSE '50s' END,
      'New',
      'bronze',
      1 + (i % 5),
      50000 + (i * 5000),
      1 + (i % 3),
      CURRENT_DATE - (i % 14),
      NOW() - INTERVAL '1 month' * (i % 3),
      NOW()
    );
  END LOOP;

  -- Dormant 고객 (250명)
  FOR i IN 1..250 LOOP
    INSERT INTO customers (
      id, store_id, user_id, org_id, customer_code, customer_name,
      email, phone, gender, age_group, segment, loyalty_tier,
      total_purchases, total_spent, visit_count, last_visit_date,
      created_at, updated_at
    ) VALUES (
      ('c0000004-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID,
      v_store_id, v_user_id, v_org_id,
      'DOR-' || LPAD(i::TEXT, 4, '0'),
      '최휴면' || i,
      'dormant' || i || '@example.com',
      '010-' || LPAD((4000 + i)::TEXT, 4, '0') || '-' || LPAD((i * 17 % 10000)::TEXT, 4, '0'),
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      CASE WHEN i % 5 = 0 THEN '30s' WHEN i % 5 = 1 THEN '40s' WHEN i % 5 = 2 THEN '50s' ELSE '60s+' END,
      'Dormant',
      'bronze',
      5 + (i % 15),
      150000 + (i * 8000),
      5 + (i % 10),
      CURRENT_DATE - INTERVAL '91 days' - (i % 180),
      NOW() - INTERVAL '2 years' * (i % 3),
      NOW()
    );
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM customers WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ customers: % rows total', v_count;

  -- ============================================================================
  -- STEP 3.2: staff (8명)
  -- ============================================================================
  RAISE NOTICE '  [STEP 3.2] staff 시딩 (8건)...';

  INSERT INTO staff (id, store_id, user_id, staff_code, staff_name, role, zone_id, avatar_url, avatar_position, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP001', '매니저', 'manager',
   'a0000002-0000-0000-0000-000000000002'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_manager_01.glb',
   '{"x": 0, "y": 0, "z": -2}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP002', '판매직원 1', 'sales',
   'a0000003-0000-0000-0000-000000000003'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_sales_01.glb',
   '{"x": -7, "y": 0, "z": -3}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP003', '판매직원 2', 'sales',
   'a0000004-0000-0000-0000-000000000004'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_sales_02.glb',
   '{"x": 6.5, "y": 0, "z": -3.5}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP004', '계산원 1', 'cashier',
   'a0000006-0000-0000-0000-000000000006'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_cashier_01.glb',
   '{"x": 7, "y": 0, "z": 6.5}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP005', '계산원 2', 'cashier',
   'a0000006-0000-0000-0000-000000000006'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_cashier_02.glb',
   '{"x": 7, "y": 0, "z": 5.5}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP006', '보안요원', 'security',
   'a0000001-0000-0000-0000-000000000001'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_security_01.glb',
   '{"x": 0, "y": 0, "z": -8.5}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP007', '피팅룸 담당', 'fitting',
   'a0000005-0000-0000-0000-000000000005'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_fitting_01.glb',
   '{"x": -8.5, "y": 0, "z": 5}'::jsonb, true, NOW(), NOW()),

  (gen_random_uuid(), v_store_id, v_user_id, 'EMP008', '안내직원', 'greeter',
   'a0000001-0000-0000-0000-000000000001'::UUID,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_greeter_01.glb',
   '{"x": 1.5, "y": 0, "z": -8}'::jsonb, true, NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ staff: % rows inserted', v_count;

  -- ============================================================================
  -- STEP 3.3: store_goals (6개)
  -- ============================================================================
  RAISE NOTICE '  [STEP 3.3] store_goals 시딩 (6건)...';

  INSERT INTO store_goals (id, store_id, user_id, org_id, goal_name, goal_type, target_value, current_value, start_date, end_date, status, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '월간 매출 목표', 'revenue', 150000000, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '전환율 목표', 'conversion', 35.0, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '일일 방문객 목표', 'visitors', 150, 0, CURRENT_DATE, CURRENT_DATE, 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '평균 객단가 목표', 'aov', 180000, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'VIP 고객 구매율', 'vip_rate', 60.0, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '신규 고객 유치', 'new_customers', 200, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'active', NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ store_goals: % rows inserted', v_count;

  -- ============================================================================
  -- STEP 3.4: store_scenes (2개)
  -- ============================================================================
  RAISE NOTICE '  [STEP 3.4] store_scenes 시딩 (2건)...';

  INSERT INTO store_scenes (id, store_id, user_id, org_id, scene_name, scene_type, description, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'As-Is 레이아웃', 'current', '현재 매장 레이아웃 상태', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'To-Be 최적화안', 'optimized', 'AI 최적화 추천 레이아웃', false, NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    ✓ store_scenes: % rows inserted', v_count;

  -- ============================================================================
  -- 완료 리포트
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_02 완료: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ zones_dim:       7건';
  RAISE NOTICE '  ✓ retail_concepts: 12건';
  RAISE NOTICE '  ✓ data_sources:    5건';
  RAISE NOTICE '  ✓ customers:       2,500건';
  RAISE NOTICE '  ✓ staff:           8건';
  RAISE NOTICE '  ✓ store_goals:     6건';
  RAISE NOTICE '  ✓ store_scenes:    2건';
  RAISE NOTICE '  ────────────────────────────────';
  RAISE NOTICE '  총 레코드:         ~2,540건';
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'zones_dim' as table_name, COUNT(*) as count FROM zones_dim WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'retail_concepts', COUNT(*) FROM retail_concepts WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'data_sources', COUNT(*) FROM data_sources WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'staff', COUNT(*) FROM staff WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'store_goals', COUNT(*) FROM store_goals WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'store_scenes', COUNT(*) FROM store_scenes WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY table_name;
