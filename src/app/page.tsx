"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import GuidesDropdown from "@/components/GuidesDropdown";
import AnimatedDemo from "@/components/AnimatedDemo";
import HeroBackground from "@/components/HeroBackground";

const DEMO_AMOUNTS = [15, 30, 50, 75, 100, 200];

const LIVE_FEED = [
  { name: "Sipho M.", job: "Car Guard", amount: 30, ago: "2m ago" },
  { name: "Nomsa D.", job: "Waitress", amount: 75, ago: "5m ago" },
  { name: "Thabo K.", job: "Bellhop", amount: 50, ago: "11m ago" },
  { name: "Lerato B.", job: "Barista", amount: 100, ago: "18m ago" },
  { name: "Ayanda P.", job: "Porter", amount: 20, ago: "24m ago" },
];

function HeroDemoCard() {
  const [tab, setTab] = useState<"tip" | "wallet" | "activity">("tip");
  const [selected, setSelected] = useState(2);
  const [paid, setPaid] = useState(false);
  const [feedIdx, setFeedIdx] = useState(0);
  const [walletToast, setWalletToast] = useState<string | null>(null);

  useEffect(() => {
    if (!paid) return;
    const t = setTimeout(() => setPaid(false), 2800);
    return () => clearTimeout(t);
  }, [paid]);

  useEffect(() => {
    const iv = setInterval(() => setFeedIdx(p => (p + 1) % LIVE_FEED.length), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!walletToast) return;
    const t = setTimeout(() => setWalletToast(null), 3000);
    return () => clearTimeout(t);
  }, [walletToast]);

  const amount = DEMO_AMOUNTS[selected];

  return (
    <div
      className="w-full overflow-hidden rounded-2xl ring-1 ring-white/[0.09]"
      style={{
        background: "rgba(8,8,14,0.92)",
        backdropFilter: "blur(32px)",
        boxShadow: "0 0 0 1px rgba(249,115,22,0.08), 0 32px 80px rgba(0,0,0,0.7), 0 0 120px rgba(249,115,22,0.06)",
      }}
    >
      {/* ── Top bar ── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-lg overflow-hidden ring-1 ring-white/10 shrink-0">
            <Image src="/logo/11.png" alt="" width={28} height={28} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-none">Slip a Tip</div>
            <div className="text-[9px] text-white/30 mt-0.5">Live demo</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {(["tip", "wallet", "activity"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPaid(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all duration-200 ${
                tab === t ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
              style={tab === t ? { background: "rgba(249,115,22,0.15)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.25)" } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: TIP ── */}
      {tab === "tip" && (
        <div>
          {/* Worker profile */}
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full flex items-center justify-center text-base font-extrabold text-accent ring-1 ring-accent/25" style={{ background: "rgba(249,115,22,0.1)" }}>T</div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#08080e]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">Thabo Molefe</div>
              <div className="text-[11px] text-white/40">Waiter &middot; The Palace Hotel</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-white/25 mb-0.5">tips today</div>
              <div className="text-sm font-bold text-accent">R 340</div>
            </div>
          </div>

          {/* Amount grid */}
          {!paid ? (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Choose amount</span>
                <span className="text-[10px] text-white/20">via WhatsApp</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {DEMO_AMOUNTS.map((amt, i) => (
                  <button
                    key={amt}
                    onClick={() => setSelected(i)}
                    className={`relative py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      selected === i ? "text-white scale-[1.04]" : "text-white/45 hover:text-white/70"
                    }`}
                    style={
                      selected === i
                        ? { background: "#c45000", boxShadow: "0 0 12px rgba(196,80,0,0.4)" }
                        : { background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }
                    }
                  >
                    R{amt}
                  </button>
                ))}
              </div>
              {/* Chosen amount summary */}
              <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div>
                  <div className="text-[10px] text-white/30 mb-0.5">You&apos;re tipping</div>
                  <div className="text-base font-extrabold text-white">R{amount}<span className="text-white/30 text-xs font-medium">.00</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/30 mb-0.5">Instant EFT</div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] text-green-400/80 font-medium">Secure</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPaid(true)}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#c45000", boxShadow: "0 0 20px rgba(196,80,0,0.4)" }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
                  Tip via WhatsApp &mdash; R{amount}
                </span>
              </button>
            </div>
          ) : (
            <div className="px-5 py-6 flex flex-col items-center text-center">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: "rgba(34,197,94,0.1)", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}
              >
                <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div className="text-base font-bold text-white mb-1">Tip sent!</div>
              <div className="text-sm text-white/40">R{amount} to Thabo via WhatsApp</div>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-green-400/70">Payment link delivered</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: WALLET ── */}
      {tab === "wallet" && (
        <div className="px-5 py-5">
          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(196,80,0,0.1)", boxShadow: "inset 0 0 0 1px rgba(196,80,0,0.2)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Available balance</div>
            <div className="text-4xl font-extrabold text-white">R 1,245<span className="text-xl text-white/35">.50</span></div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-accent/70">R 180 pending settlement</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Tips this week", value: "R 540", up: true },
              { label: "Tips this month", value: "R 2,180", up: true },
              { label: "Total earned", value: "R 8,340", up: true },
              { label: "Withdrawn", value: "R 7,094", up: false },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] text-white/25 mb-1">{s.label}</div>
                <div className={`text-sm font-bold ${s.up ? "text-green-400" : "text-white/70"}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {walletToast && (
            <div
              className="mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs font-medium text-white"
              style={{ background: "rgba(196,80,0,0.18)", border: "1px solid rgba(196,80,0,0.35)" }}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              {walletToast}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setWalletToast("EFT withdrawals are available once your account is verified. R2 flat fee via Stitch Payouts. 1–2 business days.")}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c45000", boxShadow: "0 0 16px rgba(196,80,0,0.35)" }}
            >EFT</button>
            <button
              onClick={() => setWalletToast("OTT Voucher withdrawals deliver your PIN via WhatsApp. 6% service fee. Redeem at any OTT outlet.")}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/60 transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
            >OTT Voucher</button>
          </div>
        </div>
      )}

      {/* ── TAB: ACTIVITY ── */}
      {tab === "activity" && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recent tips</span>
            <span className="text-[10px] text-green-400/70 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />Live
            </span>
          </div>
          <div className="space-y-2">
            {LIVE_FEED.map((item, i) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ${
                  i === feedIdx % LIVE_FEED.length ? "ring-1 ring-accent/20" : ""
                }`}
                style={{
                  background: i === feedIdx % LIVE_FEED.length ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-accent shrink-0" style={{ background: "rgba(249,115,22,0.1)" }}>
                  {item.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-white/30">{item.job}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-green-400">+R{item.amount}</div>
                  <div className="text-[10px] text-white/20">{item.ago}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom status bar ── */}
      <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-white/30">Secured by Stitch Instant EFT</span>
        </div>
        <span className="text-[10px] text-white/20">slipatip.co.za</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04]" style={{ background: "rgba(8,8,8,0.8)", backdropFilter: "blur(24px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo/11.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
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
        <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#080808" }}>

          {/* ── Animated 3-D sun / planet background ── */}
          <HeroBackground />

          {/* ── Content sits above everything (z-10) ── */}
          <div className="relative z-10 flex-1 flex flex-col justify-center pb-10 lg:pb-14">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 lg:pt-24">
              <div className="grid lg:grid-cols-[1fr_420px] gap-6 sm:gap-8 xl:gap-12 items-end">

                {/* Left — headline fills top, text+buttons align with card bottom */}
                <div className="flex flex-col justify-end">
                  {/* Big serif headline pushes content down */}
                  <ScrollReveal>
                    <h1
                      className="font-serif-display text-white leading-none mb-6 sm:mb-8"
                      style={{
                        fontSize: "clamp(3rem, 10vw, 9.5rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 0.92,
                      }}
                    >
                      <span className="block">Cashless</span>
                      <span className="block">Tipping</span>
                    </h1>
                  </ScrollReveal>

                  <ScrollReveal delay={0.08}>
                    <p className="text-xs leading-snug max-w-[220px] mb-5 sm:hidden" style={{ color: "#888888" }}>
                      QR code → scan → tip via WhatsApp. No app needed.
                    </p>
                    <p className="text-sm leading-relaxed max-w-xs hidden sm:block" style={{ color: "#aaaaaa" }}>
                      Workers get a personal QR code. Customers scan, pick an amount,
                      and tip directly via WhatsApp. Tips land instantly.
                    </p>
                  </ScrollReveal>

                  <ScrollReveal delay={0.12}>
                    <div className="mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4">
                      <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03]"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.5)",
                          boxShadow: "0 0 0 0 transparent",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(196,80,0,0.4)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                      >
                        Start Now
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15M19.5 4.5H4.5v15" /></svg>
                      </Link>
                      <Link href="#demo" className="text-sm font-medium transition-colors" style={{ color: "#888888" }}>
                        See how it works &rarr;
                      </Link>
                    </div>
                  </ScrollReveal>

                </div>

                {/* Right — demo card */}
                <ScrollReveal delay={0.18} direction="right">
                  <HeroDemoCard />
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ===== ANIMATED DEMO ===== */}
        <section id="demo" className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-accent/20 mb-6" style={{ background: "rgba(249,115,22,0.08)" }}>
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
                    { step: "03", title: "Pay securely", desc: "Secure 3D Secure checkout via Stitch. A small total fee (up to 10%) is deducted from the tip — Stitch takes their processing fee, Slip a Tip takes the remainder." },
                  ].map((item, i) => (
                    <ScrollReveal key={item.step} delay={i * 0.12}>
                      <div className="flex gap-5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-accent ring-1 ring-accent/20" style={{ background: "rgba(249,115,22,0.08)" }}>
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
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — text */}
              <ScrollReveal>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Pricing</p>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Completely free<br />to get started</h2>
                  <p className="mt-5 text-white/40 max-w-md leading-relaxed">
                    No monthly fees. No hidden costs. Sign up, get your QR code, and start receiving tips immediately.
                    A small total fee (up to 10%) is deducted from tips to cover Stitch payment processing and the Slip a Tip platform.
                  </p>

                  <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-xs">
                    {[
                      { value: "R0", sub: "to sign up" },
                      { value: "Up to 10%", sub: "total fee on tips" },
                      { value: "0%", sub: "monthly fees" },
                    ].map((s, i) => (
                      <div key={s.sub} className="relative">
                        {i !== 0 && <div className="absolute -left-3 top-1 bottom-1 w-px bg-white/[0.08]" />}
                        <div className="text-xl sm:text-3xl font-extrabold text-white leading-tight">{s.value}</div>
                        <div className="mt-1 text-[10px] sm:text-xs text-white/35 uppercase tracking-wider">{s.sub}</div>
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
                    <div className="rounded-full px-3 py-1 text-[10px] font-semibold text-accent ring-1 ring-accent/25" style={{ background: "rgba(249,115,22,0.1)" }}>
                      Free forever
                    </div>
                  </div>

                  <div className="space-y-4 text-sm mb-8">
                    {[
                      "Personal QR code & tip page",
                      "Stitch 3D Secure checkout",
                      "Worker dashboard & wallet",
                      "Full tip history & audit trail",
                      "Withdraw via EFT (R2) or OTT Voucher (6%)",
                      "Total fees capped at 10%",
                      "No monthly fees, ever",
                      "Minimum withdrawal R20",
                    ].map((x) => (
                      <div key={x} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
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
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {[
                  { q: "Do customers need an app?", a: "No. They scan the QR code with their phone camera and tip directly in the browser. Zero friction." },
                  { q: "Is it secure?", a: "All payments are handled by Stitch (PCI-DSS compliant) with 3D Secure authentication. Slip a Tip never sees or stores card details. Liability shifts to the card issuer." },
                  { q: "How do withdrawals work?", a: "Request a withdrawal from your dashboard. Choose EFT to your bank (R2 flat fee, via Stitch Payouts) or an OTT Voucher redeemable at any OTT outlet (6% fee, PIN delivered via WhatsApp). Minimum withdrawal is R20." },
                  { q: "What does it cost?", a: "Signing up is completely free. A small total fee (up to 10%) is deducted from tips to cover Stitch payment processing and the Slip a Tip platform." },
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
                  <Image src="/logo/11.png" alt="Slip a Tip" width={64} height={64} quality={95} className="w-full h-full object-contain" />
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
                <Image src="/logo/11.png" alt="Slip a Tip" width={40} height={40} quality={95} className="h-10 w-10 object-contain" />
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
          <div className="border-t border-white/[0.06] pt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span className="text-xs text-white/40 text-center sm:text-left">&copy; {new Date().getFullYear()} <strong className="text-white/60">Slip a Tip (Pty) Ltd.</strong> All rights reserved.</span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <span className="text-[10px] text-white/15">Secured by</span>
              <span className="text-[10px] text-white/30 font-medium">Stitch</span>
              <span className="text-[10px] text-white/15">&middot;</span>
              <span className="text-[10px] text-white/30 font-medium">OTT Mobile</span>
              <span className="text-[10px] text-white/15">&middot;</span>
              <span className="text-[10px] text-white/30 font-medium">Meta</span>
              <span className="text-[10px] text-white/15">&middot;</span>
              <span className="text-[10px] text-white/15">Built in South Africa</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
