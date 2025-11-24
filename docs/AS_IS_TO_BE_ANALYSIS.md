# NEURALTWIN 프로젝트 현황 분석 (As-Is vs To-Be)

> 최종 업데이트: 2025-11-24  
> 목적: 데몬스트레이션 및 프로덕션 준비를 위한 현황 분석

---

## 📊 요약 (Executive Summary)

| 구분 | As-Is (현재) | To-Be (목표) | 완성도 |
|------|-------------|-------------|--------|
| **기능 구현** | 18/23 페이지 (78%) | 23/23 페이지 (100%) | 🟡 78% |
| **데이터 준비** | 샘플 데이터만 존재 | 13개 CSV + 3D 모델 + WiFi 데이터 | 🟡 40% |
| **데모 시나리오** | 기본 시나리오만 가능 | 8개 시나리오 완전 구동 | 🟡 50% |
| **온톨로지 구축** | 스키마만 존재 | 엔티티 200+ 관계 500+ | 🔴 20% |
| **3D 디지털 트윈** | 뷰어만 구현 | 26개 모델 + 오버레이 완성 | 🟡 60% |

**전체 완성도**: 🟡 **57%** (데모 가능, 프로덕션 준비 필요)

---

## 1. 기능 구현 현황 (Feature Implementation)

### 1.1 Overview 섹션 (4/4 완료 - 100%) ✅

| 페이지 | As-Is | To-Be | 상태 | 우선순위 |
|--------|-------|-------|------|---------|
| Dashboard | ✅ KPI 카드, 차트, AI 추천 모두 구현 | ✅ 동일 | 완료 | - |
| 매장 관리 | ✅ CRUD 완료 | ✅ 동일 | 완료 | - |
| HQ 동기화 | ✅ 동기화 로직 완성 | ✅ 동일 | 완료 | - |
| 설정 | ✅ 기본 설정 가능 | ⚠️ 고급 설정 추가 | 부분 | Low |

**평가**: 🟢 **완벽** - 추가 작업 불필요

---

### 1.2 Analysis 섹션 (8/8 완료 - 100%) ✅

#### Store Analysis (5/5)

| 페이지 | As-Is | To-Be | 상태 | 우선순위 |
|--------|-------|-------|------|---------|
| Footfall Analysis | ✅ 시간대별 분석 + 외부 컨텍스트 | ✅ 동일 | 완료 | - |
| Traffic Heatmap | ✅ 3D 히트맵 완성 | ✅ 동일 | 완료 | - |
| Customer Journey | ✅ 동선 패턴 + Sankey 다이어그램 | ✅ 동일 | 완료 | - |
| Conversion Funnel | ✅ 5단계 퍼널 + 세그먼트 비교 | ✅ 동일 | 완료 | - |
| Customer Analysis | ✅ 세그먼트 + 구매 패턴 | ✅ 동일 | 완료 | - |

#### Operational Analysis (3/3)

| 페이지 | As-Is | To-Be | 상태 | 우선순위 |
|--------|-------|-------|------|---------|
| Inventory Status | ✅ 재고 현황 + 자동 발주 | ✅ 동일 | 완료 | - |
| Profit Center | ✅ 기본 분석 | ⚠️ 고급 분석 추가 | 부분 | Medium |
| Product Performance | ✅ 상품 성과 분석 | ✅ 동일 | 완료 | - |

**평가**: 🟢 **완벽** - 모든 분석 기능 작동

---

### 1.3 Simulation 섹션 (1/6 완료 - 17%) ❌

| 페이지 | As-Is | To-Be | 상태 | 우선순위 |
|--------|-------|-------|------|---------|
| Digital Twin 3D | ✅ 3D 뷰어 + 모델 관리 완성 | ✅ 동일 | 완료 | - |
| Scenario Lab | ❌ 스켈레톤만 존재 | ✅ AI 기반 시나리오 추천 | 미구현 | **HIGH** |
| Layout Simulation | ❌ 미구현 | ✅ Before/After 비교 + AI 예측 | 미구현 | **HIGH** |
| Pricing Simulation | ❌ 미구현 | ✅ 가격 최적화 + 수익 예측 | 미구현 | **HIGH** |
| Demand/Inventory Sim | ❌ 미구현 | ✅ 수요 예측 + 재고 최적화 | 미구현 | **HIGH** |
| Recommendation Sim | ❌ 미구현 | ✅ 개인화 추천 전략 테스트 | 미구현 | **HIGH** |

