import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { processPayout } from "@/lib/payouts";
import {
  scoreWithdrawalTransaction,
  recordFraudEvent,
  recordVelocityEvent,
  checkWithdrawalVelocity,
  getAvailableBalance,
  processSettlementClears,
  recalculateReserve,
  isWithdrawalSafeForReserve,
  runAmlChecks,
  MAX_WITHDRAWAL_PER_TX_ZAR,
  getWithdrawalDailyCap,
  WITHDRAWAL_FEE_PERCENT,
} from "@/lib/security";

const withdrawSchema = z.object({
  amount: z.number().min(100),
  method: z.literal("EFT"),
  bankName: z.string().min(1, "Bank name is required"),
  bankAccountNo: z.string().min(1, "Account number is required"),
  bankBranchCode: z.string().optional(),
  bankCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const body = await request.json();
    const data = withdrawSchema.parse(body);

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      request.headers.get("x-real-ip") || "unknown";

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // --- Document verification gate ---
    if (worker.docStatus !== "APPROVED") {
      const msg = worker.docStatus === "PENDING_REVIEW"
        ? "Your documents are still under review. You can withdraw once verified."
        : worker.docStatus === "REJECTED"
          ? "Your documents were rejected. Please re-upload from Dashboard → Documents."
          : "You must upload and verify your documents before withdrawing. Go to Dashboard → Documents.";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    // --- Security: Per-transaction limit ---
    if (data.amount > MAX_WITHDRAWAL_PER_TX_ZAR) {
      return NextResponse.json(
        { error: `Maximum withdrawal per transaction is R${MAX_WITHDRAWAL_PER_TX_ZAR}` },
        { status: 400 }
      );
    }

    // --- Security: Process any matured settlement holds first ---
    await processSettlementClears();

    // --- Security: Check AVAILABLE (cleared) balance, not total wallet ---
    const availableBalance = await getAvailableBalance(worker.id);
    if (availableBalance < data.amount) {
      const totalBalance = Number(worker.walletBalance);
      const pendingAmount = totalBalance - availableBalance;
      return NextResponse.json(
        {
          error: `Insufficient cleared funds. Available: R${availableBalance.toFixed(2)}` +
            (pendingAmount > 0 ? ` (R${pendingAmount.toFixed(2)} still settling)` : ""),
        },
        { status: 400 }
      );
    }

    // --- Security: Velocity limits (daily withdrawal count & amount) ---
    const velocityCheck = await checkWithdrawalVelocity(worker.id, data.amount);
    if (!velocityCheck.allowed) {
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_VELOCITY_BLOCKED",
          entity: "Withdrawal",
          details: {
            amount: data.amount,
            reason: velocityCheck.reason,
            counts: velocityCheck.counts,
          },
          ipAddress,
        },
      });
      return NextResponse.json({ error: velocityCheck.reason }, { status: 429 });
    }

    // --- Security: Chargeback reserve check ---
    const reserveCheck = await isWithdrawalSafeForReserve(data.amount);
    if (!reserveCheck.safe) {
      return NextResponse.json(
        { error: "Withdrawal temporarily unavailable due to platform reserve requirements. Please try a smaller amount." },
        { status: 400 }
      );
    }

    // --- Security: Fraud scoring ---
    const fraudResult = await scoreWithdrawalTransaction({
      workerId: worker.id,
      amount: data.amount,
      ipAddress,
    });

    if (fraudResult.blocked) {
      await recordFraudEvent({
        type: "WITHDRAWAL_FLAGGED",
        workerId: worker.id,
        ipAddress,
        riskScore: fraudResult.score,
        action: "BLOCK",
        details: { factors: fraudResult.factors, amount: data.amount },
      });
      return NextResponse.json(
        { error: "This withdrawal cannot be processed at this time. Please contact support." },
        { status: 403 }
      );
    }

    if (fraudResult.action === "HOLD") {
      await recordFraudEvent({
        type: "WITHDRAWAL_FLAGGED",
        workerId: worker.id,
        ipAddress,
        riskScore: fraudResult.score,
        action: "HOLD",
        details: { factors: fraudResult.factors, amount: data.amount },
      });
      return NextResponse.json(
        { error: "This withdrawal requires additional review. It has been queued for processing." },
        { status: 202 }
      );
    }

    if (fraudResult.action === "FLAG") {
      await recordFraudEvent({
        type: "WITHDRAWAL_FLAGGED",
        workerId: worker.id,
        ipAddress,
        riskScore: fraudResult.score,
        action: "FLAG",
        details: { factors: fraudResult.factors, amount: data.amount },
      });
    }

    // --- Security: AML checks ---
    const amlResult = await runAmlChecks(worker.id, data.amount, "WITHDRAWAL");
    if (amlResult.hasAlerts && (amlResult.highestRiskLevel === "CRITICAL" || amlResult.highestRiskLevel === "HIGH")) {
      await recordFraudEvent({
        type: "AML_ALERT",
        workerId: worker.id,
        ipAddress,
        riskScore: 70,
        action: "HOLD",
        details: { alerts: amlResult.alerts, amount: data.amount },
      });
      return NextResponse.json(
        { error: "This withdrawal requires additional compliance review." },
        { status: 202 }
      );
    }

    if (!data.bankName || !data.bankAccountNo) {
      return NextResponse.json(
        { error: "Bank details required for EFT withdrawal" },
        { status: 400 }
      );
    }

    const fee = Number((data.amount * WITHDRAWAL_FEE_PERCENT).toFixed(2));
    const netAmount = Number((data.amount - fee).toFixed(2));
    const bank = data.bankName || worker.bankName || "";
    const accountNo = data.bankAccountNo || worker.bankAccountNo || "";
    const branchCode = data.bankBranchCode || worker.bankBranchCode || "";
    const bankCode = data.bankCode || "";

    // Step 1: Create withdrawal + deduct BOTH walletBalance and availableBalance atomically
    const withdrawal = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const w = await tx.withdrawal.create({
        data: {
          workerId: worker.id,
          amount: data.amount,
          fee,
          netAmount,
          method: data.method,
          status: "PROCESSING",
          bankName: bank,
          bankAccountNo: accountNo,
          bankBranchCode: branchCode,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          workerId: worker.id,
          transactionType: "PAYOUT",
          amount: new Decimal(data.amount),
          feePlatform: new Decimal(fee),
          feeGateway: new Decimal(0),
          netAmount: new Decimal(netAmount),
          status: "PENDING",
          reference: `Withdrawal ${w.id}`,
          withdrawalId: w.id,
        },
      });

      await tx.worker.update({
        where: { id: worker.id },
        data: {
          walletBalance: { decrement: data.amount },
          availableBalance: { decrement: data.amount },
        },
      });

      return w;
    });

    // Step 2: Auto-process payout via provider
    const recipientName = `${worker.user.firstName} ${worker.user.lastName}`;
    const payoutResult = await processPayout({
      withdrawalId: withdrawal.id,
      method: data.method,
      amount: netAmount,
      bankName: bank,
      bankAccountNo: accountNo,
      bankBranchCode: branchCode,
      bankCode: bankCode || undefined,
      recipientName,
    });

    if (payoutResult.success) {
      // --- Record velocity event only after successful payout ---
      await recordVelocityEvent(worker.id, "WITHDRAWAL", data.amount, ipAddress);

      // Payout succeeded → mark COMPLETED, store voucher/reference
      await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: "COMPLETED",
            reference: payoutResult.reference,
            processedAt: new Date(),
          },
        });

        const ledger = await tx.ledgerEntry.findFirst({
          where: { withdrawalId: withdrawal.id },
        });
        if (ledger) {
          await tx.ledgerEntry.update({
            where: { id: ledger.id },
            data: { status: "COMPLETED", reference: payoutResult.reference },
          });
        }
      });

      // --- Security: Recalculate chargeback reserve after withdrawal ---
      await recalculateReserve();

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_COMPLETED",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          details: {
            amount: data.amount,
            method: data.method,
            netAmount,
            reference: payoutResult.reference,
            providerRef: payoutResult.providerRef,
            fraudScore: fraudResult.score,
          },
          ipAddress,
        },
      });

      const updated = await db.withdrawal.findUnique({ where: { id: withdrawal.id } });
      return NextResponse.json({ withdrawal: updated });
    } else {
      // Payout failed → refund BOTH walletBalance and availableBalance, mark FAILED
      await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: "FAILED", reference: payoutResult.error || "Payout failed" },
        });

        const ledger = await tx.ledgerEntry.findFirst({
          where: { withdrawalId: withdrawal.id },
        });
        if (ledger) {
          await tx.ledgerEntry.update({
            where: { id: ledger.id },
            data: { status: "FAILED" },
          });
        }

        await tx.worker.update({
          where: { id: worker.id },
          data: {
            walletBalance: { increment: data.amount },
            availableBalance: { increment: data.amount },
          },
        });
      });

      return NextResponse.json(
        { error: "Payout failed. Your balance has been restored. Please try again." },
        { status: 500 }
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Withdrawal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireAuth(["WORKER"]);
    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const withdrawals = await db.withdrawal.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ withdrawals });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get withdrawals error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
