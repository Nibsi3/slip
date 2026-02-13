import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPayFastConfig, validateITN, verifyITNSignature } from "@/lib/payfast";

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();

    const searchParams = new URLSearchParams(text);
    const params: Record<string, string> = {};
    for (const [k, v] of searchParams.entries()) {
      params[k] = v;
    }

    console.log("PayFast ITN:", params.m_payment_id, params.payment_status, params.amount_gross);

    const signature = params.signature || "";

    if (!verifyITNSignature(text, signature)) {
      console.error("PayFast ITN: Invalid signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const cfg = getPayFastConfig();

    if (params.merchant_id && params.merchant_id !== cfg.merchantId) {
      console.error("PayFast ITN: Merchant ID mismatch", params.merchant_id);
      return new NextResponse("Merchant mismatch", { status: 400 });
    }

    // Skip server-to-server validation for sandbox (can be unreliable)
    if (!cfg.sandbox) {
      const isValid = await validateITN(text, "payfast");
      if (!isValid) {
        console.error("PayFast ITN: Validation failed");
        return new NextResponse("Validation failed", { status: 400 });
      }
    }

    const paymentId = params.m_payment_id;
    const paymentStatus = params.payment_status;
    const pfPaymentId = params.pf_payment_id;
    const amountGross = parseFloat(params.amount_gross || "0");

    if (!paymentId) {
      return new NextResponse("Missing payment ID", { status: 400 });
    }

    const tip = await db.tip.findUnique({ where: { paymentId } });
    if (!tip) {
      console.error("PayFast ITN: Tip not found for payment", paymentId);
      return new NextResponse("Tip not found", { status: 404 });
    }

    if (tip.status === "COMPLETED") {
      return new NextResponse("OK");
    }

    if (amountGross && Number(amountGross.toFixed(2)) !== Number(Number(tip.amount).toFixed(2))) {
      console.error("PayFast ITN: Amount mismatch", { amountGross, expected: tip.amount });
      return new NextResponse("Amount mismatch", { status: 400 });
    }

    if (paymentStatus === "COMPLETE") {
      await db.$transaction(async (tx) => {
        await tx.tip.update({
          where: { id: tip.id },
          data: {
            status: "COMPLETED",
            pfPaymentId: pfPaymentId || null,
          },
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
            reference: `PayFast ${pfPaymentId || paymentId}`,
            tipId: tip.id,
          },
        });

        await tx.worker.update({
          where: { id: tip.workerId },
          data: {
            walletBalance: { increment: tip.netAmount },
          },
        });
      });

      await db.auditLog.create({
        data: {
          action: "TIP_COMPLETED",
          entity: "Tip",
          entityId: tip.id,
          details: {
            paymentId,
            pfPaymentId,
            amountGross,
            netAmount: Number(tip.netAmount),
          },
        },
      });

      console.log(`Tip ${tip.id} completed: R${Number(tip.netAmount)} credited to worker ${tip.workerId}`);
    } else if (paymentStatus === "CANCELLED") {
      await db.tip.update({
        where: { id: tip.id },
        data: { status: "CANCELLED" },
      });
    } else {
      await db.tip.update({
        where: { id: tip.id },
        data: { status: "FAILED" },
      });
    }

    return new NextResponse("OK");
  } catch (err) {
    console.error("PayFast ITN error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
