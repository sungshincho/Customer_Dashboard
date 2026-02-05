/**
 * 네비게이션 관련 액션 처리
 * Phase 2-A: navigate 액션만 구현
 * Phase 2-B: set_tab, set_date_range 추가 예정
 */

import { ClassificationResult } from '../intent/classifier.ts';

export interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export interface ActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
}

// 페이지 한글명 매핑
const PAGE_NAMES: Record<string, string> = {
  '/insights': '인사이트 허브',
  '/studio': '디지털트윈 스튜디오',
  '/roi': 'ROI 측정',
  '/settings': '설정',
  '/data/control-tower': '데이터 컨트롤타워',
};

/**
 * navigate 인텐트 처리
 */
export function handleNavigate(
  classification: ClassificationResult
): ActionResult {
  const targetPage = classification.entities.page;

  if (!targetPage) {
    return {
      actions: [],
      message: '어느 페이지로 이동할까요? 인사이트 허브, 스튜디오, ROI 측정, 설정 중에서 선택해주세요.',
      suggestions: [
        '인사이트 허브로 이동',
        '스튜디오 열어줘',
        'ROI 측정 페이지 보여줘',
      ],
    };
  }

  const pageName = PAGE_NAMES[targetPage] || targetPage;

  return {
    actions: [
      {
        type: 'navigate',
        target: targetPage,
      },
    ],
    message: `${pageName} 페이지로 이동합니다.`,
    suggestions: getSuggestionsForPage(targetPage),
  };
}

/**
 * 페이지별 후속 제안
 */
function getSuggestionsForPage(page: string): string[] {
  switch (page) {
    case '/insights':
      return [
        '고객탭 보여줘',
        '오늘 매출 얼마야?',
        '최근 7일 데이터로 변경해줘',
      ];
    case '/studio':
      return [
        'AI 시뮬레이션 탭 열어줘',
        '시뮬레이션 돌려줘',
        '최적화 해줘',
      ];
    case '/roi':
      return [
        '90일 기간으로 변경해줘',
        '적용된 전략 보여줘',
      ];
    case '/settings':
      return [
        '매장 관리 탭 열어줘',
        '데이터 연결 추가해줘',
      ];
    case '/data/control-tower':
      return [
        '새 연결 추가해줘',
        '데이터 품질 확인해줘',
      ];
    default:
      return [];
  }
}

/**
 * 액션 디스패처 (Phase 2-B에서 확장)
 */
export function dispatchNavigationAction(
  classification: ClassificationResult
): ActionResult {
  switch (classification.intent) {
    case 'navigate':
      return handleNavigate(classification);

    // Phase 2-B에서 추가
    // case 'set_tab':
    // case 'set_date_range':

    default:
      return {
        actions: [],
        message: '',
        suggestions: [],
      };
  }
}
