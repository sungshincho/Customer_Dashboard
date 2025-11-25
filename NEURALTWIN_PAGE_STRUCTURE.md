# NEURALTWIN 페이지 구조 및 Tier별 기능 명세서

## 📊 전체 페이지 구성 (총 10개)

### ✅ 유지/재구성 페이지 (8개)
1. **DashboardPage** - 대시보드 (재구성)
2. **TrafficHeatmapPage** - 히트맵 분석 (유지)
3. **ConversionFunnelPage** - 전환 퍼널 (간소화)
4. **CustomerJourneyPage** - 고객 여정 (재구성)
5. **ProductPerformancePage** - 제품 성과 분석 (재구성)
6. **DigitalTwin3DPage** - 3D Digital Twin (재구성)
7. **UnifiedDataManagementPage** - 데이터 관리 (간소화)
8. **GraphAnalysisPage** - 그래프 분석 (유지)
9. **StoresPage** - 매장 관리 (유지)

### ➕ 신규 페이지 (2개)
10. **CustomerAnalysisPage** - 고객 분석 (신규) ✅ 완료
11. **ForecastingPage** - AI 예측 (신규, Tier 3)

### ❌ 삭제된 페이지 (6개)
- ~~LayoutSimulatorPage~~ ✅ 삭제 완료
- ~~PricingOptimizerPage~~ ✅ 삭제 완료
- ~~StaffEfficiencyPage~~ ✅ 삭제 완료
- ~~CustomerRecommendationsPage~~ ✅ 삭제 완료
- ~~DemandForecastPage~~ ✅ 삭제 완료
- ~~InventoryOptimizerPage~~ ✅ 삭제 완료
- ~~ForecastsPage~~ ✅ 삭제 완료

---

## 📋 페이지별 세부 기능 명세

### 1️⃣ **DashboardPage** - 대시보드

**경로**: `/`

#### 🟢 Tier 1: Minimum Data (현재 데이터로 즉시 구현)
- ✅ **매출 요약 카드**
  - 오늘/이번 주/이번 달 매출
  - 전일 대비 증감률
  - 데이터: `purchases` 테이블
  
- ✅ **실시간 방문자 현황**
  - 현재 매장 내 방문자 수
  - 구역별 분포
  - 데이터: `wifi_tracking` 테이블
  
- ✅ **Top 5 제품**
  - 매출 기준 상위 제품
  - 판매 수량, 매출액
  - 데이터: `purchases` + `products` 테이블
  
- ✅ **고객 세그먼트 분포**
  - VIP/Regular/New 비율
  - 파이 차트 시각화
  - 데이터: `customers` + `purchases` 테이블

#### 🟡 Tier 2: External APIs
- 🔒 **날씨-매출 상관관계**
  - Weather API 연동
  - 날씨별 매출 패턴 분석
  
- 🔒 **경쟁사 실적 비교**
  - CRM API 연동
  - 업계 평균 대비 비교

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 예측 매출 트렌드**
  - 7일/30일 매출 예측
  - Lovable AI 활용
  
- 🔒 **이상 패턴 자동 감지**
  - 매출/방문자 이상치 탐지
  - 실시간 알림

---

### 2️⃣ **TrafficHeatmapPage** - 히트맵 분석

**경로**: `/traffic-heatmap`

#### 🟢 Tier 1: Minimum Data
- ✅ **2D 히트맵 시각화**
  - 구역별 방문 밀도
  - 시간대별 필터링
  - 데이터: `wifi_tracking` 테이블
  
- ✅ **구역별 체류 시간**
  - 평균 체류 시간
  - 인기 구역 순위
  
- ✅ **시간대별 트래픽**
  - 시간별 방문자 추이
  - 피크 타임 분석

#### 🟡 Tier 2: External APIs
- 🔒 **날씨 영향 분석**
  - 날씨별 방문 패턴
  - Weather API 연동

#### 🔴 Tier 3: AI Inference
- 🔒 **방문자 동선 예측**
  - AI 기반 다음 이동 경로 예측

---

### 3️⃣ **ConversionFunnelPage** - 전환 퍼널

**경로**: `/conversion-funnel`

#### 🟢 Tier 1: Minimum Data (간소화)
- ✅ **기본 전환 퍼널**
  - 방문 → 체류 → 구매
  - 단계별 전환율
  - 데이터: `visits` + `purchases` 테이블
  
