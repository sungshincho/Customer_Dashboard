# NEURALTWIN 구현 현황 및 상세 플랜

## 📊 현재까지 구현된 내용

### ✅ 1️⃣ Overview 섹션 (4/4 페이지 완료)

#### 1.1 대시보드 ✅
- **경로**: `/`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ KPI 카드 (방문자, 매출, 평당매출, 전환율)
  - ✅ 주간 트렌드 차트
  - ✅ 퍼널 시각화 (FunnelVisualization 컴포넌트)
  - ✅ AI 추천 카드 (AIRecommendationCard)
  - ✅ 날짜 필터 (DashboardFilters)
  - ✅ KPI 집계 (useDashboardKPI, useLatestKPIs)
- **데이터 소스**:
  - `dashboard_kpis` (집계된 KPI)
  - `ai_recommendations` (AI 추천)
- **Edge Function**:
  - ✅ `aggregate-dashboard-kpis` (KPI 집계)
  - ✅ `generate-ai-recommendations` (AI 추천 생성)

#### 1.2 매장 관리 ✅
- **경로**: `/stores`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 매장 목록 조회
  - ✅ 매장 생성/수정
  - ✅ 매장 메타데이터 관리
- **데이터 소스**: `stores`

#### 1.3 HQ-매장 동기화 ✅
- **경로**: `/hq-store-sync`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ HQ 매장 마스터 동기화
  - ✅ 매장 매핑 관리
  - ✅ 동기화 로그
- **데이터 소스**:
  - `hq_store_master`
  - `store_mappings`
  - `hq_sync_logs`
- **Edge Function**: ✅ `sync-hq-stores`

#### 1.4 설정 ✅
- **경로**: `/settings`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 프로필 설정
  - ✅ 알림 설정
  - ✅ 테마 설정

---

### ✅ 2️⃣ Analysis 섹션 (8/8 페이지 완료)

#### 2.1 Store Analysis (5/5 페이지 완료)

##### 2.1.1 Footfall Analysis ✅
- **경로**: `/analysis/footfall`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 시간대별 방문자 분석
  - ✅ 외부 컨텍스트 조인 (날씨, 공휴일, 상권)
  - ✅ 인사이트 생성
- **Hook**: `useFootfallAnalysis`
- **데이터 소스**:
  - `wifi_tracking`, `weather_data`, `holidays_events`, `regional_data`

##### 2.1.2 Traffic Heatmap ✅
- **경로**: `/analysis/traffic-heatmap`
- **구현 상태**: **완료 (3D 디지털트윈 전용으로 리팩토링)**
- **주요 기능**:
  - ✅ 3D 디지털트윈 매장 씬
  - ✅ WiFi 트래킹 기반 히트맵 오버레이
  - ✅ 시간대별 애니메이션
  - ✅ 존별 통계
  - ✅ 외부 컨텍스트 인사이트 (날씨, 이벤트)
  - ❌ 2D 히트맵 제거됨
- **Hook**: 
  - `useTrafficHeatmap` (히트맵 포인트 생성)
  - `useZoneStatistics` (존별 통계)
  - `useTrafficContext` (컨텍스트 분석)
- **컴포넌트**:
  - `Store3DViewer` (3D 씬)
  - `HeatmapOverlay3D` (히트맵 오버레이)

##### 2.1.3 Customer Journey ✅
- **경로**: `/analysis/customer-journey`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 고객 동선 패턴 분석
  - ✅ 존 전환 확률
  - ✅ 체류 시간 분석
- **Hook**: `useCustomerJourney`

##### 2.1.4 Conversion Funnel ✅
- **경로**: `/analysis/conversion-funnel`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 전환 퍼널 시각화
  - ✅ 세그먼트별 비교
  - ✅ 3D 씬 뷰
- **컴포넌트**: `ConversionFunnel`, `Store3DViewer`

##### 2.1.5 Customer Analysis ✅
- **경로**: `/analysis/customer-analysis`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 고객 세그먼트 분석
  - ✅ 구매 패턴 분석
- **Hook**: `useCustomerSegments`, `usePurchasePatterns`

#### 2.2 Operational Analysis (3/3 페이지 완료)

