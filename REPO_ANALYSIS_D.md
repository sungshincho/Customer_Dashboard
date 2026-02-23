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

---

## 섹션 5: 3D 및 시각화 의존성 상세

### 5.1 Three.js / React Three Fiber 설정

#### 패키지 버전

| 패키지 | 버전 | 역할 |
|---|---|---|
| `three` | ^0.160.1 | 3D 그래픽 엔진 코어 |
| `@react-three/fiber` | ^8.18.0 | React 선언형 Three.js 렌더러 |
| `@react-three/drei` | ^9.122.0 | R3F 유틸리티 (useGLTF, OrbitControls, Grid, Environment, Html 등) |
| `@react-three/postprocessing` | ^2.16.2 | 후처리 이펙트 래퍼 |
| `postprocessing` | ^6.36.0 | 후처리 이펙트 엔진 (Bloom, N8AO, Vignette, ToneMapping) |

#### 물리 엔진

| 패키지 | 사용 여부 |
|---|---|
| `@react-three/cannon` | ❌ 미사용 |
| `@react-three/rapier` | ❌ 미사용 |
| `cannon-es` | ❌ 미사용 |
| `rapier3d` | ❌ 미사용 |

> 이 프로젝트는 순수 시각화/UI 목적으로 Three.js를 사용하며, 물리 시뮬레이션은 포함되어 있지 않습니다.

#### Canvas 초기화 코드 (11개 파일)

| # | 파일 경로 | 주요 props | 비고 |
|---|---|---|---|
| 1 | `src/features/studio/core/Canvas3D.tsx` | `shadows`, `dpr={1}`, `gl={{ antialias, alpha:false, powerPreference:'high-performance', preserveDrawingBuffer }}` | **메인 스튜디오 캔버스** — 가장 상세한 GL 설정 |
| 2 | `src/features/simulation/components/SimulationScene.tsx` | `shadows`, PerspectiveCamera `[20,20,20]` fov=50 | 시뮬레이션 씬 |
| 3 | `src/features/data-management/ontology/components/SchemaGraph3D.tsx` | `gl={{ antialias, alpha:true, powerPreference:'high-performance' }}`, camera `[0,0,160]` fov=70 | 온톨로지 그래프 (투명 배경) |
| 4 | `src/features/simulation/components/digital-twin/Store3DViewer.tsx` | `camera={{ position:[10,10,10], fov:50 }}`, style background | 매장 3D 뷰어 |
| 5 | `src/features/simulation/components/digital-twin/SceneViewer.tsx` | `shadows`, recipe 기반 동적 카메라 설정 | 씬 뷰어 |
| 6 | `src/features/simulation/components/LayoutComparisonView.tsx` | `camera={{ position:[10,10,10], fov:50 }}` | 레이아웃 비교 (다중 Canvas) |
| 7 | `src/features/simulation/components/digital-twin/Model3DPreview.tsx` | PerspectiveCamera `[3,3,3]` | 모델 미리보기 |
| 8 | `src/features/simulation/components/digital-twin/SceneComposer.tsx` | Canvas 래퍼 | 씬 구성기 |
| 9 | `src/features/simulation/components/digital-twin/ComparisonView.tsx` | Canvas | 비교 뷰 |
| 10 | `src/features/simulation/components/digital-twin/PlacementEditor.tsx` | Canvas | 배치 편집기 |

#### 성능 최적화 설정

| 최적화 | 위치 | 설명 |
|---|---|---|
| `dpr={1}` | Canvas3D | 디바이스 픽셀 비율 고정 (슈퍼샘플링 비활성화) |
| `alpha: false` | Canvas3D GL | 불투명 배경 (합성 비용 절감) |
| `powerPreference: 'high-performance'` | Canvas3D, SchemaGraph3D GL | 고성능 GPU 선택 요청 |
| `stencil: false` | Canvas3D GL | 스텐실 버퍼 비활성화 |
| `multisampling={2}` | PostProcessing EffectComposer | 후처리 안티앨리어싱 (2x) |
| `multisampling={4}` | PostProcessingEffects (sim) | 후처리 안티앨리어싱 (4x, 고품질) |
| `enableDamping: false` | OrbitControls | 댐핑 비활성화 (성능 최적화) |
| `Preload all` | Canvas3D | 에셋 사전 로딩 |

#### 후처리(PostProcessing) 이펙트

