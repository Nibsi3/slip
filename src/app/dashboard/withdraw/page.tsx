"use client";

import { useState, useEffect, FormEvent } from "react";
import { useWorker } from "../WorkerContext";

const MIN_WITHDRAWAL = 20;
const EFT_FEE_FLAT = 2;
const OTT_FEE_PERCENT = 0.06;

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

interface Bank {
  name: string;
  code: string;
}

type Method = "EFT" | "OTT";

function methodLabel(method: string): string {
  if (method === "OTT_VOUCHER" || method === "OTT") return "OTT Voucher";
  if (method === "EFT") return "EFT Transfer";
  if (method === "INSTANT_MONEY") return "Instant Money";
  return method;
}

export default function WithdrawPage() {
  const { worker, loading: workerLoading, refresh } = useWorker();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("EFT");

  // EFT fields
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [initialized, setInitialized] = useState(false);

  // OTT field
  const [ottMobile, setOttMobile] = useState("");

  useEffect(() => {
    fetch("/api/workers/me/withdraw")
      .then((r) => r.json())
      .then((wd) => setWithdrawals(wd.withdrawals || []))
      .catch(console.error)
      .finally(() => setWdLoading(false));

    fetch("/api/workers/me/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(console.error)
      .finally(() => setBanksLoading(false));
  }, []);

  useEffect(() => {
    if (worker && !initialized && banks.length > 0) {
      if (worker.bankAccountNo) setBankAccountNo(worker.bankAccountNo);
      if (worker.phoneForIM) setOttMobile(worker.phoneForIM);
      if (worker.bankName) {
        const saved = banks.find(
          (b) => b.name.toLowerCase() === (worker.bankName || "").toLowerCase()
        );
        if (saved) {
          setSelectedBankCode(saved.code);
          setSelectedBankName(saved.name);
        }
      }
      setInitialized(true);
    }
  }, [worker, initialized, banks]);

  const loading = workerLoading || wdLoading;

  function handleBankChange(code: string) {
    setSelectedBankCode(code);
    const bank = banks.find((b) => b.code === code);
    setSelectedBankName(bank?.name || "");
  }

  const amountNum = parseFloat(amount) || 0;
  const fee = method === "EFT"
    ? (amountNum >= MIN_WITHDRAWAL ? EFT_FEE_FLAT : 0)
    : (amountNum >= MIN_WITHDRAWAL ? Number((amountNum * OTT_FEE_PERCENT).toFixed(2)) : 0);
  const netAmount = amountNum > 0 ? Number((amountNum - fee).toFixed(2)) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amountNum || amountNum < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is R${MIN_WITHDRAWAL}.`);
      return;
    }

    if (method === "EFT") {
      if (!selectedBankCode) { setError("Please select your bank."); return; }
      if (!bankAccountNo.trim()) { setError("Please enter your account number."); return; }
    }

    if (method === "OTT") {
      if (!ottMobile.trim()) { setError("Please enter the mobile number for your OTT voucher."); return; }
    }

    setSubmitting(true);

    try {
      const body = method === "EFT"
        ? { amount: amountNum, method: "EFT", bankName: selectedBankName, bankAccountNo: bankAccountNo.trim(), bankCode: selectedBankCode }
        : { amount: amountNum, method: "OTT", mobile: ottMobile.trim() };

      const res = await fetch("/api/workers/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      if (method === "EFT") {
        const ref = data.withdrawal?.reference;
        setSuccess(ref
          ? `EFT initiated! Reference: ${ref} — Allow 1–2 business days to reflect.`
          : "EFT submitted! You will be notified once processed.");
      } else {
        setSuccess("OTT voucher issued! Your PIN will arrive on WhatsApp shortly. Redeem at any OTT outlet.");
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
  const canWithdraw = balance >= MIN_WITHDRAWAL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-muted mt-1">
          Available balance: <span className="font-bold text-accent">R{balance.toFixed(2)}</span>
        </p>
      </div>

      {!canWithdraw && (
        <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-400 font-medium">
            You need a minimum balance of <strong>R{MIN_WITHDRAWAL}</strong> to withdraw.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Withdrawal form */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-5">New Withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Method selector */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Withdrawal Method</label>
              <div className="grid grid-cols-2 gap-2">
                {(["EFT", "OTT"] as Method[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMethod(m); setError(""); setSuccess(""); }}
                    disabled={submitting}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      method === m
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/20"
                    }`}
                  >
                    {m === "EFT" ? (
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-base">🏦</span>
                        <span>EFT Bank Transfer</span>
                        <span className="text-[10px] text-white/30">R2 flat fee</span>
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-base">🎟️</span>
                        <span>OTT Voucher</span>
                        <span className="text-[10px] text-white/30">6% fee · via WhatsApp</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Amount <span className="text-white/30">(min R{MIN_WITHDRAWAL})</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-300 font-semibold">R</span>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  max={balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-10"
                  placeholder={`${MIN_WITHDRAWAL}.00`}
                  required
                  disabled={!canWithdraw || submitting}
                />
              </div>
              {amountNum >= MIN_WITHDRAWAL && (
                <div className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-white/40">Withdrawal amount</span>
                    <span className="text-white">R{amountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">
                      {method === "EFT" ? "EFT fee (flat)" : "OTT service fee (6%)"}
                    </span>
                    <span className="text-orange-400">− R{fee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white/50">You receive</span>
                    <span className="text-green-400">R{netAmount.toFixed(2)}</span>
                  </div>
                  {method === "EFT" && (
                    <p className="text-[10px] text-white/20 mt-1">Powered by Stitch Payouts · 1–2 business days</p>
                  )}
                  {method === "OTT" && (
                    <p className="text-[10px] text-white/20 mt-1">PIN delivered via WhatsApp · redeem at any OTT outlet</p>
                  )}
                </div>
              )}
            </div>

            {/* EFT fields */}
            {method === "EFT" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Bank</label>
                  {banksLoading ? (
                    <div className="input-field text-white/30 animate-pulse">Loading banks...</div>
                  ) : (
                    <select
                      value={selectedBankCode}
                      onChange={(e) => handleBankChange(e.target.value)}
                      className="input-field"
                      required
                      disabled={!canWithdraw || submitting}
                    >
                      <option value="">Select your bank...</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="input-field"
                    placeholder="Your account number"
                    required
                    disabled={!canWithdraw || submitting}
                  />
                </div>
              </>
            )}

            {/* OTT field */}
            {method === "OTT" && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  WhatsApp Mobile Number
                </label>
                <input
                  type="tel"
                  value={ottMobile}
                  onChange={(e) => setOttMobile(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 0821234567"
                  required
                  disabled={!canWithdraw || submitting}
                />
                <p className="text-[11px] text-white/30 mt-1">
                  Your OTT voucher PIN will be sent to this number via WhatsApp.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">{success}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !canWithdraw}
              className="btn-primary w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : method === "EFT" ? "Withdraw via EFT" : "Get OTT Voucher"}
            </button>
          </form>
        </div>

        {/* Right — Withdrawal history */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">Withdrawal History</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-300 py-8 text-center">No withdrawals yet</p>
          ) : (
            <div className="divide-y divide-white/[0.05] max-h-[600px] overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">R{Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted">{methodLabel(w.method)}</p>
                      {Number(w.fee) > 0 && (
                        <p className="text-[10px] text-white/30">
                          Fee R{Number(w.fee).toFixed(2)} · Net R{Number(w.netAmount).toFixed(2)}
                        </p>
                      )}
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
                        {w.status === "PROCESSING" ? "IN PROGRESS" : w.status}
                      </span>
                      <p className="text-[10px] text-muted-300 mt-0.5">
                        {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                  </div>

                  {w.reference && (w.status === "PROCESSING" || w.status === "COMPLETED") && (
                    <div className={`mt-2 p-3 rounded-lg ${
                      w.status === "PROCESSING"
                        ? "bg-blue-900/20 border border-blue-800/40"
                        : "bg-green-900/20 border border-green-800/40"
                    }`}>
                      <p className="text-[10px] font-medium text-muted mb-1">
                        {w.method === "OTT_VOUCHER" ? "OTT Voucher Reference" : "EFT Reference"}
                      </p>
                      <p className="text-sm font-mono font-bold tracking-widest text-white break-all">
                        {w.reference}
                      </p>
                    </div>
                  )}

                  {w.status === "PENDING" && (
                    <p className="mt-1 text-xs text-yellow-400">Under review — will be processed shortly.</p>
                  )}

                  {w.status === "FAILED" && (
                    <p className="mt-1 text-xs text-red-400">
                      Failed. {w.reference ? `Reason: ${w.reference}.` : ""} Funds returned to your wallet.
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
