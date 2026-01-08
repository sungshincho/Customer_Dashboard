-- ═══════════════════════════════════════════════════════════════════════════════
-- NEURALTWIN v8.6 SEED_06_AGGREGATES_DERIVED.sql
-- L2 팩트 테이블에서 L3 집계 테이블 파생
--
-- 핵심 변경: 랜덤 값 대신 SEED_04의 실제 데이터에서 집계
-- 이를 통해 인사이트 허브 전체 탭의 데이터 일관성 보장
--
-- 실행 순서: SEED_00 → SEED_01 → SEED_02 → SEED_03 → SEED_04 → SEED_05 → SEED_06
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: 기존 집계 데이터 삭제 (Idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE org_name ILIKE '%TCAG%' OR org_name ILIKE '%MVP%' LIMIT 1;
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
  END IF;

  SELECT id INTO v_store_id FROM stores WHERE org_id = v_org_id LIMIT 1;
  IF v_store_id IS NULL THEN
    SELECT id INTO v_store_id FROM stores LIMIT 1;
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_06 DERIVED: L2 → L3 집계 변환 시작';
  RAISE NOTICE 'org_id: %, store_id: %', v_org_id, v_store_id;
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제 (해당 store/org만)
  RAISE NOTICE '[CLEANUP] 기존 집계 데이터 삭제 중...';

  DELETE FROM daily_kpis_agg WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM daily_sales WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM hourly_metrics WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM zone_daily_metrics WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM product_performance_agg WHERE org_id = v_org_id AND store_id = v_store_id;
  DELETE FROM customer_segments_agg WHERE org_id = v_org_id AND store_id = v_store_id;

  RAISE NOTICE '[CLEANUP] 완료';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: daily_kpis_agg - funnel_events + transactions에서 파생
-- 개요/예측 탭 핵심 데이터
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 2] daily_kpis_agg 생성 중 (funnel_events + transactions 기반)...';

  -- funnel_events에서 방문자/퍼널 데이터 집계
  -- transactions에서 매출/거래 데이터 집계
  INSERT INTO daily_kpis_agg (
    org_id, store_id, date,
    total_visitors, unique_visitors, returning_visitors,
    avg_visit_duration_seconds,
    total_transactions, total_revenue, total_units_sold,
    avg_basket_size, avg_transaction_value,
    conversion_rate, browse_to_engage_rate, engage_to_purchase_rate,
    sales_per_sqm, sales_per_visitor,
    labor_hours, sales_per_labor_hour,
    calculated_at, metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    fe.event_date,
    -- total_visitors: entry 이벤트 수 (퍼널 entry와 일치)
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) as total_visitors,
    -- unique_visitors: DISTINCT customer_id (entry 이벤트만)
    COALESCE(COUNT(DISTINCT CASE WHEN fe.event_type = 'entry' THEN fe.customer_id END), 0) as unique_visitors,
    -- returning_visitors: unique의 25% (음수 방지를 위한 고정 비율)
    FLOOR(COALESCE(COUNT(DISTINCT CASE WHEN fe.event_type = 'entry' THEN fe.customer_id END), 0) * 0.25) as returning_visitors,
    -- avg_visit_duration: 가중 평균 (10~40분 범위 = 600~2400초)
    900 + FLOOR(RANDOM() * 600) as avg_visit_duration_seconds,
    -- total_transactions: purchase 이벤트 수 (퍼널 purchase와 일치)
    COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) as total_transactions,
    -- total_revenue: transactions 테이블에서 조회
    COALESCE(tx.total_revenue, 0) as total_revenue,
    -- total_units_sold: line_items에서 조회
    COALESCE(li.total_units, 0) as total_units_sold,
    -- avg_basket_size
    CASE
      WHEN COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) > 0
      THEN ROUND(COALESCE(li.total_units, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 2)
      ELSE 0
    END as avg_basket_size,
    -- avg_transaction_value
    CASE
      WHEN COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) > 0
      THEN ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0)
      ELSE 0
    END as avg_transaction_value,
    -- conversion_rate: purchase / entry * 100 (퍼널 전환율과 동일)
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END as conversion_rate,
    -- browse_to_engage_rate: engage / browse * 100
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'browse' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'browse' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END as browse_to_engage_rate,
    -- engage_to_purchase_rate: purchase / engage * 100
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'engage' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END as engage_to_purchase_rate,
    -- sales_per_sqm (가정: 500㎡)
    ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / 500, 0) as sales_per_sqm,
    -- sales_per_visitor
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0)
      ELSE 0
    END as sales_per_visitor,
    -- labor_hours (고정: 8명 × 8시간)
    64 as labor_hours,
    -- sales_per_labor_hour
    ROUND(COALESCE(tx.total_revenue, 0)::NUMERIC / 64, 0) as sales_per_labor_hour,
    NOW() as calculated_at,
    jsonb_build_object(
      'source', 'SEED_06_DERIVED',
      'version', 'v8.6',
      'derived_from', 'funnel_events + transactions + line_items'
    ) as metadata
  FROM funnel_events fe
  LEFT JOIN (
    -- 일별 매출 집계 (transactions)
    SELECT
      transaction_datetime::date as tx_date,
      SUM(total_amount) as total_revenue
    FROM transactions
    WHERE store_id = v_store_id
    GROUP BY transaction_datetime::date
  ) tx ON tx.tx_date = fe.event_date
  LEFT JOIN (
    -- 일별 판매 수량 집계 (line_items)
    SELECT
      transaction_date,
      SUM(quantity) as total_units
    FROM line_items
    WHERE store_id = v_store_id
    GROUP BY transaction_date
  ) li ON li.transaction_date = fe.event_date
  WHERE fe.store_id = v_store_id
  GROUP BY fe.event_date, tx.total_revenue, li.total_units
  ORDER BY fe.event_date;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[STEP 2] daily_kpis_agg 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: daily_sales - transactions에서 직접 파생
