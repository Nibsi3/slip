import Link from "next/link";
import Image from "next/image";

/* ── Shared frames ── */
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

function DashFrame({ children, label, activeNav }: { children: React.ReactNode; label?: string; activeNav?: string }) {
  const navs = ["Overview", "Tips", "Withdraw", "QR Code", "Documents", "Settings", "Contact"];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[300px] h-[400px] select-none rounded-xl ring-1 ring-white/[0.1] overflow-hidden" style={{ background: "#030306", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]" style={{ background: "rgba(3,3,6,0.9)" }}>
          <Image src="/logo/11.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
          <span className="text-[8px] text-white/30 font-medium">Dashboard</span>
          <div className="ml-auto flex items-center gap-1.5"><div className="h-4 w-4 rounded-full bg-accent/15 flex items-center justify-center text-[6px] font-bold text-accent">T</div><span className="text-[7px] text-white/30">Thabo</span></div>
        </div>
        <div className="flex h-[calc(100%-32px)]">
          {/* Sidebar */}
          <div className="w-[70px] shrink-0 border-r border-white/[0.06] py-2 px-1" style={{ background: "rgba(6,6,10,0.95)" }}>
            {navs.map(n => (
              <div key={n} className={`px-1.5 py-1.5 mb-0.5 rounded text-[6px] font-medium truncate ${n === activeNav ? "bg-white/[0.08] text-white" : "text-white/30"}`}>{n}</div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden p-3">{children}</div>
        </div>
      </div>
      {label && <div className="mt-3 text-[10px] text-white/25 text-center">{label}</div>}
    </div>
  );
}

/* ── Step 1: Registration screen ── */
function RegisterScreen() {
  return (
    <PhoneFrame label="slipatip.co.za/auth/register">
      <div className="px-5 pt-4">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <Image src="/logo/11.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
          <span className="text-[8px] font-semibold text-white/50 tracking-widest uppercase">slip a tip</span>
        </div>
        <h3 className="text-xs font-bold text-white text-center mb-4">Create your account</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <div><div className="text-[6px] text-white/25 mb-0.5">First name</div><div className="h-6 rounded ring-1 ring-white/[0.08] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[8px] text-white/40">Thabo</span></div></div>
            <div><div className="text-[6px] text-white/25 mb-0.5">Last name</div><div className="h-6 rounded ring-1 ring-white/[0.08] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[8px] text-white/40">Molefe</span></div></div>
          </div>
          <div><div className="text-[6px] text-white/25 mb-0.5">Email or phone</div><div className="h-6 rounded ring-1 ring-white/[0.08] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[8px] text-white/40">thabo@email.co.za</span></div></div>
          <div><div className="text-[6px] text-white/25 mb-0.5">Password</div><div className="h-6 rounded ring-1 ring-white/[0.08] flex items-center px-2" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[8px] text-white/20">••••••••</span></div></div>
        </div>
        <div className="mt-3 w-full py-2 text-center text-[9px] font-semibold text-white rounded-lg bg-accent/90">Create Account</div>
        <p className="mt-2 text-[7px] text-white/20 text-center">Already have an account? Sign in</p>
      </div>
    </PhoneFrame>
  );
}

/* ── Step 2: QR Code ── */
function QrCodeScreen() {
  return (
    <DashFrame label="Dashboard → My QR Code" activeNav="QR Code">
      <div className="text-center">
        <div className="text-[8px] font-bold text-white mb-2">Your Personal QR Code</div>
        <div className="mx-auto w-28 h-28 rounded-lg ring-1 ring-white/10 flex items-center justify-center mb-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: 49 }).map((_, i) => (<div key={i} className="w-[5px] h-[5px] rounded-[1px]" style={{ background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,16,24,32,40,9,17,25,33,10,18,26].includes(i) ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.08)" }} />))}
          </div>
        </div>
        <div className="text-[7px] text-white/25 mb-2">slipatip.co.za/tip/thabo-m</div>
        <div className="flex gap-1 justify-center">
          <div className="px-2 py-1 rounded text-[7px] font-medium text-accent ring-1 ring-accent/20" style={{ background: "rgba(249,115,22,0.08)" }}>Download</div>
          <div className="px-2 py-1 rounded text-[7px] font-medium text-white/40 ring-1 ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>Print</div>
        </div>
        <div className="mt-3 rounded-lg p-2 ring-1 ring-accent/20 text-left" style={{ background: "rgba(249,115,22,0.04)" }}>
          <div className="text-[7px] text-accent/80 font-medium">Physical QR card</div>
          <div className="text-[6px] text-white/30 mt-0.5">Display on your lanyard, workstation, or car dashboard</div>
        </div>
      </div>
    </DashFrame>
  );
}

