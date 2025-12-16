# Customer Dashboard 프로젝트 현황 보고서

**작성일**: 2025-12-16
**버전**: 1.0
**프로젝트명**: NeuralTwin Customer Dashboard

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개
리테일 매장을 위한 통합 분석 및 디지털 트윈 플랫폼입니다. AI 기반 인사이트, 3D 시뮬레이션, ROI 측정 기능을 제공하여 매장 운영 최적화를 지원합니다.

### 1.2 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트엔드** | React 18, TypeScript, Vite |
| **스타일링** | TailwindCSS, shadcn/ui |
| **상태관리** | Zustand, TanStack Query |
| **3D 렌더링** | Three.js, @react-three/fiber, @react-three/drei |
| **백엔드** | Supabase (PostgreSQL, Edge Functions) |
| **차트** | Recharts |
| **폼 관리** | React Hook Form, Zod |

---

## 2. 프로젝트 구조

### 2.1 디렉토리 구조

```
Customer_Dashboard/
├── src/                          # 프론트엔드 소스코드
│   ├── App.tsx                   # 메인 앱 컴포넌트
│   ├── main.tsx                  # 엔트리 포인트
│   ├── components/               # 공통 UI 컴포넌트
│   │   ├── ui/                   # shadcn/ui 컴포넌트 (40+ 컴포넌트)
│   │   ├── dashboard/            # 대시보드 관련 컴포넌트
│   │   ├── common/               # 공통 컴포넌트
│   │   ├── goals/                # 목표 설정 관련
│   │   └── notifications/        # 알림 센터
│   ├── core/                     # 코어 페이지
│   │   └── pages/                # AuthPage, DashboardPage, NotFoundPage
│   ├── features/                 # 기능별 모듈 (Feature-based 구조)
│   │   ├── insights/             # 인사이트 허브
│   │   ├── studio/               # 디지털 트윈 스튜디오
│   │   ├── roi/                  # ROI 측정
│   │   ├── settings/             # 설정 페이지
│   │   ├── simulation/           # 시뮬레이션 엔진
│   │   ├── data-management/      # 데이터 관리
│   │   ├── onboarding/           # 온보딩 위자드
│   │   └── overview/             # 오버뷰 컴포넌트
│   ├── hooks/                    # 커스텀 훅 (40+ 훅)
│   ├── types/                    # TypeScript 타입 정의
│   ├── utils/                    # 유틸리티 함수
│   ├── services/                 # 서비스 레이어
│   ├── store/                    # Zustand 스토어
│   ├── stores/                   # 추가 스토어
│   ├── config/                   # 설정 (Feature Flags 등)
│   ├── integrations/             # 외부 연동
│   │   └── supabase/             # Supabase 클라이언트 및 타입
│   └── lib/                      # 라이브러리 유틸
├── supabase/                     # Supabase 백엔드
│   ├── functions/                # Edge Functions (19개)
│   ├── migrations/               # DB 마이그레이션 (30+ 파일)
│   └── seed/                     # 시드 데이터
├── scripts/                      # 스크립트
│   └── migrations/               # 마이그레이션 스크립트
├── public/                       # 정적 파일
│   └── lighting-presets/         # 3D 조명 프리셋
├── docs/                         # 문서 (30+ 문서)
└── 설정 파일들                    # package.json, tsconfig, vite.config 등
```

---

## 3. 메인 페이지 구조

### 3.1 라우팅 구조 (4개 메인 페이지)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` `/insights` | InsightHubPage | 통합 인사이트 허브 (대시보드 + 분석 + AI 추천) |
| `/studio` | DigitalTwinStudioPage | 디지털 트윈 3D 스튜디오 |
| `/roi` | ROIMeasurementPage | ROI 측정 대시보드 |
| `/settings` | SettingsPage | 통합 설정 페이지 |
| `/auth` | AuthPage | 로그인/인증 |

### 3.2 레거시 라우트 리다이렉트
기존 라우트들은 자동으로 새 구조로 리다이렉트됩니다:
- `/overview/*` → `/insights` 또는 `/settings`
- `/analysis/*` → `/insights?tab=...`
- `/simulation/*` → `/studio`
- `/data-management/*` → `/settings?tab=data`

---

## 4. 페이지별 상세 기능

### 4.1 InsightHubPage (인사이트 허브)

통합 분석 대시보드로 6개 탭 구조:

