"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  isNative,
  isBiometricAvailable,
  authenticateWithBiometrics,
  getBiometricPhone,
  setBiometricEnabled,
  registerPushNotifications,
} from "@/lib/capacitor";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [offerBiometric, setOfferBiometric] = useState(false);
  const [lastLoginPhone, setLastLoginPhone] = useState("");

  // 2FA state
  const [pending2FA, setPending2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState("");
  const [totpCode, setTotpCode] = useState("");

  useEffect(() => {
    async function checkBiometric() {
      if (!isNative()) return;
      const available = await isBiometricAvailable();
      if (!available) return;
      setBiometricAvailable(true);
      const storedPhone = await getBiometricPhone();
      if (!storedPhone) return;
      // Auto-prompt biometric login
      setIdentifier(storedPhone);
      const ok = await authenticateWithBiometrics("Sign in to Slip a Tip");
      if (ok) {
        // Re-authenticate via login endpoint with stored phone (session cookie refresh)
        setLoading(true);
        try {
          const res = await fetch("/api/auth/biometric-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: storedPhone }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Biometric login failed");
          await registerFcmToken();
          router.push(redirect);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Biometric login failed");
          setLoading(false);
        }
      }
    }
    checkBiometric();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function registerFcmToken() {
    if (!isNative()) return;
    await registerPushNotifications(
      async (token) => {
        await fetch("/api/workers/me/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      },
      () => {},
    );
  }

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

      // Register FCM push token (native only)
      await registerFcmToken();

      // Offer biometric for next time (native only, workers only)
      if (isNative() && biometricAvailable && data.role === "WORKER") {
        setLastLoginPhone(identifier);
        setLoading(false);
        setOfferBiometric(true);
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

  async function enableBiometricAndContinue() {
    await setBiometricEnabled(lastLoginPhone);
    router.push(redirect);
    router.refresh();
  }

  function skipBiometricAndContinue() {
    router.push(redirect);
    router.refresh();
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
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,165,0,0.08) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          <div className="mb-8 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo/11.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
              <span className="text-base font-semibold text-white/70 tracking-wide">slip a tip</span>
            </Link>
          </div>

          {offerBiometric ? (
            <>
              <h1 className="text-2xl font-bold text-white">Enable Fingerprint Login?</h1>
              <p className="mt-1 text-sm text-muted">Sign in faster next time using your fingerprint or face ID.</p>
              <div className="mt-8 rounded-xl p-5 ring-1 ring-white/[0.08] flex items-center gap-4" style={{ background: "rgba(249,115,22,0.05)" }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.1)" }}>
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Biometric Login</div>
                  <div className="text-xs text-white/40 mt-0.5">One tap to access your dashboard. Stored securely on this device only.</div>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <button onClick={enableBiometricAndContinue} className="btn-primary w-full">
                  Enable Fingerprint Login
                </button>
                <button onClick={skipBiometricAndContinue} className="w-full text-sm text-white/40 hover:text-white/60 transition-colors py-2">
                  Not now
                </button>
              </div>
            </>
          ) : !pending2FA ? (
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
