import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No QR code IDs provided" }, { status: 400 });
    }

    if (ids.length > 500) {
      return NextResponse.json({ error: "Cannot delete more than 500 at once" }, { status: 400 });
    }

    // Fetch QR codes with their worker/user associations
    const qrCodes = await db.qRCode.findMany({
      where: { id: { in: ids } },
      include: {
        worker: {
          include: { user: true },
        },
      },
    });

    if (qrCodes.length === 0) {
      return NextResponse.json({ error: "No matching QR codes found" }, { status: 404 });
    }

    // Collect user IDs that need to be deleted (paired workers)
    const userIdsToDelete: string[] = [];
    const workerIdsToDelete: string[] = [];
    for (const qr of qrCodes) {
      if (qr.worker) {
        workerIdsToDelete.push(qr.worker.id);
        userIdsToDelete.push(qr.worker.userId);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      // Delete QR codes first (they reference workers)
      await tx.qRCode.deleteMany({ where: { id: { in: ids } } });

      if (workerIdsToDelete.length > 0) {
        // Delete related records before deleting workers/users
        await tx.tip.deleteMany({ where: { workerId: { in: workerIdsToDelete } } });
        await tx.ledgerEntry.deleteMany({ where: { workerId: { in: workerIdsToDelete } } });
        await tx.withdrawal.deleteMany({ where: { workerId: { in: workerIdsToDelete } } });
        await tx.worker.deleteMany({ where: { id: { in: workerIdsToDelete } } });
      }

      if (userIdsToDelete.length > 0) {
        await tx.session.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await tx.auditLog.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await tx.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
      }

      // Audit log for the admin who deleted
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "QR_BULK_DELETE",
          entity: "QRCode",
          details: {
            deletedQRCodes: qrCodes.length,
            deletedUsers: userIdsToDelete.length,
            tokens: qrCodes.map((q: { token: string }) => q.token),
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    });

    return NextResponse.json({
      deleted: qrCodes.length,
      usersDeleted: userIdsToDelete.length,
    });
  } catch (err) {
    console.error("QR delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
