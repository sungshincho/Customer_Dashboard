# NEURALTWIN 현재 프로젝트 아키텍처

## 📊 프로젝트 현황 (2025-11-19 기준)

### 총 페이지 수: 17개
- **Core Pages**: 4개
- **Store Analysis**: 8개
- **Profit Center**: 1개
- **Cost Center**: 1개
- **Data Management**: 4개
- **Digital Twin**: 1개

---

## 🗂️ 메뉴 구조 (AppSidebar 기준)

### Core Navigation
```
📍 Dashboard (/)
📍 Stores (/stores)
📍 Settings (/settings)
```

### 1️⃣ 매장 분석 (Store Analysis)
**섹션 스타일**: Purple gradient
```
├─ 📊 Footfall Analysis (/footfall-analysis)
├─ 🗺️ Traffic Heatmap (/traffic-heatmap)
├─ 🛤️ Customer Journey (/customer-journey)
├─ 📈 Conversion Funnel (/conversion-funnel)
├─ 👥 Customer Analysis (/customer-analysis) ✨ NEW
├─ 🏪 Store Management (/stores)
├─ 🔄 HQ Store Sync (/hq-store-sync)
└─ 📦 Inventory (/inventory)
```

### 2️⃣ 수익 센터 (Profit Center)
**섹션 스타일**: Green gradient
```
└─ 💰 Demand & Inventory (/profit-center)
```

### 3️⃣ 비용 센터 (Cost Center)
**섹션 스타일**: Red gradient
```
└─ 🤖 Product Performance (/product-performance)
```

### 4️⃣ 데이터 관리 (Data Management)
**섹션 스타일**: Blue gradient
```
├─ 📥 Unified Data Import (/data-import)
├─ 🔗 Graph Analysis (/graph-analysis)
├─ 🧬 Schema Builder (/schema-builder)
├─ 📊 Analytics Dashboard (/analytics)
└─ 🌐 BigData API (/bigdata-api)
```

### 5️⃣ Digital Twin
**섹션 스타일**: Cyan gradient
```
└─ 🏬 Digital Twin 3D (/digital-twin-3d)
```

---

## 📁 파일 구조

### Core Pages (`src/core/pages/`)
```
DashboardPage.tsx      → /
AuthPage.tsx           → /auth
SettingsPage.tsx       → /settings
NotFoundPage.tsx       → * (404)
```

### Store Analysis (`src/features/store-analysis/`)
```
footfall/pages/
  ├─ FootfallAnalysisPage.tsx      → /footfall-analysis
  ├─ TrafficHeatmapPage.tsx        → /traffic-heatmap
  ├─ CustomerJourneyPage.tsx       → /customer-journey
  └─ ConversionFunnelPage.tsx      → /conversion-funnel

customer/pages/
  └─ CustomerAnalysisPage.tsx      → /customer-analysis ✨ NEW

stores/pages/
  ├─ StoresPage.tsx                → /stores
  └─ HQStoreSyncPage.tsx           → /hq-store-sync

inventory/pages/
  └─ InventoryPage.tsx             → /inventory
```

### Profit Center (`src/features/profit-center/`)
```
demand-inventory/pages/
  └─ ProfitCenterPage.tsx          → /profit-center
```

### Cost Center (`src/features/cost-center/`)
```
automation/pages/
  └─ ProductPerformancePage.tsx    → /product-performance
```

### Data Management (`src/features/data-management/`)
```
import/pages/
  └─ UnifiedDataManagementPage.tsx → /data-import

ontology/pages/
  ├─ GraphAnalysisPage.tsx         → /graph-analysis
  └─ SchemaBuilderPage.tsx         → /schema-builder

analysis/pages/
  └─ AnalyticsPage.tsx             → /analytics

bigdata/pages/
  └─ BigDataAPIPage.tsx            → /bigdata-api
```

### Digital Twin (`src/features/digital-twin/`)
```
pages/
  ├─ DigitalTwin3DPage.tsx         → /digital-twin-3d
  ├─ Setup3DDataPage.tsx           → (사용 안함 - 라우트 없음)
  └─ WiFiTrackingDemoPage.tsx      → (사용 안함 - 라우트 없음)
```

