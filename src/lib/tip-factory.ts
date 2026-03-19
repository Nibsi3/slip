/**
 * tip-factory.ts
 *
 * Shared tip creation pipeline used by all three tip entry points:
 *  - POST /api/tips            (direct web flow)
 *  - POST /api/tips/init       (WhatsApp deeplink flow)
 *  - POST /api/tips/whatsapp   (WhatsApp bot flow)
 *
 * Centralises: velocity checks, device fingerprinting, balance cap,
 * fraud scoring, AML checks, Stitch payment link creation, tip DB record.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createStitchPaymentLink } from "@/lib/stitch";
import { generatePaymentId, calculateFees, getAppUrl } from "@/lib/utils";
import {
  scoreTipTransaction,
  recordFraudEvent,
  recordVelocityEvent,
  recordFingerprint,
  extractFingerprintFromRequest,
  checkBalanceCap,
  checkTipSentVelocity,
  checkTipReceivedVelocity,
  checkTipperToWorkerVelocity,
  runAmlChecks,
} from "@/lib/security";

export interface TipFactoryInput {
  qrCode: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerMessage?: string;
  /** How long until the Stitch payment link expires (ms). Default: 24h */
  linkTtlMs?: number;
  /** Path to redirect after payment. Default: /tip/success */
  returnPath?: string;
  /** Raw fingerprint fields from the request body */
  fingerprintFields?: {
    platform?: string;
    screenRes?: string;
    timezone?: string;
  };
}

export interface TipFactoryResult {
  tip: {
    id: string;
    paymentId: string;
  };
  stitch: {
    id: string;
    link: string;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
  };
  feePlatform: number;
  feeGateway: number;
  netAmount: number;
}

export type TipFactoryError =
  | { code: "WORKER_NOT_FOUND"; status: 404 }
  | { code: "VELOCITY_SENT"; reason: string; status: 429 }
  | { code: "VELOCITY_RECEIVED"; status: 429 }
  | { code: "VELOCITY_TIPPER_WORKER"; reason: string; status: 429 }
  | { code: "BALANCE_CAP"; status: 400 }
  | { code: "FRAUD_BLOCKED"; status: 403 }
  | { code: "AML_BLOCKED"; status: 403 }
  | { code: "GATEWAY_ERROR"; status: 502 };

export type TipFactoryOutcome =
  | { ok: true; result: TipFactoryResult }
  | { ok: false; error: TipFactoryError };