| 이펙트 | 파일 | 설정 |
|---|---|---|
| `Bloom` | `studio/core/PostProcessing.tsx` | intensity=0.5, luminanceThreshold=0.9, mipmapBlur |
| `N8AO` (SSAO) | `studio/core/PostProcessing.tsx` | intensity=1.5, aoRadius=0.5, quality='medium' |
| `Vignette` | `studio/core/PostProcessing.tsx` | offset=0.3, darkness=0.4 |
| `ToneMapping` | `studio/core/PostProcessing.tsx` | ACES Filmic |
| `BrightnessContrast` | `studio/core/PostProcessing.tsx` | 밝기/대비 조정 |
| `HueSaturation` | `studio/core/PostProcessing.tsx` | 색조/채도 조정 |
| Bloom + N8AO + Vignette + ToneMapping | `simulation/.../PostProcessingEffects.tsx` | 4개 프리셋: natural, cinematic, clean, dramatic |

#### SSR 비활성화 처리

- **방식:** `<Suspense fallback={...}>` 경계를 모든 3D Canvas 내부에 적용
- **dynamic import (ssr: false):** 미사용 (Vite SPA이므로 SSR 자체가 없음)
- **Suspense 사용 파일:** 11개 (Canvas3D, Model3DPreview, SceneComposer, SceneViewer, LayoutComparisonView, CustomerAvatarOverlay, StaffAvatarsOverlay, StaffingOverlay, RealtimeCustomerOverlay 등)

#### Three.js 직접 사용 패턴

| 패턴 | 용도 | 주요 사용 파일 |
|---|---|---|
| `THREE.Color()` | 색상 인스턴스 생성 | SchemaGraph3D, LayoutComparisonView |
| `THREE.Vector3()` | 벡터 연산 (위치/방향) | Studio overlays, ComparisonView |
| `THREE.Quaternion()` | 회전 계산 | SceneViewer, overlays |
| `THREE.Box3()` | 바운딩 박스 계산 | Canvas3D (모델 센터링) |
| `THREE.AdditiveBlending` | 파티클 블렌딩 모드 | SchemaGraph3D (배경 파티클) |
| `THREE.DoubleSide` | 양면 렌더링 | 다수 오버레이 |
| `THREE.Mesh` / `THREE.Points` | 타입 어노테이션 | 다수 컴포넌트 |

### 5.2 3D 에셋 파일

#### GLB/GLTF 모델 파일

> **중요:** 3D 모델 파일은 로컬 레포지토리에 포함되어 있지 않습니다. 모든 모델은 **Supabase Storage** (`3d-models` 버킷)에 외부 저장됩니다.

**참조된 모델 목록 (코드 및 시드 데이터 기준):**

| # | 파일명 | 분류 | 용도 |
|---|---|---|---|
| 1 | `store_simple_10x10_baked.glb` | 공간(Space) | 메인 매장 공간 (Baked Lighting) |
| 2 | `rack_hanger_simple.glb` | 가구(Furniture) | 옷걸이 행거 진열대 |
| 3 | `shelf_simple.glb` | 가구 | 선반 진열대 |
| 4 | `table_simple.glb` | 가구 | 테이블 진열대 |
| 5 | `rack_shoes_simple.glb` | 가구 | 신발 진열대 |
| 6 | `product_coat.glb` | 상품(Product) | 프리미엄 캐시미어 코트 |
| 7 | `product_sweater.glb` | 상품 | 프리미엄 언더웨어 세트 |
| 8 | `product_shoes.glb` | 상품 | 프리미엄 로퍼 |
| 9 | `product_giftbox.glb` | 상품 | 기프트 박스 세트 |
| 10 | `product_tshirt_stack.glb` | 상품 | 베이직 티셔츠 3팩 |
| 11 | `avatar_staff.glb` | 아바타(Avatar) | 직원 아바타 |

**Supabase Storage 경로 구조:**

```
3d-models/
└── {userId}/
    └── {storeId}/
        ├── {model}.glb              # 가구/상품 모델
        ├── environment/             # 환경 모델 (day/night)
        │   ├── *_day.glb
        │   └── *_night.glb
        └── space-textures/          # 공간 텍스처
            ├── *_day.{png,jpg,webp}
            └── *_night.{png,jpg,webp}
```

#### 텍스처 파일

- **로컬 파일:** 없음 (Supabase Storage에 외부 저장)
- **지원 형식:** `.png`, `.jpg`, `.webp`
- **Day/Night 시스템:** 파일명 패턴으로 주간/야간 텍스처 자동 감지 및 전환
- **로딩 코드:** `src/features/studio/hooks/useSpaceTextures.ts`

#### 조명 프리셋 (로컬)

| 파일 | 분위기 | 주요 조명 | 배경색 |
|---|---|---|---|
| `public/lighting-presets/cool-modern.json` | 쿨톤 모던 | Ambient #e6f2ff + Directional #b3d9ff | #d9ecff |
| `public/lighting-presets/dramatic-spot.json` | 드라마틱 스팟 | Ambient #1a1a1a (어두움) + Spot #ffffff, #ffd700 | #0d0d0d |
| `public/lighting-presets/warm-retail.json` | 따뜻한 매장 | Ambient #fff5e6 + Directional #ffd699 + Point #ffcc80 ×2 | #f5e6d3 |

