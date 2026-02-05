/**
 * 하이브리드 인텐트 분류기
 * Phase 2-A: 패턴 매칭만 구현, AI 폴백은 Phase 3-A에서 추가
 */

import { matchIntent } from './patterns.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'pattern' | 'ai';
}

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * 사용자 메시지에서 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  _context?: any  // Phase 3-A에서 AI 분류 시 사용
): Promise<ClassificationResult> {
  // 1. 패턴 매칭 시도
  const patternResult = matchIntent(message);

  if (patternResult && patternResult.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      intent: patternResult.intent,
      confidence: patternResult.confidence,
      entities: patternResult.entities,
      method: 'pattern',
    };
  }

  // 2. 패턴 매칭 실패 → 현재는 general_chat 폴백
  // Phase 3-A에서 AI 분류 추가 예정
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'pattern',
  };
}
