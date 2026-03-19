/**
 * OTT Mobile API client
 * Handles voucher issuance for OTT_VOUCHER withdrawal method.
 *
 * Flow:
 *  1. getOttApiKey()     — rotate / fetch API key
 *  2. remitVoucher()     — issue a voucher (POST /api/v1/RemitVoucher)
 *  3. checkRemitVoucher()— poll status on timeout before deciding fail
 *
 * Error code mapping:
 *  User-facing: 4, 5, 7, 11, 12, 13, 14
 *  System (retry once after 30s): 1, 2, 3, 9, 10, 15
 */

import crypto from "crypto";

export interface OttGetApiKeyResult {
  apiKey: string;
  reusedExisting: boolean;
}

type OttApiKeyResponse = {
  apiKey?: string;
  errorCode?: number;
  errorMessage?: string;
};

export interface OttRemitVoucherParams {
  amount: number;
  mobile: string;
  uniqueReference: string;
}

export interface OttRemitVoucherResult {
  success: boolean;
  voucherId?: string;
  pin?: string;
  errorCode?: number;
  errorMessage?: string;
  raw?: unknown;
}

export interface OttCheckVoucherResult {
  success: boolean;
  voucherId?: string;
  pin?: string;
  status?: string;
  errorCode?: number;
  errorMessage?: string;
  raw?: unknown;
}

function getOttConfig(): {
  baseUrl: string;
  username: string;
  password: string;
  vendorId: string;
  pin: string;
  apiKey?: string;
} {
  const baseUrl = process.env.OTT_BASE_URL;
  const username = process.env.OTT_USERNAME;
  const password = process.env.OTT_PASSWORD;
  const vendorId = process.env.OTT_VENDOR_ID;
  const pin = process.env.OTT_PIN;

  if (!baseUrl || !username || !password || !vendorId || !pin) {
    throw new Error(
      "FATAL: OTT_BASE_URL, OTT_USERNAME, OTT_PASSWORD, OTT_VENDOR_ID, and OTT_PIN must be set."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    username,
    password,
    vendorId,
    pin,
    apiKey: process.env.OTT_API_KEY,
  };
}

function getAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

export function buildOttHash(apiKey: string, params: Record<string, string | number | undefined | null>): string {
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .sort((a, b) => a.localeCompare(b));

  const valuesConcat = keys.map((k) => String(params[k]!)).join("");
  const raw = apiKey + valuesConcat;

  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function mapOttError(errorCode?: number, errorMessage?: string): {
  kind: "user" | "system";
  message: string;
} {
  const userFacing: Record<number, string> = {
    4: "Invalid amount.",
    5: "Invalid mobile number.",
    7: "Voucher cannot be issued right now. Please try again.",
    11: "Voucher limit exceeded.",
    12: "Voucher not available for this mobile number.",
    13: "OTT service is temporarily unavailable.",
    14: "Voucher request rejected.",
  };

  const systemErrors = new Set([1, 2, 3, 9, 10, 15]);

  if (errorCode !== undefined && userFacing[errorCode]) {
    return { kind: "user", message: userFacing[errorCode] };
  }

  if (errorCode !== undefined && systemErrors.has(errorCode)) {
    return {
      kind: "system",
      message: errorMessage || `OTT system error (${errorCode}).`,
    };
  }

  return {
    kind: "system",
    message: errorMessage || "OTT request failed.",
  };
}

export async function getOttApiKey(): Promise<OttGetApiKeyResult> {
  const { baseUrl, username, password, apiKey } = getOttConfig();

  const res = await fetch(`${baseUrl}/api/v1/GetAPIKey`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(username, password),
    },
  });

  // Spec:
  // - 200: new key returned (rotate)
  // - 201 + errorCode 2: use existing stored key
  let json: OttApiKeyResponse | null = null;
  try {
    json = (await res.json()) as OttApiKeyResponse;
  } catch {
    json = null;
  }

  if (res.status === 200) {
    const newKey = json?.apiKey;
    if (!newKey) {
      throw new Error(`OTT GetAPIKey missing apiKey: ${JSON.stringify(json)}`);
    }
    // Cannot persist to env here; caller may copy to a secrets store.
    process.env.OTT_API_KEY = newKey;
    return { apiKey: newKey, reusedExisting: false };
  }

  if (res.status === 201 && json?.errorCode === 2) {
    if (!apiKey) {
      throw new Error("OTT returned errorCode 2 (use existing key) but OTT_API_KEY is not set.");
    }
    return { apiKey, reusedExisting: true };
  }

  const mapped = mapOttError(json?.errorCode, json?.errorMessage);
  throw new Error(mapped.message);
}