**프리셋 JSON 구조:**
```json
{
  "name": "프리셋명",
  "description": "설명",
  "lights": [
    { "type": "ambient|directional|point|spot", "color": "#hex", "intensity": 0.0, "position": [x,y,z] }
  ],
  "environment": { "background": "#hex" }
}
```

#### Git LFS 사용 여부

- **`.gitattributes` 파일:** ❌ 없음
- **Git LFS:** ❌ 미설정
- **이유:** 3D 모델은 Supabase Storage에 외부 저장되므로 Git LFS가 필요하지 않음

#### Baked Material 시스템

| 항목 | 상세 |
|---|---|
| 구현 파일 | `src/features/simulation/utils/bakedMaterialUtils.ts` |
| 감지 패턴 | `bottom_plate`, `space_a`, `space a`, `_baked`, `-baked` |
| 동작 | `MeshStandardMaterial` → `MeshBasicMaterial` 변환 (조명 비활성화) |
| 추가 처리 | 그림자 비활성화, 톤매핑 비활성화 (원본 색상 보존) |

### 5.3 셰이더 파일

#### GLSL / Vertex / Fragment 파일

| 항목 | 상태 |
|---|---|
| `.glsl` 파일 | ❌ 없음 |
| `.vert` 파일 | ❌ 없음 |
| `.frag` 파일 | ❌ 없음 |
| GLSL import 구문 | ❌ 없음 |

#### 커스텀 셰이더 사용

| 항목 | 상태 |
|---|---|
| `ShaderMaterial` 사용 | ❌ 없음 |
| `RawShaderMaterial` 사용 | ❌ 없음 |
| `shaderMaterial` (drei) 사용 | ❌ 없음 |
| `vertexShader:` 인라인 | ❌ 없음 |
| `fragmentShader:` 인라인 | ❌ 없음 |

#### 사용 중인 Material 타입

| Material | 용도 | 주요 사용처 |
|---|---|---|
| `meshStandardMaterial` | PBR 기본 머터리얼 (가장 많이 사용) | 모든 3D 모델 |
| `meshBasicMaterial` | UI 오버레이, 글로우 효과, Baked 모델 | 오버레이, bakedMaterialUtils |
| `meshPhysicalMaterial` | 고급 반사/투명 표현 | SchemaGraph3D |
| `pointsMaterial` | 파티클 이펙트 | SchemaGraph3D (배경 파티클) |

> **결론:** 이 프로젝트는 커스텀 셰이더를 전혀 사용하지 않으며, Three.js 내장 머터리얼과 `@react-three/postprocessing` 후처리 이펙트로 모든 시각 효과를 구현합니다.

### 5.4 3D 관련 특수 설정

#### 빌드 설정 (vite.config.ts)

```typescript
// vite.config.ts — 3D 관련 특수 설정 없음
export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));
```

| 항목 | 상태 | 설명 |
|---|---|---|
| `transpilePackages` (three.js) | ❌ 불필요 | Vite가 ESM을 네이티브 지원 |
| Webpack GLSL 로더 | ❌ 불필요 | 커스텀 셰이더 미사용 |
| GLTF/GLB 로더 설정 | ❌ 불필요 | `useGLTF` (drei)가 런타임에 처리 |
| Draco 디코더 설정 | ❌ 없음 | Draco 압축 미사용 |
| KTX2 텍스처 설정 | ❌ 없음 | KTX2 미사용 |

#### SSR 비활성화

- **해당 없음** — Vite + React SPA 아키텍처이므로 SSR 자체가 없음
- Next.js의 `dynamic(() => import(...), { ssr: false })` 패턴 불필요
- 대신 `<Suspense>` 경계로 비동기 3D 에셋 로딩을 관리

#### Canvas 초기화 엔트리포인트

| 역할 | 파일 |
|---|---|
| **Studio 메인 3D** | `src/features/studio/core/Canvas3D.tsx` |
| **시뮬레이션 3D** | `src/features/simulation/components/SimulationScene.tsx` |
| **온톨로지 3D 그래프** | `src/features/data-management/ontology/components/SchemaGraph3D.tsx` |
| **모델 미리보기** | `src/features/simulation/components/digital-twin/Model3DPreview.tsx` |
| **씬 뷰어** | `src/features/simulation/components/digital-twin/SceneViewer.tsx` |

### 5.5 차트/그래프 라이브러리

#### 사용 중인 라이브러리

| 라이브러리 | 버전 | 활성 사용 | 렌더링 방식 |
|---|---|---|---|
| `recharts` | ^2.15.4 | ✅ 활성 | SVG (내부) |
| `d3-force` | ^3.0.0 | ⚠️ 의존성만 설치 | — |
| `react-force-graph-2d` | ^1.29.0 | ⚠️ 의존성만 설치 | Canvas (내부) |
| Canvas API (커스텀) | — | ✅ 활성 (주력) | Canvas 2D |

