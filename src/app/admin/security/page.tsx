"use client";

import { useState, useEffect, FormEvent } from "react";

type Step = "loading" | "already-enabled" | "setup" | "verify" | "backup-codes";

export default function AdminSecurityPage() {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [csrfToken, setCsrfToken] = useState<string>("");

  // Setup state
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Check current 2FA status
  const [totpEnabled, setTotpEnabled] = useState(false);

  async function ensureCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken;
    const res = await fetch("/api/auth/csrf");
    const data = await res.json();
    const token = data.csrfToken as string | undefined;
    if (res.ok && token) {
      setCsrfToken(token);
      return token;
    }
    throw new Error(data.error || "Failed to get CSRF token");
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.totpEnabled) {
          setTotpEnabled(true);
          setStep("already-enabled");
        } else {
          setStep("setup");
        }
      })
      .catch(() => setStep("setup"));

    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => {
        if (d?.csrfToken) setCsrfToken(d.csrfToken);
      })
      .catch(() => {});
  }, []);

  async function startSetup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start 2FA setup");
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await ensureCsrfToken();

      let res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ secret, token: verifyCode }),
      });

      // If the CSRF cookie expired/rotated, refresh token once and retry.
      if (res.status === 403) {
        setCsrfToken("");
        const refreshed = await ensureCsrfToken();
        res = await fetch("/api/auth/2fa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": refreshed },
          body: JSON.stringify({ secret, token: verifyCode }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setBackupCodes(data.backupCodes || []);
      setTotpEnabled(true);
      setStep("backup-codes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 3000);
    });
  }

  if (step === "loading") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Security Settings</h1>
        <p className="mt-0.5 text-sm text-slate-400">Manage two-factor authentication for your admin account.</p>
      </div>

      {/* Already enabled */}
      {step === "already-enabled" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Two-Factor Authentication</h2>
              <p className="text-sm text-emerald-600 font-semibold">Enabled</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Your account is protected with two-factor authentication. You will be prompted for a verification code each time you sign in.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm text-emerald-700 font-medium">Your admin account is secured with TOTP authentication.</span>
          </div>
        </div>
      )}

      {/* Setup prompt */}
      {step === "setup" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Two-Factor Authentication</h2>
              <p className="text-sm text-amber-600 font-semibold">Not configured</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            Protect your admin account by enabling two-factor authentication. You will need an authenticator app like Google Authenticator, Authy, or 1Password.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">{error}</div>
          )}

          <button
            onClick={startSetup}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "Setting up..." : "Set Up 2FA"}
          </button>
        </div>
      )}

      {/* QR code + verify */}
      {step === "verify" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Scan QR Code</h2>
            <p className="text-sm text-slate-500">Scan this QR code with your authenticator app, then enter the 6-digit code below to verify.</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl border-2 border-slate-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Can&apos;t scan? Enter this key manually:</p>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
              <code className="text-xs text-slate-700 font-mono break-all select-all">{secret}</code>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verify-code" className="block text-sm font-semibold text-slate-700 mb-2">
                Verification Code
              </label>
              <input
                id="verify-code"
                type="text"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                className="w-full max-w-xs border border-slate-300 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || verifyCode.length < 6}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("setup"); setError(""); }}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup codes */}
      {step === "backup-codes" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">2FA Enabled Successfully</h2>
              <p className="text-sm text-emerald-600 font-semibold">Your account is now protected</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1.5">
            <p className="text-sm font-bold text-amber-700">Save your backup codes</p>
            <p className="text-xs text-amber-600">
              Store these codes in a safe place. Each code can only be used once. If you lose access to your authenticator app, use a backup code to sign in.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg text-center select-all tracking-wider">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyBackupCodes}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {copiedBackup ? "✓ Copied!" : "Copy All Codes"}
            </button>
            <button
              onClick={() => setStep("already-enabled")}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
