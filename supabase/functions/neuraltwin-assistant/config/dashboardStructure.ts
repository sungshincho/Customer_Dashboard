/**
 * 대시보드 구조 정의
 * - 페이지-탭-섹션 계층 구조
 * - 용어-위치 매핑
 * - 모달/팝업 정의
 *
 * 인텐트 강화를 위한 핵심 컨텍스트 제공
 */

// ============================================
// 1. 페이지-탭-섹션 계층 구조
// ============================================

export interface DashboardComponent {
  id: string;
  name: string;
  aliases: string[];
  requires?: string;  // 필요한 설정/데이터
  fallbackAction?: string;  // 조건 미충족 시 액션
}

export interface DashboardSection {
  id: string;
  name: string;
  components?: DashboardComponent[];
}

export interface DashboardTab {
  id: string;
  name: string;
  aliases: string[];
  sections?: DashboardSection[];
}

export interface DashboardPage {
  path: string;
  name: string;
  aliases: string[];
  tabs?: DashboardTab[];
  sections?: DashboardSection[];
}

export const DASHBOARD_STRUCTURE: DashboardPage[] = [
  {
    path: '/data/control-tower',
    name: '데이터 컨트롤타워',
    aliases: ['컨트롤타워', '데이터 컨트롤', 'data control tower', '데이터컨트롤타워'],
    sections: [
      {
        id: 'data-sources',
        name: '데이터 소스',
        components: [
          { id: 'connection-list', name: '연결 목록', aliases: ['데이터 연결', '소스 목록'] },
          { id: 'add-connection', name: '새 연결 추가', aliases: ['연결 추가', '소스 추가'] },
        ],
      },
    ],
  },
  {
    path: '/insights',
    name: '인사이트 허브',
    aliases: ['인사이트', 'insight', 'insights', '인사이트허브'],
    tabs: [
      {
        id: 'overview',
        name: '개요',
        aliases: ['개요탭', 'overview', '오버뷰', '전체'],
        sections: [
          {
            id: 'kpi-cards',
            name: 'KPI 카드 섹션',
            components: [
              { id: 'total-revenue', name: '총 매출', aliases: ['매출', 'revenue', '수익', '매상'] },
              { id: 'unique-visitors', name: '순 방문객', aliases: ['방문객', 'visitors', '고객수', '방문자'] },
              { id: 'conversion-rate', name: '전환율', aliases: ['conversion', '구매전환', '전환'] },
              { id: 'avg-transaction', name: '평균 객단가', aliases: ['객단가', '거래금액', '객단'] },
            ],
          },
          {
            id: 'goal-achievement',
            name: '목표 달성률 섹션',
            components: [
              {
                id: 'goal-card',
                name: '목표 달성률 카드',
                aliases: ['목표 달성', '목표', 'goal', '달성률'],
                requires: 'goal_settings',
                fallbackAction: 'open_goal_settings_modal',
              },
            ],
          },
          {
            id: 'trend-chart',
            name: '트렌드 차트 섹션',
            components: [
              { id: 'revenue-trend', name: '매출 추이', aliases: ['매출 트렌드', '매출 그래프'] },
              { id: 'visitor-trend', name: '방문객 추이', aliases: ['방문객 트렌드', '방문객 그래프'] },
            ],
          },
          {
            id: 'daily-summary',
            name: '일별 요약 테이블',
          },
        ],
      },
      {
        id: 'store',
        name: '매장',
        aliases: ['매장탭', 'store', '스토어', '매장분석'],
        sections: [
          { id: 'store-performance', name: '매장 성과' },
          { id: 'zone-heatmap', name: '구역별 히트맵', components: [
            { id: 'heatmap', name: '히트맵', aliases: ['열지도', '구역 분석'] },
          ]},
          { id: 'traffic-flow', name: '동선 분석', components: [
            { id: 'flow-chart', name: '동선 차트', aliases: ['이동 경로', '고객 동선'] },
          ]},
        ],
      },
      {
        id: 'customer',
        name: '고객',
        aliases: ['고객탭', 'customer', '고객분석', '고객 분석'],
        sections: [
          {
            id: 'customer-kpi',
            name: '고객 KPI',
            components: [
              { id: 'unique-visitors', name: '순 방문객', aliases: ['방문객', 'visitors', '방문자 수'] },
              { id: 'new-vs-returning', name: '신규/재방문', aliases: ['신규 고객', '재방문 고객', '재방문율'] },
              { id: 'dwell-time', name: '체류 시간', aliases: ['체류시간', '머문시간', '방문 시간'] },
            ],
          },
          { id: 'customer-segments', name: '고객 세그먼트', components: [
            { id: 'segment-chart', name: '세그먼트 차트', aliases: ['고객 분류', '세그먼트 분석'] },
          ]},
          { id: 'behavior-analysis', name: '행동 분석' },
        ],
      },
      {
        id: 'product',
        name: '상품',
        aliases: ['상품탭', 'product', '상품분석', '상품 분석'],
        sections: [
          { id: 'product-performance', name: '상품 성과', components: [
            { id: 'sales-summary', name: '판매 요약', aliases: ['판매량', '판매 현황'] },
          ]},
          { id: 'category-analysis', name: '카테고리 분석' },
          { id: 'sales-ranking', name: '판매 순위', components: [
            { id: 'top-products', name: '인기 상품', aliases: ['베스트 상품', '인기 순위'] },
          ]},
        ],
      },
      {
        id: 'inventory',
        name: '재고',
        aliases: ['재고탭', 'inventory', '재고관리', '재고 관리'],
        sections: [
          { id: 'inventory-status', name: '재고 현황', components: [
            { id: 'stock-overview', name: '재고 개요', aliases: ['재고 수량', '현재 재고'] },
          ]},
          { id: 'stock-alerts', name: '재고 알림', components: [
            { id: 'low-stock', name: '재고 부족 알림', aliases: ['부족 알림', '재주문 필요'] },
          ]},
          { id: 'reorder-suggestions', name: '발주 제안' },
        ],
      },
      {
        id: 'prediction',
        name: '예측',
        aliases: ['예측탭', 'prediction', '예측분석', '예측 분석'],
        sections: [
          { id: 'demand-forecast', name: '수요 예측' },
          { id: 'trend-prediction', name: '트렌드 예측' },
        ],
      },
      {
        id: 'ai-recommendation',
        name: 'AI추천',
        aliases: ['AI추천탭', 'ai-recommendation', 'AI 추천', '추천', 'ai추천'],
        sections: [
          { id: 'action-recommendations', name: '액션 추천' },
          { id: 'optimization-suggestions', name: '최적화 제안' },
        ],
      },
    ],
  },
  {
    path: '/studio',
    name: '디지털트윈 스튜디오',
    aliases: ['스튜디오', 'studio', '디지털트윈', '디지털 트윈'],
    tabs: [
      {
        id: 'layer',
        name: '레이어',
        aliases: ['레이어탭', 'layer', '3D 레이어'],
      },
      {
        id: 'ai-simulation',
        name: 'AI 시뮬레이션',
        aliases: ['시뮬레이션탭', 'simulation', '시뮬레이션', 'ai 시뮬레이션'],
      },
      {
        id: 'ai-optimization',
        name: 'AI 최적화',
        aliases: ['최적화탭', 'optimization', '최적화', 'ai 최적화'],
      },
      {
        id: 'apply',
        name: '적용',
        aliases: ['적용탭', 'apply'],
      },
    ],
  },
  {
    path: '/roi',
    name: 'ROI 측정',
    aliases: ['ROI', 'roi', '알오아이', 'ROI측정'],
    sections: [
      { id: 'strategy-performance', name: '전략 성과' },
      { id: 'roi-analysis', name: 'ROI 분석' },
    ],
  },
  {
    path: '/settings',
    name: '설정 & 관리',
    aliases: ['설정', 'settings', '세팅', '관리'],
    tabs: [
      {
        id: 'store-management',
        name: '매장 관리',
        aliases: ['매장관리', '매장설정', 'stores'],
      },
      {
        id: 'data',
        name: '데이터',
        aliases: ['데이터탭', '데이터설정'],
      },
      {
        id: 'users',
        name: '사용자',
        aliases: ['사용자탭', '사용자관리', '팀원'],
      },
      {
        id: 'system',
        name: '시스템',
        aliases: ['시스템탭', '시스템설정'],
      },
      {
        id: 'plan',
        name: '플랜',
        aliases: ['플랜탭', '구독', '요금제', 'license'],
      },
    ],
  },
];

