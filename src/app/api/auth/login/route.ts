import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { checkLoginIpLimit, checkLoginIdentifierLimit, resetRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
  password: z.string().min(1),
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
    const data = loginSchema.parse(body);

    // --- Rate limiting: IP-based ---
    const ipLimit = await checkLoginIpLimit(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": Math.ceil((ipLimit.resetAt.getTime() - Date.now()) / 1000).toString() },
        }
      );
    }

    // --- Rate limiting: identifier-based ---
    const identifierLimit = await checkLoginIdentifierLimit(data.identifier.toLowerCase());
    if (!identifierLimit.allowed) {
      return NextResponse.json(
        { error: "Too many failed attempts for this account. Please wait 30 minutes before trying again." },
        { status: 429 }
      );
    }

    let user;
    if (looksLikePhone(data.identifier)) {
      const phone = normalisePhone(data.identifier);
      user = await db.user.findFirst({ where: { phone } });
    } else {
      user = await db.user.findFirst({ where: { email: data.identifier } });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // --- Check DB-level account lockout ---
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` },
        { status: 423 }
      );
    }

    const valid = await compare(data.password, user.passwordHash);
    if (!valid) {
      // Increment DB login attempt counter — lock after 10 failures
      const attempts = (user.loginAttempts || 0) + 1;
      const lockUntil = attempts >= 10 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await db.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil: lockUntil },
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Reset attempt counters on successful login
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
    await resetRateLimit(`login:id:${data.identifier.toLowerCase()}`);

    // --- P1.4: Enforce 2FA for admins ---
    const totpEnabled = user.totpEnabled;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (isAdmin && totpEnabled) {
      // Do NOT create session yet — client must complete 2FA first
      return NextResponse.json({
        requires2FA: true,
        userId: user.id,
      });
    }

    if (isAdmin && !totpEnabled) {
      // Admin has not set up 2FA yet — allow login but flag setup required
      await createSession(user.id, user.role);
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          ipAddress: ip,
          details: { warning: "2FA not yet configured" },
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
        requires2FASetup: true,
      });
    }

    await createSession(user.id, user.role);

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
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
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
