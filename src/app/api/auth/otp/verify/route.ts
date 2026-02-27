import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp, getOtpPhone } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  sessionKey: z.string().min(1, "Session key is required"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Rate limit: max 10 OTP verify attempts per IP per 15 minutes
    const ipLimit = checkRateLimit(`otp-verify:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = schema.parse(body);

    const result = verifyOtp(data.sessionKey, data.code);

    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    // Return the verified phone so the registration form can proceed
    const phone = getOtpPhone(data.sessionKey);

    return NextResponse.json({
      verified: true,
      phone,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
