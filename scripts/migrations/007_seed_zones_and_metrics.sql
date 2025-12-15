-- 007_seed_zones_and_metrics.sql
-- zones_dim 및 zone_daily_metrics 시딩
-- AI 시뮬레이션의 히트맵/시각화가 실제 데이터 기반으로 작동하도록 함

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_zone_id UUID;
  v_zones_count INT;
  v_zone_metrics_count INT;
  v_current_date DATE;
  v_target_start DATE := CURRENT_DATE - INTERVAL '90 days';

  -- 존 정의: 일반적인 리테일 매장 레이아웃
  v_zone_configs JSONB := '[
    {"name": "입구", "type": "entrance", "x": 0, "z": -7, "width": 4, "depth": 3, "traffic_weight": 1.0},
    {"name": "메인 통로", "type": "aisle", "x": 0, "z": -3, "width": 6, "depth": 4, "traffic_weight": 0.85},
    {"name": "디스플레이 A", "type": "display", "x": -5, "z": 0, "width": 4, "depth": 5, "traffic_weight": 0.7},
    {"name": "디스플레이 B", "type": "display", "x": 5, "z": 0, "width": 4, "depth": 5, "traffic_weight": 0.65},
    {"name": "피팅룸", "type": "fitting", "x": -6, "z": 5, "width": 3, "depth": 3, "traffic_weight": 0.3},
    {"name": "캐셔", "type": "checkout", "x": 6, "z": 5, "width": 3, "depth": 3, "traffic_weight": 0.4},
    {"name": "프리미엄 존", "type": "premium", "x": 0, "z": 4, "width": 5, "depth": 4, "traffic_weight": 0.5},
    {"name": "창고/백룸", "type": "storage", "x": 0, "z": 7, "width": 6, "depth": 2, "traffic_weight": 0.1}
  ]';

  v_zone_record JSONB;
  v_base_visitors INT;
  v_day_of_week INT;
  v_weekend_factor FLOAT;
  v_zone_visitors INT;
  v_avg_dwell INT;
  v_conversion_rate FLOAT;
  v_revenue NUMERIC;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'zones_dim 및 zone_daily_metrics 시딩 시작';
  RAISE NOTICE '====================================';

  -- 첫 번째 매장 ID 가져오기
  SELECT id, org_id INTO v_store_id, v_org_id
  FROM stores
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Please seed stores first.';
  END IF;

  RAISE NOTICE 'Store ID: %', v_store_id;
  RAISE NOTICE 'Org ID: %', v_org_id;

  -- 기존 데이터 확인
  SELECT COUNT(*) INTO v_zones_count FROM zones_dim WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_zone_metrics_count FROM zone_daily_metrics WHERE store_id = v_store_id;

  RAISE NOTICE '기존 zones_dim: % 개', v_zones_count;
  RAISE NOTICE '기존 zone_daily_metrics: % 개', v_zone_metrics_count;

  -- ================================================
  -- STEP 1: zones_dim 생성/확장
  -- ================================================
  IF v_zones_count >= 8 THEN
    RAISE NOTICE 'STEP 1 스킵: zones_dim 이미 충분한 데이터 존재 (% 개)', v_zones_count;
  ELSE
    RAISE NOTICE 'STEP 1: zones_dim 생성 중...';

    -- 기존 데이터 삭제 (충돌 방지)
    DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
    DELETE FROM zones_dim WHERE store_id = v_store_id;

    -- 새 존 생성
    FOR v_zone_record IN SELECT * FROM jsonb_array_elements(v_zone_configs)
    LOOP
      v_zone_id := gen_random_uuid();

      INSERT INTO zones_dim (
        id, store_id, org_id, zone_name, zone_type,
        center_x, center_z, width, depth,
        created_at, updated_at
      ) VALUES (
        v_zone_id,
        v_store_id,
        v_org_id,
        v_zone_record->>'name',
        v_zone_record->>'type',
        (v_zone_record->>'x')::FLOAT,
        (v_zone_record->>'z')::FLOAT,
        (v_zone_record->>'width')::FLOAT,
        (v_zone_record->>'depth')::FLOAT,
        NOW(),
        NOW()
      );

      RAISE NOTICE '  존 생성: % (%, %) - %m x %m',
        v_zone_record->>'name',
        v_zone_record->>'x',
        v_zone_record->>'z',
        v_zone_record->>'width',
        v_zone_record->>'depth';
    END LOOP;

    SELECT COUNT(*) INTO v_zones_count FROM zones_dim WHERE store_id = v_store_id;
    RAISE NOTICE 'STEP 1 완료: % 개 존 생성됨', v_zones_count;
  END IF;

  -- ================================================
  -- STEP 2: zone_daily_metrics 생성
  -- ================================================
  SELECT COUNT(*) INTO v_zone_metrics_count FROM zone_daily_metrics WHERE store_id = v_store_id;

  IF v_zone_metrics_count >= v_zones_count * 80 THEN
    RAISE NOTICE 'STEP 2 스킵: zone_daily_metrics 이미 충분한 데이터 존재 (% 개)', v_zone_metrics_count;
  ELSE
    RAISE NOTICE 'STEP 2: zone_daily_metrics 생성 중...';

    -- 기존 데이터 삭제
    DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;

    -- 각 존에 대해 90일간 메트릭 생성
    FOR v_zone_record IN
      SELECT z.id, z.zone_name, z.zone_type,
             CASE z.zone_type
               WHEN 'entrance' THEN 1.0
               WHEN 'aisle' THEN 0.85
               WHEN 'display' THEN 0.65
               WHEN 'premium' THEN 0.5
               WHEN 'checkout' THEN 0.4
               WHEN 'fitting' THEN 0.3
               WHEN 'storage' THEN 0.1
               ELSE 0.5
             END as traffic_weight
      FROM zones_dim z
      WHERE z.store_id = v_store_id
    LOOP
      v_current_date := v_target_start;

      WHILE v_current_date <= CURRENT_DATE LOOP
        -- 요일별 방문객 변동 (주말 증가)
        v_day_of_week := EXTRACT(DOW FROM v_current_date)::INT;
        v_weekend_factor := CASE
          WHEN v_day_of_week IN (0, 6) THEN 1.3 + random() * 0.2  -- 주말
          WHEN v_day_of_week = 5 THEN 1.15 + random() * 0.1       -- 금요일
          ELSE 0.9 + random() * 0.2                                -- 평일
        END;

        -- 기본 일일 방문객 (80-150명)
        v_base_visitors := 80 + floor(random() * 70);

        -- 존별 방문객 계산 (traffic_weight 적용)
        v_zone_visitors := floor(v_base_visitors * (v_zone_record->>'traffic_weight')::FLOAT * v_weekend_factor);

        -- 존 타입별 체류시간 (초)
        v_avg_dwell := CASE (v_zone_record->>'zone_type')
          WHEN 'entrance' THEN 15 + floor(random() * 20)
          WHEN 'aisle' THEN 30 + floor(random() * 30)
          WHEN 'display' THEN 60 + floor(random() * 90)
          WHEN 'premium' THEN 90 + floor(random() * 120)
          WHEN 'fitting' THEN 180 + floor(random() * 180)
          WHEN 'checkout' THEN 60 + floor(random() * 60)
          WHEN 'storage' THEN 10 + floor(random() * 10)
          ELSE 45 + floor(random() * 45)
        END;

        -- 존 타입별 전환율
        v_conversion_rate := CASE (v_zone_record->>'zone_type')
          WHEN 'entrance' THEN 0.02 + random() * 0.03
          WHEN 'aisle' THEN 0.05 + random() * 0.05
          WHEN 'display' THEN 0.08 + random() * 0.07
          WHEN 'premium' THEN 0.12 + random() * 0.08
          WHEN 'fitting' THEN 0.25 + random() * 0.15
          WHEN 'checkout' THEN 0.85 + random() * 0.1
          WHEN 'storage' THEN 0
          ELSE 0.05 + random() * 0.05
        END;

        -- 매출 계산
        v_revenue := v_zone_visitors * v_conversion_rate * (30000 + random() * 50000);

        INSERT INTO zone_daily_metrics (
          id, store_id, org_id, zone_id, date,
          visitor_count, avg_dwell_time, conversion_rate, revenue,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          v_store_id,
          v_org_id,
          (v_zone_record->>'id')::UUID,
          v_current_date,
          v_zone_visitors,
          v_avg_dwell,
          v_conversion_rate,
          v_revenue,
          NOW(),
          NOW()
        );

        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
    END LOOP;

    SELECT COUNT(*) INTO v_zone_metrics_count FROM zone_daily_metrics WHERE store_id = v_store_id;
    RAISE NOTICE 'STEP 2 완료: % 개 zone_daily_metrics 생성됨', v_zone_metrics_count;
  END IF;

  -- ================================================
  -- 결과 요약
  -- ================================================
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '시딩 완료 결과';
  RAISE NOTICE '====================================';

  SELECT COUNT(*) INTO v_zones_count FROM zones_dim WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_zone_metrics_count FROM zone_daily_metrics WHERE store_id = v_store_id;

  RAISE NOTICE 'zones_dim: % 개', v_zones_count;
  RAISE NOTICE 'zone_daily_metrics: % 개 (약 %일 데이터)', v_zone_metrics_count, v_zone_metrics_count / GREATEST(v_zones_count, 1);

  -- 존별 통계 출력
  RAISE NOTICE '';
  RAISE NOTICE '존별 메트릭 요약 (최근 30일):';

  FOR v_zone_record IN
    SELECT
      z.zone_name,
      SUM(m.visitor_count) as total_visitors,
      ROUND(AVG(m.avg_dwell_time)) as avg_dwell,
      ROUND(AVG(m.conversion_rate)::NUMERIC, 3) as avg_conversion,
      ROUND(SUM(m.revenue)) as total_revenue
    FROM zones_dim z
    LEFT JOIN zone_daily_metrics m ON z.id = m.zone_id
      AND m.date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE z.store_id = v_store_id
    GROUP BY z.zone_name
    ORDER BY total_visitors DESC NULLS LAST
  LOOP
    RAISE NOTICE '  %: % 방문, %초 체류, %% 전환, ₩%',
      v_zone_record->>'zone_name',
      v_zone_record->>'total_visitors',
      v_zone_record->>'avg_dwell',
      ROUND((v_zone_record->>'avg_conversion')::NUMERIC * 100, 1),
      v_zone_record->>'total_revenue';
  END LOOP;

END $$;