-- 상품 탭 매출 추이
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 3] daily_sales 생성 중 (transactions 기반)...';

  INSERT INTO daily_sales (
    org_id, store_id, date,
    total_revenue, total_transactions,
    avg_transaction_value, total_customers,
    metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    t.transaction_datetime::date as sale_date,
    SUM(t.total_amount) as total_revenue,
    COUNT(*) as total_transactions,
    ROUND(AVG(t.total_amount), 0) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as total_customers,
    jsonb_build_object(
      'source', 'SEED_06_DERIVED',
      'version', 'v8.6',
      'derived_from', 'transactions'
    ) as metadata
  FROM transactions t
  WHERE t.store_id = v_store_id
  GROUP BY t.transaction_datetime::date
  ORDER BY sale_date;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[STEP 3] daily_sales 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: hourly_metrics - funnel_events.event_hour에서 파생
-- 매장 탭 시간대별 차트
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 4] hourly_metrics 생성 중 (funnel_events + transactions 기반)...';

  INSERT INTO hourly_metrics (
    org_id, store_id, date, hour,
    visitor_count, entry_count, exit_count,
    transaction_count, revenue, units_sold,
    avg_occupancy, peak_occupancy, conversion_rate,
    calculated_at, metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    fe.event_date,
    fe.event_hour,
    -- visitor_count = entry_count (시간대별 입장 수)
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) as visitor_count,
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) as entry_count,
    -- exit_count: entry의 95%
    FLOOR(COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) * 0.95) as exit_count,
    -- transaction_count: 해당 시간대 purchase 수
    COALESCE(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END), 0) as transaction_count,
    -- revenue: transactions에서 해당 시간대 매출
    COALESCE(tx.hourly_revenue, 0) as revenue,
    -- units_sold: line_items에서 해당 시간대 판매 수량
    COALESCE(li.hourly_units, 0) as units_sold,
    -- avg_occupancy
    FLOOR(COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) * 0.6) as avg_occupancy,
    -- peak_occupancy
    COALESCE(SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END), 0) + FLOOR(RANDOM() * 5) as peak_occupancy,
    -- conversion_rate
    CASE
      WHEN SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(CASE WHEN fe.event_type = 'purchase' THEN 1 ELSE 0 END)::NUMERIC /
                 SUM(CASE WHEN fe.event_type = 'entry' THEN 1 ELSE 0 END) * 100, 2)
      ELSE 0
    END as conversion_rate,
    NOW() as calculated_at,
    jsonb_build_object(
      'source', 'SEED_06_DERIVED',
      'version', 'v8.6',
      'derived_from', 'funnel_events + transactions + line_items'
    ) as metadata
  FROM funnel_events fe
  LEFT JOIN (
    -- 시간대별 매출 (transactions)
    SELECT
      transaction_datetime::date as tx_date,
      EXTRACT(HOUR FROM transaction_datetime)::INT as tx_hour,
      SUM(total_amount) as hourly_revenue
    FROM transactions
    WHERE store_id = v_store_id
    GROUP BY transaction_datetime::date, EXTRACT(HOUR FROM transaction_datetime)
  ) tx ON tx.tx_date = fe.event_date AND tx.tx_hour = fe.event_hour
  LEFT JOIN (
    -- 시간대별 판매 수량 (line_items)
    SELECT
      transaction_date,
      transaction_hour,
      SUM(quantity) as hourly_units
    FROM line_items
    WHERE store_id = v_store_id
    GROUP BY transaction_date, transaction_hour
  ) li ON li.transaction_date = fe.event_date AND li.transaction_hour = fe.event_hour
  WHERE fe.store_id = v_store_id
    AND fe.event_hour IS NOT NULL
  GROUP BY fe.event_date, fe.event_hour, tx.hourly_revenue, li.hourly_units
  ORDER BY fe.event_date, fe.event_hour;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[STEP 4] hourly_metrics 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: zone_daily_metrics - zone_events에서 파생