/* ── Step 3: Accept payments (customer scanning) ── */
function AcceptPaymentScreen() {
  return (
    <PhoneFrame label="Customer scans your QR code">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-center gap-1.5 opacity-50 mb-2">
          <Image src="/logo/11.png" alt="" width={12} height={12} className="h-3 w-3 object-contain" />
          <span className="text-[7px] font-semibold text-white/50 tracking-widest uppercase">slip a tip</span>
        </div>
        <div className="rounded-lg p-2 ring-1 ring-white/[0.08] mb-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center text-[9px] font-bold text-accent">T</div>
            <div><div className="text-[10px] font-semibold text-white">Thabo Molefe</div><div className="text-[7px] text-white/35">Waiter &middot; Cape Town Grill</div></div>
          </div>
        </div>
        <p className="text-[7px] text-white/30 uppercase tracking-wider mb-1">Select amount</p>
        <div className="grid grid-cols-3 gap-1">
          {[15,20,50,100,200].map((a,i)=>{const sel=i===2;return(<div key={a} className="py-1.5 text-center text-[9px] font-bold rounded" style={{ background: sel?"rgba(249,115,22,0.15)":"rgba(255,255,255,0.04)", color: sel?"#f97316":"rgba(255,255,255,0.35)", border: sel?"1px solid rgba(249,115,22,0.3)":"1px solid rgba(255,255,255,0.06)" }}>R{a}</div>);})}
        </div>
        <div className="mt-2 w-full py-1.5 text-center text-[9px] font-semibold text-white rounded bg-accent/90">Pay R50.00</div>
        <div className="mt-3 rounded-lg p-2 ring-1 ring-green-500/20" style={{ background: "rgba(34,197,94,0.04)" }}>
          <div className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            <span className="text-[8px] text-green-400/80 font-medium">Tip arrives in your wallet instantly</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── Step 4: Bank details ── */
function BankDetailsScreen() {
  return (
    <DashFrame label="Dashboard → Settings" activeNav="Settings">
      <div>
        <div className="text-[8px] font-bold text-white mb-2">Bank Details</div>
        <div className="space-y-1.5">
          <div><div className="text-[6px] text-white/25 mb-0.5">Bank name</div><div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/40">FNB</span></div></div>
          <div><div className="text-[6px] text-white/25 mb-0.5">Account number</div><div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/40">62••••••89</span></div></div>
          <div><div className="text-[6px] text-white/25 mb-0.5">Branch code</div><div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/40">250655</span></div></div>
          <div className="pt-1 border-t border-white/[0.06]">
            <div className="text-[6px] text-white/25 mb-0.5">Phone for Instant Money</div>
            <div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/40">071 234 5678</span></div>
          </div>
        </div>
        <div className="mt-2 w-full py-1.5 text-center text-[7px] font-semibold text-white rounded bg-accent/90">Save Settings</div>
        <div className="mt-1.5 flex items-center gap-1"><svg className="h-2.5 w-2.5 text-green-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg><span className="text-[6px] text-white/20">Encrypted &amp; secure</span></div>
      </div>
    </DashFrame>
  );
}

/* ── Step 5: Documents upload ── */
function DocumentsScreen() {
  return (
    <DashFrame label="Dashboard → Documents" activeNav="Documents">
      <div>
        <div className="text-[8px] font-bold text-white mb-1">Documents</div>
        <div className="text-[6px] text-white/30 mb-2">Upload for FICA verification</div>
        <div className="space-y-1.5">
          {[{name: "SA ID Document", status: "uploaded"}, {name: "Proof of Address", status: "uploaded"}, {name: "Selfie", status: "pending"}].map(d => (
            <div key={d.name} className="rounded-lg p-2 ring-1 ring-white/[0.07] flex items-center justify-between" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-white/25" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span className="text-[7px] text-white/50">{d.name}</span>
              </div>
              {d.status === "uploaded" ? (
                <span className="text-[6px] text-green-400 font-medium">Selected</span>
              ) : (
                <span className="text-[6px] text-white/20">Choose file...</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 w-full py-1.5 text-center text-[7px] font-semibold text-white rounded bg-accent/80">Upload Documents</div>
        <div className="mt-2 rounded-lg p-1.5 ring-1 ring-accent/20" style={{ background: "rgba(249,115,22,0.04)" }}>
          <div className="text-[6px] text-white/40"><strong className="text-white/60">Tip:</strong> You can accept tips now — documents are only needed before withdrawal.</div>
        </div>
      </div>
    </DashFrame>
  );
}

/* ── Step 6: Withdraw ── */
function WithdrawScreen() {
  return (
    <DashFrame label="Dashboard → Withdraw" activeNav="Withdraw">
      <div>
        <div className="text-[8px] font-bold text-white mb-1">Withdraw Funds</div>
        <div className="rounded-lg p-2 ring-1 ring-white/[0.07] mb-2" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="text-[6px] text-white/25">Available balance</div>
          <div className="text-base font-extrabold text-white">R 1,245<span className="text-[10px] text-white/40">.50</span></div>
        </div>
        <div className="space-y-1.5">
          <div><div className="text-[6px] text-white/25 mb-0.5">Amount</div><div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/50">R 500.00</span></div></div>
          <div>
            <div className="text-[6px] text-white/25 mb-0.5">Method</div>
            <div className="flex gap-1">
              <div className="flex-1 py-1 text-center text-[7px] font-medium text-accent rounded ring-1 ring-accent/30" style={{ background: "rgba(249,115,22,0.1)" }}>Instant Money</div>
              <div className="flex-1 py-1 text-center text-[7px] text-white/30 rounded ring-1 ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>EFT</div>
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[6px] text-white/25">
          <span>Fee (10%)</span><span className="text-white/40">-R 50.00</span>
        </div>
        <div className="flex items-center justify-between text-[6px]">
          <span className="text-white/25">You receive</span><span className="text-white font-bold">R 450.00</span>
        </div>
        <div className="mt-2 w-full py-1.5 text-center text-[7px] font-semibold text-white rounded bg-accent/90">Withdraw R 500.00</div>
      </div>
    </DashFrame>
  );
}

/* ── Step 7: Earnings overview ── */
function EarningsScreen() {
  return (
    <DashFrame label="Dashboard → Overview" activeNav="Overview">
      <div>
        <div className="text-[8px] font-bold text-white mb-2">Overview</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="rounded-lg p-1.5 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="text-[5px] text-white/25">Total Balance</div>
            <div className="text-[11px] font-extrabold text-white">R 1,245.50</div>
          </div>
          <div className="rounded-lg p-1.5 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="text-[5px] text-white/25">Available</div>
            <div className="text-[11px] font-extrabold text-green-400">R 980.00</div>
          </div>
        </div>
        <div className="text-[6px] text-white/25 mb-1">Recent Tips</div>
        {[{name:"Sarah J.", amt:"+R 50.00", time:"2m ago"},{name:"Mike T.", amt:"+R 100.00", time:"1h ago"},{name:"Lisa K.", amt:"+R 20.00", time:"3h ago"},{name:"John D.", amt:"+R 200.00", time:"Yesterday"}].map(t=>(
          <div key={t.name} className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center text-[6px] font-bold text-accent">{t.name[0]}</div>
              <div><div className="text-[7px] text-white/50">{t.name}</div><div className="text-[5px] text-white/20">{t.time}</div></div>
            </div>
            <span className="text-[7px] font-bold text-green-400">{t.amt}</span>
          </div>
        ))}
      </div>
    </DashFrame>
  );
}

/* ── Step 8: Contact support ── */
function ContactScreen() {
  return (
    <DashFrame label="Dashboard → Contact Us" activeNav="Contact">
      <div>
        <div className="text-[8px] font-bold text-white mb-2">Contact Support</div>
        <div className="space-y-1.5">
          <div><div className="text-[6px] text-white/25 mb-0.5">Subject</div><div className="h-5 rounded ring-1 ring-white/[0.08] flex items-center px-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/40">QR code issue</span></div></div>
          <div><div className="text-[6px] text-white/25 mb-0.5">Message</div><div className="h-16 rounded ring-1 ring-white/[0.08] p-1.5" style={{ background: "rgba(255,255,255,0.02)" }}><span className="text-[7px] text-white/30">Hi, I need a replacement QR code...</span></div></div>
        </div>
        <div className="mt-2 w-full py-1.5 text-center text-[7px] font-semibold text-white rounded bg-accent/90">Send Message</div>
        <div className="mt-2 rounded-lg p-1.5 ring-1 ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="text-[6px] text-white/40">We typically respond within <strong className="text-white/60">24 hours</strong>.</div>
        </div>
      </div>
    </DashFrame>
  );
}

const visuals = [
  <RegisterScreen key="w1" />, <QrCodeScreen key="w2" />, <AcceptPaymentScreen key="w3" />,
  <BankDetailsScreen key="w4" />, <DocumentsScreen key="w5" />, <WithdrawScreen key="w6" />,
  <EarningsScreen key="w7" />, <ContactScreen key="w8" />,
];

const stepData = [
  { num: "01", title: "Create Your Account", items: ['Go to slipatip.co.za and click "Get Started"', "Enter your first name, last name, email or phone number, and create a password", "You're registered — it takes less than 60 seconds", "You can start accepting tips immediately after sign-up"] },
  { num: "02", title: "Receive Your QR Code", items: ["Once registered, Slip a Tip will arrange a physical QR code for you", "You'll receive a durable, laminated QR code card in person", "Activate it by scanning it with your phone — it links to your personal tip page", "You can also view and download your QR code from your dashboard", "Display it on your lanyard, at your workstation, or on your car dashboard"] },
  { num: "03", title: "Accept Payments", items: ["When a customer wants to tip you, they scan your QR code with their phone camera", "They don't need to download any app — it opens directly in their browser", "They pick an amount (R15, R20, R50, R100, or R200)", "They pay securely with a bank card via Stitch (3D Secure)", "You get a notification and the tip appears in your digital wallet instantly"] },
  { num: "04", title: "Add Your Bank Details", items: ["Go to Dashboard → Settings", "Enter your bank name, account number, and branch code", "Or add your WhatsApp number for OTT Voucher withdrawals", "Your bank details are stored securely and encrypted", "You can update them at any time from your dashboard"] },
  { num: "05", title: "Upload Your Documents (FICA)", items: ["Go to Dashboard → Documents", "Upload a photo of your South African ID (front and back)", "Upload proof of address (utility bill, bank statement, or lease — less than 3 months old)", "Take and upload a selfie for identity verification", "You do NOT need to upload documents to start accepting tips", "However, you MUST be verified before you can withdraw funds", "An admin will manually review and approve your documents"] },
  { num: "06", title: "Withdraw Your Tips", items: ["Go to Dashboard → Withdraw", "Choose EFT to your bank account (R2 flat fee, via Stitch Payouts, 1\u20132 business days) OR OTT Voucher (6% fee \u2014 PIN delivered via WhatsApp, redeem at any OTT outlet)", "Minimum withdrawal is R20", "The 10% tip fee (Stitch + platform) was already deducted when the tip was paid", "Funds have a 72-hour cooldown before they become available"] },
  { num: "07", title: "Track Your Earnings", items: ["Dashboard → Overview shows your total balance, available balance, and recent tips", "Dashboard → Tips shows a full history of every tip with dates and amounts", "Dashboard → Withdraw shows your withdrawal history", "All transactions are fully auditable and transparent"] },
  { num: "08", title: "Contact Support", items: ["Go to Dashboard → Contact Us to send a message to the Slip a Tip team", "We typically respond within 24 hours", "You can also reach us via the contact page on the website"] },
];

const faqs = [
  { q: "Do I need to pay anything to sign up?", a: "No. Creating an account and receiving tips is completely free. A total 10% fee is deducted from tips (covers Stitch payment processing + Slip a Tip platform). Withdrawals have a small fee: R2 flat for EFT, 6% for OTT Voucher." },
  { q: "Do I need a smartphone?", a: "You only need a phone to register and manage your dashboard. Customers scan your physical QR code — you don't need your phone for that." },
  { q: "Can I start receiving tips before uploading documents?", a: "Yes! You can accept tips immediately. However, you must complete document verification before making any withdrawals." },
  { q: "How long does document verification take?", a: "Typically 1–2 business days. You'll be notified via your dashboard once approved." },
  { q: "What happens if my documents are rejected?", a: "You'll be told the reason and can re-upload corrected documents from Dashboard → Documents." },
  { q: "Is my bank information safe?", a: "Yes. All data is encrypted and stored securely. Payments are processed by Stitch (PCI-DSS compliant)." },
  { q: "How fast do tips arrive in my wallet?", a: "Tips appear instantly. However, there is a 72-hour cooldown before funds are available for withdrawal (fraud protection)." },
  { q: "What is an OTT Voucher?", a: "OTT Voucher lets you collect cash at any OTT outlet. After your withdrawal is processed, you receive a PIN via WhatsApp. Redeem it at any participating OTT retailer." },
  { q: "Can I have multiple QR codes?", a: "Each worker gets one personal QR code linked to their account. If you lose it, contact support for a replacement." },
  { q: "What if a customer tips the wrong person?", a: "Tips cannot be reversed once completed. The customer should contact their bank for a chargeback if it was genuinely in error." },
];

export default function WorkerGuidePage() {
  return (
    <div className="min-h-screen" style={{ background: "#030306" }}>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: "rgba(3,3,6,0.75)", backdropFilter: "blur(24px)" }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo/11.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/guide/customers" className="hidden sm:inline-flex text-xs text-white/40 hover:text-white transition-colors">Customer Guide</Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">&larr; Home</Link>
            <Link href="/auth/register" className="btn-primary !py-2 !px-4 !text-xs">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Title */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/[0.12] mb-6" style={{ background: "rgba(249,115,22,0.07)" }}>
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              Worker Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Getting Started as a Worker</h1>
            <p className="mt-4 text-white/40 max-w-lg mx-auto leading-relaxed">
              Everything you need to know — from signing up to withdrawing your first tips. Follow these steps and you&rsquo;ll be accepting digital tips in minutes.
            </p>
          </div>

          {/* Steps with visuals */}
          <div className="space-y-20">
            {stepData.map((s, i) => (
              <div key={s.num} className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-14 items-center`}>
                {/* Visual */}
                <div className="shrink-0">{visuals[i]}</div>
                {/* Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-accent ring-1 ring-accent/20 shrink-0" style={{ background: "rgba(249,115,22,0.08)" }}>{s.num}</div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">{s.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <svg className="h-4 w-4 text-accent/60 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        <span className="text-sm text-white/50 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-24">
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

          {/* CTA */}
          <div className="mt-20 text-center">
            <div className="rounded-2xl p-10 ring-1 ring-white/[0.09]" style={{ background: "rgba(8,8,14,0.8)", backdropFilter: "blur(24px)" }}>
              <h3 className="text-2xl font-extrabold text-white">Ready to start earning tips?</h3>
              <p className="mt-3 text-sm text-white/40">Create your free account and get your personal QR code in minutes.</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/register" className="btn-primary !py-3.5 !px-8 text-sm">Create your account</Link>
                <Link href="/apply" className="btn-secondary !py-3.5 !px-8 text-sm">Apply as a worker</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
