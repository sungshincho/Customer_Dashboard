-- ============================================================================
-- NEURALTWIN: 전체 데이터 삭제 스크립트
-- ============================================================================
-- Version: 1.0.0
-- Date: 2024-12-18
-- Description:
--   모든 시딩된 데이터를 FK 의존성 순서에 맞게 안전하게 삭제합니다.
--   삭제 후 시딩 스크립트를 실행하여 새 데이터를 생성할 수 있습니다.
--
-- 주의사항:
--   - 이 스크립트는 모든 데이터를 삭제합니다!
--   - 실행 전 반드시 백업을 권장합니다.
--   - 테이블 스키마(DDL)는 유지됩니다.
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '        NEURALTWIN 전체 데이터 삭제 - 시작                       ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Target Store ID: %', v_store_id;
  RAISE NOTICE '';

  -- ★ FK 제약조건 임시 비활성화 (세션 레벨)
  SET session_replication_role = 'replica';

  -- ============================================================================
  -- STEP 1: 집계 테이블 삭제 (Level 6)
  -- ============================================================================
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 1: 집계 테이블 삭제 (Level 6)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ daily_kpis_agg: % rows deleted', v_count;

  DELETE FROM daily_sales WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ daily_sales: % rows deleted', v_count;

  DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ zone_daily_metrics: % rows deleted', v_count;

  DELETE FROM hourly_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ hourly_metrics: % rows deleted', v_count;

  DELETE FROM product_performance_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ product_performance_agg: % rows deleted', v_count;

  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ customer_segments_agg: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 2: 트랜잭션 상세/이벤트 삭제 (Level 5)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 2: 트랜잭션 상세/이벤트 삭제 (Level 5)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM line_items WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ line_items: % rows deleted', v_count;

  DELETE FROM funnel_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ funnel_events: % rows deleted', v_count;

  DELETE FROM zone_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ zone_events: % rows deleted', v_count;

  DELETE FROM graph_relations WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ graph_relations: % rows deleted', v_count;

  DELETE FROM strategy_daily_metrics WHERE strategy_id IN
    (SELECT id FROM applied_strategies WHERE store_id = v_store_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ strategy_daily_metrics: % rows deleted', v_count;

  DELETE FROM strategy_feedback WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ strategy_feedback: % rows deleted', v_count;

  DELETE FROM ontology_entity_mappings WHERE data_source_id IN
    (SELECT id FROM data_sources WHERE store_id = v_store_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_entity_mappings: % rows deleted', v_count;

  DELETE FROM ontology_relation_mappings WHERE data_source_id IN
    (SELECT id FROM data_sources WHERE store_id = v_store_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_relation_mappings: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 3: 트랜잭션 데이터 삭제 (Level 4)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 3: 트랜잭션 데이터 삭제 (Level 4)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM store_visits WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ store_visits: % rows deleted', v_count;

  DELETE FROM purchases WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ purchases: % rows deleted', v_count;

  DELETE FROM transactions WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ transactions: % rows deleted', v_count;

  DELETE FROM inventory_levels WHERE product_id IN
    (SELECT id FROM products WHERE store_id = v_store_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ inventory_levels: % rows deleted', v_count;

  DELETE FROM graph_entities WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ graph_entities: % rows deleted', v_count;

  DELETE FROM applied_strategies WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ applied_strategies: % rows deleted', v_count;

  DELETE FROM ai_recommendations WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ai_recommendations: % rows deleted', v_count;

  DELETE FROM ai_inference_results WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ai_inference_results: % rows deleted', v_count;

  DELETE FROM product_placements WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ product_placements: % rows deleted', v_count;

  DELETE FROM layout_optimization_results WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ layout_optimization_results: % rows deleted', v_count;

  DELETE FROM data_source_tables WHERE data_source_id IN
    (SELECT id FROM data_sources WHERE store_id = v_store_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ data_source_tables: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 4: 가구/슬롯 삭제 (Level 3)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 4: 가구/슬롯 삭제 (Level 3)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM furniture_slots WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ furniture_slots: % rows deleted', v_count;

  DELETE FROM furniture WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ furniture: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 5: 기본 엔티티 삭제 (Level 2)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 5: 기본 엔티티 삭제 (Level 2)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM zones_dim WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ zones_dim: % rows deleted', v_count;

  DELETE FROM products WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ products: % rows deleted', v_count;

  DELETE FROM staff WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ staff: % rows deleted', v_count;

  DELETE FROM customers WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ customers: % rows deleted', v_count;

  DELETE FROM store_goals WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ store_goals: % rows deleted', v_count;

  DELETE FROM store_scenes WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ store_scenes: % rows deleted', v_count;

  DELETE FROM data_sources WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ data_sources: % rows deleted', v_count;

  DELETE FROM retail_concepts WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ retail_concepts: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 6: 마스터 데이터 삭제 (Level 1)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 6: 마스터 데이터 삭제 (Level 1)';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  DELETE FROM stores WHERE id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ stores: % rows deleted', v_count;

  -- ============================================================================
  -- STEP 7: 온톨로지 타입 삭제 (Level 0) - Optional
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'STEP 7: 온톨로지 타입 삭제 (Level 0) - Optional';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  -- 다른 store에서 공유될 수 있으므로 선택적 삭제
  DELETE FROM ontology_relation_types WHERE id IN (
    'c0000001-0000-0000-0000-000000000001'::UUID,
    'c0000002-0000-0000-0000-000000000002'::UUID,
    'c0000003-0000-0000-0000-000000000003'::UUID,
    'c0000004-0000-0000-0000-000000000004'::UUID,
    'c0000005-0000-0000-0000-000000000005'::UUID,
    'c0000006-0000-0000-0000-000000000006'::UUID,
    'c0000007-0000-0000-0000-000000000007'::UUID,
    'c0000008-0000-0000-0000-000000000008'::UUID,
    'c0000009-0000-0000-0000-000000000009'::UUID,
    'c0000010-0000-0000-0000-000000000010'::UUID,
    'c0000011-0000-0000-0000-000000000011'::UUID,
    'c0000012-0000-0000-0000-000000000012'::UUID,
    'c0000013-0000-0000-0000-000000000013'::UUID,
    'c0000014-0000-0000-0000-000000000014'::UUID,
    'c0000015-0000-0000-0000-000000000015'::UUID
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_relation_types: % rows deleted', v_count;

  DELETE FROM ontology_entity_types WHERE id::TEXT LIKE 'b0000%';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_entity_types: % rows deleted', v_count;

  -- ============================================================================
  -- FK 제약조건 재활성화
  -- ============================================================================
  SET session_replication_role = 'origin';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '        NEURALTWIN 전체 데이터 삭제 - 완료                       ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계: 시딩 스크립트 실행';
  RAISE NOTICE '  1. NEURALTWIN_UNIFIED_SEED_v8.sql';
  RAISE NOTICE '  2. NEURALTWIN_v8.3_unified_products_furniture.sql';
  RAISE NOTICE '  3. MVP_MODEL_URL_UPDATE.sql';
  RAISE NOTICE '';
END $$;
