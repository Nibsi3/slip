/**
 * Anti-Money Laundering (AML) Monitoring Module
 * Detects suspicious transaction patterns and generates alerts.
 */

import { db } from "@/lib/db";
import {
  AML_LARGE_TRANSACTION_ZAR,
  AML_DAILY_ACCUMULATION_ZAR,
  AML_WEEKLY_ACCUMULATION_ZAR,
  AML_STRUCTURING_COUNT,
  AML_STRUCTURING_WINDOW_HOURS,
  AML_ROUND_AMOUNT_THRESHOLD,
} from "./constants";

export interface AmlCheckResult {
  alerts: Array<{
    alertType: string;
    riskLevel: string;
    details: Record<string, unknown>;
  }>;
  hasAlerts: boolean;
  highestRiskLevel: string;
}

/**
 * Run all AML checks for a transaction.
 */
export async function runAmlChecks(
  workerId: string,
  amount: number,
  transactionType: "TIP" | "WITHDRAWAL"
): Promise<AmlCheckResult> {
  const alerts: AmlCheckResult["alerts"] = [];

  // 1. Large transaction check
  if (amount >= AML_LARGE_TRANSACTION_ZAR) {
    alerts.push({
      alertType: "LARGE_TRANSACTION",
      riskLevel: amount >= AML_LARGE_TRANSACTION_ZAR * 2 ? "HIGH" : "MEDIUM",
      details: { amount, threshold: AML_LARGE_TRANSACTION_ZAR, transactionType },
    });
  }

  // 2. Rapid accumulation check (daily)
  const dailyTotal = await getDailyAccumulation(workerId);
  if (dailyTotal + amount >= AML_DAILY_ACCUMULATION_ZAR) {
    alerts.push({
      alertType: "RAPID_ACCUMULATION",
      riskLevel: "HIGH",
      details: {
        dailyTotal,
        newAmount: amount,
        combined: dailyTotal + amount,
        threshold: AML_DAILY_ACCUMULATION_ZAR,
      },
    });
  }

  // 3. Weekly accumulation check
  const weeklyTotal = await getWeeklyAccumulation(workerId);
  if (weeklyTotal + amount >= AML_WEEKLY_ACCUMULATION_ZAR) {
    alerts.push({
      alertType: "RAPID_ACCUMULATION",
      riskLevel: "CRITICAL",
      details: {
        weeklyTotal,
        newAmount: amount,
        combined: weeklyTotal + amount,
        threshold: AML_WEEKLY_ACCUMULATION_ZAR,
      },
    });
  }

  // 4. Structuring detection (many small transactions in short window)
  const structuringResult = await detectStructuring(workerId);
  if (structuringResult.detected) {
    alerts.push({
      alertType: "STRUCTURING",
      riskLevel: "HIGH",
      details: {
        transactionCount: structuringResult.count,
        windowHours: AML_STRUCTURING_WINDOW_HOURS,
        threshold: AML_STRUCTURING_COUNT,
      },
    });
  }

  // 5. Round amount pattern detection
  const roundAmountResult = await detectRoundAmounts(workerId);
  if (roundAmountResult.detected) {
    alerts.push({
      alertType: "ROUND_AMOUNTS",
      riskLevel: "MEDIUM",
      details: {
        roundCount: roundAmountResult.count,
        threshold: AML_ROUND_AMOUNT_THRESHOLD,
        recentAmounts: roundAmountResult.amounts,
      },
    });
  }

  // Persist alerts to database — deduplicated per alertType per hour to prevent flooding
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const alert of alerts) {
    const existing = await db.amlAlert.findFirst({
      where: {
        workerId,
        alertType: alert.alertType,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (existing) continue;

    await db.amlAlert.create({
      data: {
        workerId,
        alertType: alert.alertType,
        riskLevel: alert.riskLevel,
        details: alert.details as unknown as import("@prisma/client/runtime/library").InputJsonValue,
      },
    });
  }

  const riskOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const highestRiskLevel = alerts.reduce((highest, alert) => {
    return riskOrder.indexOf(alert.riskLevel) > riskOrder.indexOf(highest)
      ? alert.riskLevel
      : highest;
  }, "LOW");

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    highestRiskLevel,
  };
}

/**
 * Get total tips received by a worker in the last 24 hours.
 */
async function getDailyAccumulation(workerId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const agg = await db.tip.aggregate({
    where: {
      workerId,
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    _sum: { netAmount: true },
  });

  return Number(agg._sum.netAmount || 0);
}

/**
 * Get total tips received by a worker in the last 7 days.
 */
async function getWeeklyAccumulation(workerId: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const agg = await db.tip.aggregate({
    where: {
      workerId,
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    _sum: { netAmount: true },
  });

  return Number(agg._sum.netAmount || 0);
}

/**
 * Detect structuring: many small transactions in a short window.
 */
async function detectStructuring(workerId: string): Promise<{ detected: boolean; count: number }> {
  const since = new Date(Date.now() - AML_STRUCTURING_WINDOW_HOURS * 60 * 60 * 1000);

  const count = await db.tip.count({
    where: {
      workerId,
      status: "COMPLETED",
      createdAt: { gte: since },
    },
  });

  return {
    detected: count >= AML_STRUCTURING_COUNT,
    count,
  };
}

/**
 * Detect suspicious round amount patterns (e.g., multiple R100, R200 tips).
 */
async function detectRoundAmounts(workerId: string): Promise<{
  detected: boolean;
  count: number;
  amounts: number[];
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentTips = await db.tip.findMany({
    where: {
      workerId,
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    select: { amount: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const amounts = recentTips.map((t) => Number(t.amount));
  const roundAmounts = amounts.filter((a) => a % 100 === 0 && a >= 200);

  return {
    detected: roundAmounts.length >= AML_ROUND_AMOUNT_THRESHOLD,
    count: roundAmounts.length,
    amounts: roundAmounts,
  };
}