##### 2.2.1 Inventory Status ✅
- **경로**: `/analysis/inventory`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 재고 현황
  - ✅ 재고 부족 알림
- **데이터 소스**: `inventory_levels`, `auto_order_suggestions`

##### 2.2.2 Profit Center Overview ✅
- **경로**: `/analysis/profit-center`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 수익 센터 분석
  - ✅ 수익성 인사이트

##### 2.2.3 Product Performance ✅
- **경로**: `/analysis/product-performance`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 상품별 성과 분석
  - ✅ 카테고리별 비교

---

### ⚠️ 3️⃣ Simulation 섹션 (1/6 페이지 완료)

#### 3.1 Digital Twin 3D ✅
- **경로**: `/digital-twin-3d`
- **구현 상태**: **완료**
- **주요 기능**:
  - ✅ 3D 씬 뷰어
  - ✅ 모델 레이어 관리
  - ✅ 조명 프리셋
  - ✅ 제품 배치
  - ✅ 가구 레이아웃
  - ✅ 오버레이 관리 (히트맵, 고객 경로, WiFi 등)
- **컴포넌트**:
  - `SceneViewer`, `ModelLayerManager`, `LightingPreset`
  - `ProductPlacement`, `FurnitureLayout`
  - `HeatmapOverlay3D`, `CustomerPathOverlay`, `WiFiTrackingOverlay`

#### 3.2 Scenario Lab ❌
- **경로**: `/simulation/twin-lab`
- **구현 상태**: **미구현**
- **필요 기능**:
  - ❌ What-if 시나리오 생성 UI
  - ❌ AI 추론 연동
  - ❌ 시나리오 비교
  - ❌ 예측 결과 시각화

#### 3.3 Layout Simulation ❌
- **경로**: `/simulation/layout`
- **구현 상태**: **미구현**
- **필요 기능**:
  - ❌ 레이아웃 변경 시뮬레이션
  - ❌ AI 추론 (레이아웃 변경 → CVR 예측)
  - ❌ Before/After 비교

#### 3.4 Demand & Inventory Sim ❌
- **경로**: `/simulation/demand-inventory`
- **구현 상태**: **미구현**
- **필요 기능**:
  - ❌ 수요 예측 시뮬레이션
  - ❌ 재고 최적화 시뮬레이션
  - ❌ 외부 API 예측 데이터 활용 (날씨 예보)

#### 3.5 Price Optimization Sim ❌
- **경로**: `/simulation/pricing`
- **구현 상태**: **미구현**
- **필요 기능**:
  - ❌ 가격 탄력성 모델링
  - ❌ 최적 가격 시뮬레이션
  - ❌ 경제지표 반영

#### 3.6 Recommendation Strategy ❌
- **경로**: `/simulation/recommendation`
- **구현 상태**: **미구현**
- **필요 기능**:
  - ❌ 추천 전략 시뮬레이션
  - ❌ 트렌드/소셜 데이터 반영

---

### ✅ 4️⃣ Data Management 섹션 (5/5 페이지 완료)

#### 4.1 Unified Data Import ✅
- **경로**: `/data-import`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ CSV/Excel 파일 업로드
  - ✅ 데이터 검증
  - ✅ 스키마 매핑
  - ✅ 온톨로지 변환
- **컴포넌트**:
  - `UnifiedDataUpload`, `DataValidation`, `SchemaMapper`
- **Edge Function**:
  - ✅ `schema-etl`
  - ✅ `auto-map-etl`
  - ✅ `import-with-ontology`

#### 4.2 Schema Builder ✅
- **경로**: `/schema-builder`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 엔티티 타입 관리
  - ✅ 관계 타입 관리
  - ✅ 스키마 버전 관리
  - ✅ 그래프 시각화
- **컴포넌트**:
  - `EntityTypeManager`, `RelationTypeManager`
  - `SchemaVersionManager`, `SchemaGraphVisualization`

#### 4.3 Graph Analysis ✅
- **경로**: `/graph-analysis`
- **구현 상태**: 완료
- **주요 기능**:
  - ✅ 그래프 쿼리 빌더
  - ✅ N-hop 탐색
  - ✅ 최단 경로 찾기
