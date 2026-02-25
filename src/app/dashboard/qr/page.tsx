"use client";

import { useState, useEffect } from "react";
import { useWorker } from "../WorkerContext";

export default function QRCodePage() {
  const { worker, loading } = useWorker();
  const [qrImage, setQrImage] = useState<string>("");
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    if (!worker) return;
    const origin = window.location.origin;
    setAppUrl(origin);
    const tipUrl = `${origin}/tip/${worker.qrCode}`;

    (async () => {
      const QRCode = (await import("qrcode")).default;
      const qrSize = 800;
      const qrDataUrl = await QRCode.toDataURL(tipUrl, {
        width: qrSize,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });

      // Overlay logo in center of QR code with square white background
      const canvas = document.createElement("canvas");
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const qrImg = new window.Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);
          const logo = new window.Image();
          logo.onload = () => {
            const logoSize = Math.round(qrSize * 0.2);
            const padding = 12;
            const bgSize = logoSize + padding * 2;
            const bgX = (qrSize - bgSize) / 2;
            const bgY = (qrSize - bgSize) / 2;
            const logoX = (qrSize - logoSize) / 2;
            const logoY = (qrSize - logoSize) / 2;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(bgX, bgY, bgSize, bgSize);
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            setQrImage(canvas.toDataURL("image/png"));
          };
          logo.crossOrigin = "anonymous";
          logo.src = "/logo.png";
        };
        qrImg.src = qrDataUrl;
      } else {
        setQrImage(qrDataUrl);
      }
    })();
  }, [worker]);

  function downloadQR() {
    if (!qrImage || !worker) return;
    const link = document.createElement("a");
    link.download = `slipatip-qr-${worker.user.firstName}-${worker.user.lastName}.png`;
    link.href = qrImage;
    link.click();
  }

  function copyLink() {
    if (!worker) return;
    const url = `${appUrl}/tip/${worker.qrCode}`;
    navigator.clipboard.writeText(url);
    alert("Tip link copied to clipboard!");
  }

  if (loading) {
    return <div className="animate-pulse text-muted-300">Loading QR code...</div>;
  }

  if (!worker) {
    return <div className="text-red-500">Failed to load QR code.</div>;
  }

  const tipUrl = `${appUrl}/tip/${worker.qrCode}`;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Your QR Code</h1>
        <p className="text-muted mt-1">Customers scan this to tip you instantly</p>
      </div>

      {/* QR Card */}
      <div className="card-glow text-center">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            {worker.user.firstName} {worker.user.lastName}
          </h2>
          {worker.jobTitle && (
            <p className="text-sm text-muted mt-0.5">{worker.jobTitle}</p>
          )}
          {worker.employerName && (
            <p className="text-xs text-muted-300 mt-0.5">{worker.employerName}</p>
          )}
        </div>

        {qrImage ? (
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-glow-sm inline-block">
              <img
                src={qrImage}
                alt="Your QR Code"
                className="w-52 h-52 sm:w-64 sm:h-64 block"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
              <div className="animate-pulse text-white/20 text-sm">Generating...</div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-300 break-all mb-6 px-2 font-mono">{tipUrl}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={downloadQR} className="btn-primary">
            Download QR
          </button>
          <button onClick={copyLink} className="btn-secondary">
            Copy Link
          </button>
        </div>
      </div>

      {/* How to use */}
      <div className="card">
        <h3 className="font-bold text-white mb-4">How to use your QR code</h3>
        <div className="space-y-3">
          {[
            { n: "1", t: "Print or display", d: "Print this QR code and place it where customers can see it, or show it on your phone." },
            { n: "2", t: "Customer scans", d: "Customers open their phone camera and scan — no app needed." },
            { n: "3", t: "They tip", d: "They select an amount (R10–R200 or custom) and pay securely via Paystack." },
            { n: "4", t: "You get paid", d: "The tip lands in your wallet instantly, ready to withdraw." },
          ].map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.1)" }}>{s.n}</div>
              <div>
                <div className="text-sm font-semibold text-white">{s.t}</div>
                <div className="text-xs text-muted mt-0.5">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
