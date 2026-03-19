import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { checkActivateIpLimit } from "@/lib/rate-limit";

const TERMS_VERSION = "v1.0";

const activateSchema = z.object({
  token: z.string().min(1, "QR code token is required"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().min(9, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  employerName: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(50).optional(),
  bankBranchCode: z.string().max(20).optional(),
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

    // --- Rate limiting: max 10 activation attempts per IP per hour ---
    const ipLimit = await checkActivateIpLimit(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many activation attempts from this network. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = activateSchema.parse(body);

    const phone = normalisePhone(data.phone);

    // Verify the QR code exists and is inactive
    const qrCode = await db.qRCode.findUnique({
      where: { token: data.token },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "Invalid QR code" },
        { status: 404 }
      );
    }

    if (qrCode.status !== "INACTIVE") {
      return NextResponse.json(
        { error: "This QR code has already been activated" },
        { status: 400 }
      );
    }

    // Check if phone is already taken
    const existingPhone = await db.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please log in instead." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(data.password, 12);

    // Create user + worker + link QR code in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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
              qrCode: data.token,
              employerName: data.employerName,
              jobTitle: data.jobTitle,
              bankName: data.bankName,
              bankAccountNo: data.bankAccountNo,
              bankBranchCode: data.bankBranchCode,
              whatsappPhone: phone,
            },
          },
        },
        include: { worker: true },
      });

      // Activate the QR code and link to the worker
      await tx.qRCode.update({
        where: { token: data.token },
        data: {
          workerId: newUser.worker!.id,
          status: "ACTIVE",
          activatedAt: new Date(),
        },
      });

      return newUser;
    });

    // Log the activation
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "QR_ACTIVATE",
        entity: "QRCode",
        entityId: qrCode.id,
        details: { token: data.token, termsVersion: TERMS_VERSION },
        ipAddress: ip,
      },
    });

    // Create session (auto-login)
    await createSession(user.id, user.role);

    return NextResponse.json({
      success: true,
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
    console.error("QR activation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
