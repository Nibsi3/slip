import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth(["WORKER"]);
    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        tips: { where: { status: "COMPLETED" }, orderBy: { createdAt: "desc" }, take: 20 },
        _count: { select: { tips: { where: { status: "COMPLETED" } } } },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    return NextResponse.json({ worker });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get worker error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  employerName: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(20).optional(),
  bankBranchCode: z.string().max(10).optional(),
  whatsappPhone: z.string().max(20).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const body = await request.json();
    const data = updateSchema.parse(body);

    const worker = await db.worker.update({
      where: { userId: session.user.id },
      data,
    });

    return NextResponse.json({ worker });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Update worker error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
