import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(5).toString("base64url").slice(0, 8);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const count = Math.min(Math.max(parseInt(body.count) || 10, 1), 5000);
    const batchId = `batch-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    // Generate unique tokens
    const tokens: string[] = [];
    const existing = new Set<string>();

    while (tokens.length < count) {
      const token = generateToken();
      if (!existing.has(token)) {
        existing.add(token);
        tokens.push(token);
      }
    }

    // Bulk create QR codes
    const created = await db.qRCode.createMany({
      data: tokens.map((token) => ({
        token,
        batchId,
        status: "INACTIVE" as const,
      })),
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "QR_BATCH_GENERATE",
        entity: "QRCode",
        details: { batchId, count: created.count },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      batchId,
      count: created.count,
    });
  } catch (err) {
    console.error("QR generate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