-- 매장 탭 존별 성과
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 5] zone_daily_metrics 생성 중 (zone_events 기반)...';

  INSERT INTO zone_daily_metrics (
    org_id, store_id, zone_id, date,
    total_visitors, unique_visitors,
    entry_count, exit_count,
    avg_dwell_seconds, total_dwell_seconds,
    interaction_count, conversion_count,
    revenue_attributed, heatmap_intensity,
    peak_hour, peak_occupancy,
    calculated_at, metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    ze.zone_id,
    ze.event_date,
    -- total_visitors: enter 이벤트 수
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) as total_visitors,
    -- unique_visitors: DISTINCT customer_id
    COALESCE(COUNT(DISTINCT CASE WHEN ze.event_type = 'enter' THEN ze.customer_id END), 0) as unique_visitors,
    -- entry_count
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) as entry_count,
    -- exit_count
    COALESCE(SUM(CASE WHEN ze.event_type = 'exit' THEN 1 ELSE 0 END), 0) as exit_count,
    -- avg_dwell_seconds: dwell 이벤트의 duration_seconds 평균
    COALESCE(AVG(CASE WHEN ze.event_type = 'dwell' THEN ze.duration_seconds END), 0) as avg_dwell_seconds,
    -- total_dwell_seconds: dwell 이벤트의 duration_seconds 합계
    COALESCE(SUM(CASE WHEN ze.event_type = 'dwell' THEN ze.duration_seconds ELSE 0 END), 0) as total_dwell_seconds,
    -- interaction_count: 방문자의 30~60%
    FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (0.3 + RANDOM() * 0.3)) as interaction_count,
    -- conversion_count: zones_dim의 zone_type 기반 추정
    CASE
      WHEN zd.zone_type IN ('product_display', 'checkout', 'fitting_room')
      THEN FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (0.2 + RANDOM() * 0.15))
      ELSE FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * 0.05)
    END as conversion_count,
    -- revenue_attributed: checkout/display 존만 매출 귀속
    CASE
      WHEN zd.zone_type IN ('product_display', 'checkout')
      THEN FLOOR(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) * (50000 + RANDOM() * 30000))
      ELSE 0
    END as revenue_attributed,
    -- heatmap_intensity: 방문자 수 기반
    ROUND(COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0)::NUMERIC / 100, 2) as heatmap_intensity,
    -- peak_hour: 13~20시 범위
    13 + FLOOR(RANDOM() * 8) as peak_hour,
    -- peak_occupancy
    COALESCE(SUM(CASE WHEN ze.event_type = 'enter' THEN 1 ELSE 0 END), 0) + FLOOR(RANDOM() * 10) as peak_occupancy,
    NOW() as calculated_at,
    jsonb_build_object(
      'source', 'SEED_06_DERIVED',
      'version', 'v8.6',
      'derived_from', 'zone_events',
      'zone_code', zd.zone_code
    ) as metadata
  FROM zone_events ze
  JOIN zones_dim zd ON zd.id = ze.zone_id
  WHERE ze.store_id = v_store_id
  GROUP BY ze.zone_id, ze.event_date, zd.zone_type, zd.zone_code
  ORDER BY ze.event_date, ze.zone_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[STEP 5] zone_daily_metrics 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: product_performance_agg - line_items에서 파생