async function ottFetch(
  url: string,
  username: string,
  password: string,
  body: Record<string, string>
): Promise<{ ok: boolean; json: unknown; text: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getAuthHeader(username, password),
    },
    body: new URLSearchParams(body).toString(),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: res.ok, json, text };
}

export async function remitVoucher(params: OttRemitVoucherParams): Promise<OttRemitVoucherResult> {
  const { baseUrl, username, password, vendorId, pin } = getOttConfig();
  const { apiKey } = await getOttApiKey();

  const amount = Number(params.amount.toFixed(2));

  const hash = buildOttHash(apiKey, {
    amount,
    mobile: params.mobile,
    pin,
    uniqueReference: params.uniqueReference,
    vendorID: vendorId,
  });

  const { ok, json, text } = await ottFetch(
    `${baseUrl}/api/v1/RemitVoucher`,
    username,
    password,
    {
      amount: amount.toFixed(2),
      mobile: params.mobile,
      pin,
      uniqueReference: params.uniqueReference,
      vendorID: vendorId,
      hash,
    }
  );

  const j = json as Record<string, unknown> | null;
  const errorCode = (j?.errorCode as number | undefined) ?? undefined;
  const errorMessage = (j?.errorMessage as string | undefined) ?? undefined;

  if (!ok || (errorCode !== undefined && errorCode !== 0)) {
    const mapped = mapOttError(errorCode, errorMessage);
    return { success: false, errorCode, errorMessage: mapped.message, raw: j ?? text };
  }

  const voucherId = (j?.voucherId || j?.voucherID || j?.id) as string | undefined;
  const pinOut = (j?.pin || j?.voucherPin) as string | undefined;

  if (!pinOut && !voucherId) {
    return {
      success: false,
      errorMessage: "OTT RemitVoucher returned an unexpected response.",
      raw: j ?? text,
    };
  }

  return { success: true, voucherId, pin: pinOut, raw: j };
}

export async function checkRemitVoucher(uniqueReference: string): Promise<OttCheckVoucherResult> {
  const { baseUrl, username, password, vendorId, pin } = getOttConfig();
  const { apiKey } = await getOttApiKey();

  const hash = buildOttHash(apiKey, {
    uniqueReference,
    vendorID: vendorId,
    pin,
  });

  const res = await fetch(`${baseUrl}/api/v1/CheckRemitVoucher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getAuthHeader(username, password),
    },
    body: new URLSearchParams({
      uniqueReference,
      vendorID: vendorId,
      pin,
      hash,
    }).toString(),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errorCode = json?.errorCode as number | undefined;
    const errorMessage = json?.errorMessage as string | undefined;
    const mapped = mapOttError(errorCode, errorMessage);
    return { success: false, errorCode, errorMessage: mapped.message, raw: json ?? text };
  }

  const errorCode = json?.errorCode as number | undefined;
  const errorMessage = json?.errorMessage as string | undefined;
  if (errorCode && errorCode !== 0) {
    const mapped = mapOttError(errorCode, errorMessage);
    return { success: false, errorCode, errorMessage: mapped.message, raw: json };
  }

  const voucherId = (json?.voucherId || json?.voucherID || json?.id) as string | undefined;
  const pinOut = (json?.pin || json?.voucherPin) as string | undefined;
  const status = (json?.status || json?.voucherStatus) as string | undefined;

  return { success: true, voucherId, pin: pinOut, status, raw: json };
}
