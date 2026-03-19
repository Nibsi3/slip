/**
 * env.ts
 *
 * Central environment variable validation.
 * Import this at the top of any module that needs env vars — it will throw
 * a descriptive error at startup if anything required is missing, rather
 * than surfacing a cryptic runtime failure mid-request.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const token = env.STITCH_CLIENT_SECRET;
 */

function require(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `FATAL: Required environment variable "${name}" is not set. ` +
      `Check your .env file or Render environment settings.`
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // ── App ─────────────────────────────────────────────────────────────────
  NODE_ENV: optional("NODE_ENV", "development"),
  APP_URL: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // ── Auth ─────────────────────────────────────────────────────────────────
  get JWT_SECRET() { return require("JWT_SECRET"); },

  // ── Database ─────────────────────────────────────────────────────────────
  get DATABASE_URL() { return require("DATABASE_URL"); },

  // ── Redis ─────────────────────────────────────────────────────────────────
  get REDIS_URL() { return require("REDIS_URL"); },

  // ── Stitch (pay-ins) ──────────────────────────────────────────────────────
  get STITCH_CLIENT_ID() { return require("STITCH_CLIENT_ID"); },
  get STITCH_CLIENT_SECRET() { return require("STITCH_CLIENT_SECRET"); },
  STITCH_WEBHOOK_SECRET: optional("STITCH_WEBHOOK_SECRET"),

  // ── Stitch (payouts) ──────────────────────────────────────────────────────
  STITCH_PAYOUT_CLIENT_ID: optional("STITCH_PAYOUT_CLIENT_ID"),
  STITCH_PAYOUT_CLIENT_SECRET: optional("STITCH_PAYOUT_CLIENT_SECRET"),

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  get WHATSAPP_PHONE_NUMBER_ID() { return require("WHATSAPP_PHONE_NUMBER_ID"); },
  get WHATSAPP_ACCESS_TOKEN() { return require("WHATSAPP_ACCESS_TOKEN"); },
  get WHATSAPP_VERIFY_TOKEN() { return require("WHATSAPP_VERIFY_TOKEN"); },
  WHATSAPP_FOLLOWUP_TEMPLATE_NAME: optional("WHATSAPP_FOLLOWUP_TEMPLATE_NAME"),

  // ── SMS (Demakatso) ────────────────────────────────────────────────────────
  get DEMAKATSO_API_KEY() { return require("DEMAKATSO_API_KEY"); },
  DEMAKATSO_SENDER_ID: optional("DEMAKATSO_SENDER_ID", "SlipATip"),

  // ── Email (Resend) ────────────────────────────────────────────────────────
  get RESEND_API_KEY() { return require("RESEND_API_KEY"); },
  EMAIL_FROM: optional("EMAIL_FROM", "noreply@slipatip.co.za"),

  // ── Storage (S3-compatible) ───────────────────────────────────────────────
  AWS_ACCESS_KEY_ID: optional("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: optional("AWS_SECRET_ACCESS_KEY"),
  AWS_REGION: optional("AWS_REGION", "af-south-1"),
  S3_BUCKET_NAME: optional("S3_BUCKET_NAME"),

  // ── Sentry ────────────────────────────────────────────────────────────────
  SENTRY_DSN: optional("SENTRY_DSN"),
  SENTRY_ORG: optional("SENTRY_ORG"),
  SENTRY_PROJECT: optional("SENTRY_PROJECT"),

  // ── Cron ──────────────────────────────────────────────────────────────────
  get CRON_SECRET() { return require("CRON_SECRET"); },

  // ── Paystack (bank list only — pay-ins removed) ───────────────────────────
  PAYSTACK_SECRET_KEY: optional("PAYSTACK_SECRET_KEY"),

  // ── OTT ───────────────────────────────────────────────────────────────────
  OTT_API_KEY: optional("OTT_API_KEY"),
  OTT_MERCHANT_ID: optional("OTT_MERCHANT_ID"),

  // ── Push Notifications (FCM) ──────────────────────────────────────────────
  FCM_SERVER_KEY: optional("FCM_SERVER_KEY"),
} as const;
