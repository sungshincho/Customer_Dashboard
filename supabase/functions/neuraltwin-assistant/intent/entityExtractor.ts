/**
 * 사용자 메시지에서 엔티티 추출
 * - 페이지명, 탭명, 날짜 범위 등
 *
 * Phase 3-B+: 인텐트 강화 - 날짜 표현 variation 대폭 확대
 */

// 탭 매핑 (페이지별) - 확장됨
export const TAB_MAP: Record<string, Record<string, string>> = {
  insights: {
    '개요': 'overview',
    'overview': 'overview',
    '오버뷰': 'overview',
    '전체': 'overview',
    '매장': 'store',
    'store': 'store',
    '스토어': 'store',
    '고객': 'customer',
    'customer': 'customer',
    '고객분석': 'customer',
    '상품': 'product',
    'product': 'product',
    '상품분석': 'product',
    '재고': 'inventory',
    'inventory': 'inventory',
    '재고관리': 'inventory',
    '예측': 'prediction',
    'prediction': 'prediction',
    '예측분석': 'prediction',
    'AI추천': 'ai-recommendation',
    'AI 추천': 'ai-recommendation',
    'ai': 'ai-recommendation',
    'ai추천': 'ai-recommendation',
    '추천': 'ai-recommendation',
  },
  settings: {
    '매장 관리': 'store-management',
    '매장관리': 'store-management',
    '매장설정': 'store-management',
    '매장': 'store-management',
    'stores': 'store-management',
    '데이터': 'data',
    'data': 'data',
    '데이터설정': 'data',
    '사용자': 'users',
    'users': 'users',
    '사용자관리': 'users',
    '팀원': 'users',
    '시스템': 'system',
    'system': 'system',
    '시스템설정': 'system',
    '플랜': 'plan',
    'plan': 'plan',
    'license': 'plan',
    '구독': 'plan',
    '요금제': 'plan',
  },
  studio: {
    '레이어': 'layer',
    'layer': 'layer',
    '3D 레이어': 'layer',
    'AI 시뮬레이션': 'ai-simulation',
    'ai 시뮬레이션': 'ai-simulation',
    '시뮬레이션': 'ai-simulation',
    'simulation': 'ai-simulation',
    'AI 최적화': 'ai-optimization',
    'ai 최적화': 'ai-optimization',
    '최적화': 'ai-optimization',
    'optimization': 'ai-optimization',
    '적용': 'apply',
    'apply': 'apply',
  },
};

