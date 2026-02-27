"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030306" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-md text-center">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
          <p className="text-sm text-white/50 mb-6">
            Your payment could not be processed. No money has been charged. Please try again or use a different payment method.
          </p>

          {reference && (
            <div className="mb-6 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Reference</p>
              <p className="text-xs text-white/60 font-mono">{reference}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="btn-primary w-full"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="block w-full text-sm text-white/40 hover:text-white/60 transition-colors py-2"
            >
              Back to Home
            </Link>
            <p className="text-[10px] text-white/20">
              Powered by <Image src="/logo.png" alt="Slip a Tip" width={14} height={14} className="inline-block h-3.5 w-3.5 object-contain align-text-bottom" /> Slip a Tip
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TipFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}><div className="text-white/40">Loading...</div></div>}>
      <FailedContent />
    </Suspense>
  );
}
