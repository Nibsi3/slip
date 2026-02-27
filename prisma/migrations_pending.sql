-- =============================================================================
-- Pending Migration: Paystack migration + security fields
-- Apply this to your database when you can connect to it.
-- Run: psql $DATABASE_URL -f prisma/migrations_pending.sql
-- =============================================================================

-- TransactionType enum: add CHARGEBACK and CHARGEBACK_REVERSAL
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CHARGEBACK';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CHARGEBACK_REVERSAL';

-- User: add security / auth fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "loginAttempts"       INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resetToken"           TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsVersion"         TEXT,
  ADD COLUMN IF NOT EXISTS "termsIpAddress"       TEXT;

-- Worker: add chargebackDebt
ALTER TABLE "Worker"
  ADD COLUMN IF NOT EXISTS "chargebackDebt" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Worker: non-negative balance constraints
ALTER TABLE "Worker"
  DROP CONSTRAINT IF EXISTS "wallet_balance_non_negative",
  ADD CONSTRAINT "wallet_balance_non_negative"
    CHECK ("walletBalance" >= 0);

ALTER TABLE "Worker"
  DROP CONSTRAINT IF EXISTS "available_balance_non_negative",
  ADD CONSTRAINT "available_balance_non_negative"
    CHECK ("availableBalance" >= 0);

ALTER TABLE "Worker"
  DROP CONSTRAINT IF EXISTS "chargeback_debt_non_negative",
  ADD CONSTRAINT "chargeback_debt_non_negative"
    CHECK ("chargebackDebt" >= 0);

-- Tip: add paystackRef field, update default paymentMethod
ALTER TABLE "Tip"
  ADD COLUMN IF NOT EXISTS "paystackRef" TEXT;

UPDATE "Tip"
  SET "paymentMethod" = 'paystack'
  WHERE "paymentMethod" = 'payfast';

-- FraudEventType enum: add DUPLICATE_CARD
ALTER TYPE "FraudEventType" ADD VALUE IF NOT EXISTS 'DUPLICATE_CARD';

-- Admin 2FA (TOTP) fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "totpSecret"   TEXT,
  ADD COLUMN IF NOT EXISTS "totpEnabled"  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "backupCodes"  TEXT[] DEFAULT '{}';

-- TransactionType enum: add FORFEITURE
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'FORFEITURE';

-- Email verification fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified"        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "emailVerifyToken"     TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerifyExpiresAt" TIMESTAMP(3);

-- =============================================================================
-- Done. Remember to run `npx prisma generate` after applying this.
-- =============================================================================
