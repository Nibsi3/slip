"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";

const TIP_AMOUNTS = [10, 20, 50, 100, 200];
const MIN_TIP = 5;
const MAX_TIP = 5000;

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
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tipAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount || 0;

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
    if (tipAmount < MIN_TIP || tipAmount > MAX_TIP) return;
    setSubmitting(true);

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
      const { actionUrl, params: pfParams } = data.payfast;

      // Stop all pending requests (HMR, websockets) to prevent page reload
      // racing with the PayFast form POST
      window.stop();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = actionUrl;
      for (const [key, value] of Object.entries(pfParams)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
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
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center">
        <div className="text-white/80 text-sm font-medium">Slip</div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="bg-surface shadow-2xl overflow-hidden ring-1 ring-surface-100">
            {/* Worker info */}
            <div className="bg-surface-300 px-6 py-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-white">
                {worker?.firstName?.charAt(0)}
                {worker?.lastName?.charAt(0)}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">
                {worker?.firstName} {worker?.lastName}
              </h1>
              {worker?.jobTitle && (
                <p className="mt-1 text-white/80">{worker.jobTitle}</p>
              )}
              {worker?.employerName && (
                <p className="text-white/60 text-sm">{worker.employerName}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Quick amounts */}
              <div>
                <label className="block text-sm font-semibold text-muted mb-3">
                  Select tip amount
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TIP_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustom(false);
                        setCustomAmount("");
                      }}
                      className={`py-4 text-center font-bold text-lg transition-all ${
                        !isCustom && selectedAmount === amt
                          ? "bg-accent text-white shadow-lg scale-105"
                          : "bg-surface-300 text-muted-50 hover:bg-surface-200"
                      }`}
                    >
                      R{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(true);
                      setSelectedAmount(null);
                    }}
                    className={`py-4 text-center font-bold transition-all ${
                      isCustom
                        ? "bg-accent text-white shadow-lg scale-105"
                        : "bg-surface-300 text-muted-50 hover:bg-surface-200"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom amount input */}
              {isCustom && (
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">
                    Enter amount (R{MIN_TIP} - R{MAX_TIP})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-300 font-semibold">
                      R
                    </span>
                    <input
                      type="number"
                      min={MIN_TIP}
                      max={MAX_TIP}
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-field pl-10 text-2xl font-bold"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={tipAmount < MIN_TIP || tipAmount > MAX_TIP || submitting}
                className="btn-primary w-full !py-4 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
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

              <p className="text-center text-xs text-muted-300">
                Secure payment powered by PayFast. Your card details are never stored.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
