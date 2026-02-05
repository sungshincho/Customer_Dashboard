/**
 * 인텐트별 패턴 매칭 정의
 * Phase 2-A: navigate 인텐트
 * Phase 2-B: set_tab, set_date_range, composite_navigate 추가
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
];

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
