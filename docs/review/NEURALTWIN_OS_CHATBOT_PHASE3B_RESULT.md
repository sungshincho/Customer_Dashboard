# NEURALTWIN OS 챗봇 — Phase 3-B 개발 결과서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **개발자**: Claude AI Assistant
> **선행 Phase**: Phase 3-A 완료

---

## 1. 개발 완료 요약

Phase 3-B **KPI 조회(query_kpi)** 기능 구현 완료:
- "오늘 매출 얼마야?", "방문객 몇 명이야?" 질문에 실제 DB 데이터로 응답
- daily_kpis_agg 테이블에서 데이터 조회
- 전일 대비 변화율 계산 및 자연어 응답 생성

---

## 2. 구현 파일 목록

| 파일 | 상태 | 설명 |
|:---|:---|:---|
| `intent/patterns.ts` | 수정 | query_kpi 패턴 + extractQueryType, extractPeriod 함수 추가 |
| `actions/queryActions.ts` | 신규 | KPI 조회 핸들러 (매출, 방문객, 전환율, 객단가, 요약) |
| `index.ts` | 수정 | query_kpi 인텐트 라우팅 추가 |

---

## 3. 핵심 구현 코드

### 3.1 patterns.ts — query_kpi 패턴

```typescript
// query_kpi — KPI 데이터 조회 (Phase 3-B)
{
  intent: 'query_kpi',
  patterns: [
    /(?:오늘|어제|이번\s*주|이번\s*달|최근)?\s*(?:매출|revenue)\s*(?:얼마|어때|어떻게|알려|보여)/i,
    /(?:오늘|어제)?\s*(?:방문객|visitor|고객|트래픽)\s*(?:수|몇|얼마|어때|명)/i,
    /(?:전환율|conversion)\s*(?:어때|어떻게|알려|몇|%)/i,
    /(?:평균\s*객단가|객단가|거래\s*금액)\s*(?:얼마|어때)/i,
    /(?:오늘|어제|최근)?\s*(?:성과|실적|현황)\s*(?:어때|알려|보여)/i,
    /(?:매출|방문객|전환율).*(?:알려|보여|어때|얼마)/i,
  ],
  confidence: 0.85,
  extractors: {
    queryType: (_match, text) => extractQueryType(text),
    period: (_match, text) => extractPeriod(text),
  },
}

// 쿼리 타입: revenue | visitors | conversion | avgTransaction | summary
// 기간 타입: today | yesterday | thisWeek | thisMonth
```

### 3.2 queryActions.ts — 주요 함수

```typescript
// KPI 조회 메인 핸들러
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string
): Promise<QueryActionResult>

// 개별 쿼리 함수
async function queryRevenue(...)     // 매출 조회 + 전일 대비
async function queryVisitors(...)    // 방문객 조회 + 전일 대비
async function queryConversion(...)  // 전환율 조회
async function queryAvgTransaction(...) // 평균 객단가 조회
async function querySummary(...)     // 전체 요약 (매출, 방문객, 전환율)
```

### 3.3 index.ts — 라우팅

```typescript
} else if (classification.intent === 'query_kpi') {
  // KPI 데이터 조회 (Phase 3-B)
  const queryResult = await handleQueryKpi(supabase, classification, context.store.id);
  actionResult = {
    actions: queryResult.actions,
    message: queryResult.message,
    suggestions: queryResult.suggestions,
  };
}
```

---

## 4. 지원 쿼리 타입

| 쿼리 타입 | 트리거 예시 | 응답 예시 |
|:---|:---|:---|
| `revenue` | "오늘 매출 얼마야?" | "오늘 매출은 1,234만원입니다. 전일 대비 +5%입니다." |
| `visitors` | "방문객 몇 명이야?" | "오늘 방문객은 1,500명입니다. 전일 대비 -3%입니다." |
| `conversion` | "전환율 어때?" | "현재 전환율은 12.5%입니다." |
| `avgTransaction` | "객단가 얼마야?" | "평균 객단가는 45,000원입니다." |
| `summary` | "오늘 현황 알려줘" | "오늘의 주요 지표입니다:\n• 매출: 1,234만원\n• 방문객: 1,500명\n• 전환율: 12.5%" |

---

## 5. 지원 기간

| 기간 | 트리거 키워드 |
|:---|:---|
| 오늘 | "오늘", "today" (기본값) |
| 어제 | "어제", "yesterday" |
| 이번 주 | "이번 주", "this week" |
| 이번 달 | "이번 달", "this month" |

---

## 6. 데이터 소스

**조회 대상 테이블**: `daily_kpis_agg`

| 컬럼 | 용도 |
|:---|:---|
| `store_id` | 매장 식별자 |
| `date` | 날짜 |
| `total_revenue` | 총 매출 |
| `total_visitors` | 총 방문객 |
| `total_transactions` | 총 거래 수 |
| `conversion_rate` | 전환율 |
| `avg_transaction_value` | 평균 거래 금액 |

---

## 7. 체크리스트

### 파일 생성/수정
- [x] `actions/queryActions.ts` 신규 생성
- [x] `intent/patterns.ts`에 query_kpi 패턴 추가
- [x] `index.ts`에 query_kpi 라우팅 추가

### 기능 (배포 후 테스트 필요)
- [ ] "오늘 매출 얼마야?" → 매출 데이터 + 전일 대비 변화
- [ ] "방문객 몇 명이야?" → 방문객 수 데이터
- [ ] "전환율 어때?" → 전환율 데이터
- [ ] "오늘 현황 알려줘" → 전체 요약 데이터
- [ ] 데이터 없을 때 적절한 메시지 반환

---

## 8. 다음 Phase 예고

**Phase 3-C**: 시뮬레이션/최적화 오케스트레이션
- `actions/executionActions.ts` — run_simulation, run_optimization 처리
- 기존 `run-simulation`, `generate-optimization` EF 내부 호출
- 실행 결과 자연어 요약

---

**Phase 3-B 개발 완료**
