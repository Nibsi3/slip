/**
 * In-memory sliding window rate limiter.
 * Used to protect auth endpoints from brute force attacks.
 *
 * For multi-instance deployments, replace the Map with Redis (e.g. Upstash).
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();

// Sweep stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (entry.resetAt < now) windows.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and increment a rate limit window.
 * @param key    Unique key (e.g. "login:1.2.3.4" or "login:0821234567")
 * @param max    Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: new Date(now + windowMs) };
  }

  entry.count += 1;

  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  return { allowed: true, remaining: max - entry.count, resetAt: new Date(entry.resetAt) };
}

/**
 * Reset the rate limit window for a key (e.g. on successful login).
 */
export function resetRateLimit(key: string): void {
  windows.delete(key);
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** Max 10 login attempts per IP per 15 minutes */
export function checkLoginIpLimit(ip: string): RateLimitResult {
  return checkRateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
}

/** Max 5 failed login attempts per identifier (phone/email) per 30 minutes → lockout */
export function checkLoginIdentifierLimit(identifier: string): RateLimitResult {
  return checkRateLimit(`login:id:${identifier}`, 5, 30 * 60 * 1000);
}

/** Max 5 registration attempts per IP per hour */
export function checkRegisterIpLimit(ip: string): RateLimitResult {
  return checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
}

/** Max 5 password reset requests per IP per hour */
export function checkPasswordResetLimit(ip: string): RateLimitResult {
  return checkRateLimit(`reset:ip:${ip}`, 5, 60 * 60 * 1000);
}
