/**
 * Fraud Scoring Engine
 * Evaluates each transaction and assigns a risk score.
 * Score determines action: ALLOW, FLAG, HOLD, or BLOCK.
 */

import { db } from "@/lib/db";
import {
  FRAUD_SCORE_ALLOW_MAX,
  FRAUD_SCORE_FLAG_MIN,
  FRAUD_SCORE_HOLD_MIN,
  FRAUD_SCORE_BLOCK_MIN,
  SCORE_WEIGHT_HIGH_RISK_BIN,
  SCORE_WEIGHT_AMOUNT_ANOMALY,
  SCORE_WEIGHT_NEW_ACCOUNT,
  SCORE_WEIGHT_VELOCITY_BREACH,
  SCORE_WEIGHT_SAME_DEVICE,
  SCORE_WEIGHT_SAME_IP,
  SCORE_WEIGHT_GEO_JUMP,
  SCORE_WEIGHT_VPN_PROXY,
  SCORE_WEIGHT_DEVICE_REUSE,
  HIGH_RISK_BIN_PREFIXES,
  NEW_ACCOUNT_THRESHOLD_HOURS,
} from "./constants";
import { checkTipReceivedVelocity, checkTipSentVelocity, checkWithdrawalVelocity } from "./velocity-limiter";
import { detectSameDeviceWorkers, detectSameIPTipperRecipient } from "./device-fingerprint";
import { analyzeIP } from "./ip-detection";

export type FraudAction = "ALLOW" | "FLAG" | "HOLD" | "BLOCK";

export interface FraudScoreResult {
  score: number;
  action: FraudAction;
  factors: FraudFactor[];
  blocked: boolean;
  reason?: string;
}

export interface FraudFactor {
  name: string;
  score: number;
  details: string;
}

/**
 * Determine the action based on the total fraud score.
 */
function scoreToAction(score: number): FraudAction {
  if (score >= FRAUD_SCORE_BLOCK_MIN) return "BLOCK";
  if (score >= FRAUD_SCORE_HOLD_MIN) return "HOLD";
  if (score >= FRAUD_SCORE_FLAG_MIN) return "FLAG";
  return "ALLOW";
}

/**
 * Score a tip transaction before it is processed.
 */