- **Edge Function**: ✅ `graph-query`

#### 4.4 BigData API ✅
- **경로**: `/bigdata-api`
- **구현 상태**: **부분 완료**
- **주요 기능**:
  - ✅ 외부 데이터 소스 관리 UI
  - ✅ 동기화 스케줄 설정 UI
  - ❌ **실제 외부 API 연동 미구현**
- **필요 작업**:
  - ❌ 날씨 API 연동 (OpenWeatherMap 등)
  - ❌ 공휴일 API 연동 (한국천문연구원 등)
  - ❌ 경제지표 API 연동 (한국은행 등)
  - ❌ 자동 스케줄링 로직

#### 4.5 Analytics Backend ⚠️
- **경로**: `/analytics`
- **구현 상태**: **부분 완료**
- **주요 기능**:
  - ✅ 분석 이력 조회
  - ❌ KPI 집계 트리거 UI
  - ❌ Edge Function 관리 UI

---

## 🚨 구현해야 하는 내용 (우선순위별)

### 🔴 최우선 (Phase 2-3)

#### 1. AI 추론 Edge Function 구현
- **파일**: `supabase/functions/advanced-ai-inference/index.ts`
- **기능**:
  - Lovable AI 연동 (google/gemini-2.5-pro)
  - 온톨로지 그래프 컨텍스트 활용
  - What-if 시나리오 예측
  - ΔCVR, ΔATV, ΔSales 계산
- **입력**:
  ```typescript
  {
    storeId: string,
    scenarioType: "layout" | "demand" | "pricing" | "recommendation",
    ontologyGraph: { nodes: [], edges: [] },
    baselineData: { visits, purchases, ... },
    externalContext: { weather, events, economic },
    simulationParams: { ... }
  }
  ```
- **출력**:
  ```typescript
  {
    predictions: {
      deltaConversionRate: number,
      deltaATV: number,
      deltaSales: number,
      confidence: number
    },
    insights: string[],
    recommendations: string[]
  }
  ```

#### 2. 외부 API 데모 데이터 생성
- **목적**: Analysis 섹션의 외부 컨텍스트 기능 테스트
- **테이블**: `weather_data`, `holidays_events`, `regional_data`, `economic_indicators`
- **데이터 양**: 최소 30일치 데이터
- **스크립트**: `scripts/seed-external-context.sql`

#### 3. Scenario Lab 페이지 구현
- **파일**: `src/features/simulation/pages/ScenarioLabPage.tsx`
- **주요 기능**:
  - 시나리오 타입 선택 (Layout, Demand, Pricing, Recommendation)
  - 파라미터 입력 폼
  - AI 추론 호출
  - 예측 결과 시각화 (Before/After 비교)
  - 시나리오 저장/불러오기

---

### 🟠 중요 (Phase 4-5)

#### 4. Layout Simulation 페이지
- **파일**: `src/features/simulation/pages/LayoutSimPage.tsx`
- **주요 기능**:
  - 3D 씬에서 레이아웃 편집
  - 가구/제품 배치 변경
  - AI 추론 (레이아웃 → CVR/매출 예측)
  - Before/After 3D 뷰 비교

#### 5. Demand & Inventory Sim 페이지
- **파일**: `src/features/simulation/pages/DemandInventorySimPage.tsx`
- **주요 기능**:
  - 외부 API 예측 데이터 활용 (날씨 예보, 이벤트 일정)
  - 수요 예측 시뮬레이션
  - 재고 최적화 시뮬레이션
  - 예측 정확도 검증

#### 6. Price Optimization Sim 페이지
- **파일**: `src/features/simulation/pages/PricingSimPage.tsx`
- **주요 기능**:
  - 가격 탄력성 모델링
  - 경제지표 반영 (소비자심리지수, 물가지수)
  - 최적 가격 시뮬레이션
  - 수익 극대화 전략

#### 7. Recommendation Strategy 페이지
- **파일**: `src/features/simulation/pages/RecommendationSimPage.tsx`
- **주요 기능**:
  - 추천 알고리즘 시뮬레이션
  - 트렌드/소셜 데이터 반영
  - A/B 테스트 시뮬레이션
  - 추천 전략 최적화