**평가**: 🔴 **심각한 부족** - 5개 시뮬레이션 페이지 구현 필요

**예상 작업량**: 각 시뮬레이션 2-3일 = **10-15일**

---

### 1.4 Data Management 섹션 (5/5 완료 - 100%) ✅

| 페이지 | As-Is | To-Be | 상태 | 우선순위 |
|--------|-------|-------|------|---------|
| Unified Data Import | ✅ CSV 업로드 + 검증 + 통계 | ✅ 동일 | 완료 | - |
| Ontology Schema Builder | ✅ 엔티티/관계 타입 생성 | ✅ 동일 | 완료 | - |
| Graph Analysis | ✅ 그래프 쿼리 + 시각화 | ✅ 동일 | 완료 | - |
| NeuralSense Settings | ✅ WiFi 센서 관리 | ✅ 동일 | 완료 | - |
| API Integration | ✅ 외부 API 연동 | ✅ 동일 | 완료 | - |

**평가**: 🟢 **완벽** - 데이터 관리 기능 완성

---

## 2. 데이터 준비 현황 (Data Readiness)

### 2.1 CSV 데이터셋 (40% 완료)

| 데이터셋 | As-Is | To-Be | 상태 | 우선순위 |
|---------|-------|-------|------|---------|
| **필수 데이터** (6개) |
| stores.csv | ❌ 없음 | ✅ 1개 매장 (NEURALTWIN Flagship) | 미준비 | **CRITICAL** |
| customers.csv | ⚠️ 샘플 10건 | ✅ 100건 이상 (다양한 세그먼트) | 부족 | **HIGH** |
| products.csv | ⚠️ 샘플 10건 | ✅ 200건 (6개 카테고리) | 부족 | **HIGH** |
| purchases.csv | ⚠️ 샘플 20건 | ✅ 500건 이상 (최근 30일) | 부족 | **HIGH** |
| visits.csv | ⚠️ 샘플 15건 | ✅ 1000건 이상 (좌표 포함) | 부족 | **HIGH** |
| staff.csv | ❌ 없음 | ✅ 18명 (직원 정보) | 미준비 | **MEDIUM** |
| **선택 데이터** (7개) |
| brands.csv | ❌ 없음 | ✅ 20개 브랜드 | 미준비 | **MEDIUM** |
| zones.csv | ❌ 없음 | ✅ 8개 Zone (존-A ~ 존-H) | 미준비 | **HIGH** |
| wifi_sensors.csv | ❌ 없음 | ✅ 3개 센서 | 미준비 | **MEDIUM** |
| wifi_tracking.csv | ❌ 없음 | ✅ 5000건 (Raw Signal) | 미준비 | **MEDIUM** |
| weather_data.csv | ❌ 없음 | ✅ 30일 날씨 데이터 | 미준비 | Low |
| holidays_events.csv | ❌ 없음 | ✅ 이벤트 10건 | 미준비 | Low |
| regional_data.csv | ❌ 없음 | ✅ 상권 데이터 30건 | 미준비 | Low |

**평가**: 🔴 **심각한 부족**
- 필수 데이터 6개 중 0개 완성 (샘플 데이터만 존재)
- 현실적인 데이터 볼륨 필요 (최소 100배 확대)

**예상 작업량**: 데이터 생성 및 검증 **3-5일**

---

### 2.2 3D 모델 데이터 (25% 완료)

| 카테고리 | As-Is | To-Be | 상태 | 우선순위 |
|---------|-------|-------|------|---------|
| **고정 구조물** (9개) |
| 매장 모델 | ❌ 없음 | ✅ Store_NT매장_20.0x10.0x4.0.glb | 미준비 | **CRITICAL** |
| Zone 모델 | ❌ 없음 | ✅ Zone_존A~H (8개) | 미준비 | **HIGH** |
| **이동 가구** (8개) |
| 진열대/랙 | ⚠️ 샘플 1-2개 | ✅ Shelf 4종, Rack 2종 | 부족 | **HIGH** |
| 테이블 | ❌ 없음 | ✅ DisplayTable 2종 | 미준비 | **MEDIUM** |
| 계산대 | ❌ 없음 | ✅ CheckoutCounter 1개 | 미준비 | **MEDIUM** |
| 마네킹 | ❌ 없음 | ✅ Mannequin 2종 | 미준비 | Low |
| **제품** (6개) |
| 카테고리별 대표 모델 | ⚠️ 샘플 2-3개 | ✅ Bag, Bottom, Top, Shoes, Accessory, Outer | 부족 | **MEDIUM** |
| **IoT 장비** (3개) |
| 카메라/센서 | ❌ 없음 | ✅ Camera 1개, WiFiSensor 2개 | 미준비 | Low |

