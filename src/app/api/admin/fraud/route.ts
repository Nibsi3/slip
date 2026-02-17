import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getReserveStatus, recalculateReserve, adjustReservePercent } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [events, total, reserveStatus, openCount, holdCount] = await Promise.all([
      db.fraudEvent.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      }),
      db.fraudEvent.count({ where: where as never }),
      getReserveStatus(),
      db.fraudEvent.count({ where: { status: "OPEN" } }),
      db.fraudEvent.count({ where: { action: "HOLD" as never, status: "OPEN" } }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        openEvents: openCount,
        heldTransactions: holdCount,
        chargebackReserve: reserveStatus,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin fraud events error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  eventId: z.string().min(1),
  action: z.enum(["resolve", "dismiss", "review"]),
  resolution: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const data = updateSchema.parse(body);

    const event = await db.fraudEvent.findUnique({ where: { id: data.eventId } });
    if (!event) {
      return NextResponse.json({ error: "Fraud event not found" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      resolve: "RESOLVED",
      dismiss: "DISMISSED",
      review: "REVIEWING",
    };

    await db.fraudEvent.update({
      where: { id: data.eventId },
      data: {
        status: statusMap[data.action] as never,
        resolvedBy: session.user.id,
        resolvedAt: data.action !== "review" ? new Date() : undefined,
        resolution: data.resolution || undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `FRAUD_EVENT_${data.action.toUpperCase()}`,
        entity: "FraudEvent",
        entityId: data.eventId,
        details: { resolution: data.resolution, originalType: event.type },
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
    console.error("Admin update fraud event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
