import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

/**
 * POST — Verify TOTP code after password login for admin accounts.
 * Expects a pending-2fa session cookie set by the login endpoint.
 * Returns the full session on success.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json();

    if (!userId || !token) {
      return NextResponse.json({ error: "userId and token are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        totpSecret: true,
        totpEnabled: true,
        backupCodes: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ error: "2FA not enabled for this account" }, { status: 400 });
    }

    // Check TOTP token
    const validTotp = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!validTotp) {
      // Check backup codes (single use)
      const normalised = token.toUpperCase().replace(/\s/g, "");
      const backupIndex = user.backupCodes.indexOf(normalised);
      if (backupIndex === -1) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }
      // Consume the backup code
      const updatedCodes = user.backupCodes.filter((_: string, i: number) => i !== backupIndex);
      await db.user.update({
        where: { id: user.id },
        data: { backupCodes: updatedCodes },
      });
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "2FA_BACKUP_CODE_USED",
          entity: "User",
          entityId: user.id,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          details: { codesRemaining: updatedCodes.length },
        },
      });
    }

    await createSession(user.id, user.role);

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_2FA",
        entity: "User",
        entityId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      role: user.role,
    });
  } catch (err) {
    console.error("2FA verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
