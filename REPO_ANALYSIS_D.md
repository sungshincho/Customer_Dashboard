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