---

### 🟡 선택 (Phase 6-8)

#### 8. 실제 외부 API 연동
- **BigData API 페이지 완성**
- **연동 API**:
  - 날씨 API (OpenWeatherMap, 기상청)
  - 공휴일 API (한국천문연구원, 캘린더 API)
  - 경제지표 API (한국은행, OECD)
  - 상권 데이터 API (서울 열린데이터광장 등)
- **자동 스케줄링**:
  - Cron 표현식 기반 자동 수집
  - 데이터 검증 및 저장
  - 에러 핸들링 및 로깅

#### 9. Analytics Backend UI 완성
- **KPI 집계 트리거 설정**
- **Edge Function 관리 UI**
- **분석 작업 스케줄링**

#### 10. 성능 최적화
- **wifi_heatmap_cache 활용**
  - 히트맵 데이터 사전 집계
  - 캐시 무효화 전략
- **대용량 데이터 페이징**
  - Infinite scroll
  - Virtual scrolling
- **쿼리 최적화**
  - 인덱스 추가
  - 조인 최적화

---

## 📅 구현 단계 상세 플랜

### Phase 1: 기반 작업 ✅ (Week 1) - **완료**

**목표**: 새 IA 구조 적용

- ✅ PROPOSED_IA_ARCHITECTURE.md 작성
- ✅ App.tsx 라우트 재구성
- ✅ AppSidebar.tsx 메뉴 재구성 (4개 섹션)
- ✅ 섹션별 데이터 처리 아키텍처 검토 (SECTION_DATA_ARCHITECTURE.md)

---

### Phase 2: AI 추론 인프라 구축 (Week 2-3)

**목표**: Simulation 섹션의 핵심 AI 추론 기능 구현

#### Week 2: AI 추론 Edge Function

**작업 항목**:

1. **Edge Function 기본 구조** (Day 1-2)
   ```typescript
   // supabase/functions/advanced-ai-inference/index.ts
   - CORS 설정
   - 요청 검증
   - Lovable AI 클라이언트 설정
   - 에러 핸들링 (429, 402)
   ```

2. **온톨로지 그래프 컨텍스트 빌더** (Day 3-4)
   ```typescript
   // 온톨로지 데이터를 AI 프롬프트용으로 변환
   - graph_entities, graph_relations 조회
   - 그래프 구조를 텍스트 설명으로 변환
   - 관련 엔티티 필터링 (N-hop)
   ```

3. **시나리오별 프롬프트 템플릿** (Day 5-7)
   ```typescript
   // 각 시나리오 타입별 프롬프트 작성
   - Layout: 레이아웃 변경 → CVR/매출 예측
   - Demand: 외부 컨텍스트 → 수요 예측
   - Pricing: 가격 변경 → 수익 예측
   - Recommendation: 추천 전략 → 전환율 예측
   ```

4. **테스트 및 검증** (Day 8-10)
   ```typescript
   - 단위 테스트 작성
   - 시나리오별 테스트
   - 예측 정확도 검증
   ```

**산출물**:
- ✅ `supabase/functions/advanced-ai-inference/index.ts`
- ✅ 시나리오별 프롬프트 템플릿
- ✅ 테스트 케이스

#### Week 3: 외부 API 데모 데이터 & Hook

**작업 항목**:

1. **외부 API 데모 데이터 생성** (Day 1-3)
   ```sql
   -- scripts/seed-external-context.sql
   - weather_data: 30일치 날씨 데이터 (맑음, 비, 눈, 폭염, 한파)
   - holidays_events: 공휴일, 축제, 이벤트
   - regional_data: 상권 트래픽, 유동인구
   - economic_indicators: 소비자심리지수, GDP, 물가지수
   ```

2. **AI 추론 Hook 구현** (Day 4-5)
   ```typescript
   // src/hooks/useAIInference.ts
   - useAIInference(scenarioType, params)
   - useScenarioPredictions(scenarioId)
   - useSaveScenario()
   ```

3. **시나리오 저장 테이블** (Day 6-7)
   ```sql
   -- 시나리오 저장용 테이블 마이그레이션
   CREATE TABLE simulation_scenarios (
     id UUID PRIMARY KEY,
     user_id UUID,
     store_id UUID,
     scenario_type TEXT,
     parameters JSONB,
     predictions JSONB,
     created_at TIMESTAMPTZ
   );
   ```

