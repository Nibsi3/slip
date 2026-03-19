import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTip, tipFactoryErrorMessage } from "@/lib/tip-factory";

const tipSchema = z.object({
  qrCode: z.string().min(1),
  amount: z.number().min(15).max(5000),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerMessage: z.string().max(200).optional(),
  platform: z.string().optional(),
  screenRes: z.string().optional(),
  timezone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = tipSchema.parse(body);

    const outcome = await createTip(request, {
      qrCode: data.qrCode,
      amount: data.amount,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerMessage: data.customerMessage,
      fingerprintFields: { platform: data.platform, screenRes: data.screenRes, timezone: data.timezone },
      linkTtlMs: 30 * 60 * 1000,
      returnPath: `/tip/success`,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: tipFactoryErrorMessage(outcome.error) },
        { status: outcome.error.status }
      );
    }

    const { tip, stitch } = outcome.result;
    return NextResponse.json({
      tip: { id: tip.id, paymentId: tip.paymentId },
      stitch: { paymentUrl: stitch.link, paymentLinkId: stitch.id },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("[POST /api/tips] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
