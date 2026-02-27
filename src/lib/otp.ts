/**
 * OTP (One-Time Password) phone verification system.
 *
 * Redis-backed for distributed, cold-start-safe operation.
 * Keys are prefixed "otp:" and expire automatically via Redis TTL.
 */

import crypto from "crypto";
import { redis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_SEC = 10 * 60; // 10 minutes
const OTP_COOLDOWN_SEC = 60;    // 60s between resends

interface OtpEntry {
  code: string;
  phone: string;
  attempts: number;
  createdAt: number;
}

/**
 * Generate a 6-digit OTP for a phone number.
 * Returns the OTP code and a session key for verification.
 */
export async function generateOtp(
  phone: string
): Promise<{ sessionKey: string; code: string; cooldownActive: boolean }> {
  // Check for an existing unexpired OTP within cooldown window
  const cooldownKey = `otp:cooldown:${phone}`;
  const existingSession = await redis.get(cooldownKey);
  if (existingSession) {
    const raw = await redis.get(`otp:session:${existingSession}`);
    if (raw) {
      const entry: OtpEntry = JSON.parse(raw);
      return { sessionKey: existingSession, code: entry.code, cooldownActive: true };
    }
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const sessionKey = crypto.randomBytes(32).toString("hex");

  const entry: OtpEntry = { code, phone, attempts: 0, createdAt: Date.now() };

  await redis.set(`otp:session:${sessionKey}`, JSON.stringify(entry), "EX", OTP_EXPIRY_SEC);
  await redis.set(cooldownKey, sessionKey, "EX", OTP_COOLDOWN_SEC);

  return { sessionKey, code, cooldownActive: false };
}

/**
 * Verify an OTP code against a session key.
 */
export async function verifyOtp(
  sessionKey: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  const key = `otp:session:${sessionKey}`;
  const raw = await redis.get(key);

  if (!raw) {
    return { valid: false, reason: "OTP expired or invalid session. Please request a new code." };
  }

  const entry: OtpEntry = JSON.parse(raw);

  if (entry.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    return { valid: false, reason: "Too many failed attempts. Please request a new code." };
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.set(key, JSON.stringify(entry), "EX", ttl);
    }
    return {
      valid: false,
      reason: `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
    };
  }

  // Success — consume the OTP
  await redis.del(key);
  return { valid: true };
}

/**
 * Get the phone number associated with an OTP session.
 */
export async function getOtpPhone(sessionKey: string): Promise<string | null> {
  const raw = await redis.get(`otp:session:${sessionKey}`);
  if (!raw) return null;
  const entry: OtpEntry = JSON.parse(raw);
  return entry.phone;
}
