"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalWorkers: number;
  activeWorkers: number;
  totalTips: number;
  completedTips: number;
  pendingWithdrawals: number;
  totalTipAmount: string | number;
  totalNetTips: string | number;
  totalPlatformFees: string | number;
  totalGatewayFees: string | number;
  totalWithdrawnAmount: string | number;
}

interface RecentTip {
  id: string;
  amount: string | number;
  netAmount: string | number;
  status: string;
  customerName?: string;
  createdAt: string;
  worker: { user: { firstName: string; lastName: string } };
}

interface RecentWithdrawal {
  id: string;
  amount: string | number;
  method: string;
  status: string;
  createdAt: string;
  worker: { user: { firstName: string; lastName: string } };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<RecentWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setRecentTips(d.recentTips || []);
        setRecentWithdrawals(d.recentWithdrawals || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-muted-300">Loading admin dashboard...</div>;
  if (!stats) return <div className="text-red-500">Failed to load dashboard data.</div>;

  const statCards = [
    { label: "Total Workers", value: stats.totalWorkers, color: "text-white" },
    { label: "Active Workers", value: stats.activeWorkers, color: "text-accent" },
    { label: "Tips Completed", value: stats.completedTips, color: "text-green-400" },
    { label: "Total Tip Volume", value: `R${Number(stats.totalTipAmount).toFixed(2)}`, color: "text-white" },
    { label: "Platform Revenue", value: `R${Number(stats.totalPlatformFees).toFixed(2)}`, color: "text-accent" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">Recent Tips</h2>
          <div className="divide-y divide-surface-100">
            {recentTips.length === 0 ? (
              <p className="text-muted-300 py-4">No tips yet</p>
            ) : (
              recentTips.map((tip) => (
                <div key={tip.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">
                      R{Number(tip.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted">
                      To: {tip.worker.user.firstName} {tip.worker.user.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-900/30 text-green-400">
                      {tip.status}
                    </span>
                    <p className="text-xs text-muted-300 mt-1">
                      {new Date(tip.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">Recent Withdrawals</h2>
          <div className="divide-y divide-surface-100">
            {recentWithdrawals.length === 0 ? (
              <p className="text-muted-300 py-4">No withdrawals yet</p>
            ) : (
              recentWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">
                      R{Number(w.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted">
                      {w.worker.user.firstName} {w.worker.user.lastName} — {w.method.replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        w.status === "COMPLETED"
                          ? "bg-green-900/30 text-green-400"
                          : w.status === "PENDING"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {w.status}
                    </span>
                    <p className="text-xs text-muted-300 mt-1">
                      {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
