import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Valid email required"),
});

/**
 * GET /api/auth/verify-email?token=...&email=...
 * Validates the email verification token and marks the email as verified.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = schema.parse({
      token: searchParams.get("token"),
      email: searchParams.get("email"),
    });

    const hashedToken = createHash("sha256").update(data.token).digest("hex");

    const user = await db.user.findFirst({
      where: {
        email: data.email,
        emailVerifyToken: hashedToken,
        emailVerifyExpiresAt: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?status=invalid", request.url)
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    return NextResponse.redirect(
      new URL("/auth/verify-email?status=success", request.url)
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?status=invalid", request.url)
      );
    }
    console.error("Email verify error:", err);
    return NextResponse.redirect(
      new URL("/auth/verify-email?status=error", request.url)
    );
  }
}
