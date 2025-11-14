# NEURALTWIN 온보딩 가이드

## 프로젝트 소개

NEURALTWIN은 AI 기반 실시간 매장 분석 관리자 대시보드입니다. 방문자 분석, 재고 관리, AI 예측을 통해 비즈니스 인사이트를 제공합니다.

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6

## 디자인 시스템

### 컬러 팔레트
- **Primary**: Neural Blue-Purple Gradient (#1B6BFF → #9B59FF)
- **Background**: Dark Navy (#0A1020)
- **Surface**: Glassmorphism (rgba(255, 255, 255, 0.05))

### 주요 유틸리티
- `gradient-text`: 그라디언트 텍스트 효과
- `hover-lift`: 호버 시 카드 리프트 효과
- `bg-gradient-primary`: 메인 그라디언트 배경
- `shadow-glow`: 글로우 효과 섀도우

### 애니메이션
- `animate-fade-in`: 페이드인 효과
- `animate-slide-up`: 슬라이드 업 효과
- `animate-scale-in`: 스케일 인 효과
- `animate-pulse-glow`: 펄스 글로우 효과

자세한 내용은 `src/index.css`와 `tailwind.config.ts`를 참고하세요.

## 프로젝트 구조 (2025-11-14 업데이트)

**Feature-based 아키텍처 완전 적용**

```
src/
├── components/           # 공유 컴포넌트만 유지
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── AppSidebar.tsx   # 사이드바 네비게이션
│   ├── DashboardLayout.tsx  # 공통 레이아웃
│   ├── DataReadinessGuard.tsx  # 데이터 준비 가드
│   ├── ProtectedRoute.tsx   # 인증 보호 라우트
│   ├── NavLink.tsx      # 네비게이션 링크
│   ├── StatCard.tsx     # 통계 카드 컴포넌트
│   └── ThemeToggle.tsx  # 다크모드 토글
│
├── core/                # 핵심 페이지
│   └── pages/
│       ├── AuthPage.tsx       # 로그인/회원가입
│       ├── DashboardPage.tsx  # 메인 대시보드
│       ├── SettingsPage.tsx   # 설정
│       └── NotFoundPage.tsx   # 404
│
├── features/            # Feature-based 모듈
│   ├── data-management/
│   │   ├── import/      # CSV/Excel 임포트
│   │   ├── analysis/    # 데이터 분석 (AI)
│   │   ├── ontology/    # 온톨로지 스키마
│   │   ├── bigdata/     # 외부 API 연동
│   │   └── neuralsense/ # WiFi 센서 관리
│   │
│   ├── store-analysis/
│   │   ├── stores/      # 매장 관리
│   │   ├── footfall/    # 고객 동선 분석
│   │   └── inventory/   # 재고 관리
│   │
│   ├── profit-center/
│   │   ├── demand-inventory/  # 수요 예측
│   │   ├── pricing/           # 가격 최적화
│   │   └── personalization/   # 개인화 추천
│   │
│   ├── cost-center/
│   │   └── automation/        # 인력/제품 효율성
│   │
│   └── digital-twin/
│       ├── components/  # 3D 컴포넌트
│       ├── pages/      # 3D 페이지
│       ├── utils/      # 3D 유틸리티
│       └── types/      # 3D 타입
│
├── hooks/              # 공유 커스텀 훅
├── utils/              # 공유 유틸리티
├── types/              # 공유 타입 정의
└── integrations/       # 외부 통합 (Supabase)
```

**상세 구조:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)  
**클린업 보고서:** [CLEANUP_2025_11_14.md](./CLEANUP_2025_11_14.md)
│   ├── Analytics.tsx    # 방문자 분석
│   ├── Inventory.tsx    # 재고 관리
│   ├── Forecasts.tsx    # AI 예측
│   └── Settings.tsx     # 설정
├── hooks/
│   └── useAuth.tsx      # 인증 훅
└── integrations/
    └── supabase/        # Supabase 클라이언트
```

## 시작하기

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. Supabase 설정

1. Supabase 프로젝트 생성 (또는 Lovable Cloud 활성화)
2. 환경 변수 설정:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. 데이터베이스 마이그레이션 실행:
   ```sql
   -- user_roles 테이블 생성
   -- stores, inventory, visitors, sales 테이블 생성
   ```

### 3. 역할 기반 접근 제어 (RBAC)

프로젝트는 세 가지 역할을 지원합니다:
- **admin**: 모든 기능 접근 가능
- **editor**: 데이터 편집 가능
- **viewer**: 읽기 전용

기본적으로 신규 사용자는 `viewer` 역할로 시작합니다.

## 주요 페이지 소개

### 1. Dashboard (`/`)
- 실시간 방문자 수, 매출, 재고 현황
- 시간대별 방문자 차트
- 최근 알림

### 2. Stores (`/stores`)
- 매장 목록 및 상세 정보
- 매장 추가/편집
- 운영 상태 관리

### 3. Analytics (`/analytics`)
- 방문자 히트맵
- 이동 경로 분석
- 체류 시간 분석
- 전환 퍼널

### 4. Inventory (`/inventory`)
- 재고 현황 테이블
- 발주 요청 기능
- 재고 알림

### 5. Forecasts (`/forecasts`)
- AI 기반 방문자 예측
- 매출 예측
- 추천 인사이트

### 6. Settings (`/settings`)
- 프로필 설정
- 알림 설정
- 계정 관리

## 인증 시스템

### 로그인
- 이메일/비밀번호 인증
- Supabase Auth 사용
- Protected Routes로 보호

### 회원가입
- 이메일 검증
- 자동으로 `viewer` 역할 부여
- `user_roles` 테이블에 기록

### 보호된 라우트
모든 대시보드 페이지는 `ProtectedRoute` 컴포넌트로 보호됩니다.
로그인하지 않은 사용자는 `/auth`로 자동 리다이렉트됩니다.

## 개발 가이드

### 새 페이지 추가

1. `src/pages/NewPage.tsx` 생성
2. `src/App.tsx`에 라우트 추가:
   ```tsx
   <Route
     path="/new-page"
     element={
       <ProtectedRoute>
         <NewPage />
       </ProtectedRoute>
     }
   />
   ```
3. `src/components/AppSidebar.tsx`에 메뉴 아이템 추가

### 새 컴포넌트 생성

1. 재사용 가능한 컴포넌트는 `src/components/`에 생성
2. 페이지별 컴포넌트는 해당 페이지 파일 내에 정의
3. 디자인 시스템의 유틸리티 클래스 활용

### 스타일링 가이드

✅ **좋은 예시**:
```tsx
<Button className="bg-gradient-primary hover:shadow-glow">
  <span className="gradient-text">클릭</span>
</Button>
```

❌ **나쁜 예시**:
```tsx
<Button className="bg-blue-500 hover:bg-blue-600">
  <span className="text-white">클릭</span>
</Button>
```

항상 디자인 시스템의 semantic tokens를 사용하세요!

## 데이터베이스 스키마

### user_roles
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- role: app_role (admin | editor | viewer)
- created_at: timestamp
```

### stores
```sql
- id: uuid (PK)
- name: text
- location: text
- status: text
- created_at: timestamp
```

### inventory
```sql
- id: uuid (PK)
- store_id: uuid (FK)
- product_name: text
- quantity: integer
- min_quantity: integer
- updated_at: timestamp
```

### visitors
```sql
- id: uuid (PK)
- store_id: uuid (FK)
- timestamp: timestamp
- count: integer
```

### sales
```sql
- id: uuid (PK)
- store_id: uuid (FK)
- timestamp: timestamp
- amount: decimal
```

## RLS (Row Level Security) 정책

모든 테이블에 RLS가 활성화되어 있습니다:
- **admin**: 모든 작업 가능 (SELECT, INSERT, UPDATE, DELETE)
- **editor**: SELECT, INSERT, UPDATE만 가능
- **viewer**: SELECT만 가능

## 트러블슈팅

### 로그인 후 대시보드가 로딩되지 않음
- Supabase 환경 변수 확인
- 브라우저 콘솔에서 에러 확인
- `user_roles` 테이블에 사용자 역할이 있는지 확인

### 차트가 표시되지 않음
- 데이터가 있는지 확인
- Recharts 컴포넌트의 데이터 형식 확인

### 스타일이 적용되지 않음
- Tailwind 클래스 이름 확인
- 다크모드 설정 확인
- `index.css`의 커스텀 유틸리티 확인

## 다음 단계

1. ✅ 기본 인증 시스템 완료
2. ✅ 디자인 시스템 적용 완료
3. ⏳ Supabase Realtime 연동
4. ⏳ 실제 데이터 연동
5. ⏳ AI 예측 모델 통합

## 도움이 필요하신가요?

- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Router 문서](https://reactrouter.com)

협업 가이드는 `COLLABORATION_GUIDE.md`를 참고하세요.
