/**
 * WhatsApp Cloud API Webhook
 *
 * Full conversational tip flow:
 *
 *  1. Customer scans worker QR → opens WhatsApp with pre-filled "TIP [qrCode]"
 *  2. Customer taps Send → this webhook fires with their phone + message
 *  3. We look up the worker, reply with amount selection (interactive buttons)
 *  4. Customer taps an amount button → webhook fires again
 *  5. We create a Stitch payment link and reply with it
 *  6. Customer pays → Stitch webhook fires → payment confirmed
 *
 * GET  — Meta webhook verification challenge
 * POST — incoming messages & status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createStitchPaymentLink } from "@/lib/stitch";
import { generatePaymentId, calculateFees, getAppUrl } from "@/lib/utils";
import {
  checkTipSentVelocity,
  checkTipReceivedVelocity,
  checkBalanceCap,
} from "@/lib/security";

// ---------------------------------------------------------------------------
// In-memory conversation state
// key: customerPhone (E.164 without +), value: { qrCode, workerName, expiresAt }
// TTL: 10 minutes — enough time to tap an amount button
// ---------------------------------------------------------------------------
const pendingAmountSelection = new Map<string, {
  qrCode: string;
  workerFirstName: string;
  expiresAt: number;
}>();

const SELECTION_TTL_MS = 10 * 60 * 1000; // 10 min

// Pre-set tip amounts shown as WhatsApp buttons (max 3 per row, 10 buttons total)
const TIP_AMOUNTS = [20, 30, 50, 75, 100, 150, 200];

// ---------------------------------------------------------------------------
// Core WhatsApp send helpers
// ---------------------------------------------------------------------------
function getWaConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set");
  }
  return { phoneNumberId, accessToken };
}

async function waSend(payload: Record<string, unknown>) {
  try {
    const { phoneNumberId, accessToken } = getWaConfig();
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      }
    );
    const json = await res.json();
    if (!res.ok) console.error("[WA send] failed:", JSON.stringify(json));
    return json?.messages?.[0]?.id as string | undefined;
  } catch (err) {
    console.error("[WA send] error:", err);
    return undefined;
  }
}

/** Send a plain text message */
async function sendText(to: string, body: string) {
  return waSend({ to, type: "text", text: { preview_url: false, body } });
}

/** Send interactive button list */
async function sendAmountButtons(to: string, workerFirstName: string) {
  return waSend({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: `Tip ${workerFirstName}` },
      body: { text: `How much would you like to tip ${workerFirstName} today? Select an amount below.` },
      footer: { text: "Slip a Tip · Secured by Stitch Instant EFT" },
      action: {
        button: "Choose amount",
        sections: [
          {
            title: "Select a tip amount",
            rows: TIP_AMOUNTS.map((amt) => ({
              id: `AMT_${amt}`,
              title: `R${amt}`,
              description: `Send ${workerFirstName} a R${amt} tip`,
            })),
          },
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// GET — Meta webhook verification
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // If a human opens this URL in a browser, it won't include Meta's hub.* params.
  // Return 200 to avoid confusion.
  if (!mode) {
    return new NextResponse("OK", { status: 200 });
  }

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("[WA webhook] WHATSAPP_VERIFY_TOKEN not set");
    return new NextResponse("Configuration error", { status: 500 });
  }

  console.log("[WA webhook] Verification attempt:", {
    mode,
    hasToken: Boolean(token),
    tokenMatch: token === verifyToken,
    hasChallenge: Boolean(challenge),
  });

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WA webhook] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WA webhook] Verification failed — token mismatch");
  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming events from Meta
// ---------------------------------------------------------------------------
interface WaStatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string }[];
}

interface WaIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: "list_reply" | "button_reply";
    list_reply?: { id: string; title: string };
    button_reply?: { id: string; title: string };
  };
}

