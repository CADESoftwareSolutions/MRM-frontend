import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { cn } from "@/lib/utils";
import { formatAccountNumber } from "@/types/chartOfAccounts";
import {
  RevenuePropertyGroup,
  RevenueCheckStatus,
  RevenueCheckTotals,
  RevenueLine,
  formatMoney,
  groupLinesByProperty,
  incomeAccountForProduct,
} from "@/types/revenue";
import { NUM_CLASS, SECTION_HEADER_CLASS, useEntryTheme } from "./entryTheme";
import { LineEditor } from "./LineEditor";
import { LineRow } from "./LineRow";
import type { SuggestOption } from "./SuggestInput";
import { WellLinkPicker, type LinkedWell } from "./WellLinkPicker";

export interface DetailLinesTableProps {
  lines: RevenueLine[];
  totals: RevenueCheckTotals;
  readOnly: boolean;
  status: RevenueCheckStatus;
  operatorName: string;
  /** Lines open for editing on first render, e.g. a new check's blank line. */
  initialExpanded?: string[];
  /** Adds a blank line and returns its id. */
  onAddLine: () => string;
  onChangeLine: (id: string, patch: Partial<RevenueLine>) => void;
  onRemoveLine: (id: string) => void;
  /** Links (or with null, unlinks) every line in the property group with this key. */
  onLinkWell: (operatorCc: string, well: LinkedWell | null) => void;
}

const BASE_PRODUCTS = ["OIL", "GAS", "NGL"];
const BASE_INTERESTS = ["Royalty", "Overriding Royalty", "Working Interest"];
const COLUMN_COUNT = 17;

const uniqueKey = (values: string[], base: string[]) =>
  Array.from(
    new Set([...base, ...values.map((v) => v.trim()).filter(Boolean)]),
  ).join("\u0000");