| 탭 | 컴포넌트 | 기능 |
|----|----------|------|
| **개요 (Overview)** | OverviewTab | 핵심 KPI 대시보드, 실시간 현황 |
| **매장 (Store)** | StoreTab | 매장별 성과 분석, 존 분석 |
| **고객 (Customer)** | CustomerTab | 고객 세그먼트, 여정 분석 |
| **상품 (Product)** | ProductTab | 상품 성과, 재고 분석 |
| **예측 (Prediction)** | PredictionTab | AI 기반 수요 예측 |
| **AI추천** | AIRecommendationTab | AI 전략 추천, 실행/측정 |

### 4.2 DigitalTwinStudioPage (디지털 트윈 스튜디오)

3D 기반 매장 시뮬레이션 플랫폼:

**주요 기능:**
- 3D 매장 모델 뷰어 및 편집
- 레이어 관리 (공간, 가구, 상품)
- 히트맵 오버레이 (동선, 체류, 혼잡도)
- AI 최적화 시뮬레이션 (레이아웃, 동선, 인력)
- As-is / To-be 시나리오 비교
- 씬 저장 및 관리

**오버레이 종류:**
- HeatmapOverlay: 트래픽 히트맵
- CustomerFlowOverlay: 고객 동선
- ZoneBoundaryOverlay: 존 경계
- CustomerAvatarOverlay: 고객 아바타
- LayoutOptimizationOverlay: 레이아웃 최적화
- FlowOptimizationOverlay: 동선 최적화
- CongestionOverlay: 혼잡도 분석
- StaffingOverlay: 인력 배치

**시뮬레이션 결과 패널:**
- LayoutResultPanel: 레이아웃 결과
- FlowResultPanel: 동선 분석 결과
- CongestionResultPanel: 혼잡도 결과
- StaffingResultPanel: 인력 배치 결과

### 4.3 ROIMeasurementPage (ROI 측정)

시뮬레이션 적용 결과 추적 및 ROI 측정:

**주요 컴포넌트:**
- ROISummaryCards: KPI 요약 카드
- CategoryPerformanceTable: 카테고리별 성과
- AppliedStrategyTable: 적용된 전략 이력
- StrategyDetailModal: 전략 상세 정보
- AIInsightsCard: AI 인사이트

**기능:**
- 기간별 필터링 (7일, 30일, 90일, 전체)
- 2D/3D 시뮬레이션별 성과 분석
- 전략별 ROI 추적
- JSON 리포트 내보내기

### 4.4 SettingsPage (설정)

5개 탭 구조의 통합 설정:

| 탭 | 기능 |
|----|------|
| **매장 관리** | 매장 추가/수정/삭제, 매장 정보 |
| **데이터 관리** | 데이터 임포트, 온톨로지 스키마, API 연동 |
| **사용자 관리** | 조직 멤버, 역할 관리, 초대 |
| **시스템 설정** | 알림, 테마, 언어, 시간대 |
| **플랜 & 라이선스** | 구독 정보, 라이선스 관리 |

---

## 5. 기능 모듈 상세

### 5.1 Data Management (데이터 관리)

