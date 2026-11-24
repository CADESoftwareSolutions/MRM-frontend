import { memo, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { cn } from "@/lib/utils";
import { RevenueLine, formatMoney, formatProdDate } from "@/types/revenue";
import { lineIssues } from "./checkDraft";
import { NUM_CLASS, useEntryTheme } from "./entryTheme";
import { formatDecimal } from "./NumberInput";

export interface LineRowProps {
  line: RevenueLine;
  lineNumber: number;
  expanded: boolean;
  readOnly: boolean;
  /** False when the table is too narrow for the owner volume, taxes and deducts columns. */
  allColumns: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/** How many columns a line row has, for the rows that span the whole table. */
export const lineColumnCount = (allColumns: boolean) => (allColumns ? 10 : 7);

const formatQuantity = (value: number) => formatDecimal(value, 2, 4);

/** One detail line, collapsed: what it is and the owner's share. The gross amounts are in its editor. */
export const LineRow = memo(function LineRow({
  line,
  lineNumber,
  expanded,
  readOnly,
  allColumns,
  onToggle,
  onRemove,
}: LineRowProps) {
  const theme = useEntryTheme();
  const { types } = useTaxDeductTypes();
  const issues = useMemo(() => lineIssues(line, types), [line, types]);

  const td = "px-3 py-2.5 h-12 whitespace-nowrap";
  const own = cn(td, NUM_CLASS, "text-white", theme.ownerTint);
  const toggleLabel = `${expanded ? "Hide" : "Show"} details, taxes and deducts, line ${lineNumber}`;

  return (
    <tr
      onClick={() => onToggle(line.id)}
      className={cn("cursor-pointer border-b transition-colors", theme.rowBorder, theme.rowHover)}
    >
      <td className="w-11 px-2 py-2">
        <button
          type="button"
          aria-label={toggleLabel}
          data-line-toggle={line.id}
          aria-expanded={expanded}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(line.id);
          }}
          className={cn(
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-md",
            theme.iconButton,
            expanded && (theme.isLight ? "bg-purple-100" : "bg-purple-500/25"),
          )}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </td>
      <td className={cn(td, "tabular-nums text-white")}>
        <span className="inline-flex items-center gap-1.5">
          {line.prodDate ? formatProdDate(line.prodDate) : <span className="text-white/50">—</span>}
          {issues.length > 0 && (
            <span role="img" aria-label={`Needs a look: ${issues.join(" ")}`} title={issues.join("\n")}>
              <AlertTriangle className={cn("size-4", theme.warnText)} />
            </span>
          )}
        </span>
      </td>
      <td className={cn(td, "text-white")}>{line.productCode || <span className="text-white/50">—</span>}</td>
      <td className={cn(td, "text-white")}>{line.interestType || <span className="text-white/50">—</span>}</td>
      {allColumns && <td className={own}>{formatQuantity(line.ownerVolume)}</td>}
      <td className={own}>{formatMoney(line.ownerValue)}</td>
      {allColumns && <td className={own}>{formatMoney(line.ownerTaxes)}</td>}
      {allColumns && <td className={own}>{formatMoney(line.ownerDeducts)}</td>}
      <td className={cn(own, "font-semibold")}>{formatMoney(line.ownerNetValue)}</td>
      <td className="w-11 px-1.5 py-2">
        {!readOnly && (
          <button
            type="button"
            aria-label={`Delete line ${lineNumber}`}
            title="Delete line"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(line.id);
            }}
            className={cn("rounded-md p-2 cursor-pointer", theme.dangerIconButton)}
          >
            <Trash2 className="size-4" strokeWidth={2.5} />
          </button>
        )}
      </td>
    </tr>
  );
});

export default LineRow;
