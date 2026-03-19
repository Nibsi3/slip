/**
 * Stitch Payouts API client
 * Separate from stitch.ts (which handles pay-ins / payment links).
 *
 * Stitch Payouts uses the same Express API base but a different OAuth scope.
 * Test client ID: test-cab0834e-b6e1-4e64-abbc-42f00074e6cd
 *
 * Required env vars:
 *   STITCH_PAYOUT_CLIENT_ID     — separate payout-scoped client (or same as pay-in)
 *   STITCH_PAYOUT_CLIENT_SECRET
 */

const STITCH_BASE = "https://express.stitch.money";

function getPayoutCredentials(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.STITCH_PAYOUT_CLIENT_ID || process.env.STITCH_CLIENT_ID;
  const clientSecret =
    process.env.STITCH_PAYOUT_CLIENT_SECRET || process.env.STITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "FATAL: STITCH_PAYOUT_CLIENT_ID / STITCH_PAYOUT_CLIENT_SECRET (or STITCH_CLIENT_ID / STITCH_CLIENT_SECRET) must be set."
    );
  }
  return { clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// Token cache (in-memory, payout scope)
// ---------------------------------------------------------------------------
let cachedPayoutToken: string | null = null;
let payoutTokenExpiresAt = 0;
const TOKEN_TTL_MARGIN_MS = 60_000;

async function getStitchPayoutToken(): Promise<string> {
  if (cachedPayoutToken && Date.now() < payoutTokenExpiresAt - TOKEN_TTL_MARGIN_MS) {
    return cachedPayoutToken;
  }

  const { clientId, clientSecret } = getPayoutCredentials();

  const res = await fetch(`${STITCH_BASE}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      scope: "client_payout",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stitch payout token request failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const token = json?.data?.accessToken as string | undefined;
  if (!token) {
    throw new Error(`Stitch payout token response missing accessToken: ${JSON.stringify(json)}`);
  }

  cachedPayoutToken = token;
  payoutTokenExpiresAt = Date.now() + 15 * 60 * 1000;
  return token;
}

// ---------------------------------------------------------------------------
// Payout request / result types
// ---------------------------------------------------------------------------
export interface StitchPayoutRequest {
  withdrawalId: string;
  /** Gross amount requested by worker (ZAR). The R2 flat fee is deducted here. */
  grossAmountZAR: number;
  recipientName: string;
  bankAccountNo: string;
  bankBranchCode?: string;
  bankName?: string;
  bankCode?: string;
}

export interface StitchPayoutResult {
  success: boolean;
  reference: string;
  providerRef?: string;
  netAmountSent: number;
  feePlatform: number;
  error?: string;
  pending?: boolean;
}

const EFT_FEE_FLAT = 2; // R2 flat fee per the plan

// Common SA branch codes (used when only a bank name is provided)
function deriveBranchCode(bankName: string): string {
  const lower = bankName.toLowerCase().trim();
  const codes: Record<string, string> = {
    absa: "632005",
    "standard bank": "051001",
    fnb: "250655",
    "first national bank": "250655",
    nedbank: "198765",
    capitec: "470010",
    investec: "580105",
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
// Initiate a Stitch payout
// ---------------------------------------------------------------------------
export async function initiateStitchPayout(
  params: StitchPayoutRequest
): Promise<StitchPayoutResult> {
  const token = await getStitchPayoutToken();

  const feePlatform = EFT_FEE_FLAT;
  const netAmountZAR = Number((params.grossAmountZAR - feePlatform).toFixed(2));

  if (netAmountZAR <= 0) {
    return {
      success: false,
      reference: "",
      netAmountSent: 0,
      feePlatform,
      error: `Net payout amount (R${netAmountZAR}) is too low after deducting the R${feePlatform} fee.`,
    };
  }

  const branchCode =
    params.bankCode ||
    params.bankBranchCode ||
    (params.bankName ? deriveBranchCode(params.bankName) : "");

  if (!branchCode) {
    return {
      success: false,
      reference: "",
      netAmountSent: 0,
      feePlatform,
      error: `Could not determine branch code for bank "${params.bankName}". Please provide a valid bank name or branch code.`,
    };
  }

  const body = {
    amount: Math.round(netAmountZAR * 100), // Stitch uses cents
    beneficiaryName: params.recipientName,
    accountNumber: params.bankAccountNo,
    bankCode: branchCode,
    reference: params.withdrawalId.slice(0, 50),
    merchantReference: params.withdrawalId.slice(0, 50),
  };

  try {
    const res = await fetch(`${STITCH_BASE}/api/v1/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stitch payout failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const payout = json?.data?.payout ?? json?.data ?? json;
    const providerRef = (payout?.id || payout?.reference || payout?.payoutId) as string | undefined;
    const status = (payout?.status || "") as string;

    console.log(`[StitchPayout] Initiated: ref=${params.withdrawalId} providerRef=${providerRef} status=${status}`);

    return {
      success: true,
      reference: params.withdrawalId,
      providerRef,
      netAmountSent: netAmountZAR,
      feePlatform,
      pending: status.toLowerCase() !== "completed",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stitch payout failed";
    console.error("[StitchPayout] Error:", msg);
    return { success: false, reference: "", netAmountSent: 0, feePlatform, error: msg };
  }
}
