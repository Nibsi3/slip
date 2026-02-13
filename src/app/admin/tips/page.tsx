"use client";

import { useState, useEffect } from "react";

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

export default function AdminTipsPage() {
  const [tips, setTips] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setTips(d.recentTips || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-muted-300">Loading tips...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">All Tips</h1>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-300 border-b border-surface-100">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-muted">Date</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Worker</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Customer</th>
                <th className="px-6 py-3 text-right font-medium text-muted">Amount</th>
                <th className="px-6 py-3 text-right font-medium text-muted">Platform Fee</th>
                <th className="px-6 py-3 text-right font-medium text-muted">Net</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {tips.map((tip) => (
                <tr key={tip.id} className="hover:bg-surface-300">
                  <td className="px-6 py-4 whitespace-nowrap text-muted-300">
                    {new Date(tip.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {tip.worker.user.firstName} {tip.worker.user.lastName}
                  </td>
                  <td className="px-6 py-4 text-muted">{tip.customerName || "Anonymous"}</td>
                  <td className="px-6 py-4 text-right font-medium text-white">
                    R{Number(tip.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-muted">
                    R{Number(tip.feePlatform).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-accent">
                    R{Number(tip.netAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tip.status === "COMPLETED" ? "bg-green-900/30 text-green-400"
                        : tip.status === "PENDING" ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-red-900/30 text-red-400"
                    }`}>
                      {tip.status}
                    </span>
                  </td>
                </tr>
              ))}
              {tips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-300">
                    No tips yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
