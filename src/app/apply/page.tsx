"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Work Details" },
  { id: 3, label: "Bank (Optional)" },
  { id: 4, label: "Consent & Submit" },
];

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    employerName: "",
    jobTitle: "",
    workLocation: "",
    city: "",
    province: "",
    bankName: "",
    bankAccountNo: "",
    bankBranchCode: "",
    consent1: false,
    consent2: false,
    consent3: false,
    consent4: false,
    consent5: false,
    consent6: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function nextStep() {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.phone || !form.password) {
        setError("Please fill in all required fields");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }
    if (step === 2) {
      if (!form.jobTitle || !form.city) {
        setError("Please fill in your job title and city");
        return;
      }
    }
    // Step 3 bank details are optional — users can skip
    setError("");
    setStep((s) => Math.min(s + 1, 4));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.consent1 || !form.consent2 || !form.consent3 || !form.consent4 || !form.consent5 || !form.consent6) {
      setError("Please accept all consent items to proceed");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          idNumber: form.idNumber,
          phone: form.phone,
          email: form.email,
          password: form.password,
          employerName: form.employerName,
          jobTitle: form.jobTitle,
          workLocation: form.workLocation,
          city: form.city,
          province: form.province,
          bankName: form.bankName,
          bankAccountNo: form.bankAccountNo,
          bankBranchCode: form.bankBranchCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#030306" }}>
        <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
        <div className="relative w-full max-w-lg text-center">
          <div className="rounded-2xl p-10 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Application Submitted!</h1>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Thank you for applying to Slip a Tip. Our team will review your application and verify your details.
              Once approved, your personal QR code will be generated and sent to you via SMS.
            </p>
            <div className="rounded-xl p-4 ring-1 ring-white/[0.06] mb-6" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-sm font-semibold text-white mb-2">What happens next?</h3>
              <div className="space-y-2 text-xs text-white/40">
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">1.</span>
                  <span>We verify your identity and bank details (1–3 business days)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">2.</span>
                  <span>Once approved, your QR code is generated and linked to your account</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">3.</span>
                  <span>You receive your QR code via SMS and can start accepting tips immediately</span>
                </div>
              </div>
            </div>
            <Link href="/" className="btn-primary !py-3 !px-8 text-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#030306" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-lg">
        <div className="rounded-2xl p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo/11.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
              <span className="text-base font-semibold text-white/70 tracking-wide">slip a tip</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white">Apply as a Service Worker</h1>
          <p className="mt-1 text-sm text-white/40 leading-relaxed">
            Don&rsquo;t have a QR code? Apply here and we&rsquo;ll set you up once approved.
          </p>

          {/* Progress steps */}
          <div className="mt-6 mb-8">
            <div className="flex items-center gap-1">
              {STEPS.map((s) => (
                <div key={s.id} className="flex-1">
                  <div className={`h-1 rounded-full transition-all ${step >= s.id ? "bg-accent" : "bg-white/[0.06]"}`} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-accent font-medium">Step {step} of 4</span>
              <span className="text-xs text-white/30">{STEPS[step - 1].label}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">First Name *</label>
                    <input type="text" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="input-field" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">Last Name *</label>
                    <input type="text" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="input-field" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">South African ID Number</label>
                  <input type="text" value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} className="input-field" placeholder="e.g. 9001015009087" maxLength={13} />
                  <p className="text-[11px] text-white/25 mt-1">Required for FICA verification</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Phone Number *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-field" placeholder="e.g. 066 299 5533" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Email (optional)</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Password *</label>
                  <input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" placeholder="Min 8 chars, upper + lower + number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Confirm Password *</label>
                  <input type="password" required minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="input-field" placeholder="Repeat your password" />
                </div>
              </div>
            )}

            {/* Step 2: Work Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Employer / Business Name</label>
                  <input type="text" value={form.employerName} onChange={(e) => update("employerName", e.target.value)} className="input-field" placeholder="e.g. The Rosebank Hotel" />
                  <p className="text-[11px] text-white/25 mt-1">Leave blank if self-employed (e.g. car guard)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Your Role / Job Title *</label>
                  <input type="text" required value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} className="input-field" placeholder="e.g. Waiter, Car Guard, Porter" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Work Location / Address</label>
                  <input type="text" value={form.workLocation} onChange={(e) => update("workLocation", e.target.value)} className="input-field" placeholder="e.g. Sandton City Parking" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">City *</label>
                    <input type="text" required value={form.city} onChange={(e) => update("city", e.target.value)} className="input-field" placeholder="e.g. Johannesburg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">Province</label>
                    <select value={form.province} onChange={(e) => update("province", e.target.value)} className="input-field" style={{ color: form.province ? 'white' : 'rgba(255,255,255,0.3)' }}>
                      <option value="">Select...</option>
                      <option value="GP">Gauteng</option>
                      <option value="WC">Western Cape</option>
                      <option value="KZN">KwaZulu-Natal</option>
                      <option value="EC">Eastern Cape</option>
                      <option value="FS">Free State</option>
                      <option value="LP">Limpopo</option>
                      <option value="MP">Mpumalanga</option>
                      <option value="NW">North West</option>
                      <option value="NC">Northern Cape</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Bank & FICA */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 ring-1 ring-accent/15 mb-2" style={{ background: "rgba(249,115,22,0.03)" }}>
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Bank details are <strong className="text-white/70">optional</strong> at this stage. You can add or update them later from Dashboard &rarr; Settings before your first withdrawal.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Bank Name</label>
                  <select value={form.bankName} onChange={(e) => update("bankName", e.target.value)} className="input-field" style={{ color: form.bankName ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="">Select your bank...</option>
                    <option value="ABSA">ABSA</option>
                    <option value="Capitec">Capitec</option>
                    <option value="FNB">FNB</option>
                    <option value="Nedbank">Nedbank</option>
                    <option value="Standard Bank">Standard Bank</option>
                    <option value="African Bank">African Bank</option>
                    <option value="TymeBank">TymeBank</option>
                    <option value="Discovery Bank">Discovery Bank</option>
                    <option value="Investec">Investec</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">Account Number</label>
                    <input type="text" value={form.bankAccountNo} onChange={(e) => update("bankAccountNo", e.target.value)} className="input-field" placeholder="Account number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">Branch Code</label>
                    <input type="text" value={form.bankBranchCode} onChange={(e) => update("bankBranchCode", e.target.value)} className="input-field" placeholder="Branch code" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Consent */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 ring-1 ring-amber-500/15 mb-2" style={{ background: "rgba(245,158,11,0.03)" }}>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Please read and accept each item below. You must scroll through and accept all consent items to submit your application.
                  </p>
                </div>

                {[
                  { key: "consent1", text: "I confirm I am a South African citizen or have a valid work permit." },
                  { key: "consent2", text: "I agree that I am an Independent Contractor and not an employee of Slip a Tip. Slip a Tip provides a technology platform only and does not provide a salary, benefits, or insurance." },
                  { key: "consent3", text: "I understand that I cannot withdraw money until I have completed FICA verification (ID photo, selfie, and proof of address). The minimum withdrawal amount is R20." },
                  { key: "consent4", text: "I acknowledge that if I do not provide my FICA documents within 60 days of receiving my first tip, my funds will be forfeited and donated to a nominated registered charity." },
                  { key: "consent5", text: "I consent to Slip a Tip processing my personal information (ID, bank details, biometric data) under the POPI Act, and to the use of Stitch for payment processing and payouts, and OTT Mobile / Meta (WhatsApp) for OTT Voucher withdrawal delivery." },
                  { key: "consent6", text: "I accept the Service Fee of 10% on every tip I receive, the 72-hour settlement cooldown period, and the applicable withdrawal fees (R2 flat for EFT via Stitch, or 6% for OTT Voucher). I understand that Slip a Tip reserves the right to debit my balance for any chargebacks or disputed transactions." },
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-white/[0.05] cursor-pointer hover:ring-white/[0.1] transition-all" style={{ background: (form as Record<string, string | boolean>)[item.key] ? "rgba(249,115,22,0.03)" : "rgba(255,255,255,0.015)" }}>
                    <input
                      type="checkbox"
                      checked={(form as Record<string, string | boolean>)[item.key] as boolean}
                      onChange={(e) => update(item.key, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent shrink-0"
                    />
                    <span className="text-xs text-white/50 leading-relaxed">{item.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">{error}</div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary flex-1 !py-3">
                  Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={nextStep} className="btn-primary flex-1 !py-3">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn-primary flex-1 !py-3">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-white/30">
              <p>
                Have a QR code?{" "}
                <Link href="/auth/register" className="font-semibold text-accent hover:text-accent/80 transition-colors">Register here</Link>
              </p>
              <p>
                Already registered?{" "}
                <Link href="/auth/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">Sign in</Link>
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/20">
              <Link href="/legal/terms" className="hover:text-white/40 transition-colors">Terms & Conditions</Link>
              <Link href="/legal/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
              <Link href="/legal/fica" className="hover:text-white/40 transition-colors">FICA</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
