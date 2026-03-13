"use client";

import Link from "next/link";
import { useWorker } from "./WorkerContext";

export default function DashboardPage() {
  const { worker, loading } = useWorker();

  if (loading) {
    return <div className="animate-pulse text-muted-300">Loading dashboard...</div>;
  }

  if (!worker) {
    return <div className="text-red-500">Failed to load dashboard data.</div>;
  }

  const balance = Number(worker.walletBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {worker.user.firstName}
          </h1>
          <p className="text-sm text-muted mt-0.5">Here&apos;s your tipping overview</p>
        </div>
        <Link href="/dashboard/qr" className="btn-secondary !py-2 !px-4 !text-xs hidden sm:inline-flex">
          My QR Code
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Balance — featured */}
        <div className="card-glow sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Wallet Balance</p>
          <p className="mt-3 text-4xl font-extrabold text-white">
            R<span>{balance.toFixed(2)}</span>
          </p>
          {balance >= 100 ? (
            <Link href="/dashboard/withdraw" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-300 transition-colors">
              Withdraw funds
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          ) : (
            <p className="mt-3 text-xs text-muted-300">Min. R100 to withdraw</p>
          )}
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Total Tips</p>
          <p className="mt-3 text-4xl font-extrabold text-white">{worker._count.tips}</p>
          <Link href="/dashboard/tips" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-300 transition-colors">
            View history
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Your QR Code</p>
          <p className="mt-3 text-sm text-muted-300 font-mono truncate">{worker.qrCode}</p>
          <Link href="/dashboard/qr" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-300 transition-colors">
            View &amp; download
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>

      {/* Recent tips */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Recent Tips</h2>
          <Link href="/dashboard/tips" className="text-xs font-medium text-accent hover:text-accent-300 transition-colors">
            View all
          </Link>
        </div>
        {worker.tips.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/8 flex items-center justify-center mb-3" style={{ background: "rgba(20,167,249,0.08)" }}>
              <svg className="h-6 w-6 text-accent/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/50 font-medium">No tips yet</p>
            <p className="text-xs text-muted-300 mt-1">Share your QR code to start receiving tips.</p>
            <Link href="/dashboard/qr" className="mt-4 inline-flex btn-primary !py-2 !px-5 !text-xs">Get my QR code</Link>
          </div>
        ) : (
          <div className="space-y-1">
            {worker.tips.slice(0, 5).map((tip) => (
              <div key={tip.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">R{Number(tip.amount).toFixed(2)}</p>
                    {tip.customerMessage ? (
                      <p className="text-xs text-muted truncate">&ldquo;{tip.customerMessage}&rdquo;</p>
                    ) : (
                      <p className="text-xs text-muted-300 font-mono truncate">{tip.paymentId}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-400">+R{Number(tip.netAmount).toFixed(2)}</p>
                  <p className="text-xs text-muted-300">{new Date(tip.createdAt).toLocaleDateString("en-ZA")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
