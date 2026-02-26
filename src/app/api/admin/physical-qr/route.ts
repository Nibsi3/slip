import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/admin/physical-qr — list all physical QR requests
export async function GET() {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const requests = await db.physicalQRRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        worker: {
          select: {
            id: true,
            jobTitle: true,
            employerName: true,
            physicalQrCount: true,
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin physical QR GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/physical-qr — approve | dispatch | reject
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const { requestId, action, adminNotes } = body as {
      requestId: string;
      action: "approve" | "dispatch" | "reject";
      adminNotes?: string;
    };

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action required" }, { status: 400 });
    }

    const req = await db.physicalQRRequest.findUnique({ where: { id: requestId } });
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const updates: Record<string, unknown> = { adminNotes: adminNotes || null };

    if (action === "approve") {
      updates.status = "APPROVED";
    } else if (action === "dispatch") {
      updates.status = "DISPATCHED";
      updates.dispatchedAt = new Date();
    } else if (action === "reject") {
      updates.status = "REJECTED";
      // Refund fee if charged
      if (Number(req.feeCharged) > 0) {
        await db.worker.update({
          where: { id: req.workerId },
          data: { walletBalance: { increment: Number(req.feeCharged) } },
        });
        // Also decrement count back
        await db.worker.update({
          where: { id: req.workerId },
          data: { physicalQrCount: { decrement: 1 } },
        });
      }
    }

    await db.physicalQRRequest.update({ where: { id: requestId }, data: updates });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `PHYSICAL_QR_${action.toUpperCase()}`,
        entity: "PhysicalQRRequest",
        entityId: requestId,
        details: { adminNotes: adminNotes || null },
      },
    });

    return NextResponse.json({ success: true, message: `Request ${action}d` });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin physical QR PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
