/**
 * Stitch Express API client
 * Docs: https://express.stitch.money/api-docs
 *
 * Authentication: POST /api/v1/token  →  { success, data: { accessToken } }
 * Token TTL: 15 minutes — we cache it in memory and refresh when needed.
 */

const STITCH_BASE = "https://express.stitch.money";

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STITCH_CLIENT_ID;
  const clientSecret = process.env.STITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FATAL: STITCH_CLIENT_ID or STITCH_CLIENT_SECRET is not set.");
  }
  return { clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// Token cache (in-memory, per process)
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
const TOKEN_TTL_MARGIN_MS = 60_000; // refresh 1 min before expiry

export async function getStitchToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - TOKEN_TTL_MARGIN_MS) {
    return cachedToken;
  }

  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${STITCH_BASE}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      scope: "client_paymentrequest",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stitch token request failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const token = json?.data?.accessToken as string | undefined;
  if (!token) {
    throw new Error(`Stitch token response missing accessToken: ${JSON.stringify(json)}`);
  }

  cachedToken = token;
  // Token is valid for 15 minutes per Stitch docs
  tokenExpiresAt = Date.now() + 15 * 60 * 1000;

  return token;
}

// ---------------------------------------------------------------------------
// Payment links
// ---------------------------------------------------------------------------

export interface StitchCreatePaymentLinkParams {
  /** Amount in ZAR (rands, not cents) */
  amountZAR: number;
  /** Merchant reference — must be ≤ 50 chars */
  merchantReference: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  /** Absolute URL to redirect after payment */
  redirectUrl?: string;
  /** ISO datetime string */
  expiresAt?: string;
}

export interface StitchPaymentLink {
  id: string;
  link: string;
  status: string;
  amount: number;
  merchantReference: string;
}

export async function createStitchPaymentLink(
  params: StitchCreatePaymentLinkParams
): Promise<StitchPaymentLink> {
  const token = await getStitchToken();

  const body: Record<string, unknown> = {
    amount: Math.round(params.amountZAR * 100), // Stitch uses cents
    merchantReference: params.merchantReference.slice(0, 50),
  };

  body.payerName = (params.payerName || "Guest").slice(0, 40);
  if (params.payerEmail) body.payerEmailAddress = params.payerEmail;
  if (params.payerPhone) body.payerPhoneNumber = params.payerPhone;
  if (params.expiresAt) body.expiresAt = params.expiresAt;

  const res = await fetch(`${STITCH_BASE}/api/v1/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stitch createPaymentLink failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const payment = json?.data?.payment as StitchPaymentLink | undefined;
  if (!payment?.link) {
    throw new Error(`Stitch createPaymentLink bad response: ${JSON.stringify(json)}`);
  }

  // Append redirect_url query param so Stitch sends the user back after payment
  if (params.redirectUrl) {
    const url = new URL(payment.link);
    url.searchParams.set("redirect_url", params.redirectUrl);
    payment.link = url.toString();
  }

  return payment;
}

// ---------------------------------------------------------------------------
// Fetch a single payment link by ID (used for webhook verification fallback)
// ---------------------------------------------------------------------------
export async function getStitchPaymentLink(paymentLinkId: string): Promise<StitchPaymentLink | null> {
  try {
    const token = await getStitchToken();
    const res = await fetch(`${STITCH_BASE}/api/v1/payment-links/${paymentLinkId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.payment as StitchPaymentLink) ?? null;
  } catch {
    return null;
  }
}