4. **통합 테스트** (Day 8-10)
   ```typescript
   - Edge Function + Hook 통합 테스트
   - 데모 데이터 검증
   - 예측 결과 시각화 테스트
   ```

**산출물**:
- ✅ `scripts/seed-external-context.sql`
- ✅ `src/hooks/useAIInference.ts`
- ✅ `simulation_scenarios` 테이블

---

### Phase 3: Scenario Lab 구현 (Week 4-5)

**목표**: What-if 시나리오 생성 및 시각화 UI

#### Week 4: Scenario Lab UI 기본 구조

**작업 항목**:

1. **페이지 레이아웃** (Day 1-2)
   ```typescript
   // src/features/simulation/pages/ScenarioLabPage.tsx
   - DashboardLayout
   - 시나리오 타입 선택 탭
   - 3D 씬 뷰어 (좌측)
   - 파라미터 입력 폼 (우측)
   ```

2. **시나리오 타입별 파라미터 폼** (Day 3-5)
   ```typescript
   // src/features/simulation/components/ScenarioParamsForm.tsx
   - Layout: 가구/제품 배치 선택
   - Demand: 날짜, 날씨, 이벤트 선택
   - Pricing: 상품, 가격, 할인율 입력
   - Recommendation: 추천 알고리즘, 타겟 세그먼트
   ```

3. **AI 추론 호출 및 로딩 UI** (Day 6-7)
   ```typescript
   // AI 추론 버튼 클릭 → 로딩 → 결과 표시
   - Loading Spinner
   - Progress Bar (예측 진행률)
   - 에러 핸들링 (429, 402)
   ```

4. **예측 결과 카드** (Day 8-10)
   ```typescript
   // src/features/simulation/components/PredictionResultCard.tsx
   - ΔCVR, ΔATV, ΔSales 표시
   - Confidence Score
   - AI Insights 리스트
   - Recommendations
   ```

**산출물**:
- ✅ `ScenarioLabPage.tsx`
- ✅ `ScenarioParamsForm.tsx`
- ✅ `PredictionResultCard.tsx`

#### Week 5: Scenario Lab 고급 기능

**작업 항목**:

1. **Before/After 비교 뷰** (Day 1-3)
   ```typescript
   // src/features/simulation/components/BeforeAfterComparison.tsx
   - 현재 상태 (Baseline)
   - 예측 상태 (Predicted)
   - 차트로 비교 시각화
   ```

2. **시나리오 저장/불러오기** (Day 4-5)
   ```typescript
   // 시나리오 목록 조회
   - 저장된 시나리오 리스트
   - 시나리오 상세 보기
   - 시나리오 삭제
   ```

3. **시나리오 히스토리** (Day 6-7)
   ```typescript
   // 시나리오 실행 이력
   - 타임라인 뷰
   - 예측 정확도 비교
   ```

4. **통합 테스트 및 리팩토링** (Day 8-10)
   ```typescript
   - 전체 플로우 테스트
   - 코드 리팩토링
   - 성능 최적화
   ```

**산출물**:
- ✅ `BeforeAfterComparison.tsx`
- ✅ 시나리오 저장/불러오기 UI
- ✅ 시나리오 히스토리 UI

---

### Phase 4: 추가 Simulation 페이지 (Week 6-7)

**목표**: Layout, Demand & Inventory Sim 구현

#### Week 6: Layout Simulation

**작업 항목**:

1. **Layout Editor 컴포넌트** (Day 1-4)
   ```typescript
   // src/features/simulation/components/LayoutEditor.tsx
   - 3D 씬에서 가구/제품 드래그 앤 드롭
   - 레이아웃 변경 저장
   - Undo/Redo
   ```

2. **Layout Sim 페이지** (Day 5-7)
   ```typescript
   // src/features/simulation/pages/LayoutSimPage.tsx
   - LayoutEditor 통합
   - AI 추론 연동
   - Before/After 3D 뷰 비교
   ```