-- 상품 탭 핵심 데이터
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 6] product_performance_agg 생성 중 (line_items + products 기반)...';

  INSERT INTO product_performance_agg (
    org_id, store_id, product_id, date,
    units_sold, revenue, transactions,
    conversion_rate, avg_selling_price,
    discount_rate, return_rate,
    stock_level, stockout_hours,
    category_rank, store_rank,
    calculated_at, metadata
  )
  SELECT
    v_org_id,
    v_store_id,
    li.product_id,
    li.transaction_date,
    -- units_sold: quantity 합계
    COALESCE(SUM(li.quantity), 0) as units_sold,
    -- revenue: line_total 합계
    COALESCE(SUM(li.line_total), 0) as revenue,
    -- transactions: DISTINCT transaction_id 수
    COUNT(DISTINCT li.transaction_id) as transactions,
    -- conversion_rate: 추정 (2~17%)
    ROUND(((RANDOM() * 0.15 + 0.02) * 100)::NUMERIC, 2) as conversion_rate,
    -- avg_selling_price: 평균 단가
    CASE
      WHEN SUM(li.quantity) > 0
      THEN ROUND(SUM(li.line_total)::NUMERIC / SUM(li.quantity), 0)
      ELSE 0
    END as avg_selling_price,
    -- discount_rate: 추정 (0~20%)
    ROUND((RANDOM() * 0.2)::NUMERIC, 2) as discount_rate,
    -- return_rate: 추정 (0~5%)
    ROUND((RANDOM() * 0.05)::NUMERIC, 3) as return_rate,
    -- stock_level: products 테이블에서 조회 또는 추정
    COALESCE(p.stock, 50 + FLOOR(RANDOM() * 100)::INT) as stock_level,
    -- stockout_hours: 5% 확률로 품절
    CASE WHEN RANDOM() < 0.05 THEN FLOOR(RANDOM() * 4) ELSE 0 END as stockout_hours,
    -- category_rank: products 테이블 기준 (임시)
    ROW_NUMBER() OVER (PARTITION BY li.transaction_date, p.category ORDER BY SUM(li.line_total) DESC) as category_rank,
    -- store_rank
    ROW_NUMBER() OVER (PARTITION BY li.transaction_date ORDER BY SUM(li.line_total) DESC) as store_rank,
    NOW() as calculated_at,
    jsonb_build_object(
      'source', 'SEED_06_DERIVED',
      'version', 'v8.6',
      'derived_from', 'line_items + products',
      'product_name', p.product_name,
      'category', p.category
    ) as metadata
  FROM line_items li
  JOIN products p ON p.id = li.product_id
  WHERE li.store_id = v_store_id
    AND li.product_id IS NOT NULL
  GROUP BY li.product_id, li.transaction_date, p.stock, p.product_name, p.category
  ORDER BY li.transaction_date, revenue DESC;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[STEP 6] product_performance_agg 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: customer_segments_agg - transactions에서 파생
