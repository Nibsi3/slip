import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { verifyWebhookSignature, verifyTransaction, refundTransaction, type PaystackWebhookEvent } from "@/lib/paystack";
import {
  checkBalanceCap,
  createSettlementHold,
  processSettlementClears,
  recalculateReserve,
  runAmlChecks,
  recordFraudEvent,
} from "@/lib/security";
import { sendChargebackNotificationEmail, sendBalanceCapOverflowEmail } from "@/lib/email";

const CARD_COOLDOWN_MINUTES = 30;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Paystack webhook: Invalid signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    let event: PaystackWebhookEvent;
    try {
      event = JSON.parse(rawBody) as PaystackWebhookEvent;
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    console.log("Paystack webhook event:", event.event, event.data?.reference);

    if (event.event === "charge.success") {
      await handleChargeSuccess(event);
    } else if (event.event === "charge.failed") {
      await handleChargeFailed(event);
    } else if (event.event === "transfer.success") {
      await handleTransferSuccess(event);
    } else if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
      await handleTransferFailedOrReversed(event);
    } else if (event.event === "charge.dispute.create") {
      await handleDisputeCreate(event);
    } else if (event.event === "charge.dispute.resolve") {
      await handleDisputeResolve(event);
    }

    return new NextResponse("OK");
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

