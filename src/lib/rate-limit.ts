/**
 * Redis-backed sliding window rate limiter.
 * Uses INCR + EXPIRE for atomic, distributed rate limiting.
 */

import { redis } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and increment a rate limit window.
 * @param key       Unique key (e.g. "login:1.2.3.4")
 * @param max       Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }

  const ttl = await redis.ttl(redisKey);
  const resetAt = new Date(Date.now() + ttl * 1000);

  if (count > max) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: max - count, resetAt };
}

/**
 * Reset the rate limit window for a key (e.g. on successful login).
 */
export async function resetRateLimit(key: string): Promise<void> {
  await redis.del(`rl:${key}`);
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** Max 10 login attempts per IP per 15 minutes */
export async function checkLoginIpLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
}

/** Max 5 failed login attempts per identifier (phone/email) per 30 minutes → lockout */
export async function checkLoginIdentifierLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`login:id:${identifier}`, 5, 30 * 60 * 1000);
}

/** Max 5 registration attempts per IP per hour */
export async function checkRegisterIpLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
}

/** Max 5 password reset requests per IP per hour */
export async function checkPasswordResetLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`reset:ip:${ip}`, 5, 60 * 60 * 1000);
}

/** Max 5 application submissions per IP per hour */
export async function checkApplyIpLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`apply:ip:${ip}`, 5, 60 * 60 * 1000);
}

/** Max 10 QR activation attempts per IP per hour */
export async function checkActivateIpLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`activate:ip:${ip}`, 10, 60 * 60 * 1000);
}
