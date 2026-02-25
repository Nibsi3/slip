import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

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
  bankName: z.string().min(1, "Bank name is required"),
  bankAccountNo: z.string().min(1, "Account number is required"),
  bankBranchCode: z.string().min(1, "Branch code is required"),
  phoneForIM: z.string().optional(),
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
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
            bankName: data.bankName,
            bankAccountNo: data.bankAccountNo,
            bankBranchCode: data.bankBranchCode,
            phoneForIM: data.phoneForIM ? normalisePhone(data.phoneForIM) : phone,
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
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      },
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
    console.error("Application error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
