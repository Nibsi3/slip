"use client";

import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import GuidesDropdown from "@/components/GuidesDropdown";
import AnimatedDemo from "@/components/AnimatedDemo";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#030306" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: "rgba(3,3,6,0.75)", backdropFilter: "blur(24px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
            <span className="text-white font-bold text-lg tracking-tight">Slip a Tip</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <GuidesDropdown />
            <Link href="#pricing" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">FAQ</Link>
            <Link href="/apply" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">Apply</Link>
            <Link href="/auth/login" className="btn-secondary !py-2 !px-3 sm:!px-4 !text-xs">Log In</Link>
            <Link href="/auth/register" className="btn-primary !py-2 !px-3 sm:!px-4 !text-xs">Get Started</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/photos/9df0b484-9692-44cf-be76-f2660b61a30d_3840w.jpg"
              alt=""
              fill
              quality={95}
              priority
              className="object-cover object-center"
              style={{ opacity: 0.45 }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(3,3,6,0.82) 0%, rgba(3,3,6,0.35) 50%, rgba(3,3,6,0.82) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(20,167,249,0.09) 0%, transparent 70%)" }} />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-16">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — text */}
              <div className="text-center lg:text-left">
                <ScrollReveal>
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/[0.12] mb-8" style={{ background: "rgba(20,167,249,0.07)" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse inline-block" />
                    Built for South Africa &middot; Powered by Paystack
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[0.92]">
                    <span className="text-white">Digital</span>
                    <br />
                    <span className="bg-gradient-to-r from-accent-300 via-accent to-accent-600 bg-clip-text text-transparent">
                      Tipping
                    </span>
                    <br />
                    <span className="text-white/60 text-4xl sm:text-5xl font-bold">Made Simple</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <p className="mt-7 max-w-lg text-base sm:text-lg text-white/75 leading-relaxed">
                    Workers get a personal QR code. Customers scan, pick an amount,
                    and pay instantly. Tips land in a digital wallet — transparent and effortless.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.3}>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link href="/auth/register" className="btn-primary !py-4 !px-10 text-base">
                      Get started free
                    </Link>
                    <Link href="#demo" className="btn-secondary !py-4 !px-10 text-base">
                      Watch demo
                    </Link>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.4}>
                  <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
                    {[
                      { value: "R0", label: "Setup cost" },
                      { value: "10%", label: "Total fee" },
                      { value: "Instant", label: "Payments" },
                    ].map((s, i) => (
                      <div key={s.label} className="text-center lg:text-left">
                        {i !== 0 && <div className="absolute -left-4 top-0 h-full w-px bg-white/10" />}
                        <div className="relative text-2xl font-extrabold text-white">{s.value}</div>
                        <div className="mt-0.5 text-xs text-white/40 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              {/* Right — demo card */}
              <ScrollReveal delay={0.3} direction="right">
                <div
                  className="overflow-hidden ring-1 ring-white/[0.09] rounded-2xl"
                  style={{ background: "rgba(8,8,14,0.88)", backdropFilter: "blur(28px)", boxShadow: "0 0 60px rgba(0,0,0,0.6), 0 0 140px rgba(20,167,249,0.07), 0 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Live preview</div>
                        <div className="mt-1 text-base font-bold text-white">Scan &rarr; Tip &rarr; Done</div>
                      </div>
                      <div className="rounded-full px-3 py-1 text-[10px] font-medium text-accent ring-1 ring-accent/25" style={{ background: "rgba(20,167,249,0.1)" }}>
                        Mobile-first
                      </div>
                    </div>
                  </div>

                  {/* Worker profile strip */}
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent shrink-0 ring-1 ring-accent/20">T</div>
                    <div>
                      <div className="text-sm font-bold text-white">Thabo Molefe</div>
                      <div className="text-xs text-white/40">Waiter &middot; The Palace Hotel</div>
                    </div>
                    <div className="ml-auto text-xs text-green-400 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                      Active
                    </div>
                  </div>

                  {/* Tip amounts */}
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-3">Choose amount</div>
                    <div className="grid grid-cols-3 gap-2">
                      {["R15", "R20", "R50", "R100", "R200"].map((a, i) => (
                        <div
                          key={a}
                          className={`px-3 py-2.5 text-center text-sm font-semibold rounded-lg transition-all ${
                            i === 2
                              ? "text-white ring-1 ring-accent/40"
                              : "text-white/50 ring-1 ring-white/[0.06]"
                          }`}
                          style={i === 2 ? { background: "rgba(20,167,249,0.15)" } : { background: "rgba(255,255,255,0.03)" }}
                        >
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wallet preview */}
                  <div className="px-6 py-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Wallet balance</div>
                        <div className="mt-1 text-3xl font-extrabold text-white">R 1,245<span className="text-lg text-white/40">.50</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/30">Last tip</div>
                        <div className="text-sm font-bold text-green-400">+R 50.00</div>
                        <div className="text-[10px] text-white/25 mt-0.5">2 min ago</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 py-2.5 text-center text-xs font-medium text-white/50 ring-1 ring-white/[0.07] rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        Instant Money
                      </div>
                      <div className="flex-1 py-2.5 text-center text-xs font-medium text-white/50 ring-1 ring-white/[0.07] rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        EFT
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030306] to-transparent z-10" />
        </section>

        {/* ===== ANIMATED DEMO ===== */}
        <section id="demo" className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(20,167,249,0.04) 0%, transparent 70%)" }} />
          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/[0.12] mb-6" style={{ background: "rgba(20,167,249,0.07)" }}>
                  <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                  See it in action
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">How tipping works</h2>
                <p className="mt-4 text-white/40 max-w-lg mx-auto">Watch the full flow — from QR scan to money in the worker&rsquo;s wallet — in under 20 seconds.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <AnimatedDemo />
            </ScrollReveal>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — phone image */}
              <ScrollReveal direction="left">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                  <Image
                    src="/photos/a7bd2085-6bb2-4d53-81fb-315f00278443_3840w.jpg"
                    alt="Scanning a QR code with a phone"
                    fill
                    quality={95}
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(3,3,6,0.4) 0%, rgba(3,3,6,0.1) 60%, rgba(3,3,6,0.5) 100%)" }} />
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-white/10" style={{ background: "rgba(8,8,14,0.85)", backdropFilter: "blur(16px)" }}>
                      <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">No app needed</div>
                        <div className="text-[11px] text-white/50">Just open the camera & scan</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right — steps */}
              <div>
                <ScrollReveal>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">How it works</p>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Three simple steps</h2>
                  <p className="mt-4 text-white/40 max-w-md">No app downloads. No sign-ups for customers. Just scan, tap, and pay.</p>
                </ScrollReveal>

                <div className="mt-10 space-y-6">
                  {[
                    { step: "01", title: "Scan QR code", desc: "Customer opens their phone camera and scans the worker's unique QR code. No app installs needed." },
                    { step: "02", title: "Pick an amount", desc: "Choose from quick amounts — R15, R20, R50, R100, or R200. Quick, simple, no fuss." },
                    { step: "03", title: "Pay securely", desc: "Secure 3D Secure checkout via Paystack. A small total fee (up to 10%) is deducted from the tip — Paystack takes their processing fee, Slip a Tip takes the remainder." },
                  ].map((item, i) => (
                    <ScrollReveal key={item.step} delay={i * 0.12}>
                      <div className="flex gap-5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-accent ring-1 ring-accent/20" style={{ background: "rgba(20,167,249,0.08)" }}>
                          {item.step}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{item.title}</h3>
                          <p className="mt-1.5 text-sm text-white/40 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                <ScrollReveal delay={0.4}>
                  <div className="mt-10 flex flex-col sm:flex-row gap-3">
                    <Link href="/guide/workers" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-300 transition-colors">
                      Worker guide <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </Link>
                    <Link href="/guide/customers" className="inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors">
                      Customer guide <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background image strip */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/photos/6f3bae5c-fdc6-4ff7-8902-1fb813c40789_3840w.jpg"
              alt=""
              fill
              quality={95}
              className="object-cover object-center"
              style={{ opacity: 0.12 }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #030306 0%, rgba(3,3,6,0.7) 50%, #030306 100%)" }} />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — text */}
              <ScrollReveal>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Pricing</p>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Completely free<br />to get started</h2>
                  <p className="mt-5 text-white/40 max-w-md leading-relaxed">
                    No monthly fees. No hidden costs. Sign up, get your QR code, and start receiving tips immediately.
                    A small total fee (up to 10%) is deducted from tips to cover Paystack processing and the Slip a Tip platform.
                  </p>

                  <div className="mt-10 grid grid-cols-3 gap-6 max-w-xs">
                    {[
                      { value: "R0", sub: "to sign up" },
                      { value: "Up to 10%", sub: "total fee on tips" },
                      { value: "0%", sub: "monthly fees" },
                    ].map((s, i) => (
                      <div key={s.sub} className="relative">
                        {i !== 0 && <div className="absolute -left-3 top-1 bottom-1 w-px bg-white/[0.08]" />}
                        <div className="text-3xl font-extrabold text-white">{s.value}</div>
                        <div className="mt-1 text-xs text-white/35 uppercase tracking-wider">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Right — pricing card */}
              <ScrollReveal delay={0.15}>
                <div className="rounded-2xl p-8 ring-1 ring-white/[0.09]" style={{ background: "rgba(8,8,14,0.85)", backdropFilter: "blur(24px)" }}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xs font-medium text-white/30 uppercase tracking-widest">For all workers</div>
                    <div className="rounded-full px-3 py-1 text-[10px] font-semibold text-accent ring-1 ring-accent/25" style={{ background: "rgba(20,167,249,0.1)" }}>
                      Free forever
                    </div>
                  </div>

                  <div className="space-y-4 text-sm mb-8">
                    {[
                      "Personal QR code & tip page",
                      "Paystack 3D Secure checkout",
                      "Worker dashboard & wallet",
                      "Full tip history & audit trail",
                      "Withdraw via Instant Money or EFT",
                      "Total fees capped at 10%",
                      "No monthly fees, ever",
                      "No platform withdrawal fees",
                    ].map((x) => (
                      <div key={x} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full shrink-0" style={{ background: "rgba(20,167,249,0.12)" }}>
                          <svg className="h-2.5 w-2.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <span className="text-white/65">{x}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/auth/register" className="btn-primary w-full !py-4 text-base !rounded-xl">
                    Create your free account
                  </Link>
                  <p className="mt-4 text-center text-xs text-white/25">No credit card required</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="relative py-24 sm:py-32 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
              {/* Left — heading + image */}
              <ScrollReveal>
                <div className="lg:sticky lg:top-32">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">FAQ</p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Common questions</h2>
                  <p className="mt-4 text-white/40 text-sm leading-relaxed">Everything you need to know about Slip a Tip.</p>

                  {/* Small decorative image */}
                  <div className="mt-8 relative rounded-2xl overflow-hidden aspect-square max-w-[320px] sm:max-w-[360px]">
                    <Image
                      src="/photos/grok-image-24fb0006-f981-41f9-b49c-bc4e4523c764.jpeg"
                      alt="Common questions"
                      fill
                      quality={95}
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,3,6,0.1), rgba(3,3,6,0.5))" }} />
                  </div>
                </div>
              </ScrollReveal>

              {/* Right — questions */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { q: "Do customers need an app?", a: "No. They scan the QR code with their phone camera and tip directly in the browser. Zero friction." },
                  { q: "Is it secure?", a: "All payments are handled by Paystack (PCI-DSS Level 1) with 3D Secure authentication. Slip a Tip never sees or stores card details. Liability shifts to the card issuer." },
                  { q: "How do withdrawals work?", a: "Request a withdrawal from your dashboard. Choose Instant Money (collect at any ATM) or EFT to your bank. No platform withdrawal fees." },
                  { q: "What does it cost?", a: "Signing up is completely free. A small total fee (up to 10%) is deducted from tips to cover Paystack processing and the Slip a Tip platform." },
                  { q: "Who can use Slip a Tip?", a: "Any worker in the service industry — waiters, baristas, porters, car guards, delivery riders, and more." },
                  { q: "How fast do tips arrive?", a: "Tips appear in your wallet instantly. Funds become available for withdrawal after a 72-hour settlement cooldown period for fraud protection." },
                ].map((item, i) => (
                  <ScrollReveal key={item.q} delay={i * 0.07}>
                    <div className="rounded-2xl p-5 h-full ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                      <div className="text-sm font-semibold text-white">{item.q}</div>
                      <div className="mt-2 text-xs text-white/40 leading-relaxed">{item.a}</div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/photos/586fe153-4525-4bc0-b6ff-39cbac276d12_3840w.jpg"
              alt=""
              fill
              quality={95}
              className="object-cover object-center"
              style={{ opacity: 0.18 }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #030306 0%, rgba(3,3,6,0.55) 50%, #030306 100%)" }} />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <ScrollReveal>
              <div className="rounded-3xl p-10 sm:p-16 ring-1 ring-white/[0.09] text-center" style={{ background: "rgba(8,8,14,0.8)", backdropFilter: "blur(32px)" }}>
                <div className="mx-auto mb-6 h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-white/10">
                  <Image src="/logo.png" alt="Slip a Tip" width={64} height={64} quality={95} className="w-full h-full object-contain" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Start receiving tips today</h2>
                <p className="mt-5 text-white/40 max-w-lg mx-auto leading-relaxed">
                  Create your account, get your personal QR code, and let customers tip you digitally. It takes less than 2 minutes.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/register" className="btn-primary !py-4 !px-12 text-base !rounded-xl">
                    Get started free
                  </Link>
                  <Link href="#demo" className="btn-secondary !py-4 !px-10 text-base !rounded-xl">
                    Watch demo
                  </Link>
                </div>
                <p className="mt-5 text-xs text-white/25">No credit card required &middot; Free forever</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] pt-16 pb-10" style={{ background: "rgba(6,6,10,0.6)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="Slip a Tip" width={40} height={40} quality={95} className="h-10 w-10 object-contain" />
                <span className="text-white font-bold text-base">Slip a Tip</span>
              </Link>
              <p className="text-xs text-white/35 leading-relaxed max-w-[220px]">
                Digital tipping for South Africa&rsquo;s service industry. Scan, tap, tip.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400/70 font-medium">All systems operational</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><Link href="#how-it-works" className="text-xs text-white/30 hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="#demo" className="text-xs text-white/30 hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="#pricing" className="text-xs text-white/30 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#faq" className="text-xs text-white/30 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/apply" className="text-xs text-white/30 hover:text-white transition-colors">Apply as worker</Link></li>
              </ul>
            </div>

            {/* Guides */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Guides</h4>
              <ul className="space-y-2.5">
                <li><Link href="/guide/workers" className="text-xs text-white/30 hover:text-white transition-colors">For Workers</Link></li>
                <li><Link href="/guide/customers" className="text-xs text-white/30 hover:text-white transition-colors">For Customers</Link></li>
                <li><Link href="/auth/register" className="text-xs text-white/30 hover:text-white transition-colors">Create account</Link></li>
                <li><Link href="/auth/login" className="text-xs text-white/30 hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/dashboard/contact" className="text-xs text-white/30 hover:text-white transition-colors">Contact us</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/legal/terms" className="text-xs text-white/30 hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/legal/privacy" className="text-xs text-white/30 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/popia" className="text-xs text-white/30 hover:text-white transition-colors">POPIA</Link></li>
                <li><Link href="/legal/paia" className="text-xs text-white/30 hover:text-white transition-colors">PAIA</Link></li>
                <li><Link href="/legal/fica" className="text-xs text-white/30 hover:text-white transition-colors">FICA</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-white/40">&copy; {new Date().getFullYear()} <strong className="text-white/60">Slip a Tip (Pty) Ltd.</strong> All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-white/15">Secured by</span>
              <span className="text-[10px] text-white/30 font-medium">Paystack</span>
              <span className="text-[10px] text-white/15">&middot;</span>
              <span className="text-[10px] text-white/15">Built in South Africa</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