async function handleChargeSuccess(event: PaystackWebhookEvent) {
  const reference = event.data.reference;
  const amountKobo = event.data.amount;
  const amountZAR = amountKobo / 100;

  if (!reference) {
    console.error("Paystack charge.success: missing reference");
    return;
  }

  const tip = await db.tip.findUnique({ where: { paymentId: reference } });
  if (!tip) {
    console.error("Paystack charge.success: Tip not found for reference", reference);
    return;
  }

  if (tip.status === "COMPLETED") {
    return;
  }

  const expectedAmount = Number(Number(tip.amount).toFixed(2));
  const receivedAmount = Number(amountZAR.toFixed(2));
  if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
    console.error("Paystack charge.success: Amount mismatch", { receivedAmount, expectedAmount });
    await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });
    return;
  }

  // Verify the transaction directly with Paystack
  const verified = await verifyTransaction(reference);
  if (!verified || verified.status !== "success") {
    console.error("Paystack charge.success: Verification failed for", reference);
    await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });
    return;
  }

  const netAmount = Number(tip.netAmount);
  const paystackRef = `Paystack ${verified.id}`;

  // --- Security: Card cooldown (30 min per card per worker) ---
  const auth = verified.authorization;
  if (auth?.bin && auth?.last4) {
    const cardFingerprint = crypto
      .createHash("sha256")
      .update(`${auth.bin}:${auth.last4}:${auth.exp_month}:${auth.exp_year}`)
      .digest("hex");

    const cooldownSince = new Date(Date.now() - CARD_COOLDOWN_MINUTES * 60 * 1000);
    const recentCardTip = await db.velocityRecord.findFirst({
      where: {
        workerId: tip.workerId,
        action: "CARD_TIP",
        deviceId: cardFingerprint,
        createdAt: { gte: cooldownSince },
      },
    });

    if (recentCardTip) {
      const cooldownEndsAt = new Date(recentCardTip.createdAt.getTime() + CARD_COOLDOWN_MINUTES * 60 * 1000);
      const minutesLeft = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 60000);

      await recordFraudEvent({
        type: "DUPLICATE_CARD",
        workerId: tip.workerId,
        tipId: tip.id,
        riskScore: 70,
        action: "BLOCK",
        details: {
          cardFingerprint,
          cooldownMinutes: CARD_COOLDOWN_MINUTES,
          minutesRemaining: minutesLeft,
          reference,
        },
      });

      await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });

      // Auto-refund the customer — they paid but the tip is blocked
      const refundResult = await refundTransaction({ transactionId: verified.id, amount: Number(tip.amount) });
      if (refundResult) {
        console.log(`Card cooldown: auto-refunded tip ${tip.id} (refundId: ${refundResult.refundId})`);
      } else {
        console.error(`Card cooldown: FAILED to auto-refund tip ${tip.id} — manual refund required`);
      }

      await db.auditLog.create({
        data: {
          action: "CARD_COOLDOWN_REFUND",
          entity: "Tip",
          entityId: tip.id,
          details: {
            reference,
            cardFingerprint,
            minutesRemaining: minutesLeft,
            refundStatus: refundResult?.status ?? "FAILED",
            refundId: refundResult?.refundId ?? null,
          },
        },
      });

      console.log(`Card cooldown active for tip ${tip.id} — ${minutesLeft}min remaining`);
      return;
    }

    // Record successful card use for cooldown tracking
    await db.velocityRecord.create({
      data: {
        workerId: tip.workerId,
        action: "CARD_TIP",
        amount: tip.amount,
        deviceId: cardFingerprint,
        metadata: {
          reference,
          bin: auth.bin,
          last4: auth.last4,
          cardType: auth.card_type,
          bank: auth.bank,
        },
      },
    });
  }

  // --- Security: Balance cap enforcement ---
  const capCheck = await checkBalanceCap(tip.workerId, netAmount);
  if (!capCheck.allowed) {
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
          reference,
          netAmount,
          currentBalance: capCheck.currentBalance,
          balanceCap: capCheck.balanceCap,
        },
      },
    });

    await db.tip.update({
      where: { id: tip.id },
      data: { status: "COMPLETED", paystackRef: paystackRef },
    });

    // Alert admin — funds are held and need manual action
    const capWorkerUser = await db.user.findFirst({ where: { worker: { id: tip.workerId } } });
    await sendBalanceCapOverflowEmail({
      workerName: capWorkerUser ? `${capWorkerUser.firstName} ${capWorkerUser.lastName}` : tip.workerId,
      workerId: tip.workerId,
      tipPaymentId: reference,
      netAmount,
      currentBalance: capCheck.currentBalance,
      balanceCap: capCheck.balanceCap,
    });

    console.log(`Tip ${tip.id} completed but HELD: worker ${tip.workerId} at balance cap`);
    return;
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

  // --- P2.2: Chargeback debt deduction ---
  // Fetch current chargeback debt and deduct from incoming net amount before crediting
  const workerForDebt = await db.worker.findUnique({
    where: { id: tip.workerId },
    select: { chargebackDebt: true },
  });
  const existingDebt = Number(workerForDebt?.chargebackDebt ?? 0);
  const debtDeduction = Math.min(existingDebt, netAmount);
  const creditAmount = netAmount - debtDeduction;

  // --- Core transaction: mark tip completed, create ledger, credit wallet ---
  await db.$transaction(async (tx) => {
    await tx.tip.update({
      where: { id: tip.id },
      data: {
        status: "COMPLETED",
        paystackRef: paystackRef,
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
        reference: paystackRef,
        tipId: tip.id,
      },
    });

    // Credit walletBalance (total) but NOT availableBalance
    // Available balance is released after settlement delay clears
    // Deduct any outstanding chargeback debt first
    await tx.worker.update({
      where: { id: tip.workerId },
      data: {
        walletBalance: { increment: creditAmount },
        chargebackDebt: { decrement: debtDeduction },
      },
    });

    // Record the debt deduction as a separate ledger entry if applicable
    if (debtDeduction > 0) {
      await tx.ledgerEntry.create({
        data: {
          workerId: tip.workerId,
          transactionType: "CHARGEBACK",
          amount: debtDeduction,
          feePlatform: 0,
          feeGateway: 0,
          netAmount: -debtDeduction,
          status: "COMPLETED",
          reference: `Chargeback debt recovery from tip ${tip.paymentId}`,
        },
      });
    }
  });

  // --- Settlement delay ---
  const { clearsAt } = await createSettlementHold(
    tip.id,
    tip.workerId,
    tip.netAmount,
    settlementRisk,
    isFraudHeld
  );

  // --- Chargeback reserve ---
  await recalculateReserve();

  // --- Opportunistically clear matured holds ---
  await processSettlementClears();

  await db.auditLog.create({
    data: {
      action: "TIP_COMPLETED",
      entity: "Tip",
      entityId: tip.id,
      details: {
        reference,
        paystackRef,
        amountZAR,
        netAmount,
        settlementClearsAt: clearsAt.toISOString(),
        settlementRisk,
        isFraudHeld,
        amlAlerts: amlResult.alerts.length,
      },
    },
  });

  console.log(
    `Tip ${tip.id} completed: R${netAmount} credited to worker ${tip.workerId} (clears ${clearsAt.toISOString()})`
  );
}

