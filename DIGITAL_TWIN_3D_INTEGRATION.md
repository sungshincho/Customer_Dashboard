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

**문서 버전**: 1.0  
**최종 수정**: 2025-01-12  
**작성자**: NEURALTWIN Development Team
