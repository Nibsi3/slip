import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const [
      totalWorkers,
      activeWorkers,
      totalTips,
      completedTips,
      pendingWithdrawals,
      tipAggregates,
      withdrawalAggregates,
      recentTips,
      recentWithdrawals,
    ] = await Promise.all([
      db.worker.count(),
      db.worker.count({ where: { isActive: true } }),
      db.tip.count(),
      db.tip.count({ where: { status: "COMPLETED" } }),
      db.withdrawal.count({ where: { status: "PENDING" } }),
      db.tip.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true, netAmount: true, feePlatform: true, feeGateway: true },
      }),
      db.withdrawal.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true, netAmount: true },
      }),
      db.tip.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { worker: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      db.withdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { worker: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalWorkers,
        activeWorkers,
        totalTips,
        completedTips,
        pendingWithdrawals,
        totalTipAmount: tipAggregates._sum.amount || 0,
        totalNetTips: tipAggregates._sum.netAmount || 0,
        totalPlatformFees: tipAggregates._sum.feePlatform || 0,
        totalGatewayFees: tipAggregates._sum.feeGateway || 0,
        totalWithdrawnAmount: withdrawalAggregates._sum.amount || 0,
      },
      recentTips,
      recentWithdrawals,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
