/**
 * Resets loginAttempts and lockedUntil for a user so they can log in again.
 * Run with:  node scripts/reset-login-lockout.mjs admin@slipatip.co.za
 *
 * Reads DATABASE_URL from .env.local (or .env).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* skip */ }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/reset-login-lockout.mjs <email>");
  process.exit(1);
}

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL / DIRECT_URL not found in .env.local / .env");
  process.exit(1);
}

// Use prisma db execute via a quick inline script
const script = `
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ datasources: { db: { url: ${JSON.stringify(dbUrl)} } } });
async function run() {
  const result = await db.user.updateMany({
    where: { email: ${JSON.stringify(email.toLowerCase())} },
    data: { loginAttempts: 0, lockedUntil: null },
  });
  if (result.count === 0) {
    console.error('No user found with email: ' + ${JSON.stringify(email)});
    process.exit(1);
  }
  console.log('Reset loginAttempts and lockedUntil for ' + ${JSON.stringify(email)});
  await db.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
`;

import { writeFileSync, unlinkSync } from "fs";
const tmpFile = resolve(root, "_reset_tmp.cjs");
writeFileSync(tmpFile, script);
try {
  execSync(`node ${tmpFile}`, { stdio: "inherit", cwd: root });
} finally {
  unlinkSync(tmpFile);
}
