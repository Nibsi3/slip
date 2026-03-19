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
import { createTip, tipFactoryErrorMessage } from "@/lib/tip-factory";

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

    const outcome = await createTip(request, {
      qrCode: data.qrCode,
      amount: data.amount,
      fingerprintFields: { platform: data.platform, screenRes: data.screenRes, timezone: data.timezone },
      linkTtlMs: 24 * 60 * 60 * 1000,
      returnPath: `/tip/s`,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: tipFactoryErrorMessage(outcome.error) },
        { status: outcome.error.status }
      );
    }

    const { tip, stitch, worker } = outcome.result;

    await db.auditLog.create({
      data: {
        action: "TIP_INIT_WHATSAPP",
        entity: "Tip",
        entityId: tip.id,
        details: { workerId: worker.id, amount: data.amount, paymentLinkId: stitch.id },
        ipAddress,
      },
    });

    const amountFormatted = `R${data.amount.toFixed(0)}`;
    const waMessage =
      `Hi! I'd like to send ${worker.firstName} ${worker.lastName} a tip of ${amountFormatted} via Slip a Tip.\n\n` +
      `Here is my secure payment link:\n${stitch.link}\n\n` +
      `Ref: ${tip.paymentId}`;
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
