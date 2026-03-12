/**
 * Quick smoke-test: exchange Stitch client credentials for an access token.
 * Run with:  node scripts/test-stitch-token.mjs
 *
 * Reads STITCH_CLIENT_ID and STITCH_CLIENT_SECRET from .env.local (or .env).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// 1. Load .env.local (then fall back to .env) without needing dotenv package
// ---------------------------------------------------------------------------
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
      // Strip surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // file not found — skip
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

// ---------------------------------------------------------------------------
// 2. Validate credentials are present
// ---------------------------------------------------------------------------
const clientId     = process.env.STITCH_CLIENT_ID;
const clientSecret = process.env.STITCH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("ERROR: STITCH_CLIENT_ID or STITCH_CLIENT_SECRET not found in .env.local / .env");
  process.exit(1);
}

console.log(`Client ID : ${clientId}`);
console.log(`Secret    : ${clientSecret.slice(0, 6)}${"*".repeat(10)} (truncated)`);

// ---------------------------------------------------------------------------
// 3. Request an access token via Stitch Express POST /api/v1/token
//    Docs: https://express.stitch.money/api-docs  (Authentication section)
//    Body: JSON { clientId, clientSecret, scope }
//    Response: { success: true, data: { accessToken: "..." } }
// ---------------------------------------------------------------------------
const TOKEN_URL = "https://express.stitch.money/api/v1/token";

console.log(`\nRequesting token from: ${TOKEN_URL} …\n`);

let response;
try {
  response = await fetch(TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      scope: "client_paymentrequest",
    }),
  });
} catch (err) {
  console.error("Network error reaching Stitch token endpoint:", err.message);
  process.exit(1);
}

const json = await response.json();

if (!response.ok) {
  console.error(`Token request FAILED — HTTP ${response.status}`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

const accessToken = json?.data?.accessToken;

if (!accessToken) {
  console.error("Response did not contain data.accessToken:");
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log("✅  Stitch token obtained successfully!\n");
console.log(`success    : ${json.success}`);
console.log(`\nAccess token (first 40 chars): ${accessToken.slice(0, 40)}…`);
console.log("\nFull access token (for debugging):");
console.log(accessToken);
