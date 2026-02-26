import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendApprovalEmail, sendRejectionEmail, sendDeactivationEmail } from "@/lib/email";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const workers = await db.worker.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            idNumber: true,
            isVerified: true,
            createdAt: true,
          },
        },
        _count: { select: { tips: { where: { status: "COMPLETED" } }, withdrawals: true } },
        qrCodes: { select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ workers });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin workers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/workers  — approve | reject | activate | deactivate | edit
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const { workerId, action, reason, ...editFields } = body as {
      workerId: string;
      action: "approve" | "reject" | "activate" | "deactivate" | "edit";
      reason?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      employerName?: string;
      bankName?: string;
      bankAccountNo?: string;
      bankBranchCode?: string;
    };

    if (!workerId || !action) {
      return NextResponse.json({ error: "workerId and action required" }, { status: 400 });
    }

    const worker = await db.worker.findUnique({
      where: { id: workerId },
      include: { user: true },
    });
    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    if (action === "approve") {
      await db.worker.update({ where: { id: workerId }, data: { isActive: true } });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "APPROVE_WORKER",
          entity: "Worker",
          entityId: workerId,
          details: { workerName: `${worker.user.firstName} ${worker.user.lastName}` },
        },
      });
      await sendApprovalEmail({ firstName: worker.user.firstName, email: worker.user.email });
      return NextResponse.json({ success: true, message: "Worker approved" });
    }

    if (action === "reject") {
      await db.worker.update({ where: { id: workerId }, data: { isActive: false } });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "REJECT_WORKER",
          entity: "Worker",
          entityId: workerId,
          details: { reason: reason || null },
        },
      });
      await sendRejectionEmail({ firstName: worker.user.firstName, email: worker.user.email, reason });
      return NextResponse.json({ success: true, message: "Worker rejected" });
    }

    if (action === "activate") {
      await db.worker.update({ where: { id: workerId }, data: { isActive: true } });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ACTIVATE_WORKER",
          entity: "Worker",
          entityId: workerId,
        },
      });
      return NextResponse.json({ success: true, message: "Worker activated" });
    }

    if (action === "deactivate") {
      await db.worker.update({ where: { id: workerId }, data: { isActive: false } });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DEACTIVATE_WORKER",
          entity: "Worker",
          entityId: workerId,
          details: { reason: reason || null },
        },
      });
      await sendDeactivationEmail({ firstName: worker.user.firstName, email: worker.user.email, reason });
      return NextResponse.json({ success: true, message: "Worker deactivated" });
    }

    if (action === "edit") {
      const userUpdates: Record<string, string> = {};
      const workerUpdates: Record<string, string | null> = {};

      if (editFields.firstName) userUpdates.firstName = editFields.firstName;
      if (editFields.lastName) userUpdates.lastName = editFields.lastName;
      if (editFields.email !== undefined) userUpdates.email = editFields.email;
      if (editFields.phone !== undefined) userUpdates.phone = editFields.phone;
      if (editFields.jobTitle !== undefined) workerUpdates.jobTitle = editFields.jobTitle;
      if (editFields.employerName !== undefined) workerUpdates.employerName = editFields.employerName || null;
      if (editFields.bankName !== undefined) workerUpdates.bankName = editFields.bankName || null;
      if (editFields.bankAccountNo !== undefined) workerUpdates.bankAccountNo = editFields.bankAccountNo || null;
      if (editFields.bankBranchCode !== undefined) workerUpdates.bankBranchCode = editFields.bankBranchCode || null;

      if (Object.keys(userUpdates).length > 0) {
        await db.user.update({ where: { id: worker.userId }, data: userUpdates });
      }
      if (Object.keys(workerUpdates).length > 0) {
        await db.worker.update({ where: { id: workerId }, data: workerUpdates });
      }
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "EDIT_WORKER",
          entity: "Worker",
          entityId: workerId,
          details: { changes: { ...userUpdates, ...workerUpdates } },
        },
      });
      return NextResponse.json({ success: true, message: "Worker updated" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin worker PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/workers?workerId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");

    if (!workerId) return NextResponse.json({ error: "workerId required" }, { status: 400 });

    const worker = await db.worker.findUnique({
      where: { id: workerId },
      include: { user: true },
    });
    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_WORKER",
        entity: "Worker",
        entityId: workerId,
        details: { deletedName: `${worker.user.firstName} ${worker.user.lastName}`, deletedEmail: worker.user.email },
      },
    });

    // Cascade delete via user (Worker.user has onDelete: Cascade)
    await db.user.delete({ where: { id: worker.userId } });

    return NextResponse.json({ success: true, message: "Worker deleted" });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin worker DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
