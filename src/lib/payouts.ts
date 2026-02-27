/**
 * Payout provider abstraction.
 *
 * DEV/TEST    → MockPayoutProvider  (set PAYOUT_PROVIDER=mock or leave unset)
 * PRODUCTION  → PaystackPayoutProvider (set PAYOUT_PROVIDER=paystack)
 *
 * Paystack Transfers API handles EFT payouts. Payout confirmation arrives
 * via the Paystack transfer webhook (transfer.success / transfer.failed).
 *
 * Required env vars for Paystack:
 *   PAYSTACK_SECRET_KEY
 */

import { createTransferRecipient, initiateTransfer } from "./paystack";

export interface PayoutRequest {
  withdrawalId: string;
  method: "INSTANT_MONEY" | "EFT";
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
      const ref = `EFT-${Date.now().toString(36).toUpperCase()}`;
      console.log(`[MockPayout] EFT R${request.amount.toFixed(2)} → ${request.bankName} ${request.bankAccountNo} | Ref: ${ref}`);
      return { success: true, reference: ref, providerRef: `MOCK-EFT-${Date.now()}` };
    }

    return { success: false, reference: "", error: `Unknown method: ${request.method}` };
  }
}

// ---------------------------------------------------------------------------
// Paystack provider — production EFT via Paystack Transfers API
// Completion is confirmed asynchronously via transfer webhook.
// ---------------------------------------------------------------------------
class PaystackPayoutProvider implements PayoutProvider {
  name = "paystack";

  async sendPayout(request: PayoutRequest): Promise<PayoutResult> {
    if (request.method !== "EFT") {
      return {
        success: false,
        reference: "",
        error: "Paystack provider only supports EFT. Use a different provider for Instant Money.",
      };
    }

    if (!request.bankAccountNo || !request.recipientName) {
      return { success: false, reference: "", error: "Bank account number and recipient name required for EFT" };
    }

    const bankCode = request.bankCode || deriveBankCode(request.bankName || "");
    if (!bankCode) {
      return {
        success: false,
        reference: "",
        error: `Could not determine bank code for "${request.bankName}". Please provide a valid bank name.`,
      };
    }

    try {
      // Create transfer recipient
      const recipientCode = await createTransferRecipient({
        name: request.recipientName,
        accountNumber: request.bankAccountNo,
        bankCode,
        currency: "ZAR",
      });

      // Initiate transfer — completion confirmed via webhook
      const { transferCode, status } = await initiateTransfer({
        amount: request.amount,
        recipientCode,
        reference: request.withdrawalId,
        reason: `Slip a Tip withdrawal ${request.withdrawalId}`,
      });

      console.log(`[PaystackPayout] Transfer initiated: ${transferCode} (status: ${status})`);

      return {
        success: true,
        reference: transferCode,
        providerRef: transferCode,
        pending: status !== "success",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Paystack payout failed";
      console.error("[PaystackPayout] Error:", msg);
      return { success: false, reference: "", error: msg };
    }
  }
}

// ---------------------------------------------------------------------------
// Common South African bank codes (Paystack uses these)
// ---------------------------------------------------------------------------
function deriveBankCode(bankName: string): string {
  const lower = bankName.toLowerCase().trim();
  const codes: Record<string, string> = {
    "absa": "632005",
    "standard bank": "051001",
    "fnb": "250655",
    "first national bank": "250655",
    "nedbank": "198765",
    "capitec": "470010",
    "investec": "580105",
    "african bank": "430000",
    "bidvest bank": "462005",
    "discovery bank": "679000",
    "tyme bank": "678910",
    "access bank": "410506",
    "old mutual": "462005",
  };

  for (const [key, code] of Object.entries(codes)) {
    if (lower.includes(key)) return code;
  }

  return "";
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------
function getPayoutProvider(): PayoutProvider {
  const provider = process.env.PAYOUT_PROVIDER || "mock";

  switch (provider) {
    case "paystack":
      return new PaystackPayoutProvider();
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
