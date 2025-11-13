# NEURALTWIN 프로젝트 변경 이력

## 2025년 1월 13일 (UTC 기준)

### 🏗️ 주요 리팩토링 및 코드 정리

#### 중복 제거 및 구조 개선
- **중복 컴포넌트 폴더 제거**
  - `src/features/data-management/analysis/components` 폴더 제거
  - 모든 분석 컴포넌트는 `src/components/analysis`로 통합
  - 14개 중복 파일 제거 (AIAnalysisButton, AIInsights, AdvancedFilters 등)

- **컴포넌트 구조 정리**
  - `src/components/etl` → features로 통합 완료
  - `src/components/schema` → features로 통합 완료
  - `src/components/graph` → features로 통합 완료
  - 중앙 집중화된 컴포넌트 구조로 개선

---

## 2025년 1월 13일 - 오전 (UTC 기준)

### 🎨 3D 시각화 오버레이 시스템 추가

#### 새로운 3D 오버레이 컴포넌트
1. **CustomerPathOverlay** (`src/features/digital-twin/components/overlays/CustomerPathOverlay.tsx`)
   - 고객 동선을 3D 경로로 시각화
   - 애니메이션 효과로 실시간 이동 경로 표시
   - 시작점(녹색), 종료점(빨간색) 마커
   - 경로 라인 색상 커스터마이징 가능

2. **HeatmapOverlay3D** (`src/features/digital-twin/components/overlays/HeatmapOverlay3D.tsx`)
   - 방문 밀도를 3D 히트맵으로 시각화
   - 높이 기반 밀도 표현
   - Blue → Green → Yellow → Red 색상 그라데이션
   - 실시간 핫스팟 감지

3. **ProductInfoOverlay** (`src/features/digital-twin/components/overlays/ProductInfoOverlay.tsx`)
   - 제품별 재고 정보를 3D 마커로 표시
   - 호버 시 상세 정보 카드 (재고, 수요, 가격)
   - 재고 상태별 색상 구분 (정상/부족/긴급)
   - 긴급 상품에 대한 펄스 애니메이션

#### Store3DViewer 확장
- `overlay` prop 추가로 오버레이 컴포넌트 주입 가능
- ReactNode 타입으로 유연한 오버레이 시스템

#### 적용된 페이지
1. **방문자 현황** (`FootfallAnalysisPage`)
   - CustomerPathOverlay 통합
   - 실시간 고객 동선 추적

2. **동선 히트맵** (`TrafficHeatmapPage`)
   - HeatmapOverlay3D 통합
   - 3D 밀도 시각화

3. **통합 대시보드** (`ProfitCenterPage`)
   - ProductInfoOverlay 통합
   - 제품 재고 현황 3D 시각화

---

## 2025년 1월 13일 - 새벽 (UTC 기준)

### 🏪 매장별 3D 모델 뷰어 추가

#### Store3DViewer 컴포넌트 생성
- 자동 3D 모델 로드 (GLB/GLTF)
- Supabase Storage 통합
- OrbitControls, Grid, Environment 포함
- 매장별 모델 경로: `{userId}/{storeId}/3d-models/`

#### 7개 분석 페이지에 3D 뷰어 탭 추가
1. **방문자 현황** - `FootfallAnalysisPage`
2. **동선 히트맵** - `TrafficHeatmapPage`
3. **고객 여정 맵** - `CustomerJourneyPage`
4. **전환 퍼널** - `ConversionFunnelPage`
5. **통합 대시보드** - `ProfitCenterPage`
6. **레이아웃 시뮬레이터** - `LayoutSimulatorPage`
7. **직원 효율성 분석** - `StaffEfficiencyPage`

각 페이지에 "3D 매장" 탭 추가로 통일된 3D 뷰어 접근 제공

---

## 2025년 1월 12일 오후 (UTC 기준)

### 📊 매장별 데이터 관리 시스템

