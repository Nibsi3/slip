import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const body = await request.json();
    const { token } = schema.parse(body);

    const worker = await db.worker.findUnique({ where: { userId: session.user.id } });
    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    await db.worker.update({
      where: { id: worker.id },
      data: { fcmToken: token },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth(["WORKER"]);
    const worker = await db.worker.findUnique({ where: { userId: session.user.id } });
    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    await db.worker.update({
      where: { id: worker.id },
      data: { fcmToken: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
