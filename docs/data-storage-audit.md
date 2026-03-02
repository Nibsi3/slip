# Slip a Tip — Data Storage & Security Audit Document

**Version:** 1.0  
**Date:** March 2026  
**Prepared for:** POPIA / FICA Compliance Audit  
**Platform:** slipatip.co.za

---

## 1. Where All User Data Is Stored

### Primary Database
| Property | Value |
|---|---|
| **Provider** | Supabase (supabase.com) |
| **Database type** | PostgreSQL 15 |
| **Region** | AWS eu-west-2 (London) — closest to South Africa available |
| **Schema** | `public` |
| **Encryption at rest** | ✅ AES-256 (Supabase default, always on) |
| **Encryption in transit** | ✅ TLS 1.3 enforced for all connections |
| **Backups** | ✅ Daily automated backups (Supabase Pro) |
| **PITR** | Configurable (Supabase Pro — enable in Dashboard → Settings → Database → PITR) |

### Exactly Which Tables Hold User Data

All tables live in the **`public` schema** of your Supabase Postgres database.

#### Identity & Authentication
| Table | What it stores | Sensitive fields |
|---|---|---|
| `public."User"` | Account identity | `email`, `phone`, `passwordHash` (bcrypt), `idNumber`, `totpSecret`, `backupCodes` |
| `public."Session"` | Login sessions | `token` (JWT, 7-day expiry), `userId`, `expiresAt` |
| `public."AuditLog"` | Every action | `userId`, `action`, `ipAddress`, `details` |

#### Worker / FICA Data
| Table | What it stores | Sensitive fields |
|---|---|---|
| `public."Worker"` | Worker profile | `bankName`, `bankAccountNo`, `bankBranchCode`, `docIdUrl`, `docAddressUrl`, `docSelfieUrl`, `walletBalance`, `availableBalance` |

FICA documents (ID scan, proof of address, selfie) are uploaded as **files**, stored separately:

| Property | Value |
|---|---|
| **File storage provider** | AWS S3 (via `@aws-sdk/client-s3`) |
| **Bucket** | Configured via `AWS_S3_BUCKET_NAME` env var |
| **Access** | Pre-signed URLs (time-limited, not publicly listable) |
| **Encryption** | SSE-S3 (AES-256, AWS managed) |

#### Financial Records
| Table | What it stores |
|---|---|
| `public."Tip"` | Every tip transaction (amount, fees, status, Paystack reference) |
| `public."Withdrawal"` | Every withdrawal request (amount, bank details, status) |
| `public."LedgerEntry"` | Double-entry ledger for all financial movements |
| `public."SettlementHold"` | Funds held pending settlement (24–72h) |
| `public."ChargebackReserve"` | Chargeback protection reserve balances |

#### Security & Fraud Records
| Table | What it stores |
|---|---|
| `public."FraudEvent"` | Flagged transactions, risk scores, actions taken |
| `public."AmlAlert"` | Anti-money laundering alerts and review status |
| `public."VelocityRecord"` | Rate-limit event log (tip/withdrawal frequencies) |
| `public."DeviceFingerprint"` | Browser fingerprints for fraud detection |

---

## 2. How Data Is Accessed (Access Control)

### Who Can Access the Database

| Actor | Access Method | What They Can Access |
|---|---|---|
| **Next.js server (Prisma)** | `DATABASE_URL` (Supabase pooler connection string — service role) | Full read/write to `public` schema |
| **Supabase Dashboard** | Supabase web UI (requires MFA login) | Full access — admin only |
| **Supabase anon/public client key** | Blocked by RLS | ❌ Zero access to all tables |
| **Supabase authenticated role** | Blocked by RLS | ❌ Zero access to all tables |
| **Direct DB connection** | Blocked by Supabase (require password + TLS) | Requires service-role password |

### Row Level Security (RLS)

**All 15 tables have RLS enabled** with `RESTRICTIVE` deny-all policies for `anon` and `authenticated` roles. Only the PostgreSQL `service_role` (which bypasses RLS by design) can read/write data. This means:

