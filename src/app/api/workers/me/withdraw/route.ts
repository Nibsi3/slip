import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { processPayout } from "@/lib/payouts";

const withdrawSchema = z.object({
  amount: z.number().min(20),
  method: z.enum(["INSTANT_MONEY", "EFT"]),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankBranchCode: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const body = await request.json();
    const data = withdrawSchema.parse(body);

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (Number(worker.walletBalance) < data.amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (data.method === "EFT" && (!data.bankName || !data.bankAccountNo)) {
      return NextResponse.json(
        { error: "Bank details required for EFT withdrawal" },
        { status: 400 }
      );
    }

    if (data.method === "INSTANT_MONEY" && !data.phoneNumber) {
      return NextResponse.json(
        { error: "Phone number required for Instant Money" },
        { status: 400 }
      );
    }

    const fee = Number((data.amount * 0.05).toFixed(2));
    const netAmount = Number((data.amount - fee).toFixed(2));
    const phone = data.phoneNumber || worker.phoneForIM || "";
    const bank = data.bankName || worker.bankName || "";
    const accountNo = data.bankAccountNo || worker.bankAccountNo || "";
    const branchCode = data.bankBranchCode || worker.bankBranchCode || "";

    // Step 1: Create withdrawal + deduct wallet in a transaction
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
          phoneNumber: phone,
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
        data: { walletBalance: { decrement: data.amount } },
      });

      return w;
    });

    // Step 2: Auto-process payout via provider
    const recipientName = `${worker.user.firstName} ${worker.user.lastName}`;
    const payoutResult = await processPayout({
      withdrawalId: withdrawal.id,
      method: data.method,
      amount: netAmount,
      phoneNumber: phone,
      bankName: bank,
      bankAccountNo: accountNo,
      bankBranchCode: branchCode,
      recipientName,
    });

    if (payoutResult.success) {
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
          },
        },
      });

      const updated = await db.withdrawal.findUnique({ where: { id: withdrawal.id } });
      return NextResponse.json({ withdrawal: updated });
    } else {
      // Payout failed → refund wallet, mark FAILED
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
          data: { walletBalance: { increment: data.amount } },
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
