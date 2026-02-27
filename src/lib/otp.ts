/**
 * OTP (One-Time Password) phone verification system.
 * 
 * Uses in-memory store with expiry. For multi-instance deployments,
 * replace with Redis or database-backed store.
 */

import crypto from "crypto";

interface OtpEntry {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();
const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 60s between resends

// Sweep stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit OTP for a phone number.
 * Returns the OTP code and a session key for verification.
 */
export function generateOtp(phone: string): { sessionKey: string; code: string; cooldownActive: boolean } {
  // Check for existing recent OTP (cooldown)
  for (const [key, entry] of otpStore.entries()) {
    if (entry.phone === phone && entry.expiresAt > Date.now()) {
      const timeSinceCreated = Date.now() - (entry.expiresAt - OTP_EXPIRY_MS);
      if (timeSinceCreated < OTP_COOLDOWN_MS) {
        return { sessionKey: key, code: entry.code, cooldownActive: true };
      }
    }
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const sessionKey = crypto.randomBytes(32).toString("hex");

  otpStore.set(sessionKey, {
    code,
    phone,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  return { sessionKey, code, cooldownActive: false };
}

/**
 * Verify an OTP code against a session key.
 */
export function verifyOtp(sessionKey: string, code: string): { valid: boolean; reason?: string } {
  const entry = otpStore.get(sessionKey);

  if (!entry) {
    return { valid: false, reason: "OTP expired or invalid session. Please request a new code." };
  }

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(sessionKey);
    return { valid: false, reason: "OTP has expired. Please request a new code." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(sessionKey);
    return { valid: false, reason: "Too many failed attempts. Please request a new code." };
  }

  entry.attempts += 1;

  if (entry.code !== code) {
    return { valid: false, reason: `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
  }

  // Success — consume the OTP
  otpStore.delete(sessionKey);
  return { valid: true };
}

/**
 * Get the phone number associated with an OTP session.
 */
export function getOtpPhone(sessionKey: string): string | null {
  const entry = otpStore.get(sessionKey);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.phone;
}
