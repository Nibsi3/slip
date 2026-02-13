"use client";

import { useState, useEffect, FormEvent } from "react";
import { useWorker } from "../WorkerContext";

interface Withdrawal {
  id: string;
  amount: string | number;
  fee: string | number;
  netAmount: string | number;
  method: string;
  status: string;
  reference?: string;
  createdAt: string;
}

export default function WithdrawPage() {
  const { worker, loading: workerLoading, refresh } = useWorker();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"INSTANT_MONEY" | "EFT">("INSTANT_MONEY");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankBranchCode, setBankBranchCode] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch("/api/workers/me/withdraw")
      .then((r) => r.json())
      .then((wd) => setWithdrawals(wd.withdrawals || []))
      .catch(console.error)
      .finally(() => setWdLoading(false));
  }, []);

  useEffect(() => {
    if (worker && !initialized) {
      if (worker.phoneForIM) setPhoneNumber(worker.phoneForIM);
      if (worker.bankName) setBankName(worker.bankName);
      if (worker.bankAccountNo) setBankAccountNo(worker.bankAccountNo);
      if (worker.bankBranchCode) setBankBranchCode(worker.bankBranchCode);
      setInitialized(true);
    }
  }, [worker, initialized]);

  const loading = workerLoading || wdLoading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/workers/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          phoneNumber: method === "INSTANT_MONEY" ? phoneNumber : undefined,
          bankName: method === "EFT" ? bankName : undefined,
          bankAccountNo: method === "EFT" ? bankAccountNo : undefined,
          bankBranchCode: method === "EFT" ? bankBranchCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      const ref = data.withdrawal?.reference;
      if (method === "INSTANT_MONEY" && ref) {
        setSuccess(`Your Instant Money voucher PIN is: ${ref} — Go to any ATM to collect your cash.`);
      } else if (method === "EFT" && ref) {
        setSuccess(`EFT sent! Reference: ${ref} — It may take 1-2 business days to reflect.`);
      } else {
        setSuccess("Withdrawal processed successfully!");
      }
      setAmount("");
      const [, wd] = await Promise.all([
        refresh(),
        fetch("/api/workers/me/withdraw").then((r) => r.json()),
      ]);
      setWithdrawals(wd.withdrawals || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="animate-pulse text-muted-300">Loading...</div>;
  if (!worker) return <div className="text-red-500">Failed to load data.</div>;

  const balance = Number(worker.walletBalance);
  const amountNum = parseFloat(amount) || 0;
  const fee = Number((amountNum * 0.05).toFixed(2));
  const net = Number((amountNum - fee).toFixed(2));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-muted mt-1">
          Available balance: <span className="font-bold text-accent">R{balance.toFixed(2)}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Withdrawal form */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-5">New Withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("INSTANT_MONEY")}
                  className={`py-2.5 text-sm text-center font-medium transition-all ${
                    method === "INSTANT_MONEY"
                      ? "bg-accent text-white"
                      : "bg-surface-300 text-muted-50 hover:bg-surface-200"
                  }`}
                >
                  Instant Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("EFT")}
                  className={`py-2.5 text-sm text-center font-medium transition-all ${
                    method === "EFT"
                      ? "bg-accent text-white"
                      : "bg-surface-300 text-muted-50 hover:bg-surface-200"
                  }`}
                >
                  EFT Transfer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Amount (min R20)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-300 font-semibold">R</span>
                <input
                  type="number"
                  min={20}
                  max={balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
              {amount && amountNum > 0 && (
                <div className="mt-2 p-3 bg-surface-300 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted">Fee (5%)</span><span className="text-white">R{fee.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">You receive</span><span className="text-accent font-semibold">R{net.toFixed(2)}</span></div>
                </div>
              )}
            </div>

            {method === "INSTANT_MONEY" && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 066 299 5533"
                  required
                />
              </div>
            )}

            {method === "EFT" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Standard Bank"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Account No.</label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      className="input-field"
                      placeholder="Account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={bankBranchCode}
                      onChange={(e) => setBankBranchCode(e.target.value)}
                      className="input-field"
                      placeholder="Branch code"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">{success}</div>
            )}

            <button
              type="submit"
              disabled={submitting || balance < 20}
              className="btn-primary"
            >
              {submitting ? "Processing..." : "Withdraw Now"}
            </button>
          </form>
        </div>

        {/* Right — Withdrawal history */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">History</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-300 py-8 text-center">No withdrawals yet</p>
          ) : (
            <div className="divide-y divide-surface-100 max-h-[600px] overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">R{Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted">
                        {w.method === "INSTANT_MONEY" ? "Instant Money" : "EFT"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          w.status === "COMPLETED"
                            ? "bg-green-900/30 text-green-400"
                            : w.status === "PENDING"
                            ? "bg-yellow-900/30 text-yellow-400"
                            : w.status === "PROCESSING"
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {w.status === "PROCESSING" ? "READY" : w.status}
                      </span>
                      <p className="text-[10px] text-muted-300 mt-0.5">
                        {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                  </div>

                  {w.reference && (w.status === "PROCESSING" || w.status === "COMPLETED") && (
                    <div className={`mt-2 p-3 ${
                      w.status === "PROCESSING"
                        ? "bg-blue-900/20 border border-blue-800"
                        : "bg-green-900/20 border border-green-800"
                    }`}>
                      <p className="text-[10px] font-medium text-muted mb-1">
                        {w.method === "INSTANT_MONEY" ? "Voucher PIN" : "EFT Reference"}
                      </p>
                      <p className="text-sm font-mono font-bold tracking-widest text-white break-all">
                        {w.reference}
                      </p>
                      {w.method === "INSTANT_MONEY" && w.status === "PROCESSING" && (
                        <p className="text-xs text-blue-400 mt-1">
                          Use this PIN at any ATM to collect R{Number(w.netAmount).toFixed(2)}.
                        </p>
                      )}
                    </div>
                  )}

                  {w.status === "PENDING" && (
                    <p className="mt-1 text-xs text-yellow-400">
                      Being reviewed. Voucher code coming soon.
                    </p>
                  )}

                  {w.status === "FAILED" && (
                    <p className="mt-1 text-xs text-red-400">
                      Declined. {w.reference || ""} Funds returned.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
