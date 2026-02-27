import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * GET  — Generate a new TOTP secret + QR code for the authenticated admin.
 * POST — Verify the first TOTP code and enable 2FA (saves secret permanently).
 */

export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const secretObj = speakeasy.generateSecret({
      name: `Slip a Tip (${session.user.email || session.user.id})`,
      issuer: "Slip a Tip",
      length: 20,
    });

    const qrDataUrl = await QRCode.toDataURL(secretObj.otpauth_url!);

    return NextResponse.json({
      secret: secretObj.base32,
      qrDataUrl,
      otpauthUrl: secretObj.otpauth_url,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("2FA setup GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const { secret, token } = await request.json();

    if (!secret || !token) {
      return NextResponse.json({ error: "secret and token are required" }, { status: 400 });
    }

    const valid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (!valid) {
      return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 400 });
    }

    // Generate 8 single-use backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(5).toString("hex").toUpperCase()
    );

    await db.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: secret,
        totpEnabled: true,
        backupCodes,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "2FA_ENABLED",
        entity: "User",
        entityId: session.user.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true, backupCodes });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("2FA setup POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