**필요 모델 수**:
- As-Is: 약 5-6개 (샘플)
- To-Be: 26개 (고정 9 + 가구 8 + 제품 6 + IoT 3)

**평가**: 🔴 **심각한 부족** - 80% 모델 누락

**예상 작업량**: 3D 모델 제작/다운로드 **5-7일**

---

### 2.3 온톨로지 데이터 (20% 완료)

| 항목 | As-Is | To-Be | 상태 | 우선순위 |
|------|-------|-------|------|---------|
| **엔티티 타입** | ⚠️ 5-10개 | ✅ 15개 이상 | 부족 | **HIGH** |
| **관계 타입** | ⚠️ 3-5개 | ✅ 10개 이상 | 부족 | **HIGH** |
| **엔티티 인스턴스** | ⚠️ 20-30개 | ✅ 200개 이상 | 심각 부족 | **CRITICAL** |
| **관계 인스턴스** | ⚠️ 10-20개 | ✅ 500개 이상 | 심각 부족 | **CRITICAL** |
| **3D 모델 연결** | ❌ 대부분 미연결 | ✅ 모든 엔티티 타입 연결 | 미준비 | **HIGH** |

**구체적 Gap**:
```
Entity Types (엔티티 타입):
  As-Is: Store, Zone, Product, Brand, Customer (5개)
  To-Be: + Shelf, DisplayTable, Rack, CheckoutCounter, Mannequin, 
         Camera, WiFiSensor, Staff, Visit, Purchase (총 15개)

Relation Types (관계 타입):
  As-Is: contains, displays, purchased_by (3개)
  To-Be: + has, belongs_to, works_at, detected_by, 
         sold_at, visited, placed_in (총 10개)

Entity Instances (엔티티 인스턴스):
  As-Is: ~30개
  To-Be: Store(1) + Zone(8) + Shelf(12) + Product(200) + 
         Customer(100) + Staff(18) + Brand(20) = 359개
```

**평가**: 🔴 **구조는 있으나 데이터 없음** - 대량 인스턴스 생성 필요

**예상 작업량**: CSV 매핑 자동화 + 검증 **2-3일**

---

### 2.4 WiFi 트래킹 데이터 (0% 완료)

| 항목 | As-Is | To-Be | 상태 | 우선순위 |
|------|-------|-------|------|---------|
| WiFi Zones | ❌ 없음 | ✅ 8개 Zone 좌표 정의 | 미준비 | **HIGH** |
| WiFi Sensors | ❌ 없음 | ✅ 3개 센서 등록 (NS001-003) | 미준비 | **HIGH** |
| Raw Signals | ❌ 없음 | ✅ 5000건 RSSI 데이터 | 미준비 | **MEDIUM** |
| Tracking Data | ❌ 없음 | ✅ 1000건 위치 추정 결과 | 미준비 | **HIGH** |
| Heatmap Cache | ❌ 없음 | ✅ 시간대별 캐시 (24시간) | 미준비 | **MEDIUM** |

**평가**: 🔴 **완전 미준비** - WiFi 트래킹 데모 불가능

**예상 작업량**: 데이터 생성 + Edge Function 검증 **2-3일**

---

## 3. 데모 시나리오 준비도 (Demo Scenario Readiness)

### 3.1 8가지 핵심 시나리오 평가

