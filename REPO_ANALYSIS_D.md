# REPO_ANALYSIS_D — Customer Dashboard 프로젝트 분석

> 분석 일자: 2026-02-23

---

## 섹션 1: 프로젝트 구조

### 1.1 디렉토리 트리 (3레벨 깊이)

```
Customer_Dashboard/
├── .github/
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── docs/
│   ├── reports/
│   │   └── store-tab-chatbot-issues-2026-02-12.md
│   └── review/
│       └── NEURALTWIN_*.md (20+ 리뷰 문서)
├── public/
│   ├── lighting-presets/
│   │   ├── cool-modern.json
│   │   ├── dramatic-spot.json
│   │   └── warm-retail.json
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── scripts/
│   └── migrations/
│       └── *.sql (마이그레이션 스크립트)
├── src/
│   ├── components/
│   │   ├── chat/                    # 챗봇 UI 컴포넌트
│   │   ├── common/                  # 공통 컴포넌트
│   │   ├── dashboard/               # 대시보드 전용 컴포넌트
│   │   ├── goals/                   # 목표 설정/진행 위젯
│   │   ├── notifications/           # 알림 시스템
│   │   └── ui/                      # shadcn/ui 컴포넌트 (60+)
│   ├── config/                      # 앱 설정
│   ├── core/
│   │   └── pages/                   # AuthPage, NotFoundPage
│   ├── features/
│   │   ├── assistant/               # AI 어시스턴트
│   │   ├── data-control/            # 데이터 컨트롤타워
│   │   ├── data-management/         # ETL & 온톨로지
│   │   ├── insights/                # 분석 & AI 추천
│   │   ├── onboarding/              # 온보딩 플로우
│   │   ├── roi/                     # ROI 측정
│   │   ├── settings/                # 설정 페이지
│   │   ├── simulation/              # 시뮬레이션 엔진
│   │   └── studio/                  # 3D 디지털 트윈 스튜디오
│   ├── hooks/                       # 커스텀 React 훅 (50+)
│   ├── integrations/
│   │   └── supabase/                # Supabase 클라이언트
│   ├── lib/
│   │   └── storage/                 # 스토리지 유틸
│   ├── services/                    # 비즈니스 로직 서비스
│   ├── store/                       # Zustand 스토어
│   ├── stores/                      # Zustand 스토어 (추가)
│   ├── types/                       # TypeScript 타입 정의
│   ├── utils/                       # 유틸리티 함수
│   ├── App.tsx                      # 메인 앱 컴포넌트
│   ├── App.css
│   ├── index.css
│   ├── main.tsx                     # Vite 진입점
│   └── vite-env.d.ts
├── supabase/
│   ├── functions/                   # Edge Functions (36개)
│   │   └── _shared/                 # 공유 유틸리티
│   ├── migrations/                  # DB 마이그레이션 (40+)
│   ├── queries/                     # SQL 쿼리
│   ├── seed/                        # 시드 데이터
│   └── seeds/                       # 시드 데이터 (추가)
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── postcss.config.js
├── components.json
├── index.html
└── .env
```

### 1.2 주요 진입점 및 라우트 (React Router SPA)

> **참고:** 이 프로젝트는 Next.js App Router가 아닌 **Vite + React Router** 기반 SPA입니다.

