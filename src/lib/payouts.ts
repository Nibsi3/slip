/**
 * Payout provider abstraction.
 *
 * DEV/TEST  → MockPayoutProvider (instant, generates random voucher PINs)
 * PRODUCTION → Plug in Stitch, Ozow, or your bank's API.
 *
 * To switch providers, set PAYOUT_PROVIDER env var and add credentials.
 */

export interface PayoutRequest {
  withdrawalId: string;
  method: "INSTANT_MONEY" | "EFT";
  amount: number;         // net amount to send (after fees)
  phoneNumber?: string;   // required for INSTANT_MONEY
  bankName?: string;      // required for EFT
  bankAccountNo?: string;
  bankBranchCode?: string;
  recipientName: string;
}

export interface PayoutResult {
  success: boolean;
  reference: string;      // voucher PIN for Instant Money, or EFT reference
  providerRef?: string;   // external provider's transaction ID
  error?: string;
}

interface PayoutProvider {
  name: string;
  sendPayout(request: PayoutRequest): Promise<PayoutResult>;
}

// ---------------------------------------------------------------------------
// Mock provider — for development & testing
// Generates a random 9-digit voucher PIN (simulates Instant Money)
// ---------------------------------------------------------------------------
class MockPayoutProvider implements PayoutProvider {
  name = "mock";

  async sendPayout(request: PayoutRequest): Promise<PayoutResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    if (request.method === "INSTANT_MONEY") {
      if (!request.phoneNumber) {
        return { success: false, reference: "", error: "Phone number required for Instant Money" };
      }
      // Generate a realistic 9-digit voucher PIN
      const pin = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
      console.log(
        `[MockPayout] Instant Money R${request.amount.toFixed(2)} → ${request.phoneNumber} | PIN: ${pin}`
      );
      return {
        success: true,
        reference: pin,
        providerRef: `MOCK-IM-${Date.now()}`,
      };
    }

    if (request.method === "EFT") {
      if (!request.bankAccountNo) {
        return { success: false, reference: "", error: "Bank account required for EFT" };
      }
      const ref = `EFT-${Date.now().toString(36).toUpperCase()}`;
      console.log(
        `[MockPayout] EFT R${request.amount.toFixed(2)} → ${request.bankName} ${request.bankAccountNo} | Ref: ${ref}`
      );
      return {
        success: true,
        reference: ref,
        providerRef: `MOCK-EFT-${Date.now()}`,
      };
    }

    return { success: false, reference: "", error: `Unknown method: ${request.method}` };
  }
}

// ---------------------------------------------------------------------------
// Stitch provider — for production (placeholder, requires API keys)
// Sign up at https://stitch.money and get client credentials
// ---------------------------------------------------------------------------
class StitchPayoutProvider implements PayoutProvider {
  name = "stitch";

  async sendPayout(request: PayoutRequest): Promise<PayoutResult> {
    // TODO: Implement Stitch disbursement API
    // 1. Authenticate with OAuth2 client credentials
    // 2. Create a disbursement via POST /disbursements
    // 3. Return the voucher code / reference from the response
    //
    // Docs: https://stitch.money/docs/disbursements
    //
    // Required env vars:
    //   STITCH_CLIENT_ID
    //   STITCH_CLIENT_SECRET
    //   STITCH_API_URL (sandbox or production)
    throw new Error(
      "Stitch provider not yet configured. Set STITCH_CLIENT_ID and STITCH_CLIENT_SECRET in .env.local"
    );
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

// Auto-approve threshold (ZAR). Withdrawals at or below this amount
// skip admin approval and are processed immediately.
export const AUTO_APPROVE_THRESHOLD = Number(process.env.PAYOUT_AUTO_APPROVE_THRESHOLD || "500");

export async function processPayout(request: PayoutRequest): Promise<PayoutResult> {
  const provider = getPayoutProvider();
  console.log(`[Payout] Processing via ${provider.name}: ${request.method} R${request.amount.toFixed(2)} for withdrawal ${request.withdrawalId}`);

  try {
    const result = await provider.sendPayout(request);
    if (result.success) {
      console.log(`[Payout] Success: ${result.reference} (provider ref: ${result.providerRef})`);
    } else {
      console.error(`[Payout] Failed: ${result.error}`);
    }
    return result;
  } catch (err) {
    console.error(`[Payout] Error:`, err);
    return {
      success: false,
      reference: "",
      error: err instanceof Error ? err.message : "Payout failed",
    };
  }
}
