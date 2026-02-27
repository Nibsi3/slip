import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNewApplicationEmail } from "@/lib/email";
import { checkApplyIpLimit } from "@/lib/rate-limit";

const applySchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  idNumber: z.string().optional(),
  phone: z.string().min(9, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  employerName: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  workLocation: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().optional(),
  bankName: z.string().optional().or(z.literal("")),
  bankAccountNo: z.string().optional().or(z.literal("")),
  bankBranchCode: z.string().optional().or(z.literal("")),
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

    // --- Rate limiting: max 5 applications per IP per hour ---
    const ipLimit = await checkApplyIpLimit(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many application attempts from this network. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = applySchema.parse(body);

    const phone = normalisePhone(data.phone);

    // Check for existing user with same phone
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // Check for existing email if provided
    if (data.email) {
      const existingEmail = await db.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hash(data.password, 12);

    // Create user + worker with isActive = false (pending approval)
    const user = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone,
        email: data.email || null,
        passwordHash,
        idNumber: data.idNumber || null,
        role: "WORKER",
        worker: {
          create: {
            employerName: data.employerName || null,
            jobTitle: data.jobTitle,
            bankName: data.bankName || null,
            bankAccountNo: data.bankAccountNo || null,
            bankBranchCode: data.bankBranchCode || null,
            phoneForIM: phone,
            isActive: false, // Pending admin approval
          },
        },
      },
      include: { worker: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "APPLY",
        entity: "User",
        entityId: user.id,
        details: {
          source: "manual_application",
          jobTitle: data.jobTitle,
          employerName: data.employerName || null,
          workLocation: data.workLocation || null,
          city: data.city,
          province: data.province || null,
        },
        ipAddress: ip,
      },
    });

    // Notify admin of new application
    await sendNewApplicationEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone,
      jobTitle: data.jobTitle,
      employerName: data.employerName || null,
      city: data.city,
      province: data.province || null,
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully. You will be notified once approved.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    // Handle Prisma unique constraint violations
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "An account with these details already exists. Please sign in instead." },
        { status: 400 }
      );
    }
    console.error("Application error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
