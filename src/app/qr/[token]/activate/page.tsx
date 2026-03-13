"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ActivateQRPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/qrcodes/status?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.status === "ACTIVE") {
          setAlreadyActive(true);
        } else if (data.status === "DISABLED") {
          setError("This QR code has been disabled.");
        }
      } catch {
        // If check fails, let them try to activate — the API will catch it
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [token]);

  // Step 1: Personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Work info
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Step 3: Bank details (optional)
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankBranchCode, setBankBranchCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/qrcodes/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          phone,
          password,
          employerName: employerName || undefined,
          jobTitle: jobTitle || undefined,
          bankName: bankName || undefined,
          bankAccountNo: bankAccountNo || undefined,
          bankBranchCode: bankBranchCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Activation failed");
      }

      // Activation successful — redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030306" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center">
        <Image src="/logo.png" alt="Slip a Tip" width={36} height={36} quality={95} priority className="h-9 w-9 object-contain mx-auto" />
        <p className="text-white/40 text-xs mt-2">Activate your QR code</p>
      </div>

      {/* Loading check */}
      {checking && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-white/40">Checking QR code...</div>
        </div>
      )}

      {/* Already activated */}
      {!checking && alreadyActive && (
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">
            <div className="card-glow !p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-400/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">QR Code Already Active</h2>
              <p className="text-sm text-white/50">
                This QR code is already linked to an account. Sign in with your phone number and password to access your dashboard.
              </p>
              <Link href="/auth/login" className="btn-primary inline-block !py-3 !px-8">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Activation form */}
      {!checking && !alreadyActive && (
      <>
      {/* Progress */}
      <div className="flex justify-center gap-2 px-6 pb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 max-w-[80px] rounded-full transition-all ${
              s <= step ? "bg-accent" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="card-glow !p-6">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Your details</h2>
                    <p className="text-sm text-white/40 mt-1">
                      Enter your information to activate this QR code
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      First name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0612345678"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Create a password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="input-field"
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!firstName || !lastName || !phone || password.length < 6) {
                        setError("Please fill in all fields (password min 6 characters)");
                        return;
                      }
                      setError("");
                      setStep(2);
                    }}
                    className="btn-primary w-full !py-3"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: Work Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Work details</h2>
                    <p className="text-sm text-white/40 mt-1">
                      Optional — helps customers identify you
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Employer / business name
                    </label>
                    <input
                      type="text"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      placeholder="e.g. The Grand Hotel"
                      className="input-field"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Job title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Waiter, Barista"
                      className="input-field"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-secondary flex-1 !py-3"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="btn-primary flex-1 !py-3"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Bank Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Bank details</h2>
                    <p className="text-sm text-white/40 mt-1">
                      Optional — needed for EFT withdrawals. You can add this later in settings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Bank name
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select bank (optional)</option>
                      <option value="FNB">FNB</option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="Absa">Absa</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="Capitec">Capitec</option>
                      <option value="TymeBank">TymeBank</option>
                      <option value="Discovery Bank">Discovery Bank</option>
                      <option value="African Bank">African Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Account number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="Account number"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Branch code
                    </label>
                    <input
                      type="text"
                      value={bankBranchCode}
                      onChange={(e) => setBankBranchCode(e.target.value)}
                      placeholder="Branch code"
                      className="input-field"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-secondary flex-1 !py-3"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 !py-3"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Activating...
                        </span>
                      ) : (
                        "Activate QR Code"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error on step 1/2 */}
              {error && step < 3 && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            By activating, you agree to receive digital tips through Slip a Tip.
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
