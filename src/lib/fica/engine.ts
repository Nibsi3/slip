/**
 * Automated FICA Verification Engine
 *
 * Decision logic:
 *  AUTO_APPROVE  — All hard rules pass and confidence is HIGH
 *  ADMIN_REVIEW  — Rules pass but confidence is MEDIUM (human eyes needed)
 *  AUTO_DENY     — Hard rule failure (missing docs, invalid ID number format)
 */

import { db } from "@/lib/db";
import { sendFicaApprovedSms, sendFicaRejectedSms } from "@/lib/sms";

export type FicaDecision = "AUTO_APPROVE" | "ADMIN_REVIEW" | "AUTO_DENY";

export interface FicaCheckResult {
  decision: FicaDecision;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  checks: FicaCheck[];
}

interface FicaCheck {
  name: string;
  passed: boolean;
  weight: "HARD" | "SOFT";
  detail: string;
}

// ---------------------------------------------------------------------------
// South African ID number validation (13-digit Luhn)
// Format: YYMMDD GGGG C A Z
//   YYMMDD = date of birth
//   GGGG   = gender (0000-4999=female, 5000-9999=male)
//   C      = citizenship (0=SA, 1=permanent resident)
//   A      = usually 8 (legacy)
//   Z      = Luhn check digit
// ---------------------------------------------------------------------------
export function validateSaIdNumber(id: string): { valid: boolean; reason?: string } {
  if (!id) return { valid: false, reason: "ID number is missing" };

  const clean = id.replace(/\s/g, "");

  if (!/^\d{13}$/.test(clean)) {
    return { valid: false, reason: `ID number must be exactly 13 digits (got ${clean.length})` };
  }

  // Extract and validate date of birth
  const year = parseInt(clean.slice(0, 2), 10);
  const month = parseInt(clean.slice(2, 4), 10);
  const day = parseInt(clean.slice(4, 6), 10);

  if (month < 1 || month > 12) {
    return { valid: false, reason: `Invalid month in ID number: ${month}` };
  }
  if (day < 1 || day > 31) {
    return { valid: false, reason: `Invalid day in ID number: ${day}` };
  }

  // Citizenship digit: 0 or 1
  const citizenship = parseInt(clean[10], 10);
  if (citizenship !== 0 && citizenship !== 1) {
    return { valid: false, reason: `Invalid citizenship digit: ${citizenship}` };
  }

  // Luhn algorithm check digit
  if (!luhnCheck(clean)) {
    return { valid: false, reason: "ID number fails Luhn check digit validation" };
  }

  // Estimate plausible age (18–80 years)
  const currentYear = new Date().getFullYear() % 100;
  const fullYear = year <= currentYear ? 2000 + year : 1900 + year;
  const age = new Date().getFullYear() - fullYear;
  if (age < 16 || age > 90) {
    return { valid: false, reason: `ID number implies implausible age (${age} years)` };
  }

  return { valid: true };
}

