"use client";

import Link from "next/link";
import Image from "next/image";

export default function PopiaPage() {
  return (
    <div className="min-h-screen" style={{ background: "#030306" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: "rgba(3,3,6,0.75)", backdropFilter: "blur(24px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
          </Link>
          <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">&larr; Back to home</Link>
        </nav>
      </header>

      <main className="pt-28 pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Title */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/[0.12] mb-6" style={{ background: "rgba(20,167,249,0.07)" }}>
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              Data Protection
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">POPIA Compliance</h1>
            <p className="mt-4 text-white/40 max-w-2xl mx-auto leading-relaxed">
              Protection of Personal Information Act (Act 4 of 2013) — How we protect your personal data.
            </p>
          </div>

          {/* Key Principles */}
          <div className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.08] mb-10" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
            <h2 className="text-xl font-bold text-white mb-2">Our POPIA Commitment</h2>
            <p className="text-sm text-white/45 leading-relaxed mb-6">
              As a &ldquo;Responsible Party&rdquo; under POPIA, Slip a Tip is committed to processing personal information lawfully, minimally, and securely. We collect personal data only as required by law (FICA) and for the operation of our tipping platform.
            </p>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>), title: "Minimality", desc: "We only collect what is legally required" },
                { icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>), title: "Security", desc: "All data encrypted at rest and in transit" },
                { icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>), title: "Transparency", desc: "Clear purposes for all data processing" },
                { icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>), title: "Right to Delete", desc: "Delete your data when you leave" },
              ].map((item) => (
                <div key={item.title} className="text-center p-4 rounded-xl ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <div className="mx-auto h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(20,167,249,0.08)" }}>{item.icon}</div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-[11px] text-white/35">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 8 Conditions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">The 8 Conditions of Lawful Processing</h2>
            <p className="text-sm text-white/40 leading-relaxed -mt-3">POPIA sets out eight conditions for the lawful processing of personal information. Here is how Slip a Tip complies with each:</p>

            {[
              {
                num: "1",
                title: "Accountability",
                desc: "Slip a Tip ensures that all conditions for the lawful processing of personal information are complied with at the time of determining the purpose and means of processing, and during the processing itself. We have appointed an Information Officer responsible for ensuring compliance.",
              },
              {
                num: "2",
                title: "Processing Limitation",
                desc: "Personal information is processed lawfully and in a reasonable manner that does not infringe on the privacy of data subjects. We only process personal information with the consent of the data subject, or where it is necessary to fulfil a contractual obligation (providing the tipping platform service).",
              },
              {
                num: "3",
                title: "Purpose Specification",
                desc: "Personal information is collected for a specific, explicitly defined, and lawful purpose: (a) to facilitate digital tipping between customers and service workers, (b) to comply with FICA and AML regulations, and (c) to process payouts to verified bank accounts. Data is not retained longer than necessary, except where required by law (5-year AML retention).",
              },
              {
                num: "4",
                title: "Further Processing Limitation",
                desc: "Personal information is not processed for a secondary purpose incompatible with the original purpose of collection. We do not sell, trade, or share personal information with third parties for marketing purposes.",
              },
              {
                num: "5",
                title: "Information Quality",
                desc: "We take reasonable steps to ensure that personal information is complete, accurate, not misleading, and updated where necessary. Users can update their information via the dashboard at any time.",
              },
              {
                num: "6",
                title: "Openness",
                desc: "We maintain documentation of all personal information processing activities. This policy and our PAIA manual are publicly available. We notify users at the time of collection about what data we collect and why.",
              },
              {
                num: "7",
                title: "Security Safeguards",
                desc: "We implement appropriate, reasonable technical and organisational measures to protect personal information against loss, damage, unauthorised access, and unlawful processing. This includes PCI-DSS Level 1 encryption (via our payment gateway), encrypted storage, and strict access controls.",
              },
              {
                num: "8",
                title: "Data Subject Participation",
                desc: "Data subjects (users) have the right to: request confirmation of whether we hold their personal information; request access to their personal information; request correction or deletion of their personal information; and object to the processing of their personal information.",
              },
            ].map((item) => (
              <div key={item.num} className="rounded-2xl p-6 ring-1 ring-white/[0.07] flex items-start gap-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-accent" style={{ background: "rgba(20,167,249,0.1)" }}>
                  {item.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What we collect */}
          <div className="mt-12 rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
            <h2 className="text-xl font-bold text-white mb-5">Personal Information We Collect</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { category: "Identity Information", items: "Full name, South African ID number, selfie (for Tier 2 FICA verification)" },
                { category: "Contact Information", items: "Phone number, email address" },
                { category: "Financial Information", items: "Bank account details (for payouts only — we never store card details)" },
                { category: "Verification Documents", items: "Proof of address (triggered at R3,000 cumulative threshold)" },
                { category: "Transaction Data", items: "Tip amounts, timestamps, payment references, QR code scan locations" },
                { category: "Technical Data", items: "IP address, device fingerprint, browser type (for fraud prevention)" },
              ].map((item) => (
                <div key={item.category} className="rounded-xl p-4 ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.category}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.items}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Third party sharing */}
          <div className="mt-8 rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Disclosure</h2>
            <p className="text-sm text-white/45 leading-relaxed mb-5">
              We only share your personal information with the following third parties, strictly for the purposes stated:
            </p>
            <div className="space-y-3">
              {[
                { party: "Payment Gateway (Paystack)", purpose: "To process payments and payouts securely via Split Payments and Subaccounts. PCI-DSS Level 1 certified with 3D Secure authentication." },
                { party: "Department of Home Affairs", purpose: "To verify identity documents (real-time ID validation for FICA Tier 1)." },
                { party: "South African Revenue Service (SARS)", purpose: "Only if required by law or lawful demand." },
                { party: "Financial Intelligence Centre (FIC)", purpose: "To report suspicious transactions as required under the FIC Act." },
              ].map((item) => (
                <div key={item.party} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.12)" }}>
                    <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">{item.party}</span>
                    <p className="text-xs text-white/40 mt-0.5">{item.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your rights */}
          <div className="mt-8 rounded-2xl p-6 sm:p-8 ring-1 ring-accent/20 text-center" style={{ background: "rgba(20,167,249,0.03)" }}>
            <h2 className="text-lg font-bold text-white mb-2">Exercise Your Rights</h2>
            <p className="text-sm text-white/40 mb-5">You have the right to access, correct, or delete your personal information at any time.</p>
            <a href="mailto:legal@slipatip.co.za" className="btn-primary !py-2.5 !px-5 text-sm">Contact: legal@slipatip.co.za</a>
          </div>

          {/* Related links */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Related Policies</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal/paia" className="text-xs text-accent hover:text-accent/80 transition-colors">PAIA Compliance &rarr;</Link>
              <Link href="/legal/fica" className="text-xs text-accent hover:text-accent/80 transition-colors">FICA Compliance &rarr;</Link>
              <Link href="/legal/terms" className="text-xs text-accent hover:text-accent/80 transition-colors">Terms & Conditions &rarr;</Link>
              <Link href="/legal/privacy" className="text-xs text-accent hover:text-accent/80 transition-colors">Privacy Policy &rarr;</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
