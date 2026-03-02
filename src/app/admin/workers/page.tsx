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

type ModalType = "detail" | "edit" | "reject" | "rejectDoc" | "deactivate" | "delete" | null;

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
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workers <span className="text-slate-400 font-normal text-base">({workers.length})</span></h1>
          {pending > 0 && (
            <p className="text-sm text-amber-600 mt-0.5 font-medium">{pending} pending approval</p>
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
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64"
        />
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Job</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Tips</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">No workers found</td></tr>
                )}
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <button onClick={() => openModal(w, "detail")} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left">
                        {w.user.firstName} {w.user.lastName}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-600 text-xs">{w.user.email || "—"}</div>
                      <div className="text-slate-400 text-xs">{w.user.phone || "—"}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {w.jobTitle || "—"}{w.employerName ? ` @ ${w.employerName}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-600 text-xs">
                      R{Number(w.walletBalance).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500 text-xs">{w._count.tips}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        w.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}>
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!w.isActive && (
                          <button onClick={() => openModal(w, "detail")} className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                            Review
                          </button>
                        )}
                        <button onClick={() => openModal(w, "edit")} className="px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-100 transition-colors font-medium">Edit</button>
                        {w.isActive ? (
                          <button onClick={() => openModal(w, "deactivate")} className="px-2 py-1 rounded-md text-xs text-amber-600 hover:bg-amber-50 transition-colors font-medium">Deactivate</button>
                        ) : (
                          <button onClick={() => openModal(w, "detail")} className="px-2 py-1 rounded-md text-xs text-blue-600 hover:bg-blue-50 transition-colors font-medium">Activate</button>
                        )}
                        <button onClick={() => openModal(w, "delete")} className="px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors font-medium">Delete</button>
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
              <InfoRow label="Status" value={selected.isActive ? "Active" : "Inactive"} color={selected.isActive ? "text-emerald-600" : "text-red-600"} />
              <InfoRow label="Wallet Balance" value={`R${Number(selected.walletBalance).toFixed(2)}`} color="text-blue-600" />
              <InfoRow label="Available Balance" value={`R${Number(selected.availableBalance).toFixed(2)}`} color="text-blue-600" />
              <InfoRow label="Total Tips" value={String(selected._count.tips)} />
              <InfoRow label="Withdrawals" value={String(selected._count.withdrawals)} />
              <InfoRow label="Bank" value={selected.bankName || "—"} />
              <InfoRow label="Account No" value={selected.bankAccountNo || "—"} />
              <InfoRow label="Branch Code" value={selected.bankBranchCode || "—"} />
              <InfoRow label="Doc Status" value={selected.docStatus} />
              <InfoRow label="QR Codes" value={String(selected.qrCodes?.length || 0)} />
              <InfoRow label="Joined" value={new Date(selected.user.createdAt).toLocaleDateString("en-ZA")} />
            </div>
            {selected.docStatus === "PENDING_REVIEW" && (
              <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 mb-2">
                <p className="text-xs font-semibold text-amber-700 mb-2">FICA Documents Pending Review</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction("approveDoc")}
                    disabled={saving}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border border-emerald-200"
                  >
                    ✓ Approve Documents
                  </button>
                  <button
                    onClick={() => { setModal("rejectDoc" as ModalType); }}
                    disabled={saving}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors border border-red-200"
                  >
                    ✗ Reject Documents
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2 flex-wrap">
              {!selected.isActive && (
                <ActionBtn color="green" label="✓ Approve Account" onClick={() => doAction("approve")} />
              )}
              {!selected.isActive && (
                <ActionBtn color="red" label="✗ Reject Account" onClick={() => { setModal("reject"); }} />
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
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Bank Details</p>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Bank" value={editForm.bankName || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankName: v }))} />
                <Field label="Account No" value={editForm.bankAccountNo || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankAccountNo: v }))} />
                <Field label="Branch Code" value={editForm.bankBranchCode || ""} onChange={(v) => setEditForm((p) => ({ ...p, bankBranchCode: v }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={doEdit} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">{saving ? "Saving…" : "Save Changes"}</button>
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ── Deactivate Modal ── */}
      {modal === "deactivate" && selected && (
        <ModalWrapper onClose={closeModal} title="Deactivate Worker">
          <p className="text-slate-600 text-sm mb-4">Deactivate <strong className="text-slate-800">{selected.user.firstName} {selected.user.lastName}</strong>? Their QR code will stop accepting tips.</p>
          <textarea
            placeholder="Reason (optional, will be sent to worker via SMS)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => doAction("deactivate")} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition-colors">{saving ? "Saving…" : "Deactivate"}</button>
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Reject Modal ── */}
      {modal === "reject" && selected && (
        <ModalWrapper onClose={closeModal} title="Reject Application">
          <p className="text-slate-600 text-sm mb-4">Reject <strong className="text-slate-800">{selected.user.firstName} {selected.user.lastName}</strong>?</p>
          <textarea
            placeholder="Reason (optional, will be sent to worker via SMS)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => doAction("reject")} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors">{saving ? "Saving…" : "Reject"}</button>
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Reject Documents Modal ── */}
      {modal === "rejectDoc" && selected && (
        <ModalWrapper onClose={closeModal} title="Reject FICA Documents">
          <p className="text-slate-600 text-sm mb-4">Reject documents for <strong className="text-slate-800">{selected.user.firstName} {selected.user.lastName}</strong>? They will be asked to re-upload.</p>
          <textarea
            placeholder="Reason (will be sent to worker via SMS)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => doAction("rejectDoc")} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors">{saving ? "Saving…" : "Reject Documents"}</button>
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Delete Modal ── */}
      {modal === "delete" && selected && (
        <ModalWrapper onClose={closeModal} title="Delete Worker">
          <p className="text-slate-600 text-sm mb-2">Permanently delete <strong className="text-slate-800">{selected.user.firstName} {selected.user.lastName}</strong>?</p>
          <p className="text-red-600 text-xs mb-4">This will delete all their data including tips, withdrawals and QR codes. This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={doDelete} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">{saving ? "Deleting…" : "Delete Permanently"}</button>
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
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
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color || "text-slate-800"} truncate`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function ActionBtn({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    yellow: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200",
    red: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${colors[color]}`}>{label}</button>
  );
}
