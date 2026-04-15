const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-[#9df5bd] text-[#00522f]",
  FORCE_APPROVED: "bg-[#9df5bd] text-[#00522f]",
  DISCREPANCY: "bg-[#ffdad6] text-[#93000a]",
  HUMAN_REVIEW_NEEDED: "bg-[#ffdad6] text-[#93000a]",
  SYSTEM_ERROR: "bg-[#ffdad6] text-[#93000a]",
  FAILED: "bg-[#ffdad6] text-[#93000a]",
  REJECTED: "bg-[#ffdad6] text-[#93000a]",
};

export type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
