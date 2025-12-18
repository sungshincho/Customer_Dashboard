-- ============================================================================
-- NEURALTWIN v8.6 SEED_05: 그래프/AI 데이터
-- ============================================================================
-- 실행 순서: SEED_04 이후
-- 목적: graph_entities, graph_relations, data_source_tables, applied_strategies, ai_recommendations 등
-- 예상 레코드: ~500건
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_count INT;
  v_entity_id UUID;
  v_strategy_id UUID;
  v_day INT;
  v_base_date DATE;
  v_entity_type_id UUID;
  v_relation_type_id UUID;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_05: 그래프/AI 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();

  v_base_date := CURRENT_DATE - INTERVAL '90 days';

  -- ============================================================================
  -- STEP 10.1: graph_entities (~120건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 10.1] graph_entities 시딩...';

  -- 존 엔티티 (7개)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type, entity_name, entity_key, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'zone', z.zone_name, z.zone_code,
    jsonb_build_object('zone_type', z.zone_type, 'area_sqm', z.area_sqm, 'floor', z.floor_number), NOW()
  FROM zones_dim z WHERE z.store_id = v_store_id;

  -- 상품 엔티티 (25개)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type, entity_name, entity_key, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'product', p.product_name, p.sku,
    jsonb_build_object('category', p.category, 'price', p.price, 'display_type', p.display_type), NOW()
  FROM products p WHERE p.store_id = v_store_id;

  -- 가구 엔티티 (68개)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type, entity_name, entity_key, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'furniture', f.furniture_name, f.furniture_code,
    jsonb_build_object('type', f.furniture_type, 'category', f.category, 'zone_id', f.zone_id), NOW()
  FROM furniture f WHERE f.store_id = v_store_id;

  -- 고객 세그먼트 엔티티 (4개)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type, entity_name, entity_key, properties, created_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'segment', 'VIP 고객', 'SEG-VIP', '{"min_spend": 2500000, "visit_freq": "high"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'segment', '일반 고객', 'SEG-REG', '{"min_spend": 300000, "visit_freq": "medium"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'segment', '신규 고객', 'SEG-NEW', '{"min_spend": 0, "visit_freq": "low"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'segment', '휴면 고객', 'SEG-DOR', '{"last_visit_days": 90, "status": "dormant"}'::jsonb, NOW());

  -- 전략 엔티티 (10개)
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type, entity_name, entity_key, properties, created_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '입구 동선 최적화', 'STR-001', '{"type": "layout", "target_zone": "Z001"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '의류존 진열 개선', 'STR-002', '{"type": "display", "target_zone": "Z003"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '계산대 대기시간 감소', 'STR-003', '{"type": "operation", "target_zone": "Z006"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', 'VIP 타겟 프로모션', 'STR-004', '{"type": "promotion", "target_segment": "VIP"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '신규 고객 유치 캠페인', 'STR-005', '{"type": "acquisition", "target_segment": "NEW"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '휴면 고객 재활성화', 'STR-006', '{"type": "retention", "target_segment": "DOR"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '피팅룸 이용률 향상', 'STR-007', '{"type": "conversion", "target_zone": "Z005"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '액세서리 크로스셀', 'STR-008', '{"type": "upsell", "target_zone": "Z004"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '시즌 컬렉션 강조', 'STR-009', '{"type": "merchandising", "target": "seasonal"}'::jsonb, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'strategy', '휴식공간 체류 유도', 'STR-010', '{"type": "experience", "target_zone": "Z007"}'::jsonb, NOW());

  SELECT COUNT(*) INTO v_count FROM graph_entities WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ graph_entities: % rows', v_count;

  -- ============================================================================
  -- STEP 10.2: graph_relations (~200건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 10.2] graph_relations 시딩...';

  -- 존-존 인접 관계
  INSERT INTO graph_relations (id, store_id, user_id, org_id, source_entity_id, target_entity_id, relation_type, weight, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, s.id, t.id, 'adjacent_to', 1.0,
    jsonb_build_object('flow_direction', 'bidirectional'), NOW()
  FROM graph_entities s, graph_entities t
  WHERE s.store_id = v_store_id AND t.store_id = v_store_id
    AND s.entity_type = 'zone' AND t.entity_type = 'zone'
    AND s.id != t.id
  LIMIT 20;

  -- 상품-존 배치 관계
  INSERT INTO graph_relations (id, store_id, user_id, org_id, source_entity_id, target_entity_id, relation_type, weight, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, p.id, z.id, 'displayed_in', 1.0,
    jsonb_build_object('display_type', p.properties->>'display_type'), NOW()
  FROM graph_entities p, graph_entities z
  WHERE p.store_id = v_store_id AND z.store_id = v_store_id
    AND p.entity_type = 'product' AND z.entity_type = 'zone'
  LIMIT 50;

  -- 가구-존 위치 관계
  INSERT INTO graph_relations (id, store_id, user_id, org_id, source_entity_id, target_entity_id, relation_type, weight, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, f.id, z.id, 'located_in', 1.0,
    jsonb_build_object('furniture_type', f.properties->>'type'), NOW()
  FROM graph_entities f, graph_entities z
  WHERE f.store_id = v_store_id AND z.store_id = v_store_id
    AND f.entity_type = 'furniture' AND z.entity_type = 'zone'
  LIMIT 68;

  -- 전략-존 타겟 관계
  INSERT INTO graph_relations (id, store_id, user_id, org_id, source_entity_id, target_entity_id, relation_type, weight, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, s.id, z.id, 'targets', 0.8,
    jsonb_build_object('strategy_type', s.properties->>'type'), NOW()
  FROM graph_entities s, graph_entities z
  WHERE s.store_id = v_store_id AND z.store_id = v_store_id
    AND s.entity_type = 'strategy' AND z.entity_type = 'zone'
  LIMIT 20;

  -- 상품-상품 연관 관계 (크로스셀)
  INSERT INTO graph_relations (id, store_id, user_id, org_id, source_entity_id, target_entity_id, relation_type, weight, properties, created_at)
  SELECT gen_random_uuid(), v_store_id, v_user_id, v_org_id, p1.id, p2.id, 'frequently_bought_with', RANDOM()::NUMERIC(3,2),
    jsonb_build_object('confidence', RANDOM()::NUMERIC(3,2)), NOW()
  FROM graph_entities p1, graph_entities p2
  WHERE p1.store_id = v_store_id AND p2.store_id = v_store_id
    AND p1.entity_type = 'product' AND p2.entity_type = 'product'
    AND p1.id < p2.id
  LIMIT 40;

  SELECT COUNT(*) INTO v_count FROM graph_relations WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ graph_relations: % rows', v_count;

  -- ============================================================================
  -- STEP 11.1: data_source_tables (15건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 11.1] data_source_tables 시딩...';

  INSERT INTO data_source_tables (id, data_source_id, store_id, user_id, org_id, table_name, sync_enabled, last_sync_at, created_at) VALUES
  (gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'pos_transactions', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'pos_line_items', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'pos_refunds', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'wifi_devices', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'wifi_sessions', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'wifi_locations', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'camera_counts', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'camera_heatmaps', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'camera_demographics', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'iot_temperature', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'iot_humidity', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'iot_occupancy', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'crm_customers', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'crm_loyalty', true, NOW(), NOW()),
  (gen_random_uuid(), 'd0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'crm_campaigns', true, NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ data_source_tables: % rows', v_count;

  -- ============================================================================
  -- STEP 12.1: applied_strategies (10건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 12.1] applied_strategies 시딩...';

  INSERT INTO applied_strategies (id, store_id, user_id, org_id, strategy_name, strategy_type, description, target_metric, expected_improvement, actual_improvement, status, start_date, end_date, created_at, updated_at)
  SELECT
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    g.entity_name, g.properties->>'type',
    '전략 설명: ' || g.entity_name,
    CASE (ROW_NUMBER() OVER ())::INT % 5
      WHEN 0 THEN 'conversion_rate' WHEN 1 THEN 'revenue' WHEN 2 THEN 'aov'
      WHEN 3 THEN 'dwell_time' ELSE 'visitor_count'
    END,
    (5 + RANDOM() * 15)::NUMERIC(5,2),
    (3 + RANDOM() * 12)::NUMERIC(5,2),
    CASE (ROW_NUMBER() OVER ())::INT % 3 WHEN 0 THEN 'active' WHEN 1 THEN 'completed' ELSE 'pending' END,
    v_base_date + ((ROW_NUMBER() OVER ())::INT * 7),
    v_base_date + ((ROW_NUMBER() OVER ())::INT * 7) + 30,
    NOW(), NOW()
  FROM graph_entities g
  WHERE g.store_id = v_store_id AND g.entity_type = 'strategy'
  LIMIT 10;

  SELECT COUNT(*) INTO v_count FROM applied_strategies WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ applied_strategies: % rows', v_count;

  -- ============================================================================
  -- STEP 12.2: strategy_daily_metrics (90일 × 10전략 = 900건, 샘플 100건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 12.2] strategy_daily_metrics 시딩...';

  INSERT INTO strategy_daily_metrics (id, strategy_id, store_id, metric_date, metric_value, comparison_value, improvement_pct, created_at)
  SELECT
    gen_random_uuid(), s.id, v_store_id,
    v_base_date + d.day_offset,
    (100 + RANDOM() * 50)::NUMERIC(10,2),
    (95 + RANDOM() * 45)::NUMERIC(10,2),
    (-5 + RANDOM() * 20)::NUMERIC(5,2),
    NOW()
  FROM applied_strategies s,
    (SELECT generate_series(0, 89, 9) as day_offset) d
  WHERE s.store_id = v_store_id;

  SELECT COUNT(*) INTO v_count FROM strategy_daily_metrics WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ strategy_daily_metrics: % rows', v_count;

  -- ============================================================================
  -- STEP 12.3: strategy_feedback (10건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 12.3] strategy_feedback 시딩...';

  INSERT INTO strategy_feedback (id, strategy_id, store_id, user_id, feedback_type, rating, comment, created_at)
  SELECT
    gen_random_uuid(), s.id, v_store_id, v_user_id,
    CASE (ROW_NUMBER() OVER ())::INT % 3 WHEN 0 THEN 'positive' WHEN 1 THEN 'neutral' ELSE 'suggestion' END,
    3 + (RANDOM() * 2)::INT,
    '전략 피드백 코멘트 #' || (ROW_NUMBER() OVER ())::TEXT,
    NOW()
  FROM applied_strategies s
  WHERE s.store_id = v_store_id;

  SELECT COUNT(*) INTO v_count FROM strategy_feedback WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ strategy_feedback: % rows', v_count;

  -- ============================================================================
  -- STEP 12.4: ai_recommendations (20건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 12.4] ai_recommendations 시딩...';

  INSERT INTO ai_recommendations (id, store_id, user_id, org_id, recommendation_type, title, description, priority, confidence_score, expected_impact, status, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '입구 진열대 재배치', '입구 진입 시 시선이 닿는 위치에 시즌 상품 배치 권장', 'high', 0.87, '전환율 +8%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'product', '코트-머플러 크로스셀', '코트 구매 고객에게 머플러 추천 시 객단가 상승 예상', 'medium', 0.82, '객단가 +12%', 'applied', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'staffing', '피크타임 인력 증원', '토요일 14-17시 계산대 인력 1명 추가 권장', 'high', 0.91, '대기시간 -35%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'promotion', 'VIP 전용 프리뷰', 'VIP 고객 대상 신상품 프리뷰 이벤트 진행 권장', 'medium', 0.78, 'VIP 매출 +15%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '의류존 동선 개선', '행거 간격 확보로 고객 체류 시간 증가 예상', 'low', 0.73, '체류시간 +20%', 'rejected', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'product', '신발-양말 세트 구성', '신발 구매 시 양말 할인 번들 구성 권장', 'medium', 0.80, '부가판매 +18%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'operation', '피팅룸 예약 시스템', '피크타임 피팅룸 예약제 도입으로 고객 만족도 향상', 'high', 0.85, '전환율 +5%', 'applied', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '액세서리존 조명 강화', '주얼리 진열대 스팟 조명 추가로 관심도 증가', 'low', 0.69, '체류시간 +10%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'promotion', '휴면 고객 재활성화', '90일 미방문 고객 대상 20% 할인 쿠폰 발송', 'high', 0.88, '재방문율 +25%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'product', '계절 전환 상품 배치', '겨울 아우터를 전면 배치하고 가을 상품 후면 이동', 'medium', 0.84, '매출 +10%', 'applied', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'staffing', '의류존 전문 스타일리스트', '의류존에 스타일링 전문 직원 배치 권장', 'medium', 0.76, '전환율 +7%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '휴식공간 확장', '소파 추가 배치로 동반 고객 체류 시간 증가', 'low', 0.71, '체류시간 +15%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'operation', '재고 자동 알림', '인기 상품 재고 부족 시 자동 알림 시스템 구축', 'high', 0.92, '기회손실 -30%', 'applied', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'promotion', '평일 해피아워', '평일 오전 10-12시 추가 할인으로 방문 유도', 'medium', 0.75, '평일 방문 +20%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'product', '선물세트 전면 배치', '연말 시즌 선물세트 메인홀 중앙 배치 권장', 'high', 0.89, '선물세트 매출 +40%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '신발존 벤치 추가', '신발 착용 테스트용 벤치 추가 배치', 'low', 0.68, '전환율 +3%', 'rejected', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'staffing', '보안요원 순찰 경로', '분실 방지를 위한 순찰 경로 최적화', 'medium', 0.77, '손실률 -15%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'operation', '디지털 가격표', '가격 변경 실시간 반영을 위한 디지털 가격표 도입', 'low', 0.72, '운영효율 +10%', 'pending', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'promotion', '앱 전용 혜택', '모바일 앱 사용 고객 추가 포인트 적립', 'medium', 0.81, '앱 사용률 +30%', 'applied', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout', '계산대 대기열 관리', '대기열 표시 및 빈 계산대 안내 시스템', 'high', 0.86, '대기시간 -25%', 'pending', NOW(), NOW());

  SELECT COUNT(*) INTO v_count FROM ai_recommendations WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ ai_recommendations: % rows', v_count;

  -- ============================================================================
  -- STEP 12.5: ai_inference_results (10건)
  -- ============================================================================
  RAISE NOTICE '  [STEP 12.5] ai_inference_results 시딩...';

  INSERT INTO ai_inference_results (id, store_id, user_id, org_id, model_name, model_version, input_data, output_data, confidence_score, inference_time_ms, created_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'layout_optimizer', 'v2.1', '{"zone": "Z003", "metric": "conversion"}'::jsonb, '{"recommended_changes": 5, "expected_lift": 8.5}'::jsonb, 0.87, 245, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'customer_segmentation', 'v1.5', '{"features": ["recency", "frequency", "monetary"]}'::jsonb, '{"segments": 4, "accuracy": 0.92}'::jsonb, 0.92, 180, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'demand_forecast', 'v3.0', '{"horizon": 7, "products": 25}'::jsonb, '{"mape": 8.3, "predictions": 175}'::jsonb, 0.89, 520, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'cross_sell_engine', 'v2.0', '{"product": "SKU-OUT-001"}'::jsonb, '{"recommendations": ["SKU-MUF-001", "SKU-SCA-001"], "lift": 15.2}'::jsonb, 0.84, 95, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'traffic_prediction', 'v1.8', '{"day": "saturday", "hour": 14}'::jsonb, '{"predicted_visitors": 125, "confidence_interval": [110, 140]}'::jsonb, 0.91, 78, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'churn_predictor', 'v2.2', '{"customer_cohort": "regular"}'::jsonb, '{"at_risk_count": 150, "churn_probability": 0.23}'::jsonb, 0.86, 312, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'price_optimizer', 'v1.3', '{"category": "아우터"}'::jsonb, '{"optimal_discount": 15, "expected_volume_lift": 22}'::jsonb, 0.79, 156, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'staff_scheduler', 'v2.5', '{"week": "current"}'::jsonb, '{"optimal_shifts": 56, "coverage_score": 0.94}'::jsonb, 0.93, 420, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'inventory_optimizer', 'v1.9', '{"reorder_analysis": true}'::jsonb, '{"reorder_items": 8, "stockout_risk": 0.12}'::jsonb, 0.88, 285, NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'zone_heatmap', 'v2.3', '{"time_window": "last_7_days"}'::jsonb, '{"hot_zones": ["Z002", "Z003"], "cold_zones": ["Z007"]}'::jsonb, 0.90, 198, NOW());

  SELECT COUNT(*) INTO v_count FROM ai_inference_results WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ ai_inference_results: % rows', v_count;

  -- ============================================================================
  -- 완료 리포트
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_05 완료: 그래프/AI 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;