> **기술 비중:** Canvas API 커스텀 차트 ~70% / Recharts ~30%

#### Recharts로 구현된 차트

| # | 차트 유형 | 컴포넌트 | 파일 경로 | 용도 |
|---|---|---|---|---|
| 1 | Line Chart | `MeasureSection` | `features/insights/tabs/AIRecommendTab/components/MeasureSection.tsx` | ROI 트렌드 (기대 vs 실제) |
| 2 | Area Chart | `DemandForecastResult` | `features/simulation/components/DemandForecastResult.tsx` | 일별 수요 예측 |
| 3 | Pie Chart (Donut) | `OntologyInsightChart` | `features/simulation/components/OntologyInsightChart.tsx` | 엔티티 타입 분포 |
| 4 | Bar Chart (Horizontal) | `OntologyInsightChart` | 〃 | 허브 엔티티 연결 수 |
| 5 | Bar Chart | `OntologyInsightChart` | 〃 | 동시 발생 패턴 |
| 6 | Radar Chart | `OntologyInsightChart` | 〃 | 스키마 활용 메트릭 |

#### Canvas API 커스텀 차트

> 모든 커스텀 차트는 `useRef<HTMLCanvasElement>()` + `getContext('2d')` + `requestAnimationFrame()` 패턴을 사용합니다.
> 공통 특징: 글로우 이펙트, 그래디언트 채움, easeOutCubic 애니메이션, 다크/라이트 모드 지원, ResizeObserver 반응형

| # | 차트 함수명 | 유형 | 파일 경로 | 용도 |
|---|---|---|---|---|
| 1 | `GlowFunnelChart` | 퍼널 차트 | `features/insights/tabs/OverviewTab.tsx` | 고객 여정 퍼널 (Entry→Purchase) |
| 2 | `GlowHourlyBarChart` | 세로 바 차트 | `features/insights/tabs/StoreTab.tsx` | 시간대별 방문자 수 (24시간) |
| 3 | `GlowCategoryChart` | 세로 바 차트 | `features/insights/tabs/StoreTab.tsx` | 카테고리별 매출 비교 |
| 4 | `GlowDonutChart` | 도넛 차트 | `features/insights/tabs/CustomerTab.tsx` | 고객 세그먼트 분포 |
| 5 | `GlowBarChart` | 가로 바 차트 | `features/insights/tabs/CustomerTab.tsx` | 세그먼트별 구매액 |
| 6 | `GlowAreaChart` | 영역 차트 | `features/insights/tabs/CustomerTab.tsx` | 재방문 추이 |
| 7 | `GlowHorizontalBarChart` | 가로 바 차트 | `features/insights/tabs/ProductTab.tsx` | Top 10 상품 매출 |
| 8 | `GlowDonutChart` | 도넛 차트 | `features/insights/tabs/ProductTab.tsx` | 카테고리별 매출 비율 |
| 9 | `GlowVerticalBarChart` | 세로 바 차트 | `features/insights/tabs/ProductTab.tsx` | 카테고리별 판매량 |
| 10 | `StockDistributionChart` | 도넛 차트 | `features/insights/tabs/InventoryTab.tsx` | 재고 상태 분포 |
| 11 | `GlowLineChart` | 라인 + 영역 차트 | `features/insights/tabs/PredictionTab.tsx` | 매출 예측 (실제 + 예측선 + 신뢰구간) |
| 12 | `GlowMiniLineChart` | 미니 라인 차트 | `features/insights/tabs/PredictionTab.tsx` | 보조 지표 (방문자, 전환율) 트렌드 |
| 13 | `ConfidenceChart` | 신뢰구간 영역 차트 | `features/insights/tabs/PredictionTab.tsx` | 예측 신뢰구간 시각화 |

#### Canvas API 커스텀 위젯 (프로그레스 바)

| # | 위젯 함수명 | 파일 경로 | 용도 |
|---|---|---|---|
| 1 | `GlowProgressBar` | `components/dashboard/AIRecommendationEffectWidget.tsx` | AI 추천 효과 ROI 진행도 |
| 2 | `GlowProgressBar` | `components/goals/GoalProgressWidget.tsx` | 목표 달성률 |
| 3 | `GlowProgressBar` | `features/data-control/components/DataQualityScore.tsx` | 데이터 품질 점수 |
| 4 | `GlowProgressBar` | `features/insights/tabs/AIRecommendationTab.tsx` | AI 추천 진행도 |
| 5 | `GlowProgressBar` | `features/insights/tabs/AIRecommendTab/components/ActiveStrategies.tsx` | 활성 전략 진행도 |
| 6 | `GlowProgressBar` | `features/insights/tabs/AIRecommendTab/components/ExecuteSection.tsx` | 실행 진행도 |