#### 데이터 임포트 매장 연동
- **DataImportPage** 업데이트
  - `store_id` 기반 데이터 필터링
  - 선택된 매장의 데이터만 표시
  - 업로드 시 자동 `store_id` 매핑

#### 3D 데이터 설정 매장 연동
- **Setup3DDataPage** 업데이트
  - 매장별 샘플 데이터 생성
  - 선택된 매장에만 3D 데이터 저장
  - 매장 선택 검증 추가

- **sampleDataGenerator.ts** 리팩토링
  - `storeId` 파라미터 추가
  - `insertSample3DData(userId, storeId)`
  - `checkSampleDataExists(userId, storeId)`
  - `deleteSampleData(userId, storeId)`

#### 임포트 기록 매장별 필터링
- 현재 선택된 매장의 임포트 기록만 표시
- 매장 미선택 시 안내 메시지 표시
- 자동 리로드 기능 (매장 변경 시)

---

## 주요 기술 스택

### Frontend
- **React 18.3** + TypeScript
- **Vite** - 빌드 도구
- **Tailwind CSS** + shadcn/ui - 디자인 시스템
- **React Router 6** - 라우팅
- **TanStack Query** - 서버 상태 관리

### 3D 렌더링
- **Three.js 0.160**
- **@react-three/fiber 8.18**
- **@react-three/drei 9.122**

### Backend (Supabase)
- **PostgreSQL** - 메인 데이터베이스
- **Row Level Security (RLS)** - 데이터 보안
- **Storage** - 파일 관리 (3D 모델, CSV)
- **Edge Functions** - 서버리스 로직

### 데이터 처리
- **XLSX** - Excel/CSV 파싱
- **jsPDF** - PDF 생성
- **Recharts** - 차트 시각화

---

## 프로젝트 구조

```
src/
├── components/
│   ├── analysis/          # 공통 분석 컴포넌트 (통합됨)
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── AppSidebar.tsx
│   ├── DashboardLayout.tsx
│   └── ...
├── core/
│   └── pages/             # 핵심 페이지 (Auth, Dashboard, Settings)
├── features/
│   ├── store-analysis/    # 매장 분석 기능
│   │   ├── footfall/      # 방문자 분석
│   │   ├── stores/        # 매장 관리
│   │   └── inventory/     # 재고 관리
│   ├── profit-center/     # 수익 센터
│   │   ├── demand-inventory/  # 수요 예측 & 재고 최적화
│   │   ├── pricing/       # 가격 최적화
│   │   └── personalization/   # 개인화 & 레이아웃
│   ├── cost-center/       # 비용 센터
│   │   └── automation/    # 자동화 분석
│   ├── data-management/   # 데이터 관리
│   │   ├── import/        # 데이터 임포트
│   │   ├── ontology/      # 온톨로지 & 그래프
│   │   ├── analysis/      # 고급 분석
│   │   ├── neuralsense/   # NeuralSense 설정
│   │   └── bigdata/       # Big Data API
│   └── digital-twin/      # 디지털 트윈 3D
│       ├── components/
│       │   ├── overlays/  # 3D 오버레이 (NEW)
│       │   ├── SceneComposer.tsx
│       │   ├── Store3DViewer.tsx
│       │   └── ...
│       ├── pages/
│       └── utils/
├── hooks/                 # 커스텀 React Hooks
├── utils/                 # 유틸리티 함수
└── integrations/
    └── supabase/          # Supabase 클라이언트 & 타입
```

---

## Storage 구조

### 3d-models (Public)
```
{userId}/
  └── {storeId}/
      └── 3d-models/
          ├── store.glb
          ├── floor-plan.gltf
          └── ...
```

### store-data (Private)
```
{userId}/
  └── {storeId}/
      ├── customers.csv
      ├── products.csv
      ├── purchases.csv
      ├── visits.csv
      └── staff.csv
```

---

## 데이터베이스 주요 테이블

### stores
- 매장 정보 관리
- RLS: user_id 기반 접근 제어

### data_imports
- 데이터 임포트 기록
- store_id 연결로 매장별 필터링