| # | 시나리오 | As-Is | To-Be | 준비도 | 우선순위 |
|---|---------|-------|-------|--------|---------|
| 1 | **신규 사용자 온보딩** | ⚠️ 기능은 있으나 샘플 데이터 부족 | ✅ 완전한 데이터셋 제공 | 🟡 60% | **HIGH** |
| 2 | **3D 매장 모델 업로드** | ⚠️ 업로더는 있으나 모델 없음 | ✅ 26개 모델 업로드 가능 | 🟡 40% | **HIGH** |
| 3 | **트래픽 히트맵 확인** | ⚠️ 기능은 있으나 데이터 부족 | ✅ 1000건 방문 데이터 | 🟡 50% | **HIGH** |
| 4 | **온톨로지 기반 매장 구성** | ⚠️ 스키마만 있고 인스턴스 부족 | ✅ 200+ 엔티티 + 500+ 관계 | 🔴 20% | **CRITICAL** |
| 5 | **WiFi 트래킹 데모** | ❌ 데이터 완전 없음 | ✅ 센서 + Raw Signal + 위치 추정 | 🔴 0% | **CRITICAL** |
| 6 | **AI 레이아웃 시뮬레이션** | ❌ 페이지 미구현 | ✅ 3가지 레이아웃 추천 + 3D 비교 | 🔴 0% | **CRITICAL** |
| 7 | **엔드투엔드 매장 분석** | ⚠️ 부분적 가능 | ✅ 전체 워크플로우 30분 완료 | 🟡 50% | **HIGH** |
| 8 | **멀티 스토어 비교** | ❌ 매장 데이터 1개만 | ✅ 3개 매장 비교 분석 | 🔴 10% | **MEDIUM** |

**전체 평가**: 🟡 **33% 준비됨**
- 완전 가능: 0개
- 부분 가능: 4개 (시나리오 1, 2, 3, 7)
- 불가능: 4개 (시나리오 4, 5, 6, 8)

---

### 3.2 시나리오별 필요 작업

#### 시나리오 1: 신규 사용자 온보딩 (60% → 100%)
**필요 작업**:
1. ✅ 기능: 완료 (매장 등록, CSV 업로드, 검증)
2. ❌ 데이터: 현실적인 샘플 데이터셋 제공 (100+ 건)
3. ❌ 문서: 온보딩 가이드 작성

**예상 시간**: 1일

---

#### 시나리오 4: 온톨로지 기반 매장 구성 (20% → 100%)
**필요 작업**:
1. ✅ 기능: 완료 (스키마 빌더, 그래프 분석)
2. ❌ 데이터: 
   - 15개 엔티티 타입 정의
   - 200+ 엔티티 인스턴스 생성
   - 500+ 관계 생성
3. ❌ 3D 연결: 모든 엔티티 타입에 3D 모델 URL 매핑

**예상 시간**: 3일

---

#### 시나리오 5: WiFi 트래킹 데모 (0% → 100%)
**필요 작업**:
1. ✅ 기능: 완료 (센서 관리, 위치 추정, 3D 오버레이)
2. ❌ 데이터:
   - 8개 Zone 좌표 정의
   - 3개 WiFi 센서 등록
   - 5000건 Raw Signal 데이터
   - 1000건 위치 추정 결과
3. ❌ Edge Function: `process-wifi-data` 검증

**예상 시간**: 3일

---

#### 시나리오 6: AI 레이아웃 시뮬레이션 (0% → 100%)
**필요 작업**:
1. ❌ 페이지: Layout Simulation 페이지 구현
2. ❌ AI: Edge Function `advanced-ai-inference` 연동
3. ❌ 3D: Before/After 비교 뷰어
4. ❌ 데이터: 기존 레이아웃 + 동선 데이터

**예상 시간**: 3일

---

## 4. 데이터베이스 상태 (Database State)

### 4.1 테이블별 데이터 현황

| 테이블 | As-Is (행 수) | To-Be (행 수) | 상태 | 우선순위 |
|--------|--------------|---------------|------|---------|
| **Core Tables** |
| stores | 0-1 | 1 | 🔴 없음 | **CRITICAL** |
| user_data_imports | 0-5 | 13 | 🔴 부족 | **HIGH** |
| **Ontology Tables** |
| ontology_entity_types | 5-10 | 15 | 🟡 부족 | **HIGH** |
| ontology_relation_types | 3-5 | 10 | 🟡 부족 | **HIGH** |
| graph_entities | 20-30 | 200+ | 🔴 심각 부족 | **CRITICAL** |
| graph_relations | 10-20 | 500+ | 🔴 심각 부족 | **CRITICAL** |
| **WiFi Tables** |
| wifi_zones | 0 | 8 | 🔴 없음 | **HIGH** |
| wifi_sensors (neuralsense_devices) | 0 | 3 | 🔴 없음 | **HIGH** |
| wifi_tracking | 0 | 1000+ | 🔴 없음 | **HIGH** |
| wifi_heatmap_cache | 0 | 192 (24h × 8 zones) | 🔴 없음 | **MEDIUM** |
| **Analysis Tables** |
| dashboard_kpis | 0-10 | 30+ | 🔴 부족 | **HIGH** |
| funnel_metrics | 0 | 100+ | 🔴 없음 | **MEDIUM** |
| **Context Tables** |
| weather_data | 0 | 30+ | 🔴 없음 | Low |
| holidays_events | 0 | 10+ | 🔴 없음 | Low |
| regional_data | 0 | 30+ | 🔴 없음 | Low |

