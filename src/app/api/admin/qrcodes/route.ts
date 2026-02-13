import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const batchId = searchParams.get("batchId");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const [qrCodes, total, batches] = await Promise.all([
      db.qRCode.findMany({
        where,
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, phone: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.qRCode.count({ where }),
      db.qRCode.groupBy({
        by: ["batchId"],
        _count: { id: true },
        orderBy: { batchId: "desc" },
      }),
    ]);

    // Stats
    const [totalCodes, activeCodes, inactiveCodes] = await Promise.all([
      db.qRCode.count(),
      db.qRCode.count({ where: { status: "ACTIVE" } }),
      db.qRCode.count({ where: { status: "INACTIVE" } }),
    ]);

    return NextResponse.json({
      qrCodes: qrCodes.map((qr) => ({
        id: qr.id,
        token: qr.token,
        status: qr.status,
        batchId: qr.batchId,
        createdAt: qr.createdAt,
        activatedAt: qr.activatedAt,
        worker: qr.worker
          ? {
              firstName: qr.worker.user.firstName,
              lastName: qr.worker.user.lastName,
              phone: qr.worker.user.phone,
              jobTitle: qr.worker.jobTitle,
              employerName: qr.worker.employerName,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalCodes,
        active: activeCodes,
        inactive: inactiveCodes,
      },
      batches: batches
        .filter((b) => b.batchId)
        .map((b) => ({
          batchId: b.batchId,
          count: b._count.id,
        })),
    });
  } catch (err) {
    console.error("QR list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
