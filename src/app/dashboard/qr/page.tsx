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
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "";
    const waUrl = waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`TIP ${worker.qrCode}`)}`
      : `${origin}/tip/${worker.qrCode}`;

    (async () => {
      const QRCode = (await import("qrcode")).default;
      const qrSize = 800;
      const qrDataUrl = await QRCode.toDataURL(waUrl, {
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

  function getWaUrl() {
    if (!worker) return "";
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "";
    return waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`TIP ${worker.qrCode}`)}`
      : `${appUrl}/tip/${worker.qrCode}`;
  }

  function copyLink() {
    if (!worker) return;
    const url = getWaUrl();
    navigator.clipboard.writeText(url);
    alert("WhatsApp tip link copied to clipboard!");
  }

  if (loading) {
    return <div className="animate-pulse text-muted-300">Loading QR code...</div>;
  }

  if (!worker) {
    return <div className="text-red-500">Failed to load QR code.</div>;
  }

  const waUrl = getWaUrl();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Your QR Code</h1>
        <p className="text-muted mt-1">Customer scans → WhatsApp opens → tip in seconds</p>
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

        <p className="text-[11px] text-muted-300 break-all mb-6 px-2 font-mono">{waUrl}</p>

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
        <h3 className="font-bold text-white mb-4">How it works</h3>
        <div className="space-y-3">
          {[
            { n: "1", t: "Print or display", d: "Print this QR code and place it where customers can see it — on your badge, car, or workspace." },
            { n: "2", t: "Customer scans", d: "Their camera opens WhatsApp directly with a pre-filled message. No app download needed." },
            { n: "3", t: "They tap Send", d: "One tap sends the message. They get a reply with amount buttons — they tap their tip amount." },
            { n: "4", t: "Payment link sent", d: "A secure Stitch Instant EFT link arrives in their WhatsApp. They pay in seconds." },
            { n: "5", t: "You get paid", d: "Funds land in your Slip a Tip wallet instantly. You'll get a WhatsApp notification too." },
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

      {/* Request Physical QR Card */}
      <PhysicalQRRequest />

      {/* Cancel QR Code */}
      <CancelQR onCancelled={() => window.location.reload()} />
    </div>
  );
}

