import Link from "next/link";
import Image from "next/image";

/* ── Shared phone frame ── */
function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[220px] h-[420px] select-none">
        <div className="absolute inset-0 rounded-[28px] ring-1 ring-white/[0.12] overflow-hidden" style={{ background: "linear-gradient(135deg,#0a0a12,#111128)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-lg z-20" />
          <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-0.5">
            <span className="text-[8px] text-white/40 font-medium">14:11</span>
            <div className="flex items-center gap-1"><div className="w-2.5 h-1.5 rounded-sm border border-white/30 relative"><div className="absolute inset-[1px] rounded-[1px] bg-green-400" style={{ width: "75%" }} /></div></div>
          </div>
          {children}
        </div>
      </div>
      {label && <div className="mt-3 text-[10px] text-white/25 text-center">{label}</div>}
    </div>
  );
}

/* ── Step visuals (what the customer sees on their phone) ── */
function CameraScreen() {
  return (
    <PhoneFrame label="Your phone camera">
      <div className="flex flex-col items-center justify-center h-[340px] px-5">
        <div className="w-full h-44 rounded-xl overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-28 h-28">
              <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-white/30 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-white/30 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-white/30 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-white/30 rounded-br-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-white/15" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 w-12 h-12 rounded-full ring-2 ring-white/20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/10" />
        </div>
        <p className="mt-3 text-[9px] text-white/30 text-center">Open your normal camera app</p>
      </div>
    </PhoneFrame>
  );
}

function QrScanScreen() {
  return (
    <PhoneFrame label="Scanning the QR code">
      <div className="flex flex-col items-center justify-center h-[340px] px-5">
        <div className="relative w-36 h-36 rounded-xl overflow-hidden ring-1 ring-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="absolute top-1.5 left-1.5 w-4 h-4 border-l-2 border-t-2 border-accent rounded-tl-md" />
          <div className="absolute top-1.5 right-1.5 w-4 h-4 border-r-2 border-t-2 border-accent rounded-tr-md" />
          <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-l-2 border-b-2 border-accent rounded-bl-md" />
          <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-r-2 border-b-2 border-accent rounded-br-md" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-0.5 opacity-25">{Array.from({ length: 25 }).map((_, i) => (<div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: [0,1,2,4,5,6,10,12,14,18,20,22,23,24].includes(i) ? "white" : "transparent" }} />))}</div>
          </div>
          <div className="absolute left-2 right-2 h-0.5 bg-accent/70 rounded-full top-[45%]" style={{ boxShadow: "0 0 10px rgba(249,115,22,0.5)" }} />
        </div>
        <div className="mt-4 w-full rounded-xl px-3 py-2.5 ring-1 ring-accent/30 flex items-center gap-2" style={{ background: "rgba(249,115,22,0.08)" }}>
          <svg className="h-3.5 w-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.576a4.5 4.5 0 00-6.364-6.364L4.5 8.25" /></svg>
          <span className="text-[9px] text-accent truncate">slipatip.co.za/tip/thabo-m...</span>
        </div>
        <p className="mt-2 text-[9px] text-white/30 text-center">Tap the link that appears</p>
      </div>
    </PhoneFrame>
  );
}

