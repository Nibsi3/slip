/**
 * Velocity Limiter Module
 * Enforces rate limits on tips and withdrawals per account.
 */

import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  MAX_TIPS_PER_HOUR,
  MAX_TIPS_PER_DAY,
  MAX_TIPS_PER_WEEK,
  MAX_WITHDRAWALS_PER_DAY,
  MAX_TIPS_RECEIVED_PER_HOUR,
  MAX_TIPS_RECEIVED_PER_DAY,
  MAX_DAILY_WITHDRAWAL_ZAR,
} from "./constants";

export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  counts: {
    tipsLastHour: number;
    tipsLastDay: number;
    tipsLastWeek: number;
    withdrawalsToday: number;
    dailyWithdrawalTotal: number;
  };
}

/**
 * Record a velocity event for tracking.
 */
export async function recordVelocityEvent(
  workerId: string,
  action: string,
  amount: number,
  ipAddress?: string,
  deviceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.velocityRecord.create({
    data: {
      workerId,
      action,
      amount: new Decimal(amount),
      ipAddress,
      deviceId,
      metadata: (metadata || undefined) as unknown as import("@prisma/client/runtime/library").InputJsonValue | undefined,
    },
  });
}

/**
 * Check velocity limits for tips received by a worker.
 */
export async function checkTipReceivedVelocity(workerId: string): Promise<VelocityCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [tipsLastHour, tipsLastDay, tipsLastWeek] = await Promise.all([
    db.velocityRecord.count({
      where: { workerId, action: "TIP_RECEIVED", createdAt: { gte: oneHourAgo } },
    }),
    db.velocityRecord.count({
      where: { workerId, action: "TIP_RECEIVED", createdAt: { gte: oneDayAgo } },
    }),
    db.velocityRecord.count({
      where: { workerId, action: "TIP_RECEIVED", createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  const counts = {
    tipsLastHour,
    tipsLastDay,
    tipsLastWeek,
    withdrawalsToday: 0,
    dailyWithdrawalTotal: 0,
  };

  if (tipsLastHour >= MAX_TIPS_RECEIVED_PER_HOUR) {
    return { allowed: false, reason: `Max tips per hour exceeded (${MAX_TIPS_RECEIVED_PER_HOUR})`, counts };
  }
  if (tipsLastDay >= MAX_TIPS_RECEIVED_PER_DAY) {
    return { allowed: false, reason: `Max tips per day exceeded (${MAX_TIPS_RECEIVED_PER_DAY})`, counts };
  }

  return { allowed: true, counts };
}

/**
 * Check velocity limits for tips sent from an IP/device.
 */
export async function checkTipSentVelocity(ipAddress: string): Promise<VelocityCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [tipsLastHour, tipsLastDay, tipsLastWeek] = await Promise.all([
    db.velocityRecord.count({
      where: { ipAddress, action: "TIP_SENT", createdAt: { gte: oneHourAgo } },
    }),
    db.velocityRecord.count({
      where: { ipAddress, action: "TIP_SENT", createdAt: { gte: oneDayAgo } },
    }),
    db.velocityRecord.count({
      where: { ipAddress, action: "TIP_SENT", createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  const counts = {
    tipsLastHour,
    tipsLastDay,
    tipsLastWeek,
    withdrawalsToday: 0,
    dailyWithdrawalTotal: 0,
  };

  if (tipsLastHour >= MAX_TIPS_PER_HOUR) {
    return { allowed: false, reason: `Max tips per hour from this IP exceeded (${MAX_TIPS_PER_HOUR})`, counts };
  }
  if (tipsLastDay >= MAX_TIPS_PER_DAY) {
    return { allowed: false, reason: `Max tips per day from this IP exceeded (${MAX_TIPS_PER_DAY})`, counts };
  }
  if (tipsLastWeek >= MAX_TIPS_PER_WEEK) {
    return { allowed: false, reason: `Max tips per week from this IP exceeded (${MAX_TIPS_PER_WEEK})`, counts };
  }

  return { allowed: true, counts };
}

/**
 * Check withdrawal velocity limits for a worker.
 */
export async function checkWithdrawalVelocity(
  workerId: string,
  requestedAmount: number
): Promise<VelocityCheckResult> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [withdrawalsToday, dailyAgg] = await Promise.all([
    db.velocityRecord.count({
      where: { workerId, action: "WITHDRAWAL", createdAt: { gte: startOfDay } },
    }),
    db.velocityRecord.aggregate({
      where: { workerId, action: "WITHDRAWAL", createdAt: { gte: startOfDay } },
      _sum: { amount: true },
    }),
  ]);

  const dailyWithdrawalTotal = Number(dailyAgg._sum.amount || 0);

  const counts = {
    tipsLastHour: 0,
    tipsLastDay: 0,
    tipsLastWeek: 0,
    withdrawalsToday,
    dailyWithdrawalTotal,
  };

  if (withdrawalsToday >= MAX_WITHDRAWALS_PER_DAY) {
    return { allowed: false, reason: `Max withdrawals per day exceeded (${MAX_WITHDRAWALS_PER_DAY})`, counts };
  }

  if (dailyWithdrawalTotal + requestedAmount > MAX_DAILY_WITHDRAWAL_ZAR) {
    return {
      allowed: false,
      reason: `Daily withdrawal limit of R${MAX_DAILY_WITHDRAWAL_ZAR} would be exceeded (already withdrawn R${dailyWithdrawalTotal.toFixed(2)} today)`,
      counts,
    };
  }

  return { allowed: true, counts };
}
