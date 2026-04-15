"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const atFirst = currentPage <= 1;
  const atLast = currentPage >= totalPages;
  const buttonBase =
    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors";
  const buttonEnabled =
    "text-[#00502e] hover:bg-[#9df5bd]/40 border border-slate-200";
  const buttonDisabled =
    "text-slate-300 border border-slate-100 cursor-not-allowed";

  return (
    <nav
      aria-label="Batch history pagination"
      className="flex items-center justify-between gap-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || atFirst}
        className={`${buttonBase} ${disabled || atFirst ? buttonDisabled : buttonEnabled}`}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>

      <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
        Page <span className="text-[#191c1e] font-bold">{currentPage}</span> of{" "}
        <span className="text-[#191c1e] font-bold">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || atLast}
        className={`${buttonBase} ${disabled || atLast ? buttonDisabled : buttonEnabled}`}
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
