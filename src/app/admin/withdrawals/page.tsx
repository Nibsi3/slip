"use client";

import { useState, useEffect, Fragment } from "react";

interface WithdrawalItem {
  id: string;
  amount: string | number;
  fee: string | number;
  netAmount: string | number;
  method: string;
  status: string;
  reference?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranchCode?: string;
  phoneNumber?: string;
  processedAt?: string;
  createdAt: string;
  worker: { user: { firstName: string; lastName: string; email: string } };
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed" },
];

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadWithdrawals(status?: string) {
    setLoading(true);
    try {
      const url = status
        ? `/api/admin/withdrawals?status=${status}`
        : "/api/admin/withdrawals";
      const res = await fetch(url);
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch {
      setError("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWithdrawals(statusFilter || undefined);
  }, [statusFilter]);

  async function handleAction(
    withdrawalId: string,
    action: "approve" | "complete" | "reject",
    reference?: string,
    reason?: string
  ) {
    setActing(withdrawalId);
    setError("");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, reference, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      await loadWithdrawals(statusFilter || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  function confirmAction(
    w: WithdrawalItem,
    action: "approve" | "complete" | "reject"
  ) {
    const labels = {
      approve: `Approve withdrawal of R${Number(w.netAmount).toFixed(2)} for ${w.worker.user.firstName}?`,
      complete: `Mark R${Number(w.netAmount).toFixed(2)} withdrawal as completed? You MUST enter the voucher/reference code.`,
      reject: `Reject withdrawal of R${Number(w.amount).toFixed(2)} for ${w.worker.user.firstName}? Funds will be returned to their wallet.`,
    };
    if (confirm(labels[action])) {
      const reason = action === "reject" ? prompt("Reason for rejection:") || "Rejected by admin" : undefined;
      let reference: string | undefined;
      if (action === "complete") {
        const code = prompt("Enter the Instant Money voucher PIN or EFT reference (REQUIRED):");
        if (!code || !code.trim()) {
          alert("A voucher/reference code is required to mark as paid.");
          return;
        }
        reference = code.trim();
      }
      handleAction(w.id, action, reference, reason);
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
  };

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Withdrawals</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">{pendingCount} pending action</p>
          )}
        </div>
        <button
          onClick={() => loadWithdrawals(statusFilter || undefined)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              statusFilter === tab.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <Fragment key={w.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {w.worker.user.firstName} {w.worker.user.lastName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {w.method === "INSTANT_MONEY" ? "Instant Money" : "EFT"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                        R{Number(w.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-400 text-xs">
                        R{Number(w.fee).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                        R{Number(w.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[w.status] || "bg-slate-100 text-slate-500"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                          {w.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => confirmAction(w, "approve")}
                                disabled={acting === w.id}
                                className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => confirmAction(w, "reject")}
                                disabled={acting === w.id}
                                className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors border border-red-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {w.status === "PROCESSING" && (
                            <>
                              <button
                                onClick={() => confirmAction(w, "complete")}
                                disabled={acting === w.id}
                                className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => confirmAction(w, "reject")}
                                disabled={acting === w.id}
                                className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors border border-red-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button className="px-2 py-1 text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className={`w-4 h-4 transition-transform ${expandedId === w.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === w.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{w.worker.user.email}</p>
                            </div>
                            {w.method === "EFT" && (
                              <>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bank</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{w.bankName || "—"}</p>
                                </div>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account No</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{w.bankAccountNo || "—"}</p>
                                </div>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Branch Code</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{w.bankBranchCode || "—"}</p>
                                </div>
                              </>
                            )}
                            {w.method === "INSTANT_MONEY" && (
                              <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{w.phoneNumber || "—"}</p>
                              </div>
                            )}
                            {w.reference && (
                              <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reference</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{w.reference}</p>
                              </div>
                            )}
                            {w.processedAt && (
                              <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Processed</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{new Date(w.processedAt).toLocaleString("en-ZA")}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {statusFilter ? `No ${statusFilter.toLowerCase()} withdrawals` : "No withdrawals yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
