# NEURALTWIN 데모 데이터셋 요구사항 v3.0

> **최종 업데이트**: 2025-12-02  
> **온톨로지 스키마 버전**: v3.0 (62 Entities, 99 Relations)  
> **대상**: 고객 대시보드 전체 기능 Demonstration

---

## 📋 목차

1. [개요](#1-개요)
2. [온톨로지 스키마 v3.0 구조](#2-온톨로지-스키마-v30-구조)
3. [대시보드 페이지별 필수 데이터](#3-대시보드-페이지별-필수-데이터)
4. [CRITICAL 엔티티 CSV 데이터셋 (25개)](#4-critical-엔티티-csv-데이터셋-25개)
5. [HIGH 엔티티 CSV 데이터셋 (19개)](#5-high-엔티티-csv-데이터셋-19개)
6. [MEDIUM 엔티티 CSV 데이터셋 (13개)](#6-medium-엔티티-csv-데이터셋-13개)
7. [LOW 엔티티 CSV 데이터셋 (5개)](#7-low-엔티티-csv-데이터셋-5개)
8. [3D 모델 데이터](#8-3d-모델-데이터)
9. [온톨로지 관계 데이터](#9-온톨로지-관계-데이터)
10. [데이터 생성 가이드](#10-데이터-생성-가이드)

---

## 1. 개요

### 1.1 목적
- 고객 대시보드 12개 페이지 전체 기능 demonstration
- v3.0 온톨로지 스키마의 완전한 구현 및 검증
- AI 추론 엔진 및 지식 그래프 활용 테스트

### 1.2 데이터셋 우선순위

| 우선순위 | 엔티티 수 | 최소 레코드 | 설명 |
|---------|----------|------------|------|
| 🔴 CRITICAL | 25 | 3,000+ | 기본 기능 필수 |
| 🟡 HIGH | 19 | 1,500+ | AI 추론 필수 |
| 🟢 MEDIUM | 13 | 500+ | 고급 분석 기능 |
| ⚪ LOW | 5 | 100+ | 선택적 기능 |

### 1.3 전체 데이터 구조 개요

```
Organization (1개)
└── Store (1개)
    ├── Zone (8개) ────────┐
    │   ├── Entrance (2개)  │
    │   ├── CheckoutCounter (3개)
    │   ├── Aisle (6개)     │
    │   ├── FittingRoom (2개) │
    │   ├── StorageRoom (1개) │
    │   ├── Shelf (12개)    │
    │   ├── Rack (8개)      │
    │   └── DisplayTable (6개)
    │
    ├── Category (20개 - 3 레벨 계층)
    │   └── Product (200개)
    │       ├── Brand (15개)
    │       ├── Supplier (10개)
    │       └── Inventory (200개)
    │
    ├── Customer (500명)
    │   ├── Visit (2,000건)
    │   ├── Transaction (1,000건)
    │   └── Purchase (2,500건)
    │
    ├── Staff (15명)
    │   └── Shift (450건 - 1개월)
    │
    ├── Promotion (10개)
    ├── Weather (90일치)
    ├── Holiday (30건)
    ├── EconomicIndicator (90일치)
    │
    ├── WiFiSensor (6개)
    │   └── SensorEvent (10,000건)
    ├── Camera (8개)
    ├── Beacon (4개)
    ├── PeopleCounter (2개)
    │
    ├── DailySales (90일)
    ├── InventoryHistory (6,000건)
    ├── ZonePerformance (720건)
    ├── Task (100건)
    ├── Alert (50건)
    │
    ├── DataSource (3개)
    │   ├── DataSourceTable (10개)
    │   └── ColumnMapping (50개)
    │
    ├── Model (5개)
    │   ├── ModelRun (50건)
    │   ├── ModelEmbedding (1,000건)
    │   └── AIInsight (200건)
    │
    ├── Scenario (10개)
    │   └── SimulationResult (50건)
    │
    ├── KPI (15개)
    │   └── KPIValue (1,350건)
    │
    ├── RetailConcept (20개)
    └── BusinessRule (30개)
```

---

## 2. 온톨로지 스키마 v3.0 구조

### 2.1 엔티티 분류

#### 🔴 CRITICAL (25개) - 기본 기능
1. **조직/매장**: Organization, Store
2. **공간 구조**: Zone, Entrance, CheckoutCounter
3. **제품**: Category, Product, Inventory, Brand, Promotion
4. **고객/거래**: Customer, Visit, Transaction, Purchase
5. **직원/운영**: Staff, Shift
6. **센서**: WiFiSensor
7. **데이터 파이프라인**: DataSource, DataSourceTable, ColumnMapping
8. **이벤트**: BaseEvent, CustomerEvent, SensorEvent
9. **AI 모델**: Model, ModelRun, ModelEmbedding, AIInsight

#### 🟡 HIGH (19개) - AI 추론 필수
Weather, Holiday, EconomicIndicator, Aisle, FittingRoom, StorageRoom, Shelf, Rack, DisplayTable, Supplier, Camera, Beacon, Scenario, SimulationResult, KPI, KPIValue, RetailConcept, BusinessRule, DemandForecast

#### 🟢 MEDIUM (13개) - 고급 분석
DailySales, InventoryHistory, ZonePerformance, Task, PeopleCounter, DoorSensor, TemperatureSensor, HumiditySensor, Alert, PriceOptimization, POS, DigitalSignage, HVAC

#### ⚪ LOW (5개) - 선택적 기능
(현재 LOW tier는 MEDIUM과 통합)

### 2.2 관계 분류 (99개)

#### CRITICAL (32개)
BELONGS_TO, HAS_ZONE, HAS_ENTRANCE, HAS_CHECKOUT, BELONGS_TO_CATEGORY, HAS_SUBCATEGORY, PARENT_OF, MANUFACTURED_BY, SOLD_AT, STORED_AT, PURCHASED_PRODUCT, MADE_TRANSACTION, VISITED_STORE, ENTERED_THROUGH, WORKS_AT, ASSIGNED_TO_STORE, CHECKED_OUT_AT, OCCURRED_AT_STORE, ASSIGNED_TO_STAFF 등

#### HIGH (27개)
AFFECTED_BY_WEATHER, AFFECTED_BY_HOLIDAY, INFLUENCED_BY_INDICATOR, HAS_SHELF, HAS_RACK, DISPLAYED_ON, SUPPLIED_BY, MONITORED_BY_CAMERA, TRACKED_BY_BEACON, TARGETS_PRODUCT, APPLIED_IN_ZONE 등

#### MEDIUM (17개)
SALES_OF_STORE, HISTORY_OF_PRODUCT, PERFORMANCE_OF_ZONE, COUNTED_BY, SENSED_BY_DOOR, MEASURED_TEMPERATURE, MEASURED_HUMIDITY, TARGETS_ENTITY 등

#### ADDITIONAL (13개)
VISITED_STORE, OCCURRED_AT_STORE, CHECKED_OUT_AT, ENTERED_THROUGH, STORED_AT, HAS_SUBCATEGORY, ASSIGNED_TO_STORE, AFFECTS_STORE, TARGETS_PRODUCT, APPLIED_IN_ZONE, SALES_OF_STORE, RECORDED_AT_STORE, HISTORY_OF_PRODUCT

---

## 3. 대시보드 페이지별 필수 데이터

### (A) Overview - 개요

#### 📊 DashboardPage
**필수 엔티티**:
- Store, Customer, Visit, Transaction, Purchase (KPI 계산)
- DailySales (시계열 분석)
- ZonePerformance (구역 성과)
- AIInsight (AI 추천)
- Alert (이상 탐지)

**최소 데이터**:
- Store: 1개
- Customer: 500명
- Visit: 2,000건 (3개월)
- Transaction: 1,000건
- Purchase: 2,500건
- DailySales: 90일치
- ZonePerformance: 720건 (8개 Zone × 90일)
- AIInsight: 50건
- Alert: 20건

#### 🏪 StoresPage
**필수 엔티티**:
- Store, Zone, Staff, DailySales, ZonePerformance

**최소 데이터**:
- Store: 1개 (상세 정보 포함)
- Zone: 8개
- Staff: 15명
- DailySales: 90일
- ZonePerformance: 720건

#### 💬 HQCommunicationPage
**필수 엔티티**:
- Organization, Store, Staff, Task

**최소 데이터**:
- Organization: 1개
- Store: 1개
- Staff: 15명 (역할별)
- Task: 100건 (본사 지시사항)

#### ⚙️ SettingsPage
**필수 엔티티**:
- Organization, DataSource, DataSourceTable

**최소 데이터**:
- Organization: 1개
- DataSource: 3개 (POS, ERP, CRM)
- DataSourceTable: 10개

---

### (B) Store Analysis - 매장 현황 분석

#### 🏬 StoreAnalysisPage
**필수 엔티티**:
- Store, Zone, ZonePerformance, Traffic, DailySales, Staff, Shift

**최소 데이터**:
- Store: 1개
- Zone: 8개
- ZonePerformance: 720건
- DailySales: 90일
- Staff: 15명
- Shift: 450건 (15명 × 30일)

#### 👤 CustomerAnalysisPage
**필수 엔티티**:
- Customer, Visit, Purchase, Transaction, CustomerEvent

**최소 데이터**:
- Customer: 500명 (세그먼트별)
- Visit: 2,000건
- Purchase: 2,500건
- Transaction: 1,000건
- CustomerEvent: 5,000건

#### 📦 ProductAnalysisPage
**필수 엔티티**:
- Product, Category, Brand, Inventory, Purchase, InventoryHistory

**최소 데이터**:
- Product: 200개
- Category: 20개 (3 레벨)
- Brand: 15개
- Inventory: 200건
- Purchase: 2,500건
- InventoryHistory: 6,000건 (200개 × 30일)

---

### (C) Simulation - 시뮬레이션

#### 🎯 DigitalTwin3DPage
**필수 엔티티**:
- Store, Zone, Product, Shelf, Rack, DisplayTable, Camera, WiFiSensor, CustomerEvent

**최소 데이터**:
- Store: 1개 (3D 모델)
- Zone: 8개 (3D 모델)
- Product: 200개 (카테고리별 대표 모델)
- Shelf: 12개
- Rack: 8개
- DisplayTable: 6개
- Camera: 8개
- WiFiSensor: 6개
- CustomerEvent: 5,000건 (동선 데이터)

#### 🔬 SimulationHubPage
**필수 엔티티**:
- Scenario, SimulationResult, DemandForecast, PriceOptimization, Model, ModelRun

**최소 데이터**:
- Scenario: 10개 (레이아웃/수요/재고/가격/프로모션)
- SimulationResult: 50건
- DemandForecast: 200건
- PriceOptimization: 200건
- Model: 5개 (AI 모델)
- ModelRun: 50건

---

### (D) Data Management - 데이터 관리

#### 📂 UnifiedDataManagementPage
**필수 엔티티**:
- DataSource, DataSourceTable, ColumnMapping

**최소 데이터**:
- DataSource: 3개 (POS, ERP, CRM)
- DataSourceTable: 10개
- ColumnMapping: 50개

#### 🧬 SchemaBuilderPage
**필수 엔티티**:
- ontology_entity_types (62개)
- ontology_relation_types (99개)

**최소 데이터**:
- Entity Types: 62개 (v3.0 마스터 스키마)
- Relation Types: 99개 (v3.0 마스터 스키마)

#### 🔌 APIIntegrationPage
**필수 엔티티**:
- DataSource, DataSourceTable, ColumnMapping

**최소 데이터**:
- DataSource: 3개
- DataSourceTable: 10개
- ColumnMapping: 50개

---

## 4. CRITICAL 엔티티 CSV 데이터셋 (25개)

### 4.1 Organization (조직)

**파일명**: `organizations.csv`  
**최소 레코드**: 1개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| org_id | string | ✅ | 조직 ID | ORG-001 |
| org_name | string | ✅ | 조직명 | NEURALTWIN Fashion |
| org_type | string | ❌ | 조직 유형 | retail |
| industry | string | ❌ | 업종 | fashion |
| country | string | ❌ | 국가 | KR |
| created_at | datetime | ❌ | 생성일 | 2024-01-01 |

**샘플 데이터**:
```csv
org_id,org_name,org_type,industry,country,created_at
ORG-001,NEURALTWIN Fashion,retail,fashion,KR,2024-01-01
```

---

### 4.2 Store (매장)

**파일명**: `stores.csv`  
**최소 레코드**: 1개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| store_code | string | ✅ | 매장 코드 | NT-FLG-001 |
| store_name | string | ✅ | 매장명 | NEURALTWIN Flagship Store |
| address | string | ✅ | 주소 | 서울 강남구 테헤란로 427 |
| area_sqm | number | ✅ | 면적 (제곱미터) | 200 |
| opening_date | date | ❌ | 오픈일 | 2024-01-15 |
| store_format | string | ❌ | 매장 포맷 | flagship |
| region | string | ❌ | 지역 | Seoul |
| district | string | ❌ | 구역 | Gangnam |
| manager_name | string | ❌ | 매니저명 | 김매니저 |
| org_id | string | ✅ | 조직 ID | ORG-001 |

**샘플 데이터**:
```csv
store_code,store_name,address,area_sqm,opening_date,store_format,region,district,manager_name,org_id
NT-FLG-001,NEURALTWIN Flagship Store,서울 강남구 테헤란로 427,200,2024-01-15,flagship,Seoul,Gangnam,김매니저,ORG-001
```

---

### 4.3 Zone (구역)

**파일명**: `zones.csv`  
**최소 레코드**: 8개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| zone_id | string | ✅ | 구역 ID | ZONE-A |
| zone_type | string | ✅ | 구역 유형 | entrance |
| zone_name | string | ✅ | 구역명 | 존-A (입구) |
| area_sqm | number | ❌ | 면적 | 16 |
| purpose | string | ❌ | 목적 | 고객 입장 및 환영 |
| traffic_level | string | ❌ | 트래픽 레벨 | high |

**Zone Types**:
- `entrance`: 입구 구역
- `product_display`: 제품 진열 구역
- `checkout`: 계산대 구역
- `storage`: 창고/보관 구역
- `staff`: 직원 전용 구역
- `fitting`: 피팅룸 구역
- `rest`: 휴게 구역

**샘플 데이터**:
```csv
zone_id,zone_type,zone_name,area_sqm,purpose,traffic_level
ZONE-A,entrance,존-A (입구),16,고객 입장 및 환영,high
ZONE-B,product_display,존-B (가방/액세서리),25,가방 및 액세서리 진열,medium
ZONE-C,product_display,존-C (하의),25,하의 제품 진열,medium
ZONE-D,product_display,존-D (상의),25,상의 제품 진열,high
ZONE-E,product_display,존-E (신발),25,신발 제품 진열,medium
ZONE-F,product_display,존-F (아우터),25,아우터 제품 진열,low
ZONE-G,product_display,존-G (프리미엄),25,프리미엄 제품 진열,medium
ZONE-H,checkout,존-H (계산대),16,결제 및 포장,high
```

---

### 4.4 Entrance (출입구)

**파일명**: `entrances.csv`  
**최소 레코드**: 2개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| entrance_id | string | ✅ | 출입구 ID | ENT-MAIN-01 |
| entrance_type | string | ❌ | 유형 | main |
| width_m | number | ❌ | 너비 (미터) | 3.0 |
| is_primary | boolean | ❌ | 메인 출입구 여부 | true |

**샘플 데이터**:
```csv
entrance_id,entrance_type,width_m,is_primary
ENT-MAIN-01,main,3.0,true
ENT-SIDE-01,side,2.0,false
```

---

### 4.5 CheckoutCounter (계산대)

**파일명**: `checkout_counters.csv`  
**최소 레코드**: 3개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| counter_id | string | ✅ | 계산대 ID | CHK-01 |
| counter_number | number | ✅ | 계산대 번호 | 1 |
| has_pos_terminal | boolean | ❌ | POS 단말기 보유 | true |
| supports_mobile_payment | boolean | ❌ | 모바일 결제 지원 | true |
| is_express_lane | boolean | ❌ | 익스프레스 레인 | false |

**샘플 데이터**:
```csv
counter_id,counter_number,has_pos_terminal,supports_mobile_payment,is_express_lane
CHK-01,1,true,true,false
CHK-02,2,true,true,false
CHK-03,3,true,true,true
```

---

### 4.6 Category (카테고리)

**파일명**: `categories.csv`  
**최소 레코드**: 20개 (3레벨 계층)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| category_id | string | ✅ | 카테고리 ID | CAT-001 |
| category_name | string | ✅ | 카테고리명 | 의류 |
| parent_category_id | string | ❌ | 상위 카테고리 | null |
| category_level | number | ❌ | 계층 레벨 | 1 |
| display_order | number | ❌ | 표시 순서 | 1 |

**샘플 데이터** (3레벨 계층):
```csv
category_id,category_name,parent_category_id,category_level,display_order
CAT-001,의류,,1,1
CAT-002,신발,,1,2
CAT-003,액세서리,,1,3
CAT-004,상의,CAT-001,2,1
CAT-005,하의,CAT-001,2,2
CAT-006,아우터,CAT-001,2,3
CAT-007,티셔츠,CAT-004,3,1
CAT-008,셔츠,CAT-004,3,2
CAT-009,청바지,CAT-005,3,1
CAT-010,면바지,CAT-005,3,2
CAT-011,자켓,CAT-006,3,1
CAT-012,코트,CAT-006,3,2
CAT-013,운동화,CAT-002,2,1
CAT-014,구두,CAT-002,2,2
CAT-015,가방,CAT-003,2,1
CAT-016,지갑,CAT-003,2,2
CAT-017,모자,CAT-003,2,3
CAT-018,벨트,CAT-003,2,4
CAT-019,스니커즈,CAT-013,3,1
CAT-020,러닝화,CAT-013,3,2
```

---

### 4.7 Product (제품)

**파일명**: `products.csv`  
**최소 레코드**: 200개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sku | string | ✅ | SKU | SKU-TS-001 |
| product_name | string | ✅ | 제품명 | 베이직 화이트 티셔츠 |
| category_id | string | ✅ | 카테고리 ID | CAT-007 |
| brand | string | ❌ | 브랜드 | NEURALTWIN Basic |
| selling_price | number | ✅ | 판매가 | 29000 |
| cost_price | number | ❌ | 원가 | 15000 |
| supplier | string | ❌ | 공급업체 | SUP-001 |
| lead_time_days | number | ❌ | 리드타임 (일) | 7 |

**카테고리별 분포**:
- 상의 (티셔츠/셔츠): 60개
- 하의 (청바지/면바지): 40개
- 아우터 (자켓/코트): 30개
- 신발 (운동화/구두): 40개
- 액세서리 (가방/지갑/모자/벨트): 30개

**가격대 분포**:
- 저가 (<50,000원): 60개 (30%)
- 중가 (50,000-150,000원): 100개 (50%)
- 고가 (>150,000원): 40개 (20%)

**샘플 데이터**:
```csv
sku,product_name,category_id,brand,selling_price,cost_price,supplier,lead_time_days
SKU-TS-001,베이직 화이트 티셔츠,CAT-007,NEURALTWIN Basic,29000,15000,SUP-001,7
SKU-TS-002,베이직 블랙 티셔츠,CAT-007,NEURALTWIN Basic,29000,15000,SUP-001,7
SKU-SH-001,옥스포드 화이트 셔츠,CAT-008,NEURALTWIN Premium,59000,30000,SUP-002,10
SKU-JN-001,슬림핏 블루 청바지,CAT-009,Denim Master,89000,45000,SUP-003,14
SKU-JK-001,레더 블랙 자켓,CAT-011,NEURALTWIN Premium,299000,150000,SUP-004,21
SKU-SN-001,클래식 화이트 스니커즈,CAT-019,Footwear Plus,129000,70000,SUP-005,14
```

---

### 4.8 Inventory (재고)

**파일명**: `inventory.csv`  
**최소 레코드**: 200개 (제품당 1개)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| inventory_id | string | ✅ | 재고 ID | INV-001 |
| product_id | string | ✅ | 제품 ID (SKU) | SKU-TS-001 |
| store_id | string | ✅ | 매장 ID | NT-FLG-001 |
| current_stock | number | ✅ | 현재 재고 | 45 |
| minimum_stock | number | ✅ | 최소 재고 | 10 |
| optimal_stock | number | ✅ | 최적 재고 | 50 |
| weekly_demand | number | ❌ | 주간 수요 | 12 |
| last_updated | datetime | ❌ | 최종 업데이트 | 2024-12-01 09:00:00 |

**재고 분포 가이드**:
- 인기 제품 (20%): current_stock = optimal_stock × 0.5-0.7 (재주문 필요)
- 정상 제품 (60%): current_stock = optimal_stock × 0.8-1.2
- 저동 제품 (20%): current_stock = optimal_stock × 1.5-2.0 (과재고)

**샘플 데이터**:
```csv
inventory_id,product_id,store_id,current_stock,minimum_stock,optimal_stock,weekly_demand,last_updated
INV-001,SKU-TS-001,NT-FLG-001,25,10,50,12,2024-12-01 09:00:00
INV-002,SKU-TS-002,NT-FLG-001,45,10,50,8,2024-12-01 09:00:00
INV-003,SKU-SH-001,NT-FLG-001,18,5,25,6,2024-12-01 09:00:00
INV-004,SKU-JN-001,NT-FLG-001,12,8,30,10,2024-12-01 09:00:00
INV-005,SKU-JK-001,NT-FLG-001,8,3,15,2,2024-12-01 09:00:00
```

---

### 4.9 Brand (브랜드)

**파일명**: `brands.csv`  
**최소 레코드**: 15개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| brand_id | string | ✅ | 브랜드 ID | BRD-001 |
| brand_name | string | ✅ | 브랜드명 | NEURALTWIN Basic |
| brand_tier | string | ❌ | 브랜드 등급 | standard |
| origin_country | string | ❌ | 원산지 | KR |

**Brand Tiers**:
- `luxury`: 럭셔리 (2개)
- `premium`: 프리미엄 (4개)
- `standard`: 스탠다드 (6개)
- `value`: 밸류 (3개)

**샘플 데이터**:
```csv
brand_id,brand_name,brand_tier,origin_country
BRD-001,NEURALTWIN Basic,standard,KR
BRD-002,NEURALTWIN Premium,premium,KR
BRD-003,Denim Master,standard,USA
BRD-004,Footwear Plus,standard,KR
BRD-005,Luxury Collection,luxury,IT
BRD-006,Urban Style,standard,KR
BRD-007,Active Wear,standard,USA
BRD-008,Classic Elegance,premium,FR
BRD-009,Street Fashion,value,KR
BRD-010,Designer Line,luxury,IT
BRD-011,Casual Comfort,value,KR
BRD-012,Sport Elite,premium,DE
BRD-013,Minimal Chic,premium,KR
BRD-014,Budget Basics,value,CN
BRD-015,Modern Trends,standard,KR
```

---

### 4.10 Promotion (프로모션)

**파일명**: `promotions.csv`  
**최소 레코드**: 10개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| promotion_id | string | ✅ | 프로모션 ID | PROMO-001 |
| promotion_name | string | ✅ | 프로모션명 | 겨울 세일 |
| promotion_type | string | ❌ | 유형 | discount |
| start_date | date | ✅ | 시작일 | 2024-12-01 |
| end_date | date | ✅ | 종료일 | 2024-12-31 |
| discount_rate | number | ❌ | 할인율 | 20 |
| target_products | array | ❌ | 대상 제품 | ["SKU-TS-001","SKU-TS-002"] |
| target_zones | array | ❌ | 대상 구역 | ["ZONE-D","ZONE-F"] |

**Promotion Types**:
- `discount`: 할인 (40%)
- `bogo`: Buy One Get One (20%)
- `bundle`: 묶음 할인 (20%)
- `seasonal`: 시즌 세일 (20%)

**샘플 데이터**:
```csv
promotion_id,promotion_name,promotion_type,start_date,end_date,discount_rate,target_products,target_zones
PROMO-001,겨울 세일,seasonal,2024-12-01,2024-12-31,20,"[""SKU-TS-001"",""SKU-TS-002""]","[""ZONE-D"",""ZONE-F""]"
PROMO-002,가방 2+1,bogo,2024-11-15,2024-12-15,0,"[""SKU-BAG-*""]","[""ZONE-B""]"
PROMO-003,청바지 30% 할인,discount,2024-11-20,2024-12-20,30,"[""SKU-JN-*""]","[""ZONE-C""]"
PROMO-004,신발 묶음 할인,bundle,2024-11-10,2024-12-10,15,"[""SKU-SN-*""]","[""ZONE-E""]"
```

---

### 4.11 Customer (고객)

**파일명**: `customers.csv`  
**최소 레코드**: 500명

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| customer_id | string | ✅ | 고객 ID | CUST-001 |
| age_group | string | ❌ | 연령대 | 20s |
| gender | string | ❌ | 성별 | F |
| customer_segment | string | ❌ | 세그먼트 | VIP |
| signup_date | date | ❌ | 가입일 | 2024-01-15 |
| loyalty_tier | string | ❌ | 로열티 등급 | gold |
| total_purchases | number | ❌ | 누적 구매액 | 1500000 |
| visit_frequency | string | ❌ | 방문 빈도 | high |

**고객 세그먼트 분포**:
- VIP (10%): 50명 - total_purchases > 2,000,000원
- Regular (60%): 300명 - 500,000원 < total_purchases < 2,000,000원
- New (30%): 150명 - total_purchases < 500,000원

**연령대 분포**:
- 10s (5%): 25명
- 20s (30%): 150명
- 30s (35%): 175명
- 40s (20%): 100명
- 50s (7%): 35명
- 60s+ (3%): 15명

**성별 분포**:
- Female (60%): 300명
- Male (38%): 190명
- Other (2%): 10명

**샘플 데이터**:
```csv
customer_id,age_group,gender,customer_segment,signup_date,loyalty_tier,total_purchases,visit_frequency
CUST-001,30s,F,VIP,2024-01-15,platinum,3500000,high
CUST-002,20s,M,Regular,2024-02-20,silver,800000,medium
CUST-003,40s,F,Regular,2024-03-10,gold,1200000,medium
CUST-004,20s,F,New,2024-11-01,bronze,150000,low
CUST-005,30s,M,VIP,2024-01-20,platinum,4200000,high
```

---

### 4.12 Visit (방문)

**파일명**: `visits.csv`  
**최소 레코드**: 2,000건 (3개월)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| visit_id | string | ✅ | 방문 ID | VISIT-001 |
| customer_id | string | ✅ | 고객 ID | CUST-001 |
| store_id | string | ✅ | 매장 ID | NT-FLG-001 |
| visit_date | date | ✅ | 방문일 | 2024-11-15 |
| visit_time | time | ✅ | 방문시간 | 14:35:00 |
| duration_minutes | number | ❌ | 체류 시간 (분) | 45 |
| zones_visited | array | ❌ | 방문 구역 | ["ZONE-A","ZONE-D","ZONE-H"] |
| did_purchase | boolean | ❌ | 구매 여부 | true |
| entry_point | string | ❌ | 입구 ID | ENT-MAIN-01 |

**방문 패턴**:
- 평일 (60%): 1,200건
- 주말 (40%): 800건
- 시간대 분포: 오전 10-12시 (20%), 점심 12-14시 (15%), 오후 14-18시 (35%), 저녁 18-21시 (30%)
- 전환율: 40% (800건이 구매로 이어짐)

**샘플 데이터**:
```csv
visit_id,customer_id,store_id,visit_date,visit_time,duration_minutes,zones_visited,did_purchase,entry_point
VISIT-001,CUST-001,NT-FLG-001,2024-11-15,14:35:00,45,"[""ZONE-A"",""ZONE-D"",""ZONE-E"",""ZONE-H""]",true,ENT-MAIN-01
VISIT-002,CUST-002,NT-FLG-001,2024-11-15,15:20:00,25,"[""ZONE-A"",""ZONE-C"",""ZONE-H""]",true,ENT-MAIN-01
VISIT-003,CUST-003,NT-FLG-001,2024-11-15,16:45:00,15,"[""ZONE-A"",""ZONE-B""]",false,ENT-MAIN-01
VISIT-004,CUST-004,NT-FLG-001,2024-11-16,11:00:00,60,"[""ZONE-A"",""ZONE-B"",""ZONE-D"",""ZONE-F"",""ZONE-H""]",true,ENT-MAIN-01
```

---

### 4.13 Transaction (거래)

**파일명**: `transactions.csv`  
**최소 레코드**: 1,000건

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| transaction_id | string | ✅ | 거래 ID | TXN-001 |
| customer_id | string | ❌ | 고객 ID | CUST-001 |
| store_id | string | ✅ | 매장 ID | NT-FLG-001 |
| transaction_date | date | ✅ | 거래일 | 2024-11-15 |
| transaction_time | time | ✅ | 거래시간 | 14:50:00 |
| total_amount | number | ✅ | 총 금액 | 178000 |
| payment_method | string | ❌ | 결제 방법 | card |
| discount_amount | number | ❌ | 할인 금액 | 10000 |
| num_items | number | ❌ | 구매 품목 수 | 3 |
| products_purchased | array | ❌ | 구매 제품 | ["SKU-TS-001","SKU-JN-001"] |
| counter_id | string | ❌ | 계산대 ID | CHK-01 |

**결제 수단 분포**:
- card (70%): 700건
- mobile (25%): 250건
- cash (5%): 50건

**샘플 데이터**:
```csv
transaction_id,customer_id,store_id,transaction_date,transaction_time,total_amount,payment_method,discount_amount,num_items,products_purchased,counter_id
TXN-001,CUST-001,NT-FLG-001,2024-11-15,14:50:00,178000,card,10000,3,"[""SKU-TS-001"",""SKU-JN-001"",""SKU-SN-001""]",CHK-01
TXN-002,CUST-002,NT-FLG-001,2024-11-15,15:35:00,129000,mobile,0,1,"[""SKU-SN-001""]",CHK-02
TXN-003,CUST-003,NT-FLG-001,2024-11-15,16:55:00,87000,card,5000,2,"[""SKU-TS-001"",""SKU-TS-002""]",CHK-01
```

---

### 4.14 Purchase (구매)

**파일명**: `purchases.csv`  
**최소 레코드**: 2,500건 (거래당 평균 2.5개 품목)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| purchase_id | string | ✅ | 구매 ID | PUR-001 |
| transaction_id | string | ✅ | 거래 ID | TXN-001 |
| product_id | string | ✅ | 제품 ID (SKU) | SKU-TS-001 |
| quantity | number | ✅ | 수량 | 2 |
| unit_price | number | ✅ | 단가 | 29000 |
| subtotal | number | ✅ | 소계 | 58000 |
| discount_applied | number | ❌ | 적용 할인 | 5000 |

**샘플 데이터**:
```csv
purchase_id,transaction_id,product_id,quantity,unit_price,subtotal,discount_applied
PUR-001,TXN-001,SKU-TS-001,2,29000,58000,5000
PUR-002,TXN-001,SKU-JN-001,1,89000,89000,5000
PUR-003,TXN-001,SKU-SN-001,1,129000,129000,0
PUR-004,TXN-002,SKU-SN-001,1,129000,129000,0
PUR-005,TXN-003,SKU-TS-001,1,29000,29000,2500
PUR-006,TXN-003,SKU-TS-002,2,29000,58000,2500
```

---

### 4.15 Staff (직원)

**파일명**: `staff.csv`  
**최소 레코드**: 15명

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| staff_id | string | ✅ | 직원 ID | STAFF-001 |
| staff_name | string | ✅ | 직원명 | 김매니저 |
| role | string | ✅ | 역할 | manager |
| store_id | string | ✅ | 소속 매장 | NT-FLG-001 |
| hire_date | date | ❌ | 입사일 | 2024-01-15 |
| employment_type | string | ❌ | 고용 유형 | full_time |

**역할 분포**:
- manager (1명): 매장 매니저
- sales (8명): 판매 직원
- stockist (4명): 재고 관리
- security (2명): 보안 직원

**샘플 데이터**:
```csv
staff_id,staff_name,role,store_id,hire_date,employment_type
STAFF-001,김매니저,manager,NT-FLG-001,2024-01-15,full_time
STAFF-002,이판매,sales,NT-FLG-001,2024-01-20,full_time
STAFF-003,박판매,sales,NT-FLG-001,2024-02-01,full_time
STAFF-004,최판매,sales,NT-FLG-001,2024-02-15,part_time
STAFF-005,정재고,stockist,NT-FLG-001,2024-01-25,full_time
STAFF-006,강재고,stockist,NT-FLG-001,2024-03-01,full_time
STAFF-007,조보안,security,NT-FLG-001,2024-01-15,full_time
```

---

### 4.16 Shift (근무 시간)

**파일명**: `shifts.csv`  
**최소 레코드**: 450건 (15명 × 30일)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| shift_id | string | ✅ | 근무 ID | SHF-001 |
| staff_id | string | ✅ | 직원 ID | STAFF-002 |
| shift_date | date | ✅ | 근무일 | 2024-11-15 |
| start_time | time | ✅ | 시작 시간 | 09:00:00 |
| end_time | time | ✅ | 종료 시간 | 18:00:00 |
| shift_type | string | ❌ | 근무 유형 | morning |

**Shift Types**:
- morning (09:00-18:00): 아침 근무
- afternoon (13:00-22:00): 오후 근무
- evening (16:00-22:00): 저녁 근무
- night (22:00-06:00): 야간 근무 (보안 직원)

**샘플 데이터**:
```csv
shift_id,staff_id,shift_date,start_time,end_time,shift_type
SHF-001,STAFF-002,2024-11-15,09:00:00,18:00:00,morning
SHF-002,STAFF-003,2024-11-15,13:00:00,22:00:00,afternoon
SHF-003,STAFF-004,2024-11-15,16:00:00,22:00:00,evening
SHF-004,STAFF-007,2024-11-15,22:00:00,06:00:00,night
```

---

### 4.17 WiFiSensor (WiFi 센서)

**파일명**: `wifi_sensors.csv`  
**최소 레코드**: 6개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sensor_id | string | ✅ | 센서 ID | WIFI-001 |
| zone_id | string | ✅ | 설치 구역 | ZONE-A |
| mac_address | string | ❌ | MAC 주소 | AA:BB:CC:DD:EE:01 |
| detection_range_m | number | ❌ | 탐지 범위 | 10 |
| status | string | ❌ | 상태 | active |

**센서 배치**:
- 입구 (ZONE-A): 2개
- 주요 진열 구역 (ZONE-D, ZONE-E): 각 1개
- 계산대 (ZONE-H): 2개

**샘플 데이터**:
```csv
sensor_id,zone_id,mac_address,detection_range_m,status
WIFI-001,ZONE-A,AA:BB:CC:DD:EE:01,10,active
WIFI-002,ZONE-A,AA:BB:CC:DD:EE:02,10,active
WIFI-003,ZONE-D,AA:BB:CC:DD:EE:03,8,active
WIFI-004,ZONE-E,AA:BB:CC:DD:EE:04,8,active
WIFI-005,ZONE-H,AA:BB:CC:DD:EE:05,10,active
WIFI-006,ZONE-H,AA:BB:CC:DD:EE:06,10,active
```

---

### 4.18-4.25 데이터 파이프라인 & AI 관련 엔티티

#### 4.18 DataSource (데이터 소스)

**파일명**: `data_sources.csv`  
**최소 레코드**: 3개

```csv
source_id,system_name,source_type,connection_info,owner,refresh_frequency
DS-001,POS System,db,"{""host"":""pos.example.com"",""port"":5432}",IT팀,real-time
DS-002,ERP System,api,"{""endpoint"":""https://erp.example.com/api""}",운영팀,daily
DS-003,CRM System,api,"{""endpoint"":""https://crm.example.com/api""}",마케팅팀,hourly
```

#### 4.19 DataSourceTable (데이터 테이블)

**파일명**: `data_source_tables.csv`  
**최소 레코드**: 10개

```csv
table_id,source_id,table_name,schema_raw,row_count
TBL-001,DS-001,sales_transactions,"{""columns"":[{""name"":""txn_id""},{""name"":""amount""}]}",50000
TBL-002,DS-001,inventory_movements,"{""columns"":[{""name"":""product_id""},{""name"":""qty""}]}",20000
TBL-003,DS-002,suppliers,"{""columns"":[{""name"":""supplier_id""},{""name"":""name""}]}",150
TBL-004,DS-003,customer_profiles,"{""columns"":[{""name"":""customer_id""},{""name"":""segment""}]}",5000
```

#### 4.20 ColumnMapping (컬럼 매핑)

**파일명**: `column_mappings.csv`  
**최소 레코드**: 50개

```csv
mapping_id,table_id,source_column,target_entity,target_attribute,transformation
MAP-001,TBL-001,txn_id,Transaction,transaction_id,direct
MAP-002,TBL-001,amount,Transaction,total_amount,direct
MAP-003,TBL-001,txn_date,Transaction,transaction_date,parse_date
MAP-004,TBL-002,product_id,Product,sku,direct
```

#### 4.21 BaseEvent (기본 이벤트)

**파일명**: `base_events.csv`  
**최소 레코드**: 100개

```csv
event_id,event_type,timestamp,source_system,payload
EVT-001,system_startup,2024-11-15 09:00:00,POS,"{""version"":""1.2.3""}"
EVT-002,data_sync,2024-11-15 09:05:00,ERP,"{""records"":150}"
```

#### 4.22 CustomerEvent (고객 이벤트)

**파일명**: `customer_events.csv`  
**최소 레코드**: 5,000건

```csv
event_id,customer_id,event_type,timestamp,zone_id,product_id,metadata
CEVT-001,CUST-001,zone_entry,2024-11-15 14:35:00,ZONE-A,,"{""entry_point"":""ENT-MAIN-01""}"
CEVT-002,CUST-001,product_view,2024-11-15 14:37:00,ZONE-D,SKU-TS-001,"{""dwell_seconds"":45}"
CEVT-003,CUST-001,product_pickup,2024-11-15 14:40:00,ZONE-D,SKU-JN-001,"{}"
CEVT-004,CUST-001,zone_exit,2024-11-15 14:42:00,ZONE-D,,"{}"
```

#### 4.23 SensorEvent (센서 이벤트)

**파일명**: `sensor_events.csv`  
**최소 레코드**: 10,000건

```csv
event_id,sensor_id,event_type,timestamp,detected_mac,rssi,metadata
SEVT-001,WIFI-001,mac_detected,2024-11-15 14:35:00,AA:11:22:33:44:55,-65,"{""first_seen"":true}"
SEVT-002,WIFI-001,mac_tracked,2024-11-15 14:35:10,AA:11:22:33:44:55,-62,"{}"
SEVT-003,WIFI-002,mac_detected,2024-11-15 14:35:15,AA:11:22:33:44:55,-70,"{}"
```

#### 4.24 Model (AI 모델)

**파일명**: `models.csv`  
**최소 레코드**: 5개

```csv
model_id,model_name,model_type,version,framework,created_at
MODEL-001,고객 세그먼트 예측,classification,v1.0,scikit-learn,2024-10-01
MODEL-002,수요 예측,regression,v2.1,tensorflow,2024-10-15
MODEL-003,재고 최적화,optimization,v1.5,custom,2024-11-01
MODEL-004,가격 추천,reinforcement_learning,v1.2,pytorch,2024-11-10
MODEL-005,이상 탐지,anomaly_detection,v1.0,isolation_forest,2024-11-15
```

#### 4.25 ModelRun (모델 실행)

**파일명**: `model_runs.csv`  
**최소 레코드**: 50건

```csv
run_id,model_id,run_date,input_data,output_results,accuracy,runtime_seconds
RUN-001,MODEL-001,2024-11-15,"{""customer_count"":500}","{""vip"":50,""regular"":300,""new"":150}",0.92,12.5
RUN-002,MODEL-002,2024-11-15,"{""sku"":""SKU-TS-001"",""days"":30}","{""forecast"":[12,15,18,14]}",0.88,8.3
```

---

## 5. HIGH 엔티티 CSV 데이터셋 (19개)

### 5.1 Weather (날씨)

**파일명**: `weather.csv`  
**최소 레코드**: 90일치

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| weather_id | string | ✅ | 날씨 ID | WTH-001 |
| store_id | string | ✅ | 매장 ID | NT-FLG-001 |
| date | date | ✅ | 날짜 | 2024-11-15 |
| temperature_c | number | ❌ | 온도 (°C) | 15.5 |
| condition | string | ❌ | 날씨 상태 | sunny |
| precipitation_mm | number | ❌ | 강수량 (mm) | 0 |
| humidity_percent | number | ❌ | 습도 (%) | 65 |

**Weather Conditions**:
- sunny (40%): 맑음
- cloudy (30%): 흐림
- rainy (20%): 비
- snowy (10%): 눈

**샘플 데이터**:
```csv
weather_id,store_id,date,temperature_c,condition,precipitation_mm,humidity_percent
WTH-001,NT-FLG-001,2024-11-15,15.5,sunny,0,65
WTH-002,NT-FLG-001,2024-11-16,12.3,cloudy,0,72
WTH-003,NT-FLG-001,2024-11-17,8.7,rainy,15,85
```

---

### 5.2 Holiday (공휴일)

**파일명**: `holidays.csv`  
**최소 레코드**: 30건 (1년치)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| holiday_id | string | ✅ | 공휴일 ID | HOL-001 |
| date | date | ✅ | 날짜 | 2024-01-01 |
| holiday_name | string | ✅ | 공휴일명 | 신정 |
| holiday_type | string | ❌ | 유형 | national |
| is_shopping_day | boolean | ❌ | 쇼핑 성수기 여부 | true |

**샘플 데이터**:
```csv
holiday_id,date,holiday_name,holiday_type,is_shopping_day
HOL-001,2024-01-01,신정,national,true
HOL-002,2024-02-09,설날 전날,lunar,true
HOL-003,2024-02-10,설날,lunar,false
HOL-004,2024-03-01,삼일절,national,false
HOL-005,2024-05-05,어린이날,national,true
HOL-006,2024-06-06,현충일,national,false
HOL-007,2024-08-15,광복절,national,false
HOL-008,2024-09-16,추석 전날,lunar,true
HOL-009,2024-09-17,추석,lunar,false
HOL-010,2024-10-03,개천절,national,false
HOL-011,2024-10-09,한글날,national,false
HOL-012,2024-12-25,크리스마스,national,true
```

---

### 5.3 EconomicIndicator (경제 지표)

**파일명**: `economic_indicators.csv`  
**최소 레코드**: 90일치 × 3개 지표 = 270건

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| indicator_id | string | ✅ | 지표 ID | ECO-001 |
| date | date | ✅ | 날짜 | 2024-11-15 |
| indicator_type | string | ✅ | 지표 유형 | consumer_confidence |
| value | number | ✅ | 지표 값 | 105.2 |
| unit | string | ❌ | 단위 | index |

**Indicator Types**:
- consumer_confidence: 소비자 신뢰 지수
- inflation_rate: 인플레이션율
- retail_sales_index: 소매 판매 지수

**샘플 데이터**:
```csv
indicator_id,date,indicator_type,value,unit
ECO-001,2024-11-15,consumer_confidence,105.2,index
ECO-002,2024-11-15,inflation_rate,2.8,percent
ECO-003,2024-11-15,retail_sales_index,112.5,index
ECO-004,2024-11-16,consumer_confidence,104.8,index
```

---

### 5.4-5.10 공간 가구 엔티티

#### 5.4 Aisle (통로)

**파일명**: `aisles.csv`  
**최소 레코드**: 6개

```csv
aisle_id,zone_id,aisle_name,width_m,length_m,traffic_level
AISLE-001,ZONE-B,메인 통로 1,2.5,8.0,high
AISLE-002,ZONE-C,메인 통로 2,2.5,8.0,high
AISLE-003,ZONE-D,상의 구역 통로,2.0,6.0,medium
```

#### 5.5 FittingRoom (피팅룸)

**파일명**: `fitting_rooms.csv`  
**최소 레코드**: 2개

```csv
room_id,zone_id,room_number,is_available,capacity
FIT-001,ZONE-F,1,true,1
FIT-002,ZONE-F,2,true,1
```

#### 5.6 StorageRoom (창고)

**파일명**: `storage_rooms.csv`  
**최소 레코드**: 1개

```csv
storage_id,zone_id,storage_type,area_sqm,capacity_units
STG-001,ZONE-BACK,backstock,30,5000
```

#### 5.7 Shelf (진열대)

**파일명**: `shelves.csv`  
**최소 레코드**: 12개

```csv
shelf_id,zone_id,shelf_type,width_m,height_m,depth_m,capacity
SHF-001,ZONE-B,wall_mounted,3.0,2.0,0.5,50
SHF-002,ZONE-C,wall_mounted,3.0,2.0,0.5,50
SHF-003,ZONE-D,wall_mounted,3.0,2.0,0.5,50
```

#### 5.8 Rack (랙)

**파일명**: `racks.csv`  
**최소 레코드**: 8개

```csv
rack_id,zone_id,rack_type,width_m,height_m,depth_m,capacity
RCK-001,ZONE-D,clothing,1.5,1.8,0.5,30
RCK-002,ZONE-E,shoe,2.0,1.5,0.5,40
```

#### 5.9 DisplayTable (진열 테이블)

**파일명**: `display_tables.csv`  
**최소 레코드**: 6개

```csv
table_id,zone_id,table_type,width_m,depth_m,height_m,capacity
TBL-001,ZONE-B,center,2.0,1.0,0.8,20
TBL-002,ZONE-D,center,2.0,1.0,0.8,20
```

#### 5.10 Supplier (공급업체)

**파일명**: `suppliers.csv`  
**최소 레코드**: 10개

```csv
supplier_id,supplier_name,contact_person,email,phone,country,lead_time_days
SUP-001,패션 기획,김담당,kim@supplier1.com,02-1111-1111,KR,7
SUP-002,프리미엄 의류,이담당,lee@supplier2.com,02-2222-2222,KR,10
SUP-003,데님 마스터,박담당,park@supplier3.com,02-3333-3333,USA,14
```

---

### 5.11-5.13 IoT 장비

#### 5.11 Camera (카메라)

**파일명**: `cameras.csv`  
**최소 레코드**: 8개

```csv
camera_id,zone_id,camera_type,position,resolution,status
CAM-001,ZONE-A,ceiling,"{""x"":2,""y"":3,""z"":3.5}",1080p,active
CAM-002,ZONE-D,ceiling,"{""x"":10,""y"":5,""z"":3.5}",1080p,active
```

#### 5.12 Beacon (비콘)

**파일명**: `beacons.csv`  
**최소 레코드**: 4개

```csv
beacon_id,zone_id,beacon_uuid,tx_power,range_m,status
BCN-001,ZONE-B,UUID-001,-59,5,active
BCN-002,ZONE-D,UUID-002,-59,5,active
```

---

### 5.14-5.19 시뮬레이션 & 비즈니스 규칙

#### 5.14 Scenario (시나리오)

**파일명**: `scenarios.csv`  
**최소 레코드**: 10개

```csv
scenario_id,scenario_name,scenario_type,description,parameters,created_at
SCN-001,레이아웃 A 시뮬레이션,layout_optimization,입구 확장 및 동선 개선,"{""entrance_width"":4.0}",2024-11-01
SCN-002,블랙프라이데이 수요 예측,demand_forecast,11월 넷째 주 수요 예측,"{""promotion"":""BLACK_FRIDAY""}",2024-11-05
```

#### 5.15 SimulationResult (시뮬레이션 결과)

**파일명**: `simulation_results.csv`  
**최소 레코드**: 50건

```csv
result_id,scenario_id,run_date,metrics,recommendations
RES-001,SCN-001,2024-11-01,"{""traffic_improvement"":15,""conversion"":2.5}","[""입구 확장"",""동선 단순화""]"
```

#### 5.16 KPI (KPI 정의)

**파일명**: `kpis.csv`  
**최소 레코드**: 15개

```csv
kpi_id,kpi_name,category,unit,calculation_method,target_value
KPI-001,일 매출,sales,KRW,sum(total_amount),10000000
KPI-002,전환율,conversion,percent,purchases/visits*100,40
KPI-003,객단가,sales,KRW,total_amount/num_customers,150000
```

#### 5.17 KPIValue (KPI 값)

**파일명**: `kpi_values.csv`  
**최소 레코드**: 1,350건 (15개 KPI × 90일)

```csv
value_id,kpi_id,date,value,variance_from_target
VAL-001,KPI-001,2024-11-15,12500000,25
VAL-002,KPI-002,2024-11-15,42.5,6.25
```

#### 5.18 RetailConcept (리테일 개념)

**파일명**: `retail_concepts.csv`  
**최소 레코드**: 20개

```csv
concept_id,concept_name,category,description
RC-001,Zone 최적화,layout,고객 동선 기반 Zone 배치
RC-002,Cross-selling,merchandising,연관 제품 묶음 진열
```

#### 5.19 BusinessRule (비즈니스 규칙)

**파일명**: `business_rules.csv`  
**최소 레코드**: 30개

```csv
rule_id,rule_name,entity_type,condition,action,priority
BR-001,재고 부족 알림,Inventory,current_stock < minimum_stock,send_alert,high
BR-002,VIP 할인,Customer,loyalty_tier == 'platinum',apply_discount_10,medium
```

#### 5.20 DemandForecast (수요 예측)

**파일명**: `demand_forecasts.csv`  
**최소 레코드**: 200건 (200개 제품)

```csv
forecast_id,product_id,forecast_date,forecast_range,predicted_demand,confidence
FC-001,SKU-TS-001,2024-12-01,7_days,85,0.92
FC-002,SKU-TS-001,2024-12-08,7_days,78,0.88
```

---

## 6. MEDIUM 엔티티 CSV 데이터셋 (13개)

### 6.1 DailySales (일일 매출)

**파일명**: `daily_sales.csv`  
**최소 레코드**: 90건

```csv
sales_id,store_id,date,total_revenue,total_transactions,total_customers,avg_basket_size
DSALE-001,NT-FLG-001,2024-11-15,12500000,45,38,277777
DSALE-002,NT-FLG-001,2024-11-16,8900000,32,28,278125
```

---

### 6.2 InventoryHistory (재고 이력)

**파일명**: `inventory_history.csv`  
**최소 레코드**: 6,000건 (200개 제품 × 30일)

```csv
history_id,product_id,store_id,date,stock_level,movement_type,quantity,reason
INVH-001,SKU-TS-001,NT-FLG-001,2024-11-15,45,sale,-2,customer_purchase
INVH-002,SKU-TS-001,NT-FLG-001,2024-11-16,43,sale,-2,customer_purchase
INVH-003,SKU-TS-001,NT-FLG-001,2024-11-17,53,restock,10,supplier_delivery
```

---

### 6.3 ZonePerformance (구역 성과)

**파일명**: `zone_performance.csv`  
**최소 레코드**: 720건 (8개 Zone × 90일)

```csv
performance_id,zone_id,date,visitor_count,dwell_time_avg,conversion_rate,sales_amount
ZPERF-001,ZONE-A,2024-11-15,120,5.2,0,0
ZPERF-002,ZONE-D,2024-11-15,85,25.5,35,3500000
```

---

### 6.4 Task (작업)

**파일명**: `tasks.csv`  
**최소 레코드**: 100건

```csv
task_id,task_name,assigned_to,created_date,due_date,status,priority
TASK-001,재고 확인 - 티셔츠 라인,STAFF-005,2024-11-15,2024-11-16,in_progress,high
TASK-002,프로모션 POP 교체,STAFF-002,2024-11-14,2024-11-15,completed,medium
```

---

### 6.5-6.9 센서류

#### 6.5 PeopleCounter (인원 카운터)

**파일명**: `people_counters.csv`  
**최소 레코드**: 2개

```csv
counter_id,entrance_id,counter_type,status
PPC-001,ENT-MAIN-01,bidirectional,active
PPC-002,ENT-SIDE-01,bidirectional,active
```

#### 6.6 DoorSensor (도어 센서)

**파일명**: `door_sensors.csv`  
**최소 레코드**: 2개

```csv
sensor_id,entrance_id,sensor_type,status
DS-001,ENT-MAIN-01,magnetic,active
DS-002,ENT-SIDE-01,magnetic,active
```

#### 6.7-6.8 온습도 센서

**파일명**: `temperature_sensors.csv`, `humidity_sensors.csv`

```csv
sensor_id,zone_id,sensor_model,status
TS-001,ZONE-A,DHT22,active
HS-001,ZONE-A,DHT22,active
```

---

### 6.10 Alert (알림)

**파일명**: `alerts.csv`  
**최소 레코드**: 50건

```csv
alert_id,alert_type,severity,message,created_at,status,target_entity
ALT-001,stock_low,high,SKU-TS-001 재고 부족 (현재: 5),2024-11-15 09:00:00,active,SKU-TS-001
ALT-002,anomaly_detected,medium,ZONE-D 이상 트래픽 탐지,2024-11-15 14:00:00,resolved,ZONE-D
```

---

### 6.11-6.13 기타 시스템

#### 6.11 PriceOptimization (가격 최적화)

**파일명**: `price_optimizations.csv`  
**최소 레코드**: 200건 (제품별)

```csv
optimization_id,product_id,current_price,recommended_price,expected_uplift,confidence
PO-001,SKU-TS-001,29000,31000,8.5,0.85
```

#### 6.12 POS (POS 시스템)

**파일명**: `pos_terminals.csv`  
**최소 레코드**: 3개

```csv
pos_id,counter_id,model,software_version,status
POS-001,CHK-01,VeriFone VX520,v2.5.1,active
```

#### 6.13 DigitalSignage (디지털 사이니지)

**파일명**: `digital_signages.csv`  
**최소 레코드**: 4개

```csv
signage_id,zone_id,display_type,content_url,status
SIGN-001,ZONE-A,welcome_screen,https://cdn.example.com/welcome.mp4,active
```

---

## 7. LOW 엔티티 CSV 데이터셋 (5개)

### 7.1 HVAC (냉난방 시스템)

**파일명**: `hvac_systems.csv`  
**최소 레코드**: 2개

```csv
hvac_id,zone_id,system_type,target_temp_c,current_temp_c,status
HVAC-001,ZONE-A,ceiling_ac,22,21.5,active
HVAC-002,ZONE-D,ceiling_ac,22,22.3,active
```

---

## 8. 3D 모델 데이터

### 8.1 파일명 규칙

**형식**: `{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb`

- `EntityType`: ontology_entity_types.name과 일치
- `Identifier`: 식별자 (한글/영문)
- `Dimensions`: 미터 단위

### 8.2 필수 3D 모델 리스트

#### 8.2.1 매장 구조 (1개)
```
Store_NT매장_20.0x4.0x10.0.glb
```

#### 8.2.2 Zone (8개)
```
Zone_존A_4.0x4.0x4.0.glb
Zone_존B_5.0x5.0x4.0.glb
Zone_존C_5.0x5.0x4.0.glb
Zone_존D_5.0x5.0x4.0.glb
Zone_존E_5.0x5.0x4.0.glb
Zone_존F_5.0x5.0x4.0.glb
Zone_존G_5.0x5.0x4.0.glb
Zone_존H_4.0x4.0x4.0.glb
```

#### 8.2.3 가구 (12개)
```
Shelf_벽면진열대_3.0x2.0x0.5.glb
Shelf_측면진열대_2.0x1.8x0.4.glb
Rack_의류랙_1.5x1.8x0.5.glb
DisplayTable_중앙테이블_2.0x1.0x0.8.glb
CheckoutCounter_계산대_2.5x1.1x1.0.glb
FittingRoom_피팅룸_2.0x2.5x2.0.glb
```

#### 8.2.4 제품 (6개 - 카테고리별 대표)
```
Product_가방_0.4x0.3x0.2.glb
Product_하의_0.3x0.4x0.1.glb
Product_상의_0.3x0.4x0.05.glb
Product_신발_0.3x0.15x0.3.glb
Product_액세서리_0.2x0.2x0.1.glb
Product_아우터_0.4x0.5x0.1.glb
```

#### 8.2.5 IoT 장비 (6개)
```
Camera_천장카메라_0.2x0.3x0.2.glb
WiFiSensor_입구센서_0.15x0.1x0.15.glb
Beacon_비콘_0.1x0.1x0.05.glb
PeopleCounter_인원카운터_0.3x0.3x0.2.glb
```

**총 33개 3D 모델 필요**

---

## 9. 온톨로지 관계 데이터

### 9.1 CRITICAL 관계 (32개)

관계는 CSV 업로드 후 자동 생성되거나 수동으로 `graph_relations` 테이블에 삽입됩니다.

**샘플 관계 데이터**:
```csv
relation_id,source_entity_id,relation_type_id,target_entity_id,properties,weight
REL-001,STORE-001,BELONGS_TO,ORG-001,{},1.0
REL-002,ZONE-A,BELONGS_TO,STORE-001,{},1.0
REL-003,CUST-001,VISITED_STORE,STORE-001,"{""visit_count"":25}",1.0
REL-004,SKU-TS-001,BELONGS_TO_CATEGORY,CAT-007,{},1.0
REL-005,TXN-001,OCCURRED_AT_STORE,STORE-001,{},1.0
```

**자동 생성 관계** (데이터베이스 트리거):
- Customer → graph_entities (자동)
- Visit → VISITED_STORE 관계 생성
- Transaction → OCCURRED_AT_STORE 관계 생성
- Purchase → PURCHASED_PRODUCT 관계 생성

**AI 추론 관계** (infer-entity-relations Edge Function):
- Customer ↔ Product (구매 패턴 기반)
- Product ↔ Product (Cross-sell 패턴)
- Customer ↔ Zone (방문 패턴)

---

## 10. 데이터 생성 가이드

### 10.1 데이터 생성 순서

1. **조직/매장 기본 데이터** (1일차)
   - organizations.csv (1개)
   - stores.csv (1개)
   - zones.csv (8개)
   - entrances.csv (2개)
   - checkout_counters.csv (3개)

2. **제품 관련 데이터** (2일차)
   - categories.csv (20개 - 3레벨)
   - brands.csv (15개)
   - suppliers.csv (10개)
   - products.csv (200개)
   - inventory.csv (200개)
   - promotions.csv (10개)

3. **고객/거래 데이터** (3일차)
   - customers.csv (500명)
   - visits.csv (2,000건)
   - transactions.csv (1,000건)
   - purchases.csv (2,500건)

4. **직원/운영 데이터** (4일차)
   - staff.csv (15명)
   - shifts.csv (450건)
   - tasks.csv (100건)

5. **IoT/센서 데이터** (5일차)
   - wifi_sensors.csv (6개)
   - cameras.csv (8개)
   - beacons.csv (4개)
   - sensor_events.csv (10,000건)
   - customer_events.csv (5,000건)

6. **환경/외부 데이터** (6일차)
   - weather.csv (90일)
   - holidays.csv (30건)
   - economic_indicators.csv (270건)

7. **분석/성과 데이터** (7일차)
   - daily_sales.csv (90건)
   - zone_performance.csv (720건)
   - inventory_history.csv (6,000건)

8. **AI/시뮬레이션 데이터** (8일차)
   - models.csv (5개)
   - model_runs.csv (50건)
   - scenarios.csv (10개)
   - simulation_results.csv (50건)
   - demand_forecasts.csv (200건)
   - price_optimizations.csv (200건)

9. **데이터 파이프라인** (9일차)
   - data_sources.csv (3개)
   - data_source_tables.csv (10개)
   - column_mappings.csv (50개)

10. **비즈니스 규칙** (10일차)
    - kpis.csv (15개)
    - kpi_values.csv (1,350건)
    - retail_concepts.csv (20개)
    - business_rules.csv (30개)
    - alerts.csv (50건)

### 10.2 GPT Prompt 템플릿

```
다음 조건에 맞는 {entity_name} 데이터를 {count}개 생성해주세요:

**컬럼 정의**:
{column_definitions}

**데이터 분포**:
{distribution_rules}

**관계 규칙**:
{relationship_constraints}

**출력 형식**: CSV (헤더 포함)
**인코딩**: UTF-8
**날짜 형식**: YYYY-MM-DD
**시간 형식**: HH:MM:SS
```

### 10.3 Python 생성 스크립트 예시

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 고객 데이터 생성
def generate_customers(count=500):
    segments = ['VIP'] * 50 + ['Regular'] * 300 + ['New'] * 150
    age_groups = np.random.choice(['10s','20s','30s','40s','50s','60s+'], 
                                   count, 
                                   p=[0.05,0.30,0.35,0.20,0.07,0.03])
    genders = np.random.choice(['F','M','Other'], 
                                count, 
                                p=[0.60,0.38,0.02])
    
    customers = pd.DataFrame({
        'customer_id': [f'CUST-{i:04d}' for i in range(1, count+1)],
        'age_group': age_groups,
        'gender': genders,
        'customer_segment': segments,
        'signup_date': [datetime(2024,1,15) + timedelta(days=np.random.randint(0,300)) 
                        for _ in range(count)]
    })
    
    return customers

# 실행
customers = generate_customers(500)
customers.to_csv('customers.csv', index=False, encoding='utf-8')
```

### 10.4 데이터 검증 체크리스트

#### 필수 검증 항목
- [ ] 모든 CSV 파일이 UTF-8 인코딩
- [ ] 헤더가 첫 줄에 존재
- [ ] 필수 컬럼에 NULL 값 없음
- [ ] 날짜 형식 일치 (YYYY-MM-DD)
- [ ] 외래 키 참조 무결성 확인
- [ ] 카테고리 계층 구조 검증
- [ ] 재고 수량이 음수 아님
- [ ] 가격이 양수
- [ ] 전환율 40% 달성 (800/2,000)

#### SQL 검증 쿼리

```sql
-- 고아 레코드 확인 (Visit without Customer)
SELECT COUNT(*) FROM visits v
LEFT JOIN customers c ON v.customer_id = c.customer_id
WHERE c.customer_id IS NULL;

-- 전환율 검증
SELECT 
  COUNT(DISTINCT CASE WHEN did_purchase THEN visit_id END) * 100.0 / COUNT(*) as conversion_rate
FROM visits;

-- 재고 부족 제품
SELECT p.product_name, i.current_stock, i.minimum_stock
FROM inventory i
JOIN products p ON i.product_id = p.sku
WHERE i.current_stock < i.minimum_stock;
```

---

## 부록 A: 전체 엔티티 요약

| Priority | Count | Entities |
|----------|-------|----------|
| 🔴 CRITICAL | 25 | Organization, Store, Zone, Entrance, CheckoutCounter, Category, Product, Inventory, Brand, Promotion, Customer, Visit, Transaction, Purchase, Staff, Shift, WiFiSensor, DataSource, DataSourceTable, ColumnMapping, BaseEvent, CustomerEvent, SensorEvent, Model, ModelRun, ModelEmbedding, AIInsight |
| 🟡 HIGH | 19 | Weather, Holiday, EconomicIndicator, Aisle, FittingRoom, StorageRoom, Shelf, Rack, DisplayTable, Supplier, Camera, Beacon, Scenario, SimulationResult, KPI, KPIValue, RetailConcept, BusinessRule, DemandForecast |
| 🟢 MEDIUM | 13 | DailySales, InventoryHistory, ZonePerformance, Task, PeopleCounter, DoorSensor, TemperatureSensor, HumiditySensor, Alert, PriceOptimization, POS, DigitalSignage, HVAC |
| **TOTAL** | **62** | |

---

## 부록 B: 최소 데이터셋 요약

| Category | Records |
|----------|---------|
| 조직/매장 기본 | 15 |
| 제품 관련 | 445 |
| 고객/거래 | 4,000 |
| 직원/운영 | 565 |
| IoT/센서 | 15,018 |
| 환경/외부 | 390 |
| 분석/성과 | 6,810 |
| AI/시뮬레이션 | 515 |
| 데이터 파이프라인 | 63 |
| 비즈니스 규칙 | 1,465 |
| **TOTAL** | **~29,000 records** |

---

**문서 끝**
