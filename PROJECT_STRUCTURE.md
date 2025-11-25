# NEURALTWIN 프로젝트 구조 및 개발 가이드

> **최종 업데이트**: 2025-11-24  
> **버전**: 2.0

---

## 📋 목차

1. [현재 구현 상태](#현재-구현-상태)
2. [프로젝트 구조](#프로젝트-구조)
3. [Feature별 상세 가이드](#feature별-상세-가이드)
4. [데이터베이스 구조](#데이터베이스-구조)
5. [기술 스택](#기술-스택)
6. [개발 로드맵](#개발-로드맵)

---

## 현재 구현 상태

### ✅ 완료된 기능 (78% 완료)

#### Core (4/4)
- ✅ Dashboard - KPI 대시보드
- ✅ Stores - 매장 관리
- ✅ Settings - 설정
- ✅ Auth - 인증

#### Store Analysis (8/8)
- ✅ Footfall Analysis - 고객 동선 분석
- ✅ Traffic Heatmap - 히트맵 시각화
- ✅ Customer Journey - 고객 여정
- ✅ Conversion Funnel - 전환 퍼널
- ✅ Customer Analysis - 고객 분석
- ✅ Store Management - 매장 관리
- ✅ HQ Store Sync - 본사 동기화
- ✅ Inventory - 재고 관리

#### Data Management (5/5)
- ✅ Unified Data Import - 데이터 임포트
- ✅ Schema Builder - 온톨로지 스키마
- ✅ Graph Analysis - 그래프 분석
- ✅ BigData API - 외부 API 관리
- ✅ Analytics - 분석 백엔드

#### Digital Twin (1/1)
- ✅ Digital Twin 3D - 3D 매장 시각화

#### Cost Center (1/1)
- ✅ Product Performance - 상품 성과

### ⚠️ 진행 중 (22% 남음)

#### Simulation (1/6)
- ✅ Digital Twin 3D (데이터 시각화)
- ❌ Scenario Lab - AI 시나리오 생성
- ❌ Layout Simulation - 레이아웃 시뮬레이션
- ❌ Demand & Inventory Sim - 수요/재고 시뮬레이션
- ❌ Price Optimization Sim - 가격 최적화
- ❌ Recommendation Strategy - 추천 전략

---

## 프로젝트 구조

### 최상위 구조

```
NEURALTWIN/
├── src/                    # 소스 코드
│   ├── components/         # 공유 컴포넌트
│   ├── core/              # 핵심 페이지
│   ├── features/          # Feature-based 모듈
│   ├── hooks/             # 커스텀 훅
│   ├── integrations/      # 외부 통합
│   ├── lib/               # 라이브러리
│   ├── types/             # 타입 정의
│   └── utils/             # 유틸리티
├── supabase/              # Supabase 설정
│   ├── functions/         # Edge Functions
│   └── migrations/        # DB 마이그레이션
├── public/                # 정적 파일
└── docs/                  # 문서
```

### Feature-based 아키텍처

```
src/features/
├── store-analysis/        # 매장 분석 (Tier 1)
│   ├── footfall/         # 고객 동선
│   ├── customer/         # 고객 분석
│   ├── stores/           # 매장 관리
│   └── inventory/        # 재고 관리
│
├── simulation/            # AI 시뮬레이션 (Tier 2/3)
│   ├── components/       # 시뮬레이션 UI
│   ├── hooks/            # 시뮬레이션 로직
│   ├── pages/            # 시뮬레이션 페이지
│   └── types/            # 시뮬레이션 타입
│
├── data-management/       # 데이터 관리 (Tier 1)
│   ├── import/           # 데이터 임포트
│   ├── ontology/         # 온톨로지 스키마
│   ├── analysis/         # 데이터 분석
│   ├── bigdata/          # 외부 API
│   └── neuralsense/      # WiFi 센서
│
├── digital-twin/          # 3D Digital Twin (Tier 2)
│   ├── components/       # 3D 컴포넌트
│   │   └── overlays/    # 데이터 오버레이
│   ├── pages/            # 3D 페이지
│   ├── utils/            # 3D 유틸리티
│   └── types/            # 3D 타입
│
├── cost-center/           # 비용 센터 (Tier 1)
│   └── automation/       # 자동화
│
└── profit-center/         # 수익 센터 (Tier 3)
    └── (미래 확장)
```

---

## Feature별 상세 가이드

### 1. Store Analysis (매장 분석)

#### 1.1 Footfall Analysis
**경로**: `/footfall-analysis`

**주요 컴포넌트**:
- `FootfallVisualizer.tsx` - 방문자 시각화
- `ConversionFunnel.tsx` - 전환 퍼널
- `CustomerJourney.tsx` - 고객 여정

**관련 Hooks**:
- `useFootfallAnalysis.ts` - 방문자 분석
- `useCustomerJourney.ts` - 고객 여정
- `useZoneTransition.ts` - 존 전환

**데이터 소스**:
- `wifi_tracking` - WiFi 트래킹
- `dashboard_kpis` - KPI 집계
- `funnel_metrics` - 퍼널 메트릭

#### 1.2 Traffic Heatmap
**경로**: `/traffic-heatmap`

**주요 컴포넌트**:
- `Store3DViewer.tsx` - 3D 뷰어
- `HeatmapOverlay3D.tsx` - 히트맵 오버레이

**관련 Hooks**:
- `useTrafficHeatmap.ts` - 히트맵 데이터

**특징**:
- 3D 디지털 트윈 전용
- WiFi 트래킹 기반
- 시간대별 필터링
- 외부 컨텍스트 (날씨, 이벤트) 반영

---

### 2. Simulation (시뮬레이션)

#### 2.1 Digital Twin 3D ✅
**경로**: `/digital-twin-3d`

**주요 컴포넌트**:
- `SceneViewer.tsx` - 씬 뷰어
- `ModelLayerManager.tsx` - 레이어 관리
- `LightingPreset.tsx` - 조명 설정
- `ProductPlacement.tsx` - 제품 배치
- `FurnitureLayout.tsx` - 가구 배치

**오버레이**:
- `HeatmapOverlay3D.tsx` - 히트맵
- `CustomerPathOverlay.tsx` - 동선
- `WiFiTrackingOverlay.tsx` - WiFi 트래킹

#### 2.2 Scenario Lab ❌ (구현 필요)
**경로**: `/simulation/twin-lab`

**필요 기능**:
- What-if 시나리오 생성 UI
- AI 추론 연동 (`advanced-ai-inference`)
- 시나리오 비교
- 예측 결과 시각화

#### 2.3 Layout Simulation ❌ (구현 필요)
**경로**: `/simulation/layout`

**필요 기능**:
- 레이아웃 변경 시뮬레이션
- AI 추론 (레이아웃 → CVR 예측)
- Before/After 비교

---

### 3. Data Management (데이터 관리)

#### 3.1 Unified Data Import ✅
**경로**: `/data-import`

**주요 컴포넌트**:
- `UnifiedDataUpload.tsx` - 파일 업로드
- `DataValidation.tsx` - 데이터 검증
- `SchemaMapper.tsx` - 스키마 매핑
- `StorageManager.tsx` - 파일 관리
- `DemoReadinessChecker.tsx` - 데모 준비 상태

**Edge Functions**:
- `schema-etl` - ETL 처리
- `auto-map-etl` - 자동 매핑
- `import-with-ontology` - 온톨로지 임포트
- `integrated-data-pipeline` - 통합 파이프라인

#### 3.2 Schema Builder ✅
**경로**: `/schema-builder`

**주요 컴포넌트**:
- `EntityTypeManager.tsx` - 엔티티 타입
- `RelationTypeManager.tsx` - 관계 타입
- `SchemaVersionManager.tsx` - 버전 관리
- `SchemaGraphVisualization.tsx` - 그래프 시각화

**데이터 소스**:
- `ontology_entity_types`
- `ontology_relation_types`
- `ontology_schema_versions`

#### 3.3 Graph Analysis ✅
**경로**: `/graph-analysis`

**주요 컴포넌트**:
- `GraphQueryBuilder.tsx` - 쿼리 빌더

**Edge Functions**:
- `graph-query` - 그래프 쿼리

**주요 기능**:
- N-hop 탐색
- 최단 경로 찾기
- 그래프 시각화

---

### 4. Digital Twin (3D 디지털 트윈)

#### 구조

```
src/features/digital-twin/
├── components/
│   ├── overlays/          # 데이터 오버레이
│   │   ├── CustomerPathOverlay.tsx
│   │   ├── HeatmapOverlay3D.tsx
│   │   ├── ProductInfoOverlay.tsx
│   │   ├── WiFiTrackingOverlay.tsx
│   │   └── index.ts
│   ├── SceneViewer.tsx
│   ├── Store3DViewer.tsx
│   ├── ModelLayerManager.tsx
│   └── ...
├── pages/
│   ├── DigitalTwin3DPage.tsx
│   ├── Setup3DDataPage.tsx
│   └── WiFiTrackingDemoPage.tsx
├── utils/
│   ├── coordinateMapper.ts
│   ├── overlayDataConverter.ts
│   ├── sceneRecipeGenerator.ts
│   └── ...
└── types/
    ├── overlay.types.ts
    └── scene3d.ts
```

#### 주요 기능
- ✅ 3D 모델 로딩 (GLB/GLTF)
- ✅ 오버레이 시스템
- ✅ 조명 프리셋
- ✅ 제품/가구 배치
- ✅ 히트맵 시각화
- ✅ 고객 동선 시각화
- ✅ WiFi 트래킹 시각화

---

## 데이터베이스 구조

### 주요 테이블 (30+ 테이블)

#### 매장 관리
- `stores` - 매장 정보
- `hq_store_master` - 본사 매장 마스터
- `store_mappings` - 매장 매핑
- `hq_sync_logs` - 동기화 로그

#### 데이터 임포트 & 온톨로지
- `user_data_imports` - 업로드 데이터
- `ontology_entity_types` - 엔티티 타입
- `ontology_relation_types` - 관계 타입
- `ontology_schema_versions` - 스키마 버전
- `graph_entities` - 엔티티 인스턴스
- `graph_relations` - 관계
- `user_classification_patterns` - 분류 패턴

#### WiFi 추적 & 센서
- `neuralsense_devices` - WiFi 센서
- `wifi_tracking` - 트래킹 데이터
- `wifi_zones` - 존 정의
- `wifi_heatmap_cache` - 히트맵 캐시

#### 분석 & KPI
- `dashboard_kpis` - KPI 집계
- `funnel_metrics` - 퍼널 메트릭
- `analysis_history` - 분석 이력

#### AI & 시뮬레이션
- `scenarios` - 시나리오
- `simulation_results` - 시뮬레이션 결과
- `ai_recommendations` - AI 추천
- `ai_scene_analysis` - 3D 씬 분석

#### 재고 & 제품
- `products` - 상품 정보
- `inventory_levels` - 재고 수준
- `auto_order_suggestions` - 자동 발주

#### 3D & 씬
- `store_scenes` - 3D 씬 레시피

#### 외부 데이터
- `external_data_sources` - 외부 소스
- `data_sync_schedules` - 동기화 스케줄
- `data_sync_logs` - 동기화 로그
- `holidays_events` - 공휴일/이벤트
- `economic_indicators` - 경제 지표
- `regional_data` - 지역 데이터

---

## 기술 스택

### Frontend
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.x",
  "routing": "React Router DOM 6.30.1",
  "state": "TanStack Query 5.83.0",
  "styling": "Tailwind CSS 3.x",
  "ui": "shadcn/ui",
  "3d": "Three.js + React Three Fiber + drei",
  "charts": "Recharts 2.15.4",
  "build": "Vite 5.x"
}
```

### Backend (Lovable Cloud)
```json
{
  "platform": "Lovable Cloud (Supabase)",
  "database": "PostgreSQL 15+",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "functions": "Supabase Edge Functions (Deno)",
  "ai": "Lovable AI (Gemini, GPT)"
}
```

### 주요 라이브러리
- **폼 관리**: react-hook-form + zod
- **데이터 처리**: xlsx, jspdf, date-fns
- **그래프**: react-force-graph-2d, d3-force
- **알림**: sonner
- **다크모드**: next-themes

---

## 개발 로드맵

### Phase 1: 기반 구축 ✅ (완료)
- ✅ Feature-based 아키텍처
- ✅ 디자인 시스템
- ✅ 인증 시스템
- ✅ 데이터 임포트
- ✅ 온톨로지 스키마
- ✅ 3D Digital Twin

### Phase 2: Analysis 섹션 ✅ (완료)
- ✅ Footfall Analysis
- ✅ Traffic Heatmap
- ✅ Customer Journey
- ✅ Conversion Funnel
- ✅ Customer Analysis

### Phase 3: Simulation 섹션 ⚠️ (진행 중)
**목표**: AI 시뮬레이션 기능 구현

#### Week 1-2: AI 추론 인프라
- [ ] `advanced-ai-inference` Edge Function 구현
- [ ] 외부 API 데모 데이터 생성
- [ ] `useAIInference` Hook 구현

#### Week 3-4: Scenario Lab
- [ ] Scenario Lab 페이지 UI
- [ ] AI 추론 연동
- [ ] 예측 결과 시각화
- [ ] 시나리오 저장/불러오기

#### Week 5-6: Layout Simulation
- [ ] Layout Simulation 페이지
- [ ] 3D 레이아웃 편집
- [ ] AI 추론 (레이아웃 → CVR)
- [ ] Before/After 비교

#### Week 7-8: Demand & Inventory Sim
- [ ] Demand & Inventory Sim 페이지
- [ ] 외부 API 예측 데이터 활용
- [ ] 수요 예측 시뮬레이션
- [ ] 재고 최적화 시뮬레이션

#### Week 9-10: Price & Recommendation
- [ ] Price Optimization Sim 페이지
- [ ] Recommendation Strategy 페이지
- [ ] AI 추론 연동
- [ ] 통합 테스트

### Phase 4: 외부 API 연동 (향후)
- [ ] 날씨 API (OpenWeatherMap)
- [ ] 공휴일 API (한국천문연구원)
- [ ] 경제지표 API (한국은행)
- [ ] 자동 스케줄링

### Phase 5: 최적화 (향후)
- [ ] 성능 최적화
- [ ] 캐시 전략
- [ ] 대용량 데이터 처리
- [ ] 모바일 최적화

---

## 관련 문서

### 필수 문서
- **[NEURALTWIN_COMPLETE_ARCHITECTURE.md](./NEURALTWIN_COMPLETE_ARCHITECTURE.md)** - 완전한 시스템 아키텍처
- **[ONBOARDING.md](./ONBOARDING.md)** - 온보딩 가이드
- **[COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)** - 협업 가이드

### 통합 가이드
- **[DIGITAL_TWIN_3D_INTEGRATION.md](./DIGITAL_TWIN_3D_INTEGRATION.md)** - 3D 통합 가이드

### 기술 문서 (docs/)
- `3D_MODEL_FILENAME_SPECIFICATION.md`
- `DEMO_DATASET_REQUIREMENTS.md`
- `WIFI_TRACKING_CSV_GUIDE.md`
- `SIMULATION_GUIDE.md`
- `CORRECTED_DATASET_STRUCTURE.md`
- `DATA_MANAGEMENT_GUIDE.md`

---

**최종 업데이트**: 2025-11-24  
**작성자**: NEURALTWIN Development Team  
**버전**: 2.0