export async function createTip(
  request: NextRequest,
  input: TipFactoryInput
): Promise<TipFactoryOutcome> {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // --- Worker lookup ---
  const worker = await db.worker.findUnique({
    where: { qrCode: input.qrCode, isActive: true },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  if (!worker) {
    return { ok: false, error: { code: "WORKER_NOT_FOUND", status: 404 } };
  }

  // --- Velocity: sent from this IP ---
  const sentVelocity = await checkTipSentVelocity(ipAddress);
  if (!sentVelocity.allowed) {
    return {
      ok: false,
      error: {
        code: "VELOCITY_SENT",
        reason: sentVelocity.reason || "Too many tips from this network. Please try again later.",
        status: 429,
      },
    };
  }

  // --- Velocity: received by this worker ---
  const receivedVelocity = await checkTipReceivedVelocity(worker.id);
  if (!receivedVelocity.allowed) {
    return { ok: false, error: { code: "VELOCITY_RECEIVED", status: 429 } };
  }

  // --- Velocity: tipper → worker ---
  const tipperWorkerVelocity = await checkTipperToWorkerVelocity(ipAddress, worker.id);
  if (!tipperWorkerVelocity.allowed) {
    return {
      ok: false,
      error: {
        code: "VELOCITY_TIPPER_WORKER",
        reason: tipperWorkerVelocity.reason || "You have reached the tip limit for this recipient today.",
        status: 429,
      },
    };
  }

  // --- Device fingerprint ---
  const rawBody = input.fingerprintFields ?? {};
  const fpData = extractFingerprintFromRequest(request.headers, rawBody);
  fpData.tipperSessionId = `tipper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fingerprintHash = await recordFingerprint(fpData);

  // --- Fee calculation & balance cap pre-check ---
  const { feePlatform, feeGateway, netAmount } = calculateFees(input.amount);

  const capCheck = await checkBalanceCap(worker.id, netAmount);
  if (!capCheck.allowed) {
    await db.auditLog.create({
      data: {
        action: "TIP_BALANCE_CAP_REJECTED",
        entity: "Tip",
        details: {
          workerId: worker.id,
          amount: input.amount,
          netAmount,
          currentBalance: capCheck.currentBalance,
          balanceCap: capCheck.balanceCap,
        },
        ipAddress,
      },
    });
    return { ok: false, error: { code: "BALANCE_CAP", status: 400 } };
  }

  // --- Fraud scoring ---
  const fraudResult = await scoreTipTransaction({
    workerId: worker.id,
    amount: input.amount,
    ipAddress,
    fingerprintHash,
  });

  if (fraudResult.blocked) {
    await recordFraudEvent({
      type: "TIP_FLAGGED",
      workerId: worker.id,
      ipAddress,
      deviceId: fingerprintHash,
      riskScore: fraudResult.score,
      action: "BLOCK",
      details: { factors: fraudResult.factors, amount: input.amount },
    });
    return { ok: false, error: { code: "FRAUD_BLOCKED", status: 403 } };
  }

  if (fraudResult.action !== "ALLOW") {
    await recordFraudEvent({
      type: "TIP_FLAGGED",
      workerId: worker.id,
      ipAddress,
      deviceId: fingerprintHash,
      riskScore: fraudResult.score,
      action: fraudResult.action,
      details: { factors: fraudResult.factors, amount: input.amount },
    });
  }

  // --- AML pre-check ---
  const amlResult = await runAmlChecks(worker.id, input.amount, "TIP");
  if (amlResult.blocked) {
    await recordFraudEvent({
      type: "AML_ALERT",
      workerId: worker.id,
      ipAddress,
      deviceId: fingerprintHash,
      riskScore: 85,
      action: "BLOCK",
      details: { alerts: amlResult.alerts, amount: input.amount, autoBlocked: true },
    });
    return { ok: false, error: { code: "AML_BLOCKED", status: 403 } };
  }

  // --- Stitch payment link ---
  const paymentId = generatePaymentId();
  const appUrl = getAppUrl();
  const ttlMs = input.linkTtlMs ?? 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const returnUrl = new URL(input.returnPath ?? `/tip/success`, appUrl);
  if (input.returnPath?.includes("?") === false) {
    returnUrl.searchParams.set("reference", paymentId);
  }

  let stitch: { id: string; link: string };
  try {
    stitch = await createStitchPaymentLink({
      amountZAR: input.amount,
      merchantReference: paymentId,
      payerName: input.customerName ?? "Guest",
      payerEmail: input.customerEmail,
      payerPhone: input.customerPhone,
      redirectUrl: returnUrl.toString(),
      expiresAt,
    });
  } catch (err) {
    console.error("[tip-factory] Stitch link creation failed:", err);
    return { ok: false, error: { code: "GATEWAY_ERROR", status: 502 } };
  }

  // --- Create tip record ---
  const tip = await db.tip.create({
    data: {
      workerId: worker.id,
      amount: input.amount,
      feePlatform,
      feeGateway,
      netAmount,
      paymentId,
      paymentMethod: "stitch",
      gatewayRef: stitch.id,
      paymentLinkUrl: stitch.link,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      customerMessage: input.customerMessage,
      status: "PENDING",
    },
  });

  // --- Record velocity events ---
  await recordVelocityEvent(worker.id, "TIP_RECEIVED", input.amount, ipAddress, fingerprintHash);
  await recordVelocityEvent(worker.id, "TIP_SENT", input.amount, ipAddress, fingerprintHash);

  return {
    ok: true,
    result: {
      tip: { id: tip.id, paymentId: tip.paymentId },
      stitch,
      worker: {
        id: worker.id,
        firstName: worker.user.firstName,
        lastName: worker.user.lastName,
      },
      feePlatform,
      feeGateway,
      netAmount,
    },
  };
}

/** Converts a TipFactoryError into a plain HTTP error message string. */
export function tipFactoryErrorMessage(error: TipFactoryError): string {
  switch (error.code) {
    case "WORKER_NOT_FOUND":
      return "Worker not found or inactive.";
    case "VELOCITY_SENT":
      return error.reason;
    case "VELOCITY_RECEIVED":
      return "This worker is temporarily unable to receive tips. Please try again later.";
    case "VELOCITY_TIPPER_WORKER":
      return error.reason;
    case "BALANCE_CAP":
      return "This worker's account has reached its balance limit. Please try again later.";
    case "FRAUD_BLOCKED":
      return "This transaction cannot be processed at this time.";
    case "AML_BLOCKED":
      return "This account has been flagged for suspicious activity. Please contact support.";
    case "GATEWAY_ERROR":
      return "Payment gateway unavailable. Please try again.";
  }
}
