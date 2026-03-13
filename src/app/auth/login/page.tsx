"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [pending2FA, setPending2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState("");
  const [totpCode, setTotpCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Admin with 2FA enabled — need TOTP code
      if (data.requires2FA) {
        setPending2FA(true);
        setPending2FAUserId(data.userId);
        setLoading(false);
        return;
      }

      // Admin without 2FA — redirect to setup
      if (data.requires2FASetup) {
        router.push("/admin/security");
        router.refresh();
        return;
      }

      router.push(data.role === "ADMIN" || data.role === "SUPER_ADMIN" ? "/admin" : redirect);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FAVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pending2FAUserId, token: totpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030306" }}>
      {/* Background accent */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(20,167,249,0.06) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          <div className="mb-8 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
              <span className="text-base font-semibold text-white/70 tracking-wide">slip a tip</span>
            </Link>
          </div>

          {!pending2FA ? (
            <>
              <h1 className="text-2xl font-bold text-white">Welcome to Slip a Tip</h1>
              <p className="mt-1 text-sm text-muted">Digital tipping made simple</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-muted mb-2">
                    Phone Number
                  </label>
                  <input
                    id="identifier"
                    type="tel"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 071 000 0001"
                  />
                  <p className="mt-1 text-xs text-muted-300">Admin? Use your email address instead</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-muted">
                      Password
                    </label>
                    <Link href="/auth/forgot-password" className="text-xs text-accent hover:text-accent-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="enter your password..."
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-surface-100">
                <p className="text-center text-sm text-muted-200">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/register" className="font-semibold text-accent hover:text-accent-300 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
              <p className="mt-1 text-sm text-muted">Enter the 6-digit code from your authenticator app, or a backup code.</p>

              <form onSubmit={handle2FAVerify} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-muted mb-2">
                    Verification Code
                  </label>
                  <input
                    id="totpCode"
                    type="text"
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={10}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ""))}
                    className="input-field text-center text-2xl tracking-[0.3em] font-mono"
                    placeholder="000000"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Verifying..." : "Verify"}
                </button>

                <button
                  type="button"
                  onClick={() => { setPending2FA(false); setTotpCode(""); setError(""); }}
                  className="w-full text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
