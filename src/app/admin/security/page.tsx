"use client";

import { useState, useEffect, FormEvent } from "react";

type Step = "loading" | "already-enabled" | "setup" | "verify" | "backup-codes";

export default function AdminSecurityPage() {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Setup state
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Check current 2FA status
  const [totpEnabled, setTotpEnabled] = useState(false);

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
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token: verifyCode }),
      });
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
    return <div className="animate-pulse text-muted-300">Loading security settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage two-factor authentication for your admin account.</p>
      </div>

      {/* Already enabled */}
      {step === "already-enabled" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-green-400 font-medium">Enabled</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Your account is protected with two-factor authentication. You will be prompted for a verification code each time you sign in.
          </p>
        </div>
      )}

      {/* Setup prompt */}
      {step === "setup" && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-yellow-400 font-medium">Not configured</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Protect your admin account by enabling two-factor authentication. You will need an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
          )}

          <button onClick={startSetup} disabled={loading} className="btn-primary">
            {loading ? "Setting up..." : "Set Up 2FA"}
          </button>
        </div>
      )}

      {/* QR code + verify */}
      {step === "verify" && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Scan QR Code</h2>
            <p className="text-sm text-muted">Scan this QR code with your authenticator app, then enter the 6-digit code below to verify.</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-300">Can&apos;t scan? Enter this key manually:</p>
            <div className="bg-surface-300 p-3 rounded-lg">
              <code className="text-xs text-white font-mono break-all select-all">{secret}</code>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verify-code" className="block text-sm font-medium text-muted mb-2">
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
                className="input-field text-center text-2xl tracking-[0.3em] font-mono max-w-xs"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading || verifyCode.length < 6} className="btn-primary">
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("setup"); setError(""); }}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup codes */}
      {step === "backup-codes" && (
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">2FA Enabled Successfully</h2>
              <p className="text-sm text-green-400 font-medium">Your account is now protected</p>
            </div>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-yellow-400">Save your backup codes</p>
            <p className="text-xs text-muted">
              Store these codes in a safe place. Each code can only be used once. If you lose access to your authenticator app, use a backup code to sign in.
            </p>
          </div>

          <div className="bg-surface-300 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm text-white bg-surface-100 px-3 py-2 rounded text-center select-all">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={copyBackupCodes} className="btn-primary">
              {copiedBackup ? "Copied!" : "Copy All Codes"}
            </button>
            <button
              onClick={() => setStep("already-enabled")}
              className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
