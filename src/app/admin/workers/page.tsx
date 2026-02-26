"use client";

import { useState, useEffect, useCallback } from "react";

interface QRCodeItem {
  id: string;
  status: string;
  createdAt: string;
}

interface WorkerItem {
  id: string;
  qrCode: string;
  walletBalance: string | number;
  availableBalance: string | number;
  isActive: boolean;
  jobTitle?: string;
  employerName?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranchCode?: string;
  createdAt: string;
  docStatus: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    isVerified: boolean;
    createdAt: string;
  };
  _count: { tips: number; withdrawals: number };
  qrCodes: QRCodeItem[];
}

type ModalType = "detail" | "edit" | "reject" | "deactivate" | "delete" | null;

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<WorkerItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [reason, setReason] = useState("");
  const [editForm, setEditForm] = useState<Partial<WorkerItem & { firstName: string; lastName: string; email: string; phone: string }>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/workers")
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openModal(w: WorkerItem, type: ModalType) {
    setSelected(w);
    setReason("");
    if (type === "edit") {
      setEditForm({
        firstName: w.user.firstName,
        lastName: w.user.lastName,
        email: w.user.email || "",
        phone: w.user.phone || "",
        jobTitle: w.jobTitle || "",
        employerName: w.employerName || "",
        bankName: w.bankName || "",
        bankAccountNo: w.bankAccountNo || "",
        bankBranchCode: w.bankBranchCode || "",
      });
    }
    setModal(type);
  }

  function closeModal() { setModal(null); setSelected(null); }

  async function doAction(action: string, extra?: Record<string, string>) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action, reason, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      closeModal();
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function doEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action: "edit", ...editForm }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      closeModal();
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workers?workerId=${selected.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      closeModal();
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  const filtered = workers.filter((w) => {
    const name = `${w.user.firstName} ${w.user.lastName} ${w.user.email || ""} ${w.jobTitle || ""}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? w.isActive : !w.isActive);
    return matchSearch && matchFilter;
  });

  const pending = workers.filter((w) => !w.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-900/80 text-green-300 border border-green-700/50" : "bg-red-900/80 text-red-300 border border-red-700/50"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Workers <span className="text-muted-300 font-normal text-lg">({workers.length})</span></h1>
          {pending > 0 && (
            <p className="text-sm text-yellow-400 mt-0.5">{pending} pending approval</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, email, job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field !py-2 !text-sm max-w-xs"
        />
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? "bg-accent text-white" : "bg-white/5 text-muted hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-300">Loading workers...</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Job</th>
                  <th className="px-5 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Balance</th>
                  <th className="px-5 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Tips</th>
                  <th className="px-5 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted text-xs uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-right font-medium text-muted text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-300">No workers found</td></tr>
                )}
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <button onClick={() => openModal(w, "detail")} className="font-medium text-white hover:text-accent transition-colors text-left">
                        {w.user.firstName} {w.user.lastName}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-muted text-xs">{w.user.email || "—"}</div>
                      <div className="text-muted-300 text-xs">{w.user.phone || "—"}</div>
                    </td>
                    <td className="px-5 py-4 text-muted text-xs">
                      {w.jobTitle || "—"}{w.employerName ? ` @ ${w.employerName}` : ""}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-accent text-xs">
                      R{Number(w.walletBalance).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right text-muted text-xs">{w._count.tips}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                      }`}>
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-300 text-xs">
                      {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!w.isActive && (
                          <button
                            onClick={() => openModal(w, "detail")}
                            className="px-2 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
                          >
                            Review
                          </button>
                        )}
                        <button onClick={() => openModal(w, "edit")} className="px-2 py-1 rounded-md text-xs text-muted hover:text-white hover:bg-white/5 transition-colors">Edit</button>
                        {w.isActive ? (
                          <button onClick={() => openModal(w, "deactivate")} className="px-2 py-1 rounded-md text-xs text-yellow-400 hover:bg-yellow-900/20 transition-colors">Deactivate</button>
                        ) : (
                          <button onClick={() => openModal(w, "detail")} className="px-2 py-1 rounded-md text-xs text-blue-400 hover:bg-blue-900/20 transition-colors">Activate</button>
                        )}
                        <button onClick={() => openModal(w, "delete")} className="px-2 py-1 rounded-md text-xs text-red-400 hover:bg-red-900/20 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {modal === "detail" && selected && (
        <ModalWrapper onClose={closeModal} title={`${selected.user.firstName} ${selected.user.lastName}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Email" value={selected.user.email || "—"} />
              <InfoRow label="Phone" value={selected.user.phone || "—"} />
              <InfoRow label="ID Number" value={selected.user.idNumber || "—"} />
              <InfoRow label="Job Title" value={selected.jobTitle || "—"} />
              <InfoRow label="Employer" value={selected.employerName || "—"} />
              <InfoRow label="Status" value={selected.isActive ? "Active" : "Inactive"} color={selected.isActive ? "text-green-400" : "text-red-400"} />
              <InfoRow label="Wallet Balance" value={`R${Number(selected.walletBalance).toFixed(2)}`} color="text-accent" />
              <InfoRow label="Available Balance" value={`R${Number(selected.availableBalance).toFixed(2)}`} color="text-accent" />
              <InfoRow label="Total Tips" value={String(selected._count.tips)} />
              <InfoRow label="Withdrawals" value={String(selected._count.withdrawals)} />
              <InfoRow label="Bank" value={selected.bankName || "—"} />
              <InfoRow label="Account No" value={selected.bankAccountNo || "—"} />
              <InfoRow label="Branch Code" value={selected.bankBranchCode || "—"} />
              <InfoRow label="Doc Status" value={selected.docStatus} />
              <InfoRow label="QR Codes" value={String(selected.qrCodes?.length || 0)} />
              <InfoRow label="Joined" value={new Date(selected.user.createdAt).toLocaleDateString("en-ZA")} />
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              {!selected.isActive && (
                <ActionBtn color="green" label="✓ Approve" onClick={() => doAction("approve")} />
              )}
              {!selected.isActive && (
                <ActionBtn color="red" label="✗ Reject" onClick={() => { setModal("reject"); }} />
              )}
              <ActionBtn color="blue" label="Edit" onClick={() => openModal(selected, "edit")} />
              {selected.isActive
                ? <ActionBtn color="yellow" label="Deactivate" onClick={() => setModal("deactivate")} />
                : <ActionBtn color="blue" label="Activate" onClick={() => doAction("activate")} />
              }
              <ActionBtn color="red" label="Delete" onClick={() => setModal("delete")} />
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ── Edit Modal ── */}
      {modal === "edit" && selected && (
        <ModalWrapper onClose={closeModal} title={`Edit — ${selected.user.firstName} ${selected.user.lastName}`}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" value={editForm.firstName || ""} onChange={(v) => setEditForm((p) => ({ ...p, firstName: v }))} />
              <Field label="Last Name" value={editForm.lastName || ""} onChange={(v) => setEditForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <Field label="Email" value={editForm.email || ""} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} />
            <Field label="Phone" value={editForm.phone || ""} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} />
            <Field label="Job Title" value={editForm.jobTitle || ""} onChange={(v) => setEditForm((p) => ({ ...p, jobTitle: v }))} />
            <Field label="Employer Name" value={editForm.employerName || ""} onChange={(v) => setEditForm((p) => ({ ...p, employerName: v }))} />
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-xs text-muted-300 mb-2">Bank Details</p>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Bank" value={editForm.bankName || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankName: v }))} />
                <Field label="Account No" value={editForm.bankAccountNo || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankAccountNo: v }))} />
                <Field label="Branch Code" value={editForm.bankBranchCode || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankBranchCode: v }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={doEdit} disabled={saving} className="btn-primary !py-2 !px-4 !text-sm flex-1">{saving ? "Saving…" : "Save Changes"}</button>
              <button onClick={closeModal} className="btn-secondary !py-2 !px-4 !text-sm">Cancel</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ── Deactivate Modal ── */}
      {modal === "deactivate" && selected && (
        <ModalWrapper onClose={closeModal} title="Deactivate Worker">
          <p className="text-muted text-sm mb-4">Deactivate <strong className="text-white">{selected.user.firstName} {selected.user.lastName}</strong>? Their QR code will stop accepting tips.</p>
          <textarea
            placeholder="Reason (optional, will be emailed to worker)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input-field !text-sm w-full mb-4 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => doAction("deactivate")} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 transition-colors">{saving ? "Saving…" : "Deactivate"}</button>
            <button onClick={closeModal} className="btn-secondary !py-2 !px-4 !text-sm">Cancel</button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Reject Modal ── */}
      {modal === "reject" && selected && (
        <ModalWrapper onClose={closeModal} title="Reject Application">
          <p className="text-muted text-sm mb-4">Reject <strong className="text-white">{selected.user.firstName} {selected.user.lastName}</strong>?</p>
          <textarea
            placeholder="Reason (optional, will be emailed to worker)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input-field !text-sm w-full mb-4 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => doAction("reject")} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">{saving ? "Saving…" : "Reject"}</button>
            <button onClick={closeModal} className="btn-secondary !py-2 !px-4 !text-sm">Cancel</button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Delete Modal ── */}
      {modal === "delete" && selected && (
        <ModalWrapper onClose={closeModal} title="Delete Worker">
          <p className="text-muted text-sm mb-2">Permanently delete <strong className="text-white">{selected.user.firstName} {selected.user.lastName}</strong>?</p>
          <p className="text-red-400/70 text-xs mb-4">This will delete all their data including tips, withdrawals and QR codes. This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={doDelete} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">{saving ? "Deleting…" : "Delete Permanently"}</button>
            <button onClick={closeModal} className="btn-secondary !py-2 !px-4 !text-sm">Cancel</button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] shadow-2xl p-6" style={{ background: "#0d0d14" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-muted-300 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-300">{label}</p>
      <p className={`text-sm font-medium ${color || "text-white"} truncate`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-muted-300 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input-field !py-2 !text-sm" />
    </div>
  );
}

function ActionBtn({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    green: "bg-green-900/30 text-green-400 hover:bg-green-900/50",
    blue: "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50",
    yellow: "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50",
    red: "bg-red-900/30 text-red-400 hover:bg-red-900/50",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>{label}</button>
  );
}
