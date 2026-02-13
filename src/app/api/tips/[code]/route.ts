import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const worker = await db.worker.findUnique({
      where: { qrCode: code, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      worker: {
        firstName: worker.user.firstName,
        lastName: worker.user.lastName,
        jobTitle: worker.jobTitle,
        employerName: worker.employerName,
        qrCode: worker.qrCode,
      },
    });
  } catch (err) {
    console.error("Get worker error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
