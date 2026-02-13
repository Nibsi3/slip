import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "SUPER_ADMIN"]);

    const workers = await db.worker.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        _count: { select: { tips: { where: { status: "COMPLETED" } }, withdrawals: true } },
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