interface WaWebhookPayload {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata?: { display_phone_number: string; phone_number_id: string };
        statuses?: WaStatusUpdate[];
        messages?: WaIncomingMessage[];
        contacts?: { profile: { name: string }; wa_id: string }[];
        errors?: { code: number; title: string; message: string }[];
      };
      field: string;
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("[WA webhook] POST received:", rawBody.slice(0, 2000));

    let body: WaWebhookPayload;
    try {
      body = JSON.parse(rawBody) as WaWebhookPayload;
    } catch {
      console.error("[WA webhook] Failed to parse JSON");
      return new NextResponse("OK");
    }

    if (body.object !== "whatsapp_business_account") {
      console.log("[WA webhook] Unexpected object type:", body.object);
      return new NextResponse("OK");
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        for (const status of value.statuses ?? []) {
          await handleStatusUpdate(status);
        }

        for (const message of value.messages ?? []) {
          const contactName = value.contacts?.[0]?.profile?.name;
          await handleIncomingMessage(message, contactName);
        }
      }
    }

    return new NextResponse("OK");
  } catch (err) {
    console.error("[WA webhook] Error:", err);
    return new NextResponse("OK");
  }
}

// ---------------------------------------------------------------------------
// Status update handler
// ---------------------------------------------------------------------------
async function handleStatusUpdate(status: WaStatusUpdate) {
  if (status.status === "failed") {
    console.error(`[WA webhook] Message ${status.id} failed:`, status.errors);
  }
  if (status.status === "read") {
    await db.auditLog.create({
      data: {
        action: "WHATSAPP_MESSAGE_READ",
        entity: "WhatsApp",
        details: { messageId: status.id, recipientPhone: status.recipient_id },
      },
    }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Main inbound message router
// ---------------------------------------------------------------------------
async function handleIncomingMessage(message: WaIncomingMessage, contactName?: string) {
  const from = message.from; // E.164 without +, e.g. "27821234567"
  console.log(`[WA webhook] Message from ${from} type=${message.type}`);

  // --- Step 2: Customer tapped an amount from the list ---
  if (message.type === "interactive" && message.interactive) {
    const reply = message.interactive.list_reply ?? message.interactive.button_reply;
    if (reply?.id?.startsWith("AMT_")) {
      const amount = parseInt(reply.id.replace("AMT_", ""), 10);
      if (!isNaN(amount)) {
        await handleAmountSelected(from, amount);
        return;
      }
    }
  }

  // --- Step 1 or custom amount: text message ---
  if (message.type === "text" && message.text?.body) {
    const text = message.text.body.trim();

    // Check if this is a TIP [qrCode] initiation message (with optional personalized suffix)
    const tipMatch = text.match(/^TIP[\s_-]+([a-zA-Z0-9]+)(?:\s*[-–—].*)?$/i);
    if (tipMatch) {
      await handleTipInitiation(from, tipMatch[1]);
      return;
    }

    // Ignore stray text messages when a session is active — user must use the list buttons
    // (no custom amount typing via WhatsApp)

    // Unknown message — log it
    await db.auditLog.create({
      data: {
        action: "WHATSAPP_INCOMING_MESSAGE",
        entity: "WhatsApp",
        details: { from, messageId: message.id, text, contactName },
      },
    }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Step 1: Customer sent "TIP [qrCode]" — look up worker, ask for amount
// ---------------------------------------------------------------------------
async function handleTipInitiation(from: string, qrCode: string) {
  // First try looking up via QRCode.token (physical stickers use short tokens like INIT0001)
  let worker = await (async () => {
    const qrRecord = await db.qRCode.findUnique({
      where: { token: qrCode },
      include: {
        worker: {
          where: { isActive: true },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (qrRecord?.worker) return qrRecord.worker;
    // Fallback: treat qrCode as the Worker.qrCode cuid (legacy / direct links)
    return db.worker.findFirst({
      where: { qrCode, isActive: true },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  })();

  if (!worker) {
    await sendText(from,
      "Sorry, that QR code doesn't match an active worker. Please try scanning again or contact support."
    );
    return;
  }

  // Velocity check — protect against spam
  const sentVelocity = await checkTipSentVelocity(from);
  if (!sentVelocity.allowed) {
    await sendText(from, "You've sent too many tips recently. Please try again later.");
    return;
  }
  const receivedVelocity = await checkTipReceivedVelocity(worker.id);
  if (!receivedVelocity.allowed) {
    await sendText(from, "This worker is temporarily unable to receive tips. Please try again later.");
    return;
  }

  // Store pending session
  pendingAmountSelection.set(from, {
    qrCode,
    workerFirstName: worker.user.firstName,
    expiresAt: Date.now() + SELECTION_TTL_MS,
  });

  await sendAmountButtons(from, worker.user.firstName);
}

// ---------------------------------------------------------------------------
// Step 2: Customer selected / typed an amount — create Stitch link and send it
// ---------------------------------------------------------------------------
async function handleAmountSelected(from: string, amount: number) {
  const session = pendingAmountSelection.get(from);
  if (!session || session.expiresAt < Date.now()) {
    await sendText(from,
      "Your session expired. Please scan the QR code again to start a new tip. 🙏"
    );
    return;
  }

  const { qrCode, workerFirstName } = session;

  const worker = await db.worker.findFirst({
    where: { qrCode, isActive: true },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  if (!worker) {
    pendingAmountSelection.delete(from);
    await sendText(from, "This QR code is no longer active. Please ask for a new one.");
    return;
  }

  // Balance cap check
  const { feePlatform, feeGateway, netAmount } = calculateFees(amount);
  const capCheck = await checkBalanceCap(worker.id, netAmount);
  if (!capCheck.allowed) {
    pendingAmountSelection.delete(from);
    await sendText(from, "This worker's account has reached its balance limit. Please try again later.");
    return;
  }

  // Create payment link
  const paymentId = generatePaymentId();
  const appUrl = getAppUrl();
  const returnUrl = `${appUrl}/tip/s/${paymentId}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  let stitch: { id: string; link: string };
  try {
    stitch = await createStitchPaymentLink({
      amountZAR: amount,
      merchantReference: paymentId,
      payerName: "Guest",
      redirectUrl: returnUrl,
      expiresAt,
    });
  } catch (err) {
    console.error("[WA webhook] Stitch error:", err);
    await sendText(from, "Sorry, there was a problem creating your payment link. Please try again in a moment.");
    return;
  }

  // Save tip record
  const tip = await db.tip.create({
    data: {
      workerId: worker.id,
      amount,
      feePlatform,
      feeGateway,
      netAmount,
      paymentId,
      paymentMethod: "stitch",
      paystackRef: stitch.id,
      customerPhone: from,
      paymentLinkUrl: stitch.link,
      whatsappLinkSentAt: new Date(),
      status: "PENDING",
    },
  });

  // Clear session
  pendingAmountSelection.delete(from);

  const gross = `R${amount.toFixed(0)}`;

  // Send the branded payment message
  await waSend({
    to: from,
    type: "text",
    text: {
      preview_url: true,
      body:
        `✅ *Your payment link is ready!*\n\n` +
        `You're tipping *${workerFirstName} ${worker.user.lastName}* — *${gross}*\n\n` +
        `Tap the link below to pay securely via Instant EFT:\n` +
        `${stitch.link}\n\n` +
        `_Ref: ${paymentId}_\n` +
        `_Link valid for 24 hours._\n\n` +
        `*Slip a Tip* — cashless tipping, made simple.`,
    },
  });

  await db.auditLog.create({
    data: {
      action: "WHATSAPP_TIP_LINK_SENT",
      entity: "Tip",
      entityId: tip.id,
      details: { from, amount, workerId: worker.id, paymentLinkId: stitch.id },
    },
  }).catch(() => {});
}
