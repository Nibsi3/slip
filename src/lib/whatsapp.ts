/**
 * WhatsApp Cloud API client (Meta Business Platform)
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Used for:
 *  1. Sending the payment link to the customer after QR scan
 *  2. Confirming payment to the customer
 *  3. Notifying the car guard when they've been tipped
 *  4. Sending a follow-up reminder if unpaid after 5 hours
 */

const WA_API_VERSION = "v21.0";
const WA_BASE = `https://graph.facebook.com/${WA_API_VERSION}`;

function getConfig(): { phoneNumberId: string; accessToken: string } {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("FATAL: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not set.");
  }
  return { phoneNumberId, accessToken };
}

// ---------------------------------------------------------------------------
// Core send helper
// ---------------------------------------------------------------------------
async function sendMessage(payload: Record<string, unknown>): Promise<{ messageId: string } | null> {
  try {
    const { phoneNumberId, accessToken } = getConfig();
    const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        ...payload,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp] send failed:", JSON.stringify(json));
      return null;
    }

    const messageId = json?.messages?.[0]?.id as string | undefined;
    return messageId ? { messageId } : null;
  } catch (err) {
    console.error("[WhatsApp] network error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalise phone to E.164 for South Africa
// e.g. "0821234567" → "27821234567"
//      "+27821234567" → "27821234567"
// ---------------------------------------------------------------------------
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "27" + digits.slice(1);
  return digits;
}

// ---------------------------------------------------------------------------
// 1. Payment link — sent immediately after QR scan
//    This is a free-tier "service" message initiated within the 24h window.
// ---------------------------------------------------------------------------
export interface SendPaymentLinkParams {
  customerPhone: string;
  customerName?: string;
  workerFirstName: string;
  paymentLinkUrl: string;
  amountZAR: number;
  paymentId: string;
  expiresInHours?: number;
}

export async function sendPaymentLink(params: SendPaymentLinkParams): Promise<{ messageId: string } | null> {
  const to = normalisePhone(params.customerPhone);
  const guardName = params.workerFirstName;
  const amount = `R${params.amountZAR.toFixed(2)}`;
  const expiresIn = params.expiresInHours ?? 24;

  return sendMessage({
    to,
    type: "text",
    text: {
      preview_url: true,
      body:
        `Hi${params.customerName ? ` ${params.customerName}` : ""}! 👋\n\n` +
        `You scanned *${guardName}'s* tip QR code.\n\n` +
        `💳 *Tip amount:* ${amount}\n` +
        `🔗 *Pay securely here:*\n${params.paymentLinkUrl}\n\n` +
        `_Link expires in ${expiresIn} hours. No rush — tip when convenient!_\n\n` +
        `Powered by *Slip a Tip* 🤝`,
    },
  });
}

// ---------------------------------------------------------------------------
// 2. Payment confirmation — sent to customer after Stitch confirms payment
// ---------------------------------------------------------------------------
export interface SendPaymentConfirmationParams {
  customerPhone: string;
  customerName?: string;
  workerFirstName: string;
  amountZAR: number;
  paymentId: string;
}

export async function sendPaymentConfirmation(params: SendPaymentConfirmationParams): Promise<{ messageId: string } | null> {
  const to = normalisePhone(params.customerPhone);
  const amount = `R${params.amountZAR.toFixed(2)}`;

  return sendMessage({
    to,
    type: "text",
    text: {
      body:
        `✅ *Tip sent successfully!*\n\n` +
        `${params.amountZAR > 0 ? amount : "Your tip"} was received by *${params.workerFirstName}*. Thank you for your kindness! 🙏\n\n` +
        `_Ref: ${params.paymentId}_\n\n` +
        `Powered by *Slip a Tip*`,
    },
  });
}

// ---------------------------------------------------------------------------
// 3. Car guard notification — sent when they receive a tip
// ---------------------------------------------------------------------------
export interface SendWorkerTipNotificationParams {
  workerPhone: string;
  workerFirstName: string;
  amountZAR: number;
  netAmountZAR: number;
  paymentId: string;
}

export async function sendWorkerTipNotification(params: SendWorkerTipNotificationParams): Promise<{ messageId: string } | null> {
  const to = normalisePhone(params.workerPhone);
  const gross = `R${params.amountZAR.toFixed(2)}`;
  const net = `R${params.netAmountZAR.toFixed(2)}`;

  return sendMessage({
    to,
    type: "text",
    text: {
      body:
        `🎉 *You've been tipped, ${params.workerFirstName}!*\n\n` +
        `💰 Tip amount: *${gross}*\n` +
        `🏦 Your earnings (after fees): *${net}*\n\n` +
        `Funds will be available after the settlement period.\n\n` +
        `_Ref: ${params.paymentId}_\n\n` +
        `Thank you for your great service! 🤝`,
    },
  });
}

// ---------------------------------------------------------------------------
// 4. Follow-up reminder — sent at 5 hours if still unpaid
//    NOTE: This is a conversation initiated by us OUTSIDE the 24h window,
//    so it requires a pre-approved Message Template.
//    Template name: "tip_followup_reminder" (must be created in Meta Business Manager)
//    Until approved, we fall back to a free-form text message.
// ---------------------------------------------------------------------------
export interface SendFollowUpReminderParams {
  customerPhone: string;
  customerName?: string;
  workerFirstName: string;
  paymentLinkUrl: string;
  amountZAR: number;
  paymentId: string;
}

// ---------------------------------------------------------------------------
// 5. OTT Voucher PIN — sent to worker after successful OTT withdrawal
// ---------------------------------------------------------------------------
export interface SendOttVoucherPinParams {
  workerPhone: string;
  workerFirstName: string;
  pin: string;
  amountZAR: number;
  withdrawalId: string;
}

export async function sendOttVoucherPin(params: SendOttVoucherPinParams): Promise<{ messageId: string } | null> {
  const to = normalisePhone(params.workerPhone);
  const amount = `R${params.amountZAR.toFixed(2)}`;

  return sendMessage({
    to,
    type: "text",
    text: {
      body:
        `🎟️ *Your Slip a Tip voucher PIN is: ${params.pin}*\n\n` +
        `💰 Amount: *${amount}*\n\n` +
        `Redeem at any OTT outlet. Valid for 30 days.\n\n` +
        `_Ref: ${params.withdrawalId}_\n\n` +
        `Powered by *Slip a Tip* 🤝`,
    },
  });
}

export async function sendFollowUpReminder(params: SendFollowUpReminderParams): Promise<{ messageId: string } | null> {
  const to = normalisePhone(params.customerPhone);
  const amount = `R${params.amountZAR.toFixed(2)}`;

  // Try approved template first — requires WHATSAPP_FOLLOWUP_TEMPLATE_NAME env var
  const templateName = process.env.WHATSAPP_FOLLOWUP_TEMPLATE_NAME;
  if (templateName) {
    return sendMessage({
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: params.workerFirstName },
              { type: "text", text: amount },
              { type: "text", text: params.paymentLinkUrl },
            ],
          },
        ],
      },
    });
  }

  // Fallback: free-form text (only works within 24h session window)
  return sendMessage({
    to,
    type: "text",
    text: {
      preview_url: true,
      body:
        `👋 Just a friendly reminder!\n\n` +
        `You still have a pending tip of *${amount}* for *${params.workerFirstName}*.\n\n` +
        `🔗 Pay here (link valid for 24h):\n${params.paymentLinkUrl}\n\n` +
        `_Ref: ${params.paymentId}_\n\n` +
        `Powered by *Slip a Tip*`,
    },
  });
}