async function handleChargeFailed(event: PaystackWebhookEvent) {
  const reference = event.data.reference;
  if (!reference) return;

  const tip = await db.tip.findUnique({ where: { paymentId: reference } });
  if (!tip || tip.status !== "PENDING") return;

  await db.tip.update({ where: { id: tip.id }, data: { status: "FAILED" } });
  console.log(`Tip ${tip.id} failed: ${reference}`);
}

async function handleTransferSuccess(event: PaystackWebhookEvent) {
  const transferCode = event.data.transfer_code;
  const reference = event.data.reference;
  if (!transferCode && !reference) return;

  const withdrawal = await db.withdrawal.findFirst({
    where: {
      OR: [
        ...(transferCode ? [{ reference: transferCode }] : []),
        ...(reference ? [{ reference: reference }] : []),
      ],
      status: "PROCESSING",
    },
  });

  if (!withdrawal) {
    console.log("Paystack transfer.success: No matching withdrawal for", transferCode || reference);
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "COMPLETED",
        reference: transferCode || reference || withdrawal.reference,
        processedAt: new Date(),
      },
    });

    const ledger = await tx.ledgerEntry.findFirst({ where: { withdrawalId: withdrawal.id } });
    if (ledger) {
      await tx.ledgerEntry.update({
        where: { id: ledger.id },
        data: { status: "COMPLETED", reference: transferCode || reference || "" },
      });
    }
  });

  await recalculateReserve();

  await db.auditLog.create({
    data: {
      action: "WITHDRAWAL_COMPLETED",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      details: { transferCode, reference, via: "paystack_webhook" },
    },
  });

  console.log(`Withdrawal ${withdrawal.id} completed via Paystack transfer webhook`);
}

async function handleTransferFailedOrReversed(event: PaystackWebhookEvent) {
  const transferCode = event.data.transfer_code;
  const reference = event.data.reference;
  if (!transferCode && !reference) return;

  const withdrawal = await db.withdrawal.findFirst({
    where: {
      OR: [
        ...(transferCode ? [{ reference: transferCode }] : []),
        ...(reference ? [{ reference: reference }] : []),
      ],
      status: "PROCESSING",
    },
  });

  if (!withdrawal) return;

  await db.$transaction(async (tx) => {
    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "FAILED",
        reference: `${event.event}: ${transferCode || reference}`,
      },
    });

    const ledger = await tx.ledgerEntry.findFirst({ where: { withdrawalId: withdrawal.id } });
    if (ledger) {
      await tx.ledgerEntry.update({ where: { id: ledger.id }, data: { status: "FAILED" } });
    }

    // Refund both balances
    await tx.worker.update({
      where: { id: withdrawal.workerId },
      data: {
        walletBalance: { increment: withdrawal.amount },
        availableBalance: { increment: withdrawal.amount },
      },
    });
  });

  await db.auditLog.create({
    data: {
      action: "WITHDRAWAL_FAILED_WEBHOOK",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      details: { event: event.event, transferCode, reference },
    },
  });

  console.log(`Withdrawal ${withdrawal.id} failed/reversed via Paystack webhook — balance refunded`);
}