- ⚠️ **제한된 세부 분석**
  - `visit_purpose`, `accompaniment` 필드 품질 낮음
  - 기본 통계만 제공

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 전환율 개선 제안**
  - 병목 구간 자동 탐지
  - 개선 전략 제안

---

### 4️⃣ **CustomerJourneyPage** - 고객 여정

**경로**: `/customer-journey`

#### 🟢 Tier 1: Minimum Data (재구성)
- ✅ **고객 동선 시각화**
  - 매장 내 이동 경로
  - 데이터: `wifi_tracking` 테이블
  
- ✅ **접점별 체류 시간**
  - 구역별 평균 체류 시간

#### 🔴 Tier 3: AI Inference
- 🔒 **고객 여정 예측**
  - 다음 방문 시점 예측
  - 개인화된 여정 추천

---

### 5️⃣ **CustomerAnalysisPage** - 고객 분석 (신규)

**경로**: `/customer-analysis` ✅ **구현 완료**

#### 🟢 Tier 1: Minimum Data
- ✅ **고객 세그먼트 분석**
  - VIP/Regular/New 분류
  - 세그먼트별 매출 기여도
  - 데이터: `customers` + `purchases` 테이블
  
- ✅ **구매 패턴 분석**
  - 시간대별 구매 패턴
  - 요일별 구매 패턴
  - 카테고리별 선호도
  
- ✅ **LTV (Lifetime Value) 분석**
  - 고객별 생애 가치
  - 세그먼트별 평균 LTV
  - LTV 분포 시각화

#### 🔴 Tier 3: AI Inference
- 🔒 **고객 이탈 위험 예측**
  - 이탈 확률 계산
  - 리텐션 전략 제안
  
- 🔒 **개인화 제품 추천**
  - 고객별 맞춤 제품 추천
  - 협업 필터링 활용

---

### 6️⃣ **ProductPerformancePage** - 제품 성과 분석

**경로**: `/product-performance`

#### 🟢 Tier 1: Minimum Data (재구성)
- ✅ **카테고리별 제품 성과**
  - 매출, 판매량, 평균 단가
  - 데이터: `products` + `purchases` 테이블
  
- ✅ **재고 회전율**
  - 제품별 회전율 계산
  - 느린 회전율 제품 경고
  
- ✅ **품절 위험 알림**
  - 재고 임계치 기반 알림
  
- ✅ **할인-매출 상관관계**
  - 할인율별 매출 변화 분석

#### 🟡 Tier 2: External APIs
- 🔒 **실시간 재고 모니터링**
  - POS API 연동
  - 실시간 재고 현황
  
- 🔒 **자동 발주 제안**
  - POS + Supply Chain API
  - 최적 발주 수량 계산

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 수요 예측**
  - 제품별 7일/30일 수요 예측
  - 계절성 패턴 반영

---

### 7️⃣ **DigitalTwin3DPage** - 3D Digital Twin

**경로**: `/digital-twin-3d`

#### 🟢 Tier 1: Minimum Data (재구성)
- ✅ **기본 3D 뷰어**
  - React Three Fiber 기반
  - 매장 구조 시각화
  - 데이터: `ontology_entity_types` (3D 모델)
  
- ✅ **실시간 고객 아바타**
  - wifi_tracking 기반 실시간 위치
  - 3D 아바타로 표시
  
- ✅ **히트맵 오버레이**
  - 방문 밀도를 3D 히트맵으로 표시
  - 투명도 조절

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 레이아웃 최적화**
  - 동선 분석 기반 최적 배치 제안
  - 시뮬레이션 비교
  
- 🔒 **진열 효율 점수**
  - 제품 배치 효율성 AI 평가
  
- 🔒 **A/B 테스트 시뮬레이션**
  - 레이아웃 변경 효과 예측

---

### 8️⃣ **UnifiedDataManagementPage** - 데이터 관리

**경로**: `/data-import`

#### 🟢 Tier 1: Minimum Data (간소화)
- ✅ **필수 필드만 체크하는 업로드**
  - 복잡한 유효성 검사 제거
  - 핵심 필드만 필수화
  
- ✅ **AI 자동 CSV 매핑**
  - 컬럼명 자동 인식
  - 스마트 매핑 제안
  
