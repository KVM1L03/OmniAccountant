import type { ReviewTarget, WorkflowResult } from "@/types";

import { InvoiceRow } from "./InvoiceRow";

export type ResultsTableProps = {
  result: WorkflowResult;
  onReview?: (row: ReviewTarget) => void;
};

export function ResultsTable({ result, onReview }: ResultsTableProps) {
  const rows = Object.entries(result);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f2f4f6]">
            <th className="px-6 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-6 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-right">
              Expected Amount
            </th>
            <th className="px-6 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
              Status
            </th>
            <th className="px-6 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
              Reason
            </th>
            {onReview && (
              <th className="px-6 py-3 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider text-center">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(([key, data]) => (
            <InvoiceRow
              key={key}
              rowKey={key}
              data={data}
              onReview={onReview}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
