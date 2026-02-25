"use client";

import Link from "next/link";
import Image from "next/image";

export default function FicaPage() {
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
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
              Identity Verification
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">FICA Compliance</h1>
            <p className="mt-4 text-white/40 max-w-2xl mx-auto leading-relaxed">
              Financial Intelligence Centre Act (Act 38 of 2001) — Our tiered approach to Know Your Customer (KYC) and Anti-Money Laundering (AML).
            </p>
          </div>

          {/* Tiered FICA */}
          <div className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.08] mb-10" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
            <h2 className="text-xl font-bold text-white mb-2">Our Tiered FICA Approach</h2>
            <p className="text-sm text-white/45 leading-relaxed mb-8">
              Slip a Tip implements a risk-based, tiered FICA verification system. This ensures legitimate users can start receiving tips immediately while meeting all regulatory requirements as their earnings grow.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tier 1 */}
              <div className="rounded-2xl ring-1 ring-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="px-6 py-4 border-b border-white/[0.06]" style={{ background: "rgba(20,167,249,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-accent" style={{ background: "rgba(20,167,249,0.15)" }}>T1</div>
                    <div>
                      <h3 className="text-base font-bold text-white">Tier 1 — Instant</h3>
                      <p className="text-[11px] text-white/40">Required at registration</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "Full legal name",
                    "South African ID number",
                    "Automated real-time validation via Department of Home Affairs",
                    "Mobile phone number verification",
                    "Bank account in the user's legal name",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.12)" }}>
                        <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      <span className="text-sm text-white/50">{item}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/30">Allows: Receiving tips + withdrawals up to R3,000 cumulative</p>
                  </div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="rounded-2xl ring-1 ring-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="px-6 py-4 border-b border-white/[0.06]" style={{ background: "rgba(245,158,11,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-amber-400" style={{ background: "rgba(245,158,11,0.15)" }}>T2</div>
                    <div>
                      <h3 className="text-base font-bold text-white">Tier 2 — Hard FICA</h3>
                      <p className="text-[11px] text-white/40">Triggered at R3,000 cumulative</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "Biometric liveness check (selfie verification)",
                    "Proof of residential address (not older than 3 months)",
                    "Bank account confirmation letter",
                    "Enhanced due diligence review",
                    "Ongoing transaction monitoring",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.12)" }}>
                        <svg className="h-2.5 w-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      <span className="text-sm text-white/50">{item}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/30">Allows: Unlimited withdrawals (subject to velocity limits)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Framework */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Integrated Security Framework</h2>

            {[
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>),
                title: "PCI-DSS Level 1 Encryption",
                desc: "All payment processing is handled by our PCI-DSS Level 1 certified payment gateway. Slip a Tip never touches, stores, or processes credit card data. Card data flows directly from the customer to the payment provider via encrypted channels.",
              },
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>),
                title: "Virtual Ledger Isolation",
                desc: "All tip funds are held in a segregated \"Customer Money\" ledger, completely separate from Slip a Tip's operating account. This ensures full auditability — we can prove at any time exactly what belongs to service workers and what is our 10% service fee.",
              },
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zM12 15.75h.008v.008H12v-.008z" /></svg>),
                title: "Velocity Fraud Detection",
                desc: "Our system monitors and flags unusual tipping patterns in real time — for example, unusually large tips from a single card to a single worker. This protects the platform from being used as a conduit for money laundering or credit card clearing.",
              },
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>),
                title: "Complete Audit Trail",
                desc: "Every scan, payment, and payout is timestamped and logged with full transaction metadata. This creates an immutable audit trail that satisfies both the FIC Act requirements and provides evidence for any regulatory enquiry.",
              },
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                title: "Settlement Holds",
                desc: "All tips are subject to a 24–72 hour settlement hold before funds become available for withdrawal. High-risk transactions are held for extended periods and reviewed manually. This provides a window to detect and reverse fraudulent transactions.",
              },
              {
                icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>),
                title: "AML Monitoring",
                desc: "Automated Anti-Money Laundering checks flag large transactions, rapid accumulation patterns, structuring (splitting deposits to avoid thresholds), and suspicious round-amount patterns. All flagged transactions are reviewed before release.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl p-6 ring-1 ring-white/[0.07] flex items-start gap-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(20,167,249,0.08)" }}>{item.icon}</div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Non-compliance */}
          <div className="mt-12 rounded-2xl p-6 sm:p-8 ring-1 ring-amber-500/20" style={{ background: "rgba(245,158,11,0.03)" }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Non-Compliance & Abandoned Funds</h2>
                <p className="text-sm text-white/45 leading-relaxed">
                  If a user fails to provide required FICA documentation within <strong className="text-white/70">60 calendar days</strong> of receiving their first tip, their account will be classified as &ldquo;Non-Compliant.&rdquo; All funds held in a Non-Compliant account will be forfeited and donated to a nominated registered charity. This measure ensures compliance with the Anti-Money Laundering (AML) laws of South Africa and protects the integrity of the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 rounded-2xl p-6 sm:p-8 ring-1 ring-accent/20 text-center" style={{ background: "rgba(20,167,249,0.03)" }}>
            <h2 className="text-lg font-bold text-white mb-2">Questions About FICA?</h2>
            <p className="text-sm text-white/40 mb-5">Our compliance team is available to assist with any verification queries.</p>
            <a href="mailto:legal@slipatip.co.za" className="btn-primary !py-2.5 !px-5 text-sm">Contact: legal@slipatip.co.za</a>
          </div>

          {/* Related links */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Related Policies</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal/paia" className="text-xs text-accent hover:text-accent/80 transition-colors">PAIA Compliance &rarr;</Link>
              <Link href="/legal/popia" className="text-xs text-accent hover:text-accent/80 transition-colors">POPIA Compliance &rarr;</Link>
              <Link href="/legal/terms" className="text-xs text-accent hover:text-accent/80 transition-colors">Terms & Conditions &rarr;</Link>
              <Link href="/legal/privacy" className="text-xs text-accent hover:text-accent/80 transition-colors">Privacy Policy &rarr;</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
