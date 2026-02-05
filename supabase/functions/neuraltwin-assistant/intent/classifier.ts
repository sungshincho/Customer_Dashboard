/**
 * 하이브리드 인텐트 분류기
 * 1차: 패턴 매칭
 * 2차: Gemini AI 폴백 (패턴 매칭 실패 또는 낮은 신뢰도)
 */

import { matchIntent } from './patterns.ts';
import { callGemini, parseJsonResponse } from '../utils/geminiClient.ts';
import { INTENT_CLASSIFICATION_PROMPT } from '../constants/systemPrompt.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'pattern' | 'ai';
}

const PATTERN_CONFIDENCE_THRESHOLD = 0.7;
const AI_CONFIDENCE_THRESHOLD = 0.4;

/**
 * 사용자 메시지에서 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  context?: { page?: { current?: string } }
): Promise<ClassificationResult> {
  // 현재 페이지 추출
  const currentPage = context?.page?.current;

  // 1. 패턴 매칭 시도
  const patternResult = matchIntent(message, currentPage);

  if (patternResult && patternResult.confidence >= PATTERN_CONFIDENCE_THRESHOLD) {
    console.log('[classifier] Pattern match success:', patternResult.intent);
    return {
      intent: patternResult.intent,
      confidence: patternResult.confidence,
      entities: patternResult.entities,
      method: 'pattern',
    };
  }

  // 2. AI 분류 폴백
  console.log('[classifier] Pattern match failed, trying AI classification');

  try {
    const prompt = INTENT_CLASSIFICATION_PROMPT.replace('{userMessage}', message);

    const response = await callGemini(
      [{ role: 'user', content: prompt }],
      { jsonMode: true, temperature: 0.1 }
    );

    const parsed = parseJsonResponse<{
      intent: string;
      confidence: number;
      entities: Record<string, any>;
    }>(response.content);

    if (parsed && parsed.intent && parsed.confidence >= AI_CONFIDENCE_THRESHOLD) {
      console.log('[classifier] AI classification success:', parsed.intent);
      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities || {},
        method: 'ai',
      };
    }

  } catch (error) {
    console.error('[classifier] AI classification error:', error);
    // AI 실패 시 general_chat 폴백
  }

  // 3. 최종 폴백: general_chat
  console.log('[classifier] Falling back to general_chat');
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'pattern',
  };
}
