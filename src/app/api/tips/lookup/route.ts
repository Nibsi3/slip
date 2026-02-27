import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const tip = await db.tip.findUnique({
    where: { paymentId: reference },
    select: {
      amount: true,
      netAmount: true,
      status: true,
      customerName: true,
      worker: {
        select: {
          employerName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!tip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    amount: Number(tip.amount),
    netAmount: Number(tip.netAmount),
    status: tip.status,
    customerName: tip.customerName,
    workerName: `${tip.worker.user.firstName} ${tip.worker.user.lastName}`,
    employerName: tip.worker.employerName,
  });
}
