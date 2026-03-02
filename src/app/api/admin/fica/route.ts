import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { runFicaChecks, applyFicaDecision } from "@/lib/fica/engine";

/**
 * GET /api/admin/fica
 * List all workers with PENDING_REVIEW doc status, plus their automated check preview.
 */
export async function GET() {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const workers = await db.worker.findMany({
      where: { docStatus: { in: ["PENDING_REVIEW", "APPROVED", "REJECTED"] } },
      orderBy: { docSubmittedAt: "desc" },
      select: {
        id: true,
        docStatus: true,
        docSubmittedAt: true,
        docReviewedAt: true,
        docReviewedBy: true,
        docRejectReason: true,
        docIdUrl: true,
        docAddressUrl: true,
        docSelfieUrl: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            idNumber: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ workers });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin FICA GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/fica
 * body: { workerId, action: "run_auto" | "approve" | "deny", reason?: string }
 *
 * run_auto  — run the automated engine and return the result (preview, no commit)
 * approve   — mark as APPROVED (human override), send SMS
 * deny      — mark as REJECTED with reason, send SMS
 * run_auto_commit — run engine and commit the decision automatically
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const { workerId, action, reason } = await request.json() as {
      workerId: string;
      action: "run_auto" | "run_auto_commit" | "approve" | "deny";
      reason?: string;
    };

    if (!workerId || !action) {
      return NextResponse.json({ error: "workerId and action required" }, { status: 400 });
    }

    if (action === "run_auto") {
      const result = await runFicaChecks(workerId);
      return NextResponse.json({ result });
    }

    if (action === "run_auto_commit") {
      const result = await runFicaChecks(workerId);
      await applyFicaDecision(workerId, result.decision, result.reasons, session.user.id);
      return NextResponse.json({
        result,
        committed: true,
        message: `Automated decision applied: ${result.decision}`,
      });
    }

    if (action === "approve") {
      await applyFicaDecision(workerId, "AUTO_APPROVE", ["Manually approved by admin"], session.user.id);
      return NextResponse.json({ success: true, message: "Documents approved. Worker notified via SMS." });
    }

    if (action === "deny") {
      await applyFicaDecision(
        workerId,
        "AUTO_DENY",
        [reason || "Documents could not be verified"],
        session.user.id
      );
      return NextResponse.json({ success: true, message: "Documents rejected. Worker notified via SMS." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin FICA POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/fica?bulk=true
 * Run automated FICA checks on ALL pending workers and commit decisions.
 * Returns counts of approved / denied / flagged for review.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(request.url);
    if (searchParams.get("bulk") !== "true") {
      return NextResponse.json({ error: "Use ?bulk=true" }, { status: 400 });
    }

    const pending = await db.worker.findMany({
      where: { docStatus: "PENDING_REVIEW" },
      select: { id: true },
    });

    let approved = 0;
    let denied = 0;
    let flagged = 0;

    for (const { id } of pending) {
      const result = await runFicaChecks(id);
      if (result.decision === "ADMIN_REVIEW") {
        flagged++;
        continue;
      }
      await applyFicaDecision(id, result.decision, result.reasons, "SYSTEM_BULK");
      if (result.decision === "AUTO_APPROVE") approved++;
      else denied++;
    }

    return NextResponse.json({
      processed: pending.length,
      approved,
      denied,
      flagged,
      message: `Bulk FICA: ${approved} approved, ${denied} denied, ${flagged} flagged for review`,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Admin FICA PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
