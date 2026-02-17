import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const reviewed = searchParams.get("reviewed");
    const riskLevel = searchParams.get("riskLevel");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (reviewed === "true") where.isReviewed = true;
    if (reviewed === "false") where.isReviewed = false;
    if (riskLevel) where.riskLevel = riskLevel;

    const [alerts, total] = await Promise.all([
      db.amlAlert.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, phone: true } } },
          },
        },
      }),
      db.amlAlert.count({ where: where as never }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin AML alerts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  alertId: z.string().min(1),
  action: z.enum(["review", "dismiss"]),
  notes: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const alert = await db.amlAlert.findUnique({ where: { id: data.alertId } });
    if (!alert) {
      return NextResponse.json({ error: "AML alert not found" }, { status: 404 });
    }

    await db.amlAlert.update({
      where: { id: data.alertId },
      data: {
        isReviewed: true,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `AML_ALERT_${data.action.toUpperCase()}`,
        entity: "AmlAlert",
        entityId: data.alertId,
        details: { notes: data.notes, alertType: alert.alertType, riskLevel: alert.riskLevel },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error("Admin AML review error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
