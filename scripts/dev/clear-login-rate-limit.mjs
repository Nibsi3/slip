/**
 * Clears Redis-backed login rate-limit keys for an identifier (phone/email) and optional IP.
 *
 * Usage:
 *   node scripts/clear-login-rate-limit.mjs <identifier> [ip]
 *
 * Examples:
 *   node scripts/clear-login-rate-limit.mjs 0662995533
 *   node scripts/clear-login-rate-limit.mjs admin@slipatip.co.za 1.2.3.4
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

function loadEnvFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const identifierRaw = process.argv[2];
const ip = process.argv[3];

if (!identifierRaw) {
  console.error("Usage: node scripts/clear-login-rate-limit.mjs <identifier> [ip]");
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL?.trim();
if (!redisUrl) {
  console.error("ERROR: REDIS_URL not set in .env.local/.env (or shell env)");
  process.exit(1);
}

const identifierLower = identifierRaw.toLowerCase();
const digits = identifierRaw.replace(/\D/g, "");
const variants = new Set([identifierLower]);
if (digits) variants.add(digits);
// Common SA phone variants
if (digits.startsWith("27") && digits.length === 11) variants.add("0" + digits.slice(2));
if (digits.startsWith("0") && digits.length === 10) variants.add("27" + digits.slice(1));

const keys = [];
for (const v of variants) {
  keys.push(`rl:login:id:${v}`);
}
if (ip) {
  keys.push(`rl:login:ip:${ip}`);
}

const redis = new Redis(redisUrl, {
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: 1,
});

try {
  const deleted = await redis.del(...keys);
  console.log("Deleted keys:");
  for (const k of keys) console.log(" - " + k);
  console.log(`\nResult: deleted ${deleted} key(s)`);
} finally {
  await redis.quit();
}
