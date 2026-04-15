import { Eye, FileText } from "lucide-react";

import type { InvoiceResult, ReviewTarget } from "@/types";

import { StatusBadge } from "./StatusBadge";

export type InvoiceRowProps = {
  rowKey: string;
  data: InvoiceResult;
  onReview?: (row: ReviewTarget) => void;
};

function formatAmount(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function InvoiceRow({ rowKey, data, onReview }: InvoiceRowProps) {
  const displayId =
    data.invoice_id ?? rowKey.replace(/_/g, " ").toUpperCase();
  const reviewable =
    onReview !== undefined &&
    data.status === "DISCREPANCY" &&
    data.id !== undefined;

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#9df5bd] flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-[#00522f]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#191c1e] truncate">
              {displayId}
            </div>
            {data.invoice_id && (
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                {rowKey.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium text-slate-700 font-mono">
        {formatAmount(data.erp_expected_amount)}
      </td>
      <td className="px-6 py-4 text-center">
        <StatusBadge status={data.status} />
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
        {data.reason ?? data.error ?? (
          <span className="text-slate-400 italic">—</span>
        )}
      </td>
      {onReview && (
        <td className="px-6 py-4 text-center">
          {reviewable && data.id ? (
            <button
              type="button"
              onClick={() => onReview({ ...data, id: data.id as string })}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#00502e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#006b3f] transition-colors"
            >
              <Eye className="h-3 w-3" />
              Review
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      )}
    </tr>
  );
}
