/**
 * 인텐트별 패턴 매칭 정의
 * Phase 2-A: navigate 인텐트
 * Phase 2-B: set_tab, set_date_range, composite_navigate 추가
 * Phase 3-B: query_kpi 인텐트 추가
 * Phase 3-B+: 인텐트 강화 - 날짜 variation, 용어 인식, 자연어 variation 대폭 확대
 */

import { extractTab, extractDateRange, extractEntities, inferPageFromTab } from './entityExtractor.ts';
import { TERM_LOCATION_MAP, findTermLocation } from '../config/dashboardStructure.ts';

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
    section?: (match: RegExpMatchArray, text: string) => string | null;
    modalId?: (match: RegExpMatchArray, text: string) => string | null;
    all?: (match: RegExpMatchArray, text: string) => Record<string, any>;
  };
}

// 페이지 매핑 (확장됨)
export const PAGE_MAP: Record<string, string> = {
  // 인사이트 허브
  '인사이트': '/insights',
  '인사이트 허브': '/insights',
  '인사이트허브': '/insights',
  'insight': '/insights',
  'insights': '/insights',

  // 스튜디오
  '스튜디오': '/studio',
  '디지털트윈': '/studio',
  '디지털 트윈': '/studio',
  'studio': '/studio',
  '트윈': '/studio',

  // ROI
  'ROI': '/roi',
  'roi': '/roi',
  '알오아이': '/roi',
  'ROI 측정': '/roi',
  'roi 측정': '/roi',
  'ROI분석': '/roi',

  // 설정
  '설정': '/settings',
  'settings': '/settings',
  '세팅': '/settings',
  '관리': '/settings',

  // 데이터 컨트롤타워
  '데이터 컨트롤타워': '/data/control-tower',
  '데이터 컨트롤': '/data/control-tower',
  '데이터컨트롤타워': '/data/control-tower',
  'data control tower': '/data/control-tower',
  '컨트롤타워': '/data/control-tower',
  '컨트롤 타워': '/data/control-tower',
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

// 섹션 추출 함수 (인텐트 강화)
function extractSection(text: string): string | null {
  const normalizedText = text.toLowerCase();

  // KPI 카드 섹션
  if (/kpi|지표|카드/.test(normalizedText)) return 'kpi-cards';

  // 목표 달성률
  if (/목표|goal|달성률/.test(normalizedText)) return 'goal-achievement';

  // 트렌드 차트
  if (/트렌드|추이|그래프|차트/.test(normalizedText)) return 'trend-chart';

  // 일별 요약
  if (/일별|요약|테이블/.test(normalizedText)) return 'daily-summary';

  // 고객 KPI
  if (/고객\s*kpi|방문객.*상세/.test(normalizedText)) return 'customer-kpi';

  // 세그먼트
  if (/세그먼트|분류/.test(normalizedText)) return 'customer-segments';

  // 히트맵
  if (/히트맵|열지도|구역/.test(normalizedText)) return 'zone-heatmap';

  // 동선
  if (/동선|이동\s*경로|플로우/.test(normalizedText)) return 'traffic-flow';

  // 재고 현황
  if (/재고\s*현황|재고\s*상태|stock\s*status/.test(normalizedText)) return 'inventory-status';

  // 재고 알림
  if (/재고\s*알림|부족\s*알림|low\s*stock/.test(normalizedText)) return 'stock-alerts';

  // 판매 순위
  if (/판매\s*순위|인기\s*상품|베스트/.test(normalizedText)) return 'sales-ranking';

  return null;
}

// 모달 ID 추출 함수
function extractModalId(text: string): string | null {
  const normalizedText = text.toLowerCase();

  if (/목표.*설정|설정.*목표|goal.*setting/.test(normalizedText)) return 'goal-settings';
  if (/날짜.*선택|기간.*선택|date.*pick/.test(normalizedText)) return 'date-picker';
  if (/내보내기|export/.test(normalizedText)) return 'export-data';
  if (/시뮬레이션.*설정|설정.*시뮬레이션/.test(normalizedText)) return 'simulation-config';
  if (/최적화.*설정|설정.*최적화/.test(normalizedText)) return 'optimization-config';
  if (/연결.*추가|새.*연결|데이터.*연결|소스.*추가|커넥터.*추가/.test(normalizedText)) return 'new-connection';
  if (/사용자.*초대|팀원.*초대|invite/.test(normalizedText)) return 'invite-user';
  if (/플랜.*업그레이드|요금제.*변경/.test(normalizedText)) return 'plan-upgrade';

  return null;
}

export const INTENT_PATTERNS: IntentPattern[] = [
  // query_kpi — KPI 데이터 조회 (최우선 매칭 - 데이터 요청이 날짜 설정보다 우선)
  {
    intent: 'query_kpi',
    patterns: [
      // 매출 관련
      /(?:오늘|어제|이번\s*주|이번\s*달|최근)?\s*(?:매출|revenue|수익|매상)\s*(?:얼마|어때|어떻게|알려|보여)/i,
      /(?:매출|revenue).*(?:알려|보여|어때|얼마|확인)/i,

      // 방문객 관련
      /(?:오늘|어제)?\s*(?:방문객|visitor|고객|트래픽|방문자)\s*(?:수|몇|얼마|어때|명)/i,
      /(?:순\s*방문객|unique\s*visitor)\s*(?:수|몇|얼마|어때)/i,

      // 전환율 관련
      /(?:전환율|conversion|전환)\s*(?:어때|어떻게|알려|몇|%)/i,

      // 객단가 관련
      /(?:평균\s*객단가|객단가|거래\s*금액|객단)\s*(?:얼마|어때)/i,

      // 성과/현황 관련
      /(?:오늘|어제|최근)?\s*(?:성과|실적|현황|상태)\s*(?:어때|알려|보여)/i,

      // 상품/판매량/재고 관련
      /(?:상품|판매량|판매\s*수량?|총\s*판매)\s*(?:얼마|몇|어때|알려|보여)/i,
      /(?:재고|inventory|stock)\s*(?:현황|상태|어때|알려|보여)/i,

      // 목표 달성률 (조건부 응답)
      /(?:목표\s*달성률|목표\s*달성|goal)\s*(?:어때|몇|얼마|%)/i,

      // 체류 시간
      /(?:체류\s*시간|체류시간|머문\s*시간)\s*(?:어때|몇|얼마)/i,

      // 신규/재방문
      /(?:신규|재방문|신규\s*고객|재방문\s*고객)\s*(?:어때|몇|비율)/i,

      // 복합 질문
      /(?:매출|방문객|전환율|객단가).*(?:알려|보여|어때|얼마)/i,

      // 커스텀 날짜 범위 + KPI (다양한 형식) - 데이터 키워드 필수
      /(?:\d{2,4}년\s*)?(\d{1,2})월\s*(\d{1,2})일?\s*[-~부터]\s*(\d{1,2})일?(?:까지)?.*(?:매출|방문객|전환율|현황|데이터|상품|판매량|재고)/i,
      /(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})[\/\-.]?(\d{1,2})?.*(?:매출|방문객|전환율|현황|데이터|상품|판매량|재고)/i,

      // 자연어 날짜 + KPI
      /(?:지난\s*주|이번\s*주|저번\s*주)\s*(?:의)?\s*(?:매출|방문객|전환율|현황)/i,
      /(?:이번\s*달|지난\s*달)\s*(?:의)?\s*(?:매출|방문객|전환율|현황)/i,
      /(?:\d{1,2})월\s*(?:첫째|둘째|셋째|넷째|마지막)\s*주\s*(?:의)?\s*(?:매출|방문객|전환율)/i,
      /(?:\d{1,2})월\s*(?:초|중순|말)\s*(?:의)?\s*(?:매출|방문객|전환율|현황)/i,

      // 비교 질문
      /(?:전주|전월|지난달|작년)\s*대비\s*(?:매출|방문객|전환율)/i,

      // 데이터 컨트롤타워 관련 쿼리
      /(?:데이터\s*)?(?:품질|quality)\s*(?:점수|스코어|score|몇\s*점|어때|확인|알려)/i,
      /(?:연결된|현재)\s*(?:데이터\s*)?(?:소스|연결|connection)\s*(?:뭐|몇|어때|알려|확인|보여|있어)/i,
      /(?:비즈니스\s*)?(?:소스|데이터\s*소스)\s*(?:뭐|어떤|확인|알려|보여|있어|연결)/i,
      /(?:컨텍스트|context)\s*(?:데이터\s*)?(?:소스|연결)\s*(?:뭐|어때|알려|확인|보여|있어)/i,
      /(?:파이프라인|pipeline|ETL)\s*(?:상태|현황|어때|알려|확인)/i,
      /(?:데이터\s*)?(?:수집|동기화|싱크)\s*(?:상태|현황|어때|알려|확인)/i,
    ],
    confidence: 0.90,
    extractors: {
      queryType: (_match, text) => extractQueryType(text),
      period: (_match, text) => extractPeriod(text),
    },
  },

  // navigate — 페이지 이동
  {
    intent: 'navigate',
    patterns: [
      // 기존 패턴
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|데이터\s*컨트롤|컨트롤타워).*(?:로|으로|에)?\s*(?:가|이동|열|보여|가줘|이동해|열어|보여줘)/i,
      /(?:가|이동|열|보여)\s*(?:줘|해)?\s*(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings)/i,
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|컨트롤타워)\s*(?:페이지|화면)?\s*(?:열어|보여|가)/i,
      // 추가 패턴
      /(?:인사이트|스튜디오|ROI|설정|컨트롤타워)\s*(?:로|에)\s*(?:가고\s*싶어|가볼래|이동하고\s*싶어)/i,
      /(?:인사이트|스튜디오|ROI|설정)\s*(?:허브|분석|측정)?\s*(?:좀|한번)?\s*(?:열어|보여)/i,
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
      // 기존 패턴
      /(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요|overview)\s*(?:탭|tab)?(?:을|를)?\s*(?:보여|열|선택|클릭|눌러)/i,
      /(?:보여|열어|선택|클릭)\s*(?:줘|해)?\s*(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요)\s*(?:탭|tab)?/i,
      /(?:고객|매장|상품|재고|예측|AI추천|개요|시뮬레이션|최적화|레이어)\s*(?:탭|tab)\s*(?:으로|로)?\s*(?:이동|가|열어|보여)/i,
      // 추가 패턴 (자연어 variation)
      /(?:고객|매장|상품|재고|예측)\s*(?:분석|현황|데이터)?\s*(?:좀|한번)?\s*(?:볼래|보고\s*싶어|확인할래)/i,
      /(?:개요|overview|전체)\s*(?:화면|페이지|뷰)?\s*(?:로|으로)?\s*(?:가|돌아가|이동)/i,
    ],
    confidence: 0.90,
    extractors: {
      tab: (_match, text) => extractTab(text),
    },
  },

  // set_date_range — 날짜 필터 변경 (대폭 강화)
  {
    intent: 'set_date_range',
    patterns: [
      // 절대 날짜
      /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,  // 11/4~11/15
      /(\d{2,4})년\s*(\d{1,2})월/,  // 2025년 12월 또는 25년 12월

      // 상대 날짜 - 기본
      /(?:오늘|today)\s*(?:데이터|기간|날짜)?(?:로|으로)?/i,
      /(?:어제|yesterday)\s*(?:데이터|기간)?/i,
      /(?:그제|그저께)\s*(?:데이터|기간)?/i,

      // 상대 날짜 - 주 단위
      /(?:이번\s*주|this\s*week)\s*(?:데이터)?/i,
      /(?:지난\s*주|저번\s*주|last\s*week)\s*(?:데이터)?/i,

      // 상대 날짜 - 월 단위
      /(?:이번\s*달|this\s*month)\s*(?:데이터)?/i,
      /(?:지난\s*달|저번\s*달|last\s*month)\s*(?:데이터)?/i,

      // 상대 기간
      /(?:7일|일주일|1주일)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /(?:30일|한달|1개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /(?:90일|3개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
      /(?:최근|지난)\s*(?:7일|일주일|30일|한달|90일|3개월|1년)/i,

      // 기간 설정
      /기간\s*(?:을|를)?\s*(?:변경|설정|바꿔)/i,

      // 자연어 기간 (새로 추가)
      /(\d{1,2})월\s*(?:첫째|둘째|셋째|넷째|마지막)\s*주/i,  // 12월 첫째주
      /(\d{1,2})월\s*(?:초|중순|말)/i,  // 12월 초, 12월 중순, 12월 말
      /(?:연말|연초)\s*(?:데이터)?/i,
      /(?:이번|올)\s*(?:분기|quarter)\s*(?:데이터)?/i,
    ],
    confidence: 0.90,
    extractors: {
      dateRange: (_match, text) => extractDateRange(text),
    },
  },

  // scroll_to_section — 특정 섹션으로 스크롤 (새로 추가)
  {
    intent: 'scroll_to_section',
    patterns: [
      /(?:kpi|지표)\s*(?:카드|섹션)?\s*(?:보여|보기|확인)/i,
      /(?:트렌드|추이)\s*(?:차트|그래프)\s*(?:보여|보기|확인)/i,
      /(?:히트맵|열지도)\s*(?:보여|보기|확인)/i,
      /(?:동선|이동\s*경로)\s*(?:분석)?\s*(?:보여|보기|확인)/i,
      /(?:세그먼트|고객\s*분류)\s*(?:보여|보기|확인)/i,
      /(?:판매\s*순위|인기\s*상품)\s*(?:보여|보기|확인)/i,
    ],
    confidence: 0.85,
    extractors: {
      section: (_match, text) => extractSection(text),
    },
  },

  // open_modal — 모달/다이얼로그 열기 (새로 추가)
  {
    intent: 'open_modal',
    patterns: [
      /목표\s*(?:를)?\s*(?:설정|지정)\s*(?:하고\s*싶어|할래|해줘)/i,
      /(?:새|신규)\s*(?:데이터)?\s*(?:연결|소스|커넥터)\s*(?:추가|생성)/i,
      /(?:소스|커넥터|연결)\s*(?:를)?\s*(?:추가|생성)\s*(?:하고\s*싶어|할래|해줘)?/i,
      /(?:사용자|팀원)\s*(?:를)?\s*초대/i,
      /데이터\s*(?:를)?\s*(?:내보내기|export)/i,
      /(?:플랜|요금제)\s*(?:를)?\s*(?:업그레이드|변경)/i,
      /시뮬레이션\s*(?:설정|config)/i,
      /최적화\s*(?:설정|config)/i,
    ],
    confidence: 0.85,
    extractors: {
      modalId: (_match, text) => extractModalId(text),
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

// 쿼리 타입 추출 함수 (대폭 강화)
function extractQueryType(text: string): string {
  const normalizedText = text.toLowerCase();

  // 매출 관련
  if (/매출|revenue|수익|매상/.test(normalizedText)) return 'revenue';

  // 방문객 관련
  if (/순\s*방문객|unique.*visitor/.test(normalizedText)) return 'visitors';
  if (/방문객|visitor|고객\s*수|트래픽|방문자/.test(normalizedText)) return 'visitors';

  // 전환율 관련
  if (/전환율|conversion|전환/.test(normalizedText)) return 'conversion';

  // 객단가 관련
  if (/객단가|거래\s*금액|평균\s*금액|객단/.test(normalizedText)) return 'avgTransaction';

  // 상품/판매량 관련
  if (/상품|판매량|판매\s*수|product|sales|총\s*판매/.test(normalizedText)) return 'product';

  // 재고 관련
  if (/재고|inventory|stock/.test(normalizedText)) return 'inventory';

  // 목표 달성률
  if (/목표.*달성|goal.*achieve|달성률/.test(normalizedText)) return 'goal';

  // 체류 시간
  if (/체류.*시간|dwell.*time|머문.*시간/.test(normalizedText)) return 'dwellTime';

  // 신규/재방문
  if (/신규.*재방문|new.*returning/.test(normalizedText)) return 'newVsReturning';

  // 데이터 품질 관련
  if (/품질|quality|품질\s*점수|quality\s*score/.test(normalizedText)) return 'dataQuality';

  // 데이터 소스/연결 관련
  if (/(?:연결된|현재).*(?:소스|연결)|비즈니스\s*소스|데이터\s*소스/.test(normalizedText)) return 'dataSources';

  // 컨텍스트 데이터 소스
  if (/컨텍스트.*(?:소스|연결|데이터)|context.*(?:source|data)/.test(normalizedText)) return 'dataSources';

  // 파이프라인/ETL/동기화
  if (/파이프라인|pipeline|etl|수집.*(?:상태|현황)|동기화.*(?:상태|현황)/.test(normalizedText)) return 'pipelineStatus';

  // 성과/실적/현황/요약
  if (/성과|실적|현황|요약/.test(normalizedText)) return 'summary';

  return 'summary'; // 기본값
}

// 기간 추출 함수 (대폭 강화)
function extractPeriod(text: string): { type: string; startDate?: string; endDate?: string } {
  const normalizedText = text.toLowerCase();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // 연도 추출: "25년", "2025년" 형식
  let year = currentYear;
  const yearMatch = text.match(/(\d{2,4})년/);
  if (yearMatch) {
    const parsedYear = parseInt(yearMatch[1], 10);
    year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
  }

  // =====================
  // 커스텀 날짜 범위
  // =====================

  // "12월 1일부터 10일까지" 또는 "12월 1-10일"
  const koreanRangeMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?\s*(?:부터|[-~])\s*(\d{1,2})일?(?:까지)?/);
  if (koreanRangeMatch) {
    const month = parseInt(koreanRangeMatch[1], 10);
    const startDay = parseInt(koreanRangeMatch[2], 10);
    const endDay = parseInt(koreanRangeMatch[3], 10);

    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
  }

  // "12/1-12/15" 또는 "12/1~15"
  const slashDateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})?[\/\-.]?(\d{1,2})?/);
  if (slashDateMatch) {
    const startMonth = parseInt(slashDateMatch[1], 10);
    const startDay = parseInt(slashDateMatch[2], 10);
    let endMonth = startMonth;
    let endDay = startDay;

    if (slashDateMatch[3] && slashDateMatch[4]) {
      endMonth = parseInt(slashDateMatch[3], 10);
      endDay = parseInt(slashDateMatch[4], 10);
    } else if (slashDateMatch[3]) {
      endDay = parseInt(slashDateMatch[3], 10);
    }

    const startDate = `${year}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
  }

  // =====================
  // 자연어 기간 (새로 추가)
  // =====================

  // "12월 첫째주", "12월 둘째주" 등
  const weekOfMonthMatch = text.match(/(\d{1,2})월\s*(첫째|둘째|셋째|넷째|마지막)\s*주/);
  if (weekOfMonthMatch) {
    const month = parseInt(weekOfMonthMatch[1], 10);
    const weekNum = { '첫째': 1, '둘째': 2, '셋째': 3, '넷째': 4, '마지막': 5 }[weekOfMonthMatch[2]] || 1;

    const firstDay = new Date(year, month - 1, 1);
    const startDay = 1 + (weekNum - 1) * 7;
    const endDay = Math.min(startDay + 6, new Date(year, month, 0).getDate());

    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
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

    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    return { type: 'custom', startDate, endDate };
  }

  // "연말" (12월)
  if (/연말/.test(normalizedText)) {
    return {
      type: 'custom',
      startDate: `${year}-12-01`,
      endDate: `${year}-12-31`,
    };
  }

  // "연초" (1월)
  if (/연초/.test(normalizedText)) {
    return {
      type: 'custom',
      startDate: `${year}-01-01`,
      endDate: `${year}-01-31`,
    };
  }

  // =====================
  // 상대 날짜
  // =====================

  if (/오늘|today/.test(normalizedText)) {
    return { type: 'today' };
  }

  if (/어제|yesterday/.test(normalizedText)) {
    return { type: 'yesterday' };
  }

  if (/그제|그저께/.test(normalizedText)) {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    return {
      type: 'custom',
      startDate: formatDate(twoDaysAgo),
      endDate: formatDate(twoDaysAgo),
    };
  }

  if (/이번\s*주|this\s*week/.test(normalizedText)) {
    return { type: 'thisWeek' };
  }

  if (/지난\s*주|저번\s*주|last\s*week/.test(normalizedText)) {
    return { type: 'lastWeek' };
  }

  if (/이번\s*달|this\s*month/.test(normalizedText)) {
    return { type: 'thisMonth' };
  }

  if (/지난\s*달|저번\s*달|last\s*month/.test(normalizedText)) {
    return { type: 'lastMonth' };
  }

  if (/이번\s*분기|this\s*quarter/.test(normalizedText)) {
    return { type: 'thisQuarter' };
  }

  // =====================
  // 상대 기간 (최근 X일)
  // =====================

  if (/최근\s*7일|지난\s*7일|최근\s*일주일|지난\s*일주일/.test(normalizedText)) {
    return { type: '7d' };
  }

  if (/최근\s*30일|지난\s*30일|최근\s*한달|지난\s*한달/.test(normalizedText)) {
    return { type: '30d' };
  }

  if (/최근\s*90일|지난\s*90일|최근\s*3개월|지난\s*3개월/.test(normalizedText)) {
    return { type: '90d' };
  }

  if (/최근\s*1년|지난\s*1년|올해/.test(normalizedText)) {
    return { type: '365d' };
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

        // 섹션 추출 (새로 추가)
        if (pattern.extractors?.section) {
          const section = pattern.extractors.section(match, normalizedText);
          if (section) {
            entities.section = section;
          }
        }

        // 모달 ID 추출 (새로 추가)
        if (pattern.extractors?.modalId) {
          const modalId = pattern.extractors.modalId(match, normalizedText);
          if (modalId) {
            entities.modalId = modalId;
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
