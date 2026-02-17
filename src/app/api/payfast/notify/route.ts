import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPayFastConfig, validateITN, verifyITNSignature } from "@/lib/payfast";
import {
  checkBalanceCap,
  createSettlementHold,
  processSettlementClears,
  recalculateReserve,
  runAmlChecks,
  recordFraudEvent,
} from "@/lib/security";

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
      const netAmount = Number(tip.netAmount);

      // --- Security: Balance cap enforcement ---
      const capCheck = await checkBalanceCap(tip.workerId, netAmount);
      if (!capCheck.allowed) {
        // Tip payment succeeded but worker is at cap — hold funds, flag for admin
        await recordFraudEvent({
          type: "BALANCE_CAP_EXCEEDED",
          workerId: tip.workerId,
          tipId: tip.id,
          riskScore: 50,
          action: "HOLD",
          details: {
            netAmount,
            currentBalance: capCheck.currentBalance,
            balanceCap: capCheck.balanceCap,
            excessAmount: capCheck.excessAmount,
          },
        });

        await db.auditLog.create({
          data: {
            action: "TIP_BALANCE_CAP_HOLD",
            entity: "Tip",
            entityId: tip.id,
            details: {
              paymentId,
              netAmount,
              currentBalance: capCheck.currentBalance,
              balanceCap: capCheck.balanceCap,
            },
          },
        });

        // Still mark tip as completed but don't credit wallet
        await db.tip.update({
          where: { id: tip.id },
          data: { status: "COMPLETED", pfPaymentId: pfPaymentId || null },
        });

        console.log(`Tip ${tip.id} completed but HELD: worker ${tip.workerId} at balance cap`);
        return new NextResponse("OK");
      }

      // --- Security: AML checks ---
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

      // --- Core transaction: mark tip completed, create ledger, credit wallet ---
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

        // Credit walletBalance (total balance) but NOT availableBalance
        // Available balance is released after settlement delay clears
        await tx.worker.update({
          where: { id: tip.workerId },
          data: {
            walletBalance: { increment: tip.netAmount },
          },
        });
      });

      // --- Security: Settlement delay (24-72h hold before funds are withdrawable) ---
      const { clearsAt } = await createSettlementHold(
        tip.id,
        tip.workerId,
        tip.netAmount,
        settlementRisk,
        isFraudHeld
      );

      // --- Security: Recalculate chargeback reserve ---
      await recalculateReserve();

      // --- Opportunistically clear any matured settlement holds ---
      await processSettlementClears();

      await db.auditLog.create({
        data: {
          action: "TIP_COMPLETED",
          entity: "Tip",
          entityId: tip.id,
          details: {
            paymentId,
            pfPaymentId,
            amountGross,
            netAmount,
            settlementClearsAt: clearsAt.toISOString(),
            settlementRisk,
            isFraudHeld,
            amlAlerts: amlResult.alerts.length,
          },
        },
      });

      console.log(`Tip ${tip.id} completed: R${netAmount} credited to worker ${tip.workerId} (settlement clears ${clearsAt.toISOString()})`);
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