export async function scoreTipTransaction(params: {
  workerId: string;
  amount: number;
  ipAddress?: string;
  fingerprintHash?: string;
  cardBin?: string;
}): Promise<FraudScoreResult> {
  const factors: FraudFactor[] = [];
  let totalScore = 0;

  // 1. Card BIN risk check
  if (params.cardBin) {
    const isHighRisk = HIGH_RISK_BIN_PREFIXES.some((prefix) =>
      params.cardBin!.startsWith(prefix)
    );
    if (isHighRisk) {
      const s = SCORE_WEIGHT_HIGH_RISK_BIN;
      totalScore += s;
      factors.push({ name: "HIGH_RISK_BIN", score: s, details: `Card BIN ${params.cardBin} is in high-risk list` });
    }
  }

  // 2. Amount anomaly check (compare to account history)
  const amountAnomaly = await checkAmountAnomaly(params.workerId, params.amount);
  if (amountAnomaly.isAnomaly) {
    const s = SCORE_WEIGHT_AMOUNT_ANOMALY;
    totalScore += s;
    factors.push({
      name: "AMOUNT_ANOMALY",
      score: s,
      details: `Amount R${params.amount} is ${amountAnomaly.ratio.toFixed(1)}x the average (R${amountAnomaly.average.toFixed(2)})`,
    });
  }

  // 3. Account age check
  const accountAge = await getAccountAgeHours(params.workerId);
  if (accountAge < NEW_ACCOUNT_THRESHOLD_HOURS) {
    const s = SCORE_WEIGHT_NEW_ACCOUNT;
    totalScore += s;
    factors.push({
      name: "NEW_ACCOUNT",
      score: s,
      details: `Account is only ${accountAge.toFixed(0)} hours old (threshold: ${NEW_ACCOUNT_THRESHOLD_HOURS}h)`,
    });
  }

  // 4. Velocity check (tips received by this worker)
  const velocityCheck = await checkTipReceivedVelocity(params.workerId);
  if (!velocityCheck.allowed) {
    const s = SCORE_WEIGHT_VELOCITY_BREACH;
    totalScore += s;
    factors.push({
      name: "VELOCITY_BREACH",
      score: s,
      details: velocityCheck.reason || "Velocity limit exceeded",
    });
  }

  // 5. IP-based velocity check (tips from this IP)
  if (params.ipAddress) {
    const ipVelocity = await checkTipSentVelocity(params.ipAddress);
    if (!ipVelocity.allowed) {
      const s = SCORE_WEIGHT_VELOCITY_BREACH;
      totalScore += s;
      factors.push({
        name: "IP_VELOCITY_BREACH",
        score: s,
        details: ipVelocity.reason || "IP velocity limit exceeded",
      });
    }
  }

  // 6. Same device detection
  if (params.fingerprintHash) {
    const sameDeviceWorkers = await detectSameDeviceWorkers(params.fingerprintHash, params.workerId);
    if (sameDeviceWorkers.length > 0) {
      const s = SCORE_WEIGHT_SAME_DEVICE;
      totalScore += s;
      factors.push({
        name: "SAME_DEVICE",
        score: s,
        details: `Device shared with ${sameDeviceWorkers.length} other worker account(s)`,
      });
    }
  }

  // 7. Same IP detection (tipper and recipient)
  if (params.ipAddress) {
    const sameIP = await detectSameIPTipperRecipient(params.ipAddress, params.workerId);
    if (sameIP) {
      const s = SCORE_WEIGHT_SAME_IP;
      totalScore += s;
      factors.push({
        name: "SAME_IP_TIPPER_RECIPIENT",
        score: s,
        details: "Same IP used by both tipper and tip recipient (possible self-tipping)",
      });
    }
  }

  // 8. IP anomaly detection
  if (params.ipAddress) {
    const ipAnalysis = await analyzeIP(params.ipAddress, params.workerId);
    if (ipAnalysis.geoJumpDetected) {
      const s = SCORE_WEIGHT_GEO_JUMP;
      totalScore += s;
      factors.push({
        name: "GEO_JUMP",
        score: s,
        details: `Geographic jump detected: ${ipAnalysis.geoJumpDistanceKm?.toFixed(0)}km`,
      });
    }
    if (ipAnalysis.isKnownVPN || ipAnalysis.isKnownProxy) {
      const s = SCORE_WEIGHT_VPN_PROXY;
      totalScore += s;
      factors.push({
        name: "VPN_PROXY",
        score: s,
        details: ipAnalysis.isKnownVPN ? "Known VPN IP detected" : "Known proxy IP detected",
      });
    }
  }

  // 9. Device reuse (multiple accounts on same device)
  if (params.fingerprintHash) {
    const accountCount = await countAccountsOnFingerprint(params.fingerprintHash);
    if (accountCount > 1) {
      const s = SCORE_WEIGHT_DEVICE_REUSE;
      totalScore += s;
      factors.push({
        name: "DEVICE_REUSE",
        score: s,
        details: `${accountCount} accounts detected on this device`,
      });
    }
  }

  const action = scoreToAction(totalScore);

  return {
    score: totalScore,
    action,
    factors,
    blocked: action === "BLOCK",
    reason: action === "BLOCK"
      ? `Transaction blocked: risk score ${totalScore} exceeds threshold. Factors: ${factors.map((f) => f.name).join(", ")}`
      : undefined,
  };
}

/**
 * Score a withdrawal transaction before it is processed.
 */
