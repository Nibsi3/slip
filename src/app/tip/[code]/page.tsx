"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";

const TIP_AMOUNTS = [15, 30, 50, 75, 100, 200];
const MIN_TIP = 15;
const MAX_TIP = 5000;
const TOTAL_FEE_RATE = 0.10;

interface WorkerInfo {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  employerName?: string;
  qrCode: string;
}

export default function TipPage() {
  const params = useParams();
  const code = params.code as string;

  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [submitting, setSubmitting] = useState(false);

  const tipAmount = selectedAmount || 0;

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await fetch(`/api/tips/${code}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Worker not found");
        }
        const data = await res.json();
        setWorker(data.worker);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [code]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (tipAmount < MIN_TIP || tipAmount > MAX_TIP || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code,
          amount: tipAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process tip");
      }

      const data = await res.json();
      if (data.paystack?.authorizationUrl) {
        window.location.href = data.paystack.authorizationUrl;
        return;
      } else {
        throw new Error("Payment gateway unavailable");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center " style={{ background: "#030306" }}>
        <div className="animate-pulse text-white/40 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#030306" }}>
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-white">Oops!</h1>
          <p className="mt-2 text-muted">{error}</p>
          <p className="mt-4 text-sm text-muted-300">
            This QR code may be invalid or the worker is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030306" }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,167,249,0.08) 0%, transparent 60%)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-center px-6 pt-8 pb-2">
        <div className="flex items-center gap-2 opacity-60">
          <img src="/logo.png" alt="Slip a Tip" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">slip a tip</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8 pt-4">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl overflow-hidden ring-1 ring-white/[0.09]" style={{ background: "rgba(8,8,14,0.95)", backdropFilter: "blur(24px)" }}>

            {/* Worker info */}
            <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 120% at 50% 0%, rgba(20,167,249,0.1) 0%, transparent 70%)" }} />
              <div className="relative">
                <div className="mx-auto w-20 h-20 rounded-2xl ring-2 ring-white/10 flex items-center justify-center text-3xl font-extrabold text-white" style={{ background: "linear-gradient(135deg, rgba(20,167,249,0.2), rgba(20,167,249,0.05))" }}>
                  {worker?.firstName?.charAt(0)}{worker?.lastName?.charAt(0)}
                </div>
                <h1 className="mt-4 text-xl font-extrabold text-white tracking-tight">
                  {worker?.firstName} {worker?.lastName}
                </h1>
                {worker?.jobTitle && (
                  <p className="mt-1 text-sm text-white/50">{worker.jobTitle}</p>
                )}
                {worker?.employerName && (
                  <p className="text-xs text-white/35 mt-0.5">{worker.employerName}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Quick amounts */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Select tip amount</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIP_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => !submitting && setSelectedAmount(amt)}
                      disabled={submitting}
                      className={`py-3.5 text-center font-bold text-base rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedAmount === amt
                          ? "text-white scale-[1.03] ring-1 ring-accent/40"
                          : "text-white/55 ring-1 ring-white/[0.07] hover:ring-white/[0.14] hover:text-white/80"
                      }`}
                      style={selectedAmount === amt
                        ? { background: "rgba(20,167,249,0.18)" }
                        : { background: "rgba(255,255,255,0.03)" }
                      }
                    >
                      R{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee transparency */}
              {tipAmount >= MIN_TIP && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Fee breakdown</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Tip amount</span>
                    <span className="text-white/70">R{tipAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Total fee (10%)</span>
                    <span className="text-white/70">−R{(tipAmount * TOTAL_FEE_RATE).toFixed(2)}</span>
                  </div>
                  <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white/50">{worker?.firstName} receives</span>
                    <span className="text-green-400">R{(tipAmount * (1 - TOTAL_FEE_RATE)).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-white/20 mt-1">Includes Paystack processing + Slip a Tip platform fee.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={tipAmount < MIN_TIP || tipAmount > MAX_TIP || submitting}
                className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)", color: "#030306" }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : tipAmount >= MIN_TIP ? (
                  `Tip R${tipAmount.toFixed(2)}`
                ) : (
                  "Select an amount"
                )}
              </button>

              {/* Scan to Pay strip */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3 text-center">Pay directly from your banking app</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {/* FNB */}
                  <div className="flex items-center justify-center w-12 h-8 rounded-lg" style={{ background: "rgba(0,166,80,0.12)", border: "1px solid rgba(0,166,80,0.25)" }}>
                    <svg viewBox="0 0 48 20" className="w-9 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="15" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="#00a650" letterSpacing="-0.5">FNB</text>
                    </svg>
                  </div>
                  {/* Capitec */}
                  <div className="flex items-center justify-center w-14 h-8 rounded-lg" style={{ background: "rgba(0,102,204,0.12)", border: "1px solid rgba(0,102,204,0.25)" }}>
                    <svg viewBox="0 0 64 20" className="w-12 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="15" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#0066cc" letterSpacing="0.2">CAPITEC</text>
                    </svg>
                  </div>
                  {/* ABSA */}
                  <div className="flex items-center justify-center w-12 h-8 rounded-lg" style={{ background: "rgba(220,0,50,0.12)", border: "1px solid rgba(220,0,50,0.25)" }}>
                    <svg viewBox="0 0 44 20" className="w-9 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="15" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="#dc0032" letterSpacing="-0.3">ABSA</text>
                    </svg>
                  </div>
                  {/* Nedbank */}
                  <div className="flex items-center justify-center w-16 h-8 rounded-lg" style={{ background: "rgba(0,122,77,0.12)", border: "1px solid rgba(0,122,77,0.25)" }}>
                    <svg viewBox="0 0 72 20" className="w-14 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="15" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#007a4d" letterSpacing="0.1">NEDBANK</text>
                    </svg>
                  </div>
                  {/* Standard Bank */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(0,85,165,0.12)", border: "1px solid rgba(0,85,165,0.25)" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#0055a5" opacity="0.15"/>
                      <text x="12" y="16" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="9" fill="#0055a5" textAnchor="middle" letterSpacing="-0.3">SB</text>
                    </svg>
                  </div>
                </div>
                <p className="text-center text-[10px] text-white/25 mt-2.5">Select &ldquo;Scan to Pay&rdquo; at checkout &middot; No card details needed</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-center text-[11px] text-white/25">Secured by Paystack &middot; 3D Secure &middot; Card details never stored</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
