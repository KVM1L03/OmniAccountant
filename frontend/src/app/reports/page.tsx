import type { Metadata } from "next";
import Link from "next/link";

import { FinOpsChartLazy } from "@/components/Reports/FinOpsChartLazy";
import { FinOpsSummary } from "@/components/Reports/FinOpsSummary";
import { ReportHeader } from "@/components/Reports/ReportHeader";
import { summarizeFinOps } from "@/components/Reports/mockData";
import { getFinOpsTelemetry } from "@/app/actions";
import { isDemoMode } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Reports — FinOps & Telemetry",
  description: "LLM FinOps telemetry: API spend vs. manual labor savings",
};

export default async function ReportsPage() {
  if (isDemoMode()) {
    return (
      <div className="bg-[#f7f9fb] min-h-full text-[#191c1e] font-['Inter',system-ui,sans-serif]">
        <div className="px-10 py-10 max-w-[1600px] mx-auto">
          <ReportHeader
            title="FinOps & Telemetry"
            description="LLM cost observability and ROI analysis. Track API spend against automation savings to validate the AI pipeline's business impact."
          />

          <section
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-[#3f3420] shadow-[0_12px_40px_rgba(25,28,30,0.04)] max-w-2xl"
          >
            <p className="font-semibold text-[#191c1e]">Tryb demo</p>
            <p className="mt-2 leading-relaxed">
              Sekcja <span className="font-semibold">Reports</span> nie jest
              dostępna w tej wersji demonstracyjnej — raporty FinOps i telemetria
              wiążą się z wdrożeniem obserwowalności (np. Langfuse), którego nie
              udostępniamy publicznie w sandboxie dla rekruterów.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-sm font-semibold text-[#00502e] underline underline-offset-4 hover:text-[#003d23]"
            >
              Wróć do pulpitu
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const data = await getFinOpsTelemetry(7);
  const stats = summarizeFinOps(data);

  return (
    <div className="bg-[#f7f9fb] min-h-full text-[#191c1e] font-['Inter',system-ui,sans-serif]">
      <div className="px-10 py-10 max-w-[1600px] mx-auto">
        <ReportHeader
          title="FinOps & Telemetry"
          description="LLM cost observability and ROI analysis. Track API spend against automation savings to validate the AI pipeline's business impact."
        />

        <section className="space-y-8">
          <FinOpsSummary stats={stats} />
          <FinOpsChartLazy data={data} />
        </section>
      </div>
    </div>
  );
}