function AmountScreen() {
  return (
    <PhoneFrame label="Worker's tip page">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-center gap-1.5 opacity-50 mb-3">
          <Image src="/logo/11.png" alt="" width={12} height={12} className="h-3 w-3 object-contain" />
          <span className="text-[7px] font-semibold text-white/50 tracking-widest uppercase">slip a tip</span>
        </div>
        <div className="rounded-lg p-2.5 ring-1 ring-white/[0.08] mb-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center text-[9px] font-bold text-accent">T</div>
            <div><div className="text-[10px] font-semibold text-white">Thabo Molefe</div><div className="text-[7px] text-white/35">Waiter &middot; Cape Town Grill</div></div>
          </div>
        </div>
        <p className="text-[7px] text-white/30 uppercase tracking-wider mb-1.5">Select amount</p>
        <div className="grid grid-cols-3 gap-1">
          {[15,20,50,100,200].map((a,i)=>{const sel=i===2;return(<div key={a} className="py-2 text-center text-[10px] font-bold rounded-md" style={{ background: sel?"rgba(249,115,22,0.15)":"rgba(255,255,255,0.04)", color: sel?"#f97316":"rgba(255,255,255,0.35)", border: sel?"1px solid rgba(249,115,22,0.3)":"1px solid rgba(255,255,255,0.06)", transform: sel?"scale(1.04)":"scale(1)" }}>R{a}</div>);})}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[8px] text-white/30">Total</span>
          <span className="text-sm font-extrabold text-white">R50.00</span>
        </div>
        <div className="mt-2 w-full py-2 text-center text-[10px] font-semibold text-white rounded-lg bg-accent/90">Pay R50.00</div>
      </div>
    </PhoneFrame>
  );
}

function PaymentScreen() {
  return (
    <PhoneFrame label="Stitch secure checkout">
      <div className="px-4 pt-6">
        <div className="w-full rounded-lg p-3.5 ring-1 ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            <span className="text-[9px] font-semibold text-green-400/80">Secure Checkout</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="text-[7px] text-white/25 mb-0.5">Card number</div>
              <div className="h-7 rounded ring-1 ring-white/[0.06] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[9px] text-white/30">4242 •••• •••• ••••</span></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <div className="text-[7px] text-white/25 mb-0.5">Expiry</div>
                <div className="h-7 rounded ring-1 ring-white/[0.06] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[9px] text-white/30">12 / 28</span></div>
              </div>
              <div>
                <div className="text-[7px] text-white/25 mb-0.5">CVV</div>
                <div className="h-7 rounded ring-1 ring-white/[0.06] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[9px] text-white/30">•••</span></div>
              </div>
            </div>
          </div>
          <div className="mt-3 w-full py-2 text-center text-[9px] font-semibold text-white rounded-md bg-green-500/80">Pay R50.00</div>
          <div className="mt-2 text-center text-[7px] text-white/20">Powered by Stitch &middot; 3D Secure</div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1"><svg className="h-3 w-3 text-green-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg><span className="text-[7px] text-white/25">PCI-DSS L1</span></div>
          <div className="flex items-center gap-1"><svg className="h-3 w-3 text-green-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg><span className="text-[7px] text-white/25">3D Secure</span></div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function SuccessScreen() {
  return (
    <PhoneFrame label="Confirmation screen">
      <div className="flex flex-col items-center justify-center h-[340px] px-5">
        <div className="h-14 w-14 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(34,197,94,0.1)", boxShadow: "0 0 30px rgba(34,197,94,0.15)" }}>
          <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h3 className="text-sm font-bold text-white">Tip Sent!</h3>
        <p className="mt-0.5 text-[9px] text-white/35 text-center">R50.00 sent to Thabo Molefe</p>
        <div className="mt-4 w-full rounded-lg p-3 ring-1 ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] text-white/30">Amount</span>
            <span className="text-[10px] font-bold text-white">R50.00</span>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] text-white/30">Worker</span>
            <span className="text-[10px] text-white/60">Thabo Molefe</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-white/30">Status</span>
            <span className="text-[10px] text-green-400 font-semibold">Completed</span>
          </div>
        </div>
        <p className="mt-3 text-[8px] text-white/20 text-center">Thank you for tipping!</p>
      </div>
    </PhoneFrame>
  );
}

const visuals = [<CameraScreen key="c1" />, <QrScanScreen key="c2" />, <AmountScreen key="c3" />, <PaymentScreen key="c4" />, <SuccessScreen key="c5" />];

