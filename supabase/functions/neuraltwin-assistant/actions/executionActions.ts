/**
 * 시뮬레이션/최적화 실행 처리 (Phase 3-C)
 *
 * neuraltwin-assistant는 명령서만 발행:
 *   1. 스튜디오 페이지로 네비게이션
 *   2. run_simulation / run_optimization 액션 반환
 *
 * 실제 실행은 프론트엔드가 별도 EF(run-simulation, generate-optimization)를 호출
 */

import { ClassificationResult } from '../intent/classifier.ts';
import { UIAction } from './navigationActions.ts';

export interface ExecutionActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
}

/**
 * run_simulation 인텐트 처리
 * → 스튜디오 이동 + 시뮬레이션 실행 이벤트 발행
 */
export function handleRunSimulation(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const scenario = classification.entities.scenario || null;
  const simulationType = classification.entities.simulationType || 'traffic_flow';

  const actions: UIAction[] = [];

  // 1. 스튜디오 페이지가 아니면 이동
  const currentPage = context?.page?.current || '';
  if (!currentPage.includes('/studio')) {
    actions.push({
      type: 'navigate',
      target: '/studio?tab=ai-simulation',
    });
  }

  // 2. 시뮬레이션 실행 액션
  actions.push({
    type: 'run_simulation',
    params: {
      simulation_type: simulationType,
      scenario: scenario,
    },
  } as UIAction);

  // 응답 메시지 구성
  let message = '시뮬레이션을 실행합니다.';
  if (scenario) {
    const scenarioNames: Record<string, string> = {
      christmas: '크리스마스',
      black_friday: '블랙프라이데이',
      year_end: '연말',
      chuseok: '추석',
      new_year: '설날',
      weekend: '주말',
      weekday: '평일',
    };
    const scenarioName = scenarioNames[scenario] || scenario;
    message = `${scenarioName} 시나리오로 시뮬레이션을 실행합니다.`;
  }

  if (!currentPage.includes('/studio')) {
    message += '\n\n디지털트윈 스튜디오의 AI 시뮬레이션 탭으로 이동합니다.';
  }

  return {
    actions,
    message,
    suggestions: ['최적화 해줘', '시뮬레이션 결과 보여줘', '인사이트 허브로 이동'],
  };
}

/**
 * run_optimization 인텐트 처리
 * → 스튜디오 이동 + 최적화 실행 이벤트 발행
 */
export function handleRunOptimization(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const optimizationType = classification.entities.optimizationType || 'layout';

  const actions: UIAction[] = [];

  // 1. 스튜디오 페이지가 아니면 이동
  const currentPage = context?.page?.current || '';
  if (!currentPage.includes('/studio')) {
    actions.push({
      type: 'navigate',
      target: '/studio?tab=ai-optimization',
    });
  }

  // 2. 최적화 실행 액션
  actions.push({
    type: 'run_optimization',
    params: {
      optimization_type: optimizationType,
    },
  } as UIAction);

  // 응답 메시지 구성
  const typeNames: Record<string, string> = {
    layout: '가구 배치',
    merchandising: '상품 진열',
    flow: '동선',
    staffing: '직원 배치',
    both: '통합',
  };
  const typeName = typeNames[optimizationType] || optimizationType;

  let message = `${typeName} 최적화를 실행합니다.`;
  if (!currentPage.includes('/studio')) {
    message += '\n\n디지털트윈 스튜디오의 AI 최적화 탭으로 이동합니다.';
  }

  return {
    actions,
    message,
    suggestions: ['시뮬레이션 돌려줘', '최적화 결과 보여줘', '인사이트 허브로 이동'],
  };
}
