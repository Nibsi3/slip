"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");
  const name = searchParams.get("name");

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#030306" }}>
      <div className="w-full max-w-md">
        <div className="bg-surface shadow-2xl ring-1 ring-surface-100 p-10 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-white">Thank You!</h1>

          <p className="mt-4 text-lg text-muted">
            Your tip{amount ? ` of R${parseFloat(amount).toFixed(2)}` : ""} has
            been sent successfully.
          </p>

          {name && (
            <p className="mt-2 text-muted-200">
              {name} will receive your tip shortly.
            </p>
          )}

          <div className="mt-8 bg-accent/5 p-6 ring-1 ring-accent/10">
            <p className="text-accent/80 font-medium">
              Your generosity makes a real difference.
            </p>
            <p className="mt-1 text-sm text-accent/60">
              The tip has been credited to the worker&apos;s digital wallet.
            </p>
          </div>

          <p className="mt-8 text-xs text-muted-300">
            Payment processed securely by PayFast. You can close this page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}>
          <div className="text-muted text-xl">Loading...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
