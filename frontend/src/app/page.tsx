"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API = "http://localhost:8080";

type InvoiceResult = {
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

const STATUS_STYLES: Record<string, string> = {
  APPROVED:
    "border-green-500 bg-green-950/40 text-green-300",
  DISCREPANCY:
    "border-amber-500 bg-amber-950/40 text-amber-300",
  HUMAN_REVIEW_NEEDED:
    "border-red-500 bg-red-950/40 text-red-300",
  SYSTEM_ERROR:
    "border-red-700 bg-red-950/60 text-red-400",
  FAILED:
    "border-red-700 bg-red-950/60 text-red-400",
};

const STATUS_BADGES: Record<string, string> = {
  APPROVED: "bg-green-500/20 text-green-400 ring-green-500/30",
  DISCREPANCY: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  HUMAN_REVIEW_NEEDED: "bg-red-500/20 text-red-400 ring-red-500/30",
  SYSTEM_ERROR: "bg-red-700/20 text-red-300 ring-red-700/30",
  FAILED: "bg-red-700/20 text-red-300 ring-red-700/30",
};

function Badge({ status }: { status: string }) {
  const cls = STATUS_BADGES[status] ?? "bg-zinc-700 text-zinc-300 ring-zinc-600";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InvoiceCard({
  id,
  data,
}: {
  id: string;
  data: InvoiceResult;
}) {
  const border =
    STATUS_STYLES[data.status] ?? "border-zinc-700 bg-zinc-900 text-zinc-300";
  return (
    <div className={`rounded-lg border p-5 ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-sm font-semibold tracking-wide">
          {id.replace(/_/g, " ").toUpperCase()}
        </h3>
        <Badge status={data.status} />
      </div>
      {data.reason && (
        <p className="text-sm opacity-80 leading-relaxed">{data.reason}</p>
      )}
      {data.erp_expected_amount != null && (
        <p className="mt-2 text-xs opacity-60">
          ERP expected: <span className="font-mono">${data.erp_expected_amount.toFixed(2)}</span>
        </p>
      )}
      {data.error && (
        <p className="mt-2 text-xs text-red-400 font-mono">{data.error}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

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
    <div className="flex flex-col flex-1 items-center bg-zinc-950 text-zinc-100 font-sans px-6 py-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Invoice Reconciler
        </h1>
        <p className="text-zinc-400 mb-8">
          Trigger a batch reconciliation workflow and view results in real time.
        </p>

        <button
          onClick={startBatch}
          disabled={polling}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {polling ? "Processing..." : "Start Batch Reconciliation"}
        </button>

        {workflowId && (
          <p className="mt-4 text-xs text-zinc-500 font-mono">
            Workflow: {workflowId}
          </p>
        )}

        {status && !result && !error && (
          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-400">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Status: {status}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {Object.entries(result).map(([key, data]) => (
              <InvoiceCard key={key} id={key} data={data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
