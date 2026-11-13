import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ApAgingSummary, formatUsd } from "@/types/apInvoices";

const TILES: { key: keyof ApAgingSummary; label: string }[] = [
  { key: "open", label: "Open balance" },
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30 days" },
  { key: "d31_60", label: "31–60 days" },
  { key: "d61_90", label: "61–90 days" },
  { key: "d90plus", label: "90+ days" },
];

export const AgingTiles = ({ aging, loading = false }: { aging: ApAgingSummary; loading?: boolean }) => {
  const isLight = useAtomValue(themeAtom) === "light";

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Aging summary">
      {TILES.map(({ key, label }) => (
        <div
          key={key}
          className={`flex-[1_1_150px] rounded-xl border px-4 py-3.5 backdrop-blur-md ${
            key === "open" ? "bg-purple-600/30 border-purple-300/50" : "bg-white/10 border-purple-300/30"
          }`}
        >
          <span
            className={`block text-xs font-semibold uppercase tracking-wider ${
              isLight ? "text-gray-500" : "text-purple-200/80"
            }`}
          >
            {label}
          </span>
          <strong className="block mt-1 text-[22px] leading-tight font-semibold tabular-nums text-white">
            {loading ? "—" : formatUsd(aging[key])}
          </strong>
        </div>
      ))}
    </div>
  );
};

export default AgingTiles;
