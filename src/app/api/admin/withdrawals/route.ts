import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, PROCESSING, COMPLETED, FAILED
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = status ? { status: status as any } : {};

    const [withdrawals, total] = await Promise.all([
      db.withdrawal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          worker: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      db.withdrawal.count({ where }),
    ]);

    return NextResponse.json({
      withdrawals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin get withdrawals error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(["approve", "process", "complete", "reject"]),
  reference: z.string().optional(),
  reason: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const data = updateSchema.parse(body);

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: data.withdrawalId },
      include: { worker: true, ledgerEntry: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["approve", "reject"],
      PROCESSING: ["complete", "reject"],
    };

    const allowed = validTransitions[withdrawal.status] || [];
    if (!allowed.includes(data.action)) {
      return NextResponse.json(
        { error: `Cannot ${data.action} a ${withdrawal.status} withdrawal` },
        { status: 400 }
      );
    }

    if (data.action === "approve") {
      // PENDING → PROCESSING
      await db.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: "PROCESSING", reference: data.reference || null },
        });

        if (withdrawal.ledgerEntry) {
          await tx.ledgerEntry.update({
            where: { id: withdrawal.ledgerEntry.id },
            data: { status: "PENDING", reference: `Processing: ${data.reference || withdrawal.id}` },
          });
        }
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_APPROVED",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          details: { reference: data.reference },
        },
      });
    } else if (data.action === "process") {
      // Alias for approve (PENDING → PROCESSING)
      await db.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PROCESSING", reference: data.reference || null },
      });
    } else if (data.action === "complete") {
      // PROCESSING → COMPLETED
      await db.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            reference: data.reference || withdrawal.reference,
          },
        });

        if (withdrawal.ledgerEntry) {
          await tx.ledgerEntry.update({
            where: { id: withdrawal.ledgerEntry.id },
            data: { status: "COMPLETED" },
          });
        }
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_COMPLETED",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          details: { reference: data.reference, netAmount: Number(withdrawal.netAmount) },
        },
      });

      console.log(
        `Withdrawal ${withdrawal.id} completed: R${Number(withdrawal.netAmount)} to worker ${withdrawal.workerId}`
      );
    } else if (data.action === "reject") {
      // PENDING/PROCESSING → FAILED + refund wallet
      await db.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: "FAILED", reference: data.reason || "Rejected by admin" },
        });

        if (withdrawal.ledgerEntry) {
          await tx.ledgerEntry.update({
            where: { id: withdrawal.ledgerEntry.id },
            data: { status: "FAILED" },
          });
        }

        // Refund the worker's wallet
        await tx.worker.update({
          where: { id: withdrawal.workerId },
          data: { walletBalance: { increment: withdrawal.amount } },
        });
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_REJECTED",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          details: { reason: data.reason, refundedAmount: Number(withdrawal.amount) },
        },
      });

      console.log(
        `Withdrawal ${withdrawal.id} rejected: R${Number(withdrawal.amount)} refunded to worker ${withdrawal.workerId}`
      );
    }

    const updated = await db.withdrawal.findUnique({
      where: { id: withdrawal.id },
      include: {
        worker: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return NextResponse.json({ withdrawal: updated });
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
    console.error("Admin update withdrawal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