- ✅ **샘플 데이터 생성**
  - 테스트용 샘플 데이터 자동 생성
  - 데모 모드 지원
  
- ✅ **데이터 품질 점수**
  - 누락 필드 비율
  - 품질 개선 제안

#### 🟡 Tier 2: External APIs
- 🔒 **외부 API 연동**
  - POS, CRM, Weather API 등록
  - 자동 동기화 스케줄링

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 데이터 보완**
  - 누락된 연령/성별 추정
  - 패턴 기반 자동 채우기
  
- 🔒 **자동 제품 카테고리 분류**
  - 제품명 기반 AI 분류
  
- 🔒 **누락 필드 패턴 추론**
  - 기존 데이터 패턴 학습
  - 스마트 추론

---

### 9️⃣ **GraphAnalysisPage** - 그래프 분석

**경로**: `/graph-analysis`

#### 🟢 Tier 1: Minimum Data (유지)
- ✅ **기본 그래프 쿼리**
  - 고객 → 제품 → 구역 관계
  - N-hop 탐색
  - 데이터: `graph_entities` + `graph_relations` 테이블
  
- ✅ **관계 시각화**
  - 2D 그래프 뷰어
  - 노드/엣지 필터링

#### 🔴 Tier 3: AI Inference
- 🔒 **AI 관계 추론**
  - 숨겨진 관계 자동 발견
  - 추천 관계 제안
  
- 🔒 **자동 그래프 확장**
  - 유사 패턴 자동 탐색

---

### 🔟 **StoresPage** - 매장 관리

**경로**: `/stores`

#### 🟢 Tier 1: Minimum Data (유지)
- ✅ **매장 CRUD**
  - 매장 등록/수정/삭제
  - 데이터: `stores` 테이블
  
- ✅ **매장 선택**
  - 전역 매장 컨텍스트
  - 데이터 필터링

---

### 1️⃣1️⃣ **ForecastingPage** - AI 예측 (신규, Tier 3)

**경로**: `/forecasting`

#### 🔴 Tier 3: AI Inference
- 🔒 **7일/30일 매출 예측**
  - 시계열 분석
  - Lovable AI 활용
  
- 🔒 **제품별 수요 예측**
  - 제품 단위 수요 예측
  - 재고 최적화 제안
  
- 🔒 **시간대별 방문자 예측**
  - 피크 타임 예측
  - 인력 배치 최적화

---

## 📊 Tier별 기능 통계

### 🟢 Tier 1 (현재 데이터 기반)
- **총 35개 기능** 구현 가능
- 즉시 사용 가능
- 외부 의존성 없음

### 🟡 Tier 2 (외부 API 연동)
- **총 8개 기능**
- Weather API, POS API, CRM API 필요
- 선택적 구현

### 🔴 Tier 3 (AI 추론)
- **총 22개 기능**
- Lovable AI 필요
- 고급 인사이트 제공

---

## 🎯 우선순위별 구현 계획

### Phase 1: Tier 1 완성 (Week 1-2)
1. ✅ CustomerAnalysisPage 신규 생성 (완료)
2. DashboardPage 재구성
3. ProductPerformancePage 재구성
4. DigitalTwin3DPage 간소화
5. UnifiedDataManagementPage 간소화

### Phase 2: Tier 2 구현 (Week 3-4)
1. Weather API 연동
2. POS API Mock 구현
3. 자동 동기화 시스템

### Phase 3: Tier 3 구현 (Week 5-6)
1. Lovable AI Edge Functions
2. ForecastingPage 신규 생성
3. AI 데이터 보완 기능
4. AI 레이아웃 최적화

---

## 📝 현재 개발 상태

### ✅ 완료
- Feature Flag 시스템 구축
- LockedFeature 컴포넌트
- 불필요한 페이지 삭제 (6개)
- 실제 데이터 기반 Hook (useRealSampleData, useCustomerSegments, usePurchasePatterns)
- CustomerAnalysisPage 신규 생성

### 🚧 진행 중
- DashboardPage 재구성
- ProductPerformancePage 재구성
- DigitalTwin3DPage 재구성
- AppSidebar 메뉴 재구성

### 📋 대기 중
- Tier 2 외부 API 연동
- Tier 3 AI 기능 구현
- ForecastingPage 신규 생성
