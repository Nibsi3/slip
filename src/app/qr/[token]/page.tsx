import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function QRCodeRouter({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const qrCode = await db.qRCode.findUnique({
    where: { token },
    include: {
      worker: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!qrCode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#030306" }}
      >
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-white">Invalid QR Code</h1>
          <p className="mt-2 text-muted">
            This QR code is not recognized. It may be counterfeit or damaged.
          </p>
        </div>
      </div>
    );
  }

  if (qrCode.status === "DISABLED") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#030306" }}
      >
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-white">QR Code Disabled</h1>
          <p className="mt-2 text-muted">
            This QR code has been deactivated and is no longer in use.
          </p>
        </div>
      </div>
    );
  }

  if (qrCode.status === "ACTIVE" && qrCode.worker) {
    redirect(`/tip/${qrCode.worker.qrCode}`);
  }

  // INACTIVE — redirect to activation page
  redirect(`/qr/${token}/activate`);
}