#### 차트 유형 종합 요약

| 렌더링 기술 | 차트 유형 수 | 인스턴스 수 |
|---|---:|---:|
| **Canvas API 커스텀** | 8종 (퍼널, 라인, 영역, 바, 도넛, 미니라인, 신뢰구간, 프로그레스) | 19개 |
| **Recharts** | 5종 (라인, 영역, 파이, 바, 레이더) | 6개 |
| **d3-force / react-force-graph-2d** | ⚠️ 설치만 됨 (활성 사용 미확인) | 0개 |
| **합계** | **13종** | **25개** |

---

## 섹션 6: 상태 관리 구조

### 6.1 전역 상태 관리

#### 사용 중인 상태 관리 라이브러리

| 라이브러리 | 버전 | 사용 여부 | 역할 |
|---|---|---|---|
| `zustand` | ^5.0.9 | ✅ 사용 | 클라이언트 전역 상태 (6개 스토어) |
| `@tanstack/react-query` | ^5.83.0 | ✅ 사용 | 서버 상태 캐싱 (61개 쿼리, 48개 뮤테이션) |
| React Context API | 내장 | ✅ 사용 | 인증, 매장 선택, 인사이트 데이터 등 (10개 컨텍스트) |
| `jotai` / `recoil` / `redux` | — | ❌ 미사용 | — |
| `swr` | — | ❌ 미사용 | — |

#### Zustand 스토어 목록

| 스토어 (훅) | 파일 위치 | 관리하는 데이터 | Middleware | 주요 구독 컴포넌트 |
|---|---|---|---|---|
| `useChatStore` | `src/store/chatStore.ts` | AI 채팅 패널 상태 (열림/닫힘, 너비, 메시지 배열, 대화 ID, 로딩/스트리밍) | 없음 | `useAssistantChat`, `useActionDispatcher`, ChatPanel |
| `useDateFilterStore` | `src/store/dateFilterStore.ts` | 전역 날짜 필터 (프리셋: today/7d/30d/90d/custom, startDate, endDate) | `persist` (localStorage, key: `neuraltwin-date-filter`) | GlobalDateFilter, OverviewTab, StoreTab, ProductTab, CustomerTab, useAssistantChat |
| `useScreenDataStore` | `src/store/screenDataStore.ts` | 현재 화면의 계산된 KPI 메트릭 (overview KPIs, funnel stages, store KPIs) — 챗봇과 공유용 | 없음 | OverviewTab, StoreTab, InsightDataContext |
| `useSimulationStore` (AI) | `src/stores/simulationStore.ts` | AI 시뮬레이션 상태 (실행/로딩/진행도/결과/진단이슈/옵션) — Edge Function 호출 | 없음 | SimulationControls, SimulationMetrics, useSimulationAI |
| `useSimulationStore` (3D) | `src/features/studio/stores/simulationStore.ts` | 3D 실시간 시뮬레이션 (상태, 고객 에이전트 배열, 존 메트릭, 실시간 KPI, 엔티티) | `subscribeWithSelector` | Canvas3D, CustomerAgents, RealtimeSimulationPanel, SimulationControlPopup |
| `useSceneStore` | `src/features/studio/stores/sceneStore.ts` | 3D 씬 상태 (모델 배열, 레이어, 선택/호버 ID, 활성 오버레이, 카메라, dirty 플래그) | 없음 | Canvas3D, SceneProvider, LayerPanel, AISimulationTab, useStoreBounds |

> **⚠️ 주의:** `useSimulationStore` 이름이 2개 파일에서 중복됩니다. AI 시뮬레이션(`src/stores/`)과 3D 실시간 시뮬레이션(`src/features/studio/stores/`)은 별개 스토어입니다.

#### `useDateFilterStore` 상세 (유일한 Persist 스토어)

```typescript
// localStorage key: 'neuraltwin-date-filter'
interface DateRange {
  preset: 'today' | '7d' | '30d' | '90d' | 'custom';
  startDate: string;  // ISO date
  endDate: string;    // ISO date
}
```

#### `useSimulationStore` (3D) 선택자(Selectors)

| 선택자 | 반환값 |
|---|---|
| `selectSimulationProgress(state)` | 진행률 (%) |
| `selectActiveCustomerCount(state)` | 퇴장하지 않은 고객 수 |
| `selectZoneById(zoneId)(state)` | 특정 존 엔티티 |
| `selectZoneMetricById(zoneId)(state)` | 특정 존 메트릭 |
| `selectTotalRevenue(state)` | 존별 매출 합계 |
| `selectAverageConversion(state)` | 평균 전환율 |

#### Context API 사용 (커스텀 Provider 목록)