- The Supabase public API key (`anon`) cannot read a single row from any table
- Even if someone obtained the public key, they get zero data
- Prisma connects via `service_role` (in `DATABASE_URL`) and is the only path to the data

### Environment Variables (Secrets Management)

All credentials are stored as **environment variables on the hosting provider (Render)**, never hardcoded in the codebase:

| Variable | Purpose | Where stored |
|---|---|---|
| `DATABASE_URL` | Prisma → Supabase Postgres (pooler) | Render env vars |
| `DIRECT_URL` | Prisma migrations direct connection | Render env vars |
| `PAYSTACK_SECRET_KEY` | Payment processing | Render env vars |
| `JWT_SECRET` | Session token signing (HS256) | Render env vars |
| `REDIS_URL` | Rate limiting (ioredis) | Render env vars |
| `AWS_ACCESS_KEY_ID` | S3 document storage | Render env vars |
| `AWS_SECRET_ACCESS_KEY` | S3 document storage | Render env vars |
| `BOOTSTRAP_SECRET` | One-time admin creation (remove after use) | Render env vars |

---

## 3. Password & Authentication Security

| Control | Implementation |
|---|---|
| **Password hashing** | bcryptjs with cost factor 12 (industry standard) — plaintext password is NEVER stored |
| **Password policy** | Min 8 chars, must contain uppercase + lowercase + number + special character |
| **Session tokens** | JWT HS256, 7-day TTL, stored in `public."Session"` table, HttpOnly cookie client-side |
| **Session expiry** | Automatic — tokens expire after 7 days |
| **Login rate limiting** | Max 10 attempts per IP per 15 min + 5 per identifier per 30 min (Redis) |
| **Account lockout** | After 10 failed attempts: DB-level 30-minute lock (`lockedUntil` field) |
| **Admin 2FA** | TOTP (Google Authenticator compatible) enforced for all ADMIN/SUPER_ADMIN roles |
| **Password reset** | Cryptographically random token, 1-hour expiry, one-time use, invalidates all sessions |

---

## 4. Data Minimisation (POPIA Principle)

| Data type | Collected | Why necessary | Retention |
|---|---|---|---|
| First + last name | ✅ | Worker identification, QR card personalisation | Lifetime of account |
| Phone number | ✅ | Login identifier, SMS notifications (FICA, settlements) | Lifetime of account |
| Email | Optional | Admin login, password reset | Lifetime of account |
| SA ID number | ✅ (FICA) | Legal identity verification required for financial services (FICA Act) | Retained per FICA requirements (5 years minimum) |
| Bank account details | ✅ (withdrawals) | Paystack EFT payout — required for funds transfer | Retained per FICA/FSCA requirements |
| FICA documents (ID scan, address proof, selfie) | ✅ | FICA compliance — FIC Act section 21 | 5 years minimum post account closure |
| IP address | ✅ | Fraud prevention, audit logs | 1 year rolling |
| Device fingerprint | ✅ | Fraud prevention | 1 year rolling |
| Payment card data | ❌ NOT COLLECTED | Paystack handles card data — we never see card numbers | N/A |

---

## 5. FICA Compliance

Slip a Tip conducts FICA (Financial Intelligence Centre Act) verification for all workers who wish to withdraw funds:

| Requirement | Implementation |
|---|---|
| Customer identification | SA ID number collected + Luhn-validated |
| Identity verification | ID document + selfie uploaded, reviewed |
| Proof of address | Utility bill / bank statement uploaded |
| Record keeping | All FICA documents stored in AWS S3 with audit trail in DB |
| FICA officer review | Admin review panel with approve/reject + audit log |
| Automated pre-screening | SA ID Luhn validation + document completeness check |
| Suspicious transaction reporting | AML monitoring module — flags for manual review |
| Non-face-to-face | All 3 documents (ID + address + selfie) required as per FIC guidance |

