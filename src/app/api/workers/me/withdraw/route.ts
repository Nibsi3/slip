import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { processPayout } from "@/lib/payouts";
import { remitVoucher, checkRemitVoucher, mapOttError } from "@/lib/ott";
import { sendOttVoucherPin } from "@/lib/whatsapp";
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
  MIN_WITHDRAWAL_ZAR,
  EFT_FEE_FLAT_ZAR,
  OTT_FEE_PERCENT,
} from "@/lib/security";
import { normalisePhone } from "@/lib/whatsapp";
import { sendPushToWorker } from "@/lib/push-notifications";

const withdrawSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("EFT"),
    amount: z.number().min(MIN_WITHDRAWAL_ZAR, `Minimum withdrawal is R${MIN_WITHDRAWAL_ZAR}`),
    bankName: z.string().min(1, "Bank name is required"),
    bankAccountNo: z.string().min(1, "Account number is required"),
    bankBranchCode: z.string().optional(),
    bankCode: z.string().optional(),
  }),
  z.object({
    method: z.literal("OTT"),
    amount: z.number().min(MIN_WITHDRAWAL_ZAR, `Minimum withdrawal is R${MIN_WITHDRAWAL_ZAR}`),
    mobile: z.string().min(1, "Mobile number is required for OTT voucher"),
  }),
]);

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

    // -----------------------------------------------------------------------
    // Method-specific fee & field resolution
    // -----------------------------------------------------------------------
    const isEFT = data.method === "EFT";
    const isOTT = data.method === "OTT";

    const fee = isEFT
      ? EFT_FEE_FLAT_ZAR
      : isOTT
        ? Number((data.amount * OTT_FEE_PERCENT).toFixed(2))
        : 0;
    const netAmount = Number((data.amount - fee).toFixed(2));

    // EFT-specific fields (only accessible when method === "EFT" thanks to discriminatedUnion)
    const bank        = isEFT ? (data as { method: "EFT"; bankName: string; bankAccountNo: string; bankBranchCode?: string; bankCode?: string }).bankName || worker.bankName || "" : "";
    const accountNo   = isEFT ? (data as { method: "EFT"; bankAccountNo: string }).bankAccountNo || worker.bankAccountNo || "" : "";
    const branchCode  = isEFT ? ((data as { method: "EFT"; bankBranchCode?: string }).bankBranchCode || worker.bankBranchCode || "") : "";
    const bankCode    = isEFT ? ((data as { method: "EFT"; bankCode?: string }).bankCode || "") : "";

    // OTT-specific fields
    const ottMobile = isOTT
      ? normalisePhone((data as { method: "OTT"; mobile: string }).mobile)
      : "";
    const ottRef = isOTT ? crypto.randomUUID() : "";

    type TxType = Parameters<Parameters<typeof db.$transaction>[0]>[0];

    // -----------------------------------------------------------------------
    // Step 1: Create withdrawal record + deduct balances atomically
    // -----------------------------------------------------------------------
    const withdrawal = await db.$transaction(async (tx: TxType) => {
      const w = await tx.withdrawal.create({
        data: {
          workerId: worker.id,
          amount: data.amount,
          fee,
          netAmount,
          method: isOTT ? "OTT_VOUCHER" : "EFT",
          status: "PROCESSING",
          ...(isEFT ? { bankName: bank, bankAccountNo: accountNo, bankBranchCode: branchCode } : {}),
          ...(isOTT ? { phoneNumber: ottMobile, ottUniqueRef: ottRef } : {}),
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

    // -----------------------------------------------------------------------
    // Step 2: Dispatch payout via the appropriate path
    // -----------------------------------------------------------------------
    let payoutSuccess = false;
    let payoutReference = "";
    let payoutProviderRef: string | undefined;
    let payoutError: string | undefined;

    if (isEFT) {
      const recipientName = `${worker.user.firstName} ${worker.user.lastName}`;
      const payoutResult = await processPayout({
        withdrawalId: withdrawal.id,
        method: "EFT",
        amount: data.amount,    // gross — StitchPayoutProvider deducts the R2 internally
        bankName: bank,
        bankAccountNo: accountNo,
        bankBranchCode: branchCode,
        bankCode: bankCode || undefined,
        recipientName,
      });
      payoutSuccess    = payoutResult.success;
      payoutReference  = payoutResult.reference;
      payoutProviderRef = payoutResult.providerRef;
      payoutError      = payoutResult.error;
    } else if (isOTT) {
      let ottResult = await remitVoucher({
        amount: netAmount,
        mobile: ottMobile,
        uniqueReference: ottRef,
      });

      // Timeout safety: if system error, wait 30s and check status once
      if (!ottResult.success && ottResult.errorCode !== undefined) {
        const mapped = mapOttError(ottResult.errorCode);
        if (mapped.kind === "system") {
          await new Promise((r) => setTimeout(r, 30_000));
          const check = await checkRemitVoucher(ottRef);
          if (check.success) {
            ottResult = { success: true, voucherId: check.voucherId, pin: check.pin };
          }
        }
      }

      if (ottResult.success && ottResult.pin) {
        payoutSuccess   = true;
        payoutReference = ottResult.voucherId || ottRef;
        payoutProviderRef = ottResult.voucherId;

        // Store OTT voucher details on the withdrawal record
        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            ottVoucherId: ottResult.voucherId,
            ottVoucherAmount: new Decimal(netAmount),
          },
        });

        // Send PIN via WhatsApp (best-effort, non-blocking)
        const workerPhone = worker.whatsappPhone;
        if (workerPhone) {
          sendOttVoucherPin({
            workerPhone,
            workerFirstName: worker.user.firstName,
            pin: ottResult.pin,
            amountZAR: netAmount,
            withdrawalId: withdrawal.id,
          }).catch((e) => console.error("[OTT] WhatsApp PIN send failed:", e));
        }
      } else {
        payoutSuccess = false;
        payoutError   = ottResult.errorMessage || "OTT voucher issuance failed.";
      }
    }

    // -----------------------------------------------------------------------
    // Step 3: Finalize or refund
    // -----------------------------------------------------------------------
    if (payoutSuccess) {
      await recordVelocityEvent(worker.id, "WITHDRAWAL", data.amount, ipAddress);

      await db.$transaction(async (tx: TxType) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: "COMPLETED",
            reference: payoutReference,
            processedAt: new Date(),
          },
        });

        const ledger = await tx.ledgerEntry.findFirst({ where: { withdrawalId: withdrawal.id } });
        if (ledger) {
          await tx.ledgerEntry.update({
            where: { id: ledger.id },
            data: { status: "COMPLETED", reference: payoutReference },
          });
        }
      });

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
            fee,
            reference: payoutReference,
            providerRef: payoutProviderRef,
            fraudScore: fraudResult.score,
          },
          ipAddress,
        },
      });

      const updated = await db.withdrawal.findUnique({ where: { id: withdrawal.id } });

      // Push notification to Android app (fire-and-forget)
      const methodLabel = data.method === "EFT" ? "EFT bank transfer" : "OTT Voucher";
      sendPushToWorker(
        worker.id,
        "✅ Withdrawal processed",
        `R${netAmount.toFixed(2)} ${methodLabel} withdrawal is being processed.`,
        { url: "/dashboard/withdraw" }
      ).catch(() => {});

      return NextResponse.json({ withdrawal: updated });
    } else {
      // Refund both balances
      await db.$transaction(async (tx: TxType) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: "FAILED", reference: payoutError || "Payout failed" },
        });

        const ledger = await tx.ledgerEntry.findFirst({ where: { withdrawalId: withdrawal.id } });
        if (ledger) {
          await tx.ledgerEntry.update({ where: { id: ledger.id }, data: { status: "FAILED" } });
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
        { error: payoutError || "Payout failed. Your balance has been restored. Please try again." },
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
