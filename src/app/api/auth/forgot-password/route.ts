import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { checkPasswordResetLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

function looksLikePhone(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  return digits.length >= 9 && /^[0-9+\s()-]+$/.test(val.trim());
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await request.json();
    const data = schema.parse(body);

    // Rate limit: max 5 reset requests per IP per hour
    const rateLimit = await checkPasswordResetLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429 }
      );
    }

    // Find the user
    let user;
    if (looksLikePhone(data.identifier)) {
      const phone = normalisePhone(data.identifier);
      user = await db.user.findUnique({ where: { phone } });
    } else {
      user = await db.user.findUnique({ where: { email: data.identifier } });
    }

    // Always return success to prevent account enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure reset token (32 bytes = 64 hex chars)
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.user.update as any)({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiresAt: expiresAt,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
      },
    });

    // Send reset email if user has an email address
    if (user.email) {
      await sendPasswordResetEmail({
        firstName: user.firstName,
        email: user.email,
        resetToken: rawToken,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