-- 고객 탭 세그먼트 분석
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_date DATE;
  v_segment TEXT;
  v_segments TEXT[] := ARRAY['VIP', 'Regular', 'New', 'Dormant'];
  v_count INTEGER := 0;
  v_seg_data RECORD;
BEGIN
  SELECT s.org_id, s.id INTO v_org_id, v_store_id
  FROM stores s LIMIT 1;

  RAISE NOTICE '[STEP 7] customer_segments_agg 생성 중 (transactions 기반)...';

  -- 각 날짜에 대해 세그먼트 데이터 생성
  FOR v_date IN
    SELECT DISTINCT transaction_datetime::date
    FROM transactions
    WHERE store_id = v_store_id
    ORDER BY 1
  LOOP
    -- 해당 날짜의 거래 통계 가져오기
    SELECT
      COUNT(DISTINCT customer_id) as total_customers,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_txn
    INTO v_seg_data
    FROM transactions
    WHERE store_id = v_store_id
      AND transaction_datetime::date = v_date;

    -- 각 세그먼트에 대해 데이터 삽입
    FOREACH v_segment IN ARRAY v_segments LOOP
      INSERT INTO customer_segments_agg (
        org_id, store_id, date,
        segment_type, segment_name,
        customer_count, total_revenue,
        avg_transaction_value, visit_frequency,
        avg_basket_size, churn_risk_score, ltv_estimate,
        metadata, calculated_at
      )
      SELECT
        v_org_id,
        v_store_id,
        v_date,
        'customer_tier',
        v_segment,
        -- 세그먼트별 고객 수 (VIP 15%, Regular 40%, New 30%, Dormant 15%)
        CASE v_segment
          WHEN 'VIP' THEN FLOOR(COALESCE(v_seg_data.total_customers, 0) * 0.15) + FLOOR(RANDOM() * 5)
          WHEN 'Regular' THEN FLOOR(COALESCE(v_seg_data.total_customers, 0) * 0.40) + FLOOR(RANDOM() * 10)
          WHEN 'New' THEN FLOOR(COALESCE(v_seg_data.total_customers, 0) * 0.30) + FLOOR(RANDOM() * 8)
          WHEN 'Dormant' THEN FLOOR(COALESCE(v_seg_data.total_customers, 0) * 0.15) + FLOOR(RANDOM() * 5)
        END as customer_count,
        -- 세그먼트별 매출 (VIP가 높은 비중)
        CASE v_segment
          WHEN 'VIP' THEN FLOOR(COALESCE(v_seg_data.total_revenue, 0) * 0.45)
          WHEN 'Regular' THEN FLOOR(COALESCE(v_seg_data.total_revenue, 0) * 0.35)
          WHEN 'New' THEN FLOOR(COALESCE(v_seg_data.total_revenue, 0) * 0.15)
          WHEN 'Dormant' THEN FLOOR(COALESCE(v_seg_data.total_revenue, 0) * 0.05)
        END as total_revenue,
        -- avg_transaction_value
        CASE v_segment
          WHEN 'VIP' THEN COALESCE(v_seg_data.avg_txn, 100000) * 1.8
          WHEN 'Regular' THEN COALESCE(v_seg_data.avg_txn, 100000) * 1.0
          WHEN 'New' THEN COALESCE(v_seg_data.avg_txn, 100000) * 0.7
          WHEN 'Dormant' THEN COALESCE(v_seg_data.avg_txn, 100000) * 0.5
        END as avg_transaction_value,
        -- visit_frequency (월별)
        CASE v_segment
          WHEN 'VIP' THEN 3.5 + RANDOM() * 1.5
          WHEN 'Regular' THEN 2.0 + RANDOM()
          WHEN 'New' THEN 1.0 + RANDOM() * 0.5
          WHEN 'Dormant' THEN 0.2 + RANDOM() * 0.3
        END as visit_frequency,
        -- avg_basket_size
        CASE v_segment
          WHEN 'VIP' THEN 2.5 + RANDOM()
          WHEN 'Regular' THEN 1.8 + RANDOM() * 0.5
          WHEN 'New' THEN 1.3 + RANDOM() * 0.4
          WHEN 'Dormant' THEN 1.1 + RANDOM() * 0.2
        END as avg_basket_size,
        -- churn_risk_score
        CASE v_segment
          WHEN 'VIP' THEN 0.05 + RANDOM() * 0.05
          WHEN 'Regular' THEN 0.15 + RANDOM() * 0.1
          WHEN 'New' THEN 0.30 + RANDOM() * 0.15
          WHEN 'Dormant' THEN 0.60 + RANDOM() * 0.2
        END as churn_risk_score,
        -- ltv_estimate
        CASE v_segment
          WHEN 'VIP' THEN 5000000 + FLOOR(RANDOM() * 2000000)
          WHEN 'Regular' THEN 2000000 + FLOOR(RANDOM() * 800000)
          WHEN 'New' THEN 800000 + FLOOR(RANDOM() * 400000)
          WHEN 'Dormant' THEN 200000 + FLOOR(RANDOM() * 150000)
        END as ltv_estimate,
        jsonb_build_object(
          'source', 'SEED_06_DERIVED',
          'version', 'v8.6',
          'derived_from', 'transactions',
          'segment', v_segment,
          'tier_rank', CASE v_segment
            WHEN 'VIP' THEN 1
            WHEN 'Regular' THEN 2
            WHEN 'New' THEN 3
            WHEN 'Dormant' THEN 4
          END
        ) as metadata,
        NOW() as calculated_at;

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '[STEP 7] customer_segments_agg 완료: % 건 삽입', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: 데이터 정합성 검증
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_funnel_entry INT;
  v_kpi_visitors INT;
  v_funnel_purchase INT;
  v_kpi_transactions INT;
  v_tx_revenue NUMERIC;
  v_kpi_revenue NUMERIC;
  v_li_units INT;
  v_kpi_units INT;
  r RECORD;  -- ✅ 추가: RECORD 변수 선언
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '[STEP 8] 데이터 정합성 검증';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- 1. funnel_events entry vs daily_kpis_agg total_visitors
  SELECT COUNT(*) INTO v_funnel_entry
  FROM funnel_events WHERE event_type = 'entry';

  SELECT SUM(total_visitors) INTO v_kpi_visitors
  FROM daily_kpis_agg;

  IF v_funnel_entry = v_kpi_visitors THEN
    RAISE NOTICE '  ✓ funnel_events.entry = daily_kpis_agg.total_visitors: % = % ✓', v_funnel_entry, v_kpi_visitors;
  ELSE
    RAISE WARNING '  ✗ funnel_events.entry ≠ daily_kpis_agg.total_visitors: % ≠ %', v_funnel_entry, v_kpi_visitors;
  END IF;

  -- 2. funnel_events purchase vs daily_kpis_agg total_transactions
  SELECT COUNT(*) INTO v_funnel_purchase
  FROM funnel_events WHERE event_type = 'purchase';

  SELECT SUM(total_transactions) INTO v_kpi_transactions
  FROM daily_kpis_agg;

  IF v_funnel_purchase = v_kpi_transactions THEN
    RAISE NOTICE '  ✓ funnel_events.purchase = daily_kpis_agg.total_transactions: % = % ✓', v_funnel_purchase, v_kpi_transactions;
  ELSE
    RAISE WARNING '  ✗ funnel_events.purchase ≠ daily_kpis_agg.total_transactions: % ≠ %', v_funnel_purchase, v_kpi_transactions;
  END IF;

  -- 3. transactions.total_amount vs daily_kpis_agg.total_revenue
  SELECT SUM(total_amount) INTO v_tx_revenue
  FROM transactions;

  SELECT SUM(total_revenue) INTO v_kpi_revenue
  FROM daily_kpis_agg;

  IF ABS(v_tx_revenue - v_kpi_revenue) < 1 THEN
    RAISE NOTICE '  ✓ transactions.total_amount = daily_kpis_agg.total_revenue: % = % ✓', v_tx_revenue, v_kpi_revenue;
  ELSE
    RAISE WARNING '  ✗ transactions.total_amount ≠ daily_kpis_agg.total_revenue: % ≠ %', v_tx_revenue, v_kpi_revenue;
  END IF;

  -- 4. line_items.quantity vs daily_kpis_agg.total_units_sold
  SELECT SUM(quantity) INTO v_li_units
  FROM line_items;

  SELECT SUM(total_units_sold) INTO v_kpi_units
  FROM daily_kpis_agg;

  IF v_li_units = v_kpi_units THEN
    RAISE NOTICE '  ✓ line_items.quantity = daily_kpis_agg.total_units_sold: % = % ✓', v_li_units, v_kpi_units;
  ELSE
    RAISE WARNING '  ✗ line_items.quantity ≠ daily_kpis_agg.total_units_sold: % ≠ %', v_li_units, v_kpi_units;
  END IF;

  -- 5. 일별 샘플 검증 (최근 3일)
  RAISE NOTICE '';
  RAISE NOTICE '  [일별 샘플 검증 - 최근 3일]';

  FOR r IN
    SELECT
      fe.event_date,
      COUNT(*) FILTER (WHERE fe.event_type = 'entry') as funnel_entry,
      COALESCE(dka.total_visitors, 0) as kpi_visitors,
      COUNT(*) FILTER (WHERE fe.event_type = 'purchase') as funnel_purchase,
      COALESCE(dka.total_transactions, 0) as kpi_transactions
    FROM funnel_events fe
    LEFT JOIN daily_kpis_agg dka ON dka.date = fe.event_date
    GROUP BY fe.event_date, dka.total_visitors, dka.total_transactions
    ORDER BY fe.event_date DESC
    LIMIT 3
  LOOP
    RAISE NOTICE '    % | entry: %=%, purchase: %=%',
      r.event_date, r.funnel_entry, r.kpi_visitors, r.funnel_purchase, r.kpi_transactions;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_06 DERIVED: 완료';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 검증 쿼리 (참고용)
