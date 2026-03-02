/**
 * Settlement Delay Module
 * Manages the 24-72 hour hold on incoming funds before they become available.
 */

import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { getSettlementDelayHours } from "./constants";
import { sendSettlementClearedSms } from "@/lib/sms";

/**
 * Create a settlement hold for a completed tip.
 * Funds go into walletBalance immediately but NOT into availableBalance
 * until the hold clears.
 */
export async function createSettlementHold(
  tipId: string,
  workerId: string,
  amount: number | Decimal,
  riskLevel: "low" | "medium" | "high" = "low",
  isFraudHeld: boolean = false
): Promise<{ clearsAt: Date }> {
  const delayHours = isFraudHeld ? 72 : getSettlementDelayHours(riskLevel);
  const clearsAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  await db.settlementHold.create({
    data: {
      tipId,
      workerId,
      amount: new Decimal(Number(amount)),
      clearsAt,
      isFraudHeld,
    },
  });

  return { clearsAt };
}

/**
 * Process all settlement holds that have cleared.
 * This should be called periodically (e.g., via cron or on each relevant request).
 * Moves funds from walletBalance to availableBalance.
 */
export async function processSettlementClears(): Promise<number> {
  const now = new Date();

  const pendingHolds = await db.settlementHold.findMany({
    where: {
      clearsAt: { lte: now },
      clearedAt: null,
      isFraudHeld: false,
    },
    take: 100,
  });

  let cleared = 0;

  for (const hold of pendingHolds) {
    try {
      await db.$transaction(async (tx) => {
        await tx.settlementHold.update({
          where: { id: hold.id },
          data: { clearedAt: now },
        });

        await tx.worker.update({
          where: { id: hold.workerId },
          data: {
            availableBalance: { increment: hold.amount },
          },
        });
      });

      cleared++;

      // Notify the worker via SMS that their funds are now available
      try {
        const workerData = await db.worker.findUnique({
          where: { id: hold.workerId },
          select: { user: { select: { firstName: true, phone: true } } },
        });
        if (workerData?.user?.phone) {
          await sendSettlementClearedSms(
            workerData.user.phone,
            workerData.user.firstName,
            Number(hold.amount)
          );
        }
      } catch (smsErr) {
        console.error(`[Settlement] SMS failed for worker ${hold.workerId}:`, smsErr);
      }
    } catch (err) {
      console.error(`Failed to clear settlement hold ${hold.id}:`, err);
    }
  }

  if (cleared > 0) {
    console.log(`[Settlement] Cleared ${cleared} holds`);
  }

  return cleared;
}

/**
 * Get the available (cleared) balance for a worker.
 * This is the amount they can actually withdraw.
 */
export async function getAvailableBalance(workerId: string): Promise<number> {
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: { availableBalance: true },
  });

  return Number(worker?.availableBalance || 0);
}

/**
 * Get pending (uncleared) settlement holds for a worker.
 */
export async function getPendingHolds(workerId: string): Promise<{
  totalPending: number;
  holds: Array<{ tipId: string; amount: number; clearsAt: Date; isFraudHeld: boolean }>;
}> {
  const holds = await db.settlementHold.findMany({
    where: {
      workerId,
      clearedAt: null,
    },
    orderBy: { clearsAt: "asc" },
  });

  const totalPending = holds.reduce((sum, h) => sum + Number(h.amount), 0);

  return {
    totalPending,
    holds: holds.map((h) => ({
      tipId: h.tipId,
      amount: Number(h.amount),
      clearsAt: h.clearsAt,
      isFraudHeld: h.isFraudHeld,
    })),
  };
}

/**
 * Release a fraud-held settlement (admin action).
 */
export async function releaseFraudHold(holdId: string): Promise<void> {
  const hold = await db.settlementHold.findUnique({ where: { id: holdId } });
  if (!hold || hold.clearedAt) return;

  await db.$transaction(async (tx) => {
    await tx.settlementHold.update({
      where: { id: holdId },
      data: { clearedAt: new Date(), isFraudHeld: false },
    });

    await tx.worker.update({
      where: { id: hold.workerId },
      data: {
        availableBalance: { increment: hold.amount },
      },
    });
  });
}
