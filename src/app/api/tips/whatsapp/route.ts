import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPaymentLink, normalisePhone } from "@/lib/whatsapp";
import { createTip, tipFactoryErrorMessage } from "@/lib/tip-factory";

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

    const outcome = await createTip(request, {
      qrCode: data.qrCode,
      amount: data.amount,
      customerName: data.customerName,
      customerPhone: normalisePhone(data.customerPhone),
      customerMessage: data.customerMessage,
      fingerprintFields: { platform: data.platform, screenRes: data.screenRes, timezone: data.timezone },
      linkTtlMs: 24 * 60 * 60 * 1000,
      returnPath: `/tip/success`,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: tipFactoryErrorMessage(outcome.error) },
        { status: outcome.error.status }
      );
    }

    const { tip, stitch, worker } = outcome.result;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const workerName = `${worker.firstName} ${worker.lastName}`;

    // Send the WhatsApp payment link
    const waResult = await sendPaymentLink({
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      workerFirstName: worker.firstName,
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
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[tips/whatsapp] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
