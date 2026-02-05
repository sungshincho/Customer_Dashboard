/**
 * 인텐트별 패턴 매칭 정의
 * Phase 2-A: navigate 인텐트
 * Phase 2-B: set_tab, set_date_range, composite_navigate 추가
 * Phase 3-B: query_kpi 인텐트 추가
 */

import { extractTab, extractDateRange, extractEntities, inferPageFromTab } from './entityExtractor.ts';

export interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  confidence: number;
  extractors?: {
    page?: (match: RegExpMatchArray, text: string) => string | null;
    tab?: (match: RegExpMatchArray, text: string) => string | null;
    dateRange?: (match: RegExpMatchArray, text: string) => { preset?: string; startDate?: string; endDate?: string } | null;
    queryType?: (match: RegExpMatchArray, text: string) => string;
    period?: (match: RegExpMatchArray, text: string) => { type: string; startDate?: string; endDate?: string };
    all?: (match: RegExpMatchArray, text: string) => Record<string, any>;
  };
}

// 페이지 매핑
export const PAGE_MAP: Record<string, string> = {
  '인사이트': '/insights',
  '인사이트 허브': '/insights',
  '인사이트허브': '/insights',
  'insight': '/insights',
  'insights': '/insights',

  '스튜디오': '/studio',
  '디지털트윈': '/studio',
  '디지털 트윈': '/studio',
  'studio': '/studio',

  'ROI': '/roi',
  'roi': '/roi',
  '알오아이': '/roi',
  'ROI 측정': '/roi',
  'roi 측정': '/roi',

  '설정': '/settings',
  'settings': '/settings',
  '세팅': '/settings',

  '데이터 컨트롤타워': '/data/control-tower',
  '데이터 컨트롤': '/data/control-tower',
  '데이터컨트롤타워': '/data/control-tower',
  'data control tower': '/data/control-tower',
  '컨트롤타워': '/data/control-tower',
};

// 페이지 추출 함수
function extractPage(text: string): string | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  for (const [keyword, route] of Object.entries(PAGE_MAP)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return route;
    }
  }
  return null;
}

export const INTENT_PATTERNS: IntentPattern[] = [
  // navigate — 페이지 이동
  {
    intent: 'navigate',
    patterns: [
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|데이터\s*컨트롤|컨트롤타워).*(?:로|으로|에)?\s*(?:가|이동|열|보여|가줘|이동해|열어|보여줘)/i,
      /(?:가|이동|열|보여)\s*(?:줘|해)?\s*(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings)/i,
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|컨트롤타워)\s*(?:페이지|화면)?\s*(?:열어|보여|가)/i,
    ],
    confidence: 0.95,
    extractors: {
      page: (_match, text) => extractPage(text),
    },
  },

  // set_tab — 탭 전환
  {
    intent: 'set_tab',
    patterns: [
      /(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요|overview)\s*(?:탭|tab)?(?:을|를)?\s*(?:보여|열|선택|클릭|눌러)/i,
      /(?:보여|열어|선택|클릭)\s*(?:줘|해)?\s*(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요)\s*(?:탭|tab)?/i,
      /(?:고객|매장|상품|재고|예측|AI추천|개요|시뮬레이션|최적화|레이어)\s*(?:탭|tab)\s*(?:으로|로)?\s*(?:이동|가|열어|보여)/i,
    ],
    confidence: 0.90,
    extractors: {
      tab: (_match, text) => extractTab(text),
    },
  },

  // set_date_range — 날짜 필터 변경
  {
    intent: 'set_date_range',
    patterns: [
      /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,  // 11/4~11/15
      /(?:오늘|today)\s*(?:데이터|기간|날짜)?(?:로|으로)?/i,
      /(?:7일|일주일|1주일)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /(?:30일|한달|1개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /(?:90일|3개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /기간\s*(?:을|를)?\s*(?:변경|설정|바꿔)/i,
      /(?:최근|지난)\s*(?:7일|일주일|30일|한달|90일|3개월)/i,
    ],
    confidence: 0.90,
    extractors: {
      dateRange: (_match, text) => extractDateRange(text),
    },
  },

  // composite_navigate — 복합 네비게이션 (페이지 + 탭 + 날짜)
  {
    intent: 'composite_navigate',
    patterns: [
      /(?:인사이트|스튜디오|설정).*(?:에서|에|의)?\s*(?:\d{1,2}[\/\-]\d{1,2}.*)?(?:고객|매장|상품|재고|예측|AI|개요|시뮬레이션|최적화)?\s*(?:탭|tab)?/i,
      /(?:고객|매장|상품|재고|예측|AI|개요).*(?:탭|tab)?.*(?:에서|에)?\s*(?:\d{1,2}[\/\-]\d{1,2}|\d{1,2}일|오늘|7일|30일|90일)/i,
    ],
    confidence: 0.85,
    extractors: {
      all: (_match, text) => extractEntities(text),
    },
  },

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
      // 상품/판매량/재고 관련
      /(?:상품|판매량|판매\s*수량?).*(?:알려|보여|어때|얼마)/i,
      /(?:재고|inventory).*(?:알려|보여|어때|현황)/i,
      // 커스텀 날짜 범위 + KPI (예: "12월 1-15일 방문객 보여줘", "25년 12월 1-10일 상품 판매량")
      /(?:\d{2,4}년\s*)?(\d{1,2})월\s*(\d{1,2})[-~](\d{1,2})일?.*(?:매출|방문객|전환율|현황|데이터|상품|판매량|재고)/i,
      /(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})[\/\-.]?(\d{1,2})?.*(?:매출|방문객|전환율|현황|데이터|상품|판매량|재고)/i,
    ],
    confidence: 0.85,
    extractors: {
      queryType: (_match, text) => extractQueryType(text),
      period: (_match, text) => extractPeriod(text),
    },
  },
];

