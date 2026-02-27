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
} from "@/lib/security";

const tipSchema = z.object({
  qrCode: z.string().min(1),
  amount: z.number().min(5).max(5000),
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

    // --- Record velocity event ---
    await recordVelocityEvent(worker.id, "TIP_RECEIVED", data.amount, ipAddress, fingerprintHash);
    await recordVelocityEvent(worker.id, "TIP_SENT", data.amount, ipAddress, fingerprintHash);

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

    const workerName = `${worker.user.firstName} ${worker.user.lastName}`;

    const returnUrl = new URL(`/tip/${data.qrCode}/thank-you`, appUrl);
    returnUrl.searchParams.set("amount", data.amount.toString());
    returnUrl.searchParams.set("name", workerName);

    const cancelUrl = new URL(`/tip/${data.qrCode}`, appUrl);
    cancelUrl.searchParams.set("cancelled", "true");

    const paystack = await initializeTransaction({
      paymentId: tip.paymentId,
      amount: data.amount,
      itemName: `Tip for ${workerName}`,
      workerName,
      returnUrl: returnUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    return NextResponse.json({
      tip: { id: tip.id, paymentId: tip.paymentId },
      paystack,
      fraudScore: fraudResult.score,
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