3. **테스트 및 최적화** (Day 8-10)
   ```typescript
   - 레이아웃 변경 → AI 예측 플로우 테스트
   - 3D 성능 최적화
   ```

**산출물**:
- ✅ `LayoutEditor.tsx`
- ✅ `LayoutSimPage.tsx`

#### Week 7: Demand & Inventory Sim

**작업 항목**:

1. **외부 API 예측 데이터 활용** (Day 1-3)
   ```typescript
   // 날씨 예보, 이벤트 일정 데이터 조회
   - useWeatherForecast()
   - useEventCalendar()
   ```

2. **수요 예측 컴포넌트** (Day 4-6)
   ```typescript
   // src/features/simulation/components/DemandForecast.tsx
   - 상품별 수요 예측
   - 날씨/이벤트 영향 분석
   ```

3. **재고 최적화 컴포넌트** (Day 7-8)
   ```typescript
   // src/features/simulation/components/InventoryOptimization.tsx
   - 최적 재고 수준 예측
   - 재고 부족/과잉 알림
   ```

4. **통합 및 테스트** (Day 9-10)
   ```typescript
   - DemandInventorySimPage 통합
   - AI 추론 연동
   - 예측 정확도 검증
   ```

**산출물**:
- ✅ `DemandForecast.tsx`
- ✅ `InventoryOptimization.tsx`
- ✅ `DemandInventorySimPage.tsx` (기능 완성)

---

### Phase 5: Price & Recommendation Sim (Week 8-9)

**목표**: 가격 최적화 및 추천 전략 시뮬레이션

#### Week 8: Price Optimization Sim

**작업 항목**:

1. **가격 탄력성 모델링** (Day 1-4)
   ```typescript
   // src/features/simulation/components/PriceElasticity.tsx
   - 가격 변화 → 수요 변화 곡선
   - 경제지표 반영 (소비자심리지수)
   ```

2. **최적 가격 시뮬레이션** (Day 5-7)
   ```typescript
   // src/features/simulation/components/OptimalPricing.tsx
   - 수익 극대화 가격 계산
   - 할인율 최적화
   ```

3. **통합 및 테스트** (Day 8-10)
   ```typescript
   - PricingSimPage 통합
   - AI 추론 연동
   ```

**산출물**:
- ✅ `PriceElasticity.tsx`
- ✅ `OptimalPricing.tsx`
- ✅ `PricingSimPage.tsx` (기능 완성)

#### Week 9: Recommendation Strategy Sim

**작업 항목**:

1. **추천 알고리즘 시뮬레이션** (Day 1-4)
   ```typescript
   // src/features/simulation/components/RecommendationAlgorithm.tsx
   - 협업 필터링
   - 콘텐츠 기반 필터링
   - 하이브리드 접근
   ```

2. **A/B 테스트 시뮬레이션** (Day 5-7)
   ```typescript
   // src/features/simulation/components/ABTestSimulation.tsx
   - 추천 전략 A vs B 비교
   - 전환율 예측
   ```

3. **통합 및 테스트** (Day 8-10)
   ```typescript
   - RecommendationSimPage 통합
   - AI 추론 연동
   ```

**산출물**:
- ✅ `RecommendationAlgorithm.tsx`
- ✅ `ABTestSimulation.tsx`
- ✅ `RecommendationSimPage.tsx` (기능 완성)

---

### Phase 6: 외부 API 실제 연동 (Week 10-11)

**목표**: BigData API 실제 외부 API 연동

#### Week 10: 날씨 & 공휴일 API

**작업 항목**:

1. **날씨 API 연동** (Day 1-4)
   ```typescript
   // supabase/functions/fetch-weather-data/index.ts
   - OpenWeatherMap API 연동
   - 기상청 API 연동 (한국)
   - weather_data 테이블 저장
   ```

2. **공휴일 API 연동** (Day 5-7)
   ```typescript
   // supabase/functions/fetch-holidays/index.ts
   - 한국천문연구원 API 연동
   - Google Calendar API 연동
   - holidays_events 테이블 저장
   ```

3. **자동 스케줄링** (Day 8-10)
   ```typescript
   // Cron 기반 자동 수집
   - 매일 날씨 데이터 수집
   - 매월 공휴일 데이터 업데이트
   - data_sync_schedules, data_sync_logs 활용
   ```

