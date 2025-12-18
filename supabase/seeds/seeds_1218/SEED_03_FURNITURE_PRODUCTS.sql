-- ============================================================================
-- NEURALTWIN v8.6 SEED_03: 가구/상품 데이터
-- ============================================================================
-- 실행 순서: SEED_02 이후
-- 목적: furniture(68), furniture_slots(176), products(25), product_models(60),
--       inventory_levels(25), product_placements(25+) 시딩
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
  v_furn RECORD;
  v_product RECORD;
  v_slot RECORD;
  v_count INT;
  v_base_url TEXT := 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_03: 가구/상품 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  -- Zone IDs 가져오기
  SELECT id INTO v_zone_entrance FROM zones_dim WHERE zone_code = 'Z001' AND store_id = v_store_id;
  SELECT id INTO v_zone_main FROM zones_dim WHERE zone_code = 'Z002' AND store_id = v_store_id;
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;
  SELECT id INTO v_zone_fitting FROM zones_dim WHERE zone_code = 'Z005' AND store_id = v_store_id;
  SELECT id INTO v_zone_checkout FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id;
  SELECT id INTO v_zone_lounge FROM zones_dim WHERE zone_code = 'Z007' AND store_id = v_store_id;

  IF v_zone_entrance IS NULL THEN
    RAISE EXCEPTION 'zones_dim 데이터가 없습니다. SEED_02를 먼저 실행하세요.';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 4.1: furniture (68개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 4.1] furniture 시딩 (68개)...';

  -- Z001 입구 (4건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0010001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'GATE-001', '입구 게이트', '입구 게이트', 'gate_entrance_01', 'gate', 3.0, 2.5, 0.3, 0, 0, -9, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/gate_entrance_01.glb', false, true, NOW(), NOW()),
  ('b0010002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'SIGN-001', '환영 사인', '환영 사인', 'sign_welcome_01', 'sign', 1.5, 0.8, 0.1, -1.8, 1.5, -8.2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_welcome_01.glb', false, true, NOW(), NOW()),
  ('b0010003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'KIOSK-001', '안내 키오스크', '안내 키오스크', 'kiosk_info_01', 'kiosk', 0.6, 1.5, 0.6, 0, 0, -8, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/kiosk_info_01.glb', false, true, NOW(), NOW()),
  ('b0010004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'CART-001', '쇼핑카트 거치대', '쇼핑카트 거치대', 'cart_stand_01', 'stand', 1.0, 1.0, 0.5, 1.8, 0, -8.2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/cart_stand_01.glb', true, true, NOW(), NOW());
  RAISE NOTICE '    - Z001 입구: 4건';

  -- Z002 메인홀 (13건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0020001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-001', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_01', 'stand', 0.6, 1.8, 0.4, -2.7, 0, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_promo_01.glb', true, true, NOW(), NOW()),
  ('b0020002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-002', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_02', 'stand', 0.6, 1.8, 0.4, -1.3, 0, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_promo_02.glb', true, true, NOW(), NOW()),
  ('b0020003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-003', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_03', 'stand', 0.6, 1.8, 0.4, 0.7, 0, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_promo_03.glb', true, true, NOW(), NOW()),
  ('b0020004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-004', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_04', 'stand', 0.6, 1.8, 0.4, 2, 0, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_promo_04.glb', true, true, NOW(), NOW()),
  ('b0020005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'CTABLE-001', '중앙 디스플레이 테이블', '중앙 디스플레이 테이블', 'table_display_center_01', 'table', 2.0, 0.9, 1.2, 0, 0, 0.65, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_display_center_01.glb', true, true, NOW(), NOW()),
  ('b0020006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'CTABLE-002', '중앙 디스플레이 테이블', '중앙 디스플레이 테이블', 'table_display_center_02', 'table', 2.0, 0.9, 1.2, 0, 0, 0.05, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_display_center_02.glb', true, true, NOW(), NOW()),
  ('b0020007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'ROUND-001', '원형 디스플레이', '원형 디스플레이', 'display_round_01', 'display', 1.5, 1.2, 1.5, 0, 0, -1.3, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/display_round_01.glb', true, true, NOW(), NOW()),
  ('b0020008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-001', '전신 마네킹', '전신 마네킹', 'mannequin_full_01', 'mannequin', 0.5, 1.8, 0.3, -1.7, 0, 1, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_full_01.glb', true, true, NOW(), NOW()),
  ('b0020009-0000-0000-0000-000000000009'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-002', '전신 마네킹', '전신 마네킹', 'mannequin_full_02', 'mannequin', 0.5, 1.8, 0.3, -1.7, 0, -0.3, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_full_02.glb', true, true, NOW(), NOW()),
  ('b0020010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-003', '전신 마네킹', '전신 마네킹', 'mannequin_full_03', 'mannequin', 0.5, 1.8, 0.3, 1.7, 0, 1, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_full_03.glb', true, true, NOW(), NOW()),
  ('b0020011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-004', '전신 마네킹', '전신 마네킹', 'mannequin_full_04', 'mannequin', 0.5, 1.8, 0.3, 1.7, 0, -0.3, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_full_04.glb', true, true, NOW(), NOW()),
  ('b0020012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'BANNER-001', '천장 배너 행거', '천장 배너 행거', 'banner_hanger_01', 'banner', 2.0, 0.5, 0.1, -2.5, 2.8, 4.3, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/banner_hanger_01.glb', false, true, NOW(), NOW()),
  ('b0020013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'BANNER-002', '천장 배너 행거', '천장 배너 행거', 'banner_hanger_02', 'banner', 2.0, 0.5, 0.1, 2.5, 2.8, 4.3, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/banner_hanger_02.glb', false, true, NOW(), NOW());
  RAISE NOTICE '    - Z002 메인홀: 13건';

  -- Z003 의류존 (26건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-001', '의류 행거 (더블)', '의류 행거 (더블)', 'clothing_rack_double_01', 'rack', 1.5, 1.8, 0.6, -8.5, 0, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_double_01.glb', true, true, NOW(), NOW()),
  ('b0030002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-002', '의류 행거 (더블)', '의류 행거 (더블)', 'clothing_rack_double_02', 'rack', 1.5, 1.8, 0.6, -7.4, 0, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_double_02.glb', true, true, NOW(), NOW()),
  ('b0030003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-003', '의류 행거 (더블)', '의류 행거 (더블)', 'clothing_rack_double_03', 'rack', 1.5, 1.8, 0.6, -6.3, 0, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_double_03.glb', true, true, NOW(), NOW()),
  ('b0030004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-004', '의류 행거 (더블)', '의류 행거 (더블)', 'clothing_rack_double_04', 'rack', 1.5, 1.8, 0.6, -8.5, 0, -2.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_double_04.glb', true, true, NOW(), NOW()),
  ('b0030005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-001', '의류 행거 (싱글)', '의류 행거 (싱글)', 'clothing_rack_single_01', 'rack', 1.2, 1.8, 0.4, -8.5, 0, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_single_01.glb', true, true, NOW(), NOW()),
  ('b0030006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-002', '의류 행거 (싱글)', '의류 행거 (싱글)', 'clothing_rack_single_02', 'rack', 1.2, 1.8, 0.4, -7.5, 0, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_single_02.glb', true, true, NOW(), NOW()),
  ('b0030007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-003', '의류 행거 (싱글)', '의류 행거 (싱글)', 'clothing_rack_single_03', 'rack', 1.2, 1.8, 0.4, -6.5, 0, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_single_03.glb', true, true, NOW(), NOW()),
  ('b0030008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-004', '의류 행거 (싱글)', '의류 행거 (싱글)', 'clothing_rack_single_04', 'rack', 1.2, 1.8, 0.4, -8.5, 0, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/rack_clothing_single_04.glb', true, true, NOW(), NOW()),
  ('b0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SHELF-001', '선반형 진열대', '선반형 진열대', 'shelf_display_01', 'shelf', 1.2, 2.0, 0.4, -8.5, 0, -4.8, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/shelf_display_01.glb', true, true, NOW(), NOW()),
  ('b0030010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SHELF-002', '선반형 진열대', '선반형 진열대', 'shelf_display_02', 'shelf', 1.2, 2.0, 0.4, -7.5, 0, -4.8, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/shelf_display_02.glb', true, true, NOW(), NOW()),
  ('b0000021-0000-0000-0000-000000000021'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TABLE-001', '테이블 디스플레이', '테이블 디스플레이', 'table_display_01', 'table', 1.0, 0.9, 0.8, -8.5, 0, -5.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_display_01.glb', true, true, NOW(), NOW()),
  ('b0030012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TABLE-002', '테이블 디스플레이', '테이블 디스플레이', 'table_display_02', 'table', 1.0, 0.9, 0.8, -7.5, 0, -5.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_display_02.glb', true, true, NOW(), NOW()),
  ('b0030013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-001', '상반신 마네킹', '상반신 마네킹', 'mannequin_torso_01', 'mannequin', 0.4, 0.9, 0.3, -6.5, 0, -4.8, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_torso_01.glb', true, true, NOW(), NOW()),
  ('b0030014-0000-0000-0000-000000000014'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-002', '상반신 마네킹', '상반신 마네킹', 'mannequin_torso_02', 'mannequin', 0.4, 0.9, 0.3, -6.1, 0, -4.8, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_torso_02.glb', true, true, NOW(), NOW()),
  ('b0030015-0000-0000-0000-000000000015'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-003', '상반신 마네킹', '상반신 마네킹', 'mannequin_torso_03', 'mannequin', 0.4, 0.9, 0.3, -6.5, 0, -5.5, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_torso_03.glb', true, true, NOW(), NOW()),
  ('b0030016-0000-0000-0000-000000000016'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-004', '상반신 마네킹', '상반신 마네킹', 'mannequin_torso_04', 'mannequin', 0.4, 0.9, 0.3, -6.1, 0, -5.5, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mannequin_torso_04.glb', true, true, NOW(), NOW()),
  ('b0030017-0000-0000-0000-000000000017'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'MIRROR-001', '전신 거울', '전신 거울', 'mirror_full_01', 'mirror', 0.8, 1.8, 0.05, -9.4, 0, -4.3, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mirror_full_01.glb', false, true, NOW(), NOW()),
  ('b0030018-0000-0000-0000-000000000018'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'MIRROR-002', '전신 거울', '전신 거울', 'mirror_full_02', 'mirror', 0.8, 1.8, 0.05, -9.4, 0, -5.3, 0, 90, 0, 1, 1, 1, v_base_url || '/furniture/mirror_full_02.glb', false, true, NOW(), NOW()),
  ('b0030019-0000-0000-0000-000000000019'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-001', '사이즈 표시판 (S)', '사이즈 표시판 (S)', 'sign_size_01', 'sign', 0.3, 0.2, 0.05, -8.5, 1.9, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_01.glb', false, true, NOW(), NOW()),
  ('b0030020-0000-0000-0000-000000000020'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-002', '사이즈 표시판 (M)', '사이즈 표시판 (M)', 'sign_size_02', 'sign', 0.3, 0.2, 0.05, -7.4, 1.9, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_02.glb', false, true, NOW(), NOW()),
  ('b0030021-0000-0000-0000-000000000021'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-003', '사이즈 표시판 (L)', '사이즈 표시판 (L)', 'sign_size_03', 'sign', 0.3, 0.2, 0.05, -6.3, 1.9, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_03.glb', false, true, NOW(), NOW()),
  ('b0030022-0000-0000-0000-000000000022'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-004', '사이즈 표시판 (XL)', '사이즈 표시판 (XL)', 'sign_size_04', 'sign', 0.3, 0.2, 0.05, -8.5, 1.9, -2.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_04.glb', false, true, NOW(), NOW()),
  ('b0030023-0000-0000-0000-000000000023'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-005', '사이즈 표시판 (S)', '사이즈 표시판 (S)', 'sign_size_05', 'sign', 0.3, 0.2, 0.05, -8.5, 1.9, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_05.glb', false, true, NOW(), NOW()),
  ('b0030024-0000-0000-0000-000000000024'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-006', '사이즈 표시판 (M)', '사이즈 표시판 (M)', 'sign_size_06', 'sign', 0.3, 0.2, 0.05, -7.5, 1.9, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_06.glb', false, true, NOW(), NOW()),
  ('b0030025-0000-0000-0000-000000000025'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-007', '사이즈 표시판 (L)', '사이즈 표시판 (L)', 'sign_size_07', 'sign', 0.3, 0.2, 0.05, -6.5, 1.9, -3.5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_07.glb', false, true, NOW(), NOW()),
  ('b0030026-0000-0000-0000-000000000026'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SIZE-008', '사이즈 표시판 (XL)', '사이즈 표시판 (XL)', 'sign_size_08', 'sign', 0.3, 0.2, 0.05, -8.5, 1.9, -4, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/sign_size_08.glb', false, true, NOW(), NOW());
  RAISE NOTICE '    - Z003 의류존: 26건';

  -- Z004 액세서리존 (11건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0040001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'CASE-001', '쇼케이스 (잠금형)', '쇼케이스 (잠금형)', 'showcase_locked_01', 'showcase', 1.0, 1.2, 0.5, 5.8, 0, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/showcase_locked_01.glb', false, true, NOW(), NOW()),
  ('b0040002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'CASE-002', '쇼케이스 (잠금형)', '쇼케이스 (잠금형)', 'showcase_locked_02', 'showcase', 1.0, 1.2, 0.5, 6.8, 0, -2, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/showcase_locked_02.glb', false, true, NOW(), NOW()),
  ('b0040003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'OCASE-001', '오픈 쇼케이스', '오픈 쇼케이스', 'showcase_open_01', 'showcase', 1.2, 1.0, 0.4, 5.8, 0, -2.8, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/showcase_open_01.glb', true, true, NOW(), NOW()),
  ('b0040004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'OCASE-002', '오픈 쇼케이스', '오픈 쇼케이스', 'showcase_open_02', 'showcase', 1.2, 1.0, 0.4, 6.9, 0, -2.8, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/showcase_open_02.glb', true, true, NOW(), NOW()),
  ('b0040005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'BAG-001', '가방 진열대', '가방 진열대', 'display_bag_01', 'display', 1.5, 1.5, 0.5, 5.8, 0, -3.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/display_bag_01.glb', true, true, NOW(), NOW()),
  ('b0040006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'BAG-002', '가방 진열대', '가방 진열대', 'display_bag_02', 'display', 1.5, 1.5, 0.5, 7, 0, -3.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/display_bag_02.glb', true, true, NOW(), NOW()),
  ('b0040007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'ROTATE-001', '회전형 악세서리 스탠드', '회전형 악세서리 스탠드', 'stand_accessory_01', 'stand', 0.4, 1.4, 0.4, 8.2, 0, -3.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_accessory_01.glb', true, true, NOW(), NOW()),
  ('b0040008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'ROTATE-002', '회전형 악세서리 스탠드', '회전형 악세서리 스탠드', 'stand_accessory_02', 'stand', 0.4, 1.4, 0.4, 8.7, 0, -3.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/stand_accessory_02.glb', true, true, NOW(), NOW()),
  ('b0000031-0000-0000-0000-000000000031'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-001', '신발 진열대', '신발 진열대', 'shelf_shoes_01', 'rack', 1.2, 1.8, 0.4, 5.8, 0, -5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/shelf_shoes_01.glb', true, true, NOW(), NOW()),
  ('b0040010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-002', '신발 진열대', '신발 진열대', 'shelf_shoes_02', 'rack', 1.2, 1.8, 0.4, 6.9, 0, -5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/shelf_shoes_02.glb', true, true, NOW(), NOW()),
  ('b0040011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-003', '신발 진열대', '신발 진열대', 'shelf_shoes_03', 'rack', 1.2, 1.8, 0.4, 8, 0, -5, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/shelf_shoes_03.glb', true, true, NOW(), NOW());
  RAISE NOTICE '    - Z004 액세서리존: 11건';

  -- Z005 피팅룸 (4건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0050001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-001', '피팅룸 부스', '피팅룸 부스', 'fitting_booth_01', 'booth', 1.2, 2.2, 1.2, -8, 0, 7.3, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/fitting_booth_01.glb', false, true, NOW(), NOW()),
  ('b0050002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-002', '피팅룸 부스', '피팅룸 부스', 'fitting_booth_02', 'booth', 1.2, 2.2, 1.2, -8, 0, 6, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/fitting_booth_02.glb', false, true, NOW(), NOW()),
  ('b0050003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-003', '피팅룸 부스', '피팅룸 부스', 'fitting_booth_03', 'booth', 1.2, 2.2, 1.2, -8, 0, 4.7, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/fitting_booth_03.glb', false, true, NOW(), NOW()),
  ('b0050004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-004', '피팅룸 부스', '피팅룸 부스', 'fitting_booth_04', 'booth', 1.2, 2.2, 1.2, -8, 0, 3.3, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/fitting_booth_04.glb', false, true, NOW(), NOW());
  RAISE NOTICE '    - Z005 피팅룸: 4건';

  -- Z006 계산대 (4건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0060001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'COUNTER-001', '계산대 카운터', '계산대 카운터', 'counter_checkout_01', 'counter', 2.0, 1.1, 0.6, 6.3, 0, 6.7, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/counter_checkout_01.glb', false, true, NOW(), NOW()),
  ('b0060002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'COUNTER-002', '계산대 카운터', '계산대 카운터', 'counter_checkout_02', 'counter', 2.0, 1.1, 0.6, 6.3, 0, 5.7, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/counter_checkout_02.glb', false, true, NOW(), NOW()),
  ('b0060003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'POS-001', 'POS 단말기', 'POS 단말기', 'pos_terminal_01', 'equipment', 0.3, 0.4, 0.3, 8, 1.1, 6.6, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/pos_terminal_01.glb', false, true, NOW(), NOW()),
  ('b0060004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'POS-002', 'POS 단말기', 'POS 단말기', 'pos_terminal_02', 'equipment', 0.3, 0.4, 0.3, 8, 1.1, 5.6, 0, -90, 0, 1, 1, 1, v_base_url || '/furniture/pos_terminal_02.glb', false, true, NOW(), NOW());
  RAISE NOTICE '    - Z006 계산대: 4건';

  -- Z007 휴식공간 (6건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z, model_url, movable, is_active, created_at, updated_at) VALUES
  ('b0070001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'SOFA-001', '라운지 소파 (2인)', '라운지 소파 (2인)', 'sofa_2seat_01', 'sofa', 1.5, 0.85, 0.8, -4, 0, 8.8, 0, 180, 0, 1, 1, 1, v_base_url || '/furniture/sofa_2seat_01.glb', true, true, NOW(), NOW()),
  ('b0070002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'SOFA-002', '라운지 소파 (2인)', '라운지 소파 (2인)', 'sofa_2seat_02', 'sofa', 1.5, 0.85, 0.8, -2.2, 0, 8.8, 0, 180, 0, 1, 1, 1, v_base_url || '/furniture/sofa_2seat_02.glb', true, true, NOW(), NOW()),
  ('b0070003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'CHAIR-001', '라운지 의자', '라운지 의자', 'chair_lounge_01', 'chair', 0.6, 0.8, 0.6, 1, 0, 8.8, 0, 180, 0, 1, 1, 1, v_base_url || '/furniture/chair_lounge_01.glb', true, true, NOW(), NOW()),
  ('b0070004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'CHAIR-002', '라운지 의자', '라운지 의자', 'chair_lounge_02', 'chair', 0.6, 0.8, 0.6, 2, 0, 8.8, 0, 180, 0, 1, 1, 1, v_base_url || '/furniture/chair_lounge_02.glb', true, true, NOW(), NOW()),
  ('b0070005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'COFFEE-001', '커피 테이블', '커피 테이블', 'table_coffee_01', 'table', 0.8, 0.45, 0.5, -3.1, 0, 8.1, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_coffee_01.glb', true, true, NOW(), NOW()),
  ('b0070006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'COFFEE-002', '커피 테이블', '커피 테이블', 'table_coffee_02', 'table', 0.8, 0.45, 0.5, -0.3, 0, 8.1, 0, 0, 0, 1, 1, 1, v_base_url || '/furniture/table_coffee_02.glb', true, true, NOW(), NOW());
  RAISE NOTICE '    - Z007 휴식공간: 6건';
  RAISE NOTICE '    ✓ furniture: 68건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 4.2: furniture_slots (176개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 4.2] furniture_slots 시딩 (176개)...';

  -- clothing_rack_double (4×6=24)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'clothing_rack_double_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H1-1', v_furn.furniture_type, 'hanger', '{"x":-0.328,"y":1.38,"z":0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H1-2', v_furn.furniture_type, 'hanger', '{"x":0.328,"y":1.38,"z":0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H2-1', v_furn.furniture_type, 'hanger', '{"x":-0.328,"y":1.38,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H2-2', v_furn.furniture_type, 'hanger', '{"x":0.328,"y":1.38,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H3-1', v_furn.furniture_type, 'hanger', '{"x":-0.328,"y":1.38,"z":-0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H3-2', v_furn.furniture_type, 'hanger', '{"x":0.328,"y":1.38,"z":-0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW());
  END LOOP;


  -- clothing_rack_single (4×3=12)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'clothing_rack_single_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H1-1', v_furn.furniture_type, 'hanger', '{"x":0,"y":1.38,"z":0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H2-1', v_furn.furniture_type, 'hanger', '{"x":0,"y":1.38,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'H3-1', v_furn.furniture_type, 'hanger', '{"x":0,"y":1.38,"z":-0.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging'], 0.5, 1.2, 0.1, false, NOW(), NOW());
  END LOOP;


  -- table_display (2×6=12)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'table_display_%' AND furniture_type NOT LIKE 'table_display_center_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-1', v_furn.furniture_type, 'table', '{"x":-0.5,"y":0.76,"z":0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-2', v_furn.furniture_type, 'table', '{"x":0,"y":0.76,"z":0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-3', v_furn.furniture_type, 'table', '{"x":0.5,"y":0.76,"z":0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-1', v_furn.furniture_type, 'table', '{"x":-0.5,"y":0.76,"z":-0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-2', v_furn.furniture_type, 'table', '{"x":0,"y":0.76,"z":-0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-3', v_furn.furniture_type, 'table', '{"x":0.5,"y":0.76,"z":-0.3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.4, 0.3, 0.3, false, NOW(), NOW());
  END LOOP;


  -- shelf_display (2×4=8)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'shelf_display_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-1', v_furn.furniture_type, 'shelf', '{"x":-0.3,"y":0.96,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.5, 0.4, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-2', v_furn.furniture_type, 'shelf', '{"x":0.3,"y":0.96,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.5, 0.4, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-1', v_furn.furniture_type, 'shelf', '{"x":-0.3,"y":1.46,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.5, 0.4, 0.3, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-2', v_furn.furniture_type, 'shelf', '{"x":0.3,"y":1.46,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','boxed','stacked'], 0.5, 0.4, 0.3, false, NOW(), NOW());
  END LOOP;


  -- mannequin_torso (4×1=4)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'mannequin_torso_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES

  (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'M1', v_furn.furniture_type, 'mannequin', 
   '{"x":0,"y":1.5,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, 
   ARRAY['standing'], 0.5, 0.7, 0.3, false, NOW(), NOW());
     END LOOP;


  -- table_display_center (2×10=20)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'table_display_center_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-1', v_furn.furniture_type, 'table', '{"x":-1,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-2', v_furn.furniture_type, 'table', '{"x":-0.5,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-3', v_furn.furniture_type, 'table', '{"x":0,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-4', v_furn.furniture_type, 'table', '{"x":0.5,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1-5', v_furn.furniture_type, 'table', '{"x":1,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-1', v_furn.furniture_type, 'table', '{"x":-1,"y":0.91,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-2', v_furn.furniture_type, 'table', '{"x":-0.5,"y":0.91,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-3', v_furn.furniture_type, 'table', '{"x":0,"y":0.91,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-4', v_furn.furniture_type, 'table', '{"x":0.5,"y":0.91,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2-5', v_furn.furniture_type, 'table', '{"x":1,"y":0.91,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['folded','located','boxed','stacked'], 0.4, 0.3, 0.4, false, NOW(), NOW());
  END LOOP;


  -- display_round (1×4=4)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'display_round_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T1', v_furn.furniture_type, 'display', '{"x":0,"y":0.8,"z":0.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing','located'], 0.4, 0.5, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T2', v_furn.furniture_type, 'display', '{"x":-0.7,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, ARRAY['standing','located'], 0.4, 0.5, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T3', v_furn.furniture_type, 'display', '{"x":0.7,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, ARRAY['standing','located'], 0.4, 0.5, 0.4, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'T4', v_furn.furniture_type, 'display', '{"x":0,"y":0.8,"z":-0.7}'::jsonb, '{"x":0,"y":180,"z":0}'::jsonb, ARRAY['standing','located'], 0.4, 0.5, 0.4, false, NOW(), NOW());
  END LOOP;


  -- mannequin_full (4×3=12)
FOR v_furn IN SELECT id, furniture_type FROM furniture 
  WHERE store_id = v_store_id AND furniture_type LIKE 'mannequin_full_%' 
LOOP
  INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
  -- M1: 신발 슬롯 (발 높이)
  (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'M1', v_furn.furniture_type, 'mannequin', 
   '{"x":0,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, 
   ARRAY['standing'], 0.3, 0.15, 0.35, false, NOW(), NOW()),
  
  -- M2: 하의 슬롯 (허리~다리 높이)
  (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'M2', v_furn.furniture_type, 'mannequin', 
   '{"x":0,"y":1,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, 
   ARRAY['standing'], 0.4, 0.9, 0.3, false, NOW(), NOW()),
  
  -- M3: 상의/아우터 슬롯 (가슴 높이)
  (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'M3', v_furn.furniture_type, 'mannequin', 
   '{"x":0,"y":1.5,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, 
   ARRAY['standing'], 0.5, 0.7, 0.3, false, NOW(), NOW());
END LOOP;

  -- stand_accessory (2×10=20)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'stand_accessory_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-1', v_furn.furniture_type, 'stand', '{"x":0,"y":0.21,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-2', v_furn.furniture_type, 'stand', '{"x":0,"y":0.21,"z":-0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-1', v_furn.furniture_type, 'stand', '{"x":0,"y":0.465,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-2', v_furn.furniture_type, 'stand', '{"x":0,"y":0.465,"z":-0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S3-1', v_furn.furniture_type, 'stand', '{"x":0,"y":0.72,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S3-2', v_furn.furniture_type, 'stand', '{"x":0,"y":0.72,"z":-0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S4-1', v_furn.furniture_type, 'stand', '{"x":0,"y":0.975,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S4-2', v_furn.furniture_type, 'stand', '{"x":0,"y":0.975,"z":-0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S5-1', v_furn.furniture_type, 'stand', '{"x":0,"y":1.23,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S5-2', v_furn.furniture_type, 'stand', '{"x":0,"y":1.23,"z":-0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.15, 0.2, 0.15, false, NOW(), NOW());
  END LOOP;

  -- display_bag (2×8=16)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'display_bag_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D1-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":0.04,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D1-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":0.04,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D2-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":0.42,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D2-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":0.42,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D3-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D3-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D4-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":1.18,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'D4-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":1.18,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['hanging','standing','located'], 0.35, 0.35, 0.25, false, NOW(), NOW());
  END LOOP;


  -- showcase_open (2×4=8)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'showcase_open_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-1', v_furn.furniture_type, 'showcase', '{"x":-0.3,"y":0.4,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.2, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1-2', v_furn.furniture_type, 'showcase', '{"x":0.3,"y":0.4,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.2, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-1', v_furn.furniture_type, 'showcase', '{"x":-0.3,"y":0.7,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.2, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2-2', v_furn.furniture_type, 'showcase', '{"x":0.3,"y":0.7,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.2, false, NOW(), NOW());
  END LOOP;


  -- showcase_locked (2×3=6)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'showcase_locked_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S1', v_furn.furniture_type, 'showcase', '{"x":0,"y":0.45,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.2, 0.2, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S2', v_furn.furniture_type, 'showcase', '{"x":0,"y":0.711,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.2, 0.2, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'S3', v_furn.furniture_type, 'showcase', '{"x":0,"y":0.967,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.2, 0.2, false, NOW(), NOW());
  END LOOP;


  -- shelf_shoes (3×10=30)
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'shelf_shoes_%' LOOP
    INSERT INTO furniture_slots (id, furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, is_occupied, created_at, updated_at) VALUES
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R1-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":0.2,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R1-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":0.2,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R2-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":0.5,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R2-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":0.5,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R3-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R3-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R4-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":1.1,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R4-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":1.1,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R5-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":1.4,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW()),
    (gen_random_uuid(), v_furn.id, v_store_id, v_user_id, 'R5-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":1.4,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['located','standing'], 0.25, 0.25, 0.35, false, NOW(), NOW());
  END LOOP;
  RAISE NOTICE '    - display_round: 6 슬롯';

  SELECT COUNT(*) INTO v_count FROM furniture_slots WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ furniture_slots: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 5.1: products (25개)
  -- ══════════════════════════════════════════════════════════════════════════

  RAISE NOTICE '    ✓ products: 25건 삽입';
  INSERT INTO products (id, store_id, user_id, org_id, product_name, sku, category, price, cost_price, stock, display_type, compatible_display_types, model_url, created_at, updated_at) VALUES
  
  -- ========== 아우터 (5개) ==========
  ('f0000001-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '프리미엄 캐시미어 코트', 'SKU-OUT-001', '아우터', 450000, 180000, 15, 
   'hanging', ARRAY['hanging','standing'], 
   v_base_url || '/products/outwear/product_cashmerecoat_01_hanging.glb', NOW(), NOW()),
   
  ('f0000002-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '울 테일러드 재킷', 'SKU-OUT-002', '아우터', 380000, 152000, 20, 
   'hanging', ARRAY['hanging','standing'], 
   v_base_url || '/products/outwear/product_tailoredjacket_01_hanging.glb', NOW(), NOW()),
   
  ('f0000003-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '다운 패딩', 'SKU-OUT-003', '아우터', 380000, 152000, 20, 
   'hanging', ARRAY['hanging','standing'], 
   v_base_url || '/products/outwear/product_padding_01_hanging.glb', NOW(), NOW()),
   
  ('f0000004-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '트렌치 코트', 'SKU-OUT-004', '아우터', 380000, 152000, 20, 
   'hanging', ARRAY['hanging','standing'], 
   v_base_url || '/products/outwear/product_trenchcoat_01_hanging.glb', NOW(), NOW()),
   
  ('f0000005-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '레더 재킷', 'SKU-OUT-005', '아우터', 380000, 152000, 20, 
   'hanging', ARRAY['hanging','standing'], 
   v_base_url || '/products/outwear/product_leatherjacket_01_hanging.glb', NOW(), NOW()),

  -- ========== 상의 (5개) ==========
  ('f0000006-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '실크 블라우스', 'SKU-TOP-001', '상의', 120000, 48000, 25, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/tops/product_blouse_01_hanging.glb', NOW(), NOW()),
   
  ('f0000007-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '캐주얼 니트 스웨터', 'SKU-TOP-002', '상의', 98000, 39200, 30, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/tops/product_sweater_01_hanging.glb', NOW(), NOW()),
   
  ('f0000008-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '옥스포드 셔츠', 'SKU-TOP-003', '상의', 85000, 34000, 35, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/tops/product_oxfordshirts_01_hanging.glb', NOW(), NOW()),
   
  ('f0000009-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '린넨 탑', 'SKU-TOP-004', '상의', 75000, 30000, 28, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/tops/product_linentop_01_hanging.glb', NOW(), NOW()),
   
  ('f0000010-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '폴로 셔츠', 'SKU-TOP-005', '상의', 75000, 30000, 28, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/tops/product_poloshirts_01_hanging.glb', NOW(), NOW()),

  -- ========== 하의 (4개) ==========
  ('f0000011-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '리넨 와이드 팬츠', 'SKU-BTM-001', '하의', 128000, 51200, 40, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/bottoms/product_widepants_01_hanging.glb', NOW(), NOW()),
   
  ('f0000012-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '슬림핏 데님', 'SKU-BTM-002', '하의', 95000, 38000, 35, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/bottoms/product_jeans_01_hanging.glb', NOW(), NOW()),
   
  ('f0000013-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '치노 팬츠', 'SKU-BTM-003', '하의', 95000, 38000, 35, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/bottoms/product_chinopants_01_hanging.glb', NOW(), NOW()),
   
  ('f0000014-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '조거 팬츠', 'SKU-BTM-004', '하의', 95000, 38000, 35, 
   'hanging', ARRAY['hanging','standing','folded','stacked'], 
   v_base_url || '/products/bottoms/product_joggerpants_01_hanging.glb', NOW(), NOW()),

  -- ========== 신발 (3개) ==========
  ('f0000015-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '프리미엄 로퍼', 'SKU-SHO-001', '신발', 280000, 112000, 18, 
   'located', ARRAY['located','standing'], 
   v_base_url || '/products/shoes/product_shoes_loafer_01_located.glb', NOW(), NOW()),
   
  ('f0000016-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '하이힐 펌프스', 'SKU-SHO-002', '신발', 320000, 128000, 12, 
   'located', ARRAY['located','standing'], 
   v_base_url || '/products/shoes/product_shoes_heels_01_located.glb', NOW(), NOW()),
   
  ('f0000017-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '프리미엄 스니커즈', 'SKU-SHO-003', '신발', 198000, 79200, 25, 
   'located', ARRAY['located','standing'], 
   v_base_url || '/products/shoes/product_shoes_sneakers_01_located.glb', NOW(), NOW()),

  -- ========== 가방 (1개) ==========
  ('f0000018-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '가죽 토트백', 'SKU-BAG-001', '가방', 350000, 140000, 10, 
   'located', ARRAY['located'], 
   v_base_url || '/products/accessories/product_bag_tote_01.glb', NOW(), NOW()),

  -- ========== 액세서리 - 머플러/스카프 (2개) ==========
  ('f0000019-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '울 머플러', 'SKU-MUF-001', '머플러', 180000, 72000, 15, 
   'located', ARRAY['located'], 
   v_base_url || '/products/accessories/product_muffler_set_01.glb', NOW(), NOW()),
   
  ('f0000020-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '실크 스카프', 'SKU-SCA-001', '스카프', 85000, 34000, 20, 
   'located', ARRAY['folded'], 
   v_base_url || '/products/accessories/product_scarf_set_01.glb', NOW(), NOW()),

  -- ========== 액세서리 - 벨트/쥬얼리 (2개) ==========
  ('f0000021-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '가죽 벨트', 'SKU-BLT-001', '벨트', 120000, 48000, 30, 
   'located', ARRAY['located'], 
   v_base_url || '/products/accessories/product_belt_leather_01.glb', NOW(), NOW()),
   
  ('f0000022-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '실버 목걸이', 'SKU-JWL-001', '쥬얼리', 180000, 72000, 12, 
   'located', ARRAY['located'], 
   v_base_url || '/products/accessories/product_necklace_silver_01.glb', NOW(), NOW()),

  -- ========== 화장품 (2개) ==========
  ('f0000023-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '프리미엄 스킨케어 세트', 'SKU-SKI-001', '화장품', 65000, 26000, 40, 
   'boxed', ARRAY['located'], 
   v_base_url || '/products/cosmetics/product_skincare_set_01.glb', NOW(), NOW()),
   
  ('f0000024-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '립스틱 컬렉션', 'SKU-LIP-001', '화장품', 25000, 10000, 60, 
   'stacked', ARRAY['located'], 
   v_base_url || '/products/cosmetics/product_lipstick_set_01.glb', NOW(), NOW()),

  -- ========== 선물세트 (1개) ==========
  ('f0000025-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, 
   '프리미엄 선물 세트', 'SKU-GFT-001', '선물세트', 150000, 60000, 20, 
   'boxed', ARRAY['boxed'], 
   v_base_url || '/products/giftbox/product_giftbox_01.glb', NOW(), NOW());
   
   RAISE NOTICE '✅ Successfully inserted 25 products with correct model URLs';
  RAISE NOTICE '   Store ID: %', v_store_id;
  
END $$;
  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 5.2: product_models (60개 - 상품당 평균 2~3개 display_type)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 5.2] product_models 시딩 (60개)...';

  -- 각 상품별로 다양한 display_type 모델 등록
  FOR v_product IN SELECT id, sku, display_type, compatible_display_types FROM products WHERE store_id = v_store_id LOOP
    -- 기본 display_type 모델 (is_default = true)
    INSERT INTO product_models (id, product_id, display_type, model_3d_url, is_default, created_at, updated_at)
    VALUES (gen_random_uuid(), v_product.id, v_product.display_type,
            v_base_url || '/product/' || v_product.sku || '_' || v_product.display_type || '.glb',
            true, NOW(), NOW())
    ON CONFLICT (product_id, display_type) DO NOTHING;

    -- 호환 display_type 모델들 (is_default = false)
    IF v_product.compatible_display_types IS NOT NULL THEN
      FOREACH v_customer_type IN ARRAY v_product.compatible_display_types LOOP
        IF v_customer_type != v_product.display_type THEN
          INSERT INTO product_models (id, product_id, display_type, model_3d_url, is_default, created_at, updated_at)
          VALUES (gen_random_uuid(), v_product.id, v_customer_type,
                  v_base_url || '/product/' || v_product.sku || '_' || v_customer_type || '.glb',
                  false, NOW(), NOW())
          ON CONFLICT (product_id, display_type) DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM product_models WHERE product_id IN (SELECT id FROM products WHERE store_id = v_store_id);
  RAISE NOTICE '    ✓ product_models: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 5.3: inventory_levels (25개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 5.3] inventory_levels 시딩 (25개)...';

  INSERT INTO inventory_levels (id, store_id, org_id, user_id, product_id, current_stock, min_stock, max_stock, reorder_point, reorder_quantity, last_restock_date, next_restock_date, status, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    v_store_id,
    v_org_id,
    v_user_id,
    p.id,
    p.stock,
    FLOOR(p.stock * 0.2)::INT,
    FLOOR(p.stock * 2.5)::INT,
    FLOOR(p.stock * 0.3)::INT,
    FLOOR(p.stock * 0.5)::INT,
    CURRENT_DATE - (FLOOR(RANDOM() * 30))::INT,
    CURRENT_DATE + (FLOOR(RANDOM() * 14) + 7)::INT,
    CASE
      WHEN p.stock <= FLOOR(p.stock * 0.2) THEN 'critical'
      WHEN p.stock <= FLOOR(p.stock * 0.3) THEN 'low'
      ELSE 'normal'
    END,
    NOW(),
    NOW()
  FROM products p
  WHERE p.store_id = v_store_id;

  RAISE NOTICE '    ✓ inventory_levels: 25건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 6: 풀 자동화 상품-슬롯 배치
  -- 호환성 타입 매칭 + 3D 월드 좌표 계산 + 우선순위 기반 배치
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '  [STEP 6] 풀 자동화 상품-슬롯 배치 시작...';
  RAISE NOTICE '           → 호환성 타입 매칭 (&&) + 3D 월드 좌표 계산';

  DECLARE
    v_placement RECORD;
    v_world_position JSONB;
    v_placement_count INT := 0;
    v_category_zone_priority JSONB;
  BEGIN
    -- 카테고리별 권장 존 우선순위 매핑
    v_category_zone_priority := '{
      "아우터": ["Z003"],
      "상의": ["Z003"],
      "하의": ["Z003"],
      "신발": ["Z004"],
      "가방": ["Z004"],
      "머플러": ["Z004", "Z003"],
      "스카프": ["Z004", "Z003"],
      "벨트": ["Z004"],
      "쥬얼리": ["Z004"],
      "화장품": ["Z003", "Z004"],
      "선물세트": ["Z003", "Z006"]
    }'::JSONB;

    -- ────────────────────────────────────────────────────────────────────────
    -- CTE 기반 호환성 자동 매칭 루프
    -- ────────────────────────────────────────────────────────────────────────
    FOR v_placement IN
      WITH available_slots AS (
        -- 비어있고 호환 타입이 정의된 슬롯들
        SELECT
          fs.id AS slot_uuid,
          fs.furniture_id,
          fs.slot_id AS slot_code,
          fs.slot_position,
          fs.slot_rotation,
          fs.compatible_display_types AS slot_types,
          fs.max_product_width,
          fs.max_product_height,
          fs.max_product_depth,
          -- 가구 정보
          f.zone_id,
          f.furniture_code,
          f.furniture_type,
          f.position_x AS furn_x,
          f.position_y AS furn_y,
          f.position_z AS furn_z,
          f.rotation_x AS furn_rot_x,
          f.rotation_y AS furn_rot_y,
          f.rotation_z AS furn_rot_z,
          -- 존 정보
          z.zone_code
        FROM furniture_slots fs
        JOIN furniture f ON f.id = fs.furniture_id
        LEFT JOIN zones_dim z ON z.id = f.zone_id
        WHERE fs.store_id = v_store_id
          AND fs.is_occupied = false
          AND fs.compatible_display_types IS NOT NULL
          AND array_length(fs.compatible_display_types, 1) > 0
      ),
      unplaced_products AS (
        -- 아직 배치되지 않은 상품들
        SELECT
          p.id AS product_id,
          p.product_name,
          p.sku,
          p.category,
          p.display_type AS preferred_display,
          p.compatible_display_types AS product_types,
          p.model_3d_url,
          p.model_3d_scale,
          p.model_3d_rotation
        FROM products p
        WHERE p.store_id = v_store_id
          AND p.compatible_display_types IS NOT NULL
          AND array_length(p.compatible_display_types, 1) > 0
          -- 아직 배치 안 된 상품 (product_placements 또는 products.initial_furniture_id 체크)
          AND p.initial_furniture_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM product_placements pp
            WHERE pp.product_id = p.id AND pp.is_active = true
          )
      )
      -- 호환성 기반 자동 매칭: 배열 교집합(&&) 연산
      SELECT DISTINCT ON (up.product_id)
        up.product_id,
        up.product_name,
        up.sku,
        up.category,
        up.preferred_display,
        up.product_types,
        up.model_3d_url,
        up.model_3d_scale,
        up.model_3d_rotation,
        asl.slot_uuid,
        asl.slot_code,
        asl.slot_position,
        asl.slot_rotation,
        asl.slot_types,
        asl.furniture_id,
        asl.furniture_code,
        asl.furniture_type,
        asl.furn_x,
        asl.furn_y,
        asl.furn_z,
        asl.furn_rot_x,
        asl.furn_rot_y,
        asl.furn_rot_z,
        asl.zone_id,
        asl.zone_code,
        -- 교집합에서 첫 번째 호환 타입 선택
        (
          SELECT x FROM unnest(up.product_types) x
          WHERE x = ANY(asl.slot_types)
          LIMIT 1
        ) AS matched_display_type
      FROM unplaced_products up
      CROSS JOIN available_slots asl
      WHERE up.product_types && asl.slot_types  -- && = 배열 겹침 연산자 (핵심!)
      ORDER BY
        up.product_id,
        -- 1순위: 상품의 선호 display_type이 슬롯에서 지원되면 우선
        CASE WHEN up.preferred_display = ANY(asl.slot_types) THEN 0 ELSE 1 END,
        -- 2순위: 카테고리별 권장 존 매칭 (의류→Z003, 신발→Z004 등)
        CASE
          WHEN asl.zone_code = ANY(
            ARRAY(SELECT jsonb_array_elements_text(v_category_zone_priority->up.category))
          ) THEN 0
          ELSE 1
        END,
        -- 3순위: 슬롯 ID 순서 (안정적인 배치)
        asl.slot_code
    LOOP
      -- ──────────────────────────────────────────────────────────────────────
      -- 월드 좌표 계산: 가구 position + 슬롯 slot_position
      -- ──────────────────────────────────────────────────────────────────────
      v_world_position := jsonb_build_object(
        'x', ROUND((v_placement.furn_x + COALESCE((v_placement.slot_position->>'x')::NUMERIC, 0))::NUMERIC, 3),
        'y', ROUND((v_placement.furn_y + COALESCE((v_placement.slot_position->>'y')::NUMERIC, 0))::NUMERIC, 3),
        'z', ROUND((v_placement.furn_z + COALESCE((v_placement.slot_position->>'z')::NUMERIC, 0))::NUMERIC, 3)
      );

      -- ──────────────────────────────────────────────────────────────────────
      -- 1) product_placements 테이블에 배치 레코드 생성
      -- ──────────────────────────────────────────────────────────────────────
      INSERT INTO product_placements (
        id,
        product_id,
        store_id,
        user_id,
        org_id,
        current_zone_id,
        current_furniture_id,
        current_slot_id,
        current_position,
        display_type,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_placement.product_id,
        v_store_id,
        v_user_id,
        v_org_id,
        v_placement.zone_id,
        v_placement.furniture_id,
        v_placement.slot_code,
        v_world_position,
        COALESCE(v_placement.matched_display_type, v_placement.preferred_display),
        true,
        NOW(),
        NOW()
      );

      -- ──────────────────────────────────────────────────────────────────────
      -- 2) products 테이블 직접 업데이트 (3D Studio 호환)
      -- ──────────────────────────────────────────────────────────────────────
      UPDATE products SET
        initial_furniture_id = v_placement.furniture_id,
        slot_id = v_placement.slot_code,
        model_3d_position = v_world_position,
        updated_at = NOW()
      WHERE id = v_placement.product_id;

      -- ──────────────────────────────────────────────────────────────────────
      -- 3) furniture_slots 점유 상태 업데이트
      -- ──────────────────────────────────────────────────────────────────────
      UPDATE furniture_slots SET
        is_occupied = true,
        occupied_by_product_id = v_placement.product_id,
        updated_at = NOW()
      WHERE id = v_placement.slot_uuid;

      v_placement_count := v_placement_count + 1;

      -- 상세 로그 출력
      RAISE NOTICE '    ✓ [%] % → %/% (type: %, pos: %)',
        v_placement.sku,
        v_placement.product_name,
        v_placement.furniture_code,
        v_placement.slot_code,
        COALESCE(v_placement.matched_display_type, v_placement.preferred_display),
        v_world_position;

    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '    ════════════════════════════════════════════════════════════';
    RAISE NOTICE '    자동 배치 완료: %/25 건', v_placement_count;
    RAISE NOTICE '    ════════════════════════════════════════════════════════════';

    -- 미배치 상품 경고
    IF v_placement_count < 25 THEN
      RAISE NOTICE '';
      RAISE NOTICE '    ⚠️  미배치 상품 목록:';
      FOR v_placement IN
        SELECT p.sku, p.product_name, p.category, p.compatible_display_types
        FROM products p
        WHERE p.store_id = v_store_id
          AND p.initial_furniture_id IS NULL
      LOOP
        RAISE NOTICE '       - [%] % (카테고리: %, 호환타입: %)',
          v_placement.sku,
          v_placement.product_name,
          v_placement.category,
          v_placement.compatible_display_types;
      END LOOP;
    END IF;
  END;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_03 완료: 가구/상품/자동배치 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  SELECT COUNT(*) INTO v_count FROM furniture WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ furniture: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM furniture_slots WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ furniture_slots: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ products: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM product_models WHERE product_id IN (SELECT id FROM products WHERE store_id = v_store_id);
  RAISE NOTICE '  ✓ product_models: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM inventory_levels WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ inventory_levels: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM product_placements WHERE store_id = v_store_id AND is_active = true;
  RAISE NOTICE '  ✓ product_placements: % 건 (자동배치)', v_count;
  SELECT COUNT(*) INTO v_count FROM furniture_slots WHERE store_id = v_store_id AND is_occupied = true;
  RAISE NOTICE '  ✓ occupied_slots: % 건', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'furniture' as table_name, COUNT(*) as row_count FROM furniture
UNION ALL SELECT 'furniture_slots', COUNT(*) FROM furniture_slots
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_models', COUNT(*) FROM product_models
UNION ALL SELECT 'inventory_levels', COUNT(*) FROM inventory_levels
UNION ALL SELECT 'product_placements', COUNT(*) FROM product_placements
ORDER BY table_name;
