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
    const ipLimit = await checkRateLimit(`otp:ip:${ip}`, 5, 15 * 60 * 1000);
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
    const phoneLimit = await checkRateLimit(`otp:phone:${phone}`, 3, 15 * 60 * 1000);
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

    const { sessionKey, code, cooldownActive } = await generateOtp(phone);

    if (cooldownActive) {
      return NextResponse.json({
        sessionKey,
        message: "OTP already sent. Please check your phone.",
      });
    }

    // --- Send OTP via Demakatso SMS ---
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    const smsUsername = process.env.SMS_USERNAME;
    const smsPassword = process.env.SMS_PASSWORD;
    const smsApiUrl = process.env.SMS_API_URL;
    if (smsUsername && smsPassword && smsApiUrl) {
      try {
        const internationalPhone = phone.startsWith("0") ? `+27${phone.slice(1)}` : phone;
        const params = new URLSearchParams({
          username: smsUsername,
          password: smsPassword,
          to: internationalPhone,
          from: "SlipATip",
          message: `Your Slip a Tip verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        });
        await fetch(`${smsApiUrl}?${params.toString()}`, { method: "GET" });
      } catch (smsErr) {
        console.error("SMS send failed:", smsErr);
        // Don't block the flow — code is still valid
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
