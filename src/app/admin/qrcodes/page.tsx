"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface QRCodeItem {
  id: string;
  token: string;
  status: "INACTIVE" | "ACTIVE" | "DISABLED";
  batchId: string | null;
  createdAt: string;
  activatedAt: string | null;
  worker: {
    firstName: string;
    lastName: string;
    phone: string;
    jobTitle: string | null;
    employerName: string | null;
  } | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

interface BatchInfo {
  batchId: string;
  count: number;
}

export default function AdminQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generateCount, setGenerateCount] = useState("100");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<QRCodeItem[]>([]);

  const fetchQRCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterBatch) params.set("batchId", filterBatch);
    params.set("page", String(page));
    params.set("limit", "50");

    try {
      const res = await fetch(`/api/admin/qrcodes?${params}`);
      const data = await res.json();
      setQrCodes(data.qrCodes);
      setStats(data.stats);
      setBatches(data.batches);
      setTotalPages(data.pagination.totalPages);
    } catch {
      console.error("Failed to fetch QR codes");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterBatch, page]);

  useEffect(() => {
    fetchQRCodes();
    setSelected(new Set());
    setExpandedId(null);
  }, [fetchQRCodes]);

  // Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === qrCodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(qrCodes.map((q) => q.id)));
    }
  }

  function openDeleteModal() {
    const targets = qrCodes.filter((q) => selected.has(q.id));
    if (targets.length === 0) return;
    setDeleteTargets(targets);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/qrcodes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTargets.map((t) => t.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const pairedCount = deleteTargets.filter((t) => t.worker).length;
      setMessage(
        `Deleted ${data.deleted} QR code(s)${pairedCount > 0 ? ` and ${data.usersDeleted} paired user(s)` : ""}`
      );
      setSelected(new Set());
      setShowDeleteModal(false);
      setDeleteTargets([]);
      fetchQRCodes();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenerate() {
    const count = parseInt(generateCount);
    if (!count || count < 1 || count > 5000) {
      setMessage("Enter a number between 1 and 5000");
      return;
    }

    setGenerating(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/qrcodes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage(`Generated ${data.count} QR codes (Batch: ${data.batchId})`);
      setPage(1);
      fetchQRCodes();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function overlayLogo(
    baseDataUrl: string,
    size: number
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 0, 0, size, size);

        const logo = new Image();
        logo.onload = () => {
          const logoSize = Math.round(size * 0.2);
          const padding = 12;
          const bgSize = logoSize + padding * 2;
          const bgX = (size - bgSize) / 2;
          const bgY = (size - bgSize) / 2;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(bgX, bgY, bgSize, bgSize);
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL("image/png"));
        };
        logo.onerror = () => resolve(baseDataUrl);
        logo.crossOrigin = "anonymous";
        logo.src = "/logo.png";
      };
      qrImg.src = baseDataUrl;
    });
  }

  async function handleDownloadBatch(batchId: string) {
    setDownloading(true);
    setMessage("Generating QR codes with logo... this may take a moment.");

    try {
      const res = await fetch(
        `/api/admin/qrcodes/download?batchId=${encodeURIComponent(batchId)}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Process each QR code with logo overlay
      const processed: { token: string; dataUrl: string }[] = [];
      for (const code of data.codes) {
        const withLogo = await overlayLogo(code.dataUrl, 800);
        processed.push({ token: code.token, dataUrl: withLogo });
      }

      // Download each as PNG (or bundle info)
      if (processed.length === 1) {
        const link = document.createElement("a");
        link.download = `slip-qr-${processed[0].token}.png`;
        link.href = processed[0].dataUrl;
        link.click();
      } else {
        // Create a simple HTML page with all QR codes for printing/saving
        const html = `<!DOCTYPE html>
<html><head><title>Slip QR Codes - ${batchId}</title>
<style>
  body { margin: 0; padding: 20px; background: #fff; font-family: sans-serif; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .qr { text-align: center; page-break-inside: avoid; padding: 10px; border: 1px solid #eee; }
  .qr img { width: 180px; height: 180px; }
  .qr p { margin: 5px 0 0; font-size: 11px; color: #666; font-family: monospace; }
  h1 { font-size: 18px; margin-bottom: 20px; }
  @media print { .no-print { display: none; } }
</style></head><body>
<h1>Slip QR Codes — Batch ${batchId}</h1>
<p class="no-print">${processed.length} codes · Right-click any image to save individually, or Print (Ctrl+P) to save as PDF</p>
<div class="grid">
${processed.map((c) => `<div class="qr"><img src="${c.dataUrl}" /><p>${c.token}</p></div>`).join("\n")}
</div></body></html>`;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }

      setMessage(`Downloaded ${processed.length} QR codes with logo`);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadSingle(token: string) {
    try {
      const res = await fetch(
        `/api/admin/qrcodes/download?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // This returns a single code in the batch format
      // Actually for single, let's use the dataUrl approach
      const QRCodeLib = (await import("qrcode")).default;
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const url = `${baseUrl}/qr/${token}`;

      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });

      const withLogo = await overlayLogo(dataUrl, 800);
      const link = document.createElement("a");
      link.download = `slip-qr-${token}.png`;
      link.href = withLogo;
      link.click();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-400 bg-green-400/10";
      case "INACTIVE":
        return "text-yellow-400 bg-yellow-400/10";
      case "DISABLED":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/40 bg-white/5";
    }
  };

  return (
    <div className="space-y-8">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">QR Codes</h1>
        <p className="text-muted mt-1">
          Generate, manage, and download QR codes for workers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card !py-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-muted mt-1">Total Codes</div>
        </div>
        <div className="card !py-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-xs text-muted mt-1">Activated</div>
        </div>
        <div className="card !py-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.inactive}</div>
          <div className="text-xs text-muted mt-1">Available</div>
        </div>
      </div>

      {/* Generate Section */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Generate New Batch</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted mb-1">
              Number of QR codes
            </label>
            <input
              type="number"
              min="1"
              max="5000"
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              className="input-field"
              placeholder="100"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary !py-3 !px-8 whitespace-nowrap"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>
        {message && (
          <p className="mt-3 text-sm text-accent">{message}</p>
        )}
      </div>

      {/* Batches */}
      {batches.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">Batches</h2>
          <div className="space-y-2">
            {batches.map((batch) => (
              <div
                key={batch.batchId}
                className="flex items-center justify-between p-3 bg-white/[0.03] rounded"
              >
                <div>
                  <span className="text-sm font-mono text-white/70">
                    {batch.batchId}
                  </span>
                  <span className="text-xs text-muted ml-3">
                    {batch.count} codes
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFilterBatch(batch.batchId!);
                      setPage(1);
                    }}
                    className="text-xs text-accent hover:text-accent-300 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadBatch(batch.batchId!)}
                    disabled={downloading}
                    className="text-xs text-accent hover:text-accent-300 transition-colors"
                  >
                    {downloading ? "..." : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Selection Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="input-field !w-auto"
        >
          <option value="">All statuses</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        {filterBatch && (
          <button
            onClick={() => {
              setFilterBatch("");
              setPage(1);
            }}
            className="btn-secondary !py-2 !px-3 !text-xs"
          >
            Clear batch filter ✕
          </button>
        )}

        {/* Selection action bar */}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-white/60">
              {selected.size} selected
            </span>
            <button
              onClick={openDeleteModal}
              className="text-sm font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-4 py-2 rounded transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* QR Code List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted animate-pulse">Loading...</div>
        ) : qrCodes.length === 0 ? (
          <div className="p-8 text-center text-muted">
            No QR codes found. Generate a batch to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === qrCodes.length && qrCodes.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-accent w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden sm:table-cell">
                    Worker
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden md:table-cell">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {qrCodes.map((qr) => (
                  <>
                    <tr
                      key={qr.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        selected.has(qr.id) ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(qr.id)}
                          onChange={() => toggleSelect(qr.id)}
                          className="accent-accent w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-white text-xs">{qr.token}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${statusColor(
                            qr.status
                          )}`}
                        >
                          {qr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {qr.worker ? (
                          <div>
                            <span className="text-white text-xs">
                              {qr.worker.firstName} {qr.worker.lastName}
                            </span>
                            {qr.worker.employerName && (
                              <span className="text-muted text-xs ml-2">
                                @ {qr.worker.employerName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted">
                        {new Date(qr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === qr.id ? null : qr.id)
                            }
                            className="text-xs text-white/50 hover:text-white transition-colors"
                          >
                            {expandedId === qr.id ? "Hide" : "View"}
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(qr.token)}
                            className="text-xs text-accent hover:text-accent-300 transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === qr.id && (
                      <tr key={`${qr.id}-detail`} className="bg-white/[0.02]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-muted block mb-1">QR Code ID</span>
                              <span className="text-white font-mono">{qr.id}</span>
                            </div>
                            <div>
                              <span className="text-muted block mb-1">Token</span>
                              <span className="text-white font-mono">{qr.token}</span>
                            </div>
                            <div>
                              <span className="text-muted block mb-1">Status</span>
                              <span
                                className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${statusColor(
                                  qr.status
                                )}`}
                              >
                                {qr.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block mb-1">Batch</span>
                              <span className="text-white font-mono">
                                {qr.batchId || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block mb-1">Created</span>
                              <span className="text-white">
                                {new Date(qr.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block mb-1">Activated</span>
                              <span className="text-white">
                                {qr.activatedAt
                                  ? new Date(qr.activatedAt).toLocaleString()
                                  : "—"}
                              </span>
                            </div>

                            {qr.worker && (
                              <>
                                <div className="sm:col-span-2 lg:col-span-3 border-t border-white/[0.06] pt-3 mt-1">
                                  <span className="text-muted block mb-2 text-[11px] uppercase tracking-wider font-semibold">
                                    Paired Worker
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted block mb-1">Name</span>
                                  <span className="text-white">
                                    {qr.worker.firstName} {qr.worker.lastName}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted block mb-1">Phone</span>
                                  <span className="text-white font-mono">
                                    {qr.worker.phone || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted block mb-1">Job</span>
                                  <span className="text-white">
                                    {qr.worker.jobTitle || "—"}
                                    {qr.worker.employerName &&
                                      ` @ ${qr.worker.employerName}`}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-2 lg:col-span-3 border-t border-white/[0.06] pt-3 mt-1">
                              <span className="text-muted block mb-1">QR URL</span>
                              <span className="text-accent font-mono text-[11px] break-all">
                                {typeof window !== "undefined"
                                  ? `${window.location.origin}/qr/${qr.token}`
                                  : `/qr/${qr.token}`}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary !py-2 !px-4 !text-xs"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary !py-2 !px-4 !text-xs"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface border border-white/[0.08] rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Are you sure?
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  This action cannot be undone. You are about to delete:
                </p>
              </div>
            </div>

            <div className="bg-white/[0.03] rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">QR codes</span>
                <span className="text-white font-bold">{deleteTargets.length}</span>
              </div>
              {deleteTargets.some((t) => t.worker) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-red-400">Paired users that will also be deleted</span>
                    <span className="text-red-400 font-bold">
                      {deleteTargets.filter((t) => t.worker).length}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-2 mt-2">
                    <span className="text-muted text-xs">Users to be removed:</span>
                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {deleteTargets
                        .filter((t) => t.worker)
                        .map((t) => (
                          <div key={t.id} className="text-xs text-white/70">
                            {t.worker!.firstName} {t.worker!.lastName}
                            {t.worker!.phone && (
                              <span className="text-muted ml-2">{t.worker!.phone}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargets([]);
                }}
                disabled={deleting}
                className="btn-secondary flex-1 !py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 !py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