// ============================================
// 2. 용어-위치 매핑 (중의성 해소)
// ============================================

export interface TermLocation {
  page: string;
  tab?: string;
  section?: string;
  component?: string;
}

export interface TermLocationEntry {
  primary: TermLocation;
  secondary?: TermLocation[];
  description?: Record<string, string>;
  requires?: string;
  fallback?: {
    message: string;
    action: {
      type: string;
      modalId?: string;
      buttonText?: string;
    };
  };
}

export const TERM_LOCATION_MAP: Record<string, TermLocationEntry> = {
  '순 방문객': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi', component: 'unique-visitors' },
    secondary: [
      { page: '/insights', tab: 'overview', section: 'kpi-cards', component: 'unique-visitors' },
    ],
    description: {
      customer: '고객 세그먼트별 상세 분석',
      overview: '전체 트래픽 요약',
    },
  },
  '방문객': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi', component: 'unique-visitors' },
    secondary: [
      { page: '/insights', tab: 'overview', section: 'kpi-cards', component: 'unique-visitors' },
    ],
  },
  '매출': {
    primary: { page: '/insights', tab: 'overview', section: 'kpi-cards', component: 'total-revenue' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-performance' },
      { page: '/roi', section: 'strategy-performance' },
    ],
  },
  '전환율': {
    primary: { page: '/insights', tab: 'overview', section: 'kpi-cards', component: 'conversion-rate' },
    secondary: [
      { page: '/insights', tab: 'customer', section: 'customer-kpi' },
    ],
  },
  '객단가': {
    primary: { page: '/insights', tab: 'overview', section: 'kpi-cards', component: 'avg-transaction' },
  },
  '재고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-status' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-performance' },
    ],
  },
  '재고 현황': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-status' },
  },
  '재고 알림': {
    primary: { page: '/insights', tab: 'inventory', section: 'stock-alerts' },
  },
  '목표 달성률': {
    primary: { page: '/insights', tab: 'overview', section: 'goal-achievement', component: 'goal-card' },
    requires: 'goal_settings',
    fallback: {
      message: '현재 설정된 목표가 없습니다. 목표 설정을 진행해주세요.',
      action: {
        type: 'open_modal',
        modalId: 'goal-settings',
        buttonText: '목표 설정하러 가기',
      },
    },
  },
  '목표': {
    primary: { page: '/insights', tab: 'overview', section: 'goal-achievement', component: 'goal-card' },
    requires: 'goal_settings',
  },
  '체류 시간': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi', component: 'dwell-time' },
    secondary: [
      { page: '/insights', tab: 'store', section: 'zone-heatmap' },
    ],
  },
  '히트맵': {
    primary: { page: '/insights', tab: 'store', section: 'zone-heatmap' },
  },
  '동선': {
    primary: { page: '/insights', tab: 'store', section: 'traffic-flow' },
  },
  '상품': {
    primary: { page: '/insights', tab: 'product', section: 'product-performance' },
  },
  '판매량': {
    primary: { page: '/insights', tab: 'product', section: 'product-performance' },
  },
  '판매 순위': {
    primary: { page: '/insights', tab: 'product', section: 'sales-ranking' },
  },
  '시뮬레이션': {
    primary: { page: '/studio', tab: 'ai-simulation' },
  },
  '최적화': {
    primary: { page: '/studio', tab: 'ai-optimization' },
  },
  'ROI': {
    primary: { page: '/roi', section: 'roi-analysis' },
  },
  '수요 예측': {
    primary: { page: '/insights', tab: 'prediction', section: 'demand-forecast' },
  },
  '트렌드 예측': {
    primary: { page: '/insights', tab: 'prediction', section: 'trend-prediction' },
  },
};

