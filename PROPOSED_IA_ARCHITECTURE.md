# NEURALTWIN 제안 IA 아키텍처

## 📋 개요

이 문서는 NEURALTWIN의 새로운 4-Tier IA 구조를 정의합니다.
기존 기능 중심 분류에서 **사용자 워크플로우 중심**으로 재구성합니다.

**핵심 철학**: Overview → Analysis → Simulation → Data Management
- **Overview**: 현재 상태 파악
- **Analysis**: 문제점 발견
- **Simulation**: 해결책 실험
- **Data Management**: 데이터 인프라 관리

---

## 🗂️ 전체 IA 구조

```
NEURALTWIN APP
├─ 1. Overview (4 pages)
├─ 2. Analysis (8 pages)
├─ 3. Simulation (6 pages)
└─ 4. Data Management (5 pages)

총 23개 페이지
```

---

## 1️⃣ Overview (4 pages)

**역할**: "지금 우리 비즈니스가 어떻게 돌아가고 있는지" + "매장/기본 설정 관리"

### 1.1 대시보드 / Dashboard
- **경로**: `/` (또는 `/dashboard`)
- **기능**:
  - 전사 KPI 요약 (매출, CVR, Sales/㎡, 인력/시간)
  - 상단 퍼널 요약 (유입→체류→피팅→구매→재방문)
  - 오늘의 AI 추천 액션 3개 하이라이트
- **기존 매핑**: DashboardPage.tsx

### 1.2 매장 관리 / Store Management
- **경로**: `/stores`
- **기능**:
  - 매장 목록, 매장 생성/수정/비활성화
  - 매장 메타(위치, 면적, 포맷, 운영시간 등) 관리
- **기존 매핑**: StoresPage.tsx

### 1.3 HQ-매장 동기화 / HQ Store Sync
- **경로**: `/hq-store-sync`
- **기능**:
  - 본사 기준 매장 마스터와 동기화
  - 외부 HQ 시스템/프랜차이즈 마스터 연동 상태
- **기존 매핑**: HQStoreSyncPage.tsx

### 1.4 설정 / Settings
- **경로**: `/settings`
- **기능**:
  - 조직/브랜드 기본 설정
  - 사용자/권한, 알림, 라이선스/플랜
- **기존 매핑**: SettingsPage.tsx

---

## 2️⃣ Analysis (8 pages)

**역할**: "어디에서 문제가 생기는지 보는 곳"

### 2-1. Store Analysis (5 pages)
**특징**: 3D 디지털트윈 매장 씬 + 피처별 UI 오버레이

#### 2.1.1 Footfall Analysis
- **경로**: `/analysis/footfall`
- **기능**: 매장별/시간대별 유입, 상권 대비 유입률
- **기존 매핑**: FootfallAnalysisPage.tsx (`/footfall-analysis`)

#### 2.1.2 Traffic Heatmap
- **경로**: `/analysis/traffic-heatmap`
- **기능**: 2D 맵 상 동선·체류 히트맵
- **기존 매핑**: TrafficHeatmapPage.tsx (`/traffic-heatmap`)

#### 2.1.3 Customer Journey
- **경로**: `/analysis/customer-journey`
- **기능**: 입구→존→피팅→캐시 주요 경로, 이탈 구간 분석
- **기존 매핑**: CustomerJourneyPage.tsx (`/customer-journey`)

#### 2.1.4 Conversion Funnel
- **경로**: `/analysis/conversion-funnel`
- **기능**: 유입→체류→체험→구매 퍼널 (브랜드/매장/세그먼트 필터)
- **기존 매핑**: ConversionFunnelPage.tsx (`/conversion-funnel`)

#### 2.1.5 Customer Analysis ✨
- **경로**: `/analysis/customer-analysis`
- **기능**: 신규/재방문, 페르소나, 채널/캠페인별 고객 인사이트
- **기존 매핑**: CustomerAnalysisPage.tsx (`/customer-analysis`)

### 2-2. Operational Analysis (3 pages)
**특징**: 3D 디지털트윈 매장 씬 + 피처별 UI 오버레이

#### 2.2.1 Inventory Status
- **경로**: `/analysis/inventory`
- **기능**: 매장별 재고 현황, 품절/과잉 경고
- **기존 매핑**: InventoryPage.tsx (`/inventory`)

#### 2.2.2 Profit Center Overview
- **경로**: `/analysis/profit-center`
- **기능**: 수요 예측 결과 요약, 매출/마진 관점 상위/하위 매장/카테고리
- **기존 매핑**: ProfitCenterPage.tsx (`/profit-center`)

#### 2.2.3 Product Performance
- **경로**: `/analysis/product-performance`
- **기능**: 카테고리/상품별 CVR, UPT, ATV, Sales/㎡, 마진 분석
- **기존 매핑**: ProductPerformancePage.tsx (`/product-performance`)

---

## 3️⃣ Simulation (6 pages)