// 쿼리 타입 추출 함수 (Phase 3-B)
function extractQueryType(text: string): string {
  const normalizedText = text.toLowerCase();

  if (/매출|revenue|수익|매상/.test(normalizedText)) return 'revenue';
  if (/방문객|visitor|고객\s*수|트래픽/.test(normalizedText)) return 'visitors';
  if (/전환율|conversion|전환/.test(normalizedText)) return 'conversion';
  if (/객단가|거래\s*금액|평균\s*금액/.test(normalizedText)) return 'avgTransaction';
  if (/상품|판매량|판매\s*수|product|sales/.test(normalizedText)) return 'product';
  if (/재고|inventory|stock/.test(normalizedText)) return 'inventory';
  if (/성과|실적|현황|요약/.test(normalizedText)) return 'summary';

  return 'summary'; // 기본값
}

// 기간 추출 함수 (Phase 3-B)
function extractPeriod(text: string): { type: string; startDate?: string; endDate?: string } {
  const normalizedText = text.toLowerCase();
  const currentYear = new Date().getFullYear();

  // 연도 추출: "25년", "2025년" 형식
  let year = currentYear;
  const yearMatch = text.match(/(\d{2,4})년/);
  if (yearMatch) {
    const parsedYear = parseInt(yearMatch[1], 10);
    // 2자리 연도는 2000년대로 변환 (예: 25 → 2025)
    year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
  }

  // 커스텀 날짜 범위: "12월 1-15일" 또는 "12월 1일-15일"
  const koreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?\s*[-~]\s*(\d{1,2})일?/);
  if (koreanDateMatch) {
    const month = parseInt(koreanDateMatch[1], 10);
    const startDay = parseInt(koreanDateMatch[2], 10);
    const endDay = parseInt(koreanDateMatch[3], 10);

    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
  }

  // 커스텀 날짜 범위: "12/1-12/15" 또는 "12/1~15"
  const slashDateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})?[\/\-.]?(\d{1,2})?/);
  if (slashDateMatch) {
    const startMonth = parseInt(slashDateMatch[1], 10);
    const startDay = parseInt(slashDateMatch[2], 10);
    let endMonth = startMonth;
    let endDay = startDay;

    if (slashDateMatch[3] && slashDateMatch[4]) {
      // "12/1-12/15" 형식
      endMonth = parseInt(slashDateMatch[3], 10);
      endDay = parseInt(slashDateMatch[4], 10);
    } else if (slashDateMatch[3]) {
      // "12/1-15" 형식 (같은 월)
      endDay = parseInt(slashDateMatch[3], 10);
    }

    const startDate = `${year}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
  }

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

/**
 * 텍스트에서 패턴 매칭으로 인텐트 분류
 */
export function matchIntent(text: string, currentPage?: string): {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
} | null {
  const normalizedText = text.trim();

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalizedText.match(regex);
      if (match) {
        const entities: Record<string, any> = {};

        // 페이지 추출
        if (pattern.extractors?.page) {
          const page = pattern.extractors.page(match, normalizedText);
          if (page) {
            entities.page = page;
          }
        }

        // 탭 추출
        if (pattern.extractors?.tab) {
          const tab = pattern.extractors.tab(match, normalizedText);
          if (tab) {
            entities.tab = tab;
            // 탭에서 페이지 추론
            const inferredPage = inferPageFromTab(tab);
            if (inferredPage) {
              entities.inferredPage = inferredPage;
            }
          }
        }

        // 날짜 범위 추출
        if (pattern.extractors?.dateRange) {
          const dateRange = pattern.extractors.dateRange(match, normalizedText);
          if (dateRange) {
            if (dateRange.preset) {
              entities.datePreset = dateRange.preset;
            }
            if (dateRange.startDate) {
              entities.dateStart = dateRange.startDate;
            }
            if (dateRange.endDate) {
              entities.dateEnd = dateRange.endDate;
            }
          }
        }

        // 쿼리 타입 추출 (Phase 3-B)
        if (pattern.extractors?.queryType) {
          const queryType = pattern.extractors.queryType(match, normalizedText);
          if (queryType) {
            entities.queryType = queryType;
          }
        }

        // 기간 추출 (Phase 3-B)
        if (pattern.extractors?.period) {
          const period = pattern.extractors.period(match, normalizedText);
          if (period) {
            entities.period = period;
          }
        }

        // 전체 엔티티 추출 (composite)
        if (pattern.extractors?.all) {
          const allEntities = pattern.extractors.all(match, normalizedText);
          Object.assign(entities, allEntities);
        }

        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          entities,
        };
      }
    }
  }

  return null;
}