// ============================================
// 3. 모달/팝업 ID 정의
// ============================================

export interface ModalDefinition {
  page: string | '*';  // '*'는 모든 페이지
  tab?: string;
  section?: string;
  description: string;
}

export const MODAL_MAP: Record<string, ModalDefinition> = {
  'goal-settings': {
    page: '/insights',
    tab: 'overview',
    section: 'goal-achievement',
    description: '목표 설정 모달',
  },
  'date-picker': {
    page: '*',
    description: '날짜 범위 선택 모달',
  },
  'export-data': {
    page: '/insights',
    description: '데이터 내보내기 모달',
  },
  'simulation-config': {
    page: '/studio',
    tab: 'ai-simulation',
    description: '시뮬레이션 설정 모달',
  },
  'optimization-config': {
    page: '/studio',
    tab: 'ai-optimization',
    description: '최적화 설정 모달',
  },
  'new-connection': {
    page: '/data/control-tower',
    description: '새 데이터 연결 추가 모달',
  },
  'invite-user': {
    page: '/settings',
    tab: 'users',
    description: '사용자 초대 모달',
  },
  'plan-upgrade': {
    page: '/settings',
    tab: 'plan',
    description: '플랜 업그레이드 모달',
  },
};

// ============================================
// 4. 자연어 표현 Variation 사전
// ============================================

