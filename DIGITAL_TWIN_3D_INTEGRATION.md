# NEURALTWIN 3D 디지털트윈 통합 가이드

## 📋 목차
1. [개요](#개요)
2. [3D 디지털트윈 적용 가능 기능](#3d-디지털트윈-적용-가능-기능)
3. [기능별 콘텐츠 기획](#기능별-콘텐츠-기획)
4. [임베딩 방법 비교](#임베딩-방법-비교)
5. [권장 솔루션 및 로드맵](#권장-솔루션-및-로드맵)
6. [기술 스택](#기술-스택)
7. [데이터 동기화 인터페이스](#데이터-동기화-인터페이스)
8. [예상 비용](#예상-비용)
9. [구현 우선순위](#구현-우선순위)

---

## 개요

NEURALTWIN 프로젝트는 AI 기반 리테일 분석 플랫폼으로, 언리얼 엔진으로 제작한 3D 디지털트윈 매장 콘텐츠를 통합하여 데이터 시각화 및 사용자 경험을 혁신적으로 개선할 수 있습니다.

### 핵심 목표
- **실시간 데이터 시각화**: 매장 내 고객 동선, 트래픽, 재고를 3D로 표현
- **인터랙티브 분석**: 사용자가 3D 공간에서 직접 데이터를 탐색
- **의사결정 지원**: 레이아웃 시뮬레이션을 통한 매장 최적화

---

## 3D 디지털트윈 적용 가능 기능

### 1. LayoutSimulator (레이아웃 시뮬레이터) ⭐⭐⭐⭐⭐
**현재 기능**: 2D 그리드에서 제품 배치 시뮬레이션
**3D 적용 효과**: 
- 실제 매장 환경에서 제품 배치 시뮬레이션
- 공간 활용도 시각화
- 고객 시선 높이 고려한 진열 최적화

**비즈니스 임팩트**: 매우 높음 (매출 직결)

---

### 2. TrafficHeatmap (트래픽 히트맵) ⭐⭐⭐⭐⭐
**현재 기능**: 2D 캔버스 기반 방문 빈도 시각화
**3D 적용 효과**:
- 매장 층고를 고려한 입체적 트래픽 분석
- 구역별 체류 시간 3D 히트맵
- 시간대별 동선 애니메이션

**비즈니스 임팩트**: 매우 높음 (공간 최적화)

---

### 3. FootfallVisualizer (실시간 발걸음 분석) ⭐⭐⭐⭐
**현재 기능**: 차트 기반 방문객 수 분석
**3D 적용 효과**:
- 실시간 고객 아바타 표시
- 동선 추적 라인
- 혼잡도 실시간 시각화

**비즈니스 임팩트**: 높음 (운영 효율)

---

### 4. CustomerJourney (고객 여정 분석) ⭐⭐⭐⭐
**현재 기능**: 순서도 형태의 여정 시각화
**3D 적용 효과**:
- 입구→관심구역→구매→출구 3D 경로
- 체류 지점 강조
- 이탈 지점 분석

**비즈니스 임팩트**: 높음 (전환율 개선)

---

### 5. ZoneContribution (구역별 기여도) ⭐⭐⭐
**현재 기능**: 카드 리스트 + 진행바
**3D 적용 효과**:
- 구역별 매출을 3D 막대 차트로 표현
- 매장 평면도 위에 데이터 오버레이
- 실시간 매출 변동 애니메이션

**비즈니스 임팩트**: 중간 (분석 보조)

---

### 6. StoreHeatmap (매장 히트맵) ⭐⭐⭐
**현재 기능**: 2D 캔버스 기반 방문 빈도
**3D 적용 효과**:
- 3D 포인트 클라우드로 방문 빈도 표현
- 볼륨 렌더링 효과
- 카메라 회전을 통한 다각도 분석

**비즈니스 임팩트**: 중간 (시각화 개선)

---

## 기능별 콘텐츠 기획

### 1. LayoutSimulator - 3D 콘텐츠 기획

#### Visual 요소
```
3D Assets:
├── 매장 구조
│   ├── 바닥 (텍스처 매핑)
│   ├── 벽면 (실제 치수)
│   ├── 기둥, 통로
│   └── 조명 (리얼타임 라이팅)
├── 제품 모델
│   ├── 선반 (카테고리별)
│   ├── 냉장고/냉동고
│   ├── 계산대
│   └── 제품 박스 (LOD 적용)
└── UI 오버레이
    ├── 매출 정보 라벨
    ├── 전환율 인디케이터
    └── AI 추천 하이라이트
```

#### Interaction
- **드래그 앤 드롭**: 3D 제품 모델을 마우스로 이동
- **스냅 기능**: 격자에 자동 정렬
- **회전**: 마우스 우클릭으로 카메라 회전
- **줌**: 마우스 휠로 줌 인/아웃
- **AI 제안 적용**: 버튼 클릭 시 제품 자동 배치 애니메이션
- **비교 모드**: 슬라이더로 현재/제안 레이아웃 전환

#### 데이터 동기화
```typescript
interface LayoutUpdate {
  products: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    category: string;
  }>;
  metrics: {
    conversionRate: number;
    traffic: number;
    dwellTime: number;
  };
  timestamp: number;
}
```

---

### 2. TrafficHeatmap - 3D 콘텐츠 기획

#### Visual 요소
```
3D Layers:
├── 매장 평면도 (베이스)
├── 동적 히트맵 텍스처
│   ├── 높은 트래픽: 빨간색 (Emissive)
│   ├── 중간 트래픽: 노란색
│   └── 낮은 트래픽: 파란색
├── 파티클 효과
│   └── 고밀도 구역에 볼륨 파티클
└── 시간 슬라이더 (UI)
    └── 1시간 단위 재생
```

#### Interaction
- **시간대 선택**: 타임라인 슬라이더로 특정 시간 트래픽 확인
- **구역 클릭**: 특정 구역 클릭 시 상세 통계 팝업
- **카메라 프리셋**: 버튼으로 "입구뷰", "전체뷰", "계산대뷰" 전환
- **히트맵 강도 조절**: 슬라이더로 시각화 강도 조정
- **애니메이션 재생**: 24시간 트래픽 변화 자동 재생

#### 데이터 동기화
```typescript
interface HeatmapData {
  timestamp: number;
  zones: Array<{
    id: string;
    coordinates: { x: number; y: number; z: number };
    intensity: number; // 0-1
    visitCount: number;
  }>;
}
```

---

### 3. FootfallVisualizer - 3D 콘텐츠 기획

#### Visual 요소
```
3D Elements:
├── 고객 아바타
│   ├── 단순화된 3D 모델 (성능 최적화)
│   ├── 이동 애니메이션
│   └── 색상 코딩 (신규/재방문)
├── 동선 트레일
│   ├── 반투명 라인
│   └── Fade-out 효과
└── 실시간 카운터
    ├── 입구 카운터
    ├── 구역별 카운터
    └── 체류 시간 표시
```

#### Interaction
- **개별 방문객 추적**: 아바타 클릭 시 해당 고객 정보 표시
- **필터링**: 신규/재방문 고객 필터
- **속도 조절**: 재생 속도 1x, 2x, 5x
- **카메라 추적**: 특정 고객 자동 따라가기
- **일시정지/재생**: 실시간 피드 제어

#### 데이터 동기화
```typescript
interface VisitorUpdate {
  sessionId: string;
  visitors: Array<{
    id: string;
    position: { x: number; y: number };
    velocity: { vx: number; vy: number };
    type: 'new' | 'returning';
    dwellTime: number;
  }>;
  totalCount: number;
  timestamp: number;
}
```

---

### 4. CustomerJourney - 3D 콘텐츠 기획

#### Visual 요소
```
3D Journey Path:
├── 경로 라인
│   ├── 입구 (초록색)
│   ├── 관심 구역 (파란색)
│   ├── 구매 지점 (골드)
│   └── 출구 (회색)
├── 웨이포인트 마커
│   ├── 체류 시간 표시 (크기)
│   └── 구매 여부 (아이콘)
└── 통계 패널
    ├── 평균 경로 길이
    ├── 전환율
    └── 이탈 구역
```

#### Interaction
- **경로 재생**: 고객 여정을 시간순으로 애니메이션
- **세그먼트 분석**: 특정 구간 클릭 시 상세 분석
- **비교 모드**: 전환 고객 vs 비전환 고객 경로 비교
- **히트스팟 표시**: 가장 많이 방문한 지점 강조

---

### 5. ZoneContribution - 3D 콘텐츠 기획

#### Visual 요소
```
3D Data Visualization:
├── 매장 평면도 (베이스)
├── 구역별 3D 막대 차트
│   ├── 높이: 매출액
│   ├── 색상: 수익성 (그라디언트)
│   └── 텍스처: 메탈릭 (프리미엄 느낌)
├── 레이블
│   ├── 구역 이름
│   ├── 매출액
│   └── 전월 대비 증감률
└── 비교 모드
    └── 기간별 차트 겹쳐보기
```

#### Interaction
- **막대 클릭**: 구역 상세 통계
- **기간 선택**: 일/주/월 단위 데이터 전환
- **정렬**: 매출순/전환율순 정렬 애니메이션
- **필터**: 특정 카테고리만 표시

---

### 6. StoreHeatmap - 3D 콘텐츠 기획

#### Visual 요소
```
3D Heatmap:
├── 포인트 클라우드
│   ├── 각 방문을 3D 점으로 표현
│   ├── 밀도에 따른 색상 변화
│   └── 부드러운 블렌딩
├── 볼륨 렌더링
│   ├── 반투명 안개 효과
│   └── 고밀도 구역 강조
└── 시간 애니메이션
    └── 시간대별 히트맵 변화
```

#### Interaction
- **회전**: 360도 자유 회전
- **슬라이스 뷰**: 특정 높이 단면 보기
- **밀도 임계값**: 슬라이더로 표시 범위 조절
- **시간 비교**: 특정 시간대 히트맵 비교

---

## 임베딩 방법 비교

### Option A: Unreal Pixel Streaming
**개요**: 언리얼 엔진을 서버에서 실행하고 스트리밍으로 전송

#### 장점
- ✅ 최고 수준의 그래픽 품질 (레이트레이싱, 고해상도 텍스처)
- ✅ 언리얼 엔진의 모든 기능 활용 가능
- ✅ 클라이언트 성능 무관 (서버에서 렌더링)
- ✅ 복잡한 물리 시뮬레이션 가능

#### 단점
- ❌ **서버 비용**: GPU 인스턴스 필요 (AWS g4dn.xlarge ~$0.53/시간)
- ❌ **동시 사용자**: 각 사용자마다 별도 인스턴스 필요
- ❌ **네트워크 지연**: 인터랙션에 100-300ms 딜레이
- ❌ **개발 복잡도**: 인프라 관리, 스케일링, 로드밸런싱 필요
- ❌ **대역폭**: 사용자당 5-15 Mbps 필요

#### 비용 추정
```
시나리오 1: 24/7 운영 (1인 동시 접속)
- AWS g4dn.xlarge: $0.53/시간 × 730시간 = $387/월
- 네트워크: ~$50/월
- 총: ~$440/월

시나리오 2: 10명 동시 접속 대응
- 인스턴스 10개: $3,870/월
- 로드 밸런서: $20/월
- 네트워크: ~$200/월
- 총: ~$4,090/월
```

#### 적합한 경우
- 🎯 엔터프라이즈 고객 전용 (예산 충분)
- 🎯 데모/전시용 (제한된 시간, 통제된 환경)
- 🎯 초고품질 시각화가 필수인 경우

---

### Option B: WebGL (Three.js / Babylon.js)
**개요**: 브라우저 네이티브 3D 렌더링 (React Three Fiber)

#### 장점
- ✅ **서버 비용 0원** (클라이언트 렌더링)
- ✅ **즉각적인 인터랙션** (지연 없음)
- ✅ **무제한 동시 사용자** (확장성 무한)
- ✅ **간단한 배포** (정적 파일 호스팅만 필요)
- ✅ **React 통합 용이** (Lovable Cloud와 완벽 호환)
- ✅ **빠른 로딩** (Progressive Loading 가능)

#### 단점
- ❌ **그래픽 품질**: 언리얼 엔진 대비 낮음 (No 레이트레이싱)
- ❌ **클라이언트 성능 의존**: 저사양 PC에서 성능 저하
- ❌ **에셋 변환 필요**: Unreal → glTF/GLB 변환 작업
- ❌ **제한된 기능**: 복잡한 쉐이더나 물리 시뮬레이션 어려움

#### 비용 추정
```
월간 비용: $0 (CDN만 필요)
- Lovable Cloud 호스팅: 무료
- 3D 에셋 저장: ~$5/월 (100GB 이하)
- 총: ~$5/월
```

#### 적합한 경우
- ✅ **MVP 단계** (빠른 검증 필요)
- ✅ **다수 사용자** (동시 접속 많을 것으로 예상)
- ✅ **실시간 데이터 연동** (Supabase Realtime과 통합)
- ✅ **비용 최소화** (스타트업, 초기 단계)

---

### Option C: Hybrid (Static 3D + API)
**개요**: 언리얼에서 고품질 렌더링 → 이미지/동영상 → WebGL로 표시

#### 장점
- ✅ **언리얼 품질 유지** (사전 렌더링)
- ✅ **낮은 런타임 비용** (정적 파일 제공)
- ✅ **빠른 로딩** (압축된 미디어)
- ✅ **실시간 데이터 오버레이** (WebGL로 그래프/레이블 추가)

#### 단점
- ❌ **매장 변경 시 재렌더링 필요**
- ❌ **제한된 인터랙션** (사전 정의된 각도만)
- ❌ **스토리지 필요** (여러 각도 이미지)

#### 비용 추정
```
초기 렌더링 비용: $100-500 (외주 또는 로컬 렌더팜)
월간 운영 비용: $10-20 (CDN + 스토리지)
```

#### 적합한 경우
- 🎯 매장 레이아웃이 자주 바뀌지 않음
- 🎯 특정 뷰포인트만 필요 (입구, 계산대 등)
- 🎯 고품질 + 저비용 절충안

---

### Option D: Unreal Web Build (Experimental)
**개요**: 언리얼 엔진을 WebAssembly로 빌드

#### 장점
- ✅ 서버 비용 없음
- ✅ 언리얼 기능 유지

#### 단점
- ❌ **빌드 크기 거대** (100MB-1GB+)
- ❌ **로딩 시간 길음** (1-5분)
- ❌ **브라우저 호환성 문제** (모바일 지원 제한)
- ❌ **실험적 기능** (안정성 낮음)

#### 적합한 경우
- ⚠️ **권장하지 않음** (현 시점 기준)

---

## 비교 요약표

| 항목 | Pixel Streaming | WebGL (Three.js) | Hybrid | Web Build |
|------|----------------|------------------|--------|-----------|
| **그래픽 품질** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **비용** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **개발 복잡도** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **인터랙션** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **로딩 속도** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **확장성** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **모바일 지원** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **유지보수** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 권장 솔루션 및 로드맵

### 🎯 최종 권장: 단계별 접근

#### Phase 1: MVP (1-2개월) - **Option B (Three.js)**
**목표**: 핵심 기능 검증, 사용자 피드백 수집

**구현 기능**:
1. **TrafficHeatmap 3D** (우선순위 1)
   - 2D 히트맵 → 3D 볼륨 렌더링
   - 시간대별 애니메이션
   
2. **LayoutSimulator 3D** (우선순위 2)
   - 간단한 3D 제품 모델
   - 드래그 앤 드롭 인터랙션

3. **FootfallVisualizer 3D** (우선순위 3)
   - 실시간 고객 아바타
   - 동선 트레일

**기술 스택**:
```
Frontend:
- React Three Fiber (@react-three/fiber ^8.18)
- React Three Drei (@react-three/drei ^9.122)
- Three.js (^0.133)
- Zustand (상태관리)
- React Spring (애니메이션)

Backend:
- Supabase/Lovable Cloud (기존)
- Realtime Subscriptions (WebSocket)

3D Assets:
- Blender (모델링)
- glTF 2.0 (포맷)
```

**예상 비용**: $0-5/월 (Lovable Cloud 내)

---

#### Phase 2: Production (3-6개월) - **Option C + B**
**목표**: 프로덕션 품질, 성능 최적화

**개선 사항**:
1. **Hybrid Rendering**:
   - 언리얼에서 고품질 매장 모델 렌더링 → glTF 익스포트
   - 정적 요소 (건물, 선반): Unreal 품질
   - 동적 요소 (고객, 데이터): Three.js 실시간 렌더링

2. **성능 최적화**:
   - LOD (Level of Detail) 시스템
   - Occlusion Culling
   - Instanced Rendering (수백 명 고객 처리)

3. **추가 기능**:
   - CustomerJourney 3D
   - ZoneContribution 3D
   - VR 지원 (옵션)

**예상 비용**: $10-30/월 (CDN + 고품질 에셋 스토리지)

---

#### Phase 3: Enterprise (6개월+) - **Option A (선택적)**
**목표**: 엔터프라이즈 고객 대응

**추가 기능**:
- Pixel Streaming (VIP 고객 전용)
- 최고 품질 시각화
- 맞춤형 매장 렌더링

**예상 비용**: 고객별 협의 ($500-5,000/월)

---

## 기술 스택

### Phase 1 (Three.js 기반) 상세 스택

#### Frontend Core
```json
{
  "dependencies": {
    "@react-three/fiber": "^8.18.0",
    "@react-three/drei": "^9.122.0",
    "three": "^0.133.0",
    "@react-three/postprocessing": "^2.16.0",
    "leva": "^0.9.35",
    "zustand": "^4.5.0",
    "@react-spring/three": "^9.7.0"
  }
}
```

#### 주요 라이브러리 역할

**@react-three/fiber**:
- Three.js를 React 컴포넌트로 사용
- 선언적 3D 씬 구성
```tsx
<Canvas>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial color="blue" />
  </mesh>
</Canvas>
```

**@react-three/drei**:
- 유틸리티 컴포넌트 모음
- OrbitControls, Environment, Text3D 등
```tsx
<OrbitControls />
<Environment preset="sunset" />
<Text3D font="/fonts/helvetiker_regular.json">
  Zone A
</Text3D>
```

**@react-three/postprocessing**:
- 후처리 효과 (Bloom, SSAO, DOF 등)
```tsx
<EffectComposer>
  <Bloom intensity={1.5} />
  <SSAO />
</EffectComposer>
```

**Zustand**:
- 경량 상태관리
```typescript
const useStore = create((set) => ({
  heatmapData: [],
  updateHeatmap: (data) => set({ heatmapData: data })
}))
```

---

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    React Dashboard                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │              3D Canvas (R3F)                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │  │
│  │  │  Store 3D   │  │  Heatmap    │  │ Avatars  │ │  │
│  │  │   Model     │  │  Overlay    │  │ (Inst.)  │ │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │       OrbitControls / Camera                │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Control Panel (2D UI)                    │  │
│  │  [Time Slider] [Filters] [Camera Presets]        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕ WebSocket / REST API
┌─────────────────────────────────────────────────────────┐
│              Supabase / Lovable Cloud                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Database   │  │   Realtime   │  │     Edge     │  │
│  │   (Tables)   │  │ (WebSocket)  │  │  Functions   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│              NeuralSense / External Data                 │
│  (센서, POS, ERP, 수동 업로드)                           │
└─────────────────────────────────────────────────────────┘
```

---

## 데이터 동기화 인터페이스

### 1. TrafficHeatmap 실시간 동기화

#### Database Schema (Supabase)
```sql
CREATE TABLE traffic_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  zone_id VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  person_id VARCHAR(100),
  dwell_time INTEGER -- 초 단위
);

CREATE INDEX idx_traffic_timestamp ON traffic_logs(timestamp);
CREATE INDEX idx_traffic_zone ON traffic_logs(zone_id);
```

#### WebSocket Subscription (Frontend)
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useStore } from './store';

export const useTrafficRealtime = () => {
  const updateHeatmap = useStore(state => state.updateHeatmap);

  useEffect(() => {
    const channel = supabase
      .channel('traffic-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_logs'
        },
        (payload) => {
          // 새 트래픽 데이터 수신
          updateHeatmap(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
```

#### 3D Component (Three.js)
```tsx
import { useTrafficRealtime } from './useTrafficRealtime';
import { HeatmapMaterial } from './HeatmapMaterial';

const TrafficHeatmap3D = () => {
  useTrafficRealtime(); // 실시간 동기화
  const heatmapData = useStore(state => state.heatmapData);

  return (
    <Canvas>
      <mesh>
        <planeGeometry args={[50, 50, 100, 100]} />
        <HeatmapMaterial data={heatmapData} />
      </mesh>
    </Canvas>
  );
};
```

---

### 2. FootfallVisualizer 아바타 동기화

#### TypeScript Interface
```typescript
interface VisitorPosition {
  id: string;
  x: number;
  y: number;
  z: number;
  velocity: { vx: number; vy: number };
  state: 'walking' | 'standing' | 'exiting';
  timestamp: number;
}

interface VisitorBatch {
  storeId: string;
  visitors: VisitorPosition[];
  totalCount: number;
  newVisitors: number;
  exitedVisitors: number;
}
```

#### Edge Function (server-side aggregation)
```typescript
// supabase/functions/footfall-aggregator/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const { storeId, timeWindow } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 최근 1분간 데이터 집계
  const { data: recentTraffic } = await supabase
    .from('traffic_logs')
    .select('*')
    .eq('store_id', storeId)
    .gte('timestamp', new Date(Date.now() - timeWindow * 1000).toISOString())
    .order('timestamp', { ascending: false });

  // 중복 제거 및 위치 추정
  const visitors = aggregateVisitors(recentTraffic);

  return new Response(JSON.stringify({ visitors }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Frontend Polling (매 2초)
```typescript
import { useQuery } from '@tanstack/react-query';

export const useFootfallData = (storeId: string) => {
  return useQuery({
    queryKey: ['footfall', storeId],
    queryFn: async () => {
      const res = await fetch('/functions/v1/footfall-aggregator', {
        method: 'POST',
        body: JSON.stringify({ storeId, timeWindow: 60 })
      });
      return res.json();
    },
    refetchInterval: 2000 // 2초마다 갱신
  });
};
```

---

### 3. LayoutSimulator 동기화

#### Optimistic Update 패턴
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLayout: LayoutUpdate) => {
      const { data, error } = await supabase
        .from('store_layouts')
        .upsert(newLayout);
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newLayout) => {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      await queryClient.cancelQueries(['layout']);
      const previous = queryClient.getQueryData(['layout']);
      queryClient.setQueryData(['layout'], newLayout);
      return { previous };
    },
    onError: (err, newLayout, context) => {
      // 실패 시 롤백
      queryClient.setQueryData(['layout'], context?.previous);
    },
    onSettled: () => {
      // 서버 데이터로 최종 동기화
      queryClient.invalidateQueries(['layout']);
    }
  });
};
```

---

## 예상 비용

### Phase 1 (Three.js MVP) - 월 $0-10

| 항목 | 비용 | 비고 |
|------|------|------|
| Lovable Cloud 호스팅 | $0 | 기존 플랜 포함 |
| 3D 에셋 스토리지 (50GB) | $2 | Supabase Storage |
| CDN 트래픽 (100GB) | $3 | Cloudflare 무료 플랜 |
| Edge Function 호출 | $0 | 무료 티어 내 |
| **총계** | **~$5/월** | |

---

### Phase 2 (Hybrid) - 월 $50-100

| 항목 | 비용 | 비고 |
|------|------|------|
| 고품질 3D 에셋 (500GB) | $25 | Wasabi/B2 |
| CDN 프리미엄 (1TB) | $30 | Cloudflare Pro |
| DB 인스턴스 업그레이드 | $25 | Supabase Pro |
| Realtime 연결 (1000명) | $10 | 추가 용량 |
| **총계** | **~$90/월** | |

---

### Phase 3 (Pixel Streaming) - 월 $500-5,000+

| 시나리오 | 인스턴스 | 비용 | 대상 |
|----------|----------|------|------|
| 소규모 (5 동시접속) | g4dn.xlarge × 5 | $2,000 | 중소기업 |
| 중규모 (20 동시접속) | g4dn.2xlarge × 10 | $8,000 | 대기업 |
| 대규모 (100 동시접속) | g5.xlarge × 50 | $40,000 | 엔터프라이즈 |

---

## 구현 우선순위

### 🔥 High Priority (즉시 시작)

#### 1. TrafficHeatmap 3D ⭐⭐⭐⭐⭐
**예상 소요 시간**: 2주
**비즈니스 임팩트**: 매우 높음
**기술적 난이도**: 중간

**구현 단계**:
```
Week 1:
- [ ] Three.js 기본 씬 구성
- [ ] 매장 평면도 3D 모델링 (간단한 박스)
- [ ] Supabase에서 트래픽 데이터 조회
- [ ] 2D 히트맵 텍스처 생성 로직

Week 2:
- [ ] 히트맵을 3D 메시에 매핑
- [ ] 시간 슬라이더 UI 연동
- [ ] 실시간 데이터 업데이트 (WebSocket)
- [ ] 카메라 프리셋 (입구뷰, 전체뷰)
```

**성공 지표**:
- 실시간 히트맵 업데이트 (< 1초 지연)
- 30fps 이상 유지
- 모바일 호환성

---

#### 2. LayoutSimulator 3D ⭐⭐⭐⭐⭐
**예상 소요 시간**: 3주
**비즈니스 임팩트**: 매우 높음
**기술적 난이도**: 높음

**구현 단계**:
```
Week 1:
- [ ] 제품 3D 모델 준비 (glTF)
- [ ] 드래그 앤 드롭 로직 (Raycasting)
- [ ] 그리드 스냅 기능

Week 2:
- [ ] AI 추천 레이아웃 API 연동
- [ ] 애니메이션 전환 (현재 → 제안)
- [ ] 메트릭 실시간 계산 (전환율, 트래픽)

Week 3:
- [ ] 비교 모드 (슬라이더)
- [ ] 레이아웃 저장/불러오기
- [ ] 테스팅 및 최적화
```

**성공 지표**:
- 드래그 반응 속도 < 16ms
- 제품 100개 이상 렌더링 가능
- AI 추천 적용 시 자연스러운 애니메이션

---

### 🟡 Medium Priority (Phase 2)

#### 3. FootfallVisualizer 3D ⭐⭐⭐⭐
**예상 소요 시간**: 2주
**기술적 난이도**: 중간

**핵심 기능**:
- 실시간 아바타 렌더링 (Instanced Mesh)
- 동선 트레일 (Line Geometry)
- 필터링 (신규/재방문)

---

#### 4. CustomerJourney 3D ⭐⭐⭐
**예상 소요 시간**: 1주
**기술적 난이도**: 낮음

**핵심 기능**:
- 경로 라인 렌더링
- 웨이포인트 마커
- 재생 애니메이션

---

### 🟢 Low Priority (Phase 3)

#### 5. ZoneContribution 3D ⭐⭐⭐
**예상 소요 시간**: 1주

#### 6. StoreHeatmap 3D ⭐⭐
**예상 소요 시간**: 1주

---

## 기술적 고려사항

### 성능 최적화

#### 1. Level of Detail (LOD)
```typescript
import { Lod } from '@react-three/drei';

<Lod distances={[0, 10, 20]}>
  <mesh geometry={highDetailGeometry} /> {/* 가까울 때 */}
  <mesh geometry={midDetailGeometry} />  {/* 중간 거리 */}
  <mesh geometry={lowDetailGeometry} />  {/* 멀 때 */}
</Lod>
```

#### 2. Instanced Rendering (아바타 100명+)
```typescript
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000} geometry={avatarGeometry} material={avatarMaterial}>
  {visitors.map(v => (
    <Instance key={v.id} position={[v.x, v.y, v.z]} />
  ))}
</Instances>
```

#### 3. Texture Compression
```bash
# KTX2 포맷으로 변환 (GPU 압축)
gltf-transform optimize input.glb output.glb \
  --texture-compress ktx2
```

---

### 보안 고려사항

#### 1. 3D 에셋 접근 제어
```typescript
// Edge Function으로 서명된 URL 발급
const { data } = await supabase.storage
  .from('3d-assets')
  .createSignedUrl('store-model.glb', 3600); // 1시간 유효
```

#### 2. 실시간 데이터 RLS 정책
```sql
-- 사용자는 자신의 매장 데이터만 조회
CREATE POLICY "Users can only view their store traffic"
ON traffic_logs FOR SELECT
USING (store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
));
```

---

## 개발 체크리스트

### 프로젝트 설정
- [ ] React Three Fiber 설치
- [ ] Three.js 타입 정의 설치
- [ ] Zustand 상태관리 설정
- [ ] Supabase Realtime 테스트

### TrafficHeatmap 3D
- [ ] 기본 캔버스 및 씬 설정
- [ ] 매장 3D 모델 로드
- [ ] 히트맵 쉐이더 개발
- [ ] 시간 슬라이더 연동
- [ ] 실시간 업데이트 구현
- [ ] 성능 테스트 (30fps 목표)

### LayoutSimulator 3D
- [ ] 제품 3D 모델 준비 (최소 10개)
- [ ] Raycasting 드래그 앤 드롭
- [ ] 그리드 스냅 로직
- [ ] AI 추천 API 개발
- [ ] 애니메이션 시스템
- [ ] 메트릭 계산 연동

### FootfallVisualizer 3D
- [ ] 아바타 Instanced Mesh
- [ ] 동선 트레일 렌더링
- [ ] 실시간 위치 업데이트
- [ ] 필터링 UI

### 공통 작업
- [ ] 로딩 스피너 / 프로그레스 바
- [ ] 에러 핸들링
- [ ] 모바일 반응형 처리
- [ ] 접근성 (키보드 네비게이션)
- [ ] 문서화 (Storybook)

---

## 리스크 및 대응 방안

### 🔴 High Risk

#### 1. 클라이언트 성능 부족
**리스크**: 저사양 PC에서 3D 렌더링 느림
**대응**:
- LOD 시스템 필수 적용
- 품질 설정 옵션 제공 (저/중/고)
- WebGL 지원 여부 자동 감지 → 2D 폴백

#### 2. 3D 에셋 변환 오류
**리스크**: Unreal → glTF 변환 시 텍스처 손실
**대응**:
- Datasmith Exporter 사용
- 변환 전 체크리스트 작성
- PBR 머티리얼 표준화

---

### 🟡 Medium Risk

#### 3. 실시간 데이터 동기화 지연
**리스크**: WebSocket 지연으로 아바타 위치 부정확
**대응**:
- 클라이언트 사이드 예측 (Dead Reckoning)
- 보간 (Interpolation) 적용
- 배치 업데이트 (100ms 간격)

#### 4. 브라우저 호환성
**리스크**: Safari에서 일부 쉐이더 미작동
**대응**:
- WebGL2 폴백 제공
- 크로스 브라우저 테스트 (BrowserStack)

---

## 다음 단계

### 즉시 실행 가능한 액션

1. **개발 환경 설정** (1일)
   ```bash
   npm install @react-three/fiber@^8.18 @react-three/drei@^9.122 three@^0.133
   ```

2. **POC 개발** (3일)
   - 간단한 3D 박스 + 히트맵 텍스처
   - Supabase 연동 테스트

3. **프로토타입 데모** (1주)
   - TrafficHeatmap 3D 베타 버전
   - 내부 팀 피드백

4. **전체 MVP** (1개월)
   - 3개 핵심 기능 완성
   - 사용자 테스트

---

## 참고 자료

### 공식 문서
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js](https://threejs.org/docs/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### 예제 프로젝트
- [R3F Examples](https://docs.pmnd.rs/react-three-fiber/examples/basic-scene)
- [Retail Analytics Demo](https://github.com/pmndrs/racing-game)

### 커뮤니티
- [Poimandres Discord](https://discord.gg/poimandres)
- [Three.js Forum](https://discourse.threejs.org/)

---

## 결론

NEURALTWIN 프로젝트에 3D 디지털트윈을 통합하는 가장 효율적인 방법은:

1. **Phase 1**: React Three Fiber로 MVP 구축 (비용 $0, 기간 1-2개월)
2. **Phase 2**: Hybrid 방식으로 품질 향상 (비용 ~$100/월)
3. **Phase 3**: 엔터프라이즈 고객 대상 Pixel Streaming (고객별 협의)

**핵심 성공 요인**:
- ✅ 비용 효율적 (초기 투자 거의 없음)
- ✅ 빠른 반복 (주 단위 배포 가능)
- ✅ 확장 가능 (사용자 증가에 유연 대응)
- ✅ 기존 인프라 활용 (Lovable Cloud 완벽 통합)

**추천**: TrafficHeatmap 3D부터 시작하여 2주 내 프로토타입 완성 후 사용자 피드백 기반으로 확장.

---

**문서 버전**: 2.0  
**최종 수정**: 2025-11-12  
**작성자**: NEURALTWIN Development Team

---

## 🚀 React Three Fiber (R3F) 심화 구현 가이드

### 왜 React Three Fiber인가?

#### ✅ Lovable Cloud와 완벽 통합
```typescript
// Supabase 실시간 데이터 → React 상태 → Three.js 렌더링
// 별도 백엔드 불필요, Edge Function 활용 가능
import { supabase } from '@/integrations/supabase/client';

const channel = supabase.channel('3d-updates')
  .on('postgres_changes', { event: '*', schema: 'public' }, 
    (payload) => update3DScene(payload))
  .subscribe();
```

#### ✅ 즉시 프로토타입 가능
- 기존 NEURALTWIN React 코드베이스에 바로 통합
- `npm install` 후 30분 내 첫 3D 씬 구동
- Hot Module Replacement (HMR) 지원

#### ✅ 비용 효율적 (거의 무료)
| 항목 | 비용 | 비고 |
|------|------|------|
| R3F 라이브러리 | $0 | MIT 라이선스 |
| 호스팅 | $0 | Lovable Cloud 포함 |
| 3D 에셋 CDN | $2-5/월 | Supabase Storage |
| Edge Functions | $0 | 무료 티어 충분 |

#### ✅ React 개발자 친화적
```tsx
// Three.js 원본 (명령형)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// React Three Fiber (선언형)
<mesh>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="green" />
</mesh>
```

#### ✅ 충분한 시각적 품질
- PBR (Physically Based Rendering) 지원
- 실시간 그림자, 반사, 굴절
- Post-processing 효과 (Bloom, DOF, SSAO)
- 4K 텍스처 지원

#### ✅ 무한 확장 가능
- 클라이언트 렌더링 → 서버 부하 0
- 사용자 100명이든 10,000명이든 동일 비용
- CDN 캐싱으로 전 세계 저지연

---

## 📦 프로젝트 설정 (Step-by-Step)

### 1. 패키지 설치
```bash
# React Three Fiber 코어
npm install @react-three/fiber@^8.18.0 three@^0.133.0

# 유틸리티 (필수)
npm install @react-three/drei@^9.122.0

# 선택적 (추천)
npm install @react-three/postprocessing@^2.16.0  # 후처리 효과
npm install zustand@^4.5.0                       # 상태관리
npm install @react-spring/three@^9.7.0           # 애니메이션
npm install leva@^0.9.35                         # 디버깅 GUI

# 타입 정의 (TypeScript)
npm install --save-dev @types/three
```

### 2. 프로젝트 구조
```
src/
├── features/
│   └── digital-twin-3d/
│       ├── components/
│       │   ├── TrafficHeatmap3D.tsx      # 히트맵 컴포넌트
│       │   ├── LayoutSimulator3D.tsx     # 레이아웃 시뮬레이터
│       │   ├── FootfallVisualizer3D.tsx  # 발걸음 분석
│       │   └── shared/
│       │       ├── StoreModel.tsx        # 매장 3D 모델
│       │       ├── Controls.tsx          # 카메라 컨트롤
│       │       └── Lighting.tsx          # 조명 설정
│       ├── hooks/
│       │   ├── useRealtimeTraffic.ts     # 실시간 데이터
│       │   ├── useStore3D.ts             # Zustand 스토어
│       │   └── useGLTFLoader.ts          # 3D 에셋 로딩
│       ├── materials/
│       │   ├── HeatmapMaterial.tsx       # 커스텀 쉐이더
│       │   └── TrailMaterial.tsx         # 동선 트레일
│       ├── utils/
│       │   ├── coordinateMapper.ts       # 2D ↔ 3D 변환
│       │   └── performanceMonitor.ts     # FPS 모니터링
│       └── pages/
│           └── DigitalTwin3DPage.tsx     # 메인 페이지
└── public/
    └── models/
        ├── store-base.glb                # 매장 구조
        ├── products/                     # 제품 모델들
        └── textures/                     # 텍스처
```

---

## 🎨 기본 3D 씬 구성

### 최소 실행 가능한 예제
```tsx
// src/features/digital-twin-3d/components/BasicScene.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export const BasicScene = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
      >
        {/* 조명 */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
        />

        {/* 매장 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>

        {/* 샘플 제품 박스 */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        {/* 카메라 컨트롤 */}
        <OrbitControls />

        {/* 환경 조명 */}
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
};
```

### Lovable 프로젝트에 통합
```tsx
// src/features/digital-twin-3d/pages/DigitalTwin3DPage.tsx
import { DashboardLayout } from "@/components/DashboardLayout";
import { BasicScene } from "../components/BasicScene";

const DigitalTwin3DPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold gradient-text">
          3D 디지털 트윈
        </h1>
        <div className="h-[600px] rounded-lg overflow-hidden border border-border">
          <BasicScene />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DigitalTwin3DPage;
```

---

## 🔥 실전 예제: TrafficHeatmap 3D

### 1. 데이터 구조 정의
```typescript
// src/features/digital-twin-3d/types/heatmap.ts
export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
  timestamp: Date;
}

export interface ZoneData {
  id: string;
  center: { x: number; y: number };
  radius: number;
  visitCount: number;
  avgDwellTime: number; // 초
}
```

### 2. 실시간 데이터 Hook
```typescript
// src/features/digital-twin-3d/hooks/useRealtimeTraffic.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HeatmapPoint } from '../types/heatmap';

export const useRealtimeTraffic = (storeId: string) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    // 초기 데이터 로드
    const loadInitialData = async () => {
      const { data } = await supabase
        .from('traffic_logs')
        .select('zone_x, zone_y, dwell_time')
        .eq('store_id', storeId)
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

      if (data) {
        const points = data.map(d => ({
          x: d.zone_x,
          y: d.zone_y,
          intensity: Math.min(d.dwell_time / 300, 1),
          timestamp: new Date()
        }));
        setHeatmapData(points);
      }
    };

    loadInitialData();

    // 실시간 구독
    const channel = supabase
      .channel(`traffic-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_logs',
          filter: `store_id=eq.${storeId}`
        },
        (payload: any) => {
          const newPoint: HeatmapPoint = {
            x: payload.new.zone_x,
            y: payload.new.zone_y,
            intensity: Math.min(payload.new.dwell_time / 300, 1),
            timestamp: new Date(payload.new.timestamp)
          };
          setHeatmapData(prev => [...prev.slice(-500), newPoint]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return heatmapData;
};
```

### 3. 커스텀 히트맵 쉐이더
```tsx
// src/features/digital-twin-3d/materials/HeatmapMaterial.tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { HeatmapPoint } from '../types/heatmap';

interface HeatmapMaterialProps {
  data: HeatmapPoint[];
  mapWidth: number;
  mapHeight: number;
}

export const HeatmapMaterial = ({ 
  data, 
  mapWidth, 
  mapHeight 
}: HeatmapMaterialProps) => {
  const texture = useMemo(() => {
    // Canvas로 히트맵 텍스처 생성
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 배경 투명
    ctx.clearRect(0, 0, 512, 512);

    // 각 포인트를 그라디언트로 그리기
    data.forEach(point => {
      const x = (point.x / mapWidth) * 512;
      const y = (point.y / mapHeight) * 512;
      const radius = 30 * point.intensity;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${point.intensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Three.js 텍스처로 변환
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [data, mapWidth, mapHeight]);

  return (
    <meshStandardMaterial 
      map={texture} 
      transparent 
      opacity={0.8}
      emissive="#ffffff"
      emissiveIntensity={0.5}
    />
  );
};
```

### 4. TrafficHeatmap3D 컴포넌트
```tsx
// src/features/digital-twin-3d/components/TrafficHeatmap3D.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import { useRealtimeTraffic } from '../hooks/useRealtimeTraffic';
import { HeatmapMaterial } from '../materials/HeatmapMaterial';

interface TrafficHeatmap3DProps {
  storeId: string;
}

export const TrafficHeatmap3D = ({ storeId }: TrafficHeatmap3DProps) => {
  const heatmapData = useRealtimeTraffic(storeId);

  return (
    <Canvas camera={{ position: [25, 30, 25], fov: 50 }} shadows>
      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

      {/* 매장 바닥 (50m × 50m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* 히트맵 오버레이 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <HeatmapMaterial data={heatmapData} mapWidth={50} mapHeight={50} />
      </mesh>

      {/* 구역 라벨 */}
      <group>
        <Text
          position={[-15, 0.5, -15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.5}
          color="white"
        >
          입구
        </Text>
        <Text
          position={[15, 0.5, 15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.5}
          color="white"
        >
          계산대
        </Text>
      </group>

      {/* 카메라 컨트롤 */}
      <OrbitControls 
        maxPolarAngle={Math.PI / 2.5}
        minDistance={10}
        maxDistance={100}
      />

      <Environment preset="city" />
    </Canvas>
  );
};
```

### 5. UI 통합 (시간 슬라이더 추가)
```tsx
// src/features/digital-twin-3d/pages/TrafficHeatmap3DPage.tsx
import { useState } from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrafficHeatmap3D } from "../components/TrafficHeatmap3D";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

const TrafficHeatmap3DPage = () => {
  const [timeOfDay, setTimeOfDay] = useState(12); // 0-23시

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            3D 트래픽 히트맵
          </h1>
          <p className="text-muted-foreground mt-2">
            실시간 고객 동선 분석
          </p>
        </div>

        <Card className="p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              시간대: {timeOfDay}:00
            </label>
            <Slider
              value={[timeOfDay]}
              onValueChange={([value]) => setTimeOfDay(value)}
              min={0}
              max={23}
              step={1}
            />
          </div>
        </Card>

        <div className="h-[700px] rounded-lg overflow-hidden border border-border">
          <TrafficHeatmap3D storeId="store-001" />
        </div>

        {/* 범례 */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">낮은 트래픽</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-sm">중간 트래픽</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm">높은 트래픽</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrafficHeatmap3DPage;
```

---

## 🎮 LayoutSimulator 3D - 드래그 앤 드롭

### 1. Raycasting으로 3D 오브젝트 선택
```tsx
// src/features/digital-twin-3d/components/DraggableProduct.tsx
import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DraggableProductProps {
  position: [number, number, number];
  productId: string;
  onDragEnd: (newPosition: [number, number, number]) => void;
}

export const DraggableProduct = ({ 
  position, 
  productId, 
  onDragEnd 
}: DraggableProductProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3());
  const { camera, raycaster, pointer } = useThree();

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    
    // 마우스와 오브젝트 간 오프셋 계산
    const point = e.point;
    const offset = new THREE.Vector3().subVectors(
      meshRef.current!.position,
      point
    );
    setDragOffset(offset);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      const pos = meshRef.current!.position;
      onDragEnd([pos.x, pos.y, pos.z]);
    }
  };

  useFrame(() => {
    if (isDragging && meshRef.current) {
      // 바닥 평면과의 교차점 계산
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        // 그리드 스냅 (1m 단위)
        const snappedX = Math.round(intersectPoint.x + dragOffset.x);
        const snappedZ = Math.round(intersectPoint.z + dragOffset.z);
        
        meshRef.current.position.set(snappedX, 0.5, snappedZ);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={isDragging ? "#ff6b6b" : "#4ecdc4"} 
        emissive={isDragging ? "#ff0000" : "#000000"}
        emissiveIntensity={isDragging ? 0.5 : 0}
      />
    </mesh>
  );
};
```

### 2. 레이아웃 상태 관리 (Zustand)
```typescript
// src/features/digital-twin-3d/hooks/useStore3D.ts
import create from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  category: string;
}

interface Store3DState {
  products: Product[];
  updateProductPosition: (id: string, position: [number, number, number]) => void;
  loadLayout: (layoutId: string) => Promise<void>;
  saveLayout: () => Promise<void>;
}

export const useStore3D = create<Store3DState>((set, get) => ({
  products: [],
  
  updateProductPosition: (id, position) => {
    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, position } : p
      )
    }));
  },

  loadLayout: async (layoutId) => {
    const { data } = await supabase
      .from('store_layouts')
      .select('products')
      .eq('id', layoutId)
      .single();
    
    if (data) {
      set({ products: data.products });
    }
  },

  saveLayout: async () => {
    const { products } = get();
    await supabase
      .from('store_layouts')
      .upsert({ 
        id: 'current-layout', 
        products,
        updated_at: new Date().toISOString()
      });
  }
}));
```

---

## ⚡ 성능 최적화 기법

### 1. Instanced Rendering (100+ 오브젝트)
```tsx
// src/features/digital-twin-3d/components/FootfallAvatars.tsx
import { Instances, Instance } from '@react-three/drei';
import { useRealtimeVisitors } from '../hooks/useRealtimeVisitors';

export const FootfallAvatars = ({ storeId }: { storeId: string }) => {
  const visitors = useRealtimeVisitors(storeId);

  return (
    <Instances limit={1000}>
      <cylinderGeometry args={[0.3, 0.3, 1.8, 8]} />
      <meshStandardMaterial color="#4ecdc4" />
      
      {visitors.map(visitor => (
        <Instance 
          key={visitor.id} 
          position={[visitor.x, 0.9, visitor.y]}
          color={visitor.type === 'new' ? '#ff6b6b' : '#4ecdc4'}
        />
      ))}
    </Instances>
  );
};
```

### 2. LOD (Level of Detail)
```tsx
import { Lod } from '@react-three/drei';

<Lod distances={[0, 15, 30]}>
  {/* 가까울 때: 고품질 모델 */}
  <mesh geometry={highDetailModel} material={highDetailMaterial} />
  
  {/* 중간 거리: 중품질 */}
  <mesh geometry={midDetailModel} material={midDetailMaterial} />
  
  {/* 멀 때: 저품질 */}
  <mesh geometry={lowDetailModel} material={lowDetailMaterial} />
</Lod>
```

### 3. 프레임레이트 모니터링
```tsx
import { Perf } from 'r3f-perf';

<Canvas>
  {process.env.NODE_ENV === 'development' && <Perf position="top-left" />}
  {/* 나머지 씬 */}
</Canvas>
```

---

## 🐛 문제 해결 가이드

### Q1: 화면이 검게 나와요
**원인**: 조명 부족 또는 카메라 위치 문제
```tsx
// 해결: 기본 조명 추가
<ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 5]} intensity={1} />
```

### Q2: 마우스 인터랙션이 안 돼요
**원인**: `onPointerDown` 이벤트가 작동하지 않음
```tsx
// 해결: Canvas에 events 설정 확인
<Canvas events={(state) => state.events}>
  {/* ... */}
</Canvas>
```

### Q3: 모바일에서 성능이 느려요
**원인**: 과도한 폴리곤 수
```tsx
// 해결: 모바일 감지 및 품질 하향
import { isMobile } from 'react-device-detect';

<Canvas 
  dpr={isMobile ? [1, 1.5] : [1, 2]} 
  performance={{ min: 0.5 }}
>
```

### Q4: glTF 모델 로딩이 느려요
**원인**: 압축되지 않은 파일
```bash
# 해결: glTF-Transform으로 최적화
npx gltf-transform optimize input.glb output.glb \
  --texture-compress webp
```

---

## 🚀 배포 체크리스트

### Production Build 최적화
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
}
```

### 3D 에셋 CDN 설정
```typescript
// Supabase Storage에 업로드
const { data } = await supabase.storage
  .from('3d-assets')
  .upload('models/store.glb', file, {
    cacheControl: '3600',
    upsert: false
  });

// Public URL 획득
const { data: publicURL } = supabase.storage
  .from('3d-assets')
  .getPublicUrl('models/store.glb');
```

### 로딩 스피너 추가
```tsx
import { Suspense } from 'react';
import { Loader } from '@react-three/drei';

<Suspense fallback={<Loader />}>
  <Canvas>
    {/* 3D 씬 */}
  </Canvas>
</Suspense>
```

---

## 💡 핵심 성공 요인

### 1. 기술적 장점
- **React 생태계 통합**: 기존 컴포넌트와 seamless 통합
- **타입 안정성**: TypeScript 완벽 지원
- **디버깅 용이**: React DevTools로 3D 씬 디버깅

### 2. 비즈니스 장점
- **빠른 시장 출시**: MVP 2주 내 가능
- **낮은 진입 장벽**: React 개발자라면 즉시 시작 가능
- **예측 가능한 비용**: 사용자 증가해도 비용 선형적 증가 없음

### 3. 확장성
- **점진적 개선**: 간단한 박스부터 시작해 고품질 모델로 업그레이드
- **플러그인 생태계**: Drei, Postprocessing 등 풍부한 라이브러리
- **커뮤니티 지원**: Poimandres Discord, GitHub Discussions 활발

---

## 📚 다음 단계

### 즉시 시작 가능한 액션

1. **환경 설정 (1시간)**
   ```bash
   cd neuraltwin-project
   npm install @react-three/fiber@^8.18 @react-three/drei@^9.122 three@^0.133
   ```

2. **첫 3D 씬 구현 (2시간)**
   - BasicScene 컴포넌트 생성
   - TrafficHeatmap3DPage 라우팅 추가

3. **실시간 데이터 연동 (1일)**
   - useRealtimeTraffic hook 구현
   - Supabase 채널 구독

4. **프로토타입 완성 (1주)**
   - TrafficHeatmap 3D 완성
   - 내부 데모

### 학습 리소스
- [React Three Fiber 공식 문서](https://docs.pmnd.rs/react-three-fiber)
- [Drei 컴포넌트 가이드](https://github.com/pmndrs/drei)
- [Three.js Journey 강의](https://threejs-journey.com/)

---

**이 가이드대로 시작하면 1-2주 내 첫 3D 디지털 트윈 프로토타입을 Lovable Cloud에서 구동할 수 있습니다!** 🚀
