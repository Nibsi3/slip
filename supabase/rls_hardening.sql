-- =============================================================================
-- Slip a Tip — Supabase Row Level Security (RLS) Hardening
-- =============================================================================
-- Purpose:
--   Lock down all public schema tables so that ONLY the Postgres service-role
--   (used by Prisma / your Next.js server) can read/write data.
--   The anonymous Supabase client key gets ZERO access to any table.
--
-- How to apply:
--   Supabase Dashboard → SQL Editor → paste this file → Run
--
-- IMPORTANT: After applying, verify your app still works by logging in.
--   Prisma connects via DATABASE_URL (pooler) which uses service-role privileges
--   and bypasses RLS by default. This is correct and intended.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. REVOKE all default public/anon access
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM authenticated;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE "User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Worker"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tip"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Withdrawal"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QRCode"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FraudEvent"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceFingerprint"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VelocityRecord"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChargebackReserve"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SettlementHold"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AmlAlert"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LedgerEntry"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhysicalQRRequest"  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Drop any existing policies to start clean
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Create DENY-ALL policies for anon + authenticated roles
--    (service_role bypasses RLS entirely — that is how Prisma connects)
-- ---------------------------------------------------------------------------

-- Helper: create a blanket deny-all policy on a table
-- We use USING (false) which denies all SELECT/UPDATE/DELETE
-- and WITH CHECK (false) which denies all INSERT/UPDATE

CREATE POLICY "deny_anon_all" ON "User"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "Worker"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "Tip"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "Withdrawal"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "Session"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "AuditLog"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "QRCode"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "FraudEvent"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "DeviceFingerprint"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "VelocityRecord"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "ChargebackReserve"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "SettlementHold"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "AmlAlert"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "LedgerEntry"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_all" ON "PhysicalQRRequest"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 5. Verify: confirm RLS is enabled on all tables
-- ---------------------------------------------------------------------------
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public') AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- ---------------------------------------------------------------------------
-- 6. Non-negative balance constraints (idempotent)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. Confirm service_role still has full access (should be yes — it bypasses RLS)
-- ---------------------------------------------------------------------------
-- Run this check as a sanity test after applying:
--   SET ROLE anon;
--   SELECT * FROM "User" LIMIT 1;  -- should return: ERROR: permission denied
--   RESET ROLE;
--   SELECT * FROM "User" LIMIT 1;  -- should return: rows (as service_role)

-- =============================================================================
-- Done. Your tables are now locked to service-role only.
-- Prisma (via DATABASE_URL) uses service-role → unaffected.
-- The Supabase anon/public client key has zero access to all tables.
-- =============================================================================
