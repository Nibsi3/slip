"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");
  const name = searchParams.get("name");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg ring-1 ring-gray-100 rounded-2xl p-10 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-green-600"
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

          <h1 className="text-3xl font-extrabold text-gray-900">Thank You!</h1>

          <p className="mt-4 text-lg text-gray-500">
            Your tip{amount ? ` of R${parseFloat(amount).toFixed(2)}` : ""} has
            been sent successfully.
          </p>

          {name && (
            <p className="mt-2 text-gray-400">
              {name} will receive your tip shortly.
            </p>
          )}

          <div className="mt-8 bg-sky-50 p-6 rounded-xl ring-1 ring-sky-100">
            <p className="text-sky-700 font-medium">
              Your generosity makes a real difference.
            </p>
            <p className="mt-1 text-sm text-sky-500">
              The tip has been credited to the worker&apos;s digital wallet.
            </p>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            Payment processed securely by Paystack. You can close this page.
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400 text-xl">Loading...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