**평가**: 🔴 **대부분 테이블 비어있음** - 데이터 생성 필수

---

### 4.2 Storage 버킷 상태

| 버킷 | As-Is | To-Be | 상태 | 우선순위 |
|------|-------|-------|------|---------|
| store-data | 샘플 CSV 5-10개 | 사용자별/매장별 13개 CSV | 🟡 부족 | **HIGH** |
| 3d-models | 샘플 3-5개 | 26개 GLB 파일 | 🔴 부족 | **HIGH** |
| lighting-presets | ✅ 3개 JSON | ✅ 3개 JSON | 🟢 완료 | - |

**예상 Storage 사용량**:
- As-Is: ~50MB
- To-Be: ~500MB (3D 모델 대부분)

---

## 5. To-Be 달성 로드맵 (Roadmap to To-Be)

### Phase 1: 데이터 준비 (5-7일) - **CRITICAL**

#### Week 1, Day 1-2: CSV 데이터 생성
- [ ] stores.csv (1개 매장)
- [ ] customers.csv (100건)
- [ ] products.csv (200건)
- [ ] purchases.csv (500건)
- [ ] visits.csv (1000건)
- [ ] staff.csv (18명)
- [ ] brands.csv (20개)
- [ ] zones.csv (8개)
- [ ] wifi_sensors.csv (3개)

**도구**: GPT-4를 활용한 현실적인 데이터 생성 (docs/GPT_DATASET_GENERATION_GUIDE.md 참고)

#### Week 1, Day 3-4: 3D 모델 준비
- [ ] Store 모델 (1개) - 최우선
- [ ] Zone 모델 (8개) - 높은 우선순위
- [ ] Shelf/Rack 모델 (6개)
- [ ] 제품 모델 (6개 카테고리 대표)
- [ ] IoT 장비 모델 (3개)

**방법**: 
1. 무료 3D 모델 사이트 (Sketchfab, TurboSquid Free)
2. 간단한 박스 모델 (Blender로 빠르게 제작)
3. AI 생성 모델 (Meshy.ai 등)

#### Week 1, Day 5-6: WiFi 트래킹 데이터 생성
- [ ] wifi_zones.csv (8개 Zone 좌표)
- [ ] wifi_tracking.csv (5000건)
- [ ] Edge Function `process-wifi-data` 실행
- [ ] Heatmap Cache 생성 검증

#### Week 1, Day 7: 데이터 검증 및 업로드
- [ ] 모든 CSV 파일 검증 (구조, 데이터 품질)
- [ ] Unified Data Import로 업로드
- [ ] Storage에 파일 저장 확인
- [ ] 데이터베이스 테이블 검증

---

### Phase 2: 온톨로지 구축 (2-3일)

#### Week 2, Day 1: 엔티티 타입 확장
- [ ] 15개 엔티티 타입 정의 (기존 5개 + 10개 추가)
- [ ] 모든 타입에 3D 모델 URL 연결
- [ ] 속성 정의 (properties JSON)

#### Week 2, Day 2: 관계 타입 정의
- [ ] 10개 관계 타입 정의
- [ ] 방향성 설정
- [ ] 속성 정의

#### Week 2, Day 3: 인스턴스 생성
- [ ] CSV 데이터 → 온톨로지 엔티티 자동 매핑
- [ ] 200+ 엔티티 인스턴스 생성
- [ ] 500+ 관계 생성
- [ ] 그래프 시각화 검증

---

### Phase 3: 시뮬레이션 페이지 구현 (10-15일) - **CRITICAL**

#### Week 2, Day 4-6: Layout Simulation
- [ ] 페이지 UI 구현
- [ ] 파라미터 입력 폼
- [ ] Edge Function 연동
- [ ] Before/After 3D 비교 뷰어
- [ ] KPI Delta 차트

#### Week 3, Day 1-2: Pricing Simulation
- [ ] 페이지 UI 구현
- [ ] 가격 최적화 알고리즘 연동
- [ ] 수익 예측 차트
- [ ] 시나리오 저장/비교

