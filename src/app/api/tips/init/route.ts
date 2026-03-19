/**
 * POST /api/tips/init
 *
 * Creates a pending tip + Stitch payment link and returns a WhatsApp deeplink
 * the browser can immediately redirect to. No customer credentials required.
 *
 * The customer opens WhatsApp, sees the pre-filled message with their payment
 * link, taps Send, and can pay anytime within 24 hours.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const schema = z.object({
  qrCode: z.string().min(1),
  amount: z.number().min(15).max(5000),
  platform: z.string().optional(),
  screenRes: z.string().optional(),
  timezone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const worker = await db.worker.findUnique({
      where: { qrCode: data.qrCode, isActive: true },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found or inactive" }, { status: 404 });
    }

    // --- Velocity checks ---
    const sentVelocity = await checkTipSentVelocity(ipAddress);
    if (!sentVelocity.allowed) {
      return NextResponse.json(
        { error: sentVelocity.reason || "Too many tips from this network. Please try again later." },
        { status: 429 }
      );
    }

    const receivedVelocity = await checkTipReceivedVelocity(worker.id);
    if (!receivedVelocity.allowed) {
      return NextResponse.json(
        { error: "This worker is temporarily unable to receive tips." },
        { status: 429 }
      );
    }

    const tipperWorkerVelocity = await checkTipperToWorkerVelocity(ipAddress, worker.id);
    if (!tipperWorkerVelocity.allowed) {
      return NextResponse.json(
        { error: tipperWorkerVelocity.reason || "You have reached the tip limit for this recipient today." },
        { status: 429 }
      );
    }

    // --- Device fingerprint ---
    const fpData = extractFingerprintFromRequest(request.headers, body);
    fpData.tipperSessionId = `tipper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fingerprintHash = await recordFingerprint(fpData);

    // --- Balance cap ---
    const { feePlatform, feeGateway, netAmount } = calculateFees(data.amount);
    const capCheck = await checkBalanceCap(worker.id, netAmount);
    if (!capCheck.allowed) {
      await db.auditLog.create({
        data: {
          action: "TIP_BALANCE_CAP_REJECTED",
          entity: "Tip",
          details: { workerId: worker.id, amount: data.amount, netAmount },
          ipAddress,
        },
      });
      return NextResponse.json(
        { error: "This worker's account has reached its balance limit." },
        { status: 400 }
      );
    }

    // --- Fraud scoring ---
    const fraudResult = await scoreTipTransaction({
      workerId: worker.id,
      amount: data.amount,
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
        details: { factors: fraudResult.factors, amount: data.amount },
      });
      return NextResponse.json(
        { error: "This transaction cannot be processed at this time." },
        { status: 403 }
      );
    }

    if (fraudResult.action !== "ALLOW") {
      await recordFraudEvent({
        type: "TIP_FLAGGED",
        workerId: worker.id,
        ipAddress,
        deviceId: fingerprintHash,
        riskScore: fraudResult.score,
        action: fraudResult.action,
        details: { factors: fraudResult.factors, amount: data.amount },
      });
    }

    // --- AML ---
    const amlResult = await runAmlChecks(worker.id, data.amount, "TIP");
    if (amlResult.blocked) {
      await recordFraudEvent({
        type: "AML_ALERT",
        workerId: worker.id,
        ipAddress,
        deviceId: fingerprintHash,
        riskScore: 85,
        action: "BLOCK",
        details: { alerts: amlResult.alerts, amount: data.amount, autoBlocked: true },
      });
      return NextResponse.json(
        { error: "This account has been flagged for suspicious activity." },
        { status: 403 }
      );
    }

    const paymentId = generatePaymentId();
    const appUrl = getAppUrl();

    const returnUrl = new URL(`/tip/s/${paymentId}`, appUrl);

    // Payment link valid for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    let stitch;
    try {
      stitch = await createStitchPaymentLink({
        amountZAR: data.amount,
        merchantReference: paymentId,
        payerName: "Guest",
        redirectUrl: returnUrl.toString(),
        expiresAt,
      });
    } catch (stitchErr) {
      console.error("[tips/init] Stitch error:", stitchErr);
      return NextResponse.json({ error: "Payment gateway unavailable. Please try again." }, { status: 502 });
    }

    // Create tip record
    const tip = await db.tip.create({
      data: {
        workerId: worker.id,
        amount: data.amount,
        feePlatform,
        feeGateway,
        netAmount,
        paymentId,
        paymentMethod: "stitch",
        gatewayRef: stitch.id,
        paymentLinkUrl: stitch.link,
        status: "PENDING",
      },
    });

    // Record velocity
    await recordVelocityEvent(worker.id, "TIP_RECEIVED", data.amount, ipAddress, fingerprintHash);
    await recordVelocityEvent(worker.id, "TIP_SENT", data.amount, ipAddress, fingerprintHash);

    await db.auditLog.create({
      data: {
        action: "TIP_INIT_WHATSAPP",
        entity: "Tip",
        entityId: tip.id,
        details: { workerId: worker.id, amount: data.amount, paymentLinkId: stitch.id },
        ipAddress,
      },
    });

    // Build WhatsApp deeplink — the customer opens WA with the payment link pre-filled
    const workerFirstName = worker.user.firstName;
    const workerLastName = worker.user.lastName;
    const amountFormatted = `R${data.amount.toFixed(0)}`;
    const waMessage =
      `Hi! I'd like to send ${workerFirstName} ${workerLastName} a tip of ${amountFormatted} via Slip a Tip.\n\n` +
      `Here is my secure payment link:\n${stitch.link}\n\n` +
      `Ref: ${paymentId}`;
    const waDeeplink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

    return NextResponse.json({
      success: true,
      paymentLinkUrl: stitch.link,
      whatsappUrl: waDeeplink,
      tip: { id: tip.id, paymentId: tip.paymentId },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[tips/init] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
