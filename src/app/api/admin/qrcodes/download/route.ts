import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const token = searchParams.get("token");
    const format = searchParams.get("format") || "png";

    if (!batchId && !token) {
      return NextResponse.json(
        { error: "Provide batchId or token" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://slip.onrender.com";

    // Single QR code download
    if (token) {
      const qrCode = await db.qRCode.findUnique({ where: { token } });
      if (!qrCode) {
        return NextResponse.json({ error: "QR code not found" }, { status: 404 });
      }

      const url = `${baseUrl}/qr/${token}`;

      if (format === "svg") {
        const svg = await QRCode.toString(url, {
          type: "svg",
          width: 800,
          margin: 2,
          errorCorrectionLevel: "H",
        });
        return new NextResponse(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Content-Disposition": `attachment; filename="slip-qr-${token}.svg"`,
          },
        });
      }

      const pngBuffer = await QRCode.toBuffer(url, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });

      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="slip-qr-${token}.png"`,
        },
      });
    }

    // Batch download — return JSON with data URLs for client-side processing
    const qrCodes = await db.qRCode.findMany({
      where: { batchId: batchId! },
      select: { token: true },
      take: 1000,
    });

    if (qrCodes.length === 0) {
      return NextResponse.json({ error: "No QR codes in this batch" }, { status: 404 });
    }

    const codes = await Promise.all(
      qrCodes.map(async (qr) => {
        const url = `${baseUrl}/qr/${qr.token}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 800,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return { token: qr.token, dataUrl };
      })
    );

    return NextResponse.json({ codes, baseUrl });
  } catch (err) {
    console.error("QR download error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
