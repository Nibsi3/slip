/**
 * Stitch Express webhook handler
 * Docs: https://express.stitch.money/api-docs  (webhook section)
 *
 * Stitch sends events when a payment link status changes.
 * We listen for PAID / SETTLED to credit the worker's wallet.
 *
 * Webhook verification: Stitch signs with HMAC-SHA256 over the raw body.
 * Set STITCH_WEBHOOK_SECRET in Render to the secret returned by
 * POST /api/v1/webhook when you register your endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  checkBalanceCap,
  createSettlementHold,
  processSettlementClears,
  recalculateReserve,
  runAmlChecks,
  recordFraudEvent,
} from "@/lib/security";
import { sendBalanceCapOverflowEmail } from "@/lib/email";
import { sendPaymentConfirmation, sendWorkerTipNotification, normalisePhone } from "@/lib/whatsapp";
import { sendPushToWorker } from "@/lib/push-notifications";

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
function verifyStitchSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.STITCH_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, skip verification (dev/test mode only)
    console.warn("[Stitch webhook] STITCH_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }

  // Stitch sends: "sha256=<hex>" in the x-stitch-signature header
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook event types from Stitch Express
// ---------------------------------------------------------------------------
interface StitchWebhookPayload {
  event: string;
  data: {
    id: string;
    merchantReference?: string;
    amount?: number;       // cents
    status?: string;
    paidAt?: string;
    payerName?: string;
    payerEmailAddress?: string;
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-stitch-signature") || "";

    if (!verifyStitchSignature(rawBody, signatureHeader)) {
      console.error("[Stitch webhook] Invalid signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    let payload: StitchWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as StitchWebhookPayload;
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    console.log("[Stitch webhook] event:", payload.event, "id:", payload.data?.id);

    // Stitch fires events like "payment_link.paid" and "payment_link.settled"
    const event = payload.event?.toLowerCase();

    if (event === "payment_link.paid" || event === "payment_link.settled") {
      await handlePaymentPaid(payload);
    } else if (event === "payment_link.expired" || event === "payment_link.cancelled") {
      await handlePaymentFailed(payload);
    }

    return new NextResponse("OK");
  } catch (err) {
    console.error("[Stitch webhook] error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handlePaymentPaid(payload: StitchWebhookPayload) {
  const stitchPaymentId = payload.data.id;
  const merchantReference = payload.data.merchantReference;

  if (!merchantReference && !stitchPaymentId) {
    console.error("[Stitch webhook] paid event missing id and merchantReference");
    return;
  }

  // Look up tip by merchantReference (our paymentId) or by stored stitchPaymentId (gatewayRef field)
  const tip = await db.tip.findFirst({
    where: {
      OR: [
        ...(merchantReference ? [{ paymentId: merchantReference }] : []),
        { gatewayRef: stitchPaymentId },
      ],
    },
    include: {
      worker: {
        select: {
          whatsappPhone: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!tip) {
    console.error("[Stitch webhook] No tip found for merchantReference:", merchantReference, "stitchId:", stitchPaymentId);
    return;
  }

  if (tip.status !== "PENDING") {
    console.log(`[Stitch webhook] tip ${tip.id} already in status ${tip.status} — idempotent skip`);
    return;
  }

  // Atomic claim — prevents double-crediting on duplicate webhook deliveries
  const claimed = await db.tip.updateMany({
    where: { id: tip.id, status: "PENDING" },
    data: { status: "COMPLETED" },
  });
  if (claimed.count === 0) {
    console.log(`[Stitch webhook] tip ${tip.id} already claimed — skip`);
    return;
  }

  // Amount reconciliation (Stitch sends cents)
  if (payload.data.amount !== undefined) {
    const receivedZAR = payload.data.amount / 100;
    const expectedZAR = Number(Number(tip.amount).toFixed(2));
    if (Math.abs(expectedZAR - receivedZAR) > 0.01) {
      console.error("[Stitch webhook] Amount mismatch", { expected: expectedZAR, received: receivedZAR });
      await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });
      return;
    }
  }

  const netAmount = Number(tip.netAmount);
  const stitchRef = `Stitch ${stitchPaymentId}`;

  // --- Balance cap enforcement ---
  const capCheck = await checkBalanceCap(tip.workerId, netAmount);
  if (!capCheck.allowed) {
    await recordFraudEvent({
      type: "BALANCE_CAP_EXCEEDED",
      workerId: tip.workerId,
      tipId: tip.id,
      riskScore: 50,
      action: "HOLD",
      details: { netAmount, currentBalance: capCheck.currentBalance, balanceCap: capCheck.balanceCap },
    });

    await db.tip.update({
      where: { id: tip.id },
      data: { gatewayRef: stitchRef },
    });

    const capWorkerUser = await db.user.findFirst({ where: { worker: { id: tip.workerId } } });
    await sendBalanceCapOverflowEmail({
      workerName: capWorkerUser ? `${capWorkerUser.firstName} ${capWorkerUser.lastName}` : tip.workerId,
      workerId: tip.workerId,
      tipPaymentId: tip.paymentId,
      netAmount,
      currentBalance: capCheck.currentBalance,
      balanceCap: capCheck.balanceCap,
    });

    console.log(`[Stitch webhook] tip ${tip.id} HELD — worker at balance cap`);
    return;
  }

  // --- AML checks ---
  const amlResult = await runAmlChecks(tip.workerId, netAmount, "TIP");
  let settlementRisk: "low" | "medium" | "high" = "low";
  let isFraudHeld = false;

  if (amlResult.hasAlerts) {
    if (amlResult.highestRiskLevel === "CRITICAL" || amlResult.highestRiskLevel === "HIGH") {
      settlementRisk = "high";
      isFraudHeld = amlResult.highestRiskLevel === "CRITICAL";
    } else if (amlResult.highestRiskLevel === "MEDIUM") {
      settlementRisk = "medium";
    }
    await recordFraudEvent({
      type: "AML_ALERT",
      workerId: tip.workerId,
      tipId: tip.id,
      riskScore: amlResult.highestRiskLevel === "CRITICAL" ? 90 : 50,
      action: isFraudHeld ? "HOLD" : "FLAG",
      details: { alerts: amlResult.alerts },
    });
  }

  // --- Chargeback debt deduction ---
  const workerForDebt = await db.worker.findUnique({
    where: { id: tip.workerId },
    select: { chargebackDebt: true },
  });
  const existingDebt = Number(workerForDebt?.chargebackDebt ?? 0);
  const debtDeduction = Math.min(existingDebt, netAmount);
  const creditAmount = netAmount - debtDeduction;

  // --- Core transaction ---
  await db.$transaction(async (tx) => {
    await tx.tip.update({
      where: { id: tip.id },
      data: { status: "COMPLETED", gatewayRef: stitchRef },
    });

    await tx.ledgerEntry.create({
      data: {
        workerId: tip.workerId,
        transactionType: "TIP",
        amount: tip.amount,
        feePlatform: tip.feePlatform,
        feeGateway: tip.feeGateway,
        netAmount: tip.netAmount,
        status: "COMPLETED",
        reference: stitchRef,
        tipId: tip.id,
      },
    });

    await tx.worker.update({
      where: { id: tip.workerId },
      data: {
        walletBalance: { increment: creditAmount },
        chargebackDebt: { decrement: debtDeduction },
      },
    });

    if (debtDeduction > 0) {
      await tx.ledgerEntry.create({
        data: {
          workerId: tip.workerId,
          transactionType: "CHARGEBACK",
          amount: debtDeduction,
          feePlatform: 0,
          feeGateway: 0,
          netAmount: -debtDeduction,
          status: "COMPLETED",
          reference: `Chargeback debt recovery from tip ${tip.paymentId}`,
        },
      });
    }
  });

  // --- Settlement delay ---
  const { clearsAt } = await createSettlementHold(
    tip.id,
    tip.workerId,
    tip.netAmount,
    settlementRisk,
    isFraudHeld
  );

  await recalculateReserve();
  await processSettlementClears();

  await db.auditLog.create({
    data: {
      action: "TIP_COMPLETED",
      entity: "Tip",
      entityId: tip.id,
      details: {
        stitchPaymentId,
        merchantReference,
        netAmount,
        settlementClearsAt: clearsAt.toISOString(),
        settlementRisk,
        isFraudHeld,
        amlAlerts: amlResult.alerts.length,
        via: "stitch_webhook",
      },
    },
  });

  console.log(`[Stitch webhook] tip ${tip.id} completed: R${netAmount} credited to worker ${tip.workerId}`);

  // --- WhatsApp notifications ---
  // 1. Confirm payment to customer (if they came via WhatsApp flow)
  if (tip.customerPhone) {
    sendPaymentConfirmation({
      customerPhone: tip.customerPhone,
      customerName: tip.customerName ?? undefined,
      workerFirstName: tip.worker.user.firstName,
      amountZAR: Number(tip.amount),
      paymentId: tip.paymentId,
    }).catch((err) => console.error("[Stitch webhook] WA customer confirmation error:", err));
  }

  // 2. Notify the car guard they received a tip (if they have a phone on record)
  if (tip.worker.whatsappPhone) {
    sendWorkerTipNotification({
      workerPhone: tip.worker.whatsappPhone,
      workerFirstName: tip.worker.user.firstName,
      amountZAR: Number(tip.amount),
      netAmountZAR: netAmount,
      paymentId: tip.paymentId,
    }).catch((err) => console.error("[Stitch webhook] WA worker notification error:", err));
  }

  // 3. Push notification to Android app (if FCM token registered)
  sendPushToWorker(
    tip.workerId,
    "💰 New tip received!",
    `R${Number(tip.amount).toFixed(2)} tip from a customer. R${netAmount.toFixed(2)} added to your wallet.`,
    { url: "/dashboard", tipId: tip.id }
  ).catch((err) => console.error("[Stitch webhook] FCM push error:", err));
}

async function handlePaymentFailed(payload: StitchWebhookPayload) {
  const merchantReference = payload.data.merchantReference;
  const stitchPaymentId = payload.data.id;
  if (!merchantReference && !stitchPaymentId) return;

  const tip = await db.tip.findFirst({
    where: {
      OR: [
        ...(merchantReference ? [{ paymentId: merchantReference }] : []),
        { gatewayRef: stitchPaymentId },
      ],
      status: "PENDING",
    },
  });

  if (!tip) return;

  await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });
  console.log(`[Stitch webhook] tip ${tip.id} failed/expired: ${stitchPaymentId}`);
}
