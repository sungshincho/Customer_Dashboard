/**
 * Rate Limiting 유틸리티
 * - 사용자별 분당 요청 수 제한
 * - 메모리 기반 (Edge Function 인스턴스 내)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 30;  // 분당 30회
const WINDOW_MS = 60 * 1000;  // 1분

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  userId: string,
  limit: number = DEFAULT_LIMIT
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${userId}`;

  let entry = rateLimitMap.get(key);

  // 새 윈도우 시작 또는 기존 윈도우 만료
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    rateLimitMap.set(key, entry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
    };
  }

  // 기존 윈도우 내 요청
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// 주기적 정리 (메모리 누수 방지)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}
