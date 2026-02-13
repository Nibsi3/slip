"use client";

import { useState, useEffect } from "react";

interface WorkerItem {
  id: string;
  qrCode: string;
  walletBalance: string | number;
  isActive: boolean;
  jobTitle?: string;
  employerName?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
  _count: { tips: number; withdrawals: number };
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/workers")
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-muted-300">Loading workers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Workers ({workers.length})</h1>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-300 border-b border-surface-100">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Email</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Job</th>
                <th className="px-6 py-3 text-right font-medium text-muted">Balance</th>
                <th className="px-6 py-3 text-right font-medium text-muted">Tips</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-surface-300">
                  <td className="px-6 py-4 font-medium text-white">
                    {w.user.firstName} {w.user.lastName}
                  </td>
                  <td className="px-6 py-4 text-muted">{w.user.email}</td>
                  <td className="px-6 py-4 text-muted">
                    {w.jobTitle || "—"}{w.employerName ? ` @ ${w.employerName}` : ""}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-accent">
                    R{Number(w.walletBalance).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-muted">{w._count.tips}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      w.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                    }`}>
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-300">
                    {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
