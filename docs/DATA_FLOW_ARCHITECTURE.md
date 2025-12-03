# 데이터 흐름 아키텍처 문서

> 대시보드, 매장현황분석, 시뮬레이션 기능의 데이터 소스 및 테이블 연결 구조

## 목차
1. [대시보드 (Dashboard)](#1-대시보드-dashboard)
2. [매장현황분석 (Store Analysis)](#2-매장현황분석-store-analysis)
3. [시뮬레이션 (Simulation)](#3-시뮬레이션-simulation)
4. [데이터 흐름 다이어그램](#4-데이터-흐름-다이어그램)

---

## 1. 대시보드 (Dashboard)

### 1.1 주요 기능
- 일별/기간별 KPI 표시 (매출, 방문, 전환율, 평당 매출)
- 퍼널 메트릭 시각화 (Entry → Browse → Fitting → Purchase → Return)
- AI 추천 카드 표시

### 1.2 데이터 소스

| 데이터 | Hook | 테이블 | 비고 |
|--------|------|--------|------|
| KPI 데이터 | `useDashboardKPI` | `dashboard_kpis` | 일별 집계 데이터 |
| AI 추천 | `useAIRecommendations` | `ai_recommendations` | 자동 생성 추천 |
| 매장 정보 | `useSelectedStore` | `stores` | 선택된 매장 메타데이터 |

### 1.3 KPI 계산 로직

**Edge Function**: `aggregate-dashboard-kpis`

```
graph_entities (visit/purchase 엔티티)
        ↓
ontology_entity_types (타입 매칭)
        ↓
stores.metadata (매장 면적 등)
        ↓
dashboard_kpis (결과 저장)
```

| KPI 필드 | 계산 방식 | 원본 데이터 |
|----------|----------|-------------|
| `total_visits` | visit 엔티티 카운트 | `graph_entities` (entity_type = 'visit') |
| `total_purchases` | purchase 엔티티 카운트 | `graph_entities` (entity_type = 'purchase') |
| `total_revenue` | purchase.total_price 합계 | `graph_entities.properties.total_price` |
| `conversion_rate` | purchases / visits | 계산값 |
| `sales_per_sqm` | revenue / store.area_sqm | `stores.area_sqm` |
| `funnel_*` | 비율 기반 추정 | 현재 고정 비율 (개선 필요) |

### 1.4 현재 제한사항
- `funnel_metrics`: 실제 데이터가 아닌 고정 비율로 계산
- `weather_condition`, `is_holiday`: 외부 API 연동 필요
- `labor_hours`: 미연동 (staff 테이블 통합 필요)

---

## 2. 매장현황분석 (Store Analysis)

### 2.1 섹션별 분석 기능

#### A. 매장 분석 (StoreAnalysisPage)
| 기능 | Hook | 데이터 소스 |
|------|------|-------------|
| 방문자 통계 | `useFootfallAnalysis` | `visits`, `graph_entities` |
| 트래픽 히트맵 | `useTrafficHeatmap` | `wifi_tracking`, `graph_entities` |
| 존별 통계 | `useZoneStatistics` | `stores.metadata.zones` |
| 컨텍스트 인사이트 | `useTrafficContext` | AI 분석 결과 |

#### B. 고객 분석 (CustomerAnalysisPage)
| 기능 | Hook | 데이터 소스 |
|------|------|-------------|
| 고객 세그먼트 | `useCustomerSegments` | `customers`, `graph_entities` |
| 고객 여정 | `useCustomerJourney` | `visits`, `purchases`, `graph_relations` |
| 구매 패턴 | `usePurchasePatterns` | `purchases`, `products` |
| 체류 시간 | `useDwellTime` | `wifi_tracking` |

#### C. 상품 분석 (ProductAnalysisPage)
| 기능 | Hook | 데이터 소스 |
|------|------|-------------|
| 상품 성과 | `useOntologyData` | `products`, `graph_entities` |
| 재고 현황 | `useRealtimeInventory` | `inventory`, `inventory_levels` |
| 연관 상품 | `useOntologyInference` | `graph_relations` (AI 추론) |

### 2.2 주요 테이블 연결

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    customers    │────▶│     visits      │────▶│    purchases    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ graph_entities  │────▶│ graph_relations │◀────│    products     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 3. 시뮬레이션 (Simulation)

### 3.1 시뮬레이션 유형

| 유형 | 기능 | Edge Function |
|------|------|---------------|
| Layout | 레이아웃 변경 영향 예측 | `performLayoutSimulation` |
| Demand | 수요 예측 | `performDemandForecast` |
| Inventory | 재고 최적화 | `performInventoryOptimization` |
| Pricing | 가격 최적화 | `performPricingOptimization` |
| Recommendation | 추천 전략 | `performRecommendationStrategy` |

### 3.2 데이터 흐름

**Hook**: `useAIInference`
**Edge Function**: `advanced-ai-inference`

```
Frontend (useAIInference.infer)
        │
        ▼
advanced-ai-inference Edge Function
        │
        ├── Store Context 로딩
        │   ├── stores (매장 정보)
        │   ├── stores.metadata (3D 메타데이터)
        │   ├── dashboard_kpis (최근 KPI)
        │   ├── products (상품 목록)
        │   └── inventory_levels (재고)
        │
        ├── Lovable AI Gateway 호출
        │   └── google/gemini-2.5-pro
        │
        └── 예측 결과 반환
            ├── predictedKpi
            ├── confidenceScore
            ├── aiInsights
            └── recommendations
```

### 3.3 시뮬레이션별 데이터 소스

#### Layout Simulation
| 입력 데이터 | 테이블/소스 |
|-------------|-------------|
| 매장 정보 | `stores` |
| 현재 레이아웃 | `stores.metadata.storeSpaceMetadata` |
| 3D 엔티티 | `graph_entities` (zone, fixture) |
| 최근 KPI | `dashboard_kpis` |
| 상품 배치 | `products`, `inventory_levels` |

#### Demand Forecast
| 입력 데이터 | 테이블/소스 |
|-------------|-------------|
| 과거 판매 | `daily_sales`, `purchases` |
| 방문 이력 | `visits`, `funnel_metrics` |
| 외부 요인 | `weather_data`, `holidays_events` |
| 경제 지표 | `economic_indicators` |

#### Inventory Optimization
| 입력 데이터 | 테이블/소스 |
|-------------|-------------|
| 현재 재고 | `inventory`, `inventory_levels` |
| 재고 이력 | `inventory_history` |
| 판매 속도 | `purchases` |
| 리드타임 | `products.metadata` |

#### Pricing Optimization
| 입력 데이터 | 테이블/소스 |
|-------------|-------------|
| 상품 가격 | `products.price` |
| 판매 데이터 | `purchases` |
| 경쟁사 가격 | `products.metadata.competitor_price` |
| 프로모션 | `promotions` (graph_entities) |

#### Recommendation Strategy
| 입력 데이터 | 테이블/소스 |
|-------------|-------------|
| 고객 세그먼트 | `customers.segment` |
| 구매 이력 | `purchases`, `graph_relations` |
| 상품 연관성 | `graph_relations` (co-purchase) |
| 고객 선호 | `graph_entities` (customer properties) |

### 3.4 AI 모델 사용

| 모델 | 용도 | API |
|------|------|-----|
| `google/gemini-2.5-pro` | 복잡한 예측/분석 | Lovable AI Gateway |
| `google/gemini-2.5-flash` | 일반 추론 | Lovable AI Gateway |

---

## 4. 데이터 흐름 다이어그램

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard    │  Store Analysis  │  Customer/Product  │ Simulation│
│  Page         │  Page            │  Analysis Pages    │ Hub       │
└───────┬───────┴────────┬─────────┴─────────┬──────────┴────┬─────┘
        │                │                   │               │
        ▼                ▼                   ▼               ▼
┌───────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌────────────┐
│useDashboardKPI│ │useFootfallAnalysis│ │useOntology* │ │useAIInference│
│useAIRecommend │ │useTrafficHeatmap  │ │useCustomer* │ │useStoreContext│
└───────┬───────┘ └────────┬──────────┘ └──────┬──────┘ └──────┬─────┘
        │                  │                   │               │
        ▼                  ▼                   ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Client                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Database    │       │ Edge Functions│       │   Storage     │
│   Tables      │       │               │       │   Buckets     │
├───────────────┤       ├───────────────┤       ├───────────────┤
│• dashboard_kpis│      │• aggregate-*  │       │• store-data   │
│• stores        │      │• advanced-ai- │       │• 3d-models    │
│• customers     │      │  inference    │       │               │
│• products      │      │• ontology-ai- │       │               │
│• purchases     │      │  inference    │       │               │
│• visits        │      │• generate-ai- │       │               │
│• inventory     │      │  recommendations│     │               │
│• graph_entities│      └───────┬───────┘       └───────────────┘
│• graph_relations│             │
└───────────────┘               ▼
                        ┌───────────────┐
                        │ Lovable AI    │
                        │ Gateway       │
                        │ (Gemini/GPT)  │
                        └───────────────┘
```

### 4.2 데이터 동기화 흐름

```
운영 데이터 입력
        │
        ▼
┌───────────────────────────────────────┐
│          Database Triggers            │
│  • sync_customer_to_ontology          │
│  • sync_product_to_ontology           │
│  • sync_purchase_to_ontology          │
│  • sync_store_to_ontology             │
│  • sync_weather_to_ontology           │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│         graph_entities 생성           │
│  (자동 온톨로지 엔티티 변환)           │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  ontology_relation_inference_queue    │
│  (관계 추론 대기열)                    │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│    infer-entity-relations Edge Fn     │
│    (AI 기반 관계 추론)                 │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│         graph_relations 생성          │
│  (Knowledge Graph 완성)               │
└───────────────────────────────────────┘
```

---

## 5. 테이블 참조 요약

### 5.1 핵심 테이블

| 테이블 | 역할 | 사용처 |
|--------|------|--------|
| `stores` | 매장 마스터 데이터 | 전체 |
| `dashboard_kpis` | 일별 KPI 집계 | Dashboard, Simulation |
| `customers` | 고객 마스터 | Customer Analysis |
| `products` | 상품 마스터 | Product Analysis, Simulation |
| `purchases` | 거래 데이터 | 전체 분석 |
| `visits` | 방문 데이터 | Store/Customer Analysis |
| `inventory` | 재고 현황 | Product Analysis, Simulation |
| `graph_entities` | 온톨로지 엔티티 | AI 분석 전체 |
| `graph_relations` | 온톨로지 관계 | AI 추론, 연관 분석 |

### 5.2 보조 테이블

| 테이블 | 역할 |
|--------|------|
| `wifi_tracking` | WiFi 기반 동선 추적 |
| `funnel_metrics` | 퍼널 단계별 메트릭 |
| `inventory_levels` | 실시간 재고 수준 |
| `inventory_history` | 재고 변동 이력 |
| `daily_sales` | 일별 매출 집계 |
| `weather_data` | 날씨 정보 |
| `holidays_events` | 공휴일/이벤트 |
| `economic_indicators` | 경제 지표 |
| `ai_recommendations` | AI 생성 추천 |
| `ai_insights` | AI 생성 인사이트 |

---

## 6. 개선 필요 항목

### 6.1 데이터 정확도

| 항목 | 현재 상태 | 개선 방향 |
|------|----------|----------|
| Funnel Metrics | 고정 비율 | 실제 추적 데이터 연동 |
| Weather | 미연동 | weather_data 테이블 활용 |
| Holiday | 미연동 | holidays_events 테이블 활용 |
| Labor Hours | 미연동 | staff/shifts 데이터 연동 |

### 6.2 성능 최적화

| 항목 | 권장 사항 |
|------|----------|
| KPI 집계 | Cron Job으로 사전 집계 |
| 히트맵 | 시간대별 캐싱 |
| AI 추론 | 결과 캐싱 (5분) |

---

*문서 버전: 1.0*
*최종 업데이트: 2025-12-03*