| Context | Provider | 파일 위치 | 마운트 위치 | 제공 데이터 |
|---|---|---|---|---|
| `AuthContext` | `AuthProvider` | `src/hooks/useAuth.tsx` | App.tsx (전역) | user, session, orgId, role, license, signIn/Out/Up, OAuth, 역할 체크 함수 |
| `SelectedStoreContext` | `SelectedStoreProvider` | `src/hooks/useSelectedStore.tsx` | App.tsx (전역) | selectedStore, stores[], setSelectedStore, loading, refreshStores |
| `InsightDataContext` | `InsightDataProvider` | `src/features/insights/context/InsightDataContext.tsx` | InsightHubPage (페이지 레벨) | activeTab, baseKPIs, funnelData, zoneMetrics, customerSegments, productPerformance, inventoryMetrics, refreshAll |
| `AssistantProviderContext` | `AssistantProvider` | `src/features/assistant/context/AssistantProvider.tsx` | Feature 레벨 (조건부) | context (page, dateRange, store) |
| `SidebarContext` | `SidebarProvider` | `src/components/ui/sidebar.tsx` | DashboardLayout | state, open, toggleSidebar, isMobile |
| `FormFieldContext` | FormField 내부 | `src/components/ui/form.tsx` | 컴포넌트 레벨 | field name |
| `FormItemContext` | FormItem 내부 | `src/components/ui/form.tsx` | 컴포넌트 레벨 | field id |
| `CarouselContext` | Carousel 컴포넌트 | `src/components/ui/carousel.tsx` | 컴포넌트 레벨 | carouselRef, api, scrollPrev/Next |
| `ChartContext` | ChartContainer | `src/components/ui/chart.tsx` | 컴포넌트 레벨 | chart config (색상, 테마) |
| `ToggleGroupContext` | ToggleGroup | `src/components/ui/toggle-group.tsx` | 컴포넌트 레벨 | size, variant |

#### Provider 계층 구조 (App.tsx)

