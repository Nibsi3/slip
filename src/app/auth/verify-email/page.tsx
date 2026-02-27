"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const isSuccess = status === "success";
  const isInvalid = status === "invalid";
  const isError = status === "error";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030306" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${isSuccess ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)"} 0%, transparent 70%)` }} />
      <div className="relative w-full max-w-md text-center">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          <div className="mb-6 flex justify-center">
            <Image src="/logo.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
          </div>

          {isSuccess && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-sm text-white/50 mb-6">Your email address has been successfully verified.</p>
            </>
          )}

          {isInvalid && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h1>
              <p className="text-sm text-white/50 mb-6">This verification link is invalid or has expired. Please request a new verification email from your dashboard settings.</p>
            </>
          )}

          {isError && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-sm text-white/50 mb-6">Something went wrong. Please try again later or contact support.</p>
            </>
          )}

          {!status && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-sm text-white/50 mb-6">We sent a verification link to your email address. Click the link to verify.</p>
            </>
          )}

          <Link href="/dashboard" className="btn-primary w-full block text-center">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}><div className="text-white/40">Loading...</div></div>}>
      <VerifyContent />
    </Suspense>
  );
}