function PhysicalQRRequest() {
  const [info, setInfo] = useState<{ isFreeEligible: boolean; fee: number; physicalQrCount: number; requests: { id: string; status: string; isFree: boolean; feeCharged: number; createdAt: string; adminNotes?: string; dispatchedAt?: string }[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/workers/me/qr/physical")
      .then(r => r.json())
      .then(setInfo)
      .catch(console.error);
  }, [success]);

  async function handleRequest() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/workers/me/qr/physical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      setOpen(false);
      setAddress("");
      setNotes("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (!info) return null;

  const pendingRequest = info.requests.find(r => r.status === "PENDING");

  const statusColor: Record<string, string> = {
    PENDING: "text-yellow-400",
    APPROVED: "text-blue-400",
    DISPATCHED: "text-green-400",
    REJECTED: "text-red-400",
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(20,167,249,0.1)" }}>
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">Request a Physical QR Card</h3>
          <p className="text-xs text-muted mt-0.5">
            {info.isFreeEligible
              ? "Your first physical QR card is free! We'll print and dispatch it to you."
              : `Additional physical QR cards cost R${info.fee}. The fee is deducted from your wallet.`}
          </p>
        </div>
        {info.isFreeEligible && (
          <span className="px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 text-[10px] font-bold uppercase tracking-wide shrink-0">Free</span>
        )}
      </div>

      {success && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-green-900/20 border border-green-700/30 text-xs text-green-400">{success}</div>
      )}

      {/* Previous requests */}
      {info.requests.length > 0 && (
        <div className="mb-4 space-y-2">
          {info.requests.slice(0, 3).map(req => (
            <div key={req.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div>
                <span className={`text-xs font-medium ${statusColor[req.status] || "text-muted"}`}>{req.status}</span>
                <span className="text-[11px] text-muted-300 ml-2">{req.isFree ? "Free" : `R${Number(req.feeCharged).toFixed(2)}`}</span>
                {req.adminNotes && <p className="text-[11px] text-muted mt-0.5">{req.adminNotes}</p>}
              </div>
              <span className="text-[11px] text-muted-300">{new Date(req.createdAt).toLocaleDateString("en-ZA")}</span>
            </div>
          ))}
        </div>
      )}

      {pendingRequest ? (
        <p className="text-xs text-yellow-400/80">You have a pending request. We&apos;ll process it shortly.</p>
      ) : open ? (
        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-xs text-muted mb-1">Delivery Address <span className="text-muted-300">(optional)</span></label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="input-field !py-2 !text-sm"
              placeholder="e.g. 123 Main St, Cape Town, 8001"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Notes <span className="text-muted-300">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field !py-2 !text-sm resize-none"
              rows={2}
              placeholder="Any special instructions..."
            />
          </div>
          {error && <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-700/30 text-xs text-red-400">{error}</div>}
          {!info.isFreeEligible && (
            <div className="px-3 py-2 rounded-xl bg-yellow-900/20 border border-yellow-700/30 text-xs text-yellow-400/80">
              R{info.fee} will be deducted from your wallet balance.
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleRequest} disabled={submitting} className="btn-primary !py-2 !text-sm flex-1">
              {submitting ? "Submitting…" : info.isFreeEligible ? "Request Free Card" : `Request Card — R${info.fee}`}
            </button>
            <button onClick={() => { setOpen(false); setError(""); }} className="btn-secondary !py-2 !text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-secondary !py-2 !text-sm w-full">
          {info.physicalQrCount === 0 ? "Request Your Free Physical Card" : "Request Another Card (R50)"}
        </button>
      )}
    </div>
  );
}

function CancelQR({ onCancelled }: { onCancelled: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reasons = [
    { value: "LOST", label: "Lost", desc: "I lost my QR code card" },
    { value: "STOLEN", label: "Stolen", desc: "My QR code card was stolen" },
    { value: "DAMAGED", label: "Damaged", desc: "My card is damaged and can't be scanned" },
    { value: "NO_LONGER_NEEDED", label: "No longer needed", desc: "I don't need a physical card anymore" },
    { value: "OTHER", label: "Other", desc: "Another reason" },
  ];

  async function handleCancel() {
    if (!reason) { setError("Please select a reason"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/workers/me/qr/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel QR code");
      setOpen(false);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <div className="card border-red-500/10">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-red-400/60 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Cancel QR Code</h3>
            <p className="text-xs text-muted mt-1">If your QR code card is lost, stolen, or damaged, cancel it here. A new digital QR code will be generated immediately.</p>
            <button onClick={() => setOpen(true)} className="mt-3 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
              Cancel my QR code &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card ring-red-500/20">
      <h3 className="text-sm font-bold text-white mb-3">Cancel QR Code</h3>
      <p className="text-xs text-muted mb-4">This will deactivate your current QR code and generate a new one. Anyone with your old QR code will no longer be able to use it.</p>

      <div className="space-y-2 mb-4">
        {reasons.map(r => (
          <label key={r.value} className={`flex items-start gap-3 rounded-xl p-3 ring-1 cursor-pointer transition-all ${reason === r.value ? "ring-red-500/30" : "ring-white/[0.06] hover:ring-white/[0.1]"}`} style={{ background: reason === r.value ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)" }}>
            <input type="radio" name="cancelReason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 h-3.5 w-3.5 text-red-500 focus:ring-red-500 shrink-0" />
            <div>
              <div className="text-xs font-medium text-white">{r.label}</div>
              <div className="text-[11px] text-muted">{r.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {(reason === "OTHER" || reason === "STOLEN") && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted mb-1">{reason === "STOLEN" ? "Details (optional — e.g. where/when)" : "Please describe"}</label>
          <textarea value={details} onChange={e => setDetails(e.target.value)} className="input-field" rows={2} placeholder="Add any details..." />
        </div>
      )}

      {error && <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-xs text-red-400">{error}</div>}

      <div className="flex gap-3">
        <button onClick={() => { setOpen(false); setReason(""); setDetails(""); setError(""); }} className="btn-secondary flex-1 !py-2.5 !text-xs">
          Go Back
        </button>
        <button onClick={handleCancel} disabled={submitting || !reason} className="flex-1 py-2.5 text-xs inline-flex items-center justify-center rounded-xl bg-red-600 px-4 font-semibold text-white transition-all hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? "Cancelling..." : "Cancel QR Code"}
        </button>
      </div>
    </div>
  );
}
