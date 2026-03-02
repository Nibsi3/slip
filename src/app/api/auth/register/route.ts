import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { sendNewRegistrationEmail } from "@/lib/email";
import { checkRegisterIpLimit } from "@/lib/rate-limit";

const TERMS_VERSION = "v1.0";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().min(9, "Valid phone number is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g. !@#$%)"),
  termsAccepted: z.boolean().refine((v) => v === true, { message: "You must accept the terms and conditions" }),
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await request.json();
    const data = registerSchema.parse(body);

    // --- Rate limiting: max 5 registrations per IP per hour ---
    const ipLimit = await checkRegisterIpLimit(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from this network. Please try again later." },
        { status: 429 }
      );
    }

    const phone = normalisePhone(data.phone);

    const existingPhone = await db.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(data.password, 12);

    const user = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone,
        passwordHash,
        role: "WORKER",
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        termsIpAddress: ip,
        worker: {
          create: {
            phoneForIM: phone,
          },
        },
      },
      include: { worker: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    await createSession(user.id, user.role);

    await sendNewRegistrationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || phone,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
