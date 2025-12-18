-- ═══════════════════════════════════════════════════════════════════════════════
-- NEURALTWIN v8.6 SEED_06_AGGREGATES.sql
-- 집계 데이터 + 검증 쿼리
-- 실행 순서: SEED_00 → SEED_01 → SEED_02 → SEED_03 → SEED_04 → SEED_05 → SEED_06
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 공통 변수 설정
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_org_id UUID;
  v_store_id UUID;
  v_user_id UUID;
  v_current_date DATE := CURRENT_DATE;
  v_start_date DATE;
  v_day_offset INTEGER;
  v_hour INTEGER;
  v_zone_id UUID;
  v_zone_code TEXT;
  v_product_id UUID;
  v_segment TEXT;

  -- 집계 메트릭 변수
  v_daily_visitors INTEGER;
  v_daily_transactions INTEGER;
  v_daily_revenue NUMERIC;
  v_daily_units INTEGER;

  -- 배열 변수
  v_zones UUID[];
  v_zone_codes TEXT[] := ARRAY['Z001','Z002','Z003','Z004','Z005','Z006','Z007'];
  v_products UUID[];
  v_segments TEXT[] := ARRAY['VIP','Regular','New','Dormant'];

BEGIN
  -- 기준 ID 조회
  SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%NeuralTwin%' OR name ILIKE '%MVP%' LIMIT 1;
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
  END IF;

  SELECT id INTO v_store_id FROM stores WHERE org_id = v_org_id LIMIT 1;
  IF v_store_id IS NULL THEN
    SELECT id INTO v_store_id FROM stores LIMIT 1;
  END IF;

  SELECT user_id INTO v_user_id FROM customers WHERE store_id = v_store_id LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
  END IF;

  -- 시작 날짜 (90일 전)
  v_start_date := v_current_date - INTERVAL '90 days';

  -- zones_dim ID 배열 가져오기
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zones
  FROM zones_dim
  WHERE store_id = v_store_id;

  -- products ID 배열 가져오기 (25개)
  SELECT ARRAY_AGG(id ORDER BY sku) INTO v_products
  FROM products
  WHERE store_id = v_store_id
  LIMIT 25;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_06_AGGREGATES: 집계 데이터 시딩 시작';
  RAISE NOTICE 'org_id: %, store_id: %', v_org_id, v_store_id;
  RAISE NOTICE 'Date Range: % ~ %', v_start_date, v_current_date;
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 13.1: daily_kpis_agg (90일 KPI)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 13.1] daily_kpis_agg 시딩 시작 (90건)';

  FOR v_day_offset IN 0..89 LOOP
    -- 일별 기본 메트릭 계산 (요일별 변동)
    v_daily_visitors := 70 + (v_day_offset % 7) * 5 + FLOOR(RANDOM() * 30);
    v_daily_transactions := FLOOR(v_daily_visitors * (0.45 + RANDOM() * 0.15));
    v_daily_revenue := v_daily_transactions * (85000 + FLOOR(RANDOM() * 50000));
    v_daily_units := v_daily_transactions * (1 + FLOOR(RANDOM() * 2));

    INSERT INTO daily_kpis_agg (
      org_id, store_id, date,
      total_visitors, unique_visitors, returning_visitors,
      avg_visit_duration_seconds,
      total_transactions, total_revenue, total_units_sold,
      avg_basket_size, avg_transaction_value,
      conversion_rate, browse_to_engage_rate, engage_to_purchase_rate,
      sales_per_sqm, sales_per_visitor,
      labor_hours, sales_per_labor_hour,
      weather_condition, temperature, is_holiday, special_event,
      calculated_at, metadata
    ) VALUES (
      v_org_id, v_store_id, v_start_date + (v_day_offset || ' days')::INTERVAL,
      v_daily_visitors,
      FLOOR(v_daily_visitors * 0.85),
      FLOOR(v_daily_visitors * 0.25),
      (900 + FLOOR(RANDOM() * 600))::INTEGER,
      v_daily_transactions,
      v_daily_revenue,
      v_daily_units,
      ROUND((v_daily_units::NUMERIC / NULLIF(v_daily_transactions, 0)), 2),
      ROUND((v_daily_revenue / NULLIF(v_daily_transactions, 0)), 0),
      ROUND((v_daily_transactions::NUMERIC / NULLIF(v_daily_visitors, 0)) * 100, 2),
      ROUND(55 + RANDOM() * 20, 2),
      ROUND(35 + RANDOM() * 25, 2),
      ROUND(v_daily_revenue / 500, 0),
      ROUND(v_daily_revenue / NULLIF(v_daily_visitors, 0), 0),
      64,
      ROUND(v_daily_revenue / 64, 0),
      CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN 'sunny'
        WHEN 1 THEN 'cloudy'
        WHEN 2 THEN 'rainy'
        ELSE 'clear'
      END,
      ROUND(-5 + RANDOM() * 30, 1),
      CASE WHEN v_day_offset % 7 IN (5, 6) THEN FALSE ELSE FALSE END,
      CASE
        WHEN v_day_offset = 30 THEN 'Black Friday'
        WHEN v_day_offset = 60 THEN 'Holiday Sale'
        ELSE NULL
      END,
      NOW(),
      jsonb_build_object(
        'source', 'seed_script',
        'version', 'v8.6',
        'day_type', CASE WHEN v_day_offset % 7 IN (5, 6) THEN 'weekend' ELSE 'weekday' END
      )
    );
  END LOOP;

  RAISE NOTICE '[STEP 13.1] daily_kpis_agg 완료: 90건 삽입';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 13.2: daily_sales (90일 매출)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 13.2] daily_sales 시딩 시작 (90건)';

  FOR v_day_offset IN 0..89 LOOP
    v_daily_transactions := 35 + FLOOR(RANDOM() * 20);
    v_daily_revenue := v_daily_transactions * (75000 + FLOOR(RANDOM() * 60000));

    INSERT INTO daily_sales (
      org_id, store_id, date,
      total_revenue, total_transactions,
      avg_transaction_value, total_customers,
      metadata
    ) VALUES (
      v_org_id, v_store_id, v_start_date + (v_day_offset || ' days')::INTERVAL,
      v_daily_revenue,
      v_daily_transactions,
      ROUND(v_daily_revenue / NULLIF(v_daily_transactions, 0), 0),
      FLOOR(v_daily_transactions * 0.9),
      jsonb_build_object(
        'source', 'seed_script',
        'version', 'v8.6'
      )
    );
  END LOOP;

  RAISE NOTICE '[STEP 13.2] daily_sales 완료: 90건 삽입';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 13.3: hourly_metrics (90일 × 12시간 = 1,080건)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 13.3] hourly_metrics 시딩 시작 (1,080건)';

  FOR v_day_offset IN 0..89 LOOP
    FOR v_hour IN 10..21 LOOP  -- 영업시간: 10:00 ~ 21:00 (12시간)
      -- 시간대별 방문자 분포 (피크타임: 13~14시, 18~19시)
      DECLARE
        v_hour_visitors INTEGER;
        v_hour_transactions INTEGER;
        v_hour_revenue NUMERIC;
      BEGIN
        v_hour_visitors := CASE
          WHEN v_hour IN (13, 14, 18, 19) THEN 12 + FLOOR(RANDOM() * 8)  -- 피크
          WHEN v_hour IN (11, 12, 17, 20) THEN 8 + FLOOR(RANDOM() * 6)   -- 준피크
          ELSE 4 + FLOOR(RANDOM() * 4)  -- 비피크
        END;
        v_hour_transactions := FLOOR(v_hour_visitors * (0.4 + RANDOM() * 0.2));
        v_hour_revenue := v_hour_transactions * (70000 + FLOOR(RANDOM() * 50000));

        INSERT INTO hourly_metrics (
          org_id, store_id, date, hour,
          visitor_count, entry_count, exit_count,
          transaction_count, revenue, units_sold,
          avg_occupancy, peak_occupancy, conversion_rate,
          calculated_at, metadata
        ) VALUES (
          v_org_id, v_store_id, v_start_date + (v_day_offset || ' days')::INTERVAL, v_hour,
          v_hour_visitors,
          v_hour_visitors,
          FLOOR(v_hour_visitors * 0.95),
          v_hour_transactions,
          v_hour_revenue,
          v_hour_transactions + FLOOR(RANDOM() * 3),
          FLOOR(v_hour_visitors * 0.6),
          v_hour_visitors + FLOOR(RANDOM() * 5),
          ROUND((v_hour_transactions::NUMERIC / NULLIF(v_hour_visitors, 0)) * 100, 2),
          NOW(),
          jsonb_build_object(
            'hour_type', CASE
              WHEN v_hour IN (13, 14, 18, 19) THEN 'peak'
              WHEN v_hour IN (11, 12, 17, 20) THEN 'semi_peak'
              ELSE 'off_peak'
            END,
            'source', 'seed_script'
          )
        );
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE '[STEP 13.3] hourly_metrics 완료: 1,080건 삽입';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 14.1: zone_daily_metrics (90일 × 7존 = 630건)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 14.1] zone_daily_metrics 시딩 시작 (630건)';

  IF v_zones IS NOT NULL AND array_length(v_zones, 1) >= 7 THEN
    FOR v_day_offset IN 0..89 LOOP
      FOR i IN 1..7 LOOP
        v_zone_id := v_zones[i];
        v_zone_code := v_zone_codes[i];

        -- 존별 방문자 분포
        DECLARE
          v_zone_visitors INTEGER;
          v_zone_dwell INTEGER;
        BEGIN
          v_zone_visitors := CASE v_zone_code
            WHEN 'Z001' THEN 80 + FLOOR(RANDOM() * 20)   -- 입구 (높은 트래픽)
            WHEN 'Z002' THEN 65 + FLOOR(RANDOM() * 15)   -- 메인홀
            WHEN 'Z003' THEN 45 + FLOOR(RANDOM() * 15)   -- 의류존
            WHEN 'Z004' THEN 30 + FLOOR(RANDOM() * 10)   -- 악세서리존
            WHEN 'Z005' THEN 15 + FLOOR(RANDOM() * 8)    -- 피팅룸
            WHEN 'Z006' THEN 40 + FLOOR(RANDOM() * 10)   -- 계산대
            WHEN 'Z007' THEN 20 + FLOOR(RANDOM() * 10)   -- 라운지
            ELSE 30 + FLOOR(RANDOM() * 15)
          END;

          v_zone_dwell := CASE v_zone_code
            WHEN 'Z001' THEN 60 + FLOOR(RANDOM() * 30)   -- 입구 (짧은 체류)
            WHEN 'Z002' THEN 180 + FLOOR(RANDOM() * 60)  -- 메인홀
            WHEN 'Z003' THEN 300 + FLOOR(RANDOM() * 120) -- 의류존 (긴 체류)
            WHEN 'Z004' THEN 180 + FLOOR(RANDOM() * 90)  -- 악세서리존
            WHEN 'Z005' THEN 360 + FLOOR(RANDOM() * 180) -- 피팅룸 (가장 긴 체류)
            WHEN 'Z006' THEN 120 + FLOOR(RANDOM() * 60)  -- 계산대
            WHEN 'Z007' THEN 240 + FLOOR(RANDOM() * 120) -- 라운지
            ELSE 180 + FLOOR(RANDOM() * 90)
          END;

          INSERT INTO zone_daily_metrics (
            org_id, store_id, zone_id, date,
            total_visitors, unique_visitors,
            entry_count, exit_count,
            avg_dwell_seconds, total_dwell_seconds,
            interaction_count, conversion_count,
            revenue_attributed, heatmap_intensity,
            peak_hour, peak_occupancy,
            calculated_at, metadata
          ) VALUES (
            v_org_id, v_store_id, v_zone_id, v_start_date + (v_day_offset || ' days')::INTERVAL,
            v_zone_visitors,
            FLOOR(v_zone_visitors * 0.85),
            v_zone_visitors,
            FLOOR(v_zone_visitors * 0.95),
            v_zone_dwell,
            v_zone_dwell * v_zone_visitors,
            FLOOR(v_zone_visitors * (0.3 + RANDOM() * 0.3)),
            CASE WHEN v_zone_code IN ('Z003', 'Z004', 'Z006')
              THEN FLOOR(v_zone_visitors * (0.2 + RANDOM() * 0.15))
              ELSE FLOOR(v_zone_visitors * 0.05)
            END,
            CASE WHEN v_zone_code IN ('Z003', 'Z004', 'Z006')
              THEN FLOOR(v_zone_visitors * (50000 + RANDOM() * 30000))
              ELSE 0
            END,
            ROUND(v_zone_visitors::NUMERIC / 100, 2),
            13 + FLOOR(RANDOM() * 8),  -- 피크 시간: 13~20시
            v_zone_visitors + FLOOR(RANDOM() * 10),
            NOW(),
            jsonb_build_object(
              'zone_code', v_zone_code,
              'zone_type', CASE v_zone_code
                WHEN 'Z001' THEN 'entrance'
                WHEN 'Z002' THEN 'main_hall'
                WHEN 'Z003' THEN 'clothing'
                WHEN 'Z004' THEN 'accessory'
                WHEN 'Z005' THEN 'fitting_room'
                WHEN 'Z006' THEN 'checkout'
                WHEN 'Z007' THEN 'lounge'
                ELSE 'other'
              END,
              'source', 'seed_script'
            )
          );
        END;
      END LOOP;
    END LOOP;

    RAISE NOTICE '[STEP 14.1] zone_daily_metrics 완료: 630건 삽입';
  ELSE
    RAISE WARNING '[STEP 14.1] zones_dim 데이터 부족 - zone_daily_metrics 스킵';
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 14.2: product_performance_agg (90일 × 25상품 = 2,250건)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 14.2] product_performance_agg 시딩 시작 (2,250건)';

  IF v_products IS NOT NULL AND array_length(v_products, 1) >= 25 THEN
    FOR v_day_offset IN 0..89 LOOP
      FOR i IN 1..25 LOOP
        v_product_id := v_products[i];

        DECLARE
          v_units_sold INTEGER;
          v_prod_revenue NUMERIC;
          v_avg_price NUMERIC;
        BEGIN
          -- 상품별 판매량 (일부 베스트셀러)
          v_units_sold := CASE
            WHEN i <= 5 THEN 3 + FLOOR(RANDOM() * 5)   -- 베스트셀러
            WHEN i <= 15 THEN 1 + FLOOR(RANDOM() * 3)  -- 일반
            ELSE FLOOR(RANDOM() * 2)                    -- 저판매
          END;

          v_avg_price := CASE
            WHEN i <= 5 THEN 150000 + FLOOR(RANDOM() * 100000)   -- 고가
            WHEN i <= 15 THEN 80000 + FLOOR(RANDOM() * 50000)    -- 중가
            ELSE 30000 + FLOOR(RANDOM() * 30000)                  -- 저가
          END;

          v_prod_revenue := v_units_sold * v_avg_price;

          INSERT INTO product_performance_agg (
            org_id, store_id, product_id, date,
            units_sold, revenue, transactions,
            conversion_rate, avg_selling_price,
            discount_rate, return_rate,
            stock_level, stockout_hours,
            category_rank, store_rank,
            calculated_at, metadata
          ) VALUES (
            v_org_id, v_store_id, v_product_id, v_start_date + (v_day_offset || ' days')::INTERVAL,
            v_units_sold,
            v_prod_revenue,
            GREATEST(1, v_units_sold - FLOOR(RANDOM() * 2)),
            ROUND((RANDOM() * 0.15 + 0.02) * 100, 2),
            v_avg_price,
            ROUND(RANDOM() * 0.2, 2),
            ROUND(RANDOM() * 0.05, 3),
            50 + FLOOR(RANDOM() * 100),
            CASE WHEN RANDOM() < 0.05 THEN FLOOR(RANDOM() * 4) ELSE 0 END,
            i,
            i,
            NOW(),
            jsonb_build_object(
              'product_rank', i,
              'performance_tier', CASE
                WHEN i <= 5 THEN 'top'
                WHEN i <= 15 THEN 'mid'
                ELSE 'low'
              END,
              'source', 'seed_script'
            )
          );
        END;
      END LOOP;
    END LOOP;

    RAISE NOTICE '[STEP 14.2] product_performance_agg 완료: 2,250건 삽입';
  ELSE
    RAISE WARNING '[STEP 14.2] products 데이터 부족 - product_performance_agg 스킵';
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 14.3: customer_segments_agg (90일 × 4세그먼트 = 360건)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '[STEP 14.3] customer_segments_agg 시딩 시작 (360건)';

  FOR v_day_offset IN 0..89 LOOP
    FOREACH v_segment IN ARRAY v_segments LOOP
      DECLARE
        v_seg_count INTEGER;
        v_seg_revenue NUMERIC;
        v_seg_avg_txn NUMERIC;
        v_seg_freq NUMERIC;
        v_seg_basket NUMERIC;
        v_seg_churn NUMERIC;
        v_seg_ltv NUMERIC;
      BEGIN
        -- 세그먼트별 메트릭 계산
        CASE v_segment
          WHEN 'VIP' THEN
            v_seg_count := 20 + FLOOR(RANDOM() * 10);
            v_seg_revenue := v_seg_count * (200000 + FLOOR(RANDOM() * 100000));
            v_seg_avg_txn := 180000 + FLOOR(RANDOM() * 80000);
            v_seg_freq := 3.5 + RANDOM() * 1.5;
            v_seg_basket := 2.5 + RANDOM();
            v_seg_churn := 0.05 + RANDOM() * 0.05;
            v_seg_ltv := 5000000 + FLOOR(RANDOM() * 2000000);
          WHEN 'Regular' THEN
            v_seg_count := 40 + FLOOR(RANDOM() * 15);
            v_seg_revenue := v_seg_count * (100000 + FLOOR(RANDOM() * 50000));
            v_seg_avg_txn := 95000 + FLOOR(RANDOM() * 30000);
            v_seg_freq := 2.0 + RANDOM();
            v_seg_basket := 1.8 + RANDOM() * 0.5;
            v_seg_churn := 0.15 + RANDOM() * 0.1;
            v_seg_ltv := 2000000 + FLOOR(RANDOM() * 800000);
          WHEN 'New' THEN
            v_seg_count := 25 + FLOOR(RANDOM() * 12);
            v_seg_revenue := v_seg_count * (70000 + FLOOR(RANDOM() * 40000));
            v_seg_avg_txn := 65000 + FLOOR(RANDOM() * 25000);
            v_seg_freq := 1.0 + RANDOM() * 0.5;
            v_seg_basket := 1.3 + RANDOM() * 0.4;
            v_seg_churn := 0.30 + RANDOM() * 0.15;
            v_seg_ltv := 800000 + FLOOR(RANDOM() * 400000);
          WHEN 'Dormant' THEN
            v_seg_count := 10 + FLOOR(RANDOM() * 8);
            v_seg_revenue := v_seg_count * (30000 + FLOOR(RANDOM() * 20000));
            v_seg_avg_txn := 50000 + FLOOR(RANDOM() * 20000);
            v_seg_freq := 0.2 + RANDOM() * 0.3;
            v_seg_basket := 1.1 + RANDOM() * 0.2;
            v_seg_churn := 0.60 + RANDOM() * 0.2;
            v_seg_ltv := 200000 + FLOOR(RANDOM() * 150000);
          ELSE
            v_seg_count := 15;
            v_seg_revenue := 1000000;
            v_seg_avg_txn := 80000;
            v_seg_freq := 1.5;
            v_seg_basket := 1.5;
            v_seg_churn := 0.25;
            v_seg_ltv := 1000000;
        END CASE;

        INSERT INTO customer_segments_agg (
          org_id, store_id, date,
          segment_type, segment_name,
          customer_count, total_revenue,
          avg_transaction_value, visit_frequency,
          avg_basket_size, churn_risk_score, ltv_estimate,
          metadata, calculated_at
        ) VALUES (
          v_org_id, v_store_id, v_start_date + (v_day_offset || ' days')::INTERVAL,
          'customer_tier', v_segment,
          v_seg_count, v_seg_revenue,
          v_seg_avg_txn, v_seg_freq,
          v_seg_basket, v_seg_churn, v_seg_ltv,
          jsonb_build_object(
            'segment', v_segment,
            'tier_rank', CASE v_segment
              WHEN 'VIP' THEN 1
              WHEN 'Regular' THEN 2
              WHEN 'New' THEN 3
              WHEN 'Dormant' THEN 4
              ELSE 5
            END,
            'source', 'seed_script'
          ),
          NOW()
        );
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE '[STEP 14.3] customer_segments_agg 완료: 360건 삽입';

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SEED_06_AGGREGATES: 집계 데이터 시딩 완료';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 15.1: 전체 검증 쿼리 (FK 무결성, 카운트)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_count INTEGER;
  v_expected INTEGER;
  v_total_score NUMERIC := 0;
  v_check_count INTEGER := 0;
  v_passed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '[STEP 15.1] 전체 데이터 검증 시작';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- ─────────────────────────────────────────────────────────────────────────
  -- 1. SEED_02 마스터 데이터 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ SEED_02 마스터 데이터 검증';

  -- zones_dim
  SELECT COUNT(*) INTO v_count FROM zones_dim;
  v_check_count := v_check_count + 1;
  IF v_count >= 7 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ zones_dim: % 건 (예상: 7+)', v_count;
  ELSE
    RAISE WARNING '  ✗ zones_dim: % 건 (예상: 7+) - 부족!', v_count;
  END IF;

  -- customers
  SELECT COUNT(*) INTO v_count FROM customers;
  v_check_count := v_check_count + 1;
  IF v_count >= 2500 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ customers: % 건 (예상: 2,500+)', v_count;
  ELSE
    RAISE WARNING '  ✗ customers: % 건 (예상: 2,500+) - 부족!', v_count;
  END IF;

  -- staff
  SELECT COUNT(*) INTO v_count FROM staff;
  v_check_count := v_check_count + 1;
  IF v_count >= 8 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ staff: % 건 (예상: 8+)', v_count;
  ELSE
    RAISE WARNING '  ✗ staff: % 건 (예상: 8+) - 부족!', v_count;
  END IF;

  -- retail_concepts
  SELECT COUNT(*) INTO v_count FROM retail_concepts;
  v_check_count := v_check_count + 1;
  IF v_count >= 12 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ retail_concepts: % 건 (예상: 12+)', v_count;
  ELSE
    RAISE WARNING '  ✗ retail_concepts: % 건 (예상: 12+) - 부족!', v_count;
  END IF;

  -- data_sources
  SELECT COUNT(*) INTO v_count FROM data_sources;
  v_check_count := v_check_count + 1;
  IF v_count >= 5 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ data_sources: % 건 (예상: 5+)', v_count;
  ELSE
    RAISE WARNING '  ✗ data_sources: % 건 (예상: 5+) - 부족!', v_count;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- 2. SEED_03 가구/상품 데이터 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ SEED_03 가구/상품 데이터 검증';

  -- furniture
  SELECT COUNT(*) INTO v_count FROM furniture;
  v_check_count := v_check_count + 1;
  IF v_count >= 68 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ furniture: % 건 (예상: 68+)', v_count;
  ELSE
    RAISE WARNING '  ✗ furniture: % 건 (예상: 68+) - 부족!', v_count;
  END IF;

  -- furniture_slots
  SELECT COUNT(*) INTO v_count FROM furniture_slots;
  v_check_count := v_check_count + 1;
  IF v_count >= 176 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ furniture_slots: % 건 (예상: 176+)', v_count;
  ELSE
    RAISE WARNING '  ✗ furniture_slots: % 건 (예상: 176+) - 부족!', v_count;
  END IF;

  -- products
  SELECT COUNT(*) INTO v_count FROM products;
  v_check_count := v_check_count + 1;
  IF v_count >= 25 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ products: % 건 (예상: 25+)', v_count;
  ELSE
    RAISE WARNING '  ✗ products: % 건 (예상: 25+) - 부족!', v_count;
  END IF;

  -- product_models
  SELECT COUNT(*) INTO v_count FROM product_models;
  v_check_count := v_check_count + 1;
  IF v_count >= 60 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ product_models: % 건 (예상: 60+)', v_count;
  ELSE
    RAISE WARNING '  ✗ product_models: % 건 (예상: 60+) - 부족!', v_count;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- 3. SEED_04 트랜잭션 데이터 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ SEED_04 트랜잭션 데이터 검증';

  -- store_visits
  SELECT COUNT(*) INTO v_count FROM store_visits;
  v_check_count := v_check_count + 1;
  IF v_count >= 7500 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ store_visits: % 건 (예상: 7,500+)', v_count;
  ELSE
    RAISE WARNING '  ✗ store_visits: % 건 (예상: 7,500+) - 부족!', v_count;
  END IF;

  -- purchases
  SELECT COUNT(*) INTO v_count FROM purchases;
  v_check_count := v_check_count + 1;
  IF v_count >= 3750 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ purchases: % 건 (예상: 3,750+)', v_count;
  ELSE
    RAISE WARNING '  ✗ purchases: % 건 (예상: 3,750+) - 부족!', v_count;
  END IF;

  -- transactions
  SELECT COUNT(*) INTO v_count FROM transactions;
  v_check_count := v_check_count + 1;
  IF v_count >= 3750 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ transactions: % 건 (예상: 3,750+)', v_count;
  ELSE
    RAISE WARNING '  ✗ transactions: % 건 (예상: 3,750+) - 부족!', v_count;
  END IF;

  -- line_items
  SELECT COUNT(*) INTO v_count FROM line_items;
  v_check_count := v_check_count + 1;
  IF v_count >= 7500 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ line_items: % 건 (예상: 7,500+)', v_count;
  ELSE
    RAISE WARNING '  ✗ line_items: % 건 (예상: 7,500+) - 부족!', v_count;
  END IF;

  -- funnel_events
  SELECT COUNT(*) INTO v_count FROM funnel_events;
  v_check_count := v_check_count + 1;
  IF v_count >= 22500 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ funnel_events: % 건 (예상: 22,500+)', v_count;
  ELSE
    RAISE WARNING '  ✗ funnel_events: % 건 (예상: 22,500+) - 부족!', v_count;
  END IF;

  -- zone_events
  SELECT COUNT(*) INTO v_count FROM zone_events;
  v_check_count := v_check_count + 1;
  IF v_count >= 30000 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ zone_events: % 건 (예상: 30,000+)', v_count;
  ELSE
    RAISE WARNING '  ✗ zone_events: % 건 (예상: 30,000+) - 부족!', v_count;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- 4. SEED_05 그래프/AI 데이터 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ SEED_05 그래프/AI 데이터 검증';

  -- graph_entities
  SELECT COUNT(*) INTO v_count FROM graph_entities;
  v_check_count := v_check_count + 1;
  IF v_count >= 120 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ graph_entities: % 건 (예상: 120+)', v_count;
  ELSE
    RAISE WARNING '  ✗ graph_entities: % 건 (예상: 120+) - 부족!', v_count;
  END IF;

  -- graph_relations
  SELECT COUNT(*) INTO v_count FROM graph_relations;
  v_check_count := v_check_count + 1;
  IF v_count >= 200 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ graph_relations: % 건 (예상: 200+)', v_count;
  ELSE
    RAISE WARNING '  ✗ graph_relations: % 건 (예상: 200+) - 부족!', v_count;
  END IF;

  -- applied_strategies
  SELECT COUNT(*) INTO v_count FROM applied_strategies;
  v_check_count := v_check_count + 1;
  IF v_count >= 10 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ applied_strategies: % 건 (예상: 10+)', v_count;
  ELSE
    RAISE WARNING '  ✗ applied_strategies: % 건 (예상: 10+) - 부족!', v_count;
  END IF;

  -- ai_recommendations
  SELECT COUNT(*) INTO v_count FROM ai_recommendations;
  v_check_count := v_check_count + 1;
  IF v_count >= 20 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ ai_recommendations: % 건 (예상: 20+)', v_count;
  ELSE
    RAISE WARNING '  ✗ ai_recommendations: % 건 (예상: 20+) - 부족!', v_count;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- 5. SEED_06 집계 데이터 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ SEED_06 집계 데이터 검증';

  -- daily_kpis_agg
  SELECT COUNT(*) INTO v_count FROM daily_kpis_agg;
  v_check_count := v_check_count + 1;
  IF v_count >= 90 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ daily_kpis_agg: % 건 (예상: 90+)', v_count;
  ELSE
    RAISE WARNING '  ✗ daily_kpis_agg: % 건 (예상: 90+) - 부족!', v_count;
  END IF;

  -- daily_sales
  SELECT COUNT(*) INTO v_count FROM daily_sales;
  v_check_count := v_check_count + 1;
  IF v_count >= 90 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ daily_sales: % 건 (예상: 90+)', v_count;
  ELSE
    RAISE WARNING '  ✗ daily_sales: % 건 (예상: 90+) - 부족!', v_count;
  END IF;

  -- hourly_metrics
  SELECT COUNT(*) INTO v_count FROM hourly_metrics;
  v_check_count := v_check_count + 1;
  IF v_count >= 1080 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ hourly_metrics: % 건 (예상: 1,080+)', v_count;
  ELSE
    RAISE WARNING '  ✗ hourly_metrics: % 건 (예상: 1,080+) - 부족!', v_count;
  END IF;

  -- zone_daily_metrics
  SELECT COUNT(*) INTO v_count FROM zone_daily_metrics;
  v_check_count := v_check_count + 1;
  IF v_count >= 630 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ zone_daily_metrics: % 건 (예상: 630+)', v_count;
  ELSE
    RAISE WARNING '  ✗ zone_daily_metrics: % 건 (예상: 630+) - 부족!', v_count;
  END IF;

  -- product_performance_agg
  SELECT COUNT(*) INTO v_count FROM product_performance_agg;
  v_check_count := v_check_count + 1;
  IF v_count >= 2250 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ product_performance_agg: % 건 (예상: 2,250+)', v_count;
  ELSE
    RAISE WARNING '  ✗ product_performance_agg: % 건 (예상: 2,250+) - 부족!', v_count;
  END IF;

  -- customer_segments_agg
  SELECT COUNT(*) INTO v_count FROM customer_segments_agg;
  v_check_count := v_check_count + 1;
  IF v_count >= 360 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ customer_segments_agg: % 건 (예상: 360+)', v_count;
  ELSE
    RAISE WARNING '  ✗ customer_segments_agg: % 건 (예상: 360+) - 부족!', v_count;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- 6. FK 무결성 검증
  -- ─────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '▶ FK 무결성 검증';

  -- zone_daily_metrics → zones_dim
  SELECT COUNT(*) INTO v_count
  FROM zone_daily_metrics zdm
  WHERE NOT EXISTS (SELECT 1 FROM zones_dim z WHERE z.id = zdm.zone_id);
  v_check_count := v_check_count + 1;
  IF v_count = 0 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ zone_daily_metrics → zones_dim: 무결성 OK';
  ELSE
    RAISE WARNING '  ✗ zone_daily_metrics → zones_dim: % 건 고아 레코드!', v_count;
  END IF;

  -- product_performance_agg → products
  SELECT COUNT(*) INTO v_count
  FROM product_performance_agg ppa
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = ppa.product_id);
  v_check_count := v_check_count + 1;
  IF v_count = 0 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ product_performance_agg → products: 무결성 OK';
  ELSE
    RAISE WARNING '  ✗ product_performance_agg → products: % 건 고아 레코드!', v_count;
  END IF;

  -- graph_relations → graph_entities
  SELECT COUNT(*) INTO v_count
  FROM graph_relations gr
  WHERE NOT EXISTS (SELECT 1 FROM graph_entities ge WHERE ge.id = gr.source_entity_id);
  v_check_count := v_check_count + 1;
  IF v_count = 0 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '  ✓ graph_relations → graph_entities (source): 무결성 OK';
  ELSE
    RAISE WARNING '  ✗ graph_relations → graph_entities (source): % 건 고아 레코드!', v_count;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 15.2: Confidence Score 계산 (85%+ 목표)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '[STEP 15.2] Confidence Score 계산';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  v_total_score := ROUND((v_passed_count::NUMERIC / NULLIF(v_check_count, 0)) * 100, 2);

  RAISE NOTICE '';
  RAISE NOTICE '  전체 검증 항목: % 개', v_check_count;
  RAISE NOTICE '  통과 항목: % 개', v_passed_count;
  RAISE NOTICE '  실패 항목: % 개', v_check_count - v_passed_count;
  RAISE NOTICE '';

  IF v_total_score >= 85 THEN
    RAISE NOTICE '  ╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '  ║  🎉 Confidence Score: %.2f%% - 목표 달성! (85%%+)         ║', v_total_score;
    RAISE NOTICE '  ╚═══════════════════════════════════════════════════════════╝';
  ELSE
    RAISE WARNING '  ╔═══════════════════════════════════════════════════════════╗';
    RAISE WARNING '  ║  ⚠️  Confidence Score: %.2f%% - 목표 미달 (85%% 필요)    ║', v_total_score;
    RAISE WARNING '  ╚═══════════════════════════════════════════════════════════╝';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN v8.6 전체 시딩 완료!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 데이터 요약 쿼리 (참고용)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 아래 쿼리들은 실행하면 시딩 결과를 확인할 수 있습니다:

