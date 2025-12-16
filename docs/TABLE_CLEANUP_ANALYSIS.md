# 테이블 정리 분석 보고서

**작성일**: 2025-12-16
**버전**: 1.0

---

## 1. Phase 1: 백업 테이블 삭제 (완료)

다음 7개 백업 테이블 삭제 SQL이 실행 완료되었습니다:

```sql
-- Phase 1: 백업 테이블 삭제 (실행 완료)
DROP TABLE IF EXISTS daily_kpis_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS daily_sales_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS store_visits_backup_20250608 CASCADE;
DROP TABLE IF EXISTS zone_daily_metrics_backup_20250610 CASCADE;
DROP TABLE IF EXISTS customer_daily_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS hourly_kpis_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS hourly_zone_agg_backup_20250610 CASCADE;
```

**예상 공간 절약**: 약 15MB

---

## 2. 중복 테이블 상세 분석

### 2.1 zone_performance vs zone_daily_metrics

| 구분 | zone_performance | zone_daily_metrics |
|------|------------------|-------------------|
| **행 수** | 630 rows | 630 rows |
| **크기** | 3.7MB | 568 KB |
| **코드 사용** | ❌ 0개 파일 | ✅ 2개 파일 (4회 호출) |
| **FK 관계** | zone_name (문자열) | zone_id (FK to zones_dim) |
| **데이터 완성도** | hourly_visits, heatmap_data | entry/exit_count, interaction_count, peak_hour 등 |

**사용 위치 (zone_daily_metrics)**:
- `src/hooks/useZoneMetrics.ts` (3회)
- `src/features/studio/utils/store-context-builder.ts` (1회)

**결론**: `zone_performance`는 레거시 테이블. **삭제 가능**.

---

### 2.2 dashboard_kpis vs daily_kpis_agg

| 구분 | dashboard_kpis | daily_kpis_agg |
|------|----------------|----------------|
| **행 수** | 90 rows | 90 rows |
| **크기** | 72 KB | 112 KB |
| **코드 사용** | ✅ 3개 파일 (4회 호출) | ✅ 9개 파일 (19회 호출) |
| **주요 용도** | ROI 추적, 임포트 상태 | KPI 대시보드, 알림, 인사이트 전체 |

**dashboard_kpis 사용 위치**:
- `src/hooks/useROITracking.ts` - ROI 추적
- `src/features/data-management/import/components/IntegratedImportStatus.tsx` - 데이터 삭제
- `src/features/simulation/hooks/useStoreContext.ts` - 스토어 컨텍스트
- `src/features/simulation/hooks/useDataSourceMapping.ts` - 데이터 소스 매핑

**daily_kpis_agg 사용 위치**:
- `src/services/alertService.ts` (3회) - 알림 서비스
- `src/hooks/useDashboardKPIAgg.ts` (3회) - 메인 KPI 훅
- `src/hooks/useGoals.ts` (2회) - 목표 관리
- `src/hooks/useFootfallAnalysis.ts` (1회) - 방문객 분석
- `src/hooks/useDashboardKPI.ts` (3회) - KPI 훅
- `src/features/studio/utils/store-context-builder.ts` (1회)
- `src/features/insights/tabs/CustomerTab.tsx` (1회)
- `src/features/insights/hooks/useAIPrediction.ts` (1회)
- `src/features/simulation/hooks/useStoreContext.ts` (1회)
- `src/features/insights/hooks/useInsightMetrics.ts` (3회)

**결론**: 두 테이블 모두 **활발히 사용 중**. 현재는 삭제 불가.
향후 `dashboard_kpis`를 `daily_kpis_agg`로 통합하는 리팩토링 권장.

---

### 2.3 visits vs store_visits

| 구분 | visits | store_visits |
|------|--------|--------------|
| **행 수** | 0 rows | 3,553 rows |
| **크기** | 8 KB | 1.1 MB |
| **코드 사용** | ✅ 2개 파일 (3회 호출) | ✅ 4개 파일 (6회 호출) |
| **데이터 완성도** | 기본 방문 정보 | exit_date, device_type, transaction_id, zone_durations 등 상세 정보 |