```
<QueryClientProvider>                          ← TanStack Query
  <TooltipProvider>                            ← UI
    <Toaster /> <Sonner />                     ← Toast 알림
    <BrowserRouter>                            ← React Router
      <AuthProvider>                           ← 인증 (전역)
        <SelectedStoreProvider>                ← 매장 선택 (전역)
          <OnboardingWrapper>                  ← 온보딩 체크
            <Routes>
              <ProtectedRoute>
                <DashboardLayout>              ← SidebarProvider 포함
                  <InsightDataProvider>         ← 인사이트 페이지만
                    <페이지 컴포넌트 />
                  </InsightDataProvider>
                </DashboardLayout>
              </ProtectedRoute>
            </Routes>
          </OnboardingWrapper>
        </SelectedStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

### 6.2 서버 상태 vs 클라이언트 상태

#### TanStack React Query 사용

| 항목 | 설정 |
|---|---|
| **라이브러리** | `@tanstack/react-query` ^5.83.0 |
| **SWR** | ❌ 미사용 |
| **useInfiniteQuery** | ❌ 미사용 |

#### QueryClient 기본 설정

```typescript
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // 탭 전환 시 자동 refetch 비활성화
      // staleTime: 기본값 (0)
      // gcTime: 기본값 (5분)
      // retry: 기본값 (3회)
    },
  },
});
```

#### 캐싱 전략

| 전략 | 사용처 | 설정 |
|---|---|---|
| **기본값** (staleTime=0, gcTime=5min) | 대부분의 쿼리 | 즉시 stale 처리, 5분 후 GC |
| **5분 캐시** | InsightDataContext 내부 쿼리 | `staleTime: 300,000`, `gcTime: 600,000` |
| **10분 캐시** | 수요 예측, 리스크 예측, 최적화 | `staleTime: 600,000` |
| **30분 캐시** | 시즌 트렌드 | `staleTime: 1,800,000` |
| **자동 폴링** | 7개 쿼리 | `refetchInterval: 30,000~60,000` (30초~1분) |

#### 자동 폴링(refetchInterval) 쿼리

| 쿼리 | 파일 | 간격 | 대상 |
|---|---|---|---|
| `useDataControlTowerStatus` | `useDataControlTower.ts` | 30초 | 데이터 컨트롤타워 상태 |
| `useETLHealth` | `useDataControlTower.ts` | 60초 | ETL 헬스 체크 |
| `useAlerts` | `useAlerts.ts` | 60초 | 사용자 알림 |
| `useRealtimeTransactions` | `usePOSIntegration.ts` | 60초 | POS 실시간 거래 |
| `useRealtimeInventory` | `usePOSIntegration.ts` | 60초 | POS 실시간 재고 |

#### useQuery 주요 통계

| 메트릭 | 수치 |
|---|---|
| 총 useQuery 훅 | 61개 |
| 총 useMutation 훅 | 48개 |
| useQueryClient 사용 | 23곳 |
| `enabled` 조건부 쿼리 | 대부분 (storeId, user 존재 여부 체크) |
| Edge Function 호출 쿼리 | 8개 |
| RPC(Stored Procedure) 호출 | 12개 |
| 직접 테이블 쿼리 | 41개 |

#### 주요 뮤테이션 & 캐시 무효화 패턴

| 뮤테이션 그룹 | 파일 | 뮤테이션 수 | 무효화 대상 |
|---|---|---|---|
| API 커넥터 CRUD | `useApiConnector.ts` | 8개 | `['api-connector']` 전체 + 개별 connection |
| 데이터 컨트롤타워 | `useDataControlTower.ts` | 1개 | recent-imports, etl-history, data-control-tower |
| AI 추론 & 추천 | `useAI.ts`, `useAIRecommendations.ts`, `useRetailOntology.ts`, `useUnifiedAI.ts` | 11개 | `['ai-inference-results']`, `['ai-recommendations']`, `['data-sources']` |
| 목표 관리 | `useGoals.ts` | 2개 | `['store-goals']`, `['goal-progress']` |
| 알림 관리 | `useAlerts.ts` | 4개 | `['user-alerts']` |
| 학습 피드백 | `useLearningFeedback.ts` | 3개 | `['strategy-feedback']`, `['model-performance']` |
| 온보딩 | `useOnboarding.ts` | 7개 | `['onboarding-progress']`, `['dashboard-kpis']`, `['stores']` |
| POS 연동 | `usePOSIntegration.ts` | 5개 | `['pos-integrations']`, `['sync-logs']`, `['realtime-transactions']`, `['realtime-inventory']` |
| ROI 측정 | `useROITracking.ts` | 3개 | `['recommendation-applications']`, `['roi-measurements']`, `['roi-summary']` |
| 씬 관리 | `useStoreScene.ts` | 3개 | `['store-scene']`, `['store-scenes-all']` |

#### 캐시 유틸리티 (`useClearCache`)

```typescript
// src/hooks/useClearCache.ts
clearAllCache()           // queryClient.clear() — 전체 캐시 삭제
clearStoreDataCache(id)   // 특정 매장 관련 쿼리만 제거 (removeQueries)
invalidateStoreData(id)   // 특정 매장 관련 쿼리를 stale로 표시 (invalidateQueries)
```

### 6.3 Supabase Realtime 구독

#### Realtime 채널 목록

| # | 채널 이름 | 구독 이벤트 | 테이블 | 구독 위치 (파일) | 처리 로직 |
|---|---|---|---|---|---|
| 1 | `inventory-changes` | INSERT, UPDATE, DELETE | `inventory_levels` | `src/hooks/useRealtimeInventory.ts` | 재고 변경 시 상태 배열 업데이트, 긴급 재고는 토스트 알림 |
| 2 | `suggestions-changes` | INSERT, UPDATE, DELETE | `auto_order_suggestions` | `src/hooks/useRealtimeInventory.ts` | 자동 발주 제안 변경 시 상태 업데이트, 긴급시 "긴급 발주 알림" 토스트 |
| 3 | `import-progress-{id}` | UPDATE | `user_data_imports` | `src/hooks/useImportProgress.ts` | 임포트 진행률(%), 단계, 상태, 에러 실시간 추적 |
| 4 | `stores-changes` | INSERT, UPDATE, DELETE | `stores` | `src/hooks/useSelectedStore.tsx` | 매장 목록 변경 시 refetch, 자동 선택 갱신 |
| 5 | `wifi-tracking-changes` | ALL | `wifi_tracking` | `src/hooks/useWiFiTracking.ts` | WiFi 추적 데이터 변경 시 전체 리로드 (최근 1000건) |
| 6 | `store-tracking-{storeId}` | Presence + Broadcast | N/A (채널 전용) | `src/features/simulation/hooks/useRealtimeTracking.ts` | IoT 센서 → WiFi 삼변측량 → 칼만 필터 → 3D 좌표 변환 |

#### Broadcast 사용 여부

| 항목 | 상태 | 상세 |
|---|---|---|
| **Broadcast** | ✅ 사용 | `store-tracking-{storeId}` 채널에서 `tracking-update` 이벤트로 IoT 센서 데이터 수신 |
| 이벤트명 | `tracking-update` | WiFi 삼변측량 기반 고객 위치 추적 데이터 |
| 처리 로직 | 5초 윈도우 버퍼 → 칼만 필터 평활화 → 3D 좌표 변환 → 존 ID 계산 | |

#### Presence 사용 여부

| 항목 | 상태 | 상세 |
|---|---|---|
| **Presence** | ✅ 사용 | `store-tracking-{storeId}` 채널에서 고객 위치 동기화 |
| `sync` 이벤트 | 전체 고객 위치 동기화 (customer_id → position, velocity, status, zone_id) |
| `join` 이벤트 | 새 고객 입장 감지 |
| `leave` 이벤트 | 고객 퇴장 감지 |
| `track()` 호출 | 고객 상태 퍼블리시 (position, velocity, status, last_updated, zone_id) |
| 온라인 사용자 추적 | 고객 아바타 URL 캐싱, 3D 모델 좌표 시스템 변환 |

#### Realtime 연결 해제 처리 (Cleanup)

| 채널 | Cleanup 방식 | 안전성 |
|---|---|---|
| `inventory-changes` | `supabase.removeChannel(channel)` in useEffect return | ✅ 안전 |
| `suggestions-changes` | `supabase.removeChannel(channel)` in useEffect return | ✅ 안전 |
| `import-progress-{id}` | `supabase.removeChannel(channel)` with null 체크 | ✅ 안전 |
| `stores-changes` | `supabase.removeChannel(channel)` in useEffect return | ✅ 안전 |
| `wifi-tracking-changes` | `supabase.removeChannel(channel)` in useEffect return | ✅ 안전 |
| `store-tracking-{id}` | `channel.unsubscribe()` + ref null 처리 | ✅ 안전 |

> **결론:** 모든 6개 Realtime 채널이 컴포넌트 언마운트 시 올바르게 정리됩니다.

#### 인증 상태 구독 (추가)

| 항목 | 상세 |
|---|---|
| 파일 | `src/hooks/useAuth.tsx` |
| 방식 | `supabase.auth.onAuthStateChange()` |
| 이벤트 | SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED |
| Cleanup | `subscription.unsubscribe()` in useEffect return |

### 6.4 데이터 동기화 패턴

#### Realtime → 상태 업데이트 흐름

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase DB    │────▶│  Realtime 채널    │────▶│  React State    │
│  (INSERT/UPDATE)│     │  postgres_changes │     │  useState/Store │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌──────────────────┐              ▼
                        │  IoT 센서 데이터  │     ┌─────────────────┐
                        │  (WiFi AP)       │────▶│  Broadcast      │
                        └──────────────────┘     │  tracking-update│
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Presence 동기화 │
                                                 │  (고객 위치 공유) │
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  3D 렌더링      │
                                                 │  (Canvas3D)     │
                                                 └─────────────────┘
```

