"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const STEPS = [
  { id: 1, title: "Scan the QR Code", sub: "Customer opens their camera", desc: "No app needed — just point and scan. The QR links directly to the worker's personal tip page." },
  { id: 2, title: "Choose a Tip", sub: "Quick amounts or custom value", desc: "Pick R10, R20, R50, R100, R200 — or enter a custom amount. Fast and frictionless." },
  { id: 3, title: "Pay Securely", sub: "3D Secure via Paystack", desc: "Card details handled by Paystack (PCI-DSS Level 1). Slip a Tip never sees your card." },
  { id: 4, title: "Worker Gets Paid", sub: "Tip lands in their wallet", desc: "90% goes to the worker instantly. They withdraw via Instant Money or EFT anytime." },
];

function DemoPhone({ step, progress }: { step: number; progress: number }) {
  const bgs = [
    "linear-gradient(135deg,#0a0a12,#111128)",
    "linear-gradient(135deg,#0a0a12,#0d1a2a)",
    "linear-gradient(135deg,#0a0a12,#0a1a18)",
    "linear-gradient(135deg,#0a0a12,#1a1a0a)",
  ];
  return (
    <div className="relative w-[260px] sm:w-[280px] h-[520px] sm:h-[560px] mx-auto select-none">
      <div
        className="absolute inset-0 rounded-[36px] ring-1 ring-white/[0.12] overflow-hidden"
        style={{
          background: bgs[step - 1],
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-20" />

        {/* Status bar */}
        <div className="relative z-10 flex items-center justify-between px-7 pt-7 pb-1">
          <span className="text-[9px] text-white/40 font-medium">13:51</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
              <div className="absolute inset-[1px] rounded-[1px] bg-green-400" style={{ width: "75%" }} />
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="relative z-10 flex items-center justify-center px-6 pt-1 pb-3">
          <div className="flex items-center gap-1.5 opacity-50">
            <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
            <span className="text-[9px] font-semibold text-white/50 tracking-widest uppercase">slip a tip</span>
          </div>
        </div>

        {/* Step 1 — QR Scan */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-7 transition-all duration-700 ease-in-out"
          style={{
            opacity: step === 1 ? 1 : 0,
            transform: step === 1 ? "translateY(0) scale(1)" : step > 1 ? "translateY(-30px) scale(0.96)" : "translateY(30px) scale(0.96)",
            pointerEvents: step === 1 ? "auto" : "none",
          }}
        >
          <div className="mt-8" />
          <div
            className="relative w-40 h-40 rounded-2xl overflow-hidden ring-1 ring-white/10"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-accent rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-accent rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-accent rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-accent rounded-br-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-1 opacity-25">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background: [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 23, 24].includes(i)
                        ? "white"
                        : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              className="absolute left-3 right-3 h-0.5 bg-accent/70 rounded-full"
              style={{
                top: `${25 + (progress % 100) * 0.5}%`,
                boxShadow: "0 0 14px rgba(20,167,249,0.6)",
                transition: "top 0.15s linear",
              }}
            />
          </div>
          <p className="mt-5 text-[11px] text-white/40 text-center">Point camera at QR code</p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400/70">Detecting...</span>
          </div>
        </div>

        {/* Step 2 — Amount */}
        <div
          className="absolute inset-0 flex flex-col px-5 transition-all duration-700 ease-in-out"
          style={{
            opacity: step === 2 ? 1 : 0,
            transform: step === 2 ? "translateY(0) scale(1)" : step > 2 ? "translateY(-30px) scale(0.96)" : "translateY(30px) scale(0.96)",
            pointerEvents: step === 2 ? "auto" : "none",
          }}
        >
          <div className="mt-20" />
          <div className="rounded-xl p-3 ring-1 ring-white/[0.08] mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">T</div>
              <div>
                <div className="text-xs font-semibold text-white">Thabo Molefe</div>
                <div className="text-[9px] text-white/35">Waiter &middot; Cape Town Grill</div>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Select amount</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[10, 20, 50, 100, 200].map((a, i) => {
              const sel = i === 2;
              return (
                <div
                  key={a}
                  className="py-2.5 text-center text-xs font-bold rounded-lg transition-all duration-500"
                  style={{
                    background: sel ? "rgba(20,167,249,0.15)" : "rgba(255,255,255,0.04)",
                    color: sel ? "#14a7f9" : "rgba(255,255,255,0.35)",
                    border: sel ? "1px solid rgba(20,167,249,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    transform: sel ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  R{a}
                </div>
              );
            })}
            <div
              className="py-2.5 text-center text-xs rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Custom
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-white/30">Total</span>
            <span className="text-base font-extrabold text-white">R50.00</span>
          </div>
          <div className="mt-3 w-full py-2.5 text-center text-xs font-semibold text-white rounded-xl bg-accent/90">
            Pay R50.00
          </div>
        </div>

        {/* Step 3 — Payment */}
        <div
          className="absolute inset-0 flex flex-col items-center px-5 transition-all duration-700 ease-in-out"
          style={{
            opacity: step === 3 ? 1 : 0,
            transform: step === 3 ? "translateY(0) scale(1)" : step > 3 ? "translateY(-30px) scale(0.96)" : "translateY(30px) scale(0.96)",
            pointerEvents: step === 3 ? "auto" : "none",
          }}
        >
          <div className="mt-24" />
          <div className="w-full rounded-xl p-4 ring-1 ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[10px] font-semibold text-green-400/80">Secure Checkout</span>
            </div>
            <div className="space-y-2">
              <div className="h-8 rounded-lg ring-1 ring-white/[0.06] flex items-center px-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[10px] text-white/20">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-8 rounded-lg ring-1 ring-white/[0.06] flex items-center px-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[10px] text-white/20">12/28</span>
                </div>
                <div className="h-8 rounded-lg ring-1 ring-white/[0.06] flex items-center px-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[10px] text-white/20">&bull;&bull;&bull;</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center text-[9px] text-white/20">Powered by Paystack &middot; 3D Secure</div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <div className="relative h-4 w-4">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
              <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
            <span className="text-[10px] text-accent/70">Authenticating...</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3 text-green-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              <span className="text-[8px] text-white/25">PCI-DSS</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3 text-green-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              <span className="text-[8px] text-white/25">3D Secure</span>
            </div>
          </div>
        </div>

        {/* Step 4 — Success */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-7 transition-all duration-700 ease-in-out"
          style={{
            opacity: step === 4 ? 1 : 0,
            transform: step === 4 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
            pointerEvents: step === 4 ? "auto" : "none",
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(34,197,94,0.1)", boxShadow: "0 0 40px rgba(34,197,94,0.15)" }}
          >
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">Tip Sent!</h3>
          <p className="mt-1 text-[10px] text-white/35 text-center">R50.00 sent to Thabo</p>
          <div className="mt-5 w-full rounded-xl p-3.5 ring-1 ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Thabo&rsquo;s Wallet</div>
            <div className="flex items-end gap-1.5">
              <span className="text-xl font-extrabold text-white">R45.00</span>
              <span className="text-[9px] text-white/25 mb-0.5">after 10% fee</span>
            </div>
            <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full bg-green-400/60" style={{ width: "45%", transition: "width 1.5s ease" }} />
            </div>
            <div className="mt-1.5 text-[8px] text-white/20">Withdrawal available after 72hr cooldown</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnimatedDemo() {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const DURATION = 4200;

  const next = useCallback(() => {
    setStep((s) => (s >= 4 ? 1 : s + 1));
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 100 / (DURATION / 50);
      });
    }, 50);
    return () => clearInterval(iv);
  }, [isPlaying, next]);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-center">
      <div>
        {/* Progress bars */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStep(s.id);
                setProgress(0);
              }}
              className="flex-1 group"
            >
              <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    background: step >= s.id ? "#14a7f9" : "transparent",
                    width: step > s.id ? "100%" : step === s.id ? `${progress}%` : "0%",
                  }}
                />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium transition-colors ${
                  step === s.id ? "text-accent" : "text-white/25 group-hover:text-white/40"
                }`}
              >
                Step {s.id}
              </span>
            </button>
          ))}
        </div>

        {/* Step info */}
        <div className="relative min-h-[140px]">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className="transition-all duration-500"
              style={{
                opacity: step === s.id ? 1 : 0,
                transform: step === s.id ? "translateY(0)" : "translateY(8px)",
                position: step === s.id ? "relative" : "absolute",
                pointerEvents: step === s.id ? "auto" : "none",
              }}
            >
              {step === s.id && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-accent"
                      style={{ background: "rgba(20,167,249,0.1)" }}
                    >
                      {s.id}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">{s.title}</h3>
                      <p className="text-xs text-accent/60">{s.sub}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed max-w-md">{s.desc}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-9 w-9 rounded-full ring-1 ring-white/10 flex items-center justify-center hover:ring-accent/30 transition-all"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {isPlaying ? (
              <svg className="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-white/60 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              setStep(1);
              setProgress(0);
            }}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Restart
          </button>
          <span className="ml-auto text-[10px] text-white/20">{step}/4</span>
        </div>
      </div>

      {/* Phone */}
      <div className="flex justify-center lg:justify-end">
        <DemoPhone step={step} progress={progress} />
      </div>
    </div>
  );
}
