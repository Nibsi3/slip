import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createStitchPaymentLink } from "@/lib/stitch";
import { generatePaymentId, calculateFees, getAppUrl } from "@/lib/utils";
import { sendPaymentLink, normalisePhone } from "@/lib/whatsapp";
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
  customerPhone: z.string().min(6).max(20),
  customerName: z.string().max(100).optional(),
  customerMessage: z.string().max(200).optional(),
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
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found or inactive" },
        { status: 404 }
      );
    }

    // --- Security: Velocity checks ---
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
        { error: "This worker is temporarily unable to receive tips. Please try again later." },
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

    // --- Security: Device fingerprinting ---
    const fpData = extractFingerprintFromRequest(request.headers, body);
    fpData.tipperSessionId = `tipper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fingerprintHash = await recordFingerprint(fpData);

    // --- Security: Balance cap pre-check ---
    const { feePlatform, feeGateway, netAmount } = calculateFees(data.amount);
    const capCheck = await checkBalanceCap(worker.id, netAmount);
    if (!capCheck.allowed) {
      await db.auditLog.create({
        data: {
          action: "TIP_BALANCE_CAP_REJECTED",
          entity: "Tip",
          details: {
            workerId: worker.id,
            amount: data.amount,
            netAmount,
            currentBalance: capCheck.currentBalance,
            balanceCap: capCheck.balanceCap,
          },
          ipAddress,
        },
      });
      return NextResponse.json(
        { error: "This worker's account has reached its balance limit. Please try again later." },
        { status: 400 }
      );
    }

    // --- Security: Fraud scoring ---
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

    // --- Security: AML pre-check ---
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
        { error: "This account has been flagged for suspicious activity. Please contact support." },
        { status: 403 }
      );
    }

    const paymentId = generatePaymentId();
    const appUrl = getAppUrl();

    // Payment link expires in 24 hours (WhatsApp window)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const returnUrl = new URL(`/tip/success`, appUrl);
    returnUrl.searchParams.set("reference", paymentId);

    const workerName = `${worker.user.firstName} ${worker.user.lastName}`;

    let stitch;
    try {
      stitch = await createStitchPaymentLink({
        amountZAR: data.amount,
        merchantReference: paymentId,
        payerName: data.customerName,
        payerPhone: normalisePhone(data.customerPhone),
        redirectUrl: returnUrl.toString(),
        expiresAt,
      });
    } catch (stitchErr) {
      console.error("[tips/whatsapp] Stitch link creation failed:", stitchErr);
      return NextResponse.json(
        { error: "Payment gateway unavailable. Please try again." },
        { status: 502 }
      );
    }

    // Create the tip record with phone + payment link URL
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
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerMessage: data.customerMessage,
        paymentLinkUrl: stitch.link,
        status: "PENDING",
      },
    });

    // Send the WhatsApp message
    const waResult = await sendPaymentLink({
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      workerFirstName: worker.user.firstName,
      paymentLinkUrl: stitch.link,
      amountZAR: data.amount,
      paymentId: tip.paymentId,
      expiresInHours: 24,
    });

    if (waResult) {
      await db.tip.update({
        where: { id: tip.id },
        data: { whatsappLinkSentAt: new Date() },
      });
    } else {
      console.warn(`[tips/whatsapp] WhatsApp send failed for tip ${tip.id} — tip still created`);
    }

    // Record velocity events
    await recordVelocityEvent(worker.id, "TIP_RECEIVED", data.amount, ipAddress, fingerprintHash);
    await recordVelocityEvent(worker.id, "TIP_SENT", data.amount, ipAddress, fingerprintHash);

    await db.auditLog.create({
      data: {
        action: "TIP_WHATSAPP_LINK_SENT",
        entity: "Tip",
        entityId: tip.id,
        details: {
          workerId: worker.id,
          workerName,
          amount: data.amount,
          customerPhone: data.customerPhone,
          whatsappSent: !!waResult,
          paymentLinkId: stitch.id,
          expiresAt,
        },
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      tip: { id: tip.id, paymentId: tip.paymentId },
      whatsappSent: !!waResult,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("[tips/whatsapp] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