**패턴 1 — postgres_changes → 로컬 상태:**
- 재고, 발주 제안, 매장 목록: DB 변경 → Realtime 이벤트 → useState 배열 업데이트
- 임포트 진행: DB UPDATE → 진행률/상태 실시간 반영

**패턴 2 — Broadcast → 칼만 필터 → 3D:**
- WiFi AP 센서 → Broadcast `tracking-update` → 5초 버퍼 → 삼변측량 → 칼만 필터 → 3D 좌표 변환 → Presence `track()` → 다른 클라이언트 동기화

**패턴 3 — 뮤테이션 → 캐시 무효화:**
- useMutation `onSuccess` → `queryClient.invalidateQueries()` → 관련 useQuery 자동 refetch

#### 낙관적 업데이트(Optimistic Update) 사용 여부

| 항목 | 상태 |
|---|---|
| **진정한 낙관적 업데이트** (뮤테이션 전 UI 선반영) | ❌ 미사용 |
| **성공 후 즉시 캐시 업데이트** | ⚠️ 부분 사용 |
| 구현 위치 | `useApiConnector.ts` — `useUpdateConnection` |
| 패턴 | `onSuccess`에서 `queryClient.setQueryData()` + `invalidateQueries()` |
| 나머지 48개 뮤테이션 | `invalidateQueries()`만 사용 (refetch 대기) |

> **영향:** 뮤테이션 후 UI 업데이트까지 네트워크 왕복 시간만큼 지연 발생 가능

#### 오프라인 처리 여부

| 항목 | 상태 |
|---|---|
| `navigator.onLine` 감지 | ❌ 없음 |
| `online`/`offline` 이벤트 리스너 | ❌ 없음 |
| Service Worker | ❌ 없음 |
| 오프라인 캐시 전략 | ❌ 없음 |
| 연결 상태 UI 표시 | ❌ 없음 |
| Realtime 재연결 로직 | ❌ 없음 (Supabase 클라이언트 기본 재연결에 의존) |
| 폴링 폴백 | ⚠️ 부분적 — `refetchInterval`을 사용하는 7개 쿼리만 |

> **결론:** 오프라인 처리가 전혀 구현되어 있지 않습니다. 네트워크 단절 시 Realtime 구독이 중단되며, 복구 메커니즘은 Supabase 클라이언트 내장 재연결에만 의존합니다.
