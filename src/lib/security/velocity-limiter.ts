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
 * Progressive withdrawal limits based on account age.
 * - 0–7 days:   no withdrawals (7-day waiting period)
 * - 7–30 days:  R500/day, max 1 withdrawal/day
 * - 30+ days:   standard limits (R2000/day, 3 withdrawals/day)
 */
function getWithdrawalLimitsForWorker(workerCreatedAt: Date): {
  maxPerDay: number;
  maxWithdrawalsPerDay: number;
  waitDays: number;
} {
  const ageMs = Date.now() - workerCreatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < 7) {
    return { maxPerDay: 0, maxWithdrawalsPerDay: 0, waitDays: Math.ceil(7 - ageDays) };
  }
  if (ageDays < 30) {
    return { maxPerDay: 500, maxWithdrawalsPerDay: 1, waitDays: 0 };
  }
  return { maxPerDay: MAX_DAILY_WITHDRAWAL_ZAR, maxWithdrawalsPerDay: MAX_WITHDRAWALS_PER_DAY, waitDays: 0 };
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

  // Fetch worker to check account age for progressive limits
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: { createdAt: true },
  });

  const limits = worker
    ? getWithdrawalLimitsForWorker(worker.createdAt)
    : { maxPerDay: MAX_DAILY_WITHDRAWAL_ZAR, maxWithdrawalsPerDay: MAX_WITHDRAWALS_PER_DAY, waitDays: 0 };

  // Block entirely during 7-day waiting period
  if (limits.waitDays > 0) {
    return {
      allowed: false,
      reason: `Withdrawals are not available for the first 7 days after registration. ${limits.waitDays} day(s) remaining.`,
      counts: { tipsLastHour: 0, tipsLastDay: 0, tipsLastWeek: 0, withdrawalsToday: 0, dailyWithdrawalTotal: 0 },
    };
  }

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

  if (withdrawalsToday >= limits.maxWithdrawalsPerDay) {
    return { allowed: false, reason: `Max withdrawals per day exceeded (${limits.maxWithdrawalsPerDay})`, counts };
  }

  if (dailyWithdrawalTotal + requestedAmount > limits.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily withdrawal limit of R${limits.maxPerDay} would be exceeded (already withdrawn R${dailyWithdrawalTotal.toFixed(2)} today)`,
      counts,
    };
  }

  return { allowed: true, counts };
}