#### Week 3, Day 3-4: Demand/Inventory Simulation
- [ ] 페이지 UI 구현
- [ ] 수요 예측 모델 연동
- [ ] 재고 최적화 제안
- [ ] 품절 위험 알림

#### Week 3, Day 5-6: Recommendation Simulation
- [ ] 페이지 UI 구현
- [ ] 추천 전략 테스트
- [ ] A/B 테스트 시뮬레이션
- [ ] 전환율 예측

#### Week 4, Day 1-2: Scenario Lab (시나리오 생성기)
- [ ] 사용자 입력 폼 (비즈니스 목표)
- [ ] AI 분석 및 시나리오 추천
- [ ] 시나리오 타입별 네비게이션
- [ ] 시나리오 저장/불러오기

---

### Phase 4: 통합 테스트 및 데모 준비 (3-5일)

#### Week 4, Day 3-4: 8개 시나리오 테스트
- [ ] 시나리오 1: 신규 사용자 온보딩
- [ ] 시나리오 2: 3D 매장 모델 업로드
- [ ] 시나리오 3: 트래픽 히트맵 확인
- [ ] 시나리오 4: 온톨로지 기반 매장 구성
- [ ] 시나리오 5: WiFi 트래킹 데모
- [ ] 시나리오 6: AI 레이아웃 시뮬레이션
- [ ] 시나리오 7: 엔드투엔드 매장 분석
- [ ] 시나리오 8: 멀티 스토어 비교

#### Week 4, Day 5: 문서화 및 가이드 작성
- [ ] 온보딩 가이드 (ONBOARDING.md 업데이트)
- [ ] 데모 스크립트 작성
- [ ] 트러블슈팅 가이드
- [ ] 사용자 매뉴얼

#### Week 5, Day 1: 성능 최적화
- [ ] 대용량 데이터 로딩 최적화
- [ ] 3D 렌더링 성능 개선
- [ ] Edge Function 응답 시간 단축
- [ ] 캐싱 전략 적용

#### Week 5, Day 2: 최종 검증
- [ ] 모든 페이지 작동 확인
- [ ] 데이터 정합성 검증
- [ ] 에러 핸들링 확인
- [ ] 크로스 브라우저 테스트

---

## 6. 우선순위 별 작업 항목 (Prioritized Action Items)

### 🔴 CRITICAL (1주 내 필수)
1. **CSV 데이터 생성** (5-7일)
   - 13개 CSV 파일 생성 및 업로드
   - 현실적인 데이터 볼륨 (customers 100+, products 200+, visits 1000+)

2. **온톨로지 인스턴스 생성** (2-3일)
   - 200+ 엔티티, 500+ 관계 생성
   - CSV 자동 매핑 실행

3. **Store 3D 모델** (1일)
   - 최소 1개 매장 모델 필수 (Store_NT매장_20.0x10.0x4.0.glb)

4. **시뮬레이션 페이지 구현 시작** (2주)
   - Layout Simulation 우선 구현

---

### 🟡 HIGH (2주 내 필요)
1. **Zone 3D 모델** (2일)
   - 8개 Zone 모델 (존-A ~ 존-H)

2. **WiFi 트래킹 데이터** (2-3일)
   - Zones, Sensors, Tracking 데이터 생성

3. **가구 3D 모델** (2일)
   - Shelf, Rack, DisplayTable, CheckoutCounter (8개)

4. **나머지 시뮬레이션 페이지** (1주)
   - Pricing, Demand/Inventory, Recommendation

---

### 🟢 MEDIUM (3-4주 내 완료)
1. **제품 3D 모델** (1일)
   - 6개 카테고리 대표 모델

2. **외부 컨텍스트 데이터** (1일)
   - Weather, Holidays, Regional 데이터

3. **Scenario Lab 페이지** (2-3일)
   - AI 기반 시나리오 추천 시스템

---

### ⚪ LOW (시간 여유 시)
1. **IoT 장비 모델** (1일)
   - Camera, WiFiSensor 모델

2. **고급 설정 기능** (1-2일)
   - Settings 페이지 확장

3. **성능 최적화** (2-3일)
   - 캐싱, 쿼리 최적화

---

## 7. 리스크 및 대응 방안 (Risks & Mitigation)

### 7.1 데이터 관련 리스크

| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|----------|
| CSV 데이터 품질 낮음 | 🔴 High | 🟡 Medium | GPT-4로 현실적 데이터 생성, 검증 스크립트 실행 |
| 온톨로지 매핑 실패 | 🔴 High | 🟡 Medium | 수동 매핑 대비, Edge Function 디버깅 |
| WiFi 데이터 생성 어려움 | 🟡 Medium | 🟡 Medium | 간단한 시뮬레이션 데이터로 대체 |
| 3D 모델 품질 낮음 | 🟢 Low | 🟡 Medium | 무료 모델 사용, 간단한 박스 모델로 대체 |

### 7.2 개발 관련 리스크

| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|----------|
| 시뮬레이션 페이지 구현 지연 | 🔴 High | 🟡 Medium | 단순화된 버전 우선 구현, 고급 기능은 Phase 2 |
| AI 모델 응답 느림 | 🟡 Medium | 🟡 Medium | 캐싱, 백그라운드 처리, 로딩 UI 개선 |
| 3D 렌더링 성능 이슈 | 🟡 Medium | 🟢 Low | LOD 적용, 모델 최적화, 오버레이 토글 |
| Edge Function 타임아웃 | 🟡 Medium | 🟡 Medium | 백그라운드 처리, 청크 단위 처리 |

### 7.3 일정 관련 리스크

| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|----------|
| 전체 일정 지연 (20-30일) | 🔴 High | 🟡 Medium | MVP 범위 축소, 병렬 작업, 외부 리소스 활용 |
| 데이터 생성 지연 | 🔴 High | 🟢 Low | 자동화 스크립트, GPT API 활용 |
| 테스트 시간 부족 | 🟡 Medium | 🟡 Medium | 자동화 테스트, 체크리스트 활용 |

---

## 8. 성공 기준 (Success Criteria)

### 8.1 기능 완성도

- [X] Overview 섹션: 4/4 페이지 완료 (100%)
- [X] Analysis 섹션: 8/8 페이지 완료 (100%)
- [ ] Simulation 섹션: 6/6 페이지 완료 (현재 1/6, 목표 100%)
- [X] Data Management 섹션: 5/5 페이지 완료 (100%)

**목표**: 전체 23/23 페이지 완료 (100%)

---

### 8.2 데이터 완성도

- [ ] 필수 CSV 6개 업로드 완료
- [ ] 선택 CSV 7개 업로드 완료
- [ ] 3D 모델 26개 업로드 완료
- [ ] 온톨로지 엔티티 200+ 개 생성
- [ ] 온톨로지 관계 500+ 개 생성
- [ ] WiFi 트래킹 데이터 1000+ 건

**목표**: 모든 데이터 준비 완료

---

### 8.3 데모 시나리오 성공률

- [ ] 시나리오 1-8 모두 성공적으로 실행 가능
- [ ] 각 시나리오 완료 시간 목표 달성
- [ ] 에러 발생률 < 5%

**목표**: 8/8 시나리오 완전 작동 (100%)

---

### 8.4 성능 기준

- [ ] CSV 임포트: 1000건/초
- [ ] 히트맵 렌더링: < 2초
- [ ] 그래프 쿼리: < 1초
- [ ] 3D 로딩: < 10초
- [ ] AI 추론: < 30초
- [ ] 페이지 로딩: < 3초

**목표**: 모든 성능 기준 충족

---

## 9. 결론 및 Next Steps

### 9.1 현재 상태 요약