function luhnCheck(id: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = id.length - 1; i >= 0; i--) {
    let n = parseInt(id[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Core FICA check runner
// ---------------------------------------------------------------------------
export async function runFicaChecks(workerId: string): Promise<FicaCheckResult> {
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: {
      docIdUrl: true,
      docAddressUrl: true,
      docSelfieUrl: true,
      docStatus: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          idNumber: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!worker) {
    return {
      decision: "AUTO_DENY",
      confidence: "HIGH",
      reasons: ["Worker record not found"],
      checks: [],
    };
  }

  const checks: FicaCheck[] = [];

  // ── HARD RULE 1: ID document uploaded ──────────────────────────────────────
  const hasIdDoc = !!worker.docIdUrl;
  checks.push({
    name: "ID_DOCUMENT_UPLOADED",
    passed: hasIdDoc,
    weight: "HARD",
    detail: hasIdDoc ? "ID document uploaded" : "ID document is missing",
  });

  // ── HARD RULE 2: Proof of address uploaded ─────────────────────────────────
  const hasAddressDoc = !!worker.docAddressUrl;
  checks.push({
    name: "ADDRESS_DOCUMENT_UPLOADED",
    passed: hasAddressDoc,
    weight: "HARD",
    detail: hasAddressDoc ? "Proof of address uploaded" : "Proof of address is missing",
  });

  // ── HARD RULE 3: Selfie uploaded ───────────────────────────────────────────
  const hasSelfie = !!worker.docSelfieUrl;
  checks.push({
    name: "SELFIE_UPLOADED",
    passed: hasSelfie,
    weight: "HARD",
    detail: hasSelfie ? "Selfie uploaded" : "Selfie is missing",
  });

  // ── HARD RULE 4: SA ID number present ─────────────────────────────────────
  const hasIdNumber = !!worker.user.idNumber;
  checks.push({
    name: "ID_NUMBER_PRESENT",
    passed: hasIdNumber,
    weight: "HARD",
    detail: hasIdNumber ? "ID number on record" : "No ID number provided",
  });

  // ── HARD RULE 5: SA ID number format + Luhn valid ─────────────────────────
  let idValidation: { valid: boolean; reason?: string } = { valid: false, reason: "No ID number to validate" };
  if (hasIdNumber) {
    idValidation = validateSaIdNumber(worker.user.idNumber!);
  }
  checks.push({
    name: "ID_NUMBER_VALID",
    passed: idValidation.valid,
    weight: "HARD",
    detail: idValidation.valid
      ? "SA ID number passes format and Luhn validation"
      : `SA ID number invalid: ${idValidation.reason}`,
  });

  // ── SOFT RULE 1: Account age ≥ 24 hours ───────────────────────────────────
  const accountAgeHours = (Date.now() - worker.createdAt.getTime()) / 3_600_000;
  const accountMature = accountAgeHours >= 24;
  checks.push({
    name: "ACCOUNT_AGE",
    passed: accountMature,
    weight: "SOFT",
    detail: accountMature
      ? `Account is ${Math.floor(accountAgeHours)}h old`
      : `Account is only ${Math.floor(accountAgeHours)}h old (< 24h threshold)`,
  });

  // ── SOFT RULE 2: Name completeness ────────────────────────────────────────
  const hasFullName = !!(worker.user.firstName?.trim() && worker.user.lastName?.trim());
  checks.push({
    name: "FULL_NAME_PROVIDED",
    passed: hasFullName,
    weight: "SOFT",
    detail: hasFullName ? "First and last name on record" : "Name incomplete",
  });

  // ── SOFT RULE 3: Phone number present ─────────────────────────────────────
  const hasPhone = !!worker.user.phone;
  checks.push({
    name: "PHONE_PRESENT",
    passed: hasPhone,
    weight: "SOFT",
    detail: hasPhone ? "Phone number on record" : "No phone number",
  });

  // ── Decision logic ─────────────────────────────────────────────────────────
  const hardFailed = checks.filter((c) => c.weight === "HARD" && !c.passed);
  const softFailed = checks.filter((c) => c.weight === "SOFT" && !c.passed);
  const reasons: string[] = [];

  if (hardFailed.length > 0) {
    for (const f of hardFailed) reasons.push(f.detail);
    return {
      decision: "AUTO_DENY",
      confidence: "HIGH",
      reasons,
      checks,
    };
  }

  // All hard rules pass
  if (softFailed.length === 0) {
    return {
      decision: "AUTO_APPROVE",
      confidence: "HIGH",
      reasons: ["All verification checks passed"],
      checks,
    };
  }

  // Hard rules pass but some soft rules failed — flag for admin
  for (const f of softFailed) reasons.push(f.detail);
  return {
    decision: "ADMIN_REVIEW",
    confidence: "MEDIUM",
    reasons,
    checks,
  };
}

// ---------------------------------------------------------------------------
// Apply a FICA decision to the database and notify the worker
// ---------------------------------------------------------------------------
export async function applyFicaDecision(
  workerId: string,
  decision: FicaDecision,
  reasons: string[],
  reviewedBy?: string
): Promise<void> {
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: { user: { select: { firstName: true, phone: true } } },
  });
  if (!worker) return;

  if (decision === "AUTO_APPROVE") {
    await db.worker.update({
      where: { id: workerId },
      data: {
        docStatus: "APPROVED",
        docReviewedAt: new Date(),
        docReviewedBy: reviewedBy || "SYSTEM",
        docRejectReason: null,
      },
    });
    await db.auditLog.create({
      data: {
        action: "FICA_AUTO_APPROVED",
        entity: "Worker",
        entityId: workerId,
        details: { reasons, method: "automated" },
      },
    });
    if (worker.user.phone) {
      await sendFicaApprovedSms(worker.user.phone, worker.user.firstName);
    }
  } else if (decision === "AUTO_DENY") {
    const reasonText = reasons.join("; ");
    await db.worker.update({
      where: { id: workerId },
      data: {
        docStatus: "REJECTED",
        docReviewedAt: new Date(),
        docReviewedBy: reviewedBy || "SYSTEM",
        docRejectReason: reasonText,
      },
    });
    await db.auditLog.create({
      data: {
        action: "FICA_AUTO_DENIED",
        entity: "Worker",
        entityId: workerId,
        details: { reasons, method: "automated" },
      },
    });
    if (worker.user.phone) {
      await sendFicaRejectedSms(worker.user.phone, worker.user.firstName, reasonText);
    }
  }
  // ADMIN_REVIEW: leave docStatus as PENDING_REVIEW, no SMS
}
