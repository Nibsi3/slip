"use client";

import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
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
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              Legal Agreement
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Terms & Conditions</h1>
            <p className="mt-4 text-white/40 max-w-2xl mx-auto leading-relaxed">
              Last updated: February 2026 — Please read these terms carefully before using the Slip a Tip platform.
            </p>
          </div>

          {/* Effective date notice */}
          <div className="rounded-2xl p-6 ring-1 ring-accent/20 mb-10 flex items-start gap-4" style={{ background: "rgba(20,167,249,0.03)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(20,167,249,0.1)" }}>
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Important Notice</h3>
              <p className="text-xs text-white/45 leading-relaxed">By registering for, accessing, or using Slip a Tip, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, you must immediately cease using the platform.</p>
            </div>
          </div>

          <div className="space-y-8">

            {/* 1. Definitions */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">1. Definitions</h2>
              <div className="space-y-3 text-sm text-white/45 leading-relaxed">
                <p><strong className="text-white/70">&ldquo;Platform&rdquo;</strong> means the Slip a Tip website, application, and all associated services operated by Slip a Tip (Pty) Ltd.</p>
                <p><strong className="text-white/70">&ldquo;User&rdquo;</strong> or <strong className="text-white/70">&ldquo;Service Worker&rdquo;</strong> means any individual who registers on the Platform to receive tips.</p>
                <p><strong className="text-white/70">&ldquo;Tipper&rdquo;</strong> or <strong className="text-white/70">&ldquo;Customer&rdquo;</strong> means any individual who uses the Platform to send a tip to a User.</p>
                <p><strong className="text-white/70">&ldquo;Service Fee&rdquo;</strong> means the 10% fee charged by Slip a Tip on each transaction for the use of the platform, payment gateway fees, and administration.</p>
                <p><strong className="text-white/70">&ldquo;Net Tip&rdquo;</strong> means the gross tip amount minus the Service Fee.</p>
                <p><strong className="text-white/70">&ldquo;Customer Money Ledger&rdquo;</strong> means the segregated account in which tip funds are held on behalf of Users, separate from Slip a Tip&rsquo;s operating account.</p>
                <p><strong className="text-white/70">&ldquo;Paystack Subaccount&rdquo;</strong> means the individual account created for each User on the Paystack payment platform for the purpose of receiving split payments.</p>
                <p><strong className="text-white/70">&ldquo;Split Payment&rdquo;</strong> means the automated division of each tip at the point of payment, whereby 90% is allocated to the User&rsquo;s Subaccount and 10% is allocated to Slip a Tip as the Service Fee.</p>
                <p><strong className="text-white/70">&ldquo;Cooldown Period&rdquo;</strong> means the 72-hour settlement hold applied to all tips before they become available for withdrawal.</p>
                <p><strong className="text-white/70">&ldquo;Chargeback&rdquo;</strong> means a reversal of a transaction initiated by a Customer or their bank.</p>
                <p><strong className="text-white/70">&ldquo;3D Secure&rdquo;</strong> means the authentication protocol used by Paystack requiring Customers to approve transactions via their banking app or OTP, triggering a liability shift to the card issuer for unauthorised transactions.</p>
                <p><strong className="text-white/70">&ldquo;Transfer Fee&rdquo;</strong> means the bank transfer fee charged per withdrawal to cover the cost of sending funds from the Subaccount to the User&rsquo;s bank account.</p>
              </div>
            </section>

            {/* 2. Nature of Service */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">2. Nature of Service &mdash; No Employment Relationship</h2>
              <div className="rounded-xl p-5 ring-1 ring-amber-500/15 mb-4" style={{ background: "rgba(245,158,11,0.03)" }}>
                <p className="text-sm text-white/55 leading-relaxed">
                  <strong className="text-amber-300/90">Slip a Tip provides a technology platform only.</strong> The User is an <strong className="text-white/70">Independent Contractor</strong> and not an employee, agent, or partner of Slip a Tip. Slip a Tip does not provide a salary, benefits, insurance, or any form of employment. The User is solely responsible for their own tax obligations to the South African Revenue Service (SARS).
                </p>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">Slip a Tip does not control, direct, or supervise the User&rsquo;s work. The platform merely facilitates the electronic transfer of voluntary gratuities from Customers to Users.</p>
            </section>

            {/* 3. Registration & FICA */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">3. Registration & FICA Compliance</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p>The User may receive tips immediately upon registration. However, the User acknowledges that <strong className="text-white/70">no funds will be paid out</strong> to a bank account until the User has met the following criteria:</p>
                <div className="space-y-3 ml-1">
                  {[
                    "A verified South African bank account in the User's legal name.",
                    "Successful Tier 1 FICA verification (valid South African ID number and full legal name validated via Department of Home Affairs).",
                    "Cumulative earnings above R3,000 will trigger a \"Hard-FICA\" (Tier 2) requirement — Proof of Address (not older than 3 months) and biometric liveness check (selfie).",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-accent" style={{ background: "rgba(20,167,249,0.12)" }}>{i + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p>The User agrees that Slip a Tip acts as a <strong className="text-white/70">temporary custodian</strong> of these funds pending verification. Funds are held in a segregated Customer Money Ledger and do not form part of Slip a Tip&rsquo;s assets.</p>
              </div>
            </section>

            {/* 4. Abandoned Funds */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-red-500/15" style={{ background: "rgba(239,68,68,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">4. Abandoned Funds & Non-Compliance</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p>Should the User fail to provide the required FICA documentation within <strong className="text-white/70">60 (sixty) calendar days</strong> of the first tip received, the User&rsquo;s account will be deemed <strong className="text-red-400/80">&ldquo;Non-Compliant.&rdquo;</strong></p>
                <div className="rounded-xl p-5 ring-1 ring-red-500/20" style={{ background: "rgba(239,68,68,0.04)" }}>
                  <p className="text-sm text-white/55 leading-relaxed">
                    All funds held in a Non-Compliant account will be <strong className="text-white/70">forfeited by the User</strong> and donated to a nominated registered charity. Under no circumstances will the User have a claim to these funds after the 60-day period has expired. This measure is implemented to ensure compliance with the Anti-Money Laundering (AML) laws of South Africa and to protect the integrity of the financial system.
                  </p>
                </div>
                <p>The User will receive multiple reminders via SMS and email at 30 days, 45 days, and 55 days before the forfeiture takes effect.</p>
              </div>
            </section>

            {/* 5. Fee Structure */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">5. Fee Structure</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p>Slip a Tip charges a Service Fee of <strong className="text-white/70">10% (ten percent)</strong> on every tip transaction for the use of the platform, payment gateway fees, and administration.</p>
                <div className="grid sm:grid-cols-3 gap-4 my-5">
                  {[
                    { value: "R0", label: "Sign-up cost", desc: "Registration is completely free" },
                    { value: "10%", label: "Service fee", desc: "Deducted per transaction" },
                    { value: "R0", label: "Monthly fees", desc: "No subscriptions, ever" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-4 text-center ring-1 ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
                      <div className="text-2xl font-extrabold text-white">{item.value}</div>
                      <div className="text-xs text-accent font-semibold mt-1">{item.label}</div>
                      <div className="text-[11px] text-white/30 mt-1">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <p>This fee is deducted at the point of transaction. The User agrees to receive the &ldquo;Net Tip&rdquo; amount (Gross Tip minus Service Fee). The Service Fee covers payment gateway processing, platform maintenance, fraud prevention systems, FICA verification costs, and customer support.</p>
              </div>
            </section>

            {/* 6. Payouts & Withdrawals */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">6. Payouts & Withdrawals</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-3">
                <p>Withdrawals are subject to the following conditions:</p>
                <ul className="space-y-2 ml-1">
                  {[
                    "The User must have completed the applicable FICA verification tier.",
                    "All tips are subject to a 24–72 hour settlement hold before funds become available.",
                    "A chargeback reserve of 5–10% may be withheld to cover potential payment reversals.",
                    "Withdrawal methods include Instant Money (collect at any ATM) and EFT to a verified bank account.",
                    "Velocity limits apply: maximum 3 withdrawals per day, R2,000 per day withdrawal cap.",
                    "A balance cap of R2,000 applies. Funds exceeding this cap will be held pending review.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="h-4 w-4 text-accent/50 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 7. User Obligations */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">7. User Obligations</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-3">
                <p>By using the Platform, the User agrees to:</p>
                <ul className="space-y-2 ml-1">
                  {[
                    "Provide accurate, truthful, and complete information during registration and verification.",
                    "Not use the Platform for any unlawful purpose, including money laundering, fraud, or tax evasion.",
                    "Not share, transfer, or assign their QR code or account to any other person.",
                    "Keep their account credentials secure and not disclose them to third parties.",
                    "Comply with all applicable laws of the Republic of South Africa.",
                    "Report any suspected fraud, unauthorized access, or security breach immediately.",
                    "Not attempt to circumvent any security measures, verification requirements, or platform limits.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="h-4 w-4 text-white/20 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 8. Limitation of Liability */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-red-500/15" style={{ background: "rgba(239,68,68,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <div className="rounded-xl p-5 ring-1 ring-red-500/20 mb-4" style={{ background: "rgba(239,68,68,0.04)" }}>
                <p className="text-sm text-white/55 leading-relaxed">
                  To the <strong className="text-white/70">maximum extent permitted by law</strong>, Slip a Tip (Pty) Ltd, its directors, shareholders, officers, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from or related to:
                </p>
              </div>
              <ul className="space-y-2 ml-1">
                {[
                  "System outages, downtime, or technical failures of the Platform or third-party services.",
                  "Fraudulent payments made by Customers or any chargebacks resulting therefrom.",
                  "The freezing, withholding, or seizure of funds by regulatory authorities, banks, or payment providers.",
                  "Unauthorized access to the User's mobile device, account, or QR code.",
                  "Loss of income, tips, or earnings due to any cause whatsoever.",
                  "Any act, omission, or conduct of any Customer, third party, or other User.",
                  "Delays in processing payouts or withdrawals due to verification, compliance, or fraud checks.",
                  "Changes in law, regulation, or regulatory interpretation affecting the Platform's operation.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/45">
                    <svg className="h-4 w-4 text-red-400/50 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-white/40 leading-relaxed mt-4">The User&rsquo;s sole remedy for dissatisfaction with the Platform is to cease using it and close their account.</p>
            </section>

            {/* 9. Indemnification */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">9. Indemnification</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                The User agrees to indemnify, defend, and hold harmless Slip a Tip (Pty) Ltd, its directors, officers, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from or related to: (a) the User&rsquo;s use of the Platform; (b) the User&rsquo;s breach of these Terms; (c) the User&rsquo;s violation of any law or regulation; or (d) the User&rsquo;s negligence or wilful misconduct.
              </p>
            </section>

            {/* 10. Intellectual Property */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">10. Intellectual Property</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                All content, trademarks, logos, designs, software, and intellectual property on the Platform are owned by Slip a Tip (Pty) Ltd and are protected by South African and international intellectual property laws. The User is granted a limited, non-exclusive, non-transferable licence to use the Platform solely for the purpose of receiving tips. Any reproduction, modification, distribution, or commercial exploitation of the Platform or its content without prior written consent is strictly prohibited.
              </p>
            </section>

            {/* 11. Account Suspension & Termination */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">11. Account Suspension & Termination</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-3">
                <p>Slip a Tip reserves the right to suspend or terminate any User account, without prior notice, if:</p>
                <ul className="space-y-2 ml-1">
                  {[
                    "The User provides false, misleading, or fraudulent information.",
                    "The User fails to complete required FICA verification within the prescribed timeframe.",
                    "The User's account is flagged by our fraud detection or AML monitoring systems.",
                    "The User breaches any provision of these Terms and Conditions.",
                    "The User's account is used for money laundering, fraud, or any illegal activity.",
                    "Required by law, regulation, court order, or directive from a regulatory authority.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="h-4 w-4 text-white/20 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>Upon termination, the User&rsquo;s access to the Platform will be revoked. Any remaining verified funds will be paid out within 30 business days, subject to applicable holds and compliance checks.</p>
              </div>
            </section>

            {/* 12. Paystack Marketplace & Split Payments */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-accent/15" style={{ background: "rgba(20,167,249,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">12. Paystack Marketplace & Split Payments</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p><strong className="text-white/70">12.1.</strong> Slip a Tip utilises Paystack (a PCI-DSS Level 1 Service Provider owned by Stripe) to facilitate payments. By using the Platform, the User agrees to the creation of a <strong className="text-white/70">Paystack Subaccount</strong> in their name.</p>
                <p><strong className="text-white/70">12.2.</strong> Slip a Tip acts solely as a <strong className="text-white/70">technical marketplace interface</strong> and does not provide financial services or hold deposits. The Service Fee of 10% is automatically deducted from every transaction via Paystack&rsquo;s Split Payment feature at the point of sale. This fee is non-refundable and covers the technical cost of maintaining the QR network, payment processing, fraud prevention, and administration.</p>
                <p><strong className="text-white/70">12.3.</strong> The User acknowledges that because Paystack processes the split at the gateway level, Slip a Tip never holds the User&rsquo;s portion of funds in its own bank account. The User&rsquo;s earnings are held in their Paystack Subaccount until withdrawn.</p>
                <p><strong className="text-white/70">12.4.</strong> A <strong className="text-white/70">Transfer Fee</strong> applies to every withdrawal to cover bank transfer costs. This fee will be deducted from the User&rsquo;s available balance at the time of payout.</p>
              </div>
            </section>

            {/* 13. Chargebacks & Disputed Transactions */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-red-500/15" style={{ background: "rgba(239,68,68,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">13. Chargebacks & Disputed Transactions</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p><strong className="text-white/70">13.1.</strong> The User acknowledges that a Customer or their bank may dispute a transaction (a &ldquo;Chargeback&rdquo;). All transactions are processed with 3D Secure authentication, which triggers a liability shift to the card issuer for unauthorised transactions.</p>
                <p><strong className="text-white/70">13.2.</strong> In the event of a Chargeback, Slip a Tip is required by its banking partners to return the funds to the Customer. The User agrees that Slip a Tip and Paystack shall have the <strong className="text-white/70">absolute right</strong> to:</p>
                <div className="ml-4 space-y-2">
                  <p>(a) Deduct the full amount of the Chargeback (plus any bank-imposed fines) from the User&rsquo;s Virtual Wallet and/or Paystack Subaccount.</p>
                  <p>(b) Place a temporary hold on the User&rsquo;s account during a dispute investigation.</p>
                  <p>(c) Set off any negative balance against future tips received by the User.</p>
                </div>
                <p><strong className="text-white/70">13.3.</strong> Slip a Tip is not responsible for losses incurred by the User due to fraudulent Customer activity. The User accepts that tipping is a voluntary donation and &ldquo;Settled&rdquo; funds are only those that have cleared the Cooldown Period.</p>
                <p><strong className="text-white/70">13.4.</strong> If a Chargeback occurs after a payout has been made, the resulting <strong className="text-white/70">negative balance</strong> constitutes a debt owed by the User to Slip a Tip. The User will be required to earn new tips to offset this debt before any further withdrawals are permitted.</p>
                <div className="rounded-xl p-4 ring-1 ring-red-500/20 mt-2" style={{ background: "rgba(239,68,68,0.04)" }}>
                  <p className="text-xs text-white/50 leading-relaxed">
                    <strong className="text-red-400/80">Proof of Service:</strong> In the event of a Chargeback dispute, Slip a Tip will submit evidence to Paystack including: the GPS location of the QR code scan, the unique Worker ID, the 3D Secure authorisation code, and the digital receipt. This evidence chain is typically sufficient to win disputes.
                  </p>
                </div>
              </div>
            </section>

            {/* 14. Settlement Cooldown Period */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">14. Settlement Cooldown Period</h2>
              <div className="text-sm text-white/45 leading-relaxed space-y-4">
                <p><strong className="text-white/70">14.1.</strong> To protect against fraud and chargebacks, all tips received by the User are subject to a <strong className="text-white/70">72-hour Cooldown Period</strong> before they become &ldquo;Available for Withdrawal.&rdquo;</p>
                <p><strong className="text-white/70">14.2.</strong> During the Cooldown Period, the tip amount is visible in the User&rsquo;s Virtual Wallet but cannot be withdrawn. If a Customer initiates a dispute during this period, Slip a Tip and Paystack reserve the right to reverse the transaction immediately from the User&rsquo;s balance.</p>
                <p><strong className="text-white/70">14.3.</strong> High-risk transactions (as determined by our fraud detection systems) may be subject to an extended hold period of up to 7 days. The User will be notified if an extended hold is applied.</p>
                <p><strong className="text-white/70">14.4.</strong> The minimum withdrawal amount is <strong className="text-white/70">R100</strong>. This threshold is set to protect the platform from chargeback losses on small-value transactions.</p>
              </div>
            </section>

            {/* 15. Dispute Resolution */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">15. Dispute Resolution</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                Any dispute arising from or in connection with these Terms shall first be referred to mediation in accordance with the rules of the Arbitration Foundation of Southern Africa (AFSA). If the dispute cannot be resolved through mediation within 30 days, it shall be referred to and finally resolved by arbitration under AFSA Rules. The seat of arbitration shall be Johannesburg, South Africa. The language of proceedings shall be English. The arbitrator&rsquo;s decision shall be final and binding.
              </p>
            </section>

            {/* 16. Governing Law */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">16. Governing Law & Jurisdiction</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of South Africa. The User consents to the exclusive jurisdiction of the High Court of South Africa, Gauteng Division, Johannesburg, for any legal proceedings arising from these Terms.
              </p>
            </section>

            {/* 17. Amendments */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">17. Amendments</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                Slip a Tip reserves the right to amend these Terms at any time. Users will be notified of material changes via the Platform, email, or SMS. Continued use of the Platform after notification constitutes acceptance of the amended Terms. If the User does not agree to the amended Terms, they must cease using the Platform and close their account.
              </p>
            </section>

            {/* 18. Severability */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">18. Severability</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be severed from these Terms, and the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* 19. Entire Agreement */}
            <section className="rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-xl font-bold text-white mb-4">19. Entire Agreement</h2>
              <p className="text-sm text-white/45 leading-relaxed">
                These Terms, together with the Privacy Policy, PAIA Manual, and any other policies published on the Platform, constitute the entire agreement between the User and Slip a Tip (Pty) Ltd. No prior or collateral representations, warranties, or agreements shall be binding unless incorporated herein.
              </p>
            </section>
          </div>

          {/* Consent checklist */}
          <div className="mt-12 rounded-2xl p-6 sm:p-8 ring-1 ring-white/[0.08]" style={{ background: "rgba(8,8,14,0.9)", backdropFilter: "blur(24px)" }}>
            <h2 className="text-xl font-bold text-white mb-2">Registration Consent Checklist</h2>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">At the point of registration, all Users must confirm the following:</p>
            <div className="space-y-3">
              {[
                "I confirm I am a South African citizen or have a valid work permit.",
                "I agree that I am an Independent Contractor and not an employee of Slip a Tip.",
                "I understand that I cannot withdraw money until I have completed FICA verification (ID photo, selfie, and proof of address). The minimum withdrawal amount is R100.",
                "I acknowledge that if I do not provide my FICA documents within 60 days, my tips will be forfeited and donated to a nominated registered charity.",
                "I consent to Slip a Tip processing my personal information (ID, bank details, and biometric data) under the POPI Act, and to the creation of a Paystack Subaccount in my name.",
                "I understand that Slip a Tip is a marketplace and that my earnings are split automatically at the point of sale via Paystack (90% to me, 10% platform fee).",
                "I accept the 72-hour settlement cooldown period for security purposes and the applicable transfer fee on withdrawals.",
                "I agree that Slip a Tip reserves the right to debit my balance for any chargebacks or disputed transactions, and that a resulting negative balance constitutes a debt I must repay from future tips.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-accent/30" style={{ background: "rgba(20,167,249,0.08)" }}>
                    <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <span className="text-sm text-white/50 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 rounded-2xl p-6 sm:p-8 ring-1 ring-accent/20 text-center" style={{ background: "rgba(20,167,249,0.03)" }}>
            <h2 className="text-lg font-bold text-white mb-2">Questions About These Terms?</h2>
            <p className="text-sm text-white/40 mb-5">Contact our legal team for clarification on any provision.</p>
            <a href="mailto:legal@slipatip.co.za" className="btn-primary !py-2.5 !px-5 text-sm">Contact: legal@slipatip.co.za</a>
          </div>

          {/* Related links */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Related Policies</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal/paia" className="text-xs text-accent hover:text-accent/80 transition-colors">PAIA Compliance &rarr;</Link>
              <Link href="/legal/popia" className="text-xs text-accent hover:text-accent/80 transition-colors">POPIA Compliance &rarr;</Link>
              <Link href="/legal/fica" className="text-xs text-accent hover:text-accent/80 transition-colors">FICA Compliance &rarr;</Link>
              <Link href="/legal/privacy" className="text-xs text-accent hover:text-accent/80 transition-colors">Privacy Policy &rarr;</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
