import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendEmailVerification } from "@/lib/email";
import { getAppUrl } from "@/lib/utils";

export async function POST() {
  try {
    const session = await requireAuth();
    const user = session.user;

    if (!user.email) {
      return NextResponse.json(
        { error: "No email address on your account. Please add one in Settings first." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    // Generate a token (raw for email link, hashed for DB storage)
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: hashedToken,
        emailVerifyExpiresAt: expiresAt,
      },
    });

    const appUrl = getAppUrl();
    const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmailVerification(user.email, user.firstName, verifyUrl);

    return NextResponse.json({ message: "Verification email sent. Please check your inbox." });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Email verify send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