async function handleDisputeCreate(event: PaystackWebhookEvent) {
  const reference = event.data.reference;
  if (!reference) return;

  const tip = await db.tip.findUnique({ where: { paymentId: reference } });
  if (!tip) {
    console.log("Paystack dispute: No tip found for reference", reference);
    return;
  }

  const disputeAmount = (event.data.amount || 0) / 100;
  const worker = await db.worker.findUnique({ where: { id: tip.workerId } });
  if (!worker) return;

  const currentBalance = Number(worker.walletBalance);
  const chargebackDebt = Number(worker.chargebackDebt ?? 0);

  if (currentBalance >= disputeAmount) {
    // Deduct from balance immediately
    await db.$transaction(async (tx) => {
      await tx.worker.update({
        where: { id: tip.workerId },
        data: {
          walletBalance: { decrement: disputeAmount },
          availableBalance: { decrement: Math.min(disputeAmount, Number(worker.availableBalance)) },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          workerId: tip.workerId,
          transactionType: "CHARGEBACK",
          amount: disputeAmount,
          feePlatform: 0,
          feeGateway: 0,
          netAmount: -disputeAmount,
          status: "COMPLETED",
          reference: `Dispute: ${reference}`,
          tipId: tip.id,
        },
      });
    });
  } else {
    // Insufficient balance — set chargeback debt
    const shortfall = disputeAmount - currentBalance;
    await db.$transaction(async (tx) => {
      await tx.worker.update({
        where: { id: tip.workerId },
        data: {
          walletBalance: 0,
          availableBalance: 0,
          chargebackDebt: chargebackDebt + shortfall,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          workerId: tip.workerId,
          transactionType: "CHARGEBACK",
          amount: disputeAmount,
          feePlatform: 0,
          feeGateway: 0,
          netAmount: -disputeAmount,
          status: "COMPLETED",
          reference: `Dispute (partial): ${reference}`,
          tipId: tip.id,
        },
      });
    });
  }

  await recordFraudEvent({
    type: "CHARGEBACK",
    workerId: tip.workerId,
    tipId: tip.id,
    riskScore: 60,
    action: "HOLD",
    details: { reference, disputeAmount, event: "charge.dispute.create" },
  });

  await db.auditLog.create({
    data: {
      action: "CHARGEBACK_RECEIVED",
      entity: "Tip",
      entityId: tip.id,
      details: { reference, disputeAmount, workerBalance: currentBalance },
    },
  });

  // Notify admin
  const workerUser = await db.user.findFirst({ where: { worker: { id: tip.workerId } } });
  await sendChargebackNotificationEmail({
    workerName: workerUser ? `${workerUser.firstName} ${workerUser.lastName}` : tip.workerId,
    tipPaymentId: reference,
    disputeAmount,
  });

  console.log(`Chargeback received for tip ${tip.id}: R${disputeAmount}`);
}

async function handleDisputeResolve(event: PaystackWebhookEvent) {
  const reference = event.data.reference;
  if (!reference) return;

  const tip = await db.tip.findUnique({ where: { paymentId: reference } });
  if (!tip) return;

  const resolvedInOurFavour = (event.data as unknown as Record<string, unknown>).resolution === "merchant-accepted";
  const disputeAmount = (event.data.amount || 0) / 100;

  if (resolvedInOurFavour) {
    // Refund the worker
    await db.$transaction(async (tx) => {
      await tx.worker.update({
        where: { id: tip.workerId },
        data: {
          walletBalance: { increment: disputeAmount },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          workerId: tip.workerId,
          transactionType: "CHARGEBACK_REVERSAL",
          amount: disputeAmount,
          feePlatform: 0,
          feeGateway: 0,
          netAmount: disputeAmount,
          status: "COMPLETED",
          reference: `Dispute resolved in our favour: ${reference}`,
          tipId: tip.id,
        },
      });
    });
  }

  await db.auditLog.create({
    data: {
      action: "CHARGEBACK_RESOLVED",
      entity: "Tip",
      entityId: tip.id,
      details: { reference, disputeAmount, resolvedInOurFavour },
    },
  });

  console.log(`Dispute resolved for tip ${tip.id}: ${resolvedInOurFavour ? "in our favour" : "against us"}`);
}
