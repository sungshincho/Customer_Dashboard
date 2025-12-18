-- ============================================================================
-- NEURALTWIN v8.6 SEED_03: 가구/상품 데이터
-- ============================================================================
-- 실행 순서: SEED_02_MASTER.sql 이후 실행
-- 예상 레코드: ~400건
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_zone_entrance UUID := 'a0000001-0000-0000-0000-000000000001';
  v_zone_main UUID := 'a0000002-0000-0000-0000-000000000002';
  v_zone_clothing UUID := 'a0000003-0000-0000-0000-000000000003';
  v_zone_accessory UUID := 'a0000004-0000-0000-0000-000000000004';
  v_zone_fitting UUID := 'a0000005-0000-0000-0000-000000000005';
  v_zone_checkout UUID := 'a0000006-0000-0000-0000-000000000006';
  v_zone_lounge UUID := 'a0000007-0000-0000-0000-000000000007';
  v_count INT;
  v_furn RECORD;
  v_base_url TEXT := 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models';
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_03: 가구/상품 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

  -- STEP 4.1: furniture (68건)
  INSERT INTO furniture (id, store_id, user_id, org_id, zone_id, furniture_code, furniture_name, name, furniture_type, category, width, height, depth, position_x, position_y, position_z, rotation_y, model_url, movable, is_active, created_at, updated_at) VALUES
  -- Z001 입구 (4건)
  ('b0010001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'GATE-001', '입구 게이트', '입구 게이트', 'gate_entrance_01', 'gate', 3.0, 2.5, 0.3, 0, 0, -9, 0, v_base_url||'/furniture/gate_entrance_01.glb', false, true, NOW(), NOW()),
  ('b0010002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'SIGN-001', '환영 사인', '환영 사인', 'sign_welcome_01', 'sign', 1.5, 0.8, 0.1, -1.8, 1.5, -8.2, 0, v_base_url||'/furniture/sign_welcome_01.glb', false, true, NOW(), NOW()),
  ('b0010003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'KIOSK-001', '안내 키오스크', '안내 키오스크', 'kiosk_info_01', 'kiosk', 0.6, 1.5, 0.6, 0, 0, -8, 0, v_base_url||'/furniture/kiosk_info_01.glb', false, true, NOW(), NOW()),
  ('b0010004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_entrance, 'CART-001', '쇼핑카트 거치대', '쇼핑카트 거치대', 'cart_stand_01', 'stand', 1.0, 1.0, 0.5, 1.8, 0, -8.2, 0, v_base_url||'/furniture/cart_stand_01.glb', true, true, NOW(), NOW()),
  -- Z002 메인홀 (13건)
  ('b0020001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-001', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_01', 'stand', 0.6, 1.8, 0.4, -2.7, 0, -4, 0, v_base_url||'/furniture/stand_promo_01.glb', true, true, NOW(), NOW()),
  ('b0020002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-002', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_02', 'stand', 0.6, 1.8, 0.4, -1.3, 0, -4, 0, v_base_url||'/furniture/stand_promo_02.glb', true, true, NOW(), NOW()),
  ('b0020003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-003', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_03', 'stand', 0.6, 1.8, 0.4, 0.7, 0, -4, 0, v_base_url||'/furniture/stand_promo_03.glb', true, true, NOW(), NOW()),
  ('b0020004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'PROMO-004', '프로모션 스탠드', '프로모션 스탠드', 'stand_promo_04', 'stand', 0.6, 1.8, 0.4, 2, 0, -4, 0, v_base_url||'/furniture/stand_promo_04.glb', true, true, NOW(), NOW()),
  ('b0020005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'CTABLE-001', '중앙 디스플레이 테이블', '중앙 테이블', 'table_display_center_01', 'table', 2.0, 0.9, 1.2, 0, 0, 0.65, 0, v_base_url||'/furniture/table_display_center_01.glb', true, true, NOW(), NOW()),
  ('b0020006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'CTABLE-002', '중앙 디스플레이 테이블', '중앙 테이블', 'table_display_center_02', 'table', 2.0, 0.9, 1.2, 0, 0, 0.05, 0, v_base_url||'/furniture/table_display_center_02.glb', true, true, NOW(), NOW()),
  ('b0020007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'ROUND-001', '원형 디스플레이', '원형 디스플레이', 'display_round_01', 'display', 1.5, 1.2, 1.5, 0, 0, -1.3, 0, v_base_url||'/furniture/display_round_01.glb', true, true, NOW(), NOW()),
  ('b0020008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-001', '전신 마네킹', '전신 마네킹', 'mannequin_full_01', 'mannequin', 0.5, 1.8, 0.3, -1.7, 0, 1, 90, v_base_url||'/furniture/mannequin_full_01.glb', true, true, NOW(), NOW()),
  ('b0020009-0000-0000-0000-000000000009'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-002', '전신 마네킹', '전신 마네킹', 'mannequin_full_02', 'mannequin', 0.5, 1.8, 0.3, -1.7, 0, -0.3, 90, v_base_url||'/furniture/mannequin_full_02.glb', true, true, NOW(), NOW()),
  ('b0020010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-003', '전신 마네킹', '전신 마네킹', 'mannequin_full_03', 'mannequin', 0.5, 1.8, 0.3, 1.7, 0, 1, -90, v_base_url||'/furniture/mannequin_full_03.glb', true, true, NOW(), NOW()),
  ('b0020011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'MANNE-004', '전신 마네킹', '전신 마네킹', 'mannequin_full_04', 'mannequin', 0.5, 1.8, 0.3, 1.7, 0, -0.3, -90, v_base_url||'/furniture/mannequin_full_04.glb', true, true, NOW(), NOW()),
  ('b0020012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'BANNER-001', '천장 배너', '천장 배너', 'banner_hanger_01', 'banner', 2.0, 0.5, 0.1, -2.5, 2.8, 4.3, 0, v_base_url||'/furniture/banner_hanger_01.glb', false, true, NOW(), NOW()),
  ('b0020013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id, v_zone_main, 'BANNER-002', '천장 배너', '천장 배너', 'banner_hanger_02', 'banner', 2.0, 0.5, 0.1, 2.5, 2.8, 4.3, 0, v_base_url||'/furniture/banner_hanger_02.glb', false, true, NOW(), NOW()),
  -- Z003 의류존 주요 (14건)
  ('b0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-001', '의류 행거 (더블)', '더블 행거', 'clothing_rack_double_01', 'rack', 1.5, 1.8, 0.6, -8.5, 0, -2, 0, v_base_url||'/furniture/clothing_rack_double_01.glb', true, true, NOW(), NOW()),
  ('b0030002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-002', '의류 행거 (더블)', '더블 행거', 'clothing_rack_double_02', 'rack', 1.5, 1.8, 0.6, -7.4, 0, -2, 0, v_base_url||'/furniture/clothing_rack_double_02.glb', true, true, NOW(), NOW()),
  ('b0030003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-003', '의류 행거 (더블)', '더블 행거', 'clothing_rack_double_03', 'rack', 1.5, 1.8, 0.6, -6.3, 0, -2, 0, v_base_url||'/furniture/clothing_rack_double_03.glb', true, true, NOW(), NOW()),
  ('b0030004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'RACK-004', '의류 행거 (더블)', '더블 행거', 'clothing_rack_double_04', 'rack', 1.5, 1.8, 0.6, -8.5, 0, -2.7, 0, v_base_url||'/furniture/clothing_rack_double_04.glb', true, true, NOW(), NOW()),
  ('b0030005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-001', '싱글 행거', '싱글 행거', 'clothing_rack_single_01', 'rack', 1.2, 1.8, 0.4, -8.5, 0, -3.5, 0, v_base_url||'/furniture/clothing_rack_single_01.glb', true, true, NOW(), NOW()),
  ('b0030006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-002', '싱글 행거', '싱글 행거', 'clothing_rack_single_02', 'rack', 1.2, 1.8, 0.4, -7.5, 0, -3.5, 0, v_base_url||'/furniture/clothing_rack_single_02.glb', true, true, NOW(), NOW()),
  ('b0030007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-003', '싱글 행거', '싱글 행거', 'clothing_rack_single_03', 'rack', 1.2, 1.8, 0.4, -6.5, 0, -3.5, 0, v_base_url||'/furniture/clothing_rack_single_03.glb', true, true, NOW(), NOW()),
  ('b0030008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SRACK-004', '싱글 행거', '싱글 행거', 'clothing_rack_single_04', 'rack', 1.2, 1.8, 0.4, -8.5, 0, -4, 0, v_base_url||'/furniture/clothing_rack_single_04.glb', true, true, NOW(), NOW()),
  ('b0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SHELF-001', '선반형 진열대', '선반 진열대', 'shelf_display_01', 'shelf', 1.2, 2.0, 0.4, -8.5, 0, -4.8, 0, v_base_url||'/furniture/shelf_display_01.glb', true, true, NOW(), NOW()),
  ('b0030010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'SHELF-002', '선반형 진열대', '선반 진열대', 'shelf_display_02', 'shelf', 1.2, 2.0, 0.4, -7.5, 0, -4.8, 0, v_base_url||'/furniture/shelf_display_02.glb', true, true, NOW(), NOW()),
  ('b0000021-0000-0000-0000-000000000021'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TABLE-001', '테이블 디스플레이', '테이블', 'table_display_01', 'table', 1.0, 0.9, 0.8, -8.5, 0, -5.7, 0, v_base_url||'/furniture/table_display_01.glb', true, true, NOW(), NOW()),
  ('b0030012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TABLE-002', '테이블 디스플레이', '테이블', 'table_display_02', 'table', 1.0, 0.9, 0.8, -7.5, 0, -5.7, 0, v_base_url||'/furniture/table_display_02.glb', true, true, NOW(), NOW()),
  ('b0030013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-001', '상반신 마네킹', '토르소', 'mannequin_torso_01', 'mannequin', 0.4, 0.9, 0.3, -6.5, 0, -4.8, 90, v_base_url||'/furniture/mannequin_torso_01.glb', true, true, NOW(), NOW()),
  ('b0030014-0000-0000-0000-000000000014'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing, 'TORSO-002', '상반신 마네킹', '토르소', 'mannequin_torso_02', 'mannequin', 0.4, 0.9, 0.3, -6.1, 0, -4.8, 90, v_base_url||'/furniture/mannequin_torso_02.glb', true, true, NOW(), NOW()),
  -- Z004 액세서리존 (11건)
  ('b0040001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'CASE-001', '쇼케이스 (잠금형)', '잠금 쇼케이스', 'showcase_locked_01', 'showcase', 1.0, 1.2, 0.5, 5.8, 0, -2, 0, v_base_url||'/furniture/showcase_locked_01.glb', false, true, NOW(), NOW()),
  ('b0040002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'CASE-002', '쇼케이스 (잠금형)', '잠금 쇼케이스', 'showcase_locked_02', 'showcase', 1.0, 1.2, 0.5, 6.8, 0, -2, 0, v_base_url||'/furniture/showcase_locked_02.glb', false, true, NOW(), NOW()),
  ('b0040003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'OCASE-001', '오픈 쇼케이스', '오픈 쇼케이스', 'showcase_open_01', 'showcase', 1.2, 1.0, 0.4, 5.8, 0, -2.8, 0, v_base_url||'/furniture/showcase_open_01.glb', true, true, NOW(), NOW()),
  ('b0040004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'OCASE-002', '오픈 쇼케이스', '오픈 쇼케이스', 'showcase_open_02', 'showcase', 1.2, 1.0, 0.4, 6.9, 0, -2.8, 0, v_base_url||'/furniture/showcase_open_02.glb', true, true, NOW(), NOW()),
  ('b0040005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'BAG-001', '가방 진열대', '가방 진열', 'display_bag_01', 'display', 1.5, 1.5, 0.5, 5.8, 0, -3.7, 0, v_base_url||'/furniture/display_bag_01.glb', true, true, NOW(), NOW()),
  ('b0040006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'BAG-002', '가방 진열대', '가방 진열', 'display_bag_02', 'display', 1.5, 1.5, 0.5, 7, 0, -3.7, 0, v_base_url||'/furniture/display_bag_02.glb', true, true, NOW(), NOW()),
  ('b0040007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'ROTATE-001', '악세서리 스탠드', '악세서리', 'stand_accessory_01', 'stand', 0.4, 1.4, 0.4, 8.2, 0, -3.7, 0, v_base_url||'/furniture/stand_accessory_01.glb', true, true, NOW(), NOW()),
  ('b0040008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'ROTATE-002', '악세서리 스탠드', '악세서리', 'stand_accessory_02', 'stand', 0.4, 1.4, 0.4, 8.7, 0, -3.7, 0, v_base_url||'/furniture/stand_accessory_02.glb', true, true, NOW(), NOW()),
  ('b0000031-0000-0000-0000-000000000031'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-001', '신발 진열대', '신발 진열', 'shelf_shoes_01', 'rack', 1.2, 1.8, 0.4, 5.8, 0, -5, 0, v_base_url||'/furniture/shelf_shoes_01.glb', true, true, NOW(), NOW()),
  ('b0040010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-002', '신발 진열대', '신발 진열', 'shelf_shoes_02', 'rack', 1.2, 1.8, 0.4, 6.9, 0, -5, 0, v_base_url||'/furniture/shelf_shoes_02.glb', true, true, NOW(), NOW()),
  ('b0040011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory, 'SHOE-003', '신발 진열대', '신발 진열', 'shelf_shoes_03', 'rack', 1.2, 1.8, 0.4, 8, 0, -5, 0, v_base_url||'/furniture/shelf_shoes_03.glb', true, true, NOW(), NOW()),
  -- Z005 피팅룸 (4건)
  ('b0050001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-001', '피팅룸 부스', '피팅룸', 'fitting_booth_01', 'booth', 1.2, 2.2, 1.2, -8, 0, 7.3, 0, v_base_url||'/furniture/fitting_booth_01.glb', false, true, NOW(), NOW()),
  ('b0050002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-002', '피팅룸 부스', '피팅룸', 'fitting_booth_02', 'booth', 1.2, 2.2, 1.2, -8, 0, 6, 0, v_base_url||'/furniture/fitting_booth_02.glb', false, true, NOW(), NOW()),
  ('b0050003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-003', '피팅룸 부스', '피팅룸', 'fitting_booth_03', 'booth', 1.2, 2.2, 1.2, -8, 0, 4.7, 0, v_base_url||'/furniture/fitting_booth_03.glb', false, true, NOW(), NOW()),
  ('b0050004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_fitting, 'BOOTH-004', '피팅룸 부스', '피팅룸', 'fitting_booth_04', 'booth', 1.2, 2.2, 1.2, -8, 0, 3.3, 0, v_base_url||'/furniture/fitting_booth_04.glb', false, true, NOW(), NOW()),
  -- Z006 계산대 (4건)
  ('b0060001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'COUNTER-001', '계산대 카운터', '계산대', 'counter_checkout_01', 'counter', 2.0, 1.1, 0.6, 6.3, 0, 6.7, -90, v_base_url||'/furniture/counter_checkout_01.glb', false, true, NOW(), NOW()),
  ('b0060002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'COUNTER-002', '계산대 카운터', '계산대', 'counter_checkout_02', 'counter', 2.0, 1.1, 0.6, 6.3, 0, 5.7, -90, v_base_url||'/furniture/counter_checkout_02.glb', false, true, NOW(), NOW()),
  ('b0060003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'POS-001', 'POS 단말기', 'POS', 'pos_terminal_01', 'equipment', 0.3, 0.4, 0.3, 8, 1.1, 6.6, -90, v_base_url||'/furniture/pos_terminal_01.glb', false, true, NOW(), NOW()),
  ('b0060004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_checkout, 'POS-002', 'POS 단말기', 'POS', 'pos_terminal_02', 'equipment', 0.3, 0.4, 0.3, 8, 1.1, 5.6, -90, v_base_url||'/furniture/pos_terminal_02.glb', false, true, NOW(), NOW()),
  -- Z007 휴식공간 (6건)
  ('b0070001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'SOFA-001', '라운지 소파', '소파', 'sofa_2seat_01', 'sofa', 1.5, 0.85, 0.8, -4, 0, 8.8, 180, v_base_url||'/furniture/sofa_2seat_01.glb', true, true, NOW(), NOW()),
  ('b0070002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'SOFA-002', '라운지 소파', '소파', 'sofa_2seat_02', 'sofa', 1.5, 0.85, 0.8, -2.2, 0, 8.8, 180, v_base_url||'/furniture/sofa_2seat_02.glb', true, true, NOW(), NOW()),
  ('b0070003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'CHAIR-001', '라운지 의자', '의자', 'chair_lounge_01', 'chair', 0.6, 0.8, 0.6, 1, 0, 8.8, 180, v_base_url||'/furniture/chair_lounge_01.glb', true, true, NOW(), NOW()),
  ('b0070004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'CHAIR-002', '라운지 의자', '의자', 'chair_lounge_02', 'chair', 0.6, 0.8, 0.6, 2, 0, 8.8, 180, v_base_url||'/furniture/chair_lounge_02.glb', true, true, NOW(), NOW()),
  ('b0070005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'COFFEE-001', '커피 테이블', '테이블', 'table_coffee_01', 'table', 0.8, 0.45, 0.5, -3.1, 0, 8.1, 0, v_base_url||'/furniture/table_coffee_01.glb', true, true, NOW(), NOW()),
  ('b0070006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, v_zone_lounge, 'COFFEE-002', '커피 테이블', '테이블', 'table_coffee_02', 'table', 0.8, 0.45, 0.5, -0.3, 0, 8.1, 0, v_base_url||'/furniture/table_coffee_02.glb', true, true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET furniture_name = EXCLUDED.furniture_name, updated_at = NOW();

  SELECT COUNT(*) INTO v_count FROM furniture WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ furniture: % rows', v_count;

  -- STEP 4.2: furniture_slots 동적 생성
  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'clothing_rack_double_%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'H1-1', v_furn.furniture_type, 'hanger', '{"x":-0.328,"y":1.38,"z":0.5}', ARRAY['hanging'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'H1-2', v_furn.furniture_type, 'hanger', '{"x":0.328,"y":1.38,"z":0.5}', ARRAY['hanging'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'H2-1', v_furn.furniture_type, 'hanger', '{"x":-0.328,"y":1.38,"z":0}', ARRAY['hanging'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'H2-2', v_furn.furniture_type, 'hanger', '{"x":0.328,"y":1.38,"z":0}', ARRAY['hanging'], false, NOW());
  END LOOP;

  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'clothing_rack_single_%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'H1-1', v_furn.furniture_type, 'hanger', '{"x":0,"y":1.38,"z":0.5}', ARRAY['hanging'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'H2-1', v_furn.furniture_type, 'hanger', '{"x":0,"y":1.38,"z":0}', ARRAY['hanging'], false, NOW());
  END LOOP;

  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'shelf_shoes_%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'R1-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":0.2,"z":0}', ARRAY['located','standing'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'R1-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":0.2,"z":0}', ARRAY['located','standing'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'R2-1', v_furn.furniture_type, 'rack', '{"x":-0.15,"y":0.5,"z":0}', ARRAY['located','standing'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'R2-2', v_furn.furniture_type, 'rack', '{"x":0.15,"y":0.5,"z":0}', ARRAY['located','standing'], false, NOW());
  END LOOP;

  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'table_display_%' AND furniture_type NOT LIKE '%center%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'T1-1', v_furn.furniture_type, 'table', '{"x":-0.5,"y":0.76,"z":0.3}', ARRAY['folded','boxed','stacked'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'T1-2', v_furn.furniture_type, 'table', '{"x":0,"y":0.76,"z":0.3}', ARRAY['folded','boxed','stacked'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'T1-3', v_furn.furniture_type, 'table', '{"x":0.5,"y":0.76,"z":0.3}', ARRAY['folded','boxed','stacked'], false, NOW());
  END LOOP;

  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'showcase_locked_%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'S1', v_furn.furniture_type, 'showcase', '{"x":0,"y":0.45,"z":0}', ARRAY['located'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'S2', v_furn.furniture_type, 'showcase', '{"x":0,"y":0.71,"z":0}', ARRAY['located'], false, NOW());
  END LOOP;

  FOR v_furn IN SELECT id, furniture_type FROM furniture WHERE store_id = v_store_id AND furniture_type LIKE 'display_bag_%' LOOP
    INSERT INTO furniture_slots (furniture_id, store_id, user_id, slot_id, furniture_type, slot_type, slot_position, compatible_display_types, is_occupied, created_at) VALUES
    (v_furn.id, v_store_id, v_user_id, 'D1-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":0.04,"z":0}', ARRAY['hanging','located'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'D1-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":0.04,"z":0}', ARRAY['hanging','located'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'D2-1', v_furn.furniture_type, 'display', '{"x":-0.4,"y":0.42,"z":0}', ARRAY['hanging','located'], false, NOW()),
    (v_furn.id, v_store_id, v_user_id, 'D2-2', v_furn.furniture_type, 'display', '{"x":0.4,"y":0.42,"z":0}', ARRAY['hanging','located'], false, NOW());
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM furniture_slots WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ furniture_slots: % rows', v_count;

  -- STEP 5.1: products (25개)
  INSERT INTO products (id, store_id, user_id, org_id, product_name, sku, category, price, cost_price, stock, display_type, compatible_display_types, model_3d_url, created_at) VALUES
  ('f0000001-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '프리미엄 캐시미어 코트', 'SKU-OUT-001', '아우터', 450000, 180000, 15, 'hanging', ARRAY['hanging','standing'], v_base_url||'/product/product_coat.glb', NOW()),
  ('f0000002-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '울 테일러드 재킷', 'SKU-OUT-002', '아우터', 380000, 152000, 20, 'hanging', ARRAY['hanging','standing'], v_base_url||'/product/product_jacket.glb', NOW()),
  ('f0000003-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '다운 패딩', 'SKU-OUT-003', '아우터', 380000, 152000, 20, 'hanging', ARRAY['hanging'], v_base_url||'/product/product_padding.glb', NOW()),
  ('f0000004-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '트렌치 코트', 'SKU-OUT-004', '아우터', 380000, 152000, 20, 'hanging', ARRAY['hanging'], v_base_url||'/product/product_trench.glb', NOW()),
  ('f0000005-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '레더 재킷', 'SKU-OUT-005', '아우터', 380000, 152000, 20, 'hanging', ARRAY['hanging'], v_base_url||'/product/product_leather.glb', NOW()),
  ('f0000006-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '실크 블라우스', 'SKU-TOP-001', '상의', 120000, 48000, 25, 'hanging', ARRAY['hanging','folded'], v_base_url||'/product/product_blouse.glb', NOW()),
  ('f0000007-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '캐주얼 니트 스웨터', 'SKU-TOP-002', '상의', 98000, 39200, 30, 'folded', ARRAY['hanging','folded'], v_base_url||'/product/product_sweater.glb', NOW()),
  ('f0000008-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '옥스포드 셔츠', 'SKU-TOP-003', '상의', 85000, 34000, 35, 'hanging', ARRAY['hanging','folded'], v_base_url||'/product/product_shirt.glb', NOW()),
  ('f0000009-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '린넨 탑', 'SKU-TOP-004', '상의', 75000, 30000, 28, 'hanging', ARRAY['hanging','folded'], v_base_url||'/product/product_linen_top.glb', NOW()),
  ('f0000010-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '폴로 셔츠', 'SKU-TOP-005', '상의', 75000, 30000, 28, 'folded', ARRAY['hanging','folded'], v_base_url||'/product/product_polo.glb', NOW()),
  ('f0000011-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '리넨 와이드 팬츠', 'SKU-BTM-001', '하의', 128000, 51200, 40, 'hanging', ARRAY['hanging','folded'], v_base_url||'/product/product_pants.glb', NOW()),
  ('f0000012-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '슬림핏 데님', 'SKU-BTM-002', '하의', 95000, 38000, 35, 'hanging', ARRAY['hanging','folded'], v_base_url||'/product/product_denim.glb', NOW()),
  ('f0000013-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '치노 팬츠', 'SKU-BTM-003', '하의', 95000, 38000, 35, 'folded', ARRAY['hanging','folded'], v_base_url||'/product/product_chino.glb', NOW()),
  ('f0000014-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '조거 팬츠', 'SKU-BTM-004', '하의', 95000, 38000, 35, 'folded', ARRAY['hanging','folded'], v_base_url||'/product/product_jogger.glb', NOW()),
  ('f0000015-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '프리미엄 로퍼', 'SKU-SHO-001', '신발', 280000, 112000, 18, 'located', ARRAY['located','standing'], v_base_url||'/product/product_loafer.glb', NOW()),
  ('f0000016-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '하이힐 펌프스', 'SKU-SHO-002', '신발', 320000, 128000, 12, 'located', ARRAY['located'], v_base_url||'/product/product_heels.glb', NOW()),
  ('f0000017-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '프리미엄 스니커즈', 'SKU-SHO-003', '신발', 198000, 79200, 25, 'located', ARRAY['located'], v_base_url||'/product/product_sneakers.glb', NOW()),
  ('f0000018-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '가죽 토트백', 'SKU-BAG-001', '가방', 350000, 140000, 10, 'located', ARRAY['located','hanging'], v_base_url||'/product/product_tote.glb', NOW()),
  ('f0000019-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '울 머플러', 'SKU-MUF-001', '머플러', 180000, 72000, 15, 'folded', ARRAY['folded'], v_base_url||'/product/product_muffler.glb', NOW()),
  ('f0000020-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '실크 스카프', 'SKU-SCA-001', '스카프', 85000, 34000, 20, 'folded', ARRAY['folded'], v_base_url||'/product/product_scarf.glb', NOW()),
  ('f0000021-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '가죽 벨트', 'SKU-BLT-001', '벨트', 120000, 48000, 30, 'located', ARRAY['located'], v_base_url||'/product/product_belt.glb', NOW()),
  ('f0000022-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '실버 목걸이', 'SKU-JWL-001', '쥬얼리', 180000, 72000, 12, 'located', ARRAY['located'], v_base_url||'/product/product_necklace.glb', NOW()),
  ('f0000023-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '스킨케어 세트', 'SKU-SKI-001', '화장품', 65000, 26000, 40, 'boxed', ARRAY['boxed'], v_base_url||'/product/product_skincare.glb', NOW()),
  ('f0000024-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '립스틱 컬렉션', 'SKU-LIP-001', '화장품', 25000, 10000, 60, 'stacked', ARRAY['stacked'], v_base_url||'/product/product_lipstick.glb', NOW()),
  ('f0000025-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id, '프리미엄 선물 세트', 'SKU-GFT-001', '선물세트', 150000, 60000, 20, 'boxed', ARRAY['boxed'], v_base_url||'/product/product_giftbox.glb', NOW())
  ON CONFLICT (id) DO UPDATE SET product_name = EXCLUDED.product_name, updated_at = NOW();

  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ products: % rows', v_count;

  -- STEP 5.2: product_models
  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default, created_at)
  SELECT p.id, dt.dtype, v_base_url||'/product/'||REPLACE(LOWER(p.sku),'-','_')||'_'||dt.dtype||'.glb', dt.dtype = p.display_type, NOW()
  FROM products p, (SELECT unnest(ARRAY['hanging','standing','folded','stacked','located','boxed']) as dtype) dt
  WHERE p.store_id = v_store_id AND dt.dtype = ANY(p.compatible_display_types)
  ON CONFLICT DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM product_models pm JOIN products p ON pm.product_id = p.id WHERE p.store_id = v_store_id;
  RAISE NOTICE '  ✓ product_models: % rows', v_count;

  -- STEP 5.3: inventory_levels
  INSERT INTO inventory_levels (store_id, user_id, org_id, product_id, quantity, min_quantity, max_quantity, reorder_point, created_at)
  SELECT v_store_id, v_user_id, v_org_id, p.id, p.stock, 5, p.stock*3, 10, NOW()
  FROM products p WHERE p.store_id = v_store_id
  ON CONFLICT DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM inventory_levels WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ inventory_levels: % rows', v_count;

  -- STEP 6.1: product_placements (5개 MVP)
  INSERT INTO product_placements (slot_id, product_id, store_id, user_id, display_type, quantity, is_active, placed_at, created_at)
  SELECT fs.id, 'f0000001-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, 'hanging', 1, true, NOW(), NOW()
  FROM furniture_slots fs WHERE fs.furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND fs.slot_id = 'H1-1';

  INSERT INTO product_placements (slot_id, product_id, store_id, user_id, display_type, quantity, is_active, placed_at, created_at)
  SELECT fs.id, 'f0000015-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, 'located', 1, true, NOW(), NOW()
  FROM furniture_slots fs WHERE fs.furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND fs.slot_id = 'R1-1';

  INSERT INTO product_placements (slot_id, product_id, store_id, user_id, display_type, quantity, is_active, placed_at, created_at)
  SELECT fs.id, 'f0000025-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, 'boxed', 1, true, NOW(), NOW()
  FROM furniture_slots fs WHERE fs.furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND fs.slot_id = 'T1-1';

  INSERT INTO product_placements (slot_id, product_id, store_id, user_id, display_type, quantity, is_active, placed_at, created_at)
  SELECT fs.id, 'f0000018-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, 'located', 1, true, NOW(), NOW()
  FROM furniture_slots fs WHERE fs.furniture_id = 'b0040005-0000-0000-0000-000000000005'::UUID AND fs.slot_id = 'D1-1';

  INSERT INTO product_placements (slot_id, product_id, store_id, user_id, display_type, quantity, is_active, placed_at, created_at)
  SELECT fs.id, 'f0000022-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, 'located', 1, true, NOW(), NOW()
  FROM furniture_slots fs WHERE fs.furniture_id = 'b0040001-0000-0000-0000-000000000001'::UUID AND fs.slot_id = 'S1';

  -- STEP 6.2: 슬롯 점유 업데이트
  UPDATE furniture_slots fs SET is_occupied = true FROM product_placements pp WHERE pp.slot_id = fs.id AND pp.is_active = true;

  SELECT COUNT(*) INTO v_count FROM product_placements WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ product_placements: % rows', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_03 완료!';

END $$;

COMMIT;