// 날짜 프리셋 매핑 (확장됨)
export const DATE_PRESET_MAP: Record<string, string> = {
  // 오늘
  '오늘': 'today',
  'today': 'today',

  // 어제
  '어제': 'yesterday',
  'yesterday': 'yesterday',

  // 주 단위
  '7일': '7d',
  '일주일': '7d',
  '1주일': '7d',
  '7d': '7d',
  '이번 주': 'thisWeek',
  '이번주': 'thisWeek',
  'this week': 'thisWeek',
  '지난 주': 'lastWeek',
  '지난주': 'lastWeek',
  '저번 주': 'lastWeek',
  '저번주': 'lastWeek',
  'last week': 'lastWeek',

  // 월 단위
  '30일': '30d',
  '한달': '30d',
  '1개월': '30d',
  '30d': '30d',
  '이번 달': 'thisMonth',
  '이번달': 'thisMonth',
  'this month': 'thisMonth',
  '지난 달': 'lastMonth',
  '지난달': 'lastMonth',
  '저번 달': 'lastMonth',
  '저번달': 'lastMonth',
  'last month': 'lastMonth',

  // 분기
  '90일': '90d',
  '3개월': '90d',
  '90d': '90d',
  '이번 분기': 'thisQuarter',
  '이번분기': 'thisQuarter',
  'this quarter': 'thisQuarter',

  // 연간
  '1년': '365d',
  '올해': 'thisYear',
  '365d': '365d',
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
 * 날짜 범위 추출 (대폭 강화)
 */
export function extractDateRange(text: string): {
  preset?: string;
  startDate?: string;
  endDate?: string;
} | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const today = new Date();
  const currentYear = today.getFullYear();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // 연도 추출
  let year = currentYear;
  const yearMatch = text.match(/(\d{2,4})년/);
  if (yearMatch) {
    const parsedYear = parseInt(yearMatch[1], 10);
    year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
  }

  // =====================
  // 1. 프리셋 매칭 (simple presets first)
  // =====================
  for (const [keyword, preset] of Object.entries(DATE_PRESET_MAP)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return { preset };
    }
  }

  // =====================
  // 2. 커스텀 범위 매칭
  // =====================

  // "12월 1일부터 10일까지" 또는 "12월 1-10일"
  const koreanRangeMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?\s*(?:부터|[-~])\s*(\d{1,2})일?(?:까지)?/);
  if (koreanRangeMatch) {
    const month = parseInt(koreanRangeMatch[1], 10);
    const startDay = parseInt(koreanRangeMatch[2], 10);
    const endDay = parseInt(koreanRangeMatch[3], 10);

    return {
      startDate: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    };
  }

  // MM/DD~MM/DD 또는 MM-DD~MM-DD 또는 MM/DD~DD
  const slashRangePatterns = [
    // MM/DD-MM/DD (full range)
    /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,
    // MM/DD~DD (same month)
    /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})(?![\/\-.])/,
  ];

  for (const pattern of slashRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const startMonth = parseInt(match[1], 10);
      const startDay = parseInt(match[2], 10);
      let endMonth = startMonth;
      let endDay: number;

      if (match[4]) {
        // MM/DD-MM/DD format
        endMonth = parseInt(match[3], 10);
        endDay = parseInt(match[4], 10);
      } else {
        // MM/DD~DD format (same month)
        endDay = parseInt(match[3], 10);
      }

      return {
        startDate: `${year}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
        endDate: `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      };
    }
  }

  // "12월 첫째주", "12월 둘째주" 등
  const weekOfMonthMatch = text.match(/(\d{1,2})월\s*(첫째|둘째|셋째|넷째|마지막)\s*주/);
  if (weekOfMonthMatch) {
    const month = parseInt(weekOfMonthMatch[1], 10);
    const weekNum = { '첫째': 1, '둘째': 2, '셋째': 3, '넷째': 4, '마지막': 5 }[weekOfMonthMatch[2]] || 1;

    const startDay = 1 + (weekNum - 1) * 7;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDay = Math.min(startDay + 6, lastDayOfMonth);

    return {
      startDate: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    };
  }

  // "12월 초", "12월 중순", "12월 말"
  const monthPartMatch = text.match(/(\d{1,2})월\s*(초|중순|말)/);
  if (monthPartMatch) {
    const month = parseInt(monthPartMatch[1], 10);
    const part = monthPartMatch[2];
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    let startDay: number, endDay: number;
    if (part === '초') {
      startDay = 1;
      endDay = 10;
    } else if (part === '중순') {
      startDay = 11;
      endDay = 20;
    } else {
      startDay = 21;
      endDay = lastDayOfMonth;
    }

    return {
      startDate: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    };
  }

  // "연말" (12월)
  if (/연말/.test(normalizedText)) {
    return {
      startDate: `${year}-12-01`,
      endDate: `${year}-12-31`,
    };
  }

  // "연초" (1월)
  if (/연초/.test(normalizedText)) {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-01-31`,
    };
  }

  // "그제", "그저께"
  if (/그제|그저께/.test(normalizedText)) {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const dateStr = formatDate(twoDaysAgo);
    return {
      startDate: dateStr,
      endDate: dateStr,
    };
  }

  // 단일 날짜: "12월 1일" 또는 "12/1"
  const singleKoreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일(?!\s*[-~부터])/);
  if (singleKoreanDateMatch) {
    const month = parseInt(singleKoreanDateMatch[1], 10);
    const day = parseInt(singleKoreanDateMatch[2], 10);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      startDate: dateStr,
      endDate: dateStr,
    };
  }

  const singleSlashDateMatch = text.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (singleSlashDateMatch) {
    const month = parseInt(singleSlashDateMatch[1], 10);
    const day = parseInt(singleSlashDateMatch[2], 10);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      startDate: dateStr,
      endDate: dateStr,
    };
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