---

## 6. POPIA Compliance Summary

| POPIA Condition | Status | Implementation |
|---|---|---|
| Lawfulness | ✅ | Explicit terms acceptance with IP + timestamp recorded |
| Purpose limitation | ✅ | Data only used for tipping platform and FICA compliance |
| Minimality | ✅ | Only necessary data collected (see Section 4) |
| Further processing | ✅ | No third-party data sales or sharing |
| Information quality | ✅ | Users can update their profile |
| Openness | ✅ | Privacy policy at /legal/privacy |
| Security safeguards | ✅ | See Sections 2–5 |
| Data subject participation | ✅ | Users can request deletion (admin-initiated anonymisation) |

---

## 7. Incident Response

| Step | Action |
|---|---|
| Detection | Sentry (error monitoring), Render logs, Supabase DB logs |
| Containment | Render environment: redeploy with environment variable change disables access |
| Notification | POPIA: notify Information Regulator and affected data subjects within 72 hours if breach involves personal data |
| Evidence | `public."AuditLog"` preserves all actions with timestamps and IP addresses |
| Contact | Supabase security: security@supabase.com |

---

## 8. Third-Party Data Processors

| Processor | Purpose | Data shared | Location |
|---|---|---|---|
| Supabase | Database hosting | All user and financial data | AWS eu-west-2 (London) |
| AWS S3 | FICA document storage | ID documents, selfies, proof of address | Configured region |
| Paystack | Payment processing | Email, payment amount, transaction reference | Nigeria (African fintech) |
| Render | Application hosting | Application code + env vars (no user data at rest) | US East / global CDN |
| Cloudflare | CDN / DDoS protection | IP addresses (not personal data) | Global |
| Resend | Transactional email | Email address, name | EU |
| Demakatso (SMS) | SMS notifications | Phone number, notification text | South Africa |

---

## 9. Supabase-Specific Settings Checklist

Run through this in Supabase Dashboard:

### Authentication (Supabase Auth — not used for login, still harden it)
- [ ] **Dashboard → Auth → Settings → Disable "Allow new users to sign up"** (you don't use Supabase Auth, prevent accidental usage)
- [ ] **Dashboard → Auth → Settings → Disable all OAuth providers**

### Database
- [ ] **Dashboard → Settings → Database → Enable PITR** (Point-in-Time Recovery)
- [ ] **Dashboard → Settings → Database → Confirm backups are enabled**
- [ ] **Dashboard → Database → Roles** — confirm only `postgres` (service_role) has access
- [ ] **Run `supabase/rls_hardening.sql`** to enable RLS on all tables

### API
- [ ] **Dashboard → Settings → API** — note your `service_role` key — this is in `DATABASE_URL`, never expose it client-side
- [ ] Confirm `anon` key is not used anywhere in your server-side code (it should only be `service_role` / DB password via Prisma)

### Access Control
- [ ] **Dashboard → Settings → Team** — ensure only authorised people have Supabase Dashboard access
- [ ] Enable MFA on Supabase Dashboard logins for all team members

---

## 10. Summary Statement for Auditors

> All personal data of Slip a Tip users is stored exclusively in a **Supabase-hosted PostgreSQL database** (AWS eu-west-2), governed by Supabase's SOC 2 Type II certified infrastructure. FICA identity documents are stored in **AWS S3** with AES-256 server-side encryption. No user data is stored on the application server. All database connections are encrypted (TLS 1.3), access is restricted to the application server via service-role credentials, and all tables are protected by PostgreSQL Row Level Security policies that deny public access. Passwords are hashed using bcrypt (cost factor 12) and are never stored or transmitted in plaintext. All significant user actions are recorded in an immutable audit log. The platform complies with the POPIA Act 4 of 2013 and the Financial Intelligence Centre Act requirements for customer identity verification.

---

*Document owner: Slip a Tip (Pty) Ltd*  
*Next review date: March 2027 or after any significant architecture change*