const stepData = [
  { num: "01", title: "Open Your Camera", desc: "Use your phone's built-in camera app. No need to download anything — works on iPhone and Android." },
  { num: "02", title: "Scan the QR Code", desc: "Point your camera at the worker's QR code. A link will pop up — tap it. It opens their personal tip page in your browser." },
  { num: "03", title: "Choose an Amount", desc: "Tap a quick amount — R15, R20, R50, R100, or R200. You'll see the worker's name and employer so you know it's the right person." },
  { num: "04", title: "Enter Card Details", desc: "Enter your bank card number, expiry date, and CVV. All card data is handled by Stitch — Slip a Tip never sees or stores your card. Payment is secured with 3D Secure authentication via your banking app." },
  { num: "05", title: "Done! Tip Sent", desc: "That's it. The worker receives your tip instantly in their digital wallet. You'll see a confirmation screen. The whole process takes about 30 seconds." },
];

const faqs = [
  { q: "Do I need to download an app?", a: "No. You scan the QR code with your normal phone camera and the tip page opens in your browser. No app required." },
  { q: "Is my card information safe?", a: "Yes. All payment processing is handled by Stitch (PCI-DSS compliant). Slip a Tip never sees or stores your card details. Payments are authenticated with 3D Secure through your bank." },
  { q: "Can I tip using EFT or e-wallet?", a: "Currently we support bank card payments only (Visa, Mastercard). This ensures instant delivery to the worker." },
  { q: "Do I need to create an account?", a: "No. Customers don't need an account. You just scan, tap, pay, and go." },
  { q: "What payment amounts can I choose?", a: "Quick amounts of R15, R20, R50, R100, and R200 are available." },
  { q: "Can I get a receipt?", a: "You'll see a confirmation page after payment. Your bank statement will also show the transaction." },
  { q: "What if I tipped the wrong person?", a: "Tips are non-refundable once completed. If there was an error, please contact your bank directly for a chargeback." },
  { q: "Does the full tip go to the worker?", a: "90% of your tip goes directly to the worker. A total 10% fee (Stitch processing + Slip a Tip platform) is deducted from the tip at the time of payment." },
];

export default function CustomerGuidePage() {
  return (
    <div className="min-h-screen" style={{ background: "#030306" }}>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: "rgba(3,3,6,0.75)", backdropFilter: "blur(24px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo/11.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/guide/workers" className="hidden sm:inline-flex text-xs text-white/40 hover:text-white transition-colors">Worker Guide</Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">&larr; Home</Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Title */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/[0.12] mb-6" style={{ background: "rgba(34,197,94,0.07)" }}>
              <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              Customer Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">How to Tip a Worker</h1>
            <p className="mt-4 text-white/40 max-w-lg mx-auto leading-relaxed">
              Tipping takes about 30 seconds. No app download, no account, no sign-up. Just scan, tap, and pay.
            </p>
          </div>

          {/* Steps with visuals */}
          <div className="space-y-16">
            {stepData.map((s, i) => (
              <div key={s.num} className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-14 items-center`}>
                {/* Phone visual */}
                <div className="shrink-0">{visuals[i]}</div>
                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-accent ring-1 ring-accent/20" style={{ background: "rgba(249,115,22,0.08)" }}>{s.num}</div>
                    <span className="text-[10px] font-bold text-accent/40 uppercase tracking-wider">Step {s.num}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{s.title}</h2>
                  <p className="mt-3 text-sm text-white/45 leading-relaxed max-w-md">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security callout */}
          <div className="mt-20 rounded-2xl p-6 sm:p-8 ring-1 ring-green-500/20" style={{ background: "rgba(34,197,94,0.04)" }}>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Your payment is secure</h3>
                <p className="mt-2 text-sm text-white/40 leading-relaxed">
                  All payments are processed by <strong className="text-white/60">Stitch</strong>, a PCI-DSS compliant South African payment provider. Your card details are never shared with Slip a Tip. Every transaction is authenticated with <strong className="text-white/60">3D Secure</strong> through your bank.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Frequently Asked Questions</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl p-5 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <div className="text-sm font-semibold text-white">{f.q}</div>
                  <div className="mt-2 text-xs text-white/40 leading-relaxed">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
