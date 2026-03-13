"use client";

import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
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
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              Your Privacy Matters
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Privacy Policy</h1>
            <p className="mt-4 text-white/40 max-w-2xl mx-auto leading-relaxed">
              Last updated: February 2026 — This policy explains how Slip a Tip (Pty) Ltd collects, uses, stores, and protects your personal information in compliance with the Protection of Personal Information Act (POPIA).
            </p>
          </div>

          <div className="space-y-8">

            {/* 1. Responsible Party */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">1. Responsible Party</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-2">
                <p>The responsible party for the processing of your personal information is:</p>
                <div className="rounded-xl p-4 ring-1 ring-white/[0.06] mt-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <p className="text-white/70 font-semibold">Slip a Tip (Pty) Ltd</p>
                  <p className="text-white/40 mt-1">Information Officer: legal@slipatip.co.za</p>
                  <p className="text-white/40">Republic of South Africa</p>
                </div>
              </div>
            </section>

            {/* 2. Information We Collect */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-5">2. Information We Collect</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    category: "Identity Information",
                    items: ["Full legal name", "South African ID number", "Selfie / biometric data (Tier 2 FICA)"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>),
                  },
                  {
                    category: "Contact Details",
                    items: ["Mobile phone number", "Email address"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h6" /></svg>),
                  },
                  {
                    category: "Financial Information",
                    items: ["Bank account details (for payouts)", "Transaction history and amounts", "We never store credit/debit card numbers"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>),
                  },
                  {
                    category: "Verification Documents",
                    items: ["Proof of address (Tier 2 only)", "Bank confirmation letter"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>),
                  },
                  {
                    category: "Technical Data",
                    items: ["IP address", "Device fingerprint", "Browser type and version"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>),
                  },
                  {
                    category: "Usage Data",
                    items: ["QR code scan data", "Tip timestamps", "Platform interaction logs"],
                    icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>),
                  },
                ].map((item) => (
                  <div key={item.category} className="rounded-xl p-4 ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(20,167,249,0.08)" }}>{item.icon}</div>
                      <h3 className="text-sm font-semibold text-white">{item.category}</h3>
                    </div>
                    <ul className="space-y-1">
                      {item.items.map((li) => (
                        <li key={li} className="text-xs text-white/40 flex items-start gap-2">
                          <span className="text-accent/40 mt-1">•</span>
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. How We Use Your Information */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-5">3. How We Use Your Information</h2>
              <div className="space-y-3">
                {[
                  { purpose: "Platform Operation", desc: "To facilitate digital tipping, process transactions, and manage your account." },
                  { purpose: "FICA & AML Compliance", desc: "To verify your identity as required by the Financial Intelligence Centre Act and prevent money laundering." },
                  { purpose: "Payout Processing", desc: "To process withdrawals to your verified bank account via EFT or Instant Money." },
                  { purpose: "Fraud Prevention", desc: "To detect and prevent fraudulent transactions, unauthorized access, and platform abuse through device fingerprinting, velocity monitoring, and risk scoring." },
                  { purpose: "Communication", desc: "To send you transaction notifications, verification reminders, and important platform updates." },
                  { purpose: "Legal Compliance", desc: "To comply with applicable laws, regulations, and lawful requests from authorities." },
                ].map((item) => (
                  <div key={item.purpose} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.12)" }}>
                      <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{item.purpose}</span>
                      <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Third-Party Sharing */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">4. Third-Party Disclosure</h2>
              <p className="text-sm text-white/45 leading-relaxed mb-5">
                We <strong className="text-white/70">do not sell, trade, or rent</strong> your personal information. We only share data with the following parties, strictly for the purposes stated:
              </p>
              <div className="space-y-4">
                {[
                  { party: "Payment Gateway (Paystack)", purpose: "Processing payments and payouts securely via Split Payments. PCI-DSS Level 1 certified with 3D Secure — we never touch card data." },
                  { party: "Department of Home Affairs", purpose: "Real-time ID validation for FICA Tier 1 verification." },
                  { party: "South African Revenue Service (SARS)", purpose: "Only when required by law or lawful demand." },
                  { party: "Financial Intelligence Centre (FIC)", purpose: "Reporting suspicious transactions as required under the FIC Act." },
                  { party: "Biometric Verification Provider", purpose: "Processing liveness checks for FICA Tier 2 verification." },
                ].map((item) => (
                  <div key={item.party} className="rounded-xl p-4 ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <h3 className="text-sm font-semibold text-white mb-1">{item.party}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Data Security */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-5">5. Data Security</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Encryption at Rest", desc: "All personal data, ID documents, and selfies are encrypted using AES-256 encryption at rest." },
                  { title: "Encryption in Transit", desc: "All data transmitted between your device and our servers uses TLS 1.3 encryption." },
                  { title: "PCI-DSS Compliance", desc: "Payment card data is handled exclusively by our PCI-DSS Level 1 certified payment provider." },
                  { title: "Access Controls", desc: "Strict role-based access controls ensure only authorised personnel can access personal data." },
                  { title: "Fraud Monitoring", desc: "Real-time fraud detection systems protect against unauthorised access and suspicious activity." },
                  { title: "Regular Audits", desc: "We conduct regular security audits and vulnerability assessments to maintain data integrity." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl p-4 ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Data Retention */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">6. Data Retention</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-3">
                <p>We retain personal information only for as long as necessary to fulfil the purposes for which it was collected:</p>
                <div className="space-y-3 mt-4">
                  {[
                    { period: "Active Account", desc: "Data retained for the duration of your active account plus 30 days after closure." },
                    { period: "5 Years (AML Requirement)", desc: "Transaction records, FICA documents, and audit trails are retained for 5 years as required by the FIC Act and AML regulations." },
                    { period: "On Request", desc: "If you leave the platform and no legal retention period applies, we will delete your personal data upon request." },
                  ].map((item) => (
                    <div key={item.period} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.12)" }}>
                        <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">{item.period}</span>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. Your Rights */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-accent/15" style={{ background: "rgba(20,167,249,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-5">7. Your Rights Under POPIA</h2>
              <p className="text-sm text-white/45 leading-relaxed mb-5">As a data subject, you have the following rights:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { right: "Right of Access", desc: "Request confirmation of whether we hold your personal information and access to it." },
                  { right: "Right to Correction", desc: "Request that we correct or update inaccurate or incomplete personal information." },
                  { right: "Right to Deletion", desc: "Request that we delete your personal information (subject to legal retention requirements)." },
                  { right: "Right to Object", desc: "Object to the processing of your personal information on reasonable grounds." },
                  { right: "Right to Complain", desc: "Lodge a complaint with the Information Regulator if you believe your rights have been infringed." },
                  { right: "Right to Withdraw Consent", desc: "Withdraw your consent to the processing of personal information at any time." },
                ].map((item) => (
                  <div key={item.right} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.12)" }}>
                      <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{item.right}</span>
                      <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. Cookies */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">8. Cookies & Tracking</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                Slip a Tip uses essential cookies and session tokens required for the Platform to function (authentication, security). We do not use advertising or third-party tracking cookies. Device fingerprinting is used solely for fraud prevention purposes as described in our FICA compliance documentation.
              </p>
            </section>

            {/* 9. Children */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">9. Children&rsquo;s Privacy</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                The Platform is not intended for use by children under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete it immediately.
              </p>
            </section>

            {/* 10. Changes */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">10. Changes to This Policy</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on the Platform and, where appropriate, via email or SMS. Your continued use of the Platform after such changes constitutes acceptance of the revised policy.
              </p>
            </section>

            {/* 11. Information Regulator */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">11. Information Regulator</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-2">
                <p>If you are unsatisfied with our response to a privacy concern, you have the right to lodge a complaint with:</p>
                <div className="rounded-xl p-4 ring-1 ring-white/[0.06] mt-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <p className="text-white/70 font-semibold">The Information Regulator (South Africa)</p>
                  <p className="text-white/40 mt-1">JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
                  <p className="text-white/40">Email: complaints.IR@justice.gov.za</p>
                </div>
              </div>
            </section>
          </div>

          {/* Contact */}
          <div className="mt-10 rounded-2xl p-6 sm:p-8 ring-1 ring-accent/20 text-center" style={{ background: "rgba(20,167,249,0.03)" }}>
            <h2 className="text-lg font-bold text-white mb-2">Privacy Enquiries</h2>
            <p className="text-sm text-white/40 mb-5">Contact our Information Officer for any privacy-related questions or to exercise your rights.</p>
            <a href="mailto:legal@slipatip.co.za" className="btn-primary !py-2.5 !px-5 text-sm">Contact: legal@slipatip.co.za</a>
          </div>

          {/* Related links */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Related Policies</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal/paia" className="text-xs text-accent hover:text-accent/80 transition-colors">PAIA Compliance &rarr;</Link>
              <Link href="/legal/popia" className="text-xs text-accent hover:text-accent/80 transition-colors">POPIA Compliance &rarr;</Link>
              <Link href="/legal/fica" className="text-xs text-accent hover:text-accent/80 transition-colors">FICA Compliance &rarr;</Link>
              <Link href="/legal/terms" className="text-xs text-accent hover:text-accent/80 transition-colors">Terms & Conditions &rarr;</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
