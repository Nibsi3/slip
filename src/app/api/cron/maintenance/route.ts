import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DB maintenance cron endpoint.
 * Run daily (e.g. 02:00 SAST) via cron job or Vercel cron.
 *
 * Tasks:
 *  1. Delete expired sessions
 *  2. Archive VelocityRecords older than 30 days
 *  3. Archive DeviceFingerprints older than 90 days
 *  4. Warn workers approaching 180-day balance forfeiture (at 150 days and 170 days)
 *  5. Forfeit balances of workers with 180+ days of inactivity
 *
 * Protect with CRON_SECRET:
 *   GET /api/cron/maintenance?token=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  try {
    // 1. Delete expired sessions
    const { count: expiredSessions } = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    results.expiredSessionsDeleted = expiredSessions;

    // 2. Archive VelocityRecords older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count: velocityArchived } = await db.velocityRecord.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });
    results.velocityRecordsArchived = velocityArchived;

    // 3. Archive DeviceFingerprints older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { count: fingerprintsArchived } = await db.deviceFingerprint.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    results.deviceFingerprintsArchived = fingerprintsArchived;

    // 4 & 5. Balance forfeiture: 180 days of inactivity (any activity resets clock)
    const now = new Date();
    const day150 = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
    const day170 = new Date(now.getTime() - 170 * 24 * 60 * 60 * 1000);
    const day180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Find all workers with a positive balance
    const workersWithBalance = await db.worker.findMany({
      where: { walletBalance: { gt: 0 }, isActive: true },
      select: {
        id: true,
        walletBalance: true,
        userId: true,
        tips: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        withdrawals: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            email: true,
            sessions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    });

    let warned150 = 0;
    let warned170 = 0;
    let forfeited = 0;

    for (const worker of workersWithBalance) {
      // Determine last activity date
      const dates: Date[] = [new Date(worker.user.sessions[0]?.createdAt ?? 0)];
      if (worker.tips[0]) dates.push(new Date(worker.tips[0].createdAt));
      if (worker.withdrawals[0]) dates.push(new Date(worker.withdrawals[0].createdAt));
      const lastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));

      const balance = Number(worker.walletBalance);
      if (balance <= 0) continue;

      if (lastActivity < day180) {
        // Forfeit balance
        await db.$transaction(async (tx) => {
          await tx.worker.update({
            where: { id: worker.id },
            data: { walletBalance: 0, availableBalance: 0 },
          });
          await tx.ledgerEntry.create({
            data: {
              workerId: worker.id,
              transactionType: "PAYOUT",
              amount: balance,
              feePlatform: 0,
              feeGateway: 0,
              netAmount: -balance,
              status: "COMPLETED",
              reference: `Balance forfeiture — 180 days of inactivity (last activity: ${lastActivity.toISOString().slice(0, 10)})`,
            },
          });
          await tx.auditLog.create({
            data: {
              userId: worker.userId,
              action: "BALANCE_FORFEITED",
              entity: "Worker",
              entityId: worker.id,
              details: { amount: balance, lastActivity: lastActivity.toISOString(), rule: "180_day_inactivity" },
            },
          });
        });
        forfeited++;
      } else if (lastActivity < day170 && worker.user.email) {
        // 170-day warning
        await db.auditLog.create({
          data: {
            userId: worker.userId,
            action: "FORFEITURE_WARNING_170",
            entity: "Worker",
            entityId: worker.id,
            details: { balance, lastActivity: lastActivity.toISOString(), daysUntilForfeiture: 10 },
          },
        });
        warned170++;
      } else if (lastActivity < day150 && worker.user.email) {
        // 150-day warning
        await db.auditLog.create({
          data: {
            userId: worker.userId,
            action: "FORFEITURE_WARNING_150",
            entity: "Worker",
            entityId: worker.id,
            details: { balance, lastActivity: lastActivity.toISOString(), daysUntilForfeiture: 30 },
          },
        });
        warned150++;
      }
    }

    results.forfeitureWarnings150 = warned150;
    results.forfeitureWarnings170 = warned170;
    results.balancesForfeited = forfeited;
    results.timestamp = new Date().toISOString();

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    console.error("Cron maintenance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
