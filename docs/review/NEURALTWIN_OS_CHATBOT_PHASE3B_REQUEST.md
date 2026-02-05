# NEURALTWIN OS 챗봇 — Phase 3-B 기능 개발 요청서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 3-A (일반 대화 + AI 연동) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 3-B 목표

**KPI 조회(query_kpi) — 기존 DB 테이블 직접 쿼리** 구현

이 Phase가 완료되면:
- "오늘 매출 얼마야?", "방문객 몇 명이야?" 같은 질문에 실제 데이터로 응답
- 기존 daily_kpis_agg, zone_daily_metrics 등 테이블에서 데이터 조회
- 조회 결과를 자연어로 변환하여 응답

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 DB 테이블 구조 수정
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant Edge Function 내 파일 추가
✅ 기존 DB 테이블 읽기 전용 쿼리
```

---

## 3. 구현 범위

### 3.1 신규/수정 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   └── patterns.ts         # 수정 (query_kpi 패턴 추가)
├── actions/
│   └── queryActions.ts     # 신규
└── response/
    └── generator.ts        # 수정 (KPI 응답 포맷 추가)
```

### 3.2 쿼리 대상 기존 테이블

| 테이블 | 용도 | 주요 컬럼 |
|:---|:---|:---|
| `daily_kpis_agg` | 일별 KPI 집계 | store_id, date, total_revenue, total_visitors, conversion_rate 등 |
| `zone_daily_metrics` | 존별 일별 성과 | store_id, zone_id, date, visitors, dwell_time, engagement_rate 등 |
| `product_performance_agg` | 상품별 성과 | store_id, product_id, sales_count, revenue 등 |
| `customer_segments_agg` | 고객 세그먼트 | store_id, segment, count, avg_spend 등 |

### 3.3 patterns.ts 추가 — query_kpi 패턴

```typescript
// 기존 INTENT_PATTERNS 배열에 추가

// query_kpi — KPI 데이터 조회
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
    queryType: (match, text) => extractQueryType(text),
    period: (match, text) => extractPeriod(text),
  },
},

// 쿼리 타입 추출 함수
function extractQueryType(text: string): string {
  const normalizedText = text.toLowerCase();

  if (/매출|revenue|수익|매상/.test(normalizedText)) return 'revenue';
  if (/방문객|visitor|고객\s*수|트래픽/.test(normalizedText)) return 'visitors';
  if (/전환율|conversion|전환/.test(normalizedText)) return 'conversion';
  if (/객단가|거래\s*금액|평균\s*금액/.test(normalizedText)) return 'avgTransaction';
  if (/성과|실적|현황|요약/.test(normalizedText)) return 'summary';

  return 'summary'; // 기본값
}

// 기간 추출 함수
function extractPeriod(text: string): { type: string; date?: string } {
  const normalizedText = text.toLowerCase();

  if (/오늘|today/.test(normalizedText)) {
    return { type: 'today' };
  }
  if (/어제|yesterday/.test(normalizedText)) {
    return { type: 'yesterday' };
  }
  if (/이번\s*주|this\s*week/.test(normalizedText)) {
    return { type: 'thisWeek' };
  }
  if (/이번\s*달|this\s*month/.test(normalizedText)) {
    return { type: 'thisMonth' };
  }

  // 기본값: 오늘
  return { type: 'today' };
}
```

### 3.4 queryActions.ts — KPI 조회 처리