---

## 🔧 주요 컴포넌트

### Layout & Navigation
- `DashboardLayout.tsx` - 모든 페이지의 공통 레이아웃
- `AppSidebar.tsx` - 사이드바 메뉴 (5개 섹션)
- `ProtectedRoute.tsx` - 인증 보호 라우트

### Shared Components
- `StatCard.tsx` - 통계 카드
- `ThemeToggle.tsx` - 다크모드 토글
- `NavLink.tsx` - 네비게이션 링크
- `LockedFeature.tsx` - 잠긴 기능 표시 ✨ NEW
- `DataReadinessGuard.tsx` - 데이터 준비 상태 체크

---

## 🎯 최근 추가/변경 사항

### ✅ 완료된 작업
1. **Feature Flag 시스템** (`src/config/featureFlags.ts`)
   - Tier 1, 2, 3 기능 구분
   - 65개 기능 플래그 정의

2. **LockedFeature 컴포넌트**
   - Tier 2, 3 기능 잠금 UI
   - 업그레이드 안내

3. **실제 데이터 기반 Hooks**
   - `useRealSampleData.ts` - 실제 업로드 데이터 조회
   - `useCustomerSegments.ts` - 고객 세그먼트 분석
   - `usePurchasePatterns.ts` - 구매 패턴 분석

4. **Customer Analysis Page**
   - 신규 페이지 생성
   - 실제 데이터 기반 분석
   - Tier별 기능 구분

### 🚧 진행 중
- Dashboard 재구성
- AppSidebar 메뉴 재정리
- 나머지 페이지들의 Tier별 기능 적용

---

## 🗄️ 데이터베이스 테이블 (Supabase)

### 핵심 테이블
- `stores` - 매장 정보
- `user_data_imports` - 사용자 데이터 임포트
- `graph_entities` - 온톨로지 엔티티
- `graph_relations` - 온톨로지 관계
- `wifi_tracking` - WiFi 트래킹 데이터
- `wifi_zones` - WiFi 존 정보
- `products` - 제품 정보
- `inventory_levels` - 재고 수준
- `auto_order_suggestions` - 자동 발주 제안
- `neuralsense_devices` - NeuralSense 디바이스

### 데이터 관리
- `ontology_entity_types` - 엔티티 타입 정의
- `ontology_relation_types` - 관계 타입 정의
- `ontology_schema_versions` - 스키마 버전
- `user_classification_patterns` - 분류 패턴

### 분석 & 동기화
- `analysis_history` - 분석 이력
- `ai_scene_analysis` - AI 씬 분석
- `external_data_sources` - 외부 데이터 소스
- `data_sync_schedules` - 동기화 스케줄
- `data_sync_logs` - 동기화 로그

---

## 🎨 디자인 시스템

### 컬러 테마
- **Primary**: Electric Blue (#1B6BFF)
- **Background**: Dark Navy (#0A1020)
- **Gradient Effects**: Glassmorphism

### 섹션별 그라데이션
- 💜 Store Analysis - Purple
- 💚 Profit Center - Green
- ❤️ Cost Center - Red
- 💙 Data Management - Blue
- 💎 Digital Twin - Cyan

### 폰트
- **한글**: Pretendard
- **영문**: Inter

---

## 🔐 인증 시스템
- Supabase Auth 사용
- 모든 페이지 ProtectedRoute로 보호
- AuthPage에서 로그인/회원가입

---

## 📦 주요 의존성
- React 18.3.1
- React Router DOM 6.30.1
- Supabase 2.79.0
- TanStack Query 5.83.0
- Three.js (Digital Twin)
- Recharts (차트)
- shadcn/ui (UI 컴포넌트)

---

## 🚀 다음 단계 제안
1. Dashboard 페이지 재구성 (Tier별 기능)
2. AppSidebar 메뉴 간소화
3. Product Performance 페이지 실제 데이터 연동
4. Digital Twin 3D 최적화
5. 각 페이지별 Tier 기능 적용
