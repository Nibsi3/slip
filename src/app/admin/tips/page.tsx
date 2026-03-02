"use client";

import { useState, useEffect, useMemo } from "react";

interface TipItem {
  id: string;
  amount: string | number;
  netAmount: string | number;
  feePlatform: string | number;
  feeGateway: string | number;
  status: string;
  customerName?: string;
  paymentId: string;
  createdAt: string;
  worker: { user: { firstName: string; lastName: string } };
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function AdminTipsPage() {
  const [tips, setTips] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setTips(d.recentTips || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tips.filter((t) => {
      const name = `${t.worker.user.firstName} ${t.worker.user.lastName} ${t.customerName || ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || t.paymentId.includes(search);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tips, search, statusFilter]);

  const totalVolume = filtered.reduce((s, t) => s + Number(t.amount), 0);
  const totalNet = filtered.reduce((s, t) => s + Number(t.netAmount), 0);
  const totalFees = filtered.reduce((s, t) => s + Number(t.feePlatform), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tips</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tips.length} total transactions</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Volume (filtered)", value: `R${totalVolume.toFixed(2)}`, color: "text-slate-800" },
          { label: "Platform Fees", value: `R${totalFees.toFixed(2)}`, color: "text-blue-600" },
          { label: "Net to Workers", value: `R${totalNet.toFixed(2)}`, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search worker, customer, ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64"
        />
        <div className="flex gap-1">
          {["all", "COMPLETED", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Fee</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No tips found</td></tr>
                ) : (
                  filtered.map((tip) => (
                    <tr key={tip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {new Date(tip.createdAt).toLocaleDateString("en-ZA")}<br />
                        <span className="text-slate-400">{new Date(tip.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {tip.worker.user.firstName} {tip.worker.user.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{tip.customerName || "Anonymous"}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">R{Number(tip.amount).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500 text-xs">R{Number(tip.feePlatform).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">R{Number(tip.netAmount).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[tip.status] || "bg-slate-100 text-slate-500"}`}>
                          {tip.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
