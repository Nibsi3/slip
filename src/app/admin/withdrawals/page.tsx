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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
        <button
          onClick={() => loadWithdrawals(statusFilter || undefined)}
          className="text-sm text-accent hover:text-accent-300 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-accent text-white"
                : "bg-surface-300 text-muted hover:bg-surface-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse text-muted-300">Loading withdrawals...</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-300 border-b border-surface-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Worker</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Method</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Fee</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {withdrawals.map((w) => (
                  <Fragment key={w.id}>
                    <tr
                      className="hover:bg-surface-300 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-muted-300">
                        {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 py-4 font-medium text-white">
                        {w.worker.user.firstName} {w.worker.user.lastName}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {w.method === "INSTANT_MONEY" ? "Instant Money" : "EFT"}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-white">
                        R{Number(w.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right text-muted">
                        R{Number(w.fee).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-accent">
                        R{Number(w.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            w.status === "COMPLETED"
                              ? "bg-green-900/30 text-green-400"
                              : w.status === "PENDING"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : w.status === "PROCESSING"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          {w.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => confirmAction(w, "approve")}
                                disabled={acting === w.id}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => confirmAction(w, "reject")}
                                disabled={acting === w.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50"
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
                                className="px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-500 disabled:opacity-50"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => confirmAction(w, "reject")}
                                disabled={acting === w.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === w.id && (
                      <tr className="bg-surface-300/50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-300 text-xs">Email</p>
                              <p className="font-medium">{w.worker.user.email}</p>
                            </div>
                            {w.method === "EFT" && (
                              <>
                                <div>
                                  <p className="text-muted-300 text-xs">Bank</p>
                                  <p className="font-medium">{w.bankName || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-300 text-xs">Account No</p>
                                  <p className="font-medium">{w.bankAccountNo || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-300 text-xs">Branch Code</p>
                                  <p className="font-medium">{w.bankBranchCode || "—"}</p>
                                </div>
                              </>
                            )}
                            {w.method === "INSTANT_MONEY" && (
                              <div>
                                <p className="text-muted-300 text-xs">Phone</p>
                                <p className="font-medium">{w.phoneNumber || "—"}</p>
                              </div>
                            )}
                            {w.reference && (
                              <div>
                                <p className="text-muted-300 text-xs">Reference</p>
                                <p className="font-medium">{w.reference}</p>
                              </div>
                            )}
                            {w.processedAt && (
                              <div>
                                <p className="text-muted-300 text-xs">Processed</p>
                                <p className="font-medium">
                                  {new Date(w.processedAt).toLocaleString("en-ZA")}
                                </p>
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
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-300">
                      {statusFilter
                        ? `No ${statusFilter.toLowerCase()} withdrawals`
                        : "No withdrawals yet"}
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
