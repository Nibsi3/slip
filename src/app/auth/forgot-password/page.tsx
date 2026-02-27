"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030306" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(20,167,249,0.06) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          <div className="mb-8 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
              <span className="text-base font-semibold text-white/70 tracking-wide">slip a tip</span>
            </Link>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
              <p className="text-sm text-muted mb-6">
                If an account exists for <span className="text-white">{identifier}</span>, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <Link href="/auth/login" className="text-sm text-accent hover:text-accent-300 transition-colors">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">Reset your password</h1>
              <p className="mt-1 text-sm text-muted">Enter your phone number or email and we&apos;ll send a reset link.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-muted mb-2">
                    Phone Number or Email
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 066 299 5533 or admin@example.com"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-surface-100 text-center">
                <Link href="/auth/login" className="text-sm text-muted-200 hover:text-white transition-colors">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
