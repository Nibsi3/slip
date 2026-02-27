import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOtp } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

const schema = z.object({
  phone: z.string().min(9, "Valid phone number is required"),
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Rate limit: max 5 OTP requests per IP per 15 minutes
    const ipLimit = checkRateLimit(`otp:ip:${ip}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = schema.parse(body);
    const phone = normalisePhone(data.phone);

    // Rate limit per phone: max 3 OTP requests per phone per 15 minutes
    const phoneLimit = checkRateLimit(`otp:phone:${phone}`, 3, 15 * 60 * 1000);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests for this number. Please wait before trying again." },
        { status: 429 }
      );
    }

    // Check if phone already registered
    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 400 }
      );
    }

    const { sessionKey, code, cooldownActive } = generateOtp(phone);

    if (cooldownActive) {
      return NextResponse.json({
        sessionKey,
        message: "OTP already sent. Please check your phone.",
      });
    }

    // --- Send OTP via SMS ---
    // Using Paystack's Customer Validation or a dedicated SMS provider
    // For now, log the OTP in development and send via available channels
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    // Attempt to send via SMS provider if configured
    const smsApiKey = process.env.SMS_API_KEY;
    const smsApiUrl = process.env.SMS_API_URL;
    if (smsApiKey && smsApiUrl) {
      try {
        await fetch(smsApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${smsApiKey}`,
          },
          body: JSON.stringify({
            to: phone.startsWith("0") ? `+27${phone.slice(1)}` : phone,
            message: `Your Slip a Tip verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
          }),
        });
      } catch (smsErr) {
        console.error("SMS send failed:", smsErr);
        // Don't block the flow — code is still valid for dev/test
      }
    }

    return NextResponse.json({
      sessionKey,
      message: "Verification code sent to your phone.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