```typescript
/**
 * KPI 조회(query_kpi) 처리
 * 기존 DB 테이블 직접 쿼리 (읽기 전용)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { ClassificationResult } from '../intent/classifier.ts';
import { formatDataResponse } from '../response/generator.ts';

export interface QueryActionResult {
  actions: any[];
  message: string;
  suggestions: string[];
  data?: any;
}

/**
 * query_kpi 인텐트 처리
 */
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string
): Promise<QueryActionResult> {
  const queryType = classification.entities.queryType || 'summary';
  const period = classification.entities.period || { type: 'today' };

  try {
    const dateRange = getDateRange(period);

    switch (queryType) {
      case 'revenue':
        return await queryRevenue(supabase, storeId, dateRange);

      case 'visitors':
        return await queryVisitors(supabase, storeId, dateRange);

      case 'conversion':
        return await queryConversion(supabase, storeId, dateRange);

      case 'avgTransaction':
        return await queryAvgTransaction(supabase, storeId, dateRange);

      case 'summary':
      default:
        return await querySummary(supabase, storeId, dateRange);
    }

  } catch (error) {
    console.error('[queryActions] Error:', error);
    return {
      actions: [],
      message: '데이터 조회 중 문제가 발생했어요.',
      suggestions: ['다시 시도해줘', '인사이트 허브에서 확인하기'],
    };
  }
}

/**
 * 기간 계산
 */
function getDateRange(period: { type: string; date?: string }): {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (period.type) {
    case 'today': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
        compareStartDate: formatDate(yesterday),
        compareEndDate: formatDate(yesterday),
      };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);
      return {
        startDate: formatDate(yesterday),
        endDate: formatDate(yesterday),
        compareStartDate: formatDate(dayBefore),
        compareEndDate: formatDate(dayBefore),
      };
    }

    case 'thisWeek': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(today),
      };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(today),
      };
    }

    default:
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
      };
  }
}

/**
 * 매출 조회
 */
async function queryRevenue(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string }
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('date, total_revenue, total_transactions')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate) {
    const { data: compareData } = await supabase
      .from('daily_kpis_agg')
      .select('total_revenue')
      .eq('store_id', storeId)
      .eq('date', dateRange.compareStartDate)
      .single();

    if (compareData?.total_revenue && compareData.total_revenue > 0) {
      change = Math.round(((totalRevenue - compareData.total_revenue) / compareData.total_revenue) * 100);
    }
  }

  const responseData = { totalRevenue, totalTransactions, change };

  return {
    actions: [],
    message: formatDataResponse('revenue', responseData),
    suggestions: ['방문객 수 알려줘', '전환율 어때?', '인사이트 허브에서 자세히 보기'],
    data: responseData,
  };
}

/**
 * 방문객 조회
 */
async function queryVisitors(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string }
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('date, total_visitors, unique_visitors')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const uniqueVisitors = data?.reduce((sum, row) => sum + (row.unique_visitors || 0), 0) || 0;

  // 전일 대비 계산
  let change: number | null = null;
  if (dateRange.compareStartDate) {
    const { data: compareData } = await supabase
      .from('daily_kpis_agg')
      .select('total_visitors')
      .eq('store_id', storeId)
      .eq('date', dateRange.compareStartDate)
      .single();

    if (compareData?.total_visitors && compareData.total_visitors > 0) {
      change = Math.round(((totalVisitors - compareData.total_visitors) / compareData.total_visitors) * 100);
    }
  }

  const responseData = { totalVisitors, uniqueVisitors, change };

  return {
    actions: [],
    message: formatDataResponse('visitors', responseData),
    suggestions: ['매출 알려줘', '전환율 어때?', '고객탭에서 자세히 보기'],
    data: responseData,
  };
}

/**
 * 전환율 조회
 */
async function queryConversion(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('total_visitors, total_transactions, conversion_rate')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const conversionRate = totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0;

  const responseData = { conversionRate, totalVisitors, totalTransactions };

  return {
    actions: [],
    message: formatDataResponse('conversion', responseData),
    suggestions: ['매출 알려줘', '방문객 수 알려줘', '인사이트 허브에서 자세히 보기'],
    data: responseData,
  };
}

/**
 * 평균 객단가 조회
 */
async function queryAvgTransaction(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('total_revenue, total_transactions, avg_transaction_value')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const responseData = { avgTransaction, totalRevenue, totalTransactions };

  return {
    actions: [],
    message: `평균 객단가는 ${Math.round(avgTransaction).toLocaleString()}원입니다.`,
    suggestions: ['매출 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

/**
 * 전체 요약 조회
 */
async function querySummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<QueryActionResult> {
  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (error) throw error;

  const totalRevenue = data?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
  const totalVisitors = data?.reduce((sum, row) => sum + (row.total_visitors || 0), 0) || 0;
  const totalTransactions = data?.reduce((sum, row) => sum + (row.total_transactions || 0), 0) || 0;
  const conversionRate = totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0;

  const message = `오늘의 주요 지표입니다:\n` +
    `• 매출: ${formatNumber(totalRevenue)}원\n` +
    `• 방문객: ${totalVisitors.toLocaleString()}명\n` +
    `• 전환율: ${conversionRate.toFixed(1)}%`;

  return {
    actions: [],
    message,
    suggestions: ['인사이트 허브에서 자세히 보기', '시뮬레이션 돌려줘'],
    data: { totalRevenue, totalVisitors, totalTransactions, conversionRate },
  };
}

function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
```

---

## 4. 완료 체크리스트

### 파일 생성/수정
- [ ] `actions/queryActions.ts` 신규 생성
- [ ] `intent/patterns.ts`에 query_kpi 패턴 추가
- [ ] `response/generator.ts`에 KPI 응답 포맷 함수 추가

### 기능 테스트
- [ ] "오늘 매출 얼마야?" → 매출 데이터 + 전일 대비 변화
- [ ] "방문객 몇 명이야?" → 방문객 수 데이터
- [ ] "전환율 어때?" → 전환율 데이터
- [ ] "오늘 현황 알려줘" → 전체 요약 데이터
- [ ] 데이터 없을 때 적절한 메시지 반환

---

## 5. 다음 Phase 예고

**Phase 3-C**: 시뮬레이션/최적화 오케스트레이션
- `actions/executionActions.ts` — run_simulation, run_optimization 처리
- 기존 `run-simulation`, `generate-optimization` EF 내부 호출
- 실행 결과 자연어 요약

---

**Phase 3-B 요청서 끝**
