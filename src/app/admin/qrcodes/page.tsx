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
  const [generateCount, setGenerateCount] = useState("100");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [fetchQRCodes]);

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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
                  <tr key={qr.id} className="hover:bg-white/[0.02] transition-colors">
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
                      <button
                        onClick={() => handleDownloadSingle(qr.token)}
                        className="text-xs text-accent hover:text-accent-300 transition-colors"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
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
    </div>
  );
}