export async function scoreWithdrawalTransaction(params: {
  workerId: string;
  amount: number;
  ipAddress?: string;
  fingerprintHash?: string;
}): Promise<FraudScoreResult> {
  const factors: FraudFactor[] = [];
  let totalScore = 0;

  // 1. Account age check
  const accountAge = await getAccountAgeHours(params.workerId);
  if (accountAge < NEW_ACCOUNT_THRESHOLD_HOURS) {
    const s = SCORE_WEIGHT_NEW_ACCOUNT;
    totalScore += s;
    factors.push({
      name: "NEW_ACCOUNT",
      score: s,
      details: `Account is only ${accountAge.toFixed(0)} hours old`,
    });
  }

  // 2. Withdrawal velocity check
  const velocityCheck = await checkWithdrawalVelocity(params.workerId, params.amount);
  if (!velocityCheck.allowed) {
    const s = SCORE_WEIGHT_VELOCITY_BREACH;
    totalScore += s;
    factors.push({
      name: "WITHDRAWAL_VELOCITY_BREACH",
      score: s,
      details: velocityCheck.reason || "Withdrawal velocity limit exceeded",
    });
  }

  // 3. Amount anomaly (large withdrawal relative to history)
  const amountAnomaly = await checkWithdrawalAmountAnomaly(params.workerId, params.amount);
  if (amountAnomaly.isAnomaly) {
    const s = SCORE_WEIGHT_AMOUNT_ANOMALY;
    totalScore += s;
    factors.push({
      name: "WITHDRAWAL_AMOUNT_ANOMALY",
      score: s,
      details: `Withdrawal R${params.amount} is ${amountAnomaly.ratio.toFixed(1)}x the average`,
    });
  }

  // 4. IP anomaly
  if (params.ipAddress) {
    const ipAnalysis = await analyzeIP(params.ipAddress, params.workerId);
    if (ipAnalysis.geoJumpDetected) {
      const s = SCORE_WEIGHT_GEO_JUMP;
      totalScore += s;
      factors.push({
        name: "GEO_JUMP",
        score: s,
        details: `Geographic jump detected during withdrawal`,
      });
    }
    if (ipAnalysis.isKnownVPN || ipAnalysis.isKnownProxy) {
      const s = SCORE_WEIGHT_VPN_PROXY;
      totalScore += s;
      factors.push({
        name: "VPN_PROXY",
        score: s,
        details: "VPN/proxy detected during withdrawal attempt",
      });
    }
  }

  const action = scoreToAction(totalScore);

  return {
    score: totalScore,
    action,
    factors,
    blocked: action === "BLOCK",
    reason: action === "BLOCK"
      ? `Withdrawal blocked: risk score ${totalScore}. Factors: ${factors.map((f) => f.name).join(", ")}`
      : undefined,
  };
}

/**
 * Record a fraud event in the database.
 */
export async function recordFraudEvent(params: {
  type: string;
  workerId?: string;
  tipId?: string;
  withdrawalId?: string;
  ipAddress?: string;
  deviceId?: string;
  riskScore: number;
  action: FraudAction;
  details?: Record<string, unknown>;
}): Promise<void> {
  await db.fraudEvent.create({
    data: {
      type: params.type as never,
      workerId: params.workerId,
      tipId: params.tipId,
      withdrawalId: params.withdrawalId,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      riskScore: params.riskScore,
      action: params.action as never,
      details: (params.details || undefined) as unknown as import("@prisma/client/runtime/library").InputJsonValue | undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function checkAmountAnomaly(
  workerId: string,
  amount: number
): Promise<{ isAnomaly: boolean; average: number; ratio: number }> {
  const agg = await db.tip.aggregate({
    where: { workerId, status: "COMPLETED" },
    _avg: { amount: true },
    _count: true,
  });

  const avg = Number(agg._avg.amount || 0);
  const count = agg._count;

  // Not enough history to determine anomaly
  if (count < 3 || avg === 0) {
    return { isAnomaly: false, average: avg, ratio: 0 };
  }

  const ratio = amount / avg;
  // Flag if amount is 5x or more the average
  return { isAnomaly: ratio >= 5, average: avg, ratio };
}

async function checkWithdrawalAmountAnomaly(
  workerId: string,
  amount: number
): Promise<{ isAnomaly: boolean; average: number; ratio: number }> {
  const agg = await db.withdrawal.aggregate({
    where: { workerId, status: "COMPLETED" },
    _avg: { amount: true },
    _count: true,
  });

  const avg = Number(agg._avg.amount || 0);
  const count = agg._count;

  if (count < 2 || avg === 0) {
    return { isAnomaly: false, average: avg, ratio: 0 };
  }

  const ratio = amount / avg;
  return { isAnomaly: ratio >= 3, average: avg, ratio };
}

async function getAccountAgeHours(workerId: string): Promise<number> {
  const worker = await db.worker.findUnique({
    where: { id: workerId },
    select: { createdAt: true },
  });

  if (!worker) return 0;

  return (Date.now() - worker.createdAt.getTime()) / (1000 * 60 * 60);
}

async function countAccountsOnFingerprint(fingerprintHash: string): Promise<number> {
  const records = await db.deviceFingerprint.findMany({
    where: { fingerprintHash, workerId: { not: null } },
    select: { workerId: true },
    distinct: ["workerId"],
  });
  return records.length;
}
