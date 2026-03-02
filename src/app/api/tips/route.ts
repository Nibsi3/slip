import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";
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

const tipSchema = z.object({
  qrCode: z.string().min(1),
  amount: z.number().min(15).max(5000),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerMessage: z.string().max(200).optional(),
  // Device fingerprint fields (optional, sent by client)
  platform: z.string().optional(),
  screenRes: z.string().optional(),
  timezone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = tipSchema.parse(body);

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      request.headers.get("x-real-ip") || "unknown";

    const worker = await db.worker.findUnique({
      where: { qrCode: data.qrCode, isActive: true },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found or inactive" },
        { status: 404 }
      );
    }

    // --- Security: Velocity check (per sending IP) ---
    const sentVelocity = await checkTipSentVelocity(ipAddress);
    if (!sentVelocity.allowed) {
      return NextResponse.json(
        { error: sentVelocity.reason || "Too many tips from this network. Please try again later." },
        { status: 429 }
      );
    }

    // --- Security: Velocity check (per receiving worker) ---
    const receivedVelocity = await checkTipReceivedVelocity(worker.id);
    if (!receivedVelocity.allowed) {
      return NextResponse.json(
        { error: "This worker is temporarily unable to receive tips. Please try again later." },
        { status: 429 }
      );
    }

    // --- Security: Per-tipper to per-worker velocity (max 2 tips/day to same worker) ---
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

    // Record fraud event if flagged or held (but still allow tip creation)
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

    // --- Security: AML pre-check — auto-block on HIGH/CRITICAL ---
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
        { error: "This account has been flagged for suspicious activity. Please contact support to resolve this." },
        { status: 403 }
      );
    }

    const paymentId = generatePaymentId();
    const appUrl = getAppUrl();

    const tip = await db.tip.create({
      data: {
        workerId: worker.id,
        amount: data.amount,
        feePlatform,
        feeGateway,
        netAmount,
        paymentId,
        paymentMethod: "paystack",
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerMessage: data.customerMessage,
        status: "PENDING",
      },
    });

    // --- Record velocity events after tip is persisted ---
    await recordVelocityEvent(worker.id, "TIP_RECEIVED", data.amount, ipAddress, fingerprintHash);
    await recordVelocityEvent(ipAddress, "TIP_SENT", data.amount, ipAddress, fingerprintHash);

    const workerName = `${worker.user.firstName} ${worker.user.lastName}`;

    const returnUrl = new URL(`/tip/success`, appUrl);
    returnUrl.searchParams.set("reference", tip.paymentId);

    const cancelUrl = new URL(`/tip/failed`, appUrl);
    cancelUrl.searchParams.set("reference", tip.paymentId);

    const paystack = await initializeTransaction({
      paymentId: tip.paymentId,
      amount: data.amount,
      itemName: `Tip for ${workerName}`,
      workerName,
      returnUrl: returnUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      customerEmail: data.customerEmail || `tip+${tip.paymentId}@slipatip.co.za`,
      customerName: data.customerName,
    });

    return NextResponse.json({
      tip: { id: tip.id, paymentId: tip.paymentId },
      paystack,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Create tip error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
