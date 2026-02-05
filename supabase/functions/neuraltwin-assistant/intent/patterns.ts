/**
 * 인텐트별 패턴 매칭 정의
 * Phase 2-A: navigate 인텐트만 구현
 */

export interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  confidence: number;
  extractors?: {
    page?: (match: RegExpMatchArray, text: string) => string | null;
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
      page: (match, text) => extractPage(text),
    },
  },
];

/**
 * 텍스트에서 패턴 매칭으로 인텐트 분류
 */
export function matchIntent(text: string): {
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

        // 엔티티 추출
        if (pattern.extractors?.page) {
          const page = pattern.extractors.page(match, normalizedText);
          if (page) {
            entities.page = page;
          }
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