**visits 사용 위치**:
- `src/hooks/useStoreData.ts` (2회)
- `src/features/simulation/hooks/useDataSourceMapping.ts` (1회)

**store_visits 사용 위치**:
- `src/features/studio/utils/store-context-builder.ts` (1회)
- `src/hooks/useGoals.ts` (2회)
- `src/features/insights/hooks/useInsightMetrics.ts` (2회)
- `src/features/simulation/hooks/useStoreContext.ts` (1회)

**결론**: `visits` 테이블은 코드에서 사용되지만 **데이터가 0행**.
`store_visits`를 사용하도록 코드 마이그레이션 후 `visits` 삭제 필요.

---

## 3. 필수 시딩 테이블 데이터

### 3.1 staff 테이블 (0 rows)

**사용 위치**:
- `src/hooks/useStoreData.ts` (2회)

**필수 시딩 SQL**:

```sql
-- staff 샘플 데이터 (15명 직원)
INSERT INTO staff (id, staff_name, staff_code, role, department, email, phone, hire_date, hourly_rate, store_id, org_id, is_active)
VALUES
  -- 매장 관리자
  ('staff-001', '김민수', 'MGR001', 'store_manager', 'management', 'minsu.kim@store.com', '010-1234-5678', '2020-03-15', 35000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-002', '이서연', 'MGR002', 'assistant_manager', 'management', 'seoyeon.lee@store.com', '010-2345-6789', '2021-06-01', 28000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 판매 직원
  ('staff-003', '박지훈', 'SLS001', 'sales_associate', 'sales', 'jihun.park@store.com', '010-3456-7890', '2022-01-10', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-004', '최유나', 'SLS002', 'sales_associate', 'sales', 'yuna.choi@store.com', '010-4567-8901', '2022-03-20', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-005', '정현우', 'SLS003', 'senior_sales', 'sales', 'hyunwoo.jung@store.com', '010-5678-9012', '2021-08-15', 18000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-006', '한소희', 'SLS004', 'sales_associate', 'sales', 'sohee.han@store.com', '010-6789-0123', '2023-02-01', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-007', '오준혁', 'SLS005', 'sales_associate', 'sales', 'junhyuk.oh@store.com', '010-7890-1234', '2023-05-10', 15000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 재고 관리
  ('staff-008', '윤지민', 'INV001', 'inventory_manager', 'operations', 'jimin.yun@store.com', '010-8901-2345', '2021-04-01', 22000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-009', '임도현', 'INV002', 'inventory_staff', 'operations', 'dohyun.lim@store.com', '010-9012-3456', '2022-09-15', 14000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 고객 서비스
  ('staff-010', '신예은', 'CSR001', 'customer_service', 'service', 'yeeun.shin@store.com', '010-0123-4567', '2022-11-01', 16000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-011', '강민재', 'CSR002', 'customer_service', 'service', 'minjae.kang@store.com', '010-1111-2222', '2023-01-15', 16000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 캐셔
  ('staff-012', '조수빈', 'CSH001', 'cashier', 'operations', 'subin.jo@store.com', '010-2222-3333', '2022-07-01', 14000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-013', '백승호', 'CSH002', 'cashier', 'operations', 'seungho.baek@store.com', '010-3333-4444', '2023-03-01', 14000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 비활성 직원 (퇴사)
  ('staff-014', '문채원', 'SLS006', 'sales_associate', 'sales', 'chaewon.moon@store.com', '010-4444-5555', '2021-01-01', 15000, 'store-gangnam-001', 'org-neuraltwin', false),
  ('staff-015', '류태준', 'INV003', 'inventory_staff', 'operations', 'taejun.ryu@store.com', '010-5555-6666', '2020-06-01', 14000, 'store-gangnam-001', 'org-neuraltwin', false);
```

---

### 3.2 transactions 테이블 (0 rows)

