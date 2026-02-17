/**
 * Balance Cap Enforcement Module
 * Ensures no user account exceeds the R2,000 maximum balance.
 */

import { db } from "@/lib/db";
import { getBalanceCap } from "./constants";

export interface BalanceCapCheck {
  allowed: boolean;
  currentBalance: number;
  availableBalance: number;
  balanceCap: number;
  remainingCapacity: number;
  excessAmount?: number;
}

/**
 * Check if a worker's account can accept an incoming amount without exceeding the cap.
 */
export async function checkBalanceCap(
  workerId: string,
  incomingAmount: number
): Promise<BalanceCapCheck> {
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: { walletBalance: true, availableBalance: true, balanceCap: true },
  });

  if (!worker) {
    return {
      allowed: false,
      currentBalance: 0,
      availableBalance: 0,
      balanceCap: getBalanceCap(),
      remainingCapacity: 0,
      excessAmount: incomingAmount,
    };
  }

  const currentBalance = Number(worker.walletBalance);
  const availableBalance = Number(worker.availableBalance);
  const cap = Number(worker.balanceCap) || getBalanceCap();
  const remainingCapacity = Math.max(0, cap - currentBalance);
  const wouldExceed = currentBalance + incomingAmount > cap;

  return {
    allowed: !wouldExceed,
    currentBalance,
    availableBalance,
    balanceCap: cap,
    remainingCapacity,
    excessAmount: wouldExceed ? (currentBalance + incomingAmount - cap) : undefined,
  };
}

/**
 * Determine how much of an incoming tip can be accepted under the balance cap.
 * Returns the acceptable amount (may be less than the full tip if cap would be exceeded).
 */
export function getAcceptableAmount(
  currentBalance: number,
  incomingAmount: number,
  cap: number
): { acceptedAmount: number; rejectedAmount: number } {
  const remaining = Math.max(0, cap - currentBalance);
  const accepted = Math.min(incomingAmount, remaining);
  return {
    acceptedAmount: accepted,
    rejectedAmount: incomingAmount - accepted,
  };
}

/**
 * Check all workers for balance cap violations (admin utility).
 */
export async function findBalanceCapViolations(): Promise<
  Array<{ workerId: string; walletBalance: number; balanceCap: number }>
> {
  const workers = await db.worker.findMany({
    select: { id: true, walletBalance: true, balanceCap: true },
  });

  return workers
    .filter((w) => Number(w.walletBalance) > Number(w.balanceCap))
    .map((w) => ({
      workerId: w.id,
      walletBalance: Number(w.walletBalance),
      balanceCap: Number(w.balanceCap),
    }));
}
