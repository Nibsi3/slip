import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generatePayFastForm } from "@/lib/payfast";
import { generatePaymentId, calculateFees, getAppUrl } from "@/lib/utils";

const tipSchema = z.object({
  qrCode: z.string().min(1),
  amount: z.number().min(5).max(5000),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerMessage: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = tipSchema.parse(body);

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

    const paymentId = generatePaymentId();
    const { feePlatform, feeGateway, netAmount } = calculateFees(data.amount);
    const appUrl = getAppUrl();

    const tip = await db.tip.create({
      data: {
        workerId: worker.id,
        amount: data.amount,
        feePlatform,
        feeGateway,
        netAmount,
        paymentId,
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

    const notifyUrl = new URL(`/api/payfast/notify`, appUrl);
    const payfast = generatePayFastForm({
      paymentId: tip.paymentId,
      amount: data.amount,
      itemName: `Tip for ${workerName}`,
      workerName,
      returnUrl: returnUrl.toString().replace(/\+/g, "%20"),
      cancelUrl: cancelUrl.toString(),
      notifyUrl: notifyUrl.toString(),
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    return NextResponse.json({ tip: { id: tip.id, paymentId: tip.paymentId }, payfast });
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
