"use client";

import { useState, useEffect, useCallback } from "react";

interface FicaCheck {
  name: string;
  passed: boolean;
  weight: "HARD" | "SOFT";
  detail: string;
}

interface FicaResult {
  decision: "AUTO_APPROVE" | "ADMIN_REVIEW" | "AUTO_DENY";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  checks: FicaCheck[];
}

interface WorkerDoc {
  id: string;
  docStatus: string;
  docSubmittedAt: string | null;
  docReviewedAt: string | null;
  docReviewedBy: string | null;
  docRejectReason: string | null;
  docIdUrl: string | null;
  docAddressUrl: string | null;
  docSelfieUrl: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    idNumber: string | null;
    createdAt: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  NOT_SUBMITTED: "bg-slate-100 text-slate-500",
};

const DECISION_COLORS: Record<string, string> = {
  AUTO_APPROVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ADMIN_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  AUTO_DENY: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminFicaPage() {
  const [workers, setWorkers] = useState<WorkerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED">("PENDING_REVIEW");
  const [selected, setSelected] = useState<WorkerDoc | null>(null);
  const [ficaResult, setFicaResult] = useState<FicaResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/fica")
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = workers.filter((w) =>
    filterStatus === "ALL" ? true : w.docStatus === filterStatus
  );

  const pendingCount = workers.filter((w) => w.docStatus === "PENDING_REVIEW").length;

  async function runAutoCheck(worker: WorkerDoc) {
    setSelected(worker);
    setFicaResult(null);
    setShowDenyForm(false);
    setDenyReason("");
    setCheckLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: worker.id, action: "run_auto" }),
      });
      const d = await res.json();
      setFicaResult(d.result);
    } catch {
      showToast("Failed to run FICA check", "error");
    } finally {
      setCheckLoading(false);
    }
  }

  async function commitAutoDecision() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action: "run_auto_commit" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setFicaResult(null);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function manualAction(action: "approve" | "deny") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action, reason: denyReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setFicaResult(null);
      setShowDenyForm(false);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function runBulkAuto() {
    if (!confirm(`Run automated FICA checks on all ${pendingCount} pending workers and commit decisions?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/fica?bulk=true", { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-green-900/80 text-green-300 border-green-700/50" : "bg-red-900/80 text-red-300 border-red-700/50"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">FICA Document Review</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-400 mt-0.5">{pendingCount} submission{pendingCount !== 1 ? "s" : ""} awaiting review</p>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={runBulkAuto}
            disabled={bulkLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {bulkLoading ? "Running…" : `⚡ Run Auto-Check on All ${pendingCount} Pending`}
          </button>
        )}
      </div>

      {/* What the engine does */}
      <div className="rounded-xl border border-white/[0.06] p-4 text-xs text-muted space-y-1" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-white/70 font-semibold mb-2">How the automated engine works</p>
        <p>✅ <strong className="text-green-400">AUTO-APPROVE</strong> — All 5 hard rules pass (3 docs uploaded + ID number present + Luhn check valid) and all soft rules pass → approved automatically, worker notified via SMS.</p>
        <p>⚠️ <strong className="text-yellow-400">ADMIN REVIEW</strong> — Hard rules pass but soft rules flag concerns (account age &lt; 24h, missing phone, etc.) → stays PENDING_REVIEW for you to decide.</p>
        <p>❌ <strong className="text-red-400">AUTO-DENY</strong> — Hard rule fails (missing doc, invalid ID number format, Luhn check fails) → rejected automatically, worker told to re-upload with reason.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {(["PENDING_REVIEW", "ALL", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === s ? "bg-accent text-white" : "bg-white/5 text-muted hover:bg-white/10"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse text-muted-300 text-sm">Loading FICA submissions…</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">ID Number</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Docs</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-300">No submissions found</td></tr>
                )}
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{w.user.firstName} {w.user.lastName}</p>
                      <p className="text-xs text-muted-300">{w.user.email || w.user.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-mono ${w.user.idNumber ? "text-white" : "text-red-400"}`}>
                        {w.user.idNumber || "⚠ Missing"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <DocBadge label="ID" uploaded={!!w.docIdUrl} />
                        <DocBadge label="Addr" uploaded={!!w.docAddressUrl} />
                        <DocBadge label="Selfie" uploaded={!!w.docSelfieUrl} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-300">
                      {w.docSubmittedAt ? new Date(w.docSubmittedAt).toLocaleDateString("en-ZA") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[w.docStatus] || "bg-white/10 text-muted"}`}>
                        {w.docStatus.replace("_", " ")}
                      </span>
                      {w.docRejectReason && (
                        <p className="text-xs text-red-400/70 mt-1 max-w-[160px] truncate" title={w.docRejectReason}>{w.docRejectReason}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => runAutoCheck(w)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ paddingTop: "5vh" }}>
          <div className="absolute inset-0 bg-black/75" onClick={() => { setSelected(null); setFicaResult(null); setShowDenyForm(false); }} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] shadow-2xl p-6 space-y-5" style={{ background: "#0d0d14" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                FICA Review — {selected.user.firstName} {selected.user.lastName}
              </h3>
              <button onClick={() => { setSelected(null); setFicaResult(null); setShowDenyForm(false); }} className="text-muted-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Worker Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoRow label="Phone" value={selected.user.phone || "—"} />
              <InfoRow label="Email" value={selected.user.email || "—"} />
              <InfoRow label="ID Number" value={selected.user.idNumber || "⚠ Missing"} warn={!selected.user.idNumber} />
              <InfoRow label="Account Age" value={`${Math.floor((Date.now() - new Date(selected.user.createdAt).getTime()) / 3_600_000)}h`} />
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs font-semibold text-muted-300 uppercase tracking-wider mb-2">Uploaded Documents</p>
              <div className="flex gap-3 flex-wrap">
                <DocLink label="SA ID / Passport" url={selected.docIdUrl} />
                <DocLink label="Proof of Address" url={selected.docAddressUrl} />
                <DocLink label="Selfie" url={selected.docSelfieUrl} />
              </div>
            </div>

            {/* Auto-check result */}
            {checkLoading && (
              <div className="text-sm text-muted animate-pulse">Running automated checks…</div>
            )}

            {ficaResult && (
              <div className={`rounded-xl border p-4 space-y-3 ${DECISION_COLORS[ficaResult.decision]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">
                      {ficaResult.decision === "AUTO_APPROVE" && "✅ AUTO-APPROVE"}
                      {ficaResult.decision === "ADMIN_REVIEW" && "⚠️ ADMIN REVIEW NEEDED"}
                      {ficaResult.decision === "AUTO_DENY" && "❌ AUTO-DENY"}
                    </span>
                    <span className="ml-2 text-xs opacity-70">Confidence: {ficaResult.confidence}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {ficaResult.reasons.map((r, i) => (
                    <p key={i} className="text-xs opacity-90">• {r}</p>
                  ))}
                </div>

                {/* Check breakdown */}
                <div className="border-t border-current/20 pt-3">
                  <p className="text-xs font-semibold opacity-70 mb-2 uppercase tracking-wider">Check Breakdown</p>
                  <div className="space-y-1">
                    {ficaResult.checks.map((c) => (
                      <div key={c.name} className="flex items-start gap-2 text-xs">
                        <span className={c.passed ? "text-green-400" : (c.weight === "HARD" ? "text-red-400" : "text-yellow-400")}>
                          {c.passed ? "✓" : (c.weight === "HARD" ? "✗" : "⚠")}
                        </span>
                        <span className="opacity-80">{c.detail}</span>
                        {c.weight === "HARD" && !c.passed && (
                          <span className="ml-auto text-red-400 font-semibold">HARD FAIL</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {!ficaResult && !checkLoading && (
                <button
                  onClick={() => runAutoCheck(selected)}
                  disabled={checkLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors border border-accent/30"
                >
                  ⚡ Run Automated Check
                </button>
              )}

              {ficaResult && ficaResult.decision !== "ADMIN_REVIEW" && (
                <button
                  onClick={commitAutoDecision}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    ficaResult.decision === "AUTO_APPROVE"
                      ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border-green-700/40"
                      : "bg-red-900/30 text-red-400 hover:bg-red-900/50 border-red-700/40"
                  }`}
                >
                  {actionLoading ? "Applying…" : `Apply ${ficaResult.decision.replace("_", " ")}`}
                </button>
              )}

              {/* Manual overrides always available */}
              <button
                onClick={() => manualAction("approve")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors border border-green-700/30"
              >
                ✓ Manual Approve
              </button>

              <button
                onClick={() => setShowDenyForm(!showDenyForm)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors border border-red-700/30"
              >
                ✗ Manual Deny
              </button>
            </div>

            {showDenyForm && (
              <div className="space-y-2">
                <textarea
                  placeholder="Reason for denial (sent to worker via SMS)…"
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  rows={3}
                  className="input-field !text-sm w-full resize-none"
                />
                <button
                  onClick={() => manualAction("deny")}
                  disabled={actionLoading || !denyReason.trim()}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40"
                >
                  {actionLoading ? "Denying…" : "Confirm Denial & Notify Worker"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocBadge({ label, uploaded }: { label: string; uploaded: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${uploaded ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
      {uploaded ? "✓" : "✗"} {label}
    </span>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs bg-red-900/20 text-red-400 border border-red-700/30">
        ✗ {label} missing
      </span>
    );
  }
  return (
    <a
      href={`/api/admin/documents?key=${encodeURIComponent(url)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-accent hover:bg-white/10 border border-white/10 transition-colors"
    >
      📄 {label}
    </a>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-muted-300">{label}</p>
      <p className={`font-medium ${warn ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}
