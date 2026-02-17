/**
 * Chargeback Reserve Module
 * Maintains a 5-10% internal reserve of total platform funds to cover chargebacks.
 */

import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  CHARGEBACK_RESERVE_PERCENT_DEFAULT,
  CHARGEBACK_RESERVE_PERCENT_MIN,
  CHARGEBACK_RESERVE_PERCENT_MAX,
} from "./constants";

export interface ReserveStatus {
  totalPlatformBalance: number;
  reservePercent: number;
  reserveAmount: number;
  lastCalculated: Date;
}

/**
 * Recalculate the chargeback reserve based on total platform balances.
 * Should be called after every tip completion and periodically.
 */
export async function recalculateReserve(): Promise<ReserveStatus> {
  // Sum all worker wallet balances
  const balanceAgg = await db.worker.aggregate({
    _sum: { walletBalance: true },
  });

  const totalBalance = Number(balanceAgg._sum.walletBalance || 0);

  // Get or create the reserve record
  let reserve = await db.chargebackReserve.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const reservePercent = reserve
    ? Number(reserve.reservePercent)
    : CHARGEBACK_RESERVE_PERCENT_DEFAULT;

  const reserveAmount = Number((totalBalance * reservePercent).toFixed(2));

  if (reserve) {
    await db.chargebackReserve.update({
      where: { id: reserve.id },
      data: {
        totalBalance: new Decimal(totalBalance),
        reserveAmount: new Decimal(reserveAmount),
        lastCalculated: new Date(),
      },
    });
  } else {
    reserve = await db.chargebackReserve.create({
      data: {
        totalBalance: new Decimal(totalBalance),
        reservePercent: new Decimal(CHARGEBACK_RESERVE_PERCENT_DEFAULT),
        reserveAmount: new Decimal(reserveAmount),
        lastCalculated: new Date(),
      },
    });
  }

  return {
    totalPlatformBalance: totalBalance,
    reservePercent,
    reserveAmount,
    lastCalculated: new Date(),
  };
}

/**
 * Get the current reserve status without recalculating.
 */
export async function getReserveStatus(): Promise<ReserveStatus> {
  const reserve = await db.chargebackReserve.findFirst({
    orderBy: { lastCalculated: "desc" },
  });

  if (!reserve) {
    return {
      totalPlatformBalance: 0,
      reservePercent: CHARGEBACK_RESERVE_PERCENT_DEFAULT,
      reserveAmount: 0,
      lastCalculated: new Date(),
    };
  }

  return {
    totalPlatformBalance: Number(reserve.totalBalance),
    reservePercent: Number(reserve.reservePercent),
    reserveAmount: Number(reserve.reserveAmount),
    lastCalculated: reserve.lastCalculated,
  };
}

/**
 * Adjust the reserve percentage (admin action).
 * Must stay within 5-10% bounds.
 */
export async function adjustReservePercent(newPercent: number): Promise<ReserveStatus> {
  const clamped = Math.max(
    CHARGEBACK_RESERVE_PERCENT_MIN,
    Math.min(CHARGEBACK_RESERVE_PERCENT_MAX, newPercent)
  );

  const reserve = await db.chargebackReserve.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (reserve) {
    await db.chargebackReserve.update({
      where: { id: reserve.id },
      data: { reservePercent: new Decimal(clamped) },
    });
  }

  return recalculateReserve();
}

/**
 * Check if a withdrawal would eat into the chargeback reserve.
 * Returns true if the withdrawal is safe (enough funds outside reserve).
 */
export async function isWithdrawalSafeForReserve(
  withdrawalAmount: number
): Promise<{ safe: boolean; availableAfterReserve: number; reserveAmount: number }> {
  const balanceAgg = await db.worker.aggregate({
    _sum: { walletBalance: true },
  });

  const totalBalance = Number(balanceAgg._sum.walletBalance || 0);

  const reserve = await db.chargebackReserve.findFirst({
    orderBy: { lastCalculated: "desc" },
  });

  const reservePercent = reserve
    ? Number(reserve.reservePercent)
    : CHARGEBACK_RESERVE_PERCENT_DEFAULT;

  const reserveAmount = totalBalance * reservePercent;
  const availableAfterReserve = totalBalance - reserveAmount;

  return {
    safe: withdrawalAmount <= availableAfterReserve,
    availableAfterReserve,
    reserveAmount,
  };
}
