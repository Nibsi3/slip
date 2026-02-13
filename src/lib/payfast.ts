import crypto from "crypto";

const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || "10000100",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
  passphrase: process.env.PAYFAST_PASSPHRASE || "jt7NOE43FZPn",
  sandbox: process.env.PAYFAST_SANDBOX !== "false",
};

function getBaseUrl() {
  return PAYFAST_CONFIG.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

function getValidateUrl() {
  return PAYFAST_CONFIG.sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
}

function pfUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) =>
      `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

export interface PayFastPaymentData {
  paymentId: string;
  amount: number;
  itemName: string;
  workerName: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  customerEmail?: string;
  customerName?: string;
}

export function generatePayFastForm(data: PayFastPaymentData) {
  // PayFast requires parameters in a specific order for signature generation
  const params: Record<string, string> = {};

  // 1. Merchant details
  params.merchant_id = PAYFAST_CONFIG.merchantId;
  params.merchant_key = PAYFAST_CONFIG.merchantKey;

  // 2. URLs
  params.return_url = data.returnUrl;
  params.cancel_url = data.cancelUrl;
  params.notify_url = data.notifyUrl;

  // 3. Customer details (optional, must come before payment details)
  if (data.customerName) {
    const parts = data.customerName.split(" ");
    params.name_first = parts[0] || "";
    params.name_last = parts.slice(1).join(" ") || "";
  }
  if (data.customerEmail) {
    params.email_address = data.customerEmail;
  }

  // 4. Payment details
  params.m_payment_id = data.paymentId;
  params.amount = data.amount.toFixed(2);
  params.item_name = data.itemName;

  const signature = generateSignature(params, PAYFAST_CONFIG.passphrase);
  params.signature = signature;

  return {
    actionUrl: getBaseUrl(),
    params,
  };
}

export function generateSignature(
  params: Record<string, string>,
  passphrase?: string
): string {
  // Iterate in insertion order (PayFast requires specific parameter order, NOT alphabetical)
  let pfOutput = "";
  for (const key of Object.keys(params)) {
    if (key === "signature" || params[key] === "") continue;
    pfOutput += `${key}=${pfUrlEncode(params[key])}&`;
  }
  // Remove trailing ampersand
  pfOutput = pfOutput.slice(0, -1);

  if (passphrase) {
    pfOutput += `&passphrase=${pfUrlEncode(passphrase)}`;
  }

  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

export async function validateITN(
  pfParamString: string,
  pfHost: string
): Promise<boolean> {
  try {
    const url = getValidateUrl();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pfParamString,
    });
    const text = await response.text();
    return text.trim() === "VALID";
  } catch {
    return false;
  }
}

/**
 * Verify ITN signature using the raw POST body string.
 * PayFast ITN signatures include ALL parameters (including empty values)
 * with passphrase appended. We work directly with the raw URL-encoded
 * body to avoid decode/re-encode mismatches.
 */
export function verifyITNSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const pp = PAYFAST_CONFIG.passphrase;

  // Keep all pairs except signature (including empty values)
  const pairs = rawBody.split("&").filter((pair) => {
    const key = pair.split("=")[0];
    return key !== "signature";
  });

  let pfParamString = pairs.join("&");

  if (pp) {
    pfParamString += `&passphrase=${encodeURIComponent(pp).replace(/%20/g, "+")}`;
  }

  const computed = crypto.createHash("md5").update(pfParamString).digest("hex");
  return computed === receivedSignature;
}

export function getPayFastConfig() {
  return PAYFAST_CONFIG;
}
