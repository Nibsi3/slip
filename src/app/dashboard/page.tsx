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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {worker.user.firstName}!
        </h1>
        <p className="text-muted mt-1">Here&apos;s your tipping overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-muted">Wallet Balance</p>
          <p className="mt-2 text-3xl font-bold text-accent">
            R{balance.toFixed(2)}
          </p>
          {balance >= 20 && (
            <Link
              href="/dashboard/withdraw"
              className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-300"
            >
              Withdraw funds
            </Link>
          )}
        </div>
        <div className="card">
          <p className="text-sm font-medium text-muted">Total Tips Received</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {worker._count.tips}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-muted">Your QR Code</p>
          <p className="mt-2 text-sm text-muted-300 font-mono truncate">
            {worker.qrCode}
          </p>
          <Link
            href="/dashboard/qr"
            className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-300"
          >
            View & download
          </Link>
        </div>
      </div>

      {/* Recent tips */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Tips</h2>
          <Link
            href="/dashboard/tips"
            className="text-sm font-medium text-accent hover:text-accent-300"
          >
            View all
          </Link>
        </div>
        {worker.tips.length === 0 ? (
          <div className="text-center py-8 text-muted-300">
            <p className="text-sm">No tips yet. Share your QR code to start receiving tips.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {worker.tips.slice(0, 5).map((tip) => (
              <div key={tip.id} className="flex items-center justify-between py-3 gap-4">
                <div>
                  <p className="font-medium text-white">
                    R{Number(tip.amount).toFixed(2)}
                  </p>
                  <p className="text-xs font-mono text-white/30">
                    {tip.paymentId}
                  </p>
                  {tip.customerMessage && (
                    <p className="text-xs text-muted mt-0.5">&ldquo;{tip.customerMessage}&rdquo;</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-accent">
                    +R{Number(tip.netAmount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-300">
                    {new Date(tip.createdAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