/*
-- 테이블별 레코드 수 확인
SELECT
  'daily_kpis_agg' as table_name, COUNT(*) as record_count FROM daily_kpis_agg
UNION ALL SELECT 'daily_sales', COUNT(*) FROM daily_sales
UNION ALL SELECT 'hourly_metrics', COUNT(*) FROM hourly_metrics
UNION ALL SELECT 'zone_daily_metrics', COUNT(*) FROM zone_daily_metrics
UNION ALL SELECT 'product_performance_agg', COUNT(*) FROM product_performance_agg
UNION ALL SELECT 'customer_segments_agg', COUNT(*) FROM customer_segments_agg
ORDER BY table_name;

-- 90일 매출 추이
SELECT date, total_revenue, total_transactions, conversion_rate
FROM daily_kpis_agg
ORDER BY date DESC
LIMIT 10;

-- 존별 일평균 방문자 수
SELECT
  z.zone_code,
  z.zone_name,
  ROUND(AVG(zdm.total_visitors), 0) as avg_daily_visitors,
  ROUND(AVG(zdm.avg_dwell_seconds), 0) as avg_dwell_seconds
FROM zone_daily_metrics zdm
JOIN zones_dim z ON z.id = zdm.zone_id
GROUP BY z.zone_code, z.zone_name
ORDER BY avg_daily_visitors DESC;

-- 세그먼트별 매출 비중
SELECT
  segment_name,
  ROUND(AVG(customer_count), 0) as avg_customers,
  ROUND(AVG(total_revenue), 0) as avg_revenue,
  ROUND(AVG(ltv_estimate), 0) as avg_ltv
FROM customer_segments_agg
GROUP BY segment_name
ORDER BY avg_revenue DESC;
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of SEED_06_AGGREGATES.sql
-- ═══════════════════════════════════════════════════════════════════════════════
