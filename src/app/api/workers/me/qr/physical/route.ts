import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const PHYSICAL_QR_FEE = 50; // R50 per additional card

export async function GET() {
  try {
    const session = await requireAuth(["WORKER", "ADMIN", "SUPER_ADMIN"]);

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        physicalQrCount: true,
        physicalQrRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            isFree: true,
            feeCharged: true,
            address: true,
            notes: true,
            adminNotes: true,
            dispatchedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    const isFreeEligible = worker.physicalQrCount === 0;
    const fee = isFreeEligible ? 0 : PHYSICAL_QR_FEE;

    return NextResponse.json({
      physicalQrCount: worker.physicalQrCount,
      isFreeEligible,
      fee,
      requests: worker.physicalQrRequests,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Physical QR GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER", "ADMIN", "SUPER_ADMIN"]);
    const body = await request.json();
    const { address, notes } = body as { address?: string; notes?: string };

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      select: { id: true, physicalQrCount: true },
    });

    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    // Check for pending request already
    const existingPending = await db.physicalQRRequest.findFirst({
      where: { workerId: worker.id, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending physical QR request." }, { status: 400 });
    }

    const isFree = worker.physicalQrCount === 0;
    const fee = isFree ? 0 : PHYSICAL_QR_FEE;

    // If not free, check wallet balance
    if (!isFree) {
      const workerWithBalance = await db.worker.findUnique({
        where: { id: worker.id },
        select: { walletBalance: true },
      });
      if (!workerWithBalance || Number(workerWithBalance.walletBalance) < fee) {
        return NextResponse.json(
          { error: `Insufficient balance. A physical QR card costs R${fee}. Your current balance is R${Number(workerWithBalance?.walletBalance || 0).toFixed(2)}.` },
          { status: 400 }
        );
      }

      // Deduct fee from wallet
      await db.worker.update({
        where: { id: worker.id },
        data: { walletBalance: { decrement: fee } },
      });
    }

    const req = await db.physicalQRRequest.create({
      data: {
        workerId: worker.id,
        isFree,
        feeCharged: fee,
        address: address || null,
        notes: notes || null,
        status: "PENDING",
      },
    });

    // Increment count
    await db.worker.update({
      where: { id: worker.id },
      data: { physicalQrCount: { increment: 1 } },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REQUEST_PHYSICAL_QR",
        entity: "PhysicalQRRequest",
        entityId: req.id,
        details: { isFree, fee, address },
      },
    });

    return NextResponse.json({
      success: true,
      message: isFree
        ? "Physical QR card requested! Your first card is free. We'll dispatch it soon."
        : `Physical QR card requested! R${fee} has been deducted from your wallet.`,
      request: req,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Physical QR POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
