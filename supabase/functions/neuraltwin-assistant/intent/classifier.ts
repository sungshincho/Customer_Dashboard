/**
 * AI-First 인텐트 분류기
 *
 * 분류 흐름:
 * 1. 캐시 확인 → 히트 시 바로 반환
 * 2. AI 분류 (Gemini) → 의미론적 인텐트 파악
 * 3. 엔티티 보강 → 패턴 기반 날짜/페이지 추출로 정교화
 * 4. 결과 캐싱
 */

import { callGemini, parseJsonResponse } from '../utils/geminiClient.ts';
import { INTENT_CLASSIFICATION_PROMPT, formatContext } from '../constants/systemPrompt.ts';
import { getCachedIntent, setCachedIntent, cleanupExpiredCache } from '../utils/intentCache.ts';
import { extractDateRange, extractHour } from './entityExtractor.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'ai' | 'cache' | 'fallback';
  reasoning?: string;
}

// AI 분류 결과 인터페이스
interface AIClassificationResponse {
  intent: string;
  confidence: number;
  reasoning?: string;
  entities?: {
    page?: string;
    tab?: string;
    sectionId?: string;
    modalId?: string;
    queryType?: string;
    period?: {
      type: string;
      startDate?: string;
      endDate?: string;
    };
    filter?: {
      status?: string;
      source?: string;
    };
    tablePage?: string | number;
    // 스튜디오 제어 엔티티
    scenario?: string;
    simulationType?: string;
    optimizationType?: string;
    overlay?: string;
    visible?: boolean;
    simCommand?: string;
    simSpeed?: number;
    simType?: string;
    customerCount?: number;
    duration?: number;
    optGoal?: string;
    optTypes?: string[];
    optIntensity?: string;
    viewMode?: string;
    panel?: string;
    sceneName?: string;
    weather?: string;
    timeOfDay?: string;
    holidayType?: string;
    preset?: string;
    // 세부 필터 엔티티
    itemFilter?: string[];   // 특정 항목 필터 (존 이름, 상품명 등)
    hour?: number;           // 특정 시간 (0-23)
  };
}

// 유효한 인텐트 목록
const VALID_INTENTS = [
  'query_kpi',
  'navigate',
  'set_tab',
  'scroll_to_section',
  'open_modal',
  'set_date_range',
  'composite_navigate',
  'run_simulation',
  'run_optimization',
  // 디지털트윈 스튜디오 제어 인텐트
  'toggle_overlay',
  'simulation_control',
  'apply_preset',
  'set_simulation_params',
  'set_optimization_config',
  'set_view_mode',
  'toggle_panel',
  'save_scene',
  'set_environment',
  'general_chat',
];

/**
 * AI-First 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  context?: {
    page?: { current?: string; tab?: string };
    dateRange?: { preset?: string; startDate?: string; endDate?: string };
  }
): Promise<ClassificationResult> {
  // 주기적 캐시 정리 (5% 확률)
  if (Math.random() < 0.05) {
    cleanupExpiredCache();
  }

  // 컨텍스트 탭 추출 (캐시 키에 포함하여 동일 메시지도 탭별 분류 구분)
  const currentTab = context?.page?.tab;

  // 1. 캐시 확인 (탭 컨텍스트 포함)
  const cached = getCachedIntent(message, currentTab);
  if (cached) {
    console.log('[classifier] Cache hit:', cached.intent);
    // 캐시된 결과도 visitors+hour → hourlyPattern 보정 적용
    if (cached.intent === 'query_kpi' && cached.entities.queryType === 'visitors' && cached.entities.hour !== undefined) {
      console.log('[classifier] Cache override: visitors + hour → hourlyPattern');
      cached.entities.queryType = 'hourlyPattern';
    }
    return {
      intent: cached.intent,
      confidence: cached.confidence,
      entities: cached.entities,
      method: 'cache',
    };
  }

  // 2. AI 분류
  console.log('[classifier] AI classification for:', message.substring(0, 50));

  try {
    // 프롬프트 생성
    const contextStr = formatContext(context);
    const prompt = INTENT_CLASSIFICATION_PROMPT
      .replace('{userMessage}', message)
      .replace('{context}', contextStr);

    // Gemini API 호출
    const response = await callGemini(
      [{ role: 'user', content: prompt }],
      { jsonMode: true, temperature: 0.1, maxTokens: 512 }
    );

    // 응답 파싱
    const parsed = parseJsonResponse<AIClassificationResponse>(response.content);

    if (parsed && parsed.intent && VALID_INTENTS.includes(parsed.intent)) {
      console.log('[classifier] AI result:', parsed.intent, 'confidence:', parsed.confidence);

      // 엔티티 변환 및 보강
      const entities = transformEntities(parsed.entities || {}, message);

      // 분류 보정: "visitors" + 특정 시간(hour)이 있으면 → "hourlyPattern"으로 재분류
      let finalIntent = parsed.intent;
      if (parsed.intent === 'query_kpi' && entities.queryType === 'visitors' && entities.hour !== undefined) {
        console.log('[classifier] Override: visitors + hour → hourlyPattern');
        entities.queryType = 'hourlyPattern';
        finalIntent = 'query_kpi';
      }

      // 캐시 저장 (탭 컨텍스트 포함)
      setCachedIntent(message, finalIntent, parsed.confidence, entities, currentTab);

      return {
        intent: finalIntent,
        confidence: parsed.confidence,
        entities,
        method: 'ai',
        reasoning: parsed.reasoning,
      };
    }

    console.warn('[classifier] Invalid AI response:', parsed);

  } catch (error) {
    console.error('[classifier] AI classification error:', error);
  }

  // 3. 폴백: general_chat
  console.log('[classifier] Falling back to general_chat');
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'fallback',
  };
}

/**
 * AI 응답 엔티티를 내부 형식으로 변환 및 보강
 */
