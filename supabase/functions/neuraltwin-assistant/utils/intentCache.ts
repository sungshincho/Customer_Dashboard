/**
 * 인텐트 분류 결과 캐싱 시스템
 * TTL 기반 인메모리 캐시로 AI API 호출 최소화
 */

export interface CachedIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  timestamp: number;
}

// 캐시 설정
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const MAX_CACHE_SIZE = 500; // 최대 캐시 항목 수

// 인메모리 캐시
const intentCache = new Map<string, CachedIntent>();

/**
 * 캐시 키 생성 (텍스트 정규화)
 * - 공백 통일
 * - 소문자 변환
 * - 특수문자 제거
 */
export function normalizeForCache(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '') // 모든 공백 제거
    .replace(/[?!.,;:'"~\-]/g, '') // 특수문자 제거
    .trim();
}

/**
 * 캐시에서 인텐트 조회
 */
export function getCachedIntent(message: string): CachedIntent | null {
  const key = normalizeForCache(message);
  const cached = intentCache.get(key);

  if (!cached) {
    return null;
  }

  // TTL 확인
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL_MS) {
    intentCache.delete(key);
    console.log('[intentCache] Cache expired for:', key.substring(0, 30));
    return null;
  }

  console.log('[intentCache] Cache hit for:', key.substring(0, 30));
  return cached;
}

/**
 * 캐시에 인텐트 저장
 */
export function setCachedIntent(
  message: string,
  intent: string,
  confidence: number,
  entities: Record<string, any>
): void {
  const key = normalizeForCache(message);

  // 캐시 크기 제한 (LRU 방식 간소화: 가장 오래된 항목 제거)
  if (intentCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = intentCache.keys().next().value;
    if (oldestKey) {
      intentCache.delete(oldestKey);
    }
  }

  intentCache.set(key, {
    intent,
    confidence,
    entities,
    timestamp: Date.now(),
  });

  console.log('[intentCache] Cached intent:', intent, 'for:', key.substring(0, 30));
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats(): { size: number; maxSize: number; ttlMinutes: number } {
  return {
    size: intentCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMinutes: CACHE_TTL_MS / 60000,
  };
}

/**
 * 만료된 캐시 항목 정리
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, value] of intentCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      intentCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log('[intentCache] Cleaned up', cleanedCount, 'expired entries');
  }

  return cleanedCount;
}

/**
 * 캐시 전체 초기화 (테스트/디버그용)
 */
export function clearCache(): void {
  intentCache.clear();
  console.log('[intentCache] Cache cleared');
}