**산출물**:
- ✅ `fetch-weather-data` Edge Function
- ✅ `fetch-holidays` Edge Function
- ✅ 자동 스케줄링 설정

#### Week 11: 경제지표 & 상권 API

**작업 항목**:

1. **경제지표 API 연동** (Day 1-5)
   ```typescript
   // supabase/functions/fetch-economic-indicators/index.ts
   - 한국은행 API 연동
   - OECD API 연동
   - economic_indicators 테이블 저장
   ```

2. **상권 데이터 API 연동** (Day 6-8)
   ```typescript
   // supabase/functions/fetch-regional-data/index.ts
   - 서울 열린데이터광장 API
   - 상권 분석 데이터
   - regional_data 테이블 저장
   ```

3. **통합 테스트** (Day 9-10)
   ```typescript
   - 모든 외부 API 연동 테스트
   - 데이터 검증
   - 에러 핸들링
   ```

**산출물**:
- ✅ `fetch-economic-indicators` Edge Function
- ✅ `fetch-regional-data` Edge Function
- ✅ BigData API 페이지 완성

---

### Phase 7: 최적화 & QA (Week 12)

**목표**: 성능 최적화 및 전체 QA

**작업 항목**:

1. **성능 최적화** (Day 1-4)
   ```typescript
   // wifi_heatmap_cache 활용
   - 히트맵 데이터 사전 집계
   - 캐시 무효화 전략
   
   // 대용량 데이터 페이징
   - Infinite scroll 구현
   - Virtual scrolling 구현
   
   // 쿼리 최적화
   - 인덱스 추가
   - 조인 최적화
   ```

2. **전체 QA** (Day 5-8)
   ```typescript
   - 기능 테스트
   - 성능 테스트
   - 사용자 시나리오 테스트
   ```

3. **문서화** (Day 9-10)
   ```markdown
   - API 문서
   - 사용자 가이드
   - 개발자 가이드
   ```

**산출물**:
- ✅ 성능 최적화 완료
- ✅ QA 리포트
- ✅ 문서화 완료

---

## 📈 진행률 요약

### 전체 페이지 (23개)
- ✅ 완료: 18개 (78%)
- ⚠️ 부분 완료: 2개 (9%)
- ❌ 미구현: 3개 (13%)

### 섹션별
- ✅ Overview: 4/4 (100%)
- ✅ Analysis: 8/8 (100%)
- ⚠️ Simulation: 1/6 (17%)
- ✅ Data Management: 5/5 (100%)

### 주요 구현 필요 항목
1. 🔴 AI 추론 Edge Function
2. 🔴 Scenario Lab 페이지
3. 🟠 Layout Simulation 페이지
4. 🟠 Demand & Inventory Sim 페이지
5. 🟠 Price Optimization Sim 페이지
6. 🟠 Recommendation Strategy 페이지
7. 🟡 실제 외부 API 연동
8. 🟡 성능 최적화

---

## 🎯 다음 단계 추천

### 즉시 시작 (Week 2)
1. **AI 추론 Edge Function 구현**
   - Lovable AI 연동
   - 온톨로지 그래프 컨텍스트 빌더
   - 시나리오별 프롬프트 템플릿

2. **외부 API 데모 데이터 생성**
   - 30일치 날씨, 공휴일, 경제지표, 상권 데이터
   - Analysis 섹션 외부 컨텍스트 기능 검증

### 단기 목표 (Week 3-5)
3. **Scenario Lab 구현**
   - What-if 시나리오 생성 UI
   - AI 추론 연동
   - Before/After 비교 시각화

### 중기 목표 (Week 6-9)
4. **추가 Simulation 페이지**
   - Layout, Demand & Inventory, Price, Recommendation Sim
   - 각 시나리오별 UI 및 AI 추론 연동

### 장기 목표 (Week 10-12)
5. **외부 API 실제 연동**
   - 날씨, 공휴일, 경제지표, 상권 API
   - 자동 스케줄링

6. **성능 최적화 & QA**
   - 캐싱 전략
   - 대용량 데이터 처리
   - 전체 시스템 검증
