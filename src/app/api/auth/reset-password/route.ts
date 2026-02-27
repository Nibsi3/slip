import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { createHash } from "crypto";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await request.json();
    const data = schema.parse(body);

    // Hash the incoming token to compare with stored hash
    const hashedToken = createHash("sha256").update(data.token).digest("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db.user.findFirst as any)({
      where: {
        resetToken: hashedToken,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(data.password, 12);

    // Update password, clear reset token, reset login attempts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.user.update as any)({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate ALL existing sessions for this user
    await db.session.deleteMany({ where: { userId: user.id } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