### graph_entities & graph_relations
- 온톨로지 그래프 데이터
- 엔티티 및 관계 정의

### inventory_levels
- 실시간 재고 수준
- product_id, store_id 연결

### classification_patterns
- 자동 분류 학습 패턴
- ETL 최적화

---

## 향후 개선 사항

### 단기 (1-2주)
- [ ] 3D 오버레이 시간대별 필터 추가
- [ ] 제품 마커 클릭 시 상세 모달
- [ ] 고객 유형별 동선 색상 구분
- [ ] 성능 최적화 (메모이제이션, 레이지 로딩)

### 중기 (1-2개월)
- [ ] AI 기반 레이아웃 자동 최적화
- [ ] 실시간 센서 데이터 통합
- [ ] 모바일 최적화
- [ ] 멀티 테넌시 지원

### 장기 (3-6개월)
- [ ] VR/AR 지원
- [ ] 예측 모델 고도화
- [ ] 엔터프라이즈 기능 (SSO, 감사 로그)
- [ ] 글로벌 확장 (다국어, 타임존)

---

## 성능 지표

### 현재 번들 크기
- 초기 로드: ~1.2MB (gzip)
- Three.js 청크: ~500KB
- 코드 스플리팅 적용 완료

### 렌더링 성능
- 3D 뷰어 FPS: 60fps (일반적 케이스)
- 히트맵 오버레이: 45-60fps
- 경로 애니메이션: 30-60fps

---

## 보안 사항

### RLS (Row Level Security) 정책
- 모든 주요 테이블에 RLS 활성화
- user_id 기반 데이터 격리
- store_id 추가 필터링

### Storage 보안
- 3d-models: Public (읽기 전용)
- store-data: Private (소유자만 접근)
- 업로드 크기 제한: 50MB

### 인증
- Supabase Auth
- 이메일 자동 확인 활성화
- 세션 관리 (localStorage)

---

## 유지보수 가이드

### 코드 스타일
- ESLint + Prettier 설정 적용
- TypeScript strict 모드
- 컴포넌트당 300줄 이하 권장

### 컴포넌트 작성 규칙
1. 분석 공통 컴포넌트는 `src/components/analysis`에 위치
2. 기능별 컴포넌트는 해당 feature 폴더 내부에
3. UI 컴포넌트는 `src/components/ui` (shadcn)
4. Props 타입은 interface로 정의
5. 복잡한 로직은 커스텀 훅으로 분리

### 데이터베이스 변경
1. Supabase migration 툴 사용 필수
2. RLS 정책 항상 고려
3. 인덱스 최적화 확인
4. 백업 후 마이그레이션 실행

### 3D 모델 가이드라인
- GLB 포맷 권장 (GLTF + bin 통합)
- 폴리곤 수: 50k 이하 권장
- 텍스처: 2K 이하
- 파일 크기: 10MB 이하

---

## 문제 해결

### 3D 모델이 표시되지 않음
1. Storage 경로 확인: `{userId}/{storeId}/3d-models/`
2. 파일 형식 확인: .glb 또는 .gltf
3. 버킷 권한 확인: 3d-models 버킷 public 여부

### 데이터 임포트 실패
1. CSV 인코딩 확인 (UTF-8)
2. 컬럼 헤더 확인
3. store_id 매핑 확인
4. 파일 크기 제한 (50MB)

### 성능 저하
1. Chrome DevTools Performance 탭 확인
2. React Profiler 사용
3. 불필요한 리렌더링 확인
4. 메모이제이션 적용 (useMemo, useCallback)

---

## 연락처 및 리소스

- **문서**: 프로젝트 내 `/docs` 폴더
- **이슈 트래킹**: GitHub Issues
- **디자인 시스템**: Figma (링크 필요)
- **API 문서**: Supabase Dashboard

---

**마지막 업데이트**: 2025년 1월 13일 09:45 UTC
**프로젝트 버전**: 0.9.0 (베타)
