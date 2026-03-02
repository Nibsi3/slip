/**
 * Bootstrap Admin Endpoint
 *
 * One-time endpoint to create the first SUPER_ADMIN user in production.
 * Protected by a BOOTSTRAP_SECRET environment variable.
 *
 * Usage (run once, then disable by removing BOOTSTRAP_SECRET from env):
 *   POST /api/admin/bootstrap
 *   Headers: { "x-bootstrap-secret": "<BOOTSTRAP_SECRET>" }
 *   Body: { "email": "admin@yourcompany.com", "password": "...", "firstName": "...", "lastName": "..." }
 *
 * Security:
 *   - Requires BOOTSTRAP_SECRET header to match env var (never guessable)
 *   - Only works when public."User" has zero ADMIN/SUPER_ADMIN rows
 *   - Cannot create a second admin via this endpoint
 *   - Remove BOOTSTRAP_SECRET from env vars after first use to permanently disable
 */

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const bootstrapSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Needs uppercase")
    .regex(/[a-z]/, "Needs lowercase")
    .regex(/[0-9]/, "Needs number")
    .regex(/[^A-Za-z0-9]/, "Needs special character"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // 1. Check bootstrap secret
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
  if (!bootstrapSecret) {
    return NextResponse.json(
      { error: "Bootstrap is disabled. Set BOOTSTRAP_SECRET env var to enable." },
      { status: 403 }
    );
  }

  const providedSecret = request.headers.get("x-bootstrap-secret");
  if (!providedSecret || providedSecret !== bootstrapSecret) {
    return NextResponse.json(
      { error: "Invalid bootstrap secret." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const data = bootstrapSchema.parse(body);

    // 2. Only allow if no admin exists yet
    const existingAdmin = await db.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin already exists. Bootstrap is a one-time operation." },
        { status: 409 }
      );
    }

    // 3. Check email not taken
    const existingEmail = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 409 }
      );
    }

    // 4. Create super admin
    const passwordHash = await hash(data.password, 12);

    const admin = await db.user.create({
      data: {
        email: data.email,
        phone: data.phone || null,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        role: "SUPER_ADMIN",
        isVerified: true,
        emailVerified: true,
        termsAcceptedAt: new Date(),
        termsVersion: "v1.0",
        termsIpAddress: request.headers.get("x-forwarded-for") || "bootstrap",
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "BOOTSTRAP_ADMIN_CREATED",
        entity: "User",
        entityId: admin.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        details: { email: admin.email, method: "bootstrap-endpoint" },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Super admin created: ${admin.email}. IMPORTANT: Remove BOOTSTRAP_SECRET from your env vars now to disable this endpoint permanently.`,
      userId: admin.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Bootstrap error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Disable GET so it's not discoverable
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