export const ACTION_EXPRESSIONS = {
  show: [
    '보여', '보여줘', '보여주세요', '보여줄래', '보여줄 수 있어',
    '알려', '알려줘', '알려주세요', '알려줄래',
    '확인', '확인해줘', '확인하고 싶어', '확인할래',
    '어때', '어떻게 돼', '어떻게 되어 있어',
    '뭐야', '뭔지', '뭔가',
  ],
  navigate: [
    '가', '가줘', '가고 싶어', '가볼래',
    '이동', '이동해', '이동해줘', '이동하고 싶어',
    '열어', '열어줘', '열어볼래',
  ],
  set: [
    '설정', '설정해', '설정해줘',
    '바꿔', '바꿔줘', '변경해', '변경해줘',
    '적용', '적용해', '적용해줘',
  ],
  execute: [
    '돌려', '돌려줘', '실행', '실행해', '실행해줘',
    '시작', '시작해', '시작해줘',
    '진행', '진행해', '진행해줘',
    '해봐', '해줘',
  ],
};

export const QUESTION_EXPRESSIONS = {
  status: [
    '얼마', '얼마야', '얼마지', '얼마인가',
    '몇', '몇이야', '몇이지', '몇인가',
    '어때', '어떻게 돼', '어떤 상태',
    '있어', '있나', '있는지',
  ],
  comparison: [
    '대비', '대비 어때', '비교', '비교해서',
    '차이', '차이가 뭐야', '뭐가 달라',
    '늘었어', '줄었어', '변화', '변화가 있어',
  ],
  recommendation: [
    '추천', '추천해줘', '뭐가 좋을까',
    '어떻게 하면 좋을까', '제안', '제안해줘',
  ],
};

// ============================================
// 5. 유틸리티 함수
// ============================================

/**
 * 용어에서 위치 정보 찾기
 */
export function findTermLocation(
  term: string,
  currentPage?: string,
  currentTab?: string
): TermLocationEntry | null {
  // 정확한 매칭 먼저
  if (TERM_LOCATION_MAP[term]) {
    return TERM_LOCATION_MAP[term];
  }

  // 부분 매칭
  for (const [key, value] of Object.entries(TERM_LOCATION_MAP)) {
    if (term.includes(key) || key.includes(term)) {
      return value;
    }
  }

  return null;
}

/**
 * 현재 위치 기반 최적 타겟 결정
 */
export function resolveTargetLocation(
  entry: TermLocationEntry,
  currentPage?: string,
  currentTab?: string
): TermLocation {
  // 현재 페이지에 해당 데이터가 있으면 현재 위치 유지
  if (currentPage === entry.primary.page) {
    if (!entry.primary.tab || currentTab === entry.primary.tab) {
      return entry.primary;
    }
  }

  // secondary 위치 중 현재 위치와 일치하는 것 찾기
  if (entry.secondary) {
    for (const loc of entry.secondary) {
      if (currentPage === loc.page && (!loc.tab || currentTab === loc.tab)) {
        return loc;
      }
    }
  }

  // 기본값: primary 위치
  return entry.primary;
}

/**
 * 페이지 경로에서 페이지 정보 찾기
 */
export function findPageByPath(path: string): DashboardPage | undefined {
  return DASHBOARD_STRUCTURE.find(p => p.path === path);
}

/**
 * 탭 ID로 탭 정보 찾기
 */
export function findTabById(pagePath: string, tabId: string): DashboardTab | undefined {
  const page = findPageByPath(pagePath);
  return page?.tabs?.find(t => t.id === tabId);
}

/**
 * 섹션 ID로 섹션 정보 찾기
 */
export function findSectionById(
  pagePath: string,
  tabId: string | undefined,
  sectionId: string
): DashboardSection | undefined {
  const page = findPageByPath(pagePath);

  if (tabId) {
    const tab = page?.tabs?.find(t => t.id === tabId);
    return tab?.sections?.find(s => s.id === sectionId);
  }

  return page?.sections?.find(s => s.id === sectionId);
}
