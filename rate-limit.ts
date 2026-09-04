// Fixed-window rate limiter. This in-memory implementation is fine for a
// single instance / Replit deployment. The moment you run more than one
// server instance, swap the `store` for Redis (INCR + EXPIRE) — the
// interface below is deliberately shaped so that swap is a one-file change.

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
}

class InMemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

const store: RateLimitStore = new InMemoryStore();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * @param identifier stable key, e.g. `login:${ip}` or `login:${email}` —
 *   combine both in practice to slow credential-stuffing without letting a
 *   single spoofed IP lock out a real user.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const count = await store.increment(identifier, windowMs);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

// Preset policies referenced across API routes.
export const RATE_LIMITS = {
  login: { limit: 8, windowMs: 15 * 60 * 1000 }, // 8 attempts / 15 min
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { limit: 4, windowMs: 60 * 60 * 1000 },
  aiChat: { limit: 30, windowMs: 60 * 1000 },
  upload: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
