/**
 * Security & Fraud Prevention Constants
 * Central configuration for all security limits and thresholds.
 */

// ---------------------------------------------------------------------------
// Balance & Account Limits
// ---------------------------------------------------------------------------
export const BALANCE_CAP_ZAR = 2000;
export const MIN_WITHDRAWAL_ZAR = 20;
export const MAX_WITHDRAWAL_PER_TX_ZAR = 2000;
export const WITHDRAWAL_FEE_PERCENT = 0;
export const EFT_FEE_FLAT_ZAR = 2;
export const OTT_FEE_PERCENT = 0.06;
export const MAX_DAILY_WITHDRAWAL_ZAR = 2000;

// ---------------------------------------------------------------------------
// Settlement Delay (hours)
// ---------------------------------------------------------------------------
export const SETTLEMENT_DELAY_HOURS_DEFAULT = 24;
export const SETTLEMENT_DELAY_HOURS_HIGH_RISK = 72;
export const SETTLEMENT_DELAY_HOURS_MEDIUM_RISK = 48;

// ---------------------------------------------------------------------------
// Chargeback Reserve
// ---------------------------------------------------------------------------
export const CHARGEBACK_RESERVE_PERCENT_MIN = 0.05;
export const CHARGEBACK_RESERVE_PERCENT_MAX = 0.10;
export const CHARGEBACK_RESERVE_PERCENT_DEFAULT = 0.075;

// ---------------------------------------------------------------------------
// Velocity Limits
// ---------------------------------------------------------------------------
export const MAX_TIPS_PER_HOUR = 10;
export const MAX_TIPS_PER_DAY = 50;
export const MAX_TIPS_PER_WEEK = 200;
export const MAX_WITHDRAWALS_PER_HOUR = 3;
export const MAX_WITHDRAWALS_PER_DAY = 3;
export const MAX_TIPS_RECEIVED_PER_HOUR = 20;
export const MAX_TIPS_RECEIVED_PER_DAY = 100;

// ---------------------------------------------------------------------------
// Fraud Scoring Thresholds
// ---------------------------------------------------------------------------
export const FRAUD_SCORE_ALLOW_MAX = 30;
export const FRAUD_SCORE_FLAG_MIN = 31;
export const FRAUD_SCORE_HOLD_MIN = 60;
export const FRAUD_SCORE_BLOCK_MIN = 80;

// Scoring weights
export const SCORE_WEIGHT_HIGH_RISK_BIN = 25;
export const SCORE_WEIGHT_AMOUNT_ANOMALY = 20;
export const SCORE_WEIGHT_NEW_ACCOUNT = 15;
export const SCORE_WEIGHT_VELOCITY_BREACH = 30;
export const SCORE_WEIGHT_SAME_DEVICE = 35;
export const SCORE_WEIGHT_SAME_IP = 25;
export const SCORE_WEIGHT_GEO_JUMP = 20;
export const SCORE_WEIGHT_VPN_PROXY = 15;
export const SCORE_WEIGHT_DEVICE_REUSE = 10;

// ---------------------------------------------------------------------------
// IP & Device Detection
// ---------------------------------------------------------------------------
export const GEO_JUMP_THRESHOLD_KM = 500;
export const GEO_JUMP_TIME_WINDOW_HOURS = 2;
export const SAME_IP_WINDOW_HOURS = 24;
export const SAME_DEVICE_WINDOW_HOURS = 24;

// ---------------------------------------------------------------------------
// AML Thresholds
// ---------------------------------------------------------------------------
export const AML_LARGE_TRANSACTION_ZAR = 1000;
export const AML_DAILY_ACCUMULATION_ZAR = 3000;
export const AML_WEEKLY_ACCUMULATION_ZAR = 10000;
export const AML_STRUCTURING_COUNT = 5;
export const AML_STRUCTURING_WINDOW_HOURS = 4;
export const AML_ROUND_AMOUNT_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// High-Risk BIN Prefixes (known prepaid/virtual card ranges)
// These are example ranges — update with actual risk data from EFTCorp
// ---------------------------------------------------------------------------
export const HIGH_RISK_BIN_PREFIXES =
  process.env.NODE_ENV === "production"
    ? [
        "5100", // Certain prepaid ranges
        "6011", // Discover (uncommon in ZA, suspicious)
      ]
    : []; // No BIN blocking in development/test — Paystack test cards use 4000 prefixes

// ---------------------------------------------------------------------------
// Account Age Thresholds (hours)
// ---------------------------------------------------------------------------
export const NEW_ACCOUNT_THRESHOLD_HOURS = 48;

// ---------------------------------------------------------------------------
// Withdrawal Daily Cap Calculation
// ---------------------------------------------------------------------------
export function getWithdrawalDailyCap(): number {
  return Number(process.env.MAX_DAILY_WITHDRAWAL_ZAR || MAX_DAILY_WITHDRAWAL_ZAR);
}

export function getBalanceCap(): number {
  return Number(process.env.BALANCE_CAP_ZAR || BALANCE_CAP_ZAR);
}

export function getSettlementDelayHours(riskLevel: "low" | "medium" | "high"): number {
  switch (riskLevel) {
    case "high": return SETTLEMENT_DELAY_HOURS_HIGH_RISK;
    case "medium": return SETTLEMENT_DELAY_HOURS_MEDIUM_RISK;
    default: return SETTLEMENT_DELAY_HOURS_DEFAULT;
  }
}
