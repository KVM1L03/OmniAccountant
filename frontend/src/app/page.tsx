"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileScan,
  Loader2,
  Inbox,
  XCircle,
  Upload,
  Paperclip,
  FileText,
} from "lucide-react";

const API = "http://localhost:8000";

type InvoiceResult = {
  invoice_id?: string;
  status: string;
  reason?: string;
  erp_expected_amount?: number | null;
  error?: string;
};

type WorkflowResult = Record<string, InvoiceResult>;

type PollResponse = {
  status: string;
  result?: WorkflowResult;
  message?: string;
};

// ---------- KPI Card ----------

type KpiCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  accent: "indigo" | "emerald" | "amber";
};

const ACCENT_STYLES: Record<KpiCardProps["accent"], string> = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive,
  accent,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`rounded-lg p-2.5 ring-1 ring-inset ${ACCENT_STYLES[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              trendPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

// ---------- Status Badge ----------

const STATUS_BADGE: Record<string, string> = {
  APPROVED:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DISCREPANCY:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  HUMAN_REVIEW_NEEDED:
    "bg-red-50 text-red-700 ring-red-600/20",
  SYSTEM_ERROR:
    "bg-red-100 text-red-800 ring-red-700/30",
  FAILED: "bg-red-100 text-red-800 ring-red-700/30",
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> =
  {
    APPROVED: CheckCircle2,
    DISCREPANCY: AlertTriangle,
    HUMAN_REVIEW_NEEDED: XCircle,
    SYSTEM_ERROR: XCircle,
    FAILED: XCircle,
  };

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_BADGE[status] ?? "bg-slate-100 text-slate-700 ring-slate-500/20";
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ---------- Results Table ----------

function ResultsTable({ result }: { result: WorkflowResult }) {
  const rows = Object.entries(result);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Invoice
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Expected Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map(([key, data]) => (
            <tr key={key} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-mono text-sm font-semibold text-slate-900">
                  {key.replace(/_/g, " ").toUpperCase()}
                </div>
                {data.invoice_id && (
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {data.invoice_id}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono">
                {data.erp_expected_amount != null
                  ? `$${data.erp_expected_amount.toFixed(2)}`
                  : "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={data.status} />
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                {data.reason ?? data.error ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Loading Skeleton ----------

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            Processing invoices
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Running DSPy extraction and ERP verification…
          </p>
        </div>
        <div className="w-full max-w-md space-y-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-slate-100 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Empty State ----------

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Inbox className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900">
        No batches yet
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Click <span className="font-semibold">Scan & Process Directory</span>{" "}
        above to reconcile the sample invoices.
      </p>
    </div>
  );
}

// ---------- Main Dashboard ----------

type UploadToast = { kind: "success" | "error"; message: string };

export default function DashboardPage() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState<UploadToast | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files));
    setUploadToast(null);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadToast(null);

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const res = await fetch(`${API}/upload-invoices`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`HTTP ${res.status}: ${detail}`);
      }

      const data: { count: number; files: string[] } = await res.json();
      setUploadToast({
        kind: "success",
        message: `Uploaded ${data.count} file${data.count !== 1 ? "s" : ""} successfully.`,
      });
      clearSelection();
    } catch (err) {
      setUploadToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!uploadToast) return;
    const t = setTimeout(() => setUploadToast(null), 4000);
    return () => clearTimeout(t);
  }, [uploadToast]);

  const startBatch = async () => {
    setError(null);
    setResult(null);
    setStatus(null);
    stopPolling();

    try {
      const res = await fetch(`${API}/reconcile-batch`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkflowId(data.workflow_id);
      setStatus("RUNNING");
      setPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start batch");
    }
  };

  useEffect(() => {
    if (!polling || !workflowId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/status/${workflowId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PollResponse = await res.json();
        setStatus(data.status);

        if (data.status === "COMPLETED" && data.result) {
          setResult(data.result);
          stopPolling();
        } else if (data.status === "FAILED") {
          setError(data.message ?? "Workflow failed");
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Polling error");
        stopPolling();
      }
    };

    intervalRef.current = setInterval(poll, 2000);
    return () => stopPolling();
  }, [polling, workflowId, stopPolling]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Invoice Reconciliation Hub
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Trigger batch reconciliation workflows and monitor their progress in
          real time.
        </p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <KpiCard
          icon={FileScan}
          label="Batches Processed"
          value="247"
          trend="+12% this week"
          trendPositive
          accent="indigo"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Success Rate"
          value="94.3%"
          trend="+2.1%"
          trendPositive
          accent="emerald"
        />
        <KpiCard
          icon={Clock}
          label="Pending Reviews"
          value="12"
          accent="amber"
        />
      </section>

      {/* Upload Section */}
      <section className="mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-lg bg-indigo-50 p-2 ring-1 ring-inset ring-indigo-100">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Upload Invoices
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Drop PDF files into the processing queue before running the
                batch.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="invoice-upload-input"
            />
            <label
              htmlFor="invoice-upload-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Paperclip className="h-4 w-4" />
              Select PDFs
            </label>

            <button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading || polling}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Selected Invoices
                </>
              )}
            </button>

            {selectedFiles.length > 0 && !uploading && (
              <button
                onClick={clearSelection}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <ul className="space-y-1">
                {selectedFiles.slice(0, 3).map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-2 text-xs text-slate-600 font-mono"
                  >
                    <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </li>
                ))}
                {selectedFiles.length > 3 && (
                  <li className="text-xs text-slate-500 italic pl-5">
                    +{selectedFiles.length - 3} more…
                  </li>
                )}
              </ul>
            </div>
          )}

          {uploadToast && (
            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${
                uploadToast.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadToast.kind === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="font-medium">{uploadToast.message}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Action Banner */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 p-8 shadow-lg shadow-indigo-600/20">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Ready to reconcile
              </h2>
              <p className="mt-1 text-sm text-indigo-100 max-w-lg">
                Scans <span className="font-mono">mock_data/invoices/</span>{" "}
                for PDF invoices, extracts structured data via DSPy, verifies
                against ERP, and routes decisions — all in parallel via
                Temporal.
              </p>
            </div>
            <button
              onClick={startBatch}
              disabled={polling}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-md hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {polling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Scan &amp; Process Directory
                </>
              )}
            </button>
          </div>
        </div>

        {workflowId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Workflow ID: {workflowId}
            {status && !result && <span>· Status: {status}</span>}
          </div>
        )}
      </section>

      {/* Results */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Batch Results
          </h2>
          {result && (
            <span className="text-xs text-slate-500">
              {Object.keys(result).length} invoice
              {Object.keys(result).length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-semibold">Error</div>
            <div className="mt-1 font-mono text-xs">{error}</div>
          </div>
        )}

        {polling && <LoadingSkeleton />}
        {!polling && result && <ResultsTable result={result} />}
        {!polling && !result && !error && <EmptyState />}
      </section>
    </div>
  );
}