**import/components/**
| 컴포넌트 | 기능 |
|----------|------|
| UnifiedDataUpload | 통합 데이터 업로드 (CSV, Excel) |
| StorageManager | Supabase Storage 관리 |
| SchemaMapper | 스키마 매핑 UI |
| OntologyDataManagement | 온톨로지 데이터 관리 |
| DataValidation | 데이터 검증 |
| DataImportHistory | 임포트 이력 |
| DemoReadinessChecker | 데모 준비 상태 확인 |

**ontology/components/**
| 컴포넌트 | 기능 |
|----------|------|
| EntityTypeManager | 엔티티 타입 관리 (43개 타입) |
| RelationTypeManager | 관계 타입 관리 (89개 타입) |
| OntologyGraph3D | 3D 온톨로지 그래프 시각화 |
| SchemaGraph3D | 3D 스키마 그래프 |
| GraphQueryBuilder | 그래프 쿼리 빌더 |
| SchemaValidator | 스키마 검증 |
| MasterSchemaSync | 마스터 스키마 동기화 |

### 5.2 Simulation (시뮬레이션)

**components/**
| 컴포넌트 | 기능 |
|----------|------|
| IntegratedDataAnalysis | 통합 데이터 분석 |
| LayoutComparisonView | 레이아웃 비교 뷰 |
| SimulationControls | 시뮬레이션 제어 |
| SimulationHistoryPanel | 시뮬레이션 이력 |
| DataSourceMappingCard | 데이터 소스 매핑 |
| AIModelSelector | AI 모델 선택 |

**digital-twin/**
| 컴포넌트 | 기능 |
|----------|------|
| ModelUploader | 3D 모델 업로드 |
| ModelLayerManager | 레이어 관리 |
| SceneComposer | 씬 구성 |
| Store3DViewer | 3D 매장 뷰어 |
| SharedDigitalTwinScene | 공유 디지털 트윈 씬 |

**hooks/**
| 훅 | 기능 |
|----|------|
| useSimulationEngine | 시뮬레이션 엔진 |
| useEnhancedAIInference | AI 추론 |
| useStoreContext | 매장 컨텍스트 |
| useLayoutApply | 레이아웃 적용 |
| useRealtimeTracking | 실시간 추적 |

---

## 6. 커스텀 Hooks

### 6.1 핵심 Hooks (40+)

| 훅 | 파일 | 기능 |
|----|------|------|
| **useAuth** | useAuth.tsx | 인증, 사용자 정보, 조직, 역할 |
| **useSelectedStore** | useSelectedStore.tsx | 선택된 매장 관리 |
| **useDashboardKPI** | useDashboardKPI.ts | 대시보드 KPI 조회 |
| **useDashboardKPIAgg** | useDashboardKPIAgg.ts | 집계된 KPI |
| **useCustomerSegments** | useCustomerSegments.ts | 고객 세그먼트 |
| **useCustomerJourney** | useCustomerJourney.ts | 고객 여정 분석 |
| **useProductPerformance** | useProductPerformance.ts | 상품 성과 |
| **useFunnelAnalysis** | useFunnelAnalysis.ts | 퍼널 분석 |
| **useFootfallAnalysis** | useFootfallAnalysis.ts | 방문객 분석 |
| **useZoneMetrics** | useZoneMetrics.ts | 존 메트릭 |
| **useWiFiTracking** | useWiFiTracking.ts | WiFi 추적 데이터 |
| **useDwellTime** | useDwellTime.ts | 체류 시간 분석 |
| **useTrafficHeatmap** | useTrafficHeatmap.ts | 트래픽 히트맵 |
| **useAlerts** | useAlerts.ts | 알림 관리 |
| **useGoals** | useGoals.ts | 목표 관리 |
| **useAI** | useAI.ts | AI 기능 |
| **useUnifiedAI** | useUnifiedAI.ts | 통합 AI |
| **useAIRecommendations** | useAIRecommendations.ts | AI 추천 |
| **useOntologyData** | useOntologyData.ts | 온톨로지 데이터 |
| **useOntologySchema** | useOntologySchema.ts | 온톨로지 스키마 |
| **useOntologyInference** | useOntologyInference.ts | 온톨로지 추론 |
| **useRetailOntology** | useRetailOntology.ts | 리테일 온톨로지 |
| **useStoreScene** | useStoreScene.ts | 3D 매장 씬 |
| **useSimulationEngine** | useSimulationEngine.ts | 시뮬레이션 엔진 |
| **usePOSIntegration** | usePOSIntegration.ts | POS 연동 |
| **useRealtimeInventory** | useRealtimeInventory.ts | 실시간 재고 |
| **useROITracking** | useROITracking.ts | ROI 추적 |
| **useLearningFeedback** | useLearningFeedback.ts | AI 학습 피드백 |
| **useOnboarding** | useOnboarding.ts | 온보딩 상태 |
| **useDataReadiness** | useDataReadiness.ts | 데이터 준비 상태 |

---

## 7. Supabase Edge Functions

### 7.1 함수 목록 (19개)

| 함수명 | 기능 |
|--------|------|
| **advanced-ai-inference** | 고급 AI 추론 (139KB) + 학습 모듈 |
| **unified-ai** | 통합 AI 서비스 |
| **retail-ai-inference** | 리테일 AI 추론 |
| **unified-etl** | 통합 ETL 파이프라인 |
| **integrated-data-pipeline** | 통합 데이터 파이프라인 |
| **smart-ontology-mapping** | AI 기반 온톨로지 매핑 |
| **import-with-ontology** | 온톨로지 연동 임포트 |
| **datasource-mapper** | 데이터 소스 매퍼 |
| **auto-map-etl** | 자동 ETL 매핑 |
| **sync-api-data** | API 데이터 동기화 |
| **graph-query** | 그래프 쿼리 |
| **aggregate-dashboard-kpis** | 대시보드 KPI 집계 |
| **aggregate-all-kpis** | 전체 KPI 집계 |
| **etl-scheduler** | ETL 스케줄러 |
| **process-wifi-data** | WiFi 데이터 처리 |
| **analyze-3d-model** | 3D 모델 분석 |
| **auto-process-3d-models** | 3D 모델 자동 처리 |
| **simulation-data-mapping** | 시뮬레이션 데이터 매핑 |
| **inventory-monitor** | 재고 모니터링 |

---

## 8. 데이터베이스 스키마

### 8.1 주요 테이블 (60+ 테이블)

#### 핵심 비즈니스 테이블
| 테이블 | 설명 |
|--------|------|
| `organizations` | 조직 정보 |
| `stores` | 매장 정보 |
| `customers` | 고객 정보 |
| `products` | 상품 정보 |
| `purchases` | 구매 내역 |
| `zones` | 매장 존(구역) |

#### AI 관련 테이블
| 테이블 | 설명 |
|--------|------|
| `ai_inference_logs` | AI 추론 로그 |
| `ai_inference_results` | AI 추론 결과 |
| `ai_insights` | AI 인사이트 |
| `ai_recommendations` | AI 추천 |
| `ai_model_performance` | AI 모델 성과 |
| `ai_scene_analysis` | AI 씬 분석 |

#### 분석/KPI 테이블
| 테이블 | 설명 |
|--------|------|
| `daily_kpis_agg` | 일별 KPI 집계 |
| `customer_segments` | 고객 세그먼트 |
| `customer_segments_agg` | 고객 세그먼트 집계 |
| `analysis_history` | 분석 이력 |

#### 전략/ROI 테이블
| 테이블 | 설명 |
|--------|------|
| `applied_strategies` | 적용된 전략 |
| `auto_order_suggestions` | 자동 주문 제안 |

#### IoT/센서 테이블
| 테이블 | 설명 |
|--------|------|
| `beacons` | 비콘 정보 |
| `beacon_events` | 비콘 이벤트 |
| `camera_events` | 카메라 이벤트 |

#### 데이터 관리 테이블
| 테이블 | 설명 |
|--------|------|
| `api_connections` | API 연결 정보 |
| `column_mappings` | 컬럼 매핑 |

#### 알림/커뮤니케이션
| 테이블 | 설명 |
|--------|------|
| `alerts` | 알림 |
| `contact_submissions` | 문의 제출 |

---

## 9. 온톨로지 시스템

### 9.1 아키텍처

```
데이터 소스 → 데이터 파이프라인 → 온톨로지 스토리지 → AI 추론 → 애플리케이션
```

### 9.2 온톨로지 구성

| 구분 | 수량 | 설명 |
|------|------|------|
| Entity Types | 43개 | Customer, Product, Store, Zone 등 |
| Relation Types | 89개 | 엔티티 간 관계 정의 |
| Graph Entities | 수천~수만 | 실제 엔티티 인스턴스 |
| Graph Relations | 수만~수십만 | 엔티티 간 관계 인스턴스 |

### 9.3 데이터 파이프라인

**Phase 1: 배치 변환**
- CSV → 온톨로지
- API → 온톨로지
- AI 기반 자동 매핑

**Phase 2: 실시간 동기화**
- Database 트리거를 통한 자동 엔티티 생성
- AI 관계 추론

**Phase 3: AI 추론 (개발 중)**
- 추천 시스템
- 이상 탐지
- 패턴 분석
- 예측 모델링

---

## 10. 주요 의존성

### 10.1 프로덕션 의존성

```json
{
  "react": "^18.3.1",
  "@supabase/supabase-js": "^2.79.0",
  "@tanstack/react-query": "^5.83.0",
  "@react-three/fiber": "^8.18.0",
  "@react-three/drei": "^9.122.0",
  "three": "^0.160.1",
  "zustand": "^5.0.9",
  "recharts": "^2.15.4",
  "react-router-dom": "^6.30.1",
  "framer-motion": "^12.23.25",
  "lucide-react": "^0.462.0",
  "tailwind-merge": "^2.6.0",
  "zod": "^4.1.12",
  "react-hook-form": "^7.61.1",
  "date-fns": "^3.6.0",
  "d3-force": "^3.0.0",
  "react-force-graph-2d": "^1.29.0",
  "xlsx": "^0.18.5",
  "jspdf": "^3.0.3"
}
```

### 10.2 개발 의존성

```json
{
  "vite": "^5.4.19",
  "typescript": "^5.8.3",
  "tailwindcss": "^3.4.17",
  "eslint": "^9.32.0"
}
```

---

## 11. 설정 파일

| 파일 | 용도 |
|------|------|
| `package.json` | 프로젝트 메타데이터 및 의존성 |
| `vite.config.ts` | Vite 빌드 설정 |
| `tsconfig.json` | TypeScript 설정 |
| `tailwind.config.ts` | TailwindCSS 설정 |
| `components.json` | shadcn/ui 설정 |
| `.env` | 환경 변수 |
| `eslint.config.js` | ESLint 설정 |
| `postcss.config.js` | PostCSS 설정 |

---

## 12. 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm run lint     # 린트 실행
```

---

## 13. 문서 목록

### 13.1 주요 문서 (docs/)

| 문서 | 내용 |
|------|------|
| `CUSTOMER_DASHBOARD_SPECIFICATION.md` | 고객 대시보드 사양 |
| `NEURALTWIN_ADMIN_DASHBOARD_SPECIFICATION.md` | 관리자 대시보드 사양 |
| `NEURALTWIN_BACKEND_SPECIFICATION.md` | 백엔드 사양 |
| `ONTOLOGY_COMPLETE_ARCHITECTURE.md` | 온톨로지 아키텍처 |
| `DATA_PIPELINE_PHASE1_IMPLEMENTATION.md` | 데이터 파이프라인 구현 |
| `INTEGRATED_ARCHITECTURE_GUIDE.md` | 통합 아키텍처 가이드 |
| `SIMULATION_GUIDE.md` | 시뮬레이션 가이드 |
| `3D_MODEL_UPLOAD_SCENARIOS.md` | 3D 모델 업로드 시나리오 |
| `WIFI_TRACKING_CSV_GUIDE.md` | WiFi 추적 CSV 가이드 |
| `IOT_TRACKING_INTEGRATION.md` | IoT 추적 통합 |
| `DATA_MANAGEMENT_GUIDE.md` | 데이터 관리 가이드 |
| `HQ_ADMIN_INTEGRATION_GUIDE.md` | 본사 관리자 연동 가이드 |

---

## 14. 구현 상태 요약

### 14.1 완료된 기능 ✅

- [x] 4개 메인 페이지 구조 (Insights, Studio, ROI, Settings)
- [x] 인증 및 권한 관리
- [x] 다중 매장 지원
- [x] 대시보드 KPI 분석
- [x] 고객 세그먼트 분석
- [x] 상품 성과 분석
- [x] 3D 디지털 트윈 뷰어
- [x] 레이어 관리 시스템
- [x] 히트맵 오버레이
- [x] 시뮬레이션 엔진 (레이아웃, 동선, 혼잡도, 인력)
- [x] ROI 측정 대시보드
- [x] 온톨로지 시스템 (Phase 1, 2 완료)
- [x] 데이터 임포트 (CSV, Excel)
- [x] API 연동 시스템
- [x] AI 추론 엔진
- [x] 온보딩 위자드

### 14.2 진행 중인 기능 🔄

- [ ] 온톨로지 AI 추론 (Phase 3)
- [ ] 고급 예측 모델링
- [ ] 실시간 IoT 통합 강화

### 14.3 계획된 기능 📋

- [ ] 고급 AI 추천 시스템
- [ ] 이상 탐지 시스템
- [ ] 고급 패턴 분석
- [ ] 다국어 지원 확대

---

## 15. 개발 팀 가이드

### 15.1 코드 구조 원칙

1. **Feature-based 구조**: 기능별로 모듈화
2. **컴포넌트 분리**: UI, 로직, 타입 분리
3. **커스텀 훅 활용**: 비즈니스 로직 재사용
4. **TypeScript 엄격 모드**: 타입 안전성 확보

### 15.2 네이밍 컨벤션

- **컴포넌트**: PascalCase (예: `CustomerTab.tsx`)
- **훅**: camelCase, `use` 접두사 (예: `useAuth.tsx`)
- **타입**: PascalCase, `.types.ts` 접미사
- **유틸**: camelCase (예: `dataNormalizer.ts`)

### 15.3 새 기능 추가 시

1. `features/` 디렉토리에 새 모듈 생성
2. 컴포넌트, 훅, 타입 분리
3. 필요시 Edge Function 추가
4. 타입 정의 업데이트

---

**문서 끝**