**사용 위치**:
- `src/features/simulation/hooks/useStoreContext.ts` (1회)
- `src/features/insights/hooks/useInsightMetrics.ts` (1회)
- `src/features/insights/hooks/useAIPrediction.ts` (1회)

**필수 시딩 SQL**:

```sql
-- transactions 샘플 데이터 (최근 90일, 약 500건)
-- 참고: store_visits 테이블의 visit_id와 연결

INSERT INTO transactions (
  id, transaction_datetime, customer_id, store_id, visit_id,
  total_amount, discount_amount, net_amount, payment_method, channel
)
SELECT
  'txn-' || LPAD(row_number() OVER ()::text, 6, '0'),
  sv.entry_date + (random() * interval '4 hours'),
  sv.customer_id,
  sv.store_id,
  sv.id,
  ROUND((random() * 200000 + 10000)::numeric, 0),  -- 10,000 ~ 210,000원
  ROUND((random() * 20000)::numeric, 0),           -- 0 ~ 20,000원 할인
  ROUND((random() * 200000 + 10000 - random() * 20000)::numeric, 0),
  (ARRAY['credit_card', 'debit_card', 'cash', 'mobile_pay', 'gift_card'])[floor(random() * 5 + 1)],
  'in_store'
FROM store_visits sv
WHERE sv.transaction_id IS NOT NULL
  AND sv.entry_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY random()
LIMIT 500;

-- 또는 직접 삽입 버전 (store_visits 연동 없이)
INSERT INTO transactions (id, transaction_datetime, customer_id, store_id, visit_id, total_amount, discount_amount, net_amount, payment_method, channel)
VALUES
  ('txn-000001', NOW() - INTERVAL '1 day', 'cust-001', 'store-gangnam-001', NULL, 89000, 5000, 84000, 'credit_card', 'in_store'),
  ('txn-000002', NOW() - INTERVAL '1 day', 'cust-002', 'store-gangnam-001', NULL, 156000, 10000, 146000, 'mobile_pay', 'in_store'),
  ('txn-000003', NOW() - INTERVAL '2 days', 'cust-003', 'store-gangnam-001', NULL, 45000, 0, 45000, 'cash', 'in_store'),
  ('txn-000004', NOW() - INTERVAL '2 days', 'cust-004', 'store-gangnam-001', NULL, 234000, 15000, 219000, 'credit_card', 'in_store'),
  ('txn-000005', NOW() - INTERVAL '3 days', 'cust-005', 'store-gangnam-001', NULL, 78000, 8000, 70000, 'debit_card', 'in_store');
-- ... (실제 운영 시 더 많은 데이터 필요)
```

---

## 4. 권장 조치 사항 요약

### Phase 2: 즉시 실행 가능

```sql
-- zone_performance 테이블 삭제 (레거시, 코드에서 미사용)
DROP TABLE IF EXISTS zone_performance CASCADE;
-- 예상 절약: 3.7MB
```

### Phase 3: 코드 마이그레이션 필요

1. **visits → store_visits 마이그레이션**
   - 영향 파일: `useStoreData.ts`, `useDataSourceMapping.ts`
   - 마이그레이션 후 `visits` 테이블 삭제

2. **dashboard_kpis → daily_kpis_agg 통합** (선택적)
   - 영향 파일: 4개 파일
   - 두 테이블 스키마 차이 분석 후 진행

### Phase 4: 시딩 데이터 추가

```sql
-- 우선순위 순서
1. staff 테이블 시딩 (기능 활성화 필수)
2. transactions 테이블 시딩 (인사이트/예측 기능 필수)
```

---

## 5. 최종 테이블 구조 (정리 후 예상)

| 카테고리 | 현재 | 정리 후 | 절약 |
|---------|------|---------|------|
| 백업 테이블 | 7개 | 0개 | ~15MB |
| 중복 테이블 | 3쌍 | 통합 | ~4MB |
| 활성 테이블 | 114개 | ~110개 | - |
| **총 테이블** | **121개** | **~110개** | **~20MB** |
