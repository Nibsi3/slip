/**
 * Payout provider abstraction.
 *
 * DEV/TEST    → MockPayoutProvider  (set PAYOUT_PROVIDER=mock or leave unset)
 * PRODUCTION  → StitchPayoutProvider (set PAYOUT_PROVIDER=stitch)
 *
 * EFT payouts go through the Stitch Payouts API (R2 flat fee deducted).
 * OTT_VOUCHER is handled directly in the withdrawal route (not via this module).
 *
 * Required env vars for Stitch:
 *   STITCH_PAYOUT_CLIENT_ID / STITCH_PAYOUT_CLIENT_SECRET
 *   (falls back to STITCH_CLIENT_ID / STITCH_CLIENT_SECRET if not set)
 */

import { initiateStitchPayout } from "./stitch-payouts";

export interface PayoutRequest {
  withdrawalId: string;
  method: "INSTANT_MONEY" | "EFT" | "OTT_VOUCHER";
  amount: number;
  phoneNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranchCode?: string;
  recipientName: string;
  bankCode?: string;
}

export interface PayoutResult {
  success: boolean;
  reference: string;
  providerRef?: string;
  netAmountSent?: number;
  feePlatform?: number;
  error?: string;
  pending?: boolean;
}

interface PayoutProvider {
  name: string;
  sendPayout(request: PayoutRequest): Promise<PayoutResult>;
}

// ---------------------------------------------------------------------------
// Mock provider — development & testing only
// ---------------------------------------------------------------------------
class MockPayoutProvider implements PayoutProvider {
  name = "mock";

  async sendPayout(request: PayoutRequest): Promise<PayoutResult> {
    await new Promise((r) => setTimeout(r, 300));

    if (request.method === "INSTANT_MONEY") {
      if (!request.phoneNumber) {
        return { success: false, reference: "", error: "Phone number required for Instant Money" };
      }
      const pin = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
      console.log(`[MockPayout] Instant Money R${request.amount.toFixed(2)} → ${request.phoneNumber} | PIN: ${pin}`);
      return { success: true, reference: pin, providerRef: `MOCK-IM-${Date.now()}` };
    }

    if (request.method === "EFT") {
      if (!request.bankAccountNo) {
        return { success: false, reference: "", error: "Bank account required for EFT" };
      }
      const fee = 2;
      const net = Number((request.amount - fee).toFixed(2));
      const ref = `EFT-${Date.now().toString(36).toUpperCase()}`;
      console.log(`[MockPayout] EFT R${net.toFixed(2)} (fee R${fee}) → ${request.bankName} ${request.bankAccountNo} | Ref: ${ref}`);
      return { success: true, reference: ref, providerRef: `MOCK-EFT-${Date.now()}`, netAmountSent: net, feePlatform: fee };
    }

    return { success: false, reference: "", error: `Unknown method: ${request.method}` };
  }
}

// ---------------------------------------------------------------------------
// Stitch provider — production EFT via Stitch Payouts API
// R2 flat fee deducted inside initiateStitchPayout.
// ---------------------------------------------------------------------------
class StitchPayoutProvider implements PayoutProvider {
  name = "stitch";

  async sendPayout(request: PayoutRequest): Promise<PayoutResult> {
    if (request.method !== "EFT") {
      return {
        success: false,
        reference: "",
        error: "Stitch payout provider only handles EFT. OTT_VOUCHER is processed separately.",
      };
    }

    if (!request.bankAccountNo || !request.recipientName) {
      return { success: false, reference: "", error: "Bank account number and recipient name required for EFT" };
    }

    const result = await initiateStitchPayout({
      withdrawalId: request.withdrawalId,
      grossAmountZAR: request.amount,
      recipientName: request.recipientName,
      bankAccountNo: request.bankAccountNo,
      bankBranchCode: request.bankBranchCode,
      bankName: request.bankName,
      bankCode: request.bankCode,
    });

    return result;
  }
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------
function getPayoutProvider(): PayoutProvider {
  const provider = process.env.PAYOUT_PROVIDER || "mock";

  switch (provider) {
    case "stitch":
      return new StitchPayoutProvider();
    case "mock":
    default:
      return new MockPayoutProvider();
  }
}

export const AUTO_APPROVE_THRESHOLD = Number(process.env.PAYOUT_AUTO_APPROVE_THRESHOLD || "500");

export async function processPayout(request: PayoutRequest): Promise<PayoutResult> {
  const provider = getPayoutProvider();
  console.log(`[Payout] Processing via ${provider.name}: ${request.method} R${request.amount.toFixed(2)} for withdrawal ${request.withdrawalId}`);

  try {
    const result = await provider.sendPayout(request);
    if (result.success) {
      console.log(`[Payout] Success: ${result.reference} (providerRef: ${result.providerRef}, pending: ${result.pending})`);
    } else {
      console.error(`[Payout] Failed: ${result.error}`);
    }
    return result;
  } catch (err) {
    console.error("[Payout] Unexpected error:", err);
    return {
      success: false,
      reference: "",
      error: err instanceof Error ? err.message : "Payout failed",
    };
  }
}