function transformEntities(
  aiEntities: AIClassificationResponse['entities'],
  originalMessage: string
): Record<string, any> {
  const entities: Record<string, any> = {};

  if (!aiEntities) {
    return entities;
  }

  // 페이지
  if (aiEntities.page) {
    entities.page = aiEntities.page;
  }

  // 탭
  if (aiEntities.tab) {
    entities.tab = aiEntities.tab;

    // 탭에서 페이지 추론
    if (!entities.page) {
      entities.inferredPage = inferPageFromTab(aiEntities.tab);
    }
  }

  // 섹션
  if (aiEntities.sectionId) {
    entities.section = aiEntities.sectionId;
  }

  // 모달
  if (aiEntities.modalId) {
    entities.modalId = aiEntities.modalId;
  }

  // 쿼리 타입
  if (aiEntities.queryType) {
    entities.queryType = aiEntities.queryType;
  }

  // 필터
  if (aiEntities.filter) {
    entities.filter = aiEntities.filter;
  }

  // 테이블 페이지
  if (aiEntities.tablePage !== undefined) {
    entities.tablePage = aiEntities.tablePage;
  }

  // 기간 처리
  if (aiEntities.period) {
    entities.period = aiEntities.period;

    // 날짜 프리셋
    if (aiEntities.period.type && aiEntities.period.type !== 'custom') {
      entities.datePreset = aiEntities.period.type;
    }

    // 커스텀 날짜 범위
    if (aiEntities.period.startDate) {
      entities.dateStart = aiEntities.period.startDate;
    }
    if (aiEntities.period.endDate) {
      entities.dateEnd = aiEntities.period.endDate;
    }
  }

  // 스튜디오 제어 엔티티 (직접 패스스루)
  const studioFields = [
    'scenario', 'simulationType', 'optimizationType',
    'overlay', 'visible', 'simCommand', 'simSpeed',
    'simType', 'customerCount', 'duration',
    'optGoal', 'optTypes', 'optIntensity',
    'viewMode', 'panel', 'sceneName',
    'weather', 'timeOfDay', 'holidayType', 'preset',
  ] as const;
  for (const field of studioFields) {
    if (aiEntities[field] !== undefined) {
      entities[field] = aiEntities[field];
    }
  }

  // 세부 필터 엔티티 (직접 패스스루)
  if (aiEntities.itemFilter && Array.isArray(aiEntities.itemFilter)) {
    entities.itemFilter = aiEntities.itemFilter;
  }
  if (aiEntities.hour !== undefined && typeof aiEntities.hour === 'number') {
    entities.hour = aiEntities.hour;
  }

  // 패턴 기반 날짜 보강 (AI가 날짜를 못 추출했을 때)
  if (!entities.period && !entities.datePreset) {
    const extractedDate = extractDateRange(originalMessage);
    if (extractedDate) {
      if (extractedDate.preset) {
        entities.datePreset = extractedDate.preset;
        entities.period = { type: extractedDate.preset };
      } else if (extractedDate.startDate && extractedDate.endDate) {
        entities.dateStart = extractedDate.startDate;
        entities.dateEnd = extractedDate.endDate;
        entities.period = {
          type: 'custom',
          startDate: extractedDate.startDate,
          endDate: extractedDate.endDate,
        };
      }
    }
  }

  // 패턴 기반 시간 보강 (AI가 시간을 못 추출했을 때)
  if (entities.hour === undefined) {
    const extractedHour = extractHour(originalMessage);
    if (extractedHour !== null) {
      entities.hour = extractedHour;
    }
  }

  return entities;
}

/**
 * 탭에서 페이지 추론
 */
function inferPageFromTab(tab: string): string | null {
  const insightsTabs = ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai', 'ai-recommendation'];
  const studioTabs = ['layer', 'ai-simulation', 'ai-optimization', 'apply'];
  const settingsTabs = ['stores', 'data', 'users', 'system', 'license'];

  if (insightsTabs.includes(tab)) return '/insights';
  if (studioTabs.includes(tab)) return '/studio';
  if (settingsTabs.includes(tab)) return '/settings';

  return null;
}
