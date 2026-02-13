"use client";

import { useWorker } from "../WorkerContext";

export default function TipsPage() {
  const { worker, loading } = useWorker();
  const tips = worker?.tips || [];

  if (loading) return <div className="animate-pulse text-muted-300">Loading tips...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tip History</h1>
        <p className="text-muted mt-1">All tips you&apos;ve received</p>
      </div>

      {tips.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-muted-300">No tips received yet. Share your QR code to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {tips.map((tip) => (
              <div key={tip.id} className="card !p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white">R{Number(tip.amount).toFixed(2)}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      tip.status === "COMPLETED"
                        ? "bg-green-900/30 text-green-400"
                        : tip.status === "PENDING"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {tip.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-300">{new Date(tip.createdAt).toLocaleDateString("en-ZA")}</span>
                  <span className="font-medium text-accent">Net: R{Number(tip.netAmount).toFixed(2)}</span>
                </div>
                <p className="text-[10px] font-mono text-white/30 mt-1 truncate">{tip.paymentId}</p>
                {tip.customerMessage && (
                  <p className="text-xs text-muted mt-1 truncate">&ldquo;{tip.customerMessage}&rdquo;</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="card overflow-hidden !p-0 hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-300 border-b border-surface-100">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left font-medium text-muted">Date</th>
                    <th className="px-4 lg:px-6 py-3 text-left font-medium text-muted">Payment Code</th>
                    <th className="px-4 lg:px-6 py-3 text-right font-medium text-muted">Amount</th>
                    <th className="px-4 lg:px-6 py-3 text-right font-medium text-muted">Net</th>
                    <th className="px-4 lg:px-6 py-3 text-left font-medium text-muted">Status</th>
                    <th className="px-4 lg:px-6 py-3 text-left font-medium text-muted">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {tips.map((tip) => (
                    <tr key={tip.id} className="hover:bg-surface-300">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-muted-300">
                        {new Date(tip.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 lg:px-6 py-4 font-mono text-xs text-white/50">
                        {tip.paymentId}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right font-medium text-white">
                        R{Number(tip.amount).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right font-medium text-accent">
                        R{Number(tip.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            tip.status === "COMPLETED"
                              ? "bg-green-900/30 text-green-400"
                              : tip.status === "PENDING"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {tip.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-300 max-w-[200px] truncate">
                        {tip.customerMessage || "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
