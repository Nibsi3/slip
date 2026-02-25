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
                      { value: "10%", label: "Withdrawal fee" },
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
                      {["R10", "R20", "R50", "R100", "R200", "Custom"].map((a, i) => (
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
                    { step: "02", title: "Pick an amount", desc: "Choose from quick amounts (R10, R20, R50, R100, R200) or enter a custom tip amount." },
                    { step: "03", title: "Pay securely", desc: "Secure 3D Secure checkout via Paystack. The tip is automatically split — 90% to the worker, 10% platform fee." },
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

        {/* ===== FEATURES ===== */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="mb-16 text-center max-w-2xl mx-auto">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Features</p>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Everything a worker needs</h2>
                <p className="mt-4 text-white/40">Personal dashboard, transparent wallet, and simple withdrawals. Built for the entire service industry.</p>
              </div>
            </ScrollReveal>

            {/* Bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Large feature — with image */}
              <ScrollReveal className="lg:col-span-2 lg:row-span-2">
                <div className="relative rounded-2xl overflow-hidden h-80 lg:h-full min-h-[320px] ring-1 ring-white/[0.07]">
                  <Image
                    src="/photos/ec628e67-bca5-465e-8434-f4b09e9dd1f8_3840w.webp"
                    alt="Digital payment card"
                    fill
                    quality={95}
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,3,6,0.9) 0%, rgba(3,3,6,0.4) 60%, rgba(3,3,6,0.1) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">Digital Wallet</div>
                    <h3 className="text-2xl font-extrabold text-white">Secure, instant payments</h3>
                    <p className="mt-2 text-sm text-white/50 max-w-sm">Every tip tracked with full transparency. Withdraw to any SA bank account or collect cash at any ATM via Instant Money.</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature card 1 */}
              <ScrollReveal delay={0.1}>
                <div className="rounded-2xl p-6 h-full ring-1 ring-white/[0.07] flex flex-col justify-between min-h-[160px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Personal QR Code</h3>
                    <p className="mt-1.5 text-sm text-white/40">Unique link for each worker. Print it, frame it, or display it on your phone.</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature card 2 */}
              <ScrollReveal delay={0.15}>
                <div className="rounded-2xl p-6 h-full ring-1 ring-white/[0.07] flex flex-col justify-between min-h-[160px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Wallet & Ledger</h3>
                    <p className="mt-1.5 text-sm text-white/40">Every tip tracked. Full transparency and a clear audit trail for all earnings.</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Industries — full width bottom row */}
              <ScrollReveal delay={0.2} className="sm:col-span-2 lg:col-span-3">
                <div className="rounded-2xl p-6 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Who uses Slip a Tip</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        title: "Restaurants & Cafés",
                        desc: "Waiters, baristas, runners",
                        icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-1.5-.75m0-9.75a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9.75" /></svg>)
                      },
                      {
                        title: "Hotels & Lodges",
                        desc: "Porters, housekeeping, concierge",
                        icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>)
                      },
                      {
                        title: "Car Guards",
                        desc: "Quick scan at any parking",
                        icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>)
                      },
                      {
                        title: "Delivery Riders",
                        desc: "Drivers and couriers",
                        icon: (<svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>)
                      },
                    ].map((u) => (
                      <div key={u.title} className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(20,167,249,0.08)" }}>{u.icon}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">{u.title}</div>
                          <div className="text-xs text-white/40 mt-0.5">{u.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
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
                    A small 10% fee is only deducted when you withdraw.
                  </p>

                  <div className="mt-10 grid grid-cols-3 gap-6 max-w-xs">
                    {[
                      { value: "R0", sub: "to sign up" },
                      { value: "10%", sub: "on withdrawals" },
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
                      "10% fee on withdrawals only",
                      "No monthly fees, ever",
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
                  { q: "How do withdrawals work?", a: "Request a withdrawal from your dashboard. Choose Instant Money (collect at any ATM) or EFT to your bank." },
                  { q: "What does it cost?", a: "Signing up is completely free. A 10% platform fee is deducted only when you withdraw your tips." },
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
            <span className="text-[10px] text-white/20">&copy; {new Date().getFullYear()} Slip a Tip (Pty) Ltd. All rights reserved.</span>
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
