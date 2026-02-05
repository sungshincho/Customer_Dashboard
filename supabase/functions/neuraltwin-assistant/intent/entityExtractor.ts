/**
 * 사용자 메시지에서 엔티티 추출
 * - 페이지명, 탭명, 날짜 범위 등
 */

// 탭 매핑 (페이지별)
export const TAB_MAP: Record<string, Record<string, string>> = {
  insights: {
    '개요': 'overview',
    'overview': 'overview',
    '매장': 'store',
    'store': 'store',
    '고객': 'customer',
    'customer': 'customer',
    '상품': 'product',
    'product': 'product',
    '재고': 'inventory',
    'inventory': 'inventory',
    '예측': 'prediction',
    'prediction': 'prediction',
    'AI추천': 'ai',
    'AI 추천': 'ai',
    'ai': 'ai',
    'ai추천': 'ai',
  },
  settings: {
    '매장 관리': 'stores',
    '매장': 'stores',
    'stores': 'stores',
    '데이터': 'data',
    'data': 'data',
    '사용자': 'users',
    'users': 'users',
    '시스템': 'system',
    'system': 'system',
    '플랜': 'license',
    'license': 'license',
  },
  studio: {
    '레이어': 'layer',
    'layer': 'layer',
    'AI 시뮬레이션': 'ai-simulation',
    'ai 시뮬레이션': 'ai-simulation',
    '시뮬레이션': 'ai-simulation',
    'AI 최적화': 'ai-optimization',
    'ai 최적화': 'ai-optimization',
    '최적화': 'ai-optimization',
    '적용': 'apply',
    'apply': 'apply',
  },
};

// 날짜 프리셋 매핑
export const DATE_PRESET_MAP: Record<string, string> = {
  '오늘': 'today',
  'today': 'today',
  '7일': '7d',
  '일주일': '7d',
  '1주일': '7d',
  '7d': '7d',
  '30일': '30d',
  '한달': '30d',
  '1개월': '30d',
  '30d': '30d',
  '90일': '90d',
  '3개월': '90d',
  '90d': '90d',
};

/**
 * 탭명 추출
 */
export function extractTab(text: string, page?: string): string | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 페이지가 지정되어 있으면 해당 페이지의 탭 매핑에서만 검색
  if (page) {
    const pageKey = page.replace('/', '').replace('/insights', 'insights');
    const tabMap = TAB_MAP[pageKey] || TAB_MAP.insights;

    for (const [keyword, tabValue] of Object.entries(tabMap)) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return tabValue;
      }
    }
  }

  // 페이지가 없으면 모든 탭 매핑에서 검색
  for (const [, tabMap] of Object.entries(TAB_MAP)) {
    for (const [keyword, tabValue] of Object.entries(tabMap)) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return tabValue;
      }
    }
  }

  return null;
}

/**
 * 탭이 속한 페이지 추론
 */
export function inferPageFromTab(tab: string): string | null {
  for (const [pageKey, tabMap] of Object.entries(TAB_MAP)) {
    if (Object.values(tabMap).includes(tab)) {
      switch (pageKey) {
        case 'insights': return '/insights';
        case 'settings': return '/settings';
        case 'studio': return '/studio';
      }
    }
  }
  return null;
}

/**
 * 날짜 범위 추출
 */
export function extractDateRange(text: string): {
  preset?: string;
  startDate?: string;
  endDate?: string;
} | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 프리셋 매칭
  for (const [keyword, preset] of Object.entries(DATE_PRESET_MAP)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return { preset };
    }
  }

  // 커스텀 범위 매칭: "11/4~11/15", "11월 4일부터 15일까지" 등
  const customRangePatterns = [
    // MM/DD~MM/DD 또는 MM-DD~MM-DD
    /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,
    // MM월 DD일 ~ MM월 DD일
    /(\d{1,2})월\s*(\d{1,2})일?\s*[~부터\-]\s*(\d{1,2})월?\s*(\d{1,2})일/,
  ];

  for (const pattern of customRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const currentYear = new Date().getFullYear();
      const startMonth = match[1].padStart(2, '0');
      const startDay = match[2].padStart(2, '0');
      const endMonth = match[3].padStart(2, '0');
      const endDay = match[4].padStart(2, '0');

      return {
        startDate: `${currentYear}-${startMonth}-${startDay}`,
        endDate: `${currentYear}-${endMonth}-${endDay}`,
      };
    }
  }

  return null;
}

/**
 * 전체 엔티티 추출
 */
export function extractEntities(text: string, currentPage?: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // 탭 추출
  const tab = extractTab(text, currentPage);
  if (tab) {
    entities.tab = tab;

    // 탭에서 페이지 추론 (페이지가 명시되지 않은 경우)
    if (!entities.page) {
      const inferredPage = inferPageFromTab(tab);
      if (inferredPage) {
        entities.inferredPage = inferredPage;
      }
    }
  }

  // 날짜 범위 추출
  const dateRange = extractDateRange(text);
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

  return entities;
}
