import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        totpEnabled: user.totpEnabled,
        worker: user.worker
          ? {
              id: user.worker.id,
              qrCode: user.worker.qrCode,
              walletBalance: user.worker.walletBalance,
              availableBalance: user.worker.availableBalance,
              balanceCap: user.worker.balanceCap,
              employerName: user.worker.employerName,
              jobTitle: user.worker.jobTitle,
              isActive: user.worker.isActive,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
