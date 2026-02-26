"use client";

import { useState, useEffect, useCallback } from "react";

interface PhysicalQRReq {
  id: string;
  status: string;
  isFree: boolean;
  feeCharged: number;
  address?: string;
  notes?: string;
  adminNotes?: string;
  dispatchedAt?: string;
  createdAt: string;
  worker: {
    id: string;
    jobTitle?: string;
    employerName?: string;
    physicalQrCount: number;
    user: { firstName: string; lastName: string; email?: string; phone?: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-900/30 text-yellow-400",
  APPROVED: "bg-blue-900/30 text-blue-400",
  DISPATCHED: "bg-green-900/30 text-green-400",
  REJECTED: "bg-red-900/30 text-red-400",
};

export default function AdminPhysicalQRPage() {
  const [requests, setRequests] = useState<PhysicalQRReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "DISPATCHED" | "REJECTED">("all");
  const [selected, setSelected] = useState<PhysicalQRReq | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/physical-qr")
      .then(r => r.json())
      .then(d => setRequests(d.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function doAction(req: PhysicalQRReq, action: "approve" | "dispatch" | "reject") {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/physical-qr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id, action, adminNotes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setAdminNotes("");
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const pending = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-900/80 text-green-300 border border-green-700/50" : "bg-red-900/80 text-red-300 border border-red-700/50"
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Physical QR Requests <span className="text-muted-300 font-normal text-lg">({requests.length})</span></h1>
        {pending > 0 && <p className="text-sm text-yellow-400 mt-0.5">{pending} pending dispatch</p>}
      </div>

      <div className="flex gap-1 flex-wrap">
        {(["all", "PENDING", "APPROVED", "DISPATCHED", "REJECTED"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-accent text-white" : "bg-white/5 text-muted hover:bg-white/10"
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-300">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-muted-300 py-8">No requests found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="card !p-0 overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">
                      {req.worker.user.firstName} {req.worker.user.lastName}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                    {req.isFree ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 text-[10px] font-bold">FREE</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">R{Number(req.feeCharged).toFixed(0)}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="text-xs text-muted">{req.worker.user.phone || "—"}</span>
                    <span className="text-xs text-muted">{req.worker.user.email || "—"}</span>
                    {req.worker.jobTitle && <span className="text-xs text-muted-300">{req.worker.jobTitle}{req.worker.employerName ? ` @ ${req.worker.employerName}` : ""}</span>}
                  </div>
                  {req.address && <p className="text-xs text-accent/80 mt-1">📍 {req.address}</p>}
                  {req.notes && <p className="text-xs text-muted-300 mt-0.5 italic">"{req.notes}"</p>}
                  {req.adminNotes && <p className="text-xs text-blue-400/80 mt-1">Admin: {req.adminNotes}</p>}
                  <p className="text-[11px] text-muted-300 mt-2">{new Date(req.createdAt).toLocaleString("en-ZA")} · Card #{req.worker.physicalQrCount}</p>
                </div>
                {req.status === "PENDING" && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { setSelected(req); setAdminNotes(""); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors">
                      Manage
                    </button>
                  </div>
                )}
                {req.status === "APPROVED" && (
                  <button onClick={() => doAction(req, "dispatch")} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors shrink-0">
                    Mark Dispatched
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl p-6" style={{ background: "#0d0d14" }}>
            <h3 className="text-base font-bold text-white mb-1">
              {selected.worker.user.firstName} {selected.worker.user.lastName}
            </h3>
            <p className="text-xs text-muted mb-4">
              {selected.isFree ? "Free card" : `R${Number(selected.feeCharged).toFixed(0)} charged`}
              {selected.address ? ` · ${selected.address}` : ""}
            </p>

            <div className="mb-4">
              <label className="block text-xs text-muted-300 mb-1">Admin Notes <span className="text-muted-300">(shown to worker)</span></label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                className="input-field !text-sm resize-none w-full"
                placeholder="e.g. Dispatched via PostNet, tracking #12345"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => doAction(selected, "approve")} disabled={saving} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors">
                Approve
              </button>
              <button onClick={() => doAction(selected, "dispatch")} disabled={saving} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors">
                Dispatched
              </button>
              <button onClick={() => doAction(selected, "reject")} disabled={saving} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
                Reject
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="mt-3 w-full btn-secondary !py-2 !text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