**역할**: "실제로 바꾸기 전에, Twin 위에서 먼저 돌려보는 곳"
**특징**: 3D 디지털트윈 매장 씬 + 피처별 UI 오버레이

### 3.1 Digital Twin 3D
- **경로**: `/digital-twin-3d`
- **기능**:
  - 매장 3D 모델 관리, 존/센서 배치 편집
  - Simulation 탭의 레이아웃 시뮬레이션과 연동되는 베이스
- **기존 매핑**: DigitalTwin3DPage.tsx (`/digital-twin-3d`)
- **변경**: Data Management → Simulation으로 이동

### 3.2 Scenario Lab ✨ NEW
- **경로**: `/simulation/twin-lab`
- **기능**:
  - 시나리오 생성: 레이아웃, 스태핑, 프로모션, 가격/재고
  - KPI 예측: ΔCVR, ΔATV, ΔSales/㎡, ΔOpex, ΔProfit
  - 시나리오 비교 & 추천안 선택
- **기존 매핑**: 신규 페이지

### 3.3 Layout Simulation ✨ NEW
- **경로**: `/simulation/layout`
- **기능**:
  - Digital Twin 3D 모델 위 레이아웃 What-if
  - 존 이동/페이싱 변경에 대한 KPI 예측
- **기존 매핑**: 신규 페이지 (DigitalTwin3DPage와 연동)

### 3.4 Demand & Inventory Sim
- **경로**: `/simulation/demand-inventory`
- **기능**: 발주정책/안전재고/리드타임 변경에 따른 매출·품절·폐기 예측
- **기존 매핑**: ProfitCenterPage.tsx의 시뮬레이션 모드

### 3.5 Price Optimization Sim ✨ NEW
- **경로**: `/simulation/pricing`
- **기능**: 가격/할인률 변경에 따른 매출·마진 커브
- **기존 매핑**: 신규 페이지

### 3.6 Recommendation Strategy ✨ NEW
- **경로**: `/simulation/recommendation`
- **기능**: AI 고객 추천 정책 실험 (슬롯 수/위치/룰 변경 → uplift 예측)
- **기존 매핑**: 신규 페이지

---

## 4️⃣ Data Management (5 pages)

**역할**: "NEURALSENSE + NEURALMIND + 온톨로지"를 관리하는 개발자/데이터 담당자용 영역

### 4.1 Unified Data Import
- **경로**: `/data-import`
- **기능**: POS/CRM/ERP/센서/외부데이터 연결·스케줄·상태 모니터링
- **기존 매핑**: UnifiedDataManagementPage.tsx (`/data-import`)

### 4.2 Schema Builder
- **경로**: `/schema-builder`
- **기능**: 온톨로지 스키마(고객–방문–매장–제품–캠페인) 설계/버전관리
- **기존 매핑**: SchemaBuilderPage.tsx (`/schema-builder`)

### 4.3 Graph Analysis
- **경로**: `/graph-analysis`
- **기능**: 그래프 기반 고객–제품–매장–캠페인 관계 분석 (데이터 사이언티스트용)
- **기존 매핑**: GraphAnalysisPage.tsx (`/graph-analysis`)

### 4.4 BigData API
- **경로**: `/bigdata-api`
- **기능**: 외부 BI/데이터팀을 위한 API 키 및 엔드포인트 관리, 호출 로그
- **기존 매핑**: BigDataAPIPage.tsx (`/bigdata-api`)

### 4.5 Analytics Backend
- **경로**: `/analytics`
- **기능**: 이벤트/로그 수집 상태, 지표 정의, 백엔드 메트릭
- **기존 매핑**: AnalyticsPage.tsx (`/analytics`)

---

## 🔄 마이그레이션 맵

### 경로 변경이 필요한 페이지

| 기존 경로 | 새 경로 | 페이지 | 작업 |
|---------|--------|-------|-----|
| `/footfall-analysis` | `/analysis/footfall` | FootfallAnalysisPage | 경로 변경 |
| `/traffic-heatmap` | `/analysis/traffic-heatmap` | TrafficHeatmapPage | 경로 변경 |
| `/customer-journey` | `/analysis/customer-journey` | CustomerJourneyPage | 경로 변경 |
| `/conversion-funnel` | `/analysis/conversion-funnel` | ConversionFunnelPage | 경로 변경 |
| `/customer-analysis` | `/analysis/customer-analysis` | CustomerAnalysisPage | 경로 변경 |
| `/inventory` | `/analysis/inventory` | InventoryPage | 경로 변경 |
| `/profit-center` | `/analysis/profit-center` | ProfitCenterPage | 경로 변경 (분석 모드) |
| `/product-performance` | `/analysis/product-performance` | ProductPerformancePage | 경로 변경 |

### 경로 유지 페이지

