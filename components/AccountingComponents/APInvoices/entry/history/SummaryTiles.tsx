import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { ApVendorSummary, formatUsd } from "@/types/apInvoices";

export const SummaryTiles = ({ summary }: { summary: ApVendorSummary }) => {
  const isLight = useAtomValue(themeAtom) === "light";

  const tiles = [
    { label: "Invoices this year", value: String(summary.invoicesThisYear) },
    { label: "Paid this year", value: formatUsd(summary.paidThisYear) },
    { label: "Open", value: formatUsd(summary.openBalance) },
    { label: "Avg. days to pay", value: summary.avgDaysToPay == null ? "—" : String(summary.avgDaysToPay) },
  ];

  return (
    <div role="group" aria-label="Vendor summary" className="flex flex-wrap gap-3">
      {tiles.map(({ label, value }) => (
        <div key={label} className="flex-[1_1_160px] rounded-xl border border-purple-300/20 bg-white/5 px-3.5 py-3">
          <span
            className={cn(
              "block text-xs font-semibold uppercase tracking-wider",
              isLight ? "text-gray-500" : "text-purple-200/80",
            )}
          >
            {label}
          </span>
          <strong className="mt-0.5 block text-xl font-semibold tabular-nums text-white">{value}</strong>
        </div>
      ))}
    </div>
  );
};

export default SummaryTiles;
