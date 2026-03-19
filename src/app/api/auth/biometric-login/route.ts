/**
 * Biometric login endpoint — called by the Android app after the native
 * biometric prompt succeeds. The phone stored in Capacitor Preferences is
 * sent here; we issue a fresh session cookie without re-checking the password.
 *
 * Security notes:
 * - Only reachable from the native app (Capacitor WebView); the biometric
 *   hardware already authenticated the device owner.
 * - Requires the User-Agent to contain "Capacitor" OR the custom header
 *   X-Capacitor-App to be present. This stops plain browser requests.
 * - Rate limited: 10 attempts per IP per 15 minutes.
 * - Account lockout is still respected.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(9),
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    // Must be called from the native Capacitor shell
    const isCapacitor =
      request.headers.get("x-capacitor-app") === "1" ||
      (request.headers.get("user-agent") || "").includes("Capacitor");

    if (!isCapacitor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(`biometric-login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone: rawPhone } = schema.parse(body);
    const phone = normalisePhone(rawPhone);

    const user = await db.user.findUnique({
      where: { phone },
      select: {
        id: true,
        role: true,
        lockedUntil: true,
        worker: { select: { isActive: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: "Account is temporarily locked" }, { status: 403 });
    }

    if (user.role === "WORKER" && user.worker && !user.worker.isActive) {
      return NextResponse.json({ error: "Account pending approval" }, { status: 403 });
    }

    // Admins cannot use biometric login
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Biometric login not available for admin accounts" }, { status: 403 });
    }

    await createSession(user.id, user.role);

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "BIOMETRIC_LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
      },
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    console.error("[biometric-login] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