| 경로 | 페이지 | 섹션 |
|-----|-------|-----|
| `/` | DashboardPage | Overview |
| `/stores` | StoresPage | Overview |
| `/hq-store-sync` | HQStoreSyncPage | Overview |
| `/settings` | SettingsPage | Overview |
| `/digital-twin-3d` | DigitalTwin3DPage | Simulation (섹션 이동) |
| `/data-import` | UnifiedDataManagementPage | Data Management |
| `/schema-builder` | SchemaBuilderPage | Data Management |
| `/graph-analysis` | GraphAnalysisPage | Data Management |
| `/bigdata-api` | BigDataAPIPage | Data Management |
| `/analytics` | AnalyticsPage | Data Management |

### 신규 생성 페이지

| 경로 | 페이지명 | 섹션 | 우선순위 |
|-----|---------|-----|---------|
| `/simulation/twin-lab` | ScenarioLabPage | Simulation | HIGH |
| `/simulation/layout` | LayoutSimulationPage | Simulation | HIGH |
| `/simulation/demand-inventory` | DemandInventorySimPage | Simulation | MEDIUM |
| `/simulation/pricing` | PriceOptimizationPage | Simulation | LOW |
| `/simulation/recommendation` | RecommendationStrategyPage | Simulation | LOW |

---

## 📐 섹션별 스타일 가이드

```typescript
const sectionStyles = {
  overview: {
    gradient: "from-slate-600 to-slate-800",
    icon: "📊",
    color: "slate"
  },
  analysis: {
    gradient: "from-purple-600 to-purple-800",
    icon: "🔍",
    color: "purple"
  },
  simulation: {
    gradient: "from-emerald-600 to-emerald-800",
    icon: "🧪",
    color: "emerald"
  },
  dataManagement: {
    gradient: "from-blue-600 to-blue-800",
    icon: "🗄️",
    color: "blue"
  }
};
```

---

## 🚀 구현 단계별 계획

### Phase 1: 기반 작업 (Week 1)
1. ✅ 새 IA 구조 문서화 (PROPOSED_IA_ARCHITECTURE.md)
2. ⬜ App.tsx 라우트 재구성
3. ⬜ AppSidebar.tsx 메뉴 재구성
4. ⬜ NavLink 경로 업데이트

### Phase 2: Analysis 섹션 마이그레이션 (Week 2)
1. ⬜ 기존 페이지 경로 변경 (8개)
2. ⬜ 브레드크럼/네비게이션 업데이트
3. ⬜ 사이드바 활성화 상태 수정

### Phase 3: Simulation 섹션 구축 (Week 3-4)
1. ⬜ Digital Twin 3D 섹션 이동
2. ⬜ ScenarioLabPage 신규 생성 (HIGH)
3. ⬜ LayoutSimulationPage 신규 생성 (HIGH)
4. ⬜ DemandInventorySimPage 신규 생성 (MEDIUM)

### Phase 4: 추가 기능 (Week 5-6)
1. ⬜ PriceOptimizationPage 신규 생성 (LOW)
2. ⬜ RecommendationStrategyPage 신규 생성 (LOW)
3. ⬜ 전체 UI/UX 통일성 검토
4. ⬜ 성능 최적화

---

## 🎯 주요 변경 사항 요약

### 개념적 변경
1. **기능 중심 → 워크플로우 중심**
   - 기존: Store Analysis / Profit Center / Cost Center / Data Management
   - 신규: Overview / Analysis / Simulation / Data Management

2. **분석과 시뮬레이션 분리**
   - Analysis: "현재 상태" 분석
   - Simulation: "미래 시나리오" 실험

3. **Digital Twin의 역할 재정의**
   - 기존: Data Management의 일부
   - 신규: Simulation의 핵심 베이스

### 기술적 변경
1. **라우트 구조 변경**
   - 대부분의 분석 페이지: `/[feature]` → `/analysis/[feature]`
   - 시뮬레이션 페이지: 새로운 `/simulation/[feature]` 경로

2. **사이드바 메뉴 재구성**
   - 4개 메인 섹션 (Overview, Analysis, Simulation, Data Management)
   - 각 섹션별 collapsible 그룹

3. **새 페이지 5개 추가**
   - Scenario Lab, Layout Simulation, Demand & Inventory Sim, Price Optimization, Recommendation Strategy

---

## 📊 페이지 통계

- **총 페이지 수**: 23개
  - Overview: 4개
  - Analysis: 8개
  - Simulation: 6개
  - Data Management: 5개

- **기존 페이지**: 18개
- **신규 페이지**: 5개
- **경로 변경**: 8개
- **경로 유지**: 10개

---

## 🔍 다음 단계

이 문서를 기반으로 다음 작업을 진행합니다:

1. **즉시 시작**: Phase 1 (기반 작업)
2. **1주 내**: Phase 2 (Analysis 마이그레이션)
3. **2-3주 내**: Phase 3 (Simulation 구축)
4. **4-6주 내**: Phase 4 (추가 기능)

각 단계별로 사용자 피드백을 받아 조정합니다.
