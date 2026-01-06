# 디지털트윈 스튜디오 QA 가이드

> 작성일: 2026-01-06
> 버전: 1.0
> 대상: AI 시뮬레이션 & AI 최적화 기능

---

## 목차

1. [현재 구현 상황](#1-현재-구현-상황)
2. [기능별 예상 결과](#2-기능별-예상-결과)
3. [단계별 QA 방법](#3-단계별-qa-방법)
4. [검증 방법](#4-검증-방법)
5. [트러블슈팅](#5-트러블슈팅)

---

## 1. 현재 구현 상황

### 1.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                      디지털트윈 스튜디오                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  AI 시뮬레이션   │───▶│   문제점 분석    │───▶│   AI 최적화     │ │
│  │  (AISimulation  │    │ (IssueAnalyzer) │    │ (Optimization)  │ │
│  │     Tab)        │    │                 │    │                 │ │
│  └────────┬────────┘    └─────────────────┘    └────────┬────────┘ │
│           │                                             │          │
│           ▼                                             ▼          │
│  ┌─────────────────┐                          ┌─────────────────┐  │
│  │ run-simulation  │                          │generate-optimi- │  │
│  │ Edge Function   │                          │zation Edge Func │  │
│  └────────┬────────┘                          └────────┬────────┘  │
│           │                                             │          │
│           └──────────────────┬──────────────────────────┘          │
│                              ▼                                     │
│                    ┌─────────────────┐                             │
│                    │ ai_response_logs│ (파인튜닝 데이터셋)           │
│                    │     테이블       │                             │
│                    └─────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 구현된 기능 목록

| # | 기능 | 파일 위치 | 상태 |
|---|------|----------|------|
| 1 | 가상 고객 아바타 동선 애니메이션 | `src/stores/simulationStore.ts` | ✅ 완료 |
| 2 | 프리셋 시나리오 시뮬레이션 (7개) | `src/features/studio/types/scenarioPresets.types.ts` | ✅ 완료 |
| 3 | 환경 변수 영향 시뮬레이션 | `src/features/studio/hooks/useEnvironmentContext.ts` | ✅ 완료 |
| 4 | AI 추론 문제점 파악 | `src/features/studio/utils/simulationIssueAnalyzer.ts` | ✅ 완료 |
| 5 | AI 최적화 연결 | `AISimulationTab.tsx` → `generate-optimization` | ✅ 완료 |
| 6 | AI 응답 로깅 시스템 | `supabase/functions/_shared/aiResponseLogger.ts` | ✅ 완료 |

### 1.3 Edge Functions

| Function | 용도 | AI 모델 | 로깅 |
|----------|------|---------|------|
| `run-simulation` | AI 시뮬레이션 실행 | Gemini 2.5 Flash / Rule-based | ✅ |
| `generate-optimization` | AI 최적화 생성 | Gemini 2.5 Flash | ✅ |
| `advanced-ai-inference` | AI 추론 (존/혼잡도) | Gemini 2.5 Flash/Pro | ✅ |

### 1.4 프리셋 시나리오

| ID | 이름 | 설명 | 트래픽 배수 | 리스크 태그 |
|----|------|------|------------|------------|
| `christmas` | 크리스마스 시즌 | 주말 + 겨울 + 세일 30% | 1.8x | 혼잡 위험, 계산대 대기 |
| `rainyWeekday` | 비 오는 평일 | 평일 + 비 + 이벤트 없음 | 0.7x | 매출 감소 |
| `blackFriday` | 블랙프라이데이 | 금요일 + 세일 50% | 2.5x | 혼잡 위험, 인력 부족, 병목 위험 |
| `newArrival` | 신상품 런칭 | 주말 + 신상품 출시 | 1.2x | 특정 존 집중 |
| `normalWeekend` | 평범한 주말 | 주말 + 맑음 + 이벤트 없음 | 1.35x | (없음) |
| `coldWave` | 한파 주의보 | 평일 + 영하 10도 + 눈 | 0.6x | 매출 감소, 방문객 급감 |
| `yearEndParty` | 연말 파티 시즌 | 금요일 저녁 + 이벤트 | 1.5x | 저녁 집중, 체류시간 증가 |

---

## 2. 기능별 예상 결과

### 2.1 AI 시뮬레이션 결과

#### 예상 응답 구조

```typescript
interface SimulationResult {
  simulation_id: string;           // "sim-1704499200000"
  timestamp: string;               // ISO 날짜
  duration_minutes: number;        // 시뮬레이션 시간

  kpis: {
    predicted_visitors: number;    // 예상 방문객 수 (50-500)
    predicted_conversion_rate: number;  // 전환율 (0.03-0.15)
    predicted_revenue: number;     // 예상 매출 (100,000-5,000,000원)
    avg_dwell_time_seconds: number;  // 평균 체류시간 (60-300초)
    peak_congestion_percent: number;  // 피크 혼잡도 (30-100%)
  };

  zone_analysis: ZoneAnalysis[];   // 존별 분석 (3-10개)
  flow_analysis: FlowAnalysis;     // 동선 분석
  diagnostic_issues: DiagnosticIssue[];  // 진단 이슈 (0-10개)
  ai_insights: string[];           // AI 인사이트 (3-5개)
  confidence_score: number;        // 신뢰도 (50-95%)
}
```

#### 시나리오별 예상 KPI 범위

| 시나리오 | 방문객 | 전환율 | 혼잡도 | 이슈 수 |
|---------|--------|--------|--------|---------|
| 크리스마스 | 150-200 | 5-8% | 70-90% | 3-5개 |
| 비오는 평일 | 50-80 | 4-6% | 20-40% | 1-2개 |
| 블랙프라이데이 | 200-300 | 6-10% | 80-100% | 4-6개 |
| 평범한 주말 | 100-150 | 5-7% | 40-60% | 1-3개 |
| 한파 주의보 | 40-70 | 4-6% | 15-30% | 1-2개 |

### 2.2 문제점 분석 결과

#### 감지 가능한 이슈 유형

| 유형 | 아이콘 | 임계값 (Warning) | 임계값 (Critical) |
|------|--------|-----------------|------------------|
| 혼잡 위험 (congestion) | 🔴 | 수용인원 80% | 수용인원 100% |
| 동선 병목 (bottleneck) | ⚠️ | 대기시간 3분 | 대기시간 5분 |
| 데드존 (deadzone) | 💤 | 방문율 10% | 방문율 5% |
| 인력 부족 (understaffed) | 👥 | 고객:직원 15:1 | 고객:직원 20:1 |
| 계산대 대기 (checkout_wait) | 🕐 | 대기시간 10분 | 대기시간 15분 |

#### 예상 이슈 응답 구조

```typescript
interface SimulationIssue {
  id: string;
  type: 'congestion' | 'bottleneck' | 'deadzone' | 'understaffed' | 'checkout_wait';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  location: {
    zoneId: string;
    zoneName: string;
  };
  details: {
    currentValue: number;
    threshold: number;
    unit: string;
    description: string;
  };
  impact: {
    revenueImpact: number;      // 예상 매출 손실 (원)
    customerImpact: number;      // 영향 고객 수
  };
  recommendations: string[];
}
```

### 2.3 AI 최적화 결과

#### 예상 응답 구조

```typescript
interface OptimizationResult {
  success: boolean;
  optimization_id: string;

  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    expected_improvement: {
      metric: string;
      current: number;
      projected: number;
      change_percent: number;
    };
    implementation_steps: string[];
  }[];

  layout_changes: {
    furniture_id: string;
    action: 'move' | 'add' | 'remove' | 'rotate';
    from_position?: { x: number; z: number };
    to_position?: { x: number; z: number };
    reason: string;
  }[];

  summary: string;
  confidence_score: number;
}
```

### 2.4 AI 응답 로깅 (파인튜닝 데이터셋)

#### 로그 테이블 구조

```sql
-- ai_response_logs 테이블
id: UUID
store_id: UUID
user_id: UUID (nullable)
function_name: 'run-simulation' | 'generate-optimization' | 'advanced-ai-inference'
simulation_type: 'demand_prediction' | 'traffic_flow' | 'layout_optimization' | ...
input_variables: JSONB      -- 입력 파라미터 전체
ai_response: JSONB          -- AI 응답 전체
response_summary: TEXT      -- 요약 문자열
quality_score: INTEGER      -- 품질 점수 (나중에 평가)
is_good_example: BOOLEAN    -- 좋은 예시 여부 (나중에 마킹)
execution_time_ms: INTEGER  -- 실행 시간
context_metadata: JSONB     -- 추가 메타데이터
created_at: TIMESTAMPTZ
```

---

## 3. 단계별 QA 방법

### 3.1 사전 준비

#### 필수 환경 변수 확인

```bash
# Supabase Edge Functions 환경 변수
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ANTHROPIC_API_KEY=<claude-api-key>          # run-simulation용
GEMINI_API_KEY=<gemini-api-key>             # generate-optimization용
```

#### 테스트 데이터 확인

```sql
-- 매장 데이터 확인
SELECT id, name FROM stores WHERE org_id = '<your-org-id>';

-- 존 데이터 확인
SELECT id, zone_name, zone_type FROM zones_dim WHERE store_id = '<store-id>';

-- 가구 데이터 확인
SELECT id, name, category FROM furniture WHERE store_id = '<store-id>';
```

### 3.2 AI 시뮬레이션 QA

#### Step 1: 기본 시뮬레이션 테스트

1. **디지털트윈 스튜디오 접속**
   - URL: `/studio/<store-id>`
   - 좌측 사이드바에서 "AI 시뮬레이션" 탭 선택

2. **기본 설정으로 실행**
   - 시뮬레이션 타입: "AI 예측"
   - 예상 고객 수: 100명
   - 시뮬레이션 시간: 60분
   - "AI 예측 시뮬레이션 실행" 버튼 클릭

3. **예상 결과 확인**
   - 로딩 프로그레스 바 표시 (0% → 100%)
   - 완료 토스트: "AI 시뮬레이션 완료!"
   - KPI 카드 표시: 방문객, 전환율, 체류시간, 매출

#### Step 2: 프리셋 시나리오 테스트

1. **프리셋 시나리오 섹션 열기**
   - "프리셋 시나리오" 접기/펼치기 클릭

2. **각 시나리오 선택 테스트**

   | 시나리오 | 확인 사항 |
   |---------|----------|
   | 🎄 크리스마스 | 고객 수 180명으로 자동 조정, 환경설정 눈/크리스마스 적용 |
   | 🌧️ 비오는 평일 | 고객 수 70명으로 자동 조정, 환경설정 비/평일 적용 |
   | 🔥 블랙프라이데이 | 고객 수 250명으로 자동 조정, 리스크 태그 3개 표시 |

3. **예상 영향 확인**
   - 방문객/전환율/객단가/체류 퍼센트 표시
   - 리스크 태그 색상별 구분

#### Step 3: 환경 변수 테스트

1. **환경 설정 패널 열기**
   - "환경 설정 (시뮬레이션)" 클릭

2. **모드별 테스트**

   | 모드 | 테스트 방법 | 확인 사항 |
   |------|------------|----------|
   | 실시간 | 기본 선택 | 현재 날씨 API 데이터 표시 |
   | 날짜선택 | 특정 날짜 선택 | 해당 날짜의 공휴일 정보 반영 |
   | 직접설정 | 날씨/시간대/공휴일 수동 선택 | 선택한 값으로 시뮬레이션 |

3. **영향도 계산 확인**
   - 트래픽 배수 표시 (예: "트래픽 120%")
   - 영향 요약 문구 표시

### 3.3 문제점 분석 QA

#### Step 1: 이슈 감지 테스트

1. **고트래픽 시나리오 실행**
   - 블랙프라이데이 프리셋 선택
   - 고객 수 300명 설정
   - 시뮬레이션 실행

2. **감지된 문제점 확인**
   - "감지된 문제점" 섹션 표시
   - 위험/주의/정보 배지 카운트
   - 예상 매출 손실 금액 표시

3. **이슈 상세 정보 확인**
   - 이슈 타입 아이콘 (🔴⚠️💤👥🕐)
   - 위치 정보 (존 이름)
   - 권장사항 미리보기

#### Step 2: 이슈 없음 케이스

1. **저트래픽 시나리오 실행**
   - 한파 주의보 프리셋 선택
   - 고객 수 50명 설정

2. **예상 결과**
   - 이슈 섹션이 표시되지 않거나 "info" 수준만 표시

### 3.4 AI 최적화 연결 QA

#### Step 1: 최적화 모달 테스트

1. **이슈가 있는 상태에서 테스트**
   - 시뮬레이션 실행 후 이슈 감지
   - "AI 최적화로 해결하기" 버튼 클릭

2. **모달 확인 사항**
   - 적용된 시나리오 정보 표시
   - 해결할 문제 체크박스 목록
   - 선택된 이슈 수 표시
   - 최적화 예상 효과 (문제 해결 수, 예상 회복 금액)

#### Step 2: 최적화 실행 테스트

1. **이슈 선택**
   - 1개 이상의 이슈 체크박스 선택
   - "AI 최적화 실행" 버튼 클릭

2. **예상 결과**
   - 로딩 스피너 표시
   - 완료 토스트: "AI 최적화 분석 완료!"
   - AI 최적화 탭으로 자동 이동 (선택적)

### 3.5 실시간 시뮬레이션 QA

#### Step 1: 아바타 시뮬레이션

1. **설정**
   - 시뮬레이션 타입: "실시간"
   - 예상 고객 수: 50명
   - "실시간 시뮬레이션 시작" 클릭

2. **확인 사항**
   - 3D 뷰에 아바타 생성
   - 아바타 이동 애니메이션
   - 경과 시간 표시
   - 실시간 KPI 업데이트

3. **컨트롤 테스트**
   - 일시정지/재개 버튼
   - 속도 조절 (1x, 2x, 4x, 10x)
   - 중지 버튼

---

## 4. 검증 방법

### 4.1 API 응답 검증

#### Supabase Edge Function 직접 호출

```bash
# run-simulation 테스트
curl -X POST \
  'https://<project-id>.supabase.co/functions/v1/run-simulation' \
  -H 'Authorization: Bearer <anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "store_id": "<store-uuid>",
    "options": {
      "duration_minutes": 60,
      "customer_count": 100,
      "time_of_day": "afternoon",
      "simulation_type": "predictive"
    }
  }'
```

#### 응답 검증 체크리스트

- [ ] `simulation_id` 존재
- [ ] `kpis` 객체의 모든 필드 존재
- [ ] `predicted_visitors` > 0
- [ ] `predicted_conversion_rate` 0~1 범위
- [ ] `zone_analysis` 배열 존재
- [ ] `diagnostic_issues` 배열 존재
- [ ] `ai_insights` 배열 (3개 이상)
- [ ] `confidence_score` 50~100 범위

### 4.2 데이터베이스 검증

#### AI 응답 로그 확인

```sql
-- 최근 로그 조회
SELECT
  id,
  function_name,
  simulation_type,
  response_summary,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE store_id = '<store-uuid>'
ORDER BY created_at DESC
LIMIT 10;

-- 함수별 통계
SELECT
  function_name,
  COUNT(*) as call_count,
  AVG(execution_time_ms) as avg_time_ms,
  MIN(created_at) as first_call,
  MAX(created_at) as last_call
FROM ai_response_logs
WHERE store_id = '<store-uuid>'
GROUP BY function_name;
```

#### 시뮬레이션 이력 확인

```sql
-- simulation_history 테이블 (있는 경우)
SELECT
  id,
  simulation_type,
  input_params,
  result_data->'kpis' as kpis,
  created_at
FROM simulation_history
WHERE store_id = '<store-uuid>'
ORDER BY created_at DESC
LIMIT 5;
```

### 4.3 UI 검증 체크리스트

#### AI 시뮬레이션 탭

- [ ] 프리셋 시나리오 카드 6개 표시
- [ ] 시나리오 선택 시 환경설정 자동 적용
- [ ] 예상 영향 퍼센트 표시
- [ ] 리스크 태그 색상 구분
- [ ] 시뮬레이션 실행 버튼 상태 변화
- [ ] 로딩 프로그레스 바
- [ ] KPI 카드 4개 (방문객, 전환율, 체류시간, 매출)
- [ ] 감지된 문제점 섹션 (이슈 있을 때)
- [ ] AI 최적화 연결 버튼

#### 최적화 모달

- [ ] 모달 오버레이 배경
- [ ] 닫기 버튼 (X)
- [ ] 시나리오 정보 카드
- [ ] 이슈 체크박스 목록
- [ ] 선택 카운트 업데이트
- [ ] 예상 효과 표시
- [ ] 취소/실행 버튼
- [ ] 로딩 상태 표시

### 4.4 성능 검증

#### 응답 시간 기준

| 기능 | 목표 시간 | 허용 범위 |
|------|----------|----------|
| AI 시뮬레이션 | < 5초 | < 10초 |
| AI 최적화 | < 8초 | < 15초 |
| 환경 컨텍스트 로드 | < 2초 | < 5초 |
| 문제점 분석 | < 1초 | < 3초 |

#### 측정 방법

```javascript
// 브라우저 콘솔에서 측정
console.time('simulation');
// 시뮬레이션 실행
console.timeEnd('simulation');
```

### 4.5 에러 처리 검증

#### 에러 케이스 테스트

| 케이스 | 테스트 방법 | 예상 결과 |
|--------|------------|----------|
| 매장 미선택 | store_id 없이 실행 | "매장을 선택해주세요" 토스트 |
| API 키 없음 | 환경변수 제거 | Rule-based 폴백 실행 |
| 네트워크 오류 | 오프라인 모드 | "시뮬레이션 실패" 토스트 |
| 타임아웃 | 대량 데이터 | 타임아웃 에러 메시지 |

---

## 5. 트러블슈팅

### 5.1 일반적인 문제

#### 시뮬레이션이 실행되지 않음

```
문제: "AI 예측 시뮬레이션 실행" 버튼 클릭 시 아무 반응 없음

원인:
1. store_id가 설정되지 않음
2. 이미 시뮬레이션 실행 중

해결:
1. URL에 store_id가 포함되어 있는지 확인
2. 페이지 새로고침 후 재시도
```

#### AI 응답이 느림

```
문제: 시뮬레이션 완료까지 10초 이상 소요

원인:
1. API 키 없어서 rule-based 모드로 실행
2. 존/가구 데이터가 많음
3. 네트워크 지연

해결:
1. Edge Function 로그에서 모델 확인
2. 데이터 양 최적화
3. 캐싱 활성화 검토
```

#### 이슈가 감지되지 않음

```
문제: 고트래픽 시나리오에서도 이슈가 없음

원인:
1. AI 결과에 diagnostic_issues가 비어있음
2. extractIssuesFromAIResult 파싱 실패

해결:
1. 콘솔에서 aiStore.result 확인
2. zone_analysis 데이터 구조 확인
```

### 5.2 로그 확인 방법

#### 브라우저 콘솔

```javascript
// 시뮬레이션 스토어 상태 확인
useAISimulationStore.getState()

// 결과 확인
useAISimulationStore.getState().result

// 환경 컨텍스트 확인
console.log('[AISimulationTab] Environment config:', simulationEnvConfig);
```

#### Supabase Edge Function 로그

```bash
# Supabase CLI로 로그 확인
supabase functions logs run-simulation --project-ref <project-id>

# 특정 시간대 로그
supabase functions logs run-simulation --project-ref <project-id> --since 1h
```

### 5.3 디버그 모드

#### 상세 로깅 활성화

`AISimulationTab.tsx`에서 다음 로그 확인:

```javascript
console.log('[AISimulationTab] Environment config useEffect triggered:', {...});
console.log('[AISimulationTab] SimulationEnvironmentSettings onChange:', config.mode);
```

Edge Function에서:

```javascript
console.log(`[Simulation] 시작: store_id=${store_id}, options=`, options);
console.log(`[Simulation] 데이터 로드: zones=${zones?.length}, transitions=${transitions?.length}`);
console.log(`[Simulation] 완료: ${issues.length}개 이슈 발견`);
console.log(`[Simulation] 로깅 완료: ${executionTime}ms`);
```

---

## 부록

### A. 관련 파일 목록

```
src/features/studio/
├── tabs/
│   └── AISimulationTab.tsx          # 메인 시뮬레이션 UI
├── types/
│   ├── scenarioPresets.types.ts     # 프리셋 시나리오 정의
│   └── simulationEnvironment.types.ts
├── utils/
│   └── simulationIssueAnalyzer.ts   # 이슈 분석 로직
├── hooks/
│   └── useEnvironmentContext.ts     # 환경 컨텍스트 훅
├── stores/
│   └── simulationStore.ts           # AI 시뮬레이션 스토어
└── components/
    └── SimulationEnvironmentSettings.tsx

supabase/functions/
├── run-simulation/
│   └── index.ts                     # AI 시뮬레이션 Edge Function
├── generate-optimization/
│   └── index.ts                     # AI 최적화 Edge Function
├── advanced-ai-inference/
│   └── index.ts                     # AI 추론 Edge Function
└── _shared/
    └── aiResponseLogger.ts          # 공유 로깅 유틸리티

supabase/migrations/
├── 20260106_ai_response_logs.sql    # 로깅 테이블
└── 20251212_ai_inference_results.sql
```

### B. 테스트 시나리오 매트릭스

| 시나리오 | 환경 | 고객수 | 예상 이슈 | 예상 시간 |
|---------|------|--------|----------|----------|
| 기본 테스트 | 기본값 | 100 | 0-2개 | 3-5초 |
| 고트래픽 | 블랙프라이데이 | 300 | 4-6개 | 5-8초 |
| 저트래픽 | 한파 | 50 | 0-1개 | 2-4초 |
| 환경 변수 | 비/주말 | 150 | 2-3개 | 4-6초 |
| 피크 시간 | 크리스마스 | 200 | 3-5개 | 5-7초 |

### C. 버전 히스토리

| 버전 | 날짜 | 변경 사항 |
|------|------|----------|
| 1.0 | 2026-01-06 | 초기 문서 작성 |

---

*문서 끝*
