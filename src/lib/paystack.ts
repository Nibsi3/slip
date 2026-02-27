import crypto from "crypto";

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("FATAL: PAYSTACK_SECRET_KEY environment variable is not set.");
  }
  return key;
}

export interface PaystackInitializeParams {
  paymentId: string;
  amount: number;
  workerName: string;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const secretKey = getPaystackSecretKey();

  const body = {
    email: params.customerEmail || "tipper@slipatip.co.za",
    amount: Math.round(params.amount * 100),
    reference: params.paymentId,
    callback_url: params.returnUrl,
    metadata: {
      cancel_action: params.cancelUrl,
      payment_id: params.paymentId,
      worker_name: params.workerName,
      item_name: params.itemName,
      custom_fields: [
        {
          display_name: "Worker",
          variable_name: "worker_name",
          value: params.workerName,
        },
      ],
      ...(params.metadata || {}),
    },
  };

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack initialize failed: ${response.status} ${error}`);
  }

  const json = await response.json();

  if (!json.status) {
    throw new Error(`Paystack initialize error: ${json.message}`);
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("PAYSTACK_WEBHOOK_SECRET not set — skipping webhook signature verification");
    return true;
  }
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

export async function verifyTransaction(reference: string): Promise<PaystackTransactionData | null> {
  const secretKey = getPaystackSecretKey();

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  if (!response.ok) return null;

  const json = await response.json();
  if (!json.status) return null;

  return json.data as PaystackTransactionData;
}

export interface PaystackTransactionData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  gateway_response: string;
  paid_at: string;
  channel: string;
  currency: string;
  customer: {
    email: string;
    customer_code: string;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
  };
  metadata?: Record<string, unknown>;
}

export interface PaystackWebhookEvent {
  event: string;
  data: PaystackTransactionData & {
    transfer_code?: string;
    reason?: string;
    recipient?: {
      name: string;
      account_number: string;
      bank_code: string;
    };
    failures?: unknown;
    amount?: number;
    currency?: string;
    status?: string;
    reference?: string;
  };
}

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}): Promise<string> {
  const secretKey = getPaystackSecretKey();

  const response = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency || "ZAR",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack create recipient failed: ${response.status} ${error}`);
  }

  const json = await response.json();
  if (!json.status) {
    throw new Error(`Paystack create recipient error: ${json.message}`);
  }

  return json.data.recipient_code as string;
}

export async function initiateTransfer(params: {
  amount: number;
  recipientCode: string;
  reference: string;
  reason: string;
}): Promise<{ transferCode: string; status: string }> {
  const secretKey = getPaystackSecretKey();

  const response = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(params.amount * 100),
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack initiate transfer failed: ${response.status} ${error}`);
  }

  const json = await response.json();
  if (!json.status) {
    throw new Error(`Paystack transfer error: ${json.message}`);
  }

  return {
    transferCode: json.data.transfer_code as string,
    status: json.data.status as string,
  };
}

export async function listBanks(): Promise<{ name: string; code: string }[]> {
  const secretKey = getPaystackSecretKey();

  const response = await fetch("https://api.paystack.co/bank?country=south_africa&perPage=100", {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!response.ok) return [];

  const json = await response.json();
  if (!json.status) return [];

  return (json.data as Array<{ name: string; code: string }>).map((b) => ({
    name: b.name,
    code: b.code,
  }));
}
