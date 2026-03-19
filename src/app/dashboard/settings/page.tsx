"use client";

import { useState, useEffect, FormEvent } from "react";
import { useWorker } from "../WorkerContext";

export default function SettingsPage() {
  const { worker, loading, refresh } = useWorker();
  const [form, setForm] = useState({
    employerName: "",
    jobTitle: "",
    bankName: "",
    bankAccountNo: "",
    bankBranchCode: "",
    phoneForIM: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (worker && !initialized) {
      setForm({
        employerName: worker.employerName || "",
        jobTitle: worker.jobTitle || "",
        bankName: worker.bankName || "",
        bankAccountNo: worker.bankAccountNo || "",
        bankBranchCode: worker.bankBranchCode || "",
        phoneForIM: worker.phoneForIM || "",
      });
      setInitialized(true);
    }
  }, [worker, initialized]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/workers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Settings saved successfully!");
      await refresh();
    } catch {
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="animate-pulse text-muted-300">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-muted mt-1">Update your profile and banking details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Work details */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-white">Work Details</h2>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Employer Name</label>
              <input
                type="text"
                value={form.employerName}
                onChange={(e) => setForm((p) => ({ ...p, employerName: e.target.value }))}
                className="input-field"
                placeholder="e.g. The Grand Hotel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Job Title</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                className="input-field"
                placeholder="e.g. Waiter, Porter, Barista"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Phone for Instant Money</label>
              <input
                type="tel"
                value={form.phoneForIM}
                onChange={(e) => setForm((p) => ({ ...p, phoneForIM: e.target.value }))}
                className="input-field"
                placeholder="e.g. 066 299 5533"
              />
            </div>
          </div>

          {/* Right — Banking details */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-white">Banking Details</h2>
            <p className="text-xs text-muted -mt-2">Required for EFT withdrawals</p>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                className="input-field"
                placeholder="e.g. Standard Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Account Number</label>
              <input
                type="text"
                value={form.bankAccountNo}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountNo: e.target.value }))}
                className="input-field"
                placeholder="Account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Branch Code</label>
              <input
                type="text"
                value={form.bankBranchCode}
                onChange={(e) => setForm((p) => ({ ...p, bankBranchCode: e.target.value }))}
                className="input-field"
                placeholder="Branch code"
              />
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("success")
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