| 라우트 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/auth` | `AuthPage` | 인증 페이지 |
| `/` | `InsightHubPage` | 메인 대시보드 (인사이트 허브) |
| `/insights` | `InsightHubPage` | 인사이트 분석 |
| `/studio` | `DigitalTwinStudioPage` | 3D 디지털 트윈 스튜디오 |
| `/roi` | `ROIMeasurementPage` | ROI 측정 |
| `/settings` | `SettingsPage` | 설정 |
| `/data/control-tower` | `DataControlTowerPage` | 데이터 컨트롤타워 |
| `/data/lineage` | `LineageExplorerPage` | 데이터 리니지 탐색 |
| `/data/connectors/:id` | `ConnectorSettingsPage` | 커넥터 설정 |
| `*` | `NotFoundPage` | 404 페이지 |

**레거시 리다이렉트 라우트:**
- `/overview/*` → `/insights` 또는 `/settings`
- `/analysis/*` → `/insights?tab=...`
- `/simulation/*` → `/studio`
- `/data-management/*` → `/settings?tab=data`

### 1.3 파일 수 & 코드 라인 수

| 구분 | 파일 수 | 코드 라인 수 |
|---|---:|---:|
| TypeScript (`.ts`) — src | 192 | 60,996 |
| TypeScript React (`.tsx`) — src | 241 | 80,365 |
| TypeScript (`.ts`) — supabase functions | 101 | 54,516 |
| CSS (`.css`) | 2 | 1,133 |
| SQL (`.sql`) — scripts + supabase | 124 | 45,740 |
| JavaScript (`.js`) — config only | 2 | — |
| Markdown (`.md`) — docs | 81 | — |
| **합계** | **~743** | **~242,750** |

### 1.4 프레임워크 & 주요 라이브러리

| 항목 | 기술 |
|---|---|
| **빌드 도구** | Vite 5.4.19 + SWC (vitejs/plugin-react-swc) |
| **프론트엔드 프레임워크** | React 18.3.1 |
| **라우팅** | React Router DOM 6.30.1 |
| **언어** | TypeScript 5.8.3 |
| **스타일링** | Tailwind CSS 3.4.17 + PostCSS + Autoprefixer |
| **UI 컴포넌트** | shadcn/ui (Radix UI 기반, 60+ 컴포넌트) |
| **상태 관리** | Zustand 5.0.9 |
| **서버 상태** | TanStack React Query 5.83.0 |
| **3D 렌더링** | Three.js 0.160.1 + React Three Fiber 8.18.0 + Drei 9.122.0 |
| **차트** | Recharts 2.15.4 + d3-force 3.0.0 |
| **백엔드** | Supabase (PostgreSQL + Edge Functions) |
| **폼 관리** | React Hook Form 7.61.1 + Zod 4.1.12 |
| **애니메이션** | Framer Motion 12.23.25 |
| **내보내기** | jsPDF 3.0.3, xlsx 0.18.5 |

### 1.5 설정 파일 목록

| 파일 | 용도 |
|---|---|
| `tsconfig.json` | TypeScript 루트 설정 (프로젝트 레퍼런스) |
| `tsconfig.app.json` | 앱 소스 TypeScript 설정 |
| `tsconfig.node.json` | Node.js 환경 TypeScript 설정 |
| `vite.config.ts` | Vite 빌드 설정 (포트 8080, React SWC 플러그인) |
| `tailwind.config.ts` | Tailwind CSS 테마 & 플러그인 설정 |
| `postcss.config.js` | PostCSS 플러그인 (tailwindcss, autoprefixer) |
| `eslint.config.js` | ESLint v9 flat config (React Hooks, React Refresh, TypeScript) |
| `components.json` | shadcn/ui 컴포넌트 레지스트리 설정 |
| `index.html` | Vite SPA HTML 엔트리포인트 |
| `.gitignore` | Git 무시 파일 규칙 |

---

## 섹션 2: 의존성 맵

### 2.1 프레임워크 코어

| 패키지 | 버전 | 용도 |
|---|---|---|
| `react` | ^18.3.1 | UI 라이브러리 |
| `react-dom` | ^18.3.1 | React DOM 렌더러 |
| `react-router-dom` | ^6.30.1 | 클라이언트 사이드 라우팅 |
| `vite` | ^5.4.19 | 빌드 도구 & 개발 서버 |
| `@vitejs/plugin-react-swc` | ^3.11.0 | Vite React SWC 플러그인 |
| `typescript` | ^5.8.3 | 정적 타입 검사 |

### 2.2 3D / 시각화

| 패키지 | 버전 | 용도 |
|---|---|---|
| `three` | ^0.160.1 | 3D 그래픽 엔진 |
| `@react-three/fiber` | ^8.18.0 | React용 Three.js 렌더러 |
| `@react-three/drei` | ^9.122.0 | Three.js 유틸리티 & 헬퍼 |
| `@react-three/postprocessing` | ^2.16.2 | 포스트 프로세싱 이펙트 |
| `postprocessing` | ^6.36.0 | 후처리 효과 라이브러리 |

### 2.3 차트 / 그래프

| 패키지 | 버전 | 용도 |
|---|---|---|
| `recharts` | ^2.15.4 | React 차트 라이브러리 (메인) |
| `d3-force` | ^3.0.0 | 포스 다이어그램 물리 시뮬레이션 |
| `react-force-graph-2d` | ^1.29.0 | 2D 포스 그래프 시각화 (데이터 리니지 등) |

### 2.4 UI 라이브러리

| 패키지 | 버전 | 용도 |
|---|---|---|
| `tailwindcss` | ^3.4.17 | 유틸리티 퍼스트 CSS |
| `tailwindcss-animate` | ^1.0.7 | Tailwind 애니메이션 플러그인 |
| `tailwind-merge` | ^2.6.0 | Tailwind 클래스 병합 유틸 |
| `@tailwindcss/typography` | ^0.5.16 | Tailwind 타이포그래피 플러그인 |
| `@radix-ui/react-*` | 다수 | Headless UI 프리미티브 (shadcn/ui 기반) |
| `class-variance-authority` | ^0.7.1 | 조건부 클래스 변형 관리 |
| `clsx` | ^2.1.1 | 조건부 className 병합 |
| `lucide-react` | ^0.462.0 | 아이콘 라이브러리 |
| `cmdk` | ^1.1.1 | 커맨드 팔레트 UI |
| `sonner` | ^1.7.4 | 토스트 알림 |
| `vaul` | ^0.9.9 | 드로어 컴포넌트 |
| `embla-carousel-react` | ^8.6.0 | 캐러셀 컴포넌트 |
| `input-otp` | ^1.4.2 | OTP 입력 컴포넌트 |
| `react-day-picker` | ^8.10.1 | 날짜 선택기 |
| `react-resizable-panels` | ^2.1.9 | 리사이즈 가능한 패널 레이아웃 |
| `next-themes` | ^0.3.0 | 다크/라이트 테마 전환 |
| `framer-motion` | ^12.23.25 | 애니메이션 라이브러리 |

**Radix UI 컴포넌트 전체 목록 (shadcn/ui 기반):**
`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `collapsible`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `slider`, `slot`, `switch`, `tabs`, `toast`, `toggle`, `toggle-group`, `tooltip`

### 2.5 상태 관리

| 패키지 | 버전 | 용도 |
|---|---|---|
| `zustand` | ^5.0.9 | 경량 전역 상태 관리 |
| `@tanstack/react-query` | ^5.83.0 | 서버 상태 관리 & 데이터 캐싱 |

### 2.6 데이터 페칭 / 백엔드

| 패키지 | 버전 | 용도 |
|---|---|---|
| `@supabase/supabase-js` | ^2.79.0 | Supabase 클라이언트 (인증, DB, Edge Functions) |
| `@tanstack/react-query` | ^5.83.0 | 비동기 데이터 페칭 & 캐싱 |

### 2.7 폼 & 유효성 검증

| 패키지 | 버전 | 용도 |
|---|---|---|
| `react-hook-form` | ^7.61.1 | React 폼 관리 |
| `@hookform/resolvers` | ^3.10.0 | 폼 유효성 검증 어댑터 |
| `zod` | ^4.1.12 | 스키마 기반 유효성 검증 |

### 2.8 유틸리티

| 패키지 | 버전 | 용도 |
|---|---|---|
| `date-fns` | ^3.6.0 | 날짜 유틸리티 |
| `jspdf` | ^3.0.3 | PDF 생성 |
| `xlsx` | ^0.18.5 | 엑셀 파일 읽기/쓰기 |

### 2.9 개발 도구

| 패키지 | 버전 | 용도 |
|---|---|---|
| `eslint` | ^9.32.0 | 코드 린팅 |
| `@eslint/js` | ^9.32.0 | ESLint JavaScript 규칙 |
| `eslint-plugin-react-hooks` | ^5.2.0 | React Hooks 린트 규칙 |
| `eslint-plugin-react-refresh` | ^0.4.20 | React Refresh 린트 규칙 |
| `typescript-eslint` | ^8.38.0 | TypeScript ESLint 통합 |
| `globals` | ^15.15.0 | ESLint 전역 변수 정의 |
| `autoprefixer` | ^10.4.21 | CSS 벤더 프리픽스 자동 추가 |
| `postcss` | ^8.5.6 | CSS 후처리 도구 |
| `lovable-tagger` | ^1.1.11 | Lovable 컴포넌트 태깅 (개발용) |
| `@types/node` | ^22.16.5 | Node.js 타입 정의 |
| `@types/react` | ^18.3.23 | React 타입 정의 |
| `@types/react-dom` | ^18.3.7 | React DOM 타입 정의 |

### 2.10 버전 충돌 위험 패키지

| 패키지 조합 | 위험도 | 설명 |
|---|---|---|
| `next-themes` ^0.3.0 (Vite 프로젝트에서 사용) | ⚠️ 낮음 | Next.js 전용으로 설계됨. Vite+React 환경에서 동작은 하지만 불필요한 의존성 포함 가능 |
| `zod` ^4.1.12 | ⚠️ 주의 | Zod v4는 비교적 최신 메이저 버전. 일부 생태계 라이브러리와 호환성 문제 가능 |
| `three` ^0.160.1 ↔ `@react-three/fiber` ^8.18.0 | ⚠️ 주의 | Three.js 버전과 R3F 호환성 확인 필요. Three.js는 빠르게 업데이트되므로 마이너 버전 차이에도 Breaking Change 가능 |
| `store/` vs `stores/` 디렉토리 공존 | ⚠️ 구조 | 두 개의 Zustand 스토어 디렉토리가 존재하여 혼동 가능 |

---

## 섹션 3: 환경 변수

### 3.1 `.env` 파일에서 정의된 변수

| 변수명 | 용도 | 필수 여부 |
|---|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase 프로젝트 ID | ✅ 필수 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase 공개 API 키 (anon key) | ✅ 필수 |
| `VITE_SUPABASE_URL` | Supabase API 엔드포인트 URL | ✅ 필수 |
| `VITE_OPENWEATHERMAP_API_KEY` | OpenWeatherMap 날씨 API 키 (환경 데이터용) | ⬜ 선택 |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터포털(data.go.kr) API 키 | ⬜ 선택 |
| `VITE_CALENDARIFIC_API_KEY` | Calendarific 공휴일/이벤트 API 키 | ⬜ 선택 |

### 3.2 코드에서 참조되는 환경 변수

#### 프론트엔드 (Vite `import.meta.env.*`)

| 변수 | 사용 파일 | 설명 |
|---|---|---|
| `import.meta.env.VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts` | Supabase 클라이언트 초기화 |
| `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/client.ts` | Supabase 인증 키 |
| `import.meta.env.VITE_OPENWEATHERMAP_API_KEY` | `src/features/studio/services/environmentDataService.ts` | 날씨 데이터 조회 |
| `import.meta.env.VITE_DATA_GO_KR_API_KEY` | `src/features/studio/services/environmentDataService.ts` | 공공데이터 조회 |
| `import.meta.env.VITE_CALENDARIFIC_API_KEY` | `src/features/studio/services/environmentDataService.ts` | 공휴일/이벤트 조회 |
| `import.meta.env.DEV` | `src/features/data-control/components/DataImportWidget.tsx`, `ImportHistoryWidget.tsx` | 개발 모드 감지 (Vite 내장) |

#### 백엔드 (Supabase Edge Functions — `Deno.env.get()`)

| 변수 | 설명 |
|---|---|
| `SUPABASE_URL` | Supabase API URL (Edge Function 내부에서 자동 주입) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 (관리자 권한, 자동 주입) |

> **참고:** Supabase Edge Function 내부의 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 플랫폼에서 자동으로 주입되므로 `.env` 파일에 별도 설정 불필요.

---

## 부록: Supabase Edge Functions 목록 (36개)

| # | 함수명 | 추정 용도 |
|---|---|---|
| 1 | `advanced-ai-inference` | 고급 AI 추론 |
| 2 | `aggregate-all-kpis` | 전체 KPI 집계 |
| 3 | `aggregate-dashboard-kpis` | 대시보드 KPI 집계 |
| 4 | `ai-batch-qa-test` | AI 배치 QA 테스트 |
| 5 | `analyze-3d-model` | 3D 모델 분석 |
| 6 | `api-connector` | 외부 API 커넥터 |
| 7 | `auto-map-etl` | ETL 자동 매핑 |
| 8 | `auto-process-3d-models` | 3D 모델 자동 처리 |
| 9 | `datasource-mapper` | 데이터소스 매핑 |
| 10 | `environment-proxy` | 환경 데이터 프록시 |
| 11 | `etl-health` | ETL 헬스 체크 |
| 12 | `etl-scheduler` | ETL 스케줄러 |
| 13 | `execute-import` | 데이터 임포트 실행 |
| 14 | `generate-optimization` | 최적화 생성 |
| 15 | `generate-template` | 템플릿 생성 |
| 16 | `graph-query` | 그래프 쿼리 실행 |
| 17 | `import-with-ontology` | 온톨로지 기반 임포트 |
| 18 | `integrated-data-pipeline` | 통합 데이터 파이프라인 |
| 19 | `inventory-monitor` | 재고 모니터링 |
| 20 | `neuraltwin-assistant` | NeuralTwin AI 어시스턴트 |
| 21 | `parse-file` | 파일 파싱 |
| 22 | `process-neuralsense-data` | NeuralSense 데이터 처리 |
| 23 | `process-wifi-data` | WiFi 데이터 처리 |
| 24 | `replay-import` | 임포트 재실행 |
| 25 | `retail-ai-inference` | 리테일 AI 추론 |
| 26 | `rollback-import` | 임포트 롤백 |
| 27 | `run-simulation` | 시뮬레이션 실행 |
| 28 | `simulation-data-mapping` | 시뮬레이션 데이터 매핑 |
| 29 | `smart-ontology-mapping` | 스마트 온톨로지 매핑 |
| 30 | `submit-contact` | 문의 제출 |
| 31 | `sync-api-data` | API 데이터 동기화 |
| 32 | `trigger-learning` | 학습 트리거 |
| 33 | `unified-ai` | 통합 AI 서비스 |
| 34 | `unified-etl` | 통합 ETL |
| 35 | `upload-file` | 파일 업로드 |
| 36 | `validate-data` | 데이터 유효성 검증 |

---

## 섹션 4: 컴포넌트 인벤토리

> 총 **150+ 컴포넌트** — 9개 분류 기준으로 정리

### 4.1 페이지 컴포넌트 (각 라우트의 메인 페이지)

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 페이지 | `AuthPage` | `src/core/pages/AuthPage.tsx` | 이메일/소셜 로그인 인증 페이지 (Zod 검증, Glassmorphism UI) | 웹사이트 공유 가능 |
| 페이지 | `NotFoundPage` | `src/core/pages/NotFoundPage.tsx` | 404 에러 페이지 | 웹사이트 공유 가능 |
| 페이지 | `InsightHubPage` | `src/features/insights/InsightHubPage.tsx` | 통합 인사이트 허브 — 6개 분석 탭 + AI 추천 | OS 전용 |
| 페이지 | `DigitalTwinStudioPage` | `src/features/studio/DigitalTwinStudioPage.tsx` | 3D 디지털 트윈 편집/시뮬레이션 스튜디오 | OS 전용 |
| 페이지 | `ROIMeasurementPage` | `src/features/roi/ROIMeasurementPage.tsx` | 시뮬레이션 적용 결과 ROI 측정 대시보드 | OS 전용 |
| 페이지 | `SettingsPage` | `src/features/settings/SettingsPage.tsx` | 설정 페이지 (매장, 데이터, 온톨로지 등) | OS 전용 |
| 페이지 | `DataControlTowerPage` | `src/features/data-control/DataControlTowerPage.tsx` | 데이터 컨트롤타워 대시보드 | OS 전용 |
| 페이지 | `LineageExplorerPage` | `src/features/data-control/LineageExplorerPage.tsx` | 데이터 계보(리니지) 탐색기 | OS 전용 |
| 페이지 | `ConnectorSettingsPage` | `src/features/data-control/ConnectorSettingsPage.tsx` | API 커넥터 상세 설정 페이지 | OS 전용 |
| 페이지 | `SimulationPage` | `src/features/simulation/views/SimulationPage.tsx` | 시뮬레이션 엔진 페이지 (존 데이터 + 시뮬레이션) | OS 전용 |

### 4.2 레이아웃 컴포넌트 (헤더, 사이드바, 네비게이션)

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 레이아웃 | `DashboardLayout` | `src/components/DashboardLayout.tsx` | 3D Glassmorphism 메인 레이아웃 (사이드바 + 헤더 + 채팅 패널) | 추출 권장 |
| 레이아웃 | `AppSidebar` | `src/components/AppSidebar.tsx` | 5개 메뉴 + 매장 선택기 사이드바 (Glass 스타일) | OS 전용 |
| 레이아웃 | `NavLink` | `src/components/NavLink.tsx` | React Router NavLink 커스텀 래퍼 | 웹사이트 공유 가능 |
| 레이아웃 | `ProtectedRoute` | `src/components/ProtectedRoute.tsx` | 인증 상태 확인 라우트 가드 | 웹사이트 공유 가능 |
| 레이아웃 | `ThemeToggle` | `src/components/ThemeToggle.tsx` | 라이트/다크 모드 토글 버튼 | 추출 권장 |
| 레이아웃 | `DraggablePanel` | `src/features/studio/components/DraggablePanel.tsx` | 드래그 가능한 플로팅 패널 래퍼 | 추출 권장 |

### 4.3 대시보드 위젯/카드 (KPI 카드, 통계 박스 등)

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 위젯 | `MetricCard` | `src/features/insights/components/MetricCard.tsx` | 3D 입체 효과 KPI 카드 (트렌드 지표 포함) | 추출 권장 |
| 위젯 | `DataQualityBanner` | `src/features/insights/components/DataQualityBanner.tsx` | 인사이트 허브 상단 데이터 품질 안내 배너 | OS 전용 |
| 위젯 | `OverviewTab` | `src/features/insights/tabs/OverviewTab.tsx` | 개요 탭 — 글로우 퍼널 차트 + AI 인사이트 요약 | OS 전용 |
| 위젯 | `AIRecommendationTab` | `src/features/insights/tabs/AIRecommendTab.tsx` | AI 추천 탭 — 의사결정 허브 | OS 전용 |
| 위젯 | `AIDecisionHub` | `src/features/insights/tabs/AIRecommendTab/index.tsx` | AI 의사결정 허브 (PREDICT→OPTIMIZE→RECOMMEND→EXECUTE→MEASURE) | OS 전용 |
| 위젯 | `AIRecommendationEffectWidget` | `src/components/dashboard/AIRecommendationEffectWidget.tsx` | AI 추천 효과 측정 위젯 (ROI 진행 상황) | OS 전용 |
| 위젯 | `GoalProgressWidget` | `src/components/goals/GoalProgressWidget.tsx` | 목표 달성률 시각화 (애니메이션 프로그레스 바) | 추출 권장 |
| 위젯 | `ROISummaryCards` | `src/features/roi/components/ROISummaryCards.tsx` | ROI 요약 KPI 카드 세트 | OS 전용 |
| 위젯 | `AIInsightsCard` | `src/features/roi/components/AIInsightsCard.tsx` | AI 인사이트 카드 | OS 전용 |
| 위젯 | `DataQualityScore` | `src/features/data-control/components/DataQualityScore.tsx` | 데이터 품질 점수 표시 위젯 | 추출 권장 |
| 위젯 | `DataImportWidget` | `src/features/data-control/components/DataImportWidget.tsx` | 데이터 임포트 상태 위젯 | OS 전용 |
| 위젯 | `DataSourceCards` | `src/features/data-control/components/DataSourceCards.tsx` | 데이터 소스 카드 목록 | OS 전용 |
| 위젯 | `DataStatistics` | `src/features/data-management/import/components/DataStatistics.tsx` | 데이터 통계 요약 위젯 | OS 전용 |
| 위젯 | `UploadProgressCard` | `src/features/data-management/import/components/UploadProgressCard.tsx` | 업로드 진행도 카드 | 추출 권장 |
| 위젯 | `IntegratedImportStatus` | `src/features/data-management/import/components/IntegratedImportStatus.tsx` | 통합 임포트 상태 표시 | OS 전용 |
| 위젯 | `DemoReadinessChecker` | `src/features/data-management/import/components/DemoReadinessChecker.tsx` | 데모 준비도 확인 위젯 | OS 전용 |
| 위젯 | `SimulationMetrics` | `src/features/simulation/components/SimulationMetrics.tsx` | 시뮬레이션 메트릭 요약 | OS 전용 |
| 위젯 | `SimulationResultCard` | `src/features/simulation/components/SimulationResultCard.tsx` | 시뮬레이션 결과 카드 | OS 전용 |
| 위젯 | `POSConnectCard` | `src/features/data-management/components/POSConnectCard.tsx` | POS 시스템 연결 카드 | OS 전용 |

### 4.4 차트/그래프 컴포넌트

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 차트 | `FunnelChart` | `src/features/insights/components/FunnelChart.tsx` | 고객 여정 퍼널 (Entry→Browse→Engage→Fitting→Purchase) | 추출 권장 |
| 차트 | `StoreTab` | `src/features/insights/tabs/StoreTab.tsx` | 매장 탭 — 시간대별/존별 분석 (Canvas 글로우 차트) | OS 전용 |
| 차트 | `CustomerTab` | `src/features/insights/tabs/CustomerTab.tsx` | 고객 탭 — 세그먼트/재방문 분석 (Donut, Bar, Area) | OS 전용 |
| 차트 | `ProductTab` | `src/features/insights/tabs/ProductTab.tsx` | 상품 탭 — 매출/판매량 분석 (HorizontalBar, Donut, VerticalBar) | OS 전용 |
| 차트 | `InventoryTab` | `src/features/insights/tabs/InventoryTab.tsx` | 재고 탭 — 재고 상태 분포 + 카테고리별 현황 | OS 전용 |
| 차트 | `PredictionTab` | `src/features/insights/tabs/PredictionTab.tsx` | 예측 탭 — AI 예측 데이터 시각화 | OS 전용 |
| 차트 | `PipelineTimeline` | `src/features/data-control/components/PipelineTimeline.tsx` | 데이터 파이프라인 타임라인 차트 | OS 전용 |
| 차트 | `DemandForecastResult` | `src/features/simulation/components/DemandForecastResult.tsx` | 수요 예측 결과 차트 | OS 전용 |
| 차트 | `InventoryOptimizationResult` | `src/features/simulation/components/InventoryOptimizationResult.tsx` | 재고 최적화 결과 차트 | OS 전용 |
| 차트 | `PricingOptimizationResult` | `src/features/simulation/components/PricingOptimizationResult.tsx` | 가격 최적화 결과 차트 | OS 전용 |
| 차트 | `ROIResultCard` | `src/features/simulation/components/ROIResultCard.tsx` | ROI 시뮬레이션 결과 차트 | OS 전용 |
| 차트 | `RecommendationStrategyResult` | `src/features/simulation/components/RecommendationStrategyResult.tsx` | 추천 전략 결과 차트 | OS 전용 |

> **참고:** 인사이트 탭 내부의 Canvas 기반 글로우 차트 (GlowFunnelChart, GlowHourlyBarChart, GlowZoneDwellChart, GlowZoneDonutChart, GlowDonutChart, GlowBarChart, GlowAreaChart, GlowHorizontalBarChart, GlowVerticalBarChart)는 각 탭 컴포넌트 내부에 인라인으로 정의되어 있습니다.

### 4.5 디지털트윈 3D 컴포넌트 (Three.js / R3F)

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| **Studio 코어** | | | | |
| 3D | `Canvas3D` | `src/features/studio/core/Canvas3D.tsx` | 통합 3D 캔버스 (R3F + 모드 기반 동작) | OS 전용 |
| 3D | `SceneProvider` | `src/features/studio/core/SceneProvider.tsx` | 3D 씬 상태 관리 Provider | OS 전용 |
| 3D | `ModelLoader` | `src/features/studio/core/ModelLoader.tsx` | GLTF 모델 로딩 (useGLTF) | 추출 권장 |
| 3D | `PostProcessing` | `src/features/studio/core/PostProcessing.tsx` | 후처리 효과 (색수차, 블룸 등) | 추출 권장 |
| 3D | `SceneEnvironment` | `src/features/studio/core/SceneEnvironment.tsx` | 3D 환경 설정 (조명, 배경) | 추출 권장 |
| 3D | `SelectionManager` | `src/features/studio/core/SelectionManager.tsx` | 3D 오브젝트 선택 관리 | OS 전용 |
| 3D | `TransformControls` | `src/features/studio/core/TransformControls.tsx` | 3D 오브젝트 이동/회전/크기 변환 제어 | 추출 권장 |
| **Studio 모델** | | | | |
| 3D | `FurnitureModel` | `src/features/studio/models/FurnitureModel.tsx` | 가구 3D 모델 렌더링 | OS 전용 |
| 3D | `ProductModel` | `src/features/studio/models/ProductModel.tsx` | 상품 3D 모델 렌더링 | OS 전용 |
| 3D | `StoreModel` | `src/features/studio/models/StoreModel.tsx` | 매장 3D 모델 렌더링 | OS 전용 |
| **Studio 오버레이** | | | | |
| 3D | `HeatmapOverlay` | `src/features/studio/overlays/HeatmapOverlay.tsx` | 고객 방문 히트맵 오버레이 | OS 전용 |
| 3D | `CustomerFlowOverlay` | `src/features/studio/overlays/CustomerFlowOverlay.tsx` | 고객 흐름 경로 시각화 | OS 전용 |
| 3D | `CustomerFlowOverlayEnhanced` | `src/features/studio/overlays/CustomerFlowOverlayEnhanced.tsx` | 개선된 고객 흐름 시각화 | OS 전용 |
| 3D | `CustomerAvatarOverlay` | `src/features/studio/overlays/CustomerAvatarOverlay.tsx` | 고객 아바타 3D 렌더링 | OS 전용 |
| 3D | `CustomerAvatarsOverlay` | `src/features/studio/overlays/CustomerAvatarsOverlay.tsx` | 다중 고객 아바타 렌더링 | OS 전용 |
| 3D | `LayoutOptimizationOverlay` | `src/features/studio/overlays/LayoutOptimizationOverlay.tsx` | 레이아웃 최적화 제안 오버레이 | OS 전용 |
| 3D | `FlowOptimizationOverlay` | `src/features/studio/overlays/FlowOptimizationOverlay.tsx` | 동선 최적화 제안 오버레이 | OS 전용 |
| 3D | `CongestionOverlay` | `src/features/studio/overlays/CongestionOverlay.tsx` | 혼잡도 시각화 오버레이 | OS 전용 |
| 3D | `StaffingOverlay` | `src/features/studio/overlays/StaffingOverlay.tsx` | 직원 배치 표시 오버레이 | OS 전용 |
| 3D | `StaffAvatarsOverlay` | `src/features/studio/overlays/StaffAvatarsOverlay.tsx` | 직원 아바타 3D 렌더링 | OS 전용 |
| 3D | `StaffReallocationOverlay` | `src/features/studio/overlays/StaffReallocationOverlay.tsx` | 직원 재배치 제안 오버레이 | OS 전용 |
| 3D | `ZoneBoundaryOverlay` | `src/features/studio/overlays/ZoneBoundaryOverlay.tsx` | 구역 경계선 3D 표시 | OS 전용 |
| 3D | `ZonesFloorOverlay` | `src/features/studio/overlays/ZonesFloorOverlay.tsx` | 구역 바닥 컬러 표시 | OS 전용 |
| 3D | `SlotVisualizerOverlay` | `src/features/studio/overlays/SlotVisualizerOverlay.tsx` | 상품 배치 슬롯 시각화 | OS 전용 |
| 3D | `EnvironmentEffectsOverlay` | `src/features/studio/overlays/EnvironmentEffectsOverlay.tsx` | 환경 효과 (날씨, 조명) 오버레이 | OS 전용 |
| **Simulation 디지털트윈** | | | | |
| 3D | `SimulationScene` | `src/features/simulation/components/SimulationScene.tsx` | 시뮬레이션 3D 씬 | OS 전용 |
| 3D | `Store3DViewer` | `src/features/simulation/components/digital-twin/Store3DViewer.tsx` | 매장 3D 뷰어 | 추출 권장 |
| 3D | `SceneViewer` | `src/features/simulation/components/digital-twin/SceneViewer.tsx` | 씬 뷰어 | 추출 권장 |
| 3D | `Model3DPreview` | `src/features/simulation/components/digital-twin/Model3DPreview.tsx` | 3D 모델 미리보기 | 추출 권장 |
| 3D | `FurnitureLayout` | `src/features/simulation/components/digital-twin/FurnitureLayout.tsx` | 가구 배치 렌더링 | OS 전용 |
| 3D | `StoreSpace` | `src/features/simulation/components/digital-twin/StoreSpace.tsx` | 매장 공간 3D 렌더링 | OS 전용 |
| 3D | `SceneComposer` | `src/features/simulation/components/digital-twin/SceneComposer.tsx` | 3D 씬 구성기 | OS 전용 |
| 3D | `SceneEnvironment` (sim) | `src/features/simulation/components/digital-twin/SceneEnvironment.tsx` | 시뮬레이션 환경 설정 (조명, 배경) | OS 전용 |
| 3D | `ProductPlacement` | `src/features/simulation/components/digital-twin/ProductPlacement.tsx` | 상품 배치 3D 렌더링 | OS 전용 |
| 3D | `SharedDigitalTwinScene` | `src/features/simulation/components/digital-twin/SharedDigitalTwinScene.tsx` | 공유 디지털트윈 씬 | OS 전용 |
| 3D | `ComparisonView` | `src/features/simulation/components/digital-twin/ComparisonView.tsx` | 씬 비교 뷰 (Before/After) | OS 전용 |
| 3D | `PostProcessingEffects` | `src/features/simulation/components/digital-twin/PostProcessingEffects.tsx` | 후처리 효과 설정 UI | OS 전용 |
| **Simulation 오버레이** | | | | |
| 3D | `HeatmapOverlay3D` | `src/features/simulation/components/overlays/HeatmapOverlay3D.tsx` | 3D 히트맵 오버레이 | OS 전용 |
| 3D | `CustomerPathOverlay` | `src/features/simulation/components/overlays/CustomerPathOverlay.tsx` | 고객 경로 오버레이 | OS 전용 |
| 3D | `DwellTimeOverlay` | `src/features/simulation/components/overlays/DwellTimeOverlay.tsx` | 체류 시간 오버레이 | OS 전용 |
| 3D | `LayoutChangeOverlay` | `src/features/simulation/components/overlays/LayoutChangeOverlay.tsx` | 레이아웃 변경 오버레이 | OS 전용 |
| 3D | `ProductInfoOverlay` | `src/features/simulation/components/overlays/ProductInfoOverlay.tsx` | 상품 정보 오버레이 | OS 전용 |
| 3D | `RealtimeCustomerOverlay` | `src/features/simulation/components/overlays/RealtimeCustomerOverlay.tsx` | 실시간 고객 위치 오버레이 | OS 전용 |
| 3D | `WiFiTrackingOverlay` | `src/features/simulation/components/overlays/WiFiTrackingOverlay.tsx` | WiFi 기반 추적 오버레이 | OS 전용 |
| 3D | `ZoneTransitionOverlay` | `src/features/simulation/components/overlays/ZoneTransitionOverlay.tsx` | 구역 이동 오버레이 | OS 전용 |
| **온톨로지 3D 그래프** | | | | |
| 3D | `OntologyGraph3D` | `src/features/data-management/ontology/components/OntologyGraph3D.tsx` | 온톨로지 그래프 3D 시각화 | OS 전용 |
| 3D | `SchemaGraph3D` | `src/features/data-management/ontology/components/SchemaGraph3D.tsx` | 스키마 그래프 3D 시각화 | OS 전용 |

### 4.6 데이터 테이블/그리드

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 테이블 | `AppliedStrategyTable` | `src/features/roi/components/AppliedStrategyTable.tsx` | 적용된 전략 목록 테이블 (필터, 정렬) | OS 전용 |
| 테이블 | `CategoryPerformanceTable` | `src/features/roi/components/CategoryPerformanceTable.tsx` | 카테고리별 성과 테이블 | OS 전용 |
| 테이블 | `ApiConnectionsList` | `src/features/data-control/components/ApiConnectionsList.tsx` | API 연결 목록 | OS 전용 |
| 테이블 | `ImportHistoryWidget` | `src/features/data-control/components/ImportHistoryWidget.tsx` | 임포트 히스토리 테이블 | OS 전용 |
| 테이블 | `RecentImportsList` | `src/features/data-control/components/RecentImportsList.tsx` | 최근 임포트 목록 | OS 전용 |
| 테이블 | `SyncHistoryTable` | `src/features/data-control/components/connectors/SyncHistoryTable.tsx` | 커넥터 동기화 히스토리 테이블 | OS 전용 |
| 테이블 | `DataImportHistory` | `src/features/data-management/import/components/DataImportHistory.tsx` | 데이터 임포트 히스토리 테이블 | OS 전용 |
| 테이블 | `DiagnosticIssueList` | `src/features/studio/components/DiagnosticIssueList.tsx` | 시뮬레이션 진단 이슈 목록 | OS 전용 |

### 4.7 폼/입력 컴포넌트

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 폼 | `GlobalDateFilter` | `src/components/common/GlobalDateFilter.tsx` | 전역 기간 필터 (프리셋 + 커스텀 범위) | 추출 권장 |
| 폼 | `ChatInput` | `src/components/chat/ChatInput.tsx` | 채팅 메시지 입력 (Enter 전송, Shift+Enter 줄바꿈) | 추출 권장 |
| 폼 | `AuthConfigForm` | `src/features/data-control/components/AuthConfigForm.tsx` | API 커넥터 인증 설정 폼 | OS 전용 |
| 폼 | `FieldMappingEditor` | `src/features/data-control/components/FieldMappingEditor.tsx` | 데이터 필드 매핑 편집기 | OS 전용 |
| 폼 | `Model3DUploadWidget` | `src/features/data-control/components/Model3DUploadWidget.tsx` | 3D 모델 업로드 폼 | OS 전용 |
| 폼 | `UnifiedDataUpload` | `src/features/data-management/import/components/UnifiedDataUpload.tsx` | 통합 데이터 업로드 폼 (드래그&드롭) | OS 전용 |
| 폼 | `DataValidation` | `src/features/data-management/import/components/DataValidation.tsx` | 데이터 유효성 검증 폼 | OS 전용 |
| 폼 | `SchemaMapper` | `src/features/data-management/import/components/SchemaMapper.tsx` | 스키마 매핑 편집기 | OS 전용 |
| 폼 | `OntologyDataManagement` | `src/features/data-management/import/components/OntologyDataManagement.tsx` | 온톨로지 데이터 관리 폼 | OS 전용 |
| 폼 | `EntityTypeManager` | `src/features/data-management/ontology/components/EntityTypeManager.tsx` | 엔티티 타입 CRUD 관리 | OS 전용 |
| 폼 | `RelationTypeManager` | `src/features/data-management/ontology/components/RelationTypeManager.tsx` | 관계 타입 CRUD 관리 | OS 전용 |
| 폼 | `GraphQueryBuilder` | `src/features/data-management/ontology/components/GraphQueryBuilder.tsx` | 그래프 쿼리 빌더 UI | OS 전용 |
| 폼 | `SchemaValidator` | `src/features/data-management/ontology/components/SchemaValidator.tsx` | 스키마 유효성 검증기 | OS 전용 |
| 폼 | `OntologyVariableCalculator` | `src/features/data-management/ontology/components/OntologyVariableCalculator.tsx` | 온톨로지 변수 계산기 | OS 전용 |
| 폼 | `PropertyPanel` | `src/features/studio/panels/PropertyPanel.tsx` | 3D 오브젝트 속성 편집 패널 | OS 전용 |
| 폼 | `SimulationEnvironmentSettings` | `src/features/studio/components/SimulationEnvironmentSettings.tsx` | 시뮬레이션 환경 파라미터 설정 | OS 전용 |
| 폼 | `OptimizationSettingsPanel` | `src/features/studio/components/optimization/OptimizationSettingsPanel.tsx` | 최적화 설정 패널 | OS 전용 |
| 폼 | `IntegratedOptimizationSettings` | `src/features/studio/components/optimization/IntegratedOptimizationSettings.tsx` | 통합 최적화 설정 | OS 전용 |
| 폼 | `ObjectiveSelector` | `src/features/studio/components/optimization/ObjectiveSelector.tsx` | 최적화 목표 선택기 | OS 전용 |
| 폼 | `ProductSelector` | `src/features/studio/components/optimization/ProductSelector.tsx` | 상품 선택기 | OS 전용 |
| 폼 | `FurnitureSelector` | `src/features/studio/components/optimization/FurnitureSelector.tsx` | 가구 선택기 | OS 전용 |
| 폼 | `IntensitySlider` | `src/features/studio/components/optimization/IntensitySlider.tsx` | 최적화 강도 슬라이더 | OS 전용 |
| 폼 | `AIModelSelector` | `src/features/simulation/components/AIModelSelector.tsx` | AI 모델 선택 드롭다운 | OS 전용 |
| 폼 | `DataSourceMappingCard` | `src/features/simulation/components/DataSourceMappingCard.tsx` | 데이터 소스 매핑 카드 폼 | OS 전용 |
| 폼 | `PlacementEditor` | `src/features/simulation/components/digital-twin/PlacementEditor.tsx` | 상품 배치 편집기 | OS 전용 |
| 폼 | `ModelUploader` | `src/features/simulation/components/digital-twin/ModelUploader.tsx` | 3D 모델 업로더 | OS 전용 |
| 폼 | `LightingPreset` | `src/features/simulation/components/digital-twin/LightingPreset.tsx` | 조명 프리셋 선택/설정 | OS 전용 |

### 4.8 모달/다이얼로그

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 모달 | `GoalSettingDialog` | `src/components/goals/GoalSettingDialog.tsx` | 목표 설정 다이얼로그 (유형, 기간, 목표값 입력) | OS 전용 |
| 모달 | `NotificationCenter` | `src/components/notifications/NotificationCenter.tsx` | 알림 센터 (심각도별 표시, 읽음 관리, 액션 링크) | 추출 권장 |
| 모달 | `ChatPanel` | `src/components/chat/ChatPanel.tsx` | 리사이즈 가능한 채팅 사이드 패널 | 추출 권장 |
| 모달 | `StrategyDetailModal` | `src/features/roi/components/StrategyDetailModal.tsx` | 전략 상세 정보 모달 | OS 전용 |
| 모달 | `ApplyStrategyModal` | `src/features/roi/components/ApplyStrategyModal.tsx` | 전략 적용 확인 모달 | OS 전용 |
| 모달 | `AddConnectorDialog` | `src/features/data-control/components/AddConnectorDialog.tsx` | 새 API 커넥터 추가 다이얼로그 | OS 전용 |
| 모달 | `OnboardingWizard` | `src/features/onboarding/components/OnboardingWizard.tsx` | 7단계 온보딩 마법사 다이얼로그 | OS 전용 |
| 모달 | `SimulationControlPopup` | `src/features/studio/components/SimulationControlPopup.tsx` | 시뮬레이션 제어 팝업 | OS 전용 |

### 4.9 공통/재사용 컴포넌트

| 분류 | 컴포넌트명 | 파일 경로 | 용도 (한줄) | 재사용 가능? |
|---|---|---|---|---|
| 공통 | `ChatMessage` | `src/components/chat/ChatMessage.tsx` | 개별 채팅 메시지 버블 (사용자/AI 구분, 타임스탬프) | 추출 권장 |
| 공통 | `ConnectionTestResult` | `src/features/data-control/components/connectors/ConnectionTestResult.tsx` | API 연결 테스트 결과 표시 | OS 전용 |
| 공통 | `DataValidationPreview` | `src/features/data-management/import/components/DataValidationPreview.tsx` | 데이터 검증 미리보기 | OS 전용 |
| 공통 | `StorageManager` | `src/features/data-management/import/components/StorageManager.tsx` | Supabase 스토리지 관리 | OS 전용 |
| 공통 | `MasterSchemaSync` | `src/features/data-management/ontology/components/MasterSchemaSync.tsx` | 마스터 스키마 동기화 상태 | OS 전용 |
| 공통 | `RetailSchemaPreset` | `src/features/data-management/ontology/components/RetailSchemaPreset.tsx` | 소매 스키마 프리셋 로더 | OS 전용 |
| 공통 | `SchemaVersionManager` | `src/features/data-management/ontology/components/SchemaVersionManager.tsx` | 스키마 버전 관리 | OS 전용 |
| 공통 | `AssistantProvider` | `src/features/assistant/context/AssistantProvider.tsx` | AI 어시스턴트 컨텍스트 Provider | OS 전용 |
| 공통 | `InsightDataContext` | `src/features/insights/context/InsightDataContext.tsx` | 인사이트 데이터 소스 통합 Provider (캐싱 + Lazy Loading) | OS 전용 |
| **Studio 패널/유틸** | | | | |
| 공통 | `LayerPanel` | `src/features/studio/panels/LayerPanel.tsx` | 3D 레이어 관리 패널 | OS 전용 |
| 공통 | `ToolPanel` | `src/features/studio/panels/ToolPanel.tsx` | 도구 선택 패널 | OS 전용 |
| 공통 | `OverlayControlPanel` | `src/features/studio/panels/OverlayControlPanel.tsx` | 오버레이 토글 패널 | OS 전용 |
| 공통 | `SimulationPanel` | `src/features/studio/panels/SimulationPanel.tsx` | 시뮬레이션 제어 패널 | OS 전용 |
| 공통 | `SceneSavePanel` | `src/features/studio/panels/SceneSavePanel.tsx` | 씬 저장/로드 패널 | OS 전용 |
| 공통 | `UltimateAnalysisPanel` | `src/features/studio/panels/UltimateAnalysisPanel.tsx` | 고급 분석 패널 | OS 전용 |
| 공통 | `OptimizationResultPanel` | `src/features/studio/panels/OptimizationResultPanel.tsx` | 최적화 결과 패널 | OS 전용 |
| 공통 | `LayoutResultPanel` | `src/features/studio/panels/results/LayoutResultPanel.tsx` | 레이아웃 최적화 결과 | OS 전용 |
| 공통 | `FlowResultPanel` | `src/features/studio/panels/results/FlowResultPanel.tsx` | 고객 흐름 시뮬레이션 결과 | OS 전용 |
| 공통 | `CongestionResultPanel` | `src/features/studio/panels/results/CongestionResultPanel.tsx` | 혼잡도 분석 결과 | OS 전용 |
| 공통 | `StaffingResultPanel` | `src/features/studio/panels/results/StaffingResultPanel.tsx` | 직원 배치 최적화 결과 | OS 전용 |
| 공통 | `QuickToggleBar` | `src/features/studio/components/QuickToggleBar.tsx` | 빠른 토글 바 | OS 전용 |
| 공통 | `ViewModeToggle` | `src/features/studio/components/ViewModeToggle.tsx` | 2D/3D 뷰 모드 전환 | OS 전용 |
| 공통 | `ResultReportPanel` | `src/features/studio/components/ResultReportPanel.tsx` | 결과 리포트 패널 | OS 전용 |
| 공통 | `SceneComparisonView` | `src/features/studio/components/SceneComparisonView.tsx` | 씬 비교 뷰 (A/B) | OS 전용 |
| 공통 | `RealtimeSimulationPanel` | `src/features/studio/components/RealtimeSimulationPanel.tsx` | 실시간 시뮬레이션 패널 | OS 전용 |
| 공통 | `DiagnosticsSummary` | `src/features/studio/components/DiagnosticsSummary.tsx` | 시뮬레이션 진단 요약 | OS 전용 |
| 공통 | `CustomerAgents` | `src/features/studio/components/CustomerAgents.tsx` | 고객 에이전트 시뮬레이션 | OS 전용 |
| 공통 | `SimulationErrorRecovery` | `src/features/studio/components/SimulationErrorRecovery.tsx` | 시뮬레이션 에러 복구 UI | OS 전용 |
| 공통 | `StaffOptimizationResult` | `src/features/studio/components/StaffOptimizationResult.tsx` | 직원 최적화 결과 표시 | OS 전용 |
| 공통 | `AIOptimizationTab` | `src/features/studio/tabs/AIOptimizationTab.tsx` | AI 최적화 탭 | OS 전용 |
| 공통 | `AISimulationTab` | `src/features/studio/tabs/AISimulationTab.tsx` | AI 시뮬레이션 탭 | OS 전용 |
| 공통 | `ApplyPanel` | `src/features/studio/tabs/ApplyPanel.tsx` | 최적화 결과 적용 패널 | OS 전용 |
| **Simulation 유틸** | | | | |
| 공통 | `SimulationControls` | `src/features/simulation/components/SimulationControls.tsx` | 시뮬레이션 제어 UI | OS 전용 |
| 공통 | `SimulationHistoryPanel` | `src/features/simulation/components/SimulationHistoryPanel.tsx` | 시뮬레이션 히스토리 패널 | OS 전용 |
| 공통 | `ModelLayerManager` | `src/features/simulation/components/digital-twin/ModelLayerManager.tsx` | 모델 레이어 관리 | OS 전용 |
| 공통 | `AutoModelMapper` | `src/features/simulation/components/digital-twin/AutoModelMapper.tsx` | 자동 모델 매핑 | OS 전용 |
| 공통 | `ChildProductItem` | `src/features/simulation/components/digital-twin/ChildProductItem.tsx` | 자식 상품 아이템 | OS 전용 |
| 공통 | `StorageToInstanceConverter` | `src/features/simulation/components/digital-twin/StorageToInstanceConverter.tsx` | 스토리지→인스턴스 변환기 | OS 전용 |

### 4.10 shadcn/ui 기본 컴포넌트 라이브러리 (49개)

> `src/components/ui/` — 모든 항목 **추출 권장** (packages/shared-ui 후보)

| 컴포넌트 | 파일 | 용도 |
|---|---|---|
| `Accordion` | `accordion.tsx` | 아코디언 (접기/펼치기) |
| `AlertDialog` | `alert-dialog.tsx` | 경고 다이얼로그 |
| `Alert` | `alert.tsx` | 알림 메시지 |
| `AspectRatio` | `aspect-ratio.tsx` | 종횡비 유지 래퍼 |
| `Avatar` | `avatar.tsx` | 프로필 이미지 |
| `Badge` | `badge.tsx` | 배지/태그 |
| `Breadcrumb` | `breadcrumb.tsx` | 브레드크럼 네비게이션 |
| `Button` | `button.tsx` | 기본 버튼 |
| `Calendar` | `calendar.tsx` | 달력 선택기 |
| `Card` | `card.tsx` | 카드 컨테이너 |
| `Carousel` | `carousel.tsx` | 캐러셀/슬라이더 |
| `Chart` | `chart.tsx` | Recharts 래퍼 |
| `Checkbox` | `checkbox.tsx` | 체크박스 |
| `Collapsible` | `collapsible.tsx` | 접을 수 있는 컨테이너 |
| `Command` | `command.tsx` | 커맨드 팔레트 |
| `ContextMenu` | `context-menu.tsx` | 우클릭 메뉴 |
| `Dialog` | `dialog.tsx` | 모달 다이얼로그 |
| `Drawer` | `drawer.tsx` | 슬라이드 패널 |
| `DropdownMenu` | `dropdown-menu.tsx` | 드롭다운 메뉴 |
| `Form` | `form.tsx` | 폼 제어 유틸 |
| `GlassCard` | `glass-card.tsx` | 3D Glassmorphism 카드 (커스텀) |
| `HoverCard` | `hover-card.tsx` | 호버 카드 |
| `InputOTP` | `input-otp.tsx` | OTP 입력 |
| `Input` | `input.tsx` | 텍스트 입력 |
| `Label` | `label.tsx` | 폼 라벨 |
| `Menubar` | `menubar.tsx` | 메뉴바 |
| `NavigationMenu` | `navigation-menu.tsx` | 네비게이션 메뉴 |
| `Pagination` | `pagination.tsx` | 페이지네이션 |
| `Popover` | `popover.tsx` | 팝오버 |
| `Progress` | `progress.tsx` | 프로그레스 바 |
| `RadioGroup` | `radio-group.tsx` | 라디오 버튼 그룹 |
| `Resizable` | `resizable.tsx` | 리사이즈 패널 |
| `ScrollArea` | `scroll-area.tsx` | 스크롤 영역 |
| `Select` | `select.tsx` | 선택 드롭다운 |
| `Separator` | `separator.tsx` | 구분선 |
| `Sheet` | `sheet.tsx` | 사이드 시트 |
| `Skeleton` | `skeleton.tsx` | 로딩 스켈레톤 |
| `Slider` | `slider.tsx` | 슬라이더 |
| `Sonner` | `sonner.tsx` | 토스트 알림 (Sonner) |
| `Switch` | `switch.tsx` | 토글 스위치 |
| `Table` | `table.tsx` | 테이블 |
| `Tabs` | `tabs.tsx` | 탭 네비게이션 |
| `Textarea` | `textarea.tsx` | 멀티라인 입력 |
| `Toast` | `toast.tsx` | 토스트 알림 |
| `Toaster` | `toaster.tsx` | 토스트 컨테이너 |
| `ToggleGroup` | `toggle-group.tsx` | 토글 그룹 |
| `Toggle` | `toggle.tsx` | 토글 버튼 |
| `Tooltip` | `tooltip.tsx` | 툴팁 |
| `useToast` | `use-toast.ts` | 토스트 훅 |

### 4.11 요약 통계

| 분류 | 개수 | 추출 권장 |
|---|---:|---:|
| 페이지 컴포넌트 | 10 | 0 |
| 레이아웃 컴포넌트 | 6 | 3 |
| 대시보드 위젯/카드 | 19 | 4 |
| 차트/그래프 | 12 | 1 |
| 디지털트윈 3D | 49 | 6 |
| 데이터 테이블/그리드 | 8 | 0 |
| 폼/입력 | 27 | 2 |
| 모달/다이얼로그 | 8 | 2 |
| 공통/재사용 | 43 | 1 |
| shadcn/ui 라이브러리 | 49 | 49 (전체) |
| **합계** | **231** | **68** |

### 4.12 `packages/shared-ui/` 추출 권장 목록

> 아래 컴포넌트는 도메인 특화 로직이 적고, 웹사이트(E) 등 다른 프로젝트에서도 재사용 가치가 높습니다.

| 우선순위 | 컴포넌트 | 이유 |
|---|---|---|
| 🔴 높음 | `src/components/ui/*` (49개 전체) | shadcn/ui 기반 — 프로젝트 무관하게 사용 가능 |
| 🔴 높음 | `DashboardLayout` | 범용 레이아웃 쉘 (사이드바 + 헤더 + 컨텐츠) |
| 🔴 높음 | `ThemeToggle` | 다크/라이트 모드 토글 — 전 프로젝트 공용 |
| 🟡 중간 | `MetricCard` | KPI 카드 — 데이터만 바꾸면 어디서든 사용 |
| 🟡 중간 | `GoalProgressWidget` | 목표 달성률 — 범용 프로그레스 위젯 |
| 🟡 중간 | `FunnelChart` | 퍼널 차트 — 마케팅/분석에 범용 |
| 🟡 중간 | `GlobalDateFilter` | 날짜 필터 — 대시보드 공통 요소 |
| 🟡 중간 | `NotificationCenter` | 알림 센터 — 범용 알림 UI |
| 🟡 중간 | `ChatPanel` + `ChatInput` + `ChatMessage` | 채팅 UI 세트 — AI 챗봇에 범용 |
| 🟡 중간 | `DataQualityScore` | 데이터 품질 표시 — 데이터 관리 프로젝트 공용 |
| 🟡 중간 | `UploadProgressCard` | 업로드 진행도 — 범용 파일 업로드 UI |
| 🟡 중간 | `DraggablePanel` | 드래그 패널 — 범용 UI 컴포넌트 |
| 🟢 낮음 | `ModelLoader`, `PostProcessing`, `SceneEnvironment`, `TransformControls` | 3D 기본 유틸 — 3D 프로젝트 공용 |
| 🟢 낮음 | `Store3DViewer`, `SceneViewer`, `Model3DPreview` | 3D 뷰어 — 3D 프로젝트에서 재사용 |
