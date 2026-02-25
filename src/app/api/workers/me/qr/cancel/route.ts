import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const cancelSchema = z.object({
  reason: z.enum(["LOST", "STOLEN", "DAMAGED", "NO_LONGER_NEEDED", "OTHER"]),
  details: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const body = await request.json();
    const data = cancelSchema.parse(body);

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Cancel all active QR codes for this worker
    const updated = await db.qRCode.updateMany({
      where: { workerId: worker.id, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        cancelReason: data.details ? `${data.reason}: ${data.details}` : data.reason,
        cancelledAt: new Date(),
      },
    });

    // Generate a new QR code for the worker
    const newQrCode = await db.qRCode.create({
      data: {
        token: worker.qrCode,
        workerId: worker.id,
        status: "ACTIVE",
        activatedAt: new Date(),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "QR_CANCELLED",
        entity: "QRCode",
        details: {
          reason: data.reason,
          details: data.details || null,
          cancelledCount: updated.count,
          newQrCodeId: newQrCode.id,
        },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
      },
    });

    // Update the worker's qrCode to a new unique code
    const newCode = require("crypto").randomBytes(16).toString("hex");
    await db.worker.update({
      where: { id: worker.id },
      data: { qrCode: newCode },
    });

    // Update the new QR code record token
    await db.qRCode.update({
      where: { id: newQrCode.id },
      data: { token: newCode },
    });

    return NextResponse.json({
      success: true,
      message: "QR code cancelled. A new QR code has been generated.",
      newQrCode: newCode,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Cancel QR error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
