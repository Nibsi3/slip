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
    link.download = `slip-qr-${worker.user.firstName}-${worker.user.lastName}.png`;
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Your QR Code</h1>
        <p className="text-muted mt-1">
          Customers scan this to tip you instantly
        </p>
      </div>

      <div className="card text-center">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">
            {worker.user.firstName} {worker.user.lastName}
          </h2>
          {worker.jobTitle && (
            <p className="text-muted">{worker.jobTitle}</p>
          )}
          {worker.employerName && (
            <p className="text-sm text-muted-300">{worker.employerName}</p>
          )}
        </div>

        {qrImage && (
          <div className="flex justify-center mb-6">
            <img
              src={qrImage}
              alt="Your QR Code"
              className="w-48 h-48 sm:w-64 sm:h-64 shadow-lg"
            />
          </div>
        )}

        <p className="text-xs text-muted-300 break-all mb-6 px-2">{tipUrl}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={downloadQR} className="btn-primary">
            Download QR
          </button>
          <button onClick={copyLink} className="btn-secondary">
            Copy Link
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-white mb-2">How to use</h3>
        <ol className="space-y-2 text-sm text-muted list-decimal pl-4">
          <li>Print this QR code or display it on your phone</li>
          <li>Customers open their phone camera and scan</li>
          <li>They select a tip amount and pay instantly</li>
          <li>You receive the tip in your wallet</li>
        </ol>
      </div>
    </div>
  );
}