-- ═══════════════════════════════════════════════════════════════════════════════

/*
-- 1. 개요 탭: KPI 카드 vs 퍼널 차트 일치 확인
SELECT
  'daily_kpis_agg' as source,
  SUM(total_visitors) as visitors,
  SUM(total_transactions) as transactions,
  SUM(total_revenue) as revenue
FROM daily_kpis_agg
UNION ALL
SELECT
  'funnel_events' as source,
  COUNT(*) FILTER (WHERE event_type = 'entry'),
  COUNT(*) FILTER (WHERE event_type = 'purchase'),
  NULL
FROM funnel_events;

-- 2. 상품 탭: 매출 일치 확인
SELECT
  'product_performance_agg' as source,
  SUM(revenue) as total_revenue,
  SUM(units_sold) as total_units
FROM product_performance_agg
UNION ALL
SELECT
  'line_items' as source,
  SUM(line_total),
  SUM(quantity)
FROM line_items;

-- 3. 매장 탭: 시간대별 방문자 일치 확인 (일별)
SELECT
  hm.date,
  SUM(hm.visitor_count) as hourly_total,
  fe.funnel_entry
FROM hourly_metrics hm
JOIN (
  SELECT event_date, COUNT(*) FILTER (WHERE event_type = 'entry') as funnel_entry
  FROM funnel_events
  GROUP BY event_date
) fe ON fe.event_date = hm.date
GROUP BY hm.date, fe.funnel_entry
ORDER BY hm.date DESC
LIMIT 5;
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of SEED_06_AGGREGATES_DERIVED.sql
-- ═══════════════════════════════════════════════════════════════════════════════
