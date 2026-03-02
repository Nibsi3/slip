"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace("text-", "bg-").replace("-600", "-100").replace("-700", "-100")}`}>
        <span className={color}>{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<RecentWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(new Date());

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      Failed to load dashboard data. Check your API and database connection.
    </div>
  );

  const conversionRate = stats.totalTips > 0 ? ((stats.completedTips / stats.totalTips) * 100).toFixed(1) : "0";
  const avgTip = stats.completedTips > 0 ? (Number(stats.totalTipAmount) / stats.completedTips).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/workers" className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            + Add Worker
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Tip Volume"
          value={`R${Number(stats.totalTipAmount).toFixed(2)}`}
          sub={`${stats.completedTips} completed tips`}
          color="text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="Platform Revenue"
          value={`R${Number(stats.totalPlatformFees).toFixed(2)}`}
          sub={`Avg tip: R${avgTip}`}
          color="text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
        <KpiCard
          label="Active Workers"
          value={stats.activeWorkers}
          sub={`${stats.totalWorkers} total registered`}
          color="text-violet-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <KpiCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          sub={`R${Number(stats.totalWithdrawnAmount).toFixed(2)} total paid out`}
          color={stats.pendingWithdrawals > 0 ? "text-amber-600" : "text-slate-500"}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Conversion Rate</p>
          <p className="text-xl font-bold text-slate-800">{conversionRate}%</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${conversionRate}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{stats.completedTips} of {stats.totalTips} tips completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gateway Fees Paid</p>
          <p className="text-xl font-bold text-slate-800">R{Number(stats.totalGatewayFees).toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Paid to Paystack on completed tips</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Paid to Workers</p>
          <p className="text-xl font-bold text-slate-800">R{Number(stats.totalNetTips).toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">After platform + gateway fees</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/workers", label: "Manage Workers", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
            { href: "/admin/fica", label: "Review FICA Docs", color: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200" },
            { href: "/admin/withdrawals", label: "Process Withdrawals", color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" },
            { href: "/admin/fraud", label: "Fraud Events", color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" },
            { href: "/admin/aml", label: "AML Alerts", color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" },
            { href: "/admin/settlements", label: "Clear Settlements", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
            { href: "/admin/qrcodes", label: "QR Codes", color: "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${action.color}`}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity tables */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Tips */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Recent Tips</h2>
            <Link href="/admin/tips" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTips.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No tips yet</p>
              </div>
            ) : (
              recentTips.slice(0, 8).map((tip) => (
                <div key={tip.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">R{Number(tip.amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-400 truncate">→ {tip.worker.user.firstName} {tip.worker.user.lastName}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <StatusBadge status={tip.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(tip.createdAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Recent Withdrawals</h2>
            <Link href="/admin/withdrawals" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentWithdrawals.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No withdrawals yet</p>
              </div>
            ) : (
              recentWithdrawals.slice(0, 8).map((w) => (
                <div key={w.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">R{Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-400 truncate">{w.worker.user.firstName} {w.worker.user.lastName} · {w.method.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <StatusBadge status={w.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(w.createdAt).toLocaleDateString("en-ZA")}</p>
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