**강점** (What's Working):
- ✅ 기능 구현 78% 완료 (18/23 페이지)
- ✅ 분석 기능 100% 완성
- ✅ 데이터 관리 시스템 완성
- ✅ 3D 디지털 트윈 뷰어 완성
- ✅ 온톨로지 스키마 빌더 완성

**약점** (What's Missing):
- ❌ 시뮬레이션 페이지 83% 미구현 (5/6)
- ❌ 현실적인 데이터 부족 (샘플 데이터만 존재)
- ❌ 3D 모델 75% 부족 (6/26)
- ❌ 온톨로지 인스턴스 90% 부족
- ❌ WiFi 트래킹 데이터 100% 없음

**기회** (Opportunities):
- 💡 자동화된 데이터 생성 (GPT-4)
- 💡 무료 3D 모델 리소스 활용
- 💡 Edge Function 기반 백그라운드 처리
- 💡 데모 시나리오 중심 개발

**위협** (Threats):
- ⚠️ 일정 부족 (20-30일 필요)
- ⚠️ 데이터 품질 관리
- ⚠️ 3D 모델 제작/다운로드 시간
- ⚠️ AI 모델 성능 및 비용

---

### 9.2 Immediate Next Steps (다음 48시간)

#### Step 1: 데이터 생성 착수 (Day 1)
1. [ ] `docs/GPT_DATASET_GENERATION_GUIDE.md` 리뷰
2. [ ] GPT-4로 customers.csv (100건) 생성
3. [ ] GPT-4로 products.csv (200건) 생성
4. [ ] 데이터 검증 및 업로드

#### Step 2: 핵심 3D 모델 확보 (Day 2)
1. [ ] Store 모델 1개 다운로드/제작
2. [ ] Zone 모델 8개 (간단한 박스로 시작)
3. [ ] Shelf 모델 2-3개 다운로드

#### Step 3: 시뮬레이션 페이지 설계 (Day 2)
1. [ ] Layout Simulation UI 와이어프레임
2. [ ] 파라미터 정의
3. [ ] Edge Function 인터페이스 설계

---

### 9.3 Weekly Milestones

**Week 1**: 데이터 준비 완료
- 13개 CSV 파일 생성 및 업로드
- 핵심 3D 모델 10개 확보
- WiFi 트래킹 데이터 생성

**Week 2**: 온톨로지 구축 및 시뮬레이션 시작
- 200+ 엔티티, 500+ 관계 생성
- Layout Simulation 페이지 완성

**Week 3**: 시뮬레이션 페이지 완성
- Pricing, Demand/Inventory, Recommendation 페이지 완성
- Scenario Lab 페이지 완성

**Week 4**: 통합 테스트 및 최적화
- 8개 시나리오 테스트 완료
- 성능 최적화
- 문서화 완료

---

### 9.4 Go/No-Go Decision Points

#### Checkpoint 1 (Week 1 종료 시):
**GO 조건**:
- [ ] 13개 CSV 파일 모두 업로드 완료
- [ ] Store 3D 모델 1개 이상 확보
- [ ] 온톨로지 엔티티 50개 이상 생성

**NO-GO 시 대응**:
- 데이터 생성 자동화 스크립트 실행
- 3D 모델을 간단한 박스로 대체
- 일정 연장 협의

#### Checkpoint 2 (Week 2 종료 시):
**GO 조건**:
- [ ] 온톨로지 엔티티 200+ 개
- [ ] Layout Simulation 페이지 작동
- [ ] WiFi 트래킹 데모 가능

**NO-GO 시 대응**:
- 시뮬레이션 페이지 단순화
- WiFi 트래킹 데모 제외 고려
- 우선순위 재조정

#### Checkpoint 3 (Week 3 종료 시):
**GO 조건**:
- [ ] 6개 시뮬레이션 페이지 모두 작동
- [ ] 8개 시나리오 중 6개 성공
- [ ] 성능 기준 80% 충족

**NO-GO 시 대응**:
- MVP 범위 재정의
- 데모 시나리오 축소
- 런칭 연기 검토

---

## 10. 참고 문서 (References)

- [COMPLETE_FEATURE_IMPLEMENTATION_AUDIT.md](../COMPLETE_FEATURE_IMPLEMENTATION_AUDIT.md) - 기능 구현 상세 감사
- [DEMO_DATASET_REQUIREMENTS.md](./DEMO_DATASET_REQUIREMENTS.md) - 데이터셋 요구사항
- [DEMO_TEST_SCENARIOS.md](./DEMO_TEST_SCENARIOS.md) - 데모 테스트 시나리오
- [GPT_DATASET_GENERATION_GUIDE.md](./GPT_DATASET_GENERATION_GUIDE.md) - GPT 데이터 생성 가이드
- [CORRECTED_DATASET_STRUCTURE.md](./CORRECTED_DATASET_STRUCTURE.md) - 올바른 데이터 구조
- [3D_MODEL_FILENAME_SPECIFICATION.md](./3D_MODEL_FILENAME_SPECIFICATION.md) - 3D 모델 파일명 규칙
- [ONBOARDING.md](../ONBOARDING.md) - 온보딩 가이드
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - 프로젝트 구조

---

**문서 버전**: 1.0  
**최종 수정**: 2025-11-24  
**다음 리뷰**: Week 1 종료 시 (Checkpoint 1)