type TableRow =
  | { kind: "group"; group: RevenuePropertyGroup }
  | { kind: "line"; line: RevenueLine };

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** The check's detail lines grouped by property (Operator CC), each group linked to a well. */
export const DetailLinesTable = ({
  lines,
  totals,
  readOnly,
  status,
  operatorName,
  initialExpanded = [],
  onAddLine,
  onChangeLine,
  onRemoveLine,
  onLinkWell,
}: DetailLinesTableProps) => {
  const theme = useEntryTheme();
  const { getAccount } = useChartOfAccounts();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialExpanded),
  );
  const [focusLineId, setFocusLineId] = useState<string | null>(null);
  const [focusAfterRemove, setFocusAfterRemove] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const groups = useMemo(() => groupLinesByProperty(lines), [lines]);
  const rows = useMemo<TableRow[]>(
    () =>
      groups.flatMap((group) => [
        { kind: "group" as const, group },
        ...group.lines.map((line) => ({ kind: "line" as const, line })),
      ]),
    [groups],
  );
  const lineNumbers = useMemo(
    () => new Map(lines.map((line, index) => [line.id, index + 1])),
    [lines],
  );
  const allExpanded =
    lines.length > 0 && lines.every((line) => expanded.has(line.id));

  const productKey = uniqueKey(
    lines.map((line) => line.productCode),
    BASE_PRODUCTS,
  );
  const productOptions = useMemo<SuggestOption[]>(
    () =>
      productKey.split("\u0000").map((code) => {
        const account = getAccount(incomeAccountForProduct(code));
        return {
          value: code,
          hint: account ? formatAccountNumber(account) : undefined,
        };
      }),
    [productKey, getAccount],
  );
  const interestKey = uniqueKey(
    lines.map((line) => line.interestType),
    BASE_INTERESTS,
  );
  const interestOptions = useMemo<SuggestOption[]>(
    () => interestKey.split("\u0000").map((value) => ({ value })),
    [interestKey],
  );

  useEffect(() => {
    if (!focusLineId || !expanded.has(focusLineId)) return;
    sectionRef.current
      ?.querySelector<HTMLElement>(`[id="rl-${focusLineId}-cc"]`)
      ?.focus();
    setFocusLineId(null);
  }, [focusLineId, expanded]);

  useEffect(() => {
    if (focusAfterRemove === null) return;
    const root = sectionRef.current;
    const nextLine = root?.querySelector<HTMLElement>(
      `[data-line-toggle="${focusAfterRemove}"]`,
    );
    (nextLine ?? root?.querySelector<HTMLElement>("[data-add-line]"))?.focus();
    setFocusAfterRemove(null);
  }, [focusAfterRemove, lines]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeLine = useCallback(
    (id: string) => {
      const order = rows.flatMap((row) =>
        row.kind === "line" ? [row.line.id] : [],
      );
      const index = order.indexOf(id);
      setFocusAfterRemove(order[index + 1] ?? order[index - 1] ?? "");
      onRemoveLine(id);
    },
    [rows, onRemoveLine],
  );

  const toggleAll = () => {
    setExpanded(
      allExpanded ? new Set() : new Set(lines.map((line) => line.id)),
    );
  };

  const addLine = () => {
    const id = onAddLine();
    setExpanded((prev) => new Set(prev).add(id));
    setFocusLineId(id);
  };

  const th = cn(
    "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap",
    theme.headerText,
  );
  const groupTh = cn(
    "px-2.5 pt-2.5 text-center text-[11px] font-semibold uppercase tracking-wider",
    theme.headerText,
  );
  const foot = cn(
    "px-2.5 py-2 h-[42px] whitespace-nowrap font-semibold text-white",
    NUM_CLASS,
    theme.ownerTint,
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="rc-detail-lines"
      className="flex flex-col gap-2.5 border-t border-purple-300/30 pt-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="rc-detail-lines" className={SECTION_HEADER_CLASS}>
          Detail Lines
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!lines.length}
            onClick={toggleAll}
            className={cn("cursor-pointer", theme.outlineButton)}
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-add-line
              onClick={addLine}
              className={cn(
                "cursor-pointer border-dashed",
                theme.outlineButton,
              )}
            >
              <Plus className="size-3.5" />
              Add Line
            </Button>
          )}
        </div>
      </div>

      {/* The 1400px table scrolls inside this box. As a size container it can't widen the page,
          and the property headers and line editors size to it (cqw) and stick to its left edge,
          so they stay in view however far the numbers are scrolled. relative keeps the sr-only
          header text (absolutely positioned) inside the scroll area. */}
      <div className="@container relative overflow-x-auto rounded-xl border border-purple-300/20 bg-white/5">
        <table className="w-full min-w-[1400px] text-[13px]">
          <caption className="sr-only">
            Detail lines, grouped by property
          </caption>
          <thead>
            <tr>
              <th colSpan={5} />
              <th colSpan={6} className={groupTh}>
                <span className="block border-b border-purple-300/40 pb-1.5">
                  Gross (100%)
                </span>
              </th>
              <th colSpan={5} className={groupTh}>
                <span className="block border-b border-purple-300/40 pb-1.5">
                  Owner Share
                </span>
              </th>
              <th />
            </tr>
            <tr className={cn("border-b", theme.rowBorder)}>
              <th className="w-9">
                <span className="sr-only">Expand</span>
              </th>
              <th className={cn(th, "text-left")}>Prod Date</th>
              <th className={cn(th, "text-left")}>Product</th>
              <th className={cn(th, "text-left")}>Interest</th>
              <th className={cn(th, "text-right")}>Owner %</th>
              <th className={cn(th, "text-right")}>Price</th>
              <th className={cn(th, "text-right")}>Volume</th>
              <th className={cn(th, "text-right")}>Value</th>
              <th className={cn(th, "text-right")}>Taxes</th>
              <th className={cn(th, "text-right")}>Deducts</th>
              <th className={cn(th, "text-right")}>Net</th>
              <th className={cn(th, "text-right", theme.ownerTint)}>Volume</th>
              <th className={cn(th, "text-right", theme.ownerTint)}>Value</th>
              <th className={cn(th, "text-right", theme.ownerTint)}>Taxes</th>
              <th className={cn(th, "text-right", theme.ownerTint)}>Deducts</th>
              <th className={cn(th, "text-right", theme.ownerTint)}>Net</th>
              <th className="w-9">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="py-10 text-center text-sm text-white/60"
                >
                  No detail lines yet. Add a line, or import the operator&apos;s
                  Excel detail.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              if (row.kind === "group") {
                const { group } = row;
                const name = [group.operatorCc, group.propertyDescription]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr key={`group-${group.key}`} className={theme.groupRow}>
                    <td colSpan={COLUMN_COUNT} className="px-2.5 py-2.5">
                      <span className="sticky left-2.5 flex w-[calc(100cqw-1.25rem)] flex-wrap items-center justify-between gap-3">
                        <span className="flex flex-wrap items-center gap-2.5">
                          <strong className="text-white">
                            {name || "No Operator CC yet"}
                          </strong>
                          <span className="text-xs text-white/60">
                            Operator CC · property
                          </span>
                          {group.key !== "desc:" ? (
                            <WellLinkPicker
                              wellId={group.linked ? group.wellId : null}
                              wellLabel={group.linked ? group.wellLabel : null}
                              propertyDescription={group.propertyDescription}
                              onLink={(well) => onLinkWell(group.key, well)}
                              disabled={readOnly}
                            />
                          ) : (
                            <span className={cn("text-xs", theme.warnText)}>
                              Enter the Operator CC to link a well
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-white">
                          Property owner net{" "}
                          <strong className="text-sm tabular-nums">
                            {formatMoney(group.ownerNet)}
                          </strong>
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              }
              const { line } = row;
              const lineNumber = lineNumbers.get(line.id) ?? 0;
              const isExpanded = expanded.has(line.id);
              return (
                <Fragment key={line.id}>
                  <LineRow
                    line={line}
                    lineNumber={lineNumber}
                    expanded={isExpanded}
                    readOnly={readOnly}
                    onToggle={toggle}
                    onRemove={removeLine}
                  />
                  {isExpanded && (
                    <tr
                      className={cn(
                        "border-b",
                        theme.rowBorder,
                        theme.expandedRow,
                      )}
                    >
                      <td />
                      <td colSpan={COLUMN_COUNT - 1} className="px-2.5 py-3">
                        {/* left = the expand column (w-9) plus this cell's padding. */}
                        <div className="sticky left-[2.875rem] w-[calc(100cqw-3.5rem)]">
                          <LineEditor
                            line={line}
                            lineNumber={lineNumber}
                            readOnly={readOnly}
                            status={status}
                            operatorName={operatorName}
                            productOptions={productOptions}
                            interestOptions={interestOptions}
                            onChange={onChangeLine}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="border-t-[1.5px] border-purple-300/40">
                <td />
                <td
                  colSpan={10}
                  className="px-2.5 py-2 font-semibold text-white"
                >
                  Check total · {plural(lines.length, "line", "lines")} ·{" "}
                  {plural(groups.length, "property", "properties")}
                </td>
                <td className={cn(foot, "text-white/60")}>—</td>
                <td className={foot}>{formatMoney(totals.ownerValue)}</td>
                <td className={foot}>{formatMoney(totals.ownerTaxes)}</td>
                <td className={foot}>{formatMoney(totals.ownerDeducts)}</td>
                <td className={foot}>{formatMoney(totals.ownerNet)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-white/60">
        Owner % is shown as printed on the stub (0.134003% = 0.00134003 as a
        decimal). Prod Date 0326 on the stub reads as 03/2026.
      </p>
    </section>
  );
};

export default DetailLinesTable;
