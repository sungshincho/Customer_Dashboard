-- ============================================================================
-- NEURALTWIN v8.3: Unified Products & Furniture Seed
-- ============================================================================
-- Description:
--   1. Update products with consistent SKUs matching v8.2 slot definitions
--   2. Add display_type to all products
--   3. Create furniture entities for 3D scene
--   4. Link furniture_slots to actual furniture IDs
--
-- Prerequisites:
--   - Run NEURALTWIN_UNIFIED_SEED_v8.sql first (base data)
--   - Run 20251216_furniture_table.sql migration
--   - Run 20251216_product_placement_and_avatars.sql migration
--   - Run 20251216_display_type_and_slots.sql migration
--
-- Execution Order:
--   1. NEURALTWIN_UNIFIED_SEED_v8.sql
--   2. 20251216_furniture_table.sql
--   3. 20251216_product_placement_and_avatars.sql
--   4. 20251216_display_type_and_slots.sql
--   5. THIS FILE (v8.3)
--   6. NEURALTWIN_v8.1_avatar_placement_data.sql (updated)
--   7. NEURALTWIN_v8.2_furniture_slots.sql (updated)
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete and Recreate Products with Consistent SKUs (25개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get IDs from existing store
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Run NEURALTWIN_UNIFIED_SEED_v8.sql first.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Updating Products with Consistent SKUs (25개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing products (cascade will handle related records)
  DELETE FROM products WHERE store_id = v_store_id;

  -- Insert products with consistent SKUs and display_type
  INSERT INTO products (
    id, store_id, user_id, org_id,
    product_name, sku, category, price, cost_price, stock,
    display_type, created_at
  ) VALUES
  -- 아우터 (2개) - hanging
  ('f0000001-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 캐시미어 코트', 'SKU-OUT-001', '아우터', 450000, 180000, 15, 'hanging', NOW()),
  ('f0000002-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '울 테일러드 재킷', 'SKU-OUT-002', '아우터', 380000, 152000, 20, 'hanging', NOW()),

  -- 상의 (4개) - hanging
  ('f0000003-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실크 블라우스', 'SKU-TOP-001', '상의', 120000, 48000, 25, 'hanging', NOW()),
  ('f0000004-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '캐주얼 니트 스웨터', 'SKU-TOP-002', '상의', 98000, 39200, 30, 'hanging', NOW()),
  ('f0000005-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '옥스포드 셔츠', 'SKU-TOP-003', '상의', 85000, 34000, 35, 'hanging', NOW()),
  ('f0000006-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '린넨 탑', 'SKU-TOP-004', '상의', 75000, 30000, 28, 'hanging', NOW()),

  -- 하의 (3개) - hanging
  ('f0000007-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '슬림핏 데님', 'SKU-BTM-001', '하의', 128000, 51200, 40, 'hanging', NOW()),
  ('f0000008-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '치노 팬츠', 'SKU-BTM-002', '하의', 95000, 38000, 35, 'hanging', NOW()),
  ('f0000009-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   'A라인 스커트', 'SKU-BTM-003', '하의', 88000, 35200, 25, 'hanging', NOW()),

  -- 신발 (3개) - standing
  ('f0000010-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 로퍼', 'SKU-SHO-001', '신발', 280000, 112000, 18, 'standing', NOW()),
  ('f0000011-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '하이힐 펌프스', 'SKU-SHO-002', '신발', 320000, 128000, 12, 'standing', NOW()),
  ('f0000012-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 스니커즈', 'SKU-SHO-003', '신발', 198000, 79200, 25, 'standing', NOW()),

  -- 가방 (2개) - hanging
  ('f0000013-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '가죽 토트백', 'SKU-BAG-001', '가방', 350000, 140000, 10, 'hanging', NOW()),
  ('f0000014-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '크로스바디백', 'SKU-BAG-002', '가방', 180000, 72000, 15, 'hanging', NOW()),

  -- 스카프 (1개) - hanging
  ('f0000015-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실크 스카프', 'SKU-SCA-001', '스카프', 85000, 34000, 20, 'hanging', NOW()),

  -- 벨트 (1개) - standing
  ('f0000016-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '가죽 벨트', 'SKU-BLT-001', '벨트', 120000, 48000, 30, 'standing', NOW()),

  -- 시계 (1개) - standing
  ('f0000017-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '클래식 손목시계', 'SKU-WAT-001', '시계', 450000, 180000, 8, 'standing', NOW()),

  -- 쥬얼리 (2개) - standing
  ('f0000018-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실버 목걸이', 'SKU-JWL-001', '쥬얼리', 180000, 72000, 12, 'standing', NOW()),
  ('f0000019-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '골드 귀걸이', 'SKU-JWL-002', '쥬얼리', 220000, 88000, 10, 'standing', NOW()),

  -- 속옷 (1개) - folded
  ('f0000020-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 속옷 세트', 'SKU-UND-001', '속옷', 65000, 26000, 40, 'folded', NOW()),

  -- 양말 (1개) - folded
  ('f0000021-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 양말 팩', 'SKU-SOC-001', '양말', 25000, 10000, 60, 'folded', NOW()),

  -- 모자 (1개) - standing
  ('f0000022-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '페도라 모자', 'SKU-HAT-001', '모자', 95000, 38000, 15, 'standing', NOW()),

  -- 안경 (1개) - standing
  ('f0000023-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 선글라스', 'SKU-GLS-001', '안경', 280000, 112000, 10, 'standing', NOW()),

  -- 선물세트 (1개) - boxed (MVP 테스트용)
  ('f0000024-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 선물 세트', 'SKU-GFT-001', '선물세트', 150000, 60000, 20, 'boxed', NOW()),

  -- 티셔츠 팩 (1개) - stacked (MVP 테스트용)
  ('f0000025-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '베이직 티셔츠 3팩', 'SKU-TSK-001', '티셔츠', 55000, 22000, 50, 'stacked', NOW());

  RAISE NOTICE '  ✓ products: 25건 생성 (SKU 일관성 확보)';
  RAISE NOTICE '    - hanging: 12개 (아우터, 상의, 하의, 가방, 스카프)';
  RAISE NOTICE '    - standing: 8개 (신발, 벨트, 시계, 쥬얼리, 모자, 안경)';
  RAISE NOTICE '    - folded: 2개 (속옷, 양말)';
  RAISE NOTICE '    - boxed: 1개 (선물세트)';
  RAISE NOTICE '    - stacked: 1개 (티셔츠팩)';
END $$;

-- ============================================================================
-- STEP 2: Create Furniture Entities (MVP 12개 중 가구 4개 + 추가)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_clothing UUID;
  v_zone_accessory UUID;
  v_zone_shoes UUID;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores LIMIT 1;

  -- Get zone IDs
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;

  IF v_zone_clothing IS NULL THEN
    -- Use first available display zone
    SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_type = 'display' AND store_id = v_store_id LIMIT 1;
  END IF;

  IF v_zone_accessory IS NULL THEN
    v_zone_accessory := v_zone_clothing;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Creating Furniture Entities';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing furniture
  DELETE FROM furniture WHERE store_id = v_store_id;

  -- Insert furniture for clothing zone (의류존 Z003)
  INSERT INTO furniture (
    id, store_id, user_id, org_id, zone_id,
    furniture_code, furniture_name, furniture_type,
    width, height, depth,
    position, rotation, scale,
    movable, is_active
  ) VALUES
  -- 의류 행거 (더블) - 4개
  ('b0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-001', '의류 행거 (더블) #1', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-6,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-002', '의류 행거 (더블) #2', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-4,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-003', '의류 행거 (더블) #3', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-6,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-004', '의류 행거 (더블) #4', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-4,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- 선반형 진열대 (MVP: shelf_simple) - 2개
  ('b0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'SHELF-001', '선반형 진열대 #1', 'shelf_display',
   1.0, 1.8, 0.4, '{"x":-3,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'SHELF-002', '선반형 진열대 #2', 'shelf_display',
   1.0, 1.8, 0.4, '{"x":-2,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- 테이블 디스플레이 (MVP: table_simple) - 2개
  ('b0000021-0000-0000-0000-000000000021'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'TABLE-001', '테이블 디스플레이 #1', 'table_display',
   1.2, 0.9, 0.8, '{"x":-5,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000022-0000-0000-0000-000000000022'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'TABLE-002', '테이블 디스플레이 #2', 'table_display',
   1.2, 0.9, 0.8, '{"x":-3,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- 신발 진열대 (MVP: rack_shoes_simple) - 2개
  ('b0000031-0000-0000-0000-000000000031'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'SHOE-001', '신발 진열대 #1', 'shoe_rack',
   1.2, 1.5, 0.4, '{"x":4,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000032-0000-0000-0000-000000000032'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'SHOE-002', '신발 진열대 #2', 'shoe_rack',
   1.2, 1.5, 0.4, '{"x":6,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- 유리 쇼케이스 (액세서리용) - 2개
  ('b0000041-0000-0000-0000-000000000041'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'SHOWCASE-001', '유리 쇼케이스 #1', 'glass_showcase',
   1.0, 1.2, 0.5, '{"x":5,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   false, true),
  ('b0000042-0000-0000-0000-000000000042'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'SHOWCASE-002', '유리 쇼케이스 #2', 'glass_showcase',
   1.0, 1.2, 0.5, '{"x":6,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   false, true);

  RAISE NOTICE '  ✓ furniture: 12건 생성';
  RAISE NOTICE '    - clothing_rack_double: 4개 (의류 행거)';
  RAISE NOTICE '    - shelf_display: 2개 (선반형 진열대)';
  RAISE NOTICE '    - table_display: 2개 (테이블 디스플레이)';
  RAISE NOTICE '    - shoe_rack: 2개 (신발 진열대)';
  RAISE NOTICE '    - glass_showcase: 2개 (유리 쇼케이스)';
END $$;

-- ============================================================================
-- STEP 3: Create Furniture Slots (실제 furniture_id 사용)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Creating Furniture Slots (Linked to Furniture)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing slots
  DELETE FROM furniture_slots WHERE store_id = v_store_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 의류 행거 슬롯 (각 랙당 10개 행거 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════

  -- RACK-001 행거 슬롯 (H1~H10)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000001-0000-0000-0000-000000000001'::uuid,
    'clothing_rack_double',
    'H' || row_num,
    'hanger',
    jsonb_build_object('x', -0.5 + (row_num - 1) * 0.11, 'y', 1.6, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['hanging'],
    0.6, 1.2, 0.3,
    v_store_id
  FROM generate_series(1, 10) AS row_num;

  -- RACK-002 행거 슬롯 (H1~H10)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000002-0000-0000-0000-000000000002'::uuid,
    'clothing_rack_double',
    'H' || row_num,
    'hanger',
    jsonb_build_object('x', -0.5 + (row_num - 1) * 0.11, 'y', 1.6, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['hanging'],
    0.6, 1.2, 0.3,
    v_store_id
  FROM generate_series(1, 10) AS row_num;

  -- RACK-003 행거 슬롯 (H1~H10)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000003-0000-0000-0000-000000000003'::uuid,
    'clothing_rack_double',
    'H' || row_num,
    'hanger',
    jsonb_build_object('x', -0.5 + (row_num - 1) * 0.11, 'y', 1.6, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['hanging'],
    0.6, 1.2, 0.3,
    v_store_id
  FROM generate_series(1, 10) AS row_num;

  -- RACK-004 행거 슬롯 (H1~H10)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000004-0000-0000-0000-000000000004'::uuid,
    'clothing_rack_double',
    'H' || row_num,
    'hanger',
    jsonb_build_object('x', -0.5 + (row_num - 1) * 0.11, 'y', 1.6, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['hanging'],
    0.6, 1.2, 0.3,
    v_store_id
  FROM generate_series(1, 10) AS row_num;

  RAISE NOTICE '  ✓ 의류 행거 슬롯: 40개 (4랙 × 10슬롯)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 선반형 진열대 슬롯 (각 선반당 4단 × 3열 = 12슬롯)
  -- ═══════════════════════════════════════════════════════════════════════

  -- SHELF-001 슬롯 (S1-1 ~ S4-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000011-0000-0000-0000-000000000011'::uuid,
    'shelf_display',
    'S' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.3 + (col_num - 1) * 0.3, 'y', 0.2 + (shelf_level - 1) * 0.4, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'boxed', 'standing'],
    0.3, 0.35, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num;

  -- SHELF-002 슬롯 (S1-1 ~ S4-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000012-0000-0000-0000-000000000012'::uuid,
    'shelf_display',
    'S' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.3 + (col_num - 1) * 0.3, 'y', 0.2 + (shelf_level - 1) * 0.4, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'boxed', 'standing'],
    0.3, 0.35, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num;

  RAISE NOTICE '  ✓ 선반 슬롯: 24개 (2선반 × 12슬롯)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 테이블 디스플레이 슬롯 (각 테이블당 2×3 = 6슬롯)
  -- ═══════════════════════════════════════════════════════════════════════

  -- TABLE-001 슬롯 (T1-1 ~ T2-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000021-0000-0000-0000-000000000021'::uuid,
    'table_display',
    'T' || row_num || '-' || col_num,
    'table',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.35, 'y', 0.9, 'z', -0.2 + (row_num - 1) * 0.4),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'boxed', 'stacked'],
    0.35, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 2) AS row_num, generate_series(1, 3) AS col_num;

  -- TABLE-002 슬롯 (T1-1 ~ T2-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000022-0000-0000-0000-000000000022'::uuid,
    'table_display',
    'T' || row_num || '-' || col_num,
    'table',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.35, 'y', 0.9, 'z', -0.2 + (row_num - 1) * 0.4),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'boxed', 'stacked'],
    0.35, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 2) AS row_num, generate_series(1, 3) AS col_num;

  RAISE NOTICE '  ✓ 테이블 슬롯: 12개 (2테이블 × 6슬롯)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 신발 진열대 슬롯 (각 랙당 4단 × 4열 = 16슬롯)
  -- ═══════════════════════════════════════════════════════════════════════

  -- SHOE-001 슬롯 (R1-1 ~ R4-4)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000031-0000-0000-0000-000000000031'::uuid,
    'shoe_rack',
    'R' || shelf_level || '-' || col_num,
    'rack',
    jsonb_build_object('x', -0.4 + (col_num - 1) * 0.27, 'y', 0.15 + (shelf_level - 1) * 0.35, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['standing'],
    0.25, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 4) AS col_num;

  -- SHOE-002 슬롯 (R1-1 ~ R4-4)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000032-0000-0000-0000-000000000032'::uuid,
    'shoe_rack',
    'R' || shelf_level || '-' || col_num,
    'rack',
    jsonb_build_object('x', -0.4 + (col_num - 1) * 0.27, 'y', 0.15 + (shelf_level - 1) * 0.35, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['standing'],
    0.25, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 4) AS col_num;

  RAISE NOTICE '  ✓ 신발 진열대 슬롯: 32개 (2랙 × 16슬롯)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 유리 쇼케이스 슬롯 (각 쇼케이스당 3단 × 4열 = 12슬롯)
  -- ═══════════════════════════════════════════════════════════════════════

  -- SHOWCASE-001 슬롯 (C1-1 ~ C3-4)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000041-0000-0000-0000-000000000041'::uuid,
    'glass_showcase',
    'C' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.23, 'y', 0.3 + (shelf_level - 1) * 0.3, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['standing'],
    0.2, 0.25, 0.2,
    v_store_id
  FROM generate_series(1, 3) AS shelf_level, generate_series(1, 4) AS col_num;

  -- SHOWCASE-002 슬롯 (C1-1 ~ C3-4)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000042-0000-0000-0000-000000000042'::uuid,
    'glass_showcase',
    'C' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.23, 'y', 0.3 + (shelf_level - 1) * 0.3, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['standing'],
    0.2, 0.25, 0.2,
    v_store_id
  FROM generate_series(1, 3) AS shelf_level, generate_series(1, 4) AS col_num;

  RAISE NOTICE '  ✓ 쇼케이스 슬롯: 24개 (2쇼케이스 × 12슬롯)';
  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  총 슬롯: 132개';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 4: Summary & Verification
-- ============================================================================
DO $$
DECLARE
  v_product_count INT;
  v_furniture_count INT;
  v_slot_count INT;
BEGIN
  SELECT COUNT(*) INTO v_product_count FROM products;
  SELECT COUNT(*) INTO v_furniture_count FROM furniture;
  SELECT COUNT(*) INTO v_slot_count FROM furniture_slots;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '                    v8.3 SEED COMPLETE                          ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '  Products:  %건', v_product_count;
  RAISE NOTICE '  Furniture: %건', v_furniture_count;
  RAISE NOTICE '  Slots:     %건', v_slot_count;
  RAISE NOTICE '';
  RAISE NOTICE '  Display Type 분포:';
  RAISE NOTICE '    - hanging:  12개 상품 → 40개 행거 슬롯';
  RAISE NOTICE '    - standing:  8개 상품 → 56개 랙/쇼케이스 슬롯';
  RAISE NOTICE '    - folded:    2개 상품 → 24개 선반 슬롯';
  RAISE NOTICE '    - boxed:     1개 상품 → 12개 테이블 슬롯';
  RAISE NOTICE '    - stacked:   1개 상품 → 12개 테이블 슬롯';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
