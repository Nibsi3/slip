import { NextRequest, NextResponse } from "next/server";
import { processSettlementClears, recalculateReserve } from "@/lib/security";

/**
 * Settlement clearing cron endpoint.
 * Call this periodically (e.g., every 15 minutes) to clear matured settlement holds
 * and recalculate the chargeback reserve.
 *
 * Protect with a secret token in production:
 *   GET /api/cron/settlements?token=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cleared = await processSettlementClears();
    const reserve = await recalculateReserve();

    return NextResponse.json({
      success: true,
      cleared,
      reserve: {
        totalPlatformBalance: reserve.totalPlatformBalance,
        reserveAmount: reserve.reserveAmount,
        reservePercent: reserve.reservePercent,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron settlement clearing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
