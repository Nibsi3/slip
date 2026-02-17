import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { processSettlementClears, releaseFraudHold } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, cleared, fraud_held
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status === "pending") {
      where.clearedAt = null;
      where.isFraudHeld = false;
    } else if (status === "cleared") {
      where.clearedAt = { not: null };
    } else if (status === "fraud_held") {
      where.isFraudHeld = true;
      where.clearedAt = null;
    }

    const [holds, total] = await Promise.all([
      db.settlementHold.findMany({
        where: where as never,
        orderBy: { clearsAt: "asc" } as never,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          tip: { select: { amount: true, paymentId: true, createdAt: true } },
        },
      }),
      db.settlementHold.count({ where: where as never }),
    ]);

    return NextResponse.json({
      holds,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin settlements error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum(["clear_matured", "release_fraud_hold"]),
  holdId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const data = actionSchema.parse(body);

    if (data.action === "clear_matured") {
      const cleared = await processSettlementClears();

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SETTLEMENT_BATCH_CLEAR",
          entity: "SettlementHold",
          details: { clearedCount: cleared },
        },
      });

      return NextResponse.json({ success: true, cleared });
    }

    if (data.action === "release_fraud_hold") {
      if (!data.holdId) {
        return NextResponse.json({ error: "holdId required" }, { status: 400 });
      }

      await releaseFraudHold(data.holdId);

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SETTLEMENT_FRAUD_HOLD_RELEASED",
          entity: "SettlementHold",
          entityId: data.holdId,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
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
    console.error("Admin settlement action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
