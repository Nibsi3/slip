"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";

const HeroGradient = dynamic(() => import("@/components/HeroSphere"), {
  ssr: false,
  loading: () => null,
});

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#030306" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: "rgba(3,3,6,0.7)", backdropFilter: "blur(20px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Slip" width={120} height={40} priority className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link href="#how-it-works" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">
              How it works
            </Link>
            <Link href="#pricing" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="hidden md:inline-flex text-sm text-white/50 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/auth/login" className="btn-secondary !py-2 !px-3 sm:!px-4 !text-xs">
              Log In
            </Link>
            <Link href="/auth/register" className="btn-primary !py-2 !px-3 sm:!px-4 !text-xs">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <HeroGradient />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left — text */}
              <div className="text-center lg:text-left">
                <ScrollReveal>
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10 mb-8" style={{ background: "rgba(255,255,255,0.04)" }}>
                    Built for South Africa &middot; Powered by PayFast
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[0.95]">
                    <span className="text-white">Digital</span>
                    <br />
                    <span className="bg-gradient-to-r from-accent-300 via-accent to-accent-600 bg-clip-text text-transparent">
                      Tipping
                    </span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <p className="mt-6 max-w-lg text-base sm:text-lg text-white leading-relaxed">
                    Workers get a personal QR code. Customers scan, pick an amount,
                    and pay instantly. Tips land in a digital wallet — transparent and simple.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.3}>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link href="/auth/register" className="btn-primary !py-4 !px-10 text-base">
                      Get started free
                    </Link>
                    <Link href="/tip/demo-thabo-molefe" className="btn-secondary !py-4 !px-10 text-base">
                      Try a demo
                    </Link>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.4}>
                  <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto lg:mx-0">
                    {[
                      { value: "0", label: "Setup cost" },
                      { value: "5%", label: "Withdrawal fee" },
                      { value: "Instant", label: "Payments" },
                    ].map((s) => (
                      <div key={s.label} className="text-center lg:text-left">
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="mt-1 text-xs text-white/40">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              {/* Right — demo card */}
              <ScrollReveal delay={0.3} direction="right">
                <div
                  className="card-glow !p-0 overflow-hidden"
                  style={{ background: "rgba(3,3,6,0.82)", backdropFilter: "blur(22px)", boxShadow: "0 0 50px rgba(0,0,0,0.55), 0 0 120px rgba(20,167,249,0.06), 0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Live preview</div>
                        <div className="mt-1 text-base font-bold text-white">Scan &rarr; Tip &rarr; Done</div>
                      </div>
                      <div className="rounded-full px-3 py-1 text-[10px] font-medium text-accent ring-1 ring-accent/20" style={{ background: "rgba(20,167,249,0.08)" }}>
                        Mobile-first
                      </div>
                    </div>
                  </div>

                  {/* Tip amounts */}
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-3">Choose amount</div>
                    <div className="grid grid-cols-3 gap-2">
                      {["R10", "R20", "R50", "R100", "R200", "Custom"].map((a, i) => (
                        <div
                          key={a}
                          className={`px-3 py-2 text-center text-sm font-semibold transition-all ${
                            i === 2
                              ? "bg-black text-white ring-1 ring-white/10"
                              : "text-white/60 ring-1 ring-white/[0.06]"
                          }`}
                          style={i !== 2 ? { background: "rgba(255,255,255,0.03)" } : {}}
                        >
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wallet preview */}
                  <div className="px-6 py-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Wallet balance</div>
                        <div className="mt-1 text-3xl font-extrabold text-white">R 1,245<span className="text-lg text-white/50">.50</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/30">Last tip</div>
                        <div className="text-sm font-semibold text-green-400">+R 50.00</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 py-2 text-center text-xs font-medium text-white/50 ring-1 ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
                        Instant Money
                      </div>
                      <div className="flex-1 py-2 text-center text-xs font-medium text-white/50 ring-1 ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
                        EFT
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030306] to-transparent z-10" />
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradient burst — right side */}
          <div className="absolute -right-40 top-1/3 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute -right-20 top-1/3 w-[300px] h-[300px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #14a7f9, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="mb-16">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">How it works</p>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Three simple steps</h2>
                <p className="mt-4 text-white/40 max-w-lg">No app downloads. No sign-ups for customers. Just scan, tap, and pay.</p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { step: "01", title: "Scan QR code", desc: "Customer opens their phone camera and scans the worker's unique QR code. No app installs needed." },
                { step: "02", title: "Pick an amount", desc: "Choose from quick amounts (R10, R20, R50, R100, R200) or enter a custom tip amount." },
                { step: "03", title: "Pay via PayFast", desc: "Secure checkout via PayFast. The tip lands in the worker's digital wallet instantly." },
              ].map((item, i) => (
                <ScrollReveal key={item.step} delay={i * 0.15}>
                  <div className={i === 1 ? "card-glow h-full" : "card h-full"}>
                    <div className="text-xs font-mono text-accent/60 mb-4">{item.step}</div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.3}>
              <div className="mt-10">
                <Link href="/tip/demo-thabo-molefe" className="text-sm font-medium text-accent hover:text-accent-300 transition-colors">
                  Try a live demo &rarr;
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ===== FEATURES + INDUSTRIES ===== */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradient burst — left side */}
          <div className="absolute -left-40 top-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute -left-20 top-1/3 w-[350px] h-[350px] rounded-full opacity-[0.025]" style={{ background: "radial-gradient(circle, #14a7f9, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="mb-16">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Features</p>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  Everything a worker needs
                </h2>
                <p className="mt-4 text-white/40 max-w-xl">
                  Personal dashboard, transparent wallet, and simple withdrawals.
                  Built for waiters, porters, baristas, car guards, and delivery riders.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Personal QR code", desc: "Unique link for each worker. Print it or display on your phone." },
                { title: "Wallet & ledger", desc: "Every tip tracked. Full transparency and a clear audit trail." },
                { title: "Instant Money / EFT", desc: "Withdraw to any SA bank account or collect cash at an ATM." },
                { title: "Worker dashboard", desc: "See your tips, balance, and withdrawal history at a glance." },
              ].map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 0.1}>
                  <div className="card h-full">
                    <div className="text-sm font-semibold text-white">{f.title}</div>
                    <div className="mt-2 text-xs text-white/40 leading-relaxed">{f.desc}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Industries row */}
            <ScrollReveal delay={0.2}>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Restaurants & cafés", desc: "Waiters, baristas, runners" },
                  { title: "Hotels & lodges", desc: "Porters, housekeeping, concierge" },
                  { title: "Car guards", desc: "Quick scan and tip at any parking" },
                  { title: "Delivery riders", desc: "Drivers and couriers" },
                ].map((u) => (
                  <div key={u.title} className="flex items-start gap-3 p-4 ring-1 ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{u.title}</div>
                      <div className="text-xs text-white/40">{u.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradient burst — center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, #14a7f9, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left — text */}
              <ScrollReveal>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Pricing</p>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Completely free to start</h2>
                  <p className="mt-4 text-white/40 max-w-md">
                    No monthly fees. No hidden costs. Sign up, get your QR code, and start receiving tips immediately.
                    A small 5% fee is deducted only when you withdraw.
                  </p>

                  <div className="mt-8 grid grid-cols-3 gap-6 max-w-sm">
                    {[
                      { value: "R0", sub: "to sign up" },
                      { value: "5%", sub: "on withdrawals" },
                      { value: "0%", sub: "monthly fees" },
                    ].map((s) => (
                      <div key={s.sub}>
                        <div className="text-2xl font-extrabold text-white">{s.value}</div>
                        <div className="mt-1 text-xs text-white/40">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Right — pricing card */}
              <ScrollReveal delay={0.15}>
                <div className="card-glow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-medium text-white/40 uppercase tracking-wider">For all workers</div>
                    <div className="rounded-full px-3 py-1 text-[10px] font-semibold text-accent ring-1 ring-accent/20" style={{ background: "rgba(20,167,249,0.08)" }}>
                      Free forever
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-8">
                    {[
                      "Personal QR code & tip page",
                      "PayFast secure checkout",
                      "Worker dashboard & wallet",
                      "Full tip history & audit trail",
                      "Withdraw via Instant Money or EFT",
                      "No monthly fees, ever",
                    ].map((x) => (
                      <div key={x} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 shrink-0">
                          <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <span className="text-white/70">{x}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/auth/register" className="btn-primary w-full !py-4 text-base">
                    Create your free account
                  </Link>

                  <p className="mt-4 text-center text-xs text-white/30">
                    No credit card required
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradient burst — right side */}
          <div className="absolute -right-32 bottom-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute -right-10 bottom-1/3 w-[300px] h-[300px] rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, #14a7f9, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
              {/* Left — heading */}
              <ScrollReveal>
                <div className="lg:sticky lg:top-32">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">FAQ</p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Common questions</h2>
                  <p className="mt-4 text-white/40">
                    Everything you need to know about Slip.
                  </p>
                </div>
              </ScrollReveal>

              {/* Right — questions */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { q: "Do customers need an app?", a: "No. They scan the QR code with their phone camera and tip directly in the browser. Zero friction." },
                  { q: "Is it secure?", a: "All payments are handled by PayFast. Slip never sees or stores card details." },
                  { q: "How do withdrawals work?", a: "Request a withdrawal from your dashboard. Choose Instant Money (collect at any ATM) or EFT to your bank." },
                  { q: "What does it cost?", a: "Signing up is completely free. A 5% platform fee is deducted only when you withdraw your tips." },
                  { q: "Who can use Slip?", a: "Any worker in the service industry — waiters, baristas, porters, car guards, delivery riders, and more." },
                  { q: "How fast do tips arrive?", a: "Tips are credited to your wallet as soon as PayFast confirms the payment, usually within seconds." },
                ].map((item, i) => (
                  <ScrollReveal key={item.q} delay={i * 0.08}>
                    <div className="card h-full">
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
          {/* Gradient burst — center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full opacity-[0.025]" style={{ background: "radial-gradient(circle, #14a7f9, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="card-glow max-w-4xl mx-auto !py-16 !px-10">
                <div className="grid sm:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Start receiving tips today</h2>
                    <p className="mt-4 text-sm text-white/40">
                      Create your account, get your QR code, and let customers tip you digitally. It takes less than 2 minutes.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end">
                    <Link href="/auth/register" className="btn-primary !py-4 !px-10 text-base w-full sm:w-auto">
                      Get started free
                    </Link>
                    <Link href="/auth/login" className="btn-secondary !py-4 !px-10 text-base w-full sm:w-auto">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">&copy; {new Date().getFullYear()} Slip</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
              <Link href="/auth/register" className="text-white/30 hover:text-white transition-colors">Create account</Link>
              <Link href="/dashboard" className="text-white/30 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/tip/demo-thabo-molefe" className="text-white/30 hover:text-white transition-colors">Demo</Link>
              <Link href="/dashboard/contact" className="text-white/30 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
