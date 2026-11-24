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
import { LineRow, lineColumnCount } from "./LineRow";
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
// Below this width the owner volume, taxes and deducts columns drop out of the table (they're
// still in each line's editor), so it never scrolls sideways.
const ALL_COLUMNS_MIN_WIDTH = 900;

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
  const { accounts, getAccount } = useChartOfAccounts();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialExpanded),
  );
  const [focusLineId, setFocusLineId] = useState<string | null>(null);
  const [focusAfterRemove, setFocusAfterRemove] = useState<string | null>(null);
  const [allColumns, setAllColumns] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const tableBoxRef = useRef<HTMLDivElement>(null);
  const columnCount = lineColumnCount(allColumns);

  useEffect(() => {
    const box = tableBoxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      // A hidden tab panel measures 0 wide; keep the last real layout until it's shown again.
      if (entry.contentRect.width > 0) {
        setAllColumns(entry.contentRect.width >= ALL_COLUMNS_MIN_WIDTH);
      }
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

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
        const account = getAccount(incomeAccountForProduct(code, accounts));
        return {
          value: code,
          hint: account ? formatAccountNumber(account) : undefined,
        };
      }),
    [productKey, accounts, getAccount],
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
    "px-3 py-2.5 text-sm font-bold uppercase tracking-wider whitespace-nowrap",
    theme.headerText,
  );
  const ownerTh = cn(th, "text-right", theme.ownerTint);
  const foot = cn(
    "px-3 py-2.5 h-12 whitespace-nowrap font-semibold text-white",
    NUM_CLASS,
    theme.ownerTint,
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="rc-detail-lines"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="rc-detail-lines" className={SECTION_HEADER_CLASS}>
          Detail Lines
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
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
              data-add-line
              onClick={addLine}
              className={cn(
                "cursor-pointer border-dashed",
                theme.outlineButton,
              )}
            >
              <Plus className="size-4" />
              Add Line
            </Button>
          )}
        </div>
      </div>

      {/* relative keeps the sr-only caption (absolutely positioned) inside the scroll box. */}
      <div
        ref={tableBoxRef}
        className="relative overflow-x-auto rounded-xl border border-purple-300/20 bg-white/5"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">
            Detail lines, grouped by property
          </caption>
          <thead>
            <tr>
              <th colSpan={4} />
              <th
                colSpan={allColumns ? 5 : 2}
                className={cn(
                  "px-3 pt-3 text-center text-sm font-bold uppercase tracking-wider",
                  theme.headerText,
                )}
              >
                <span className="block border-b border-purple-300/40 pb-1.5">
                  Owner Share
                </span>
              </th>
              <th />
            </tr>
            <tr className={cn("border-b", theme.rowBorder)}>
              <th className="w-11">
                <span className="sr-only">Expand</span>
              </th>
              <th className={cn(th, "text-left")}>Prod Date</th>
              <th className={cn(th, "text-left")}>Product</th>
              <th className={cn(th, "text-left")}>Interest</th>
              {allColumns && <th className={ownerTh}>Volume</th>}
              <th className={ownerTh}>Value</th>
              {allColumns && <th className={ownerTh}>Taxes</th>}
              {allColumns && <th className={ownerTh}>Deducts</th>}
              <th className={ownerTh}>Net</th>
              <th className="w-11">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td
                  colSpan={columnCount}
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
                    <td colSpan={columnCount} className="px-3 py-3">
                      <span className="flex flex-wrap items-center justify-between gap-3">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <strong className="text-base text-white">
                            {name || "No Operator CC yet"}
                          </strong>
                          <span className="text-sm text-white/60">
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
                            <span className={cn("text-sm", theme.warnText)}>
                              Enter the Operator CC to link a well
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-white">
                          Property owner net{" "}
                          <strong className="text-base tabular-nums">
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
                    allColumns={allColumns}
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
                      <td colSpan={columnCount} className="px-3 py-3">
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
                <td colSpan={3} className="px-3 py-2.5 font-semibold text-white">
                  Check total · {plural(lines.length, "line", "lines")} ·{" "}
                  {plural(groups.length, "property", "properties")}
                </td>
                {allColumns && <td className={cn(foot, "text-white/60")}>—</td>}
                <td className={foot}>{formatMoney(totals.ownerValue)}</td>
                {allColumns && <td className={foot}>{formatMoney(totals.ownerTaxes)}</td>}
                {allColumns && <td className={foot}>{formatMoney(totals.ownerDeducts)}</td>}
                <td className={foot}>{formatMoney(totals.ownerNet)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-sm text-white/60">
        Open a line for its gross amounts, Owner %, taxes and deducts. Owner % is
        shown as printed on the stub (0.134003% = 0.00134003 as a decimal). Prod
        Date 0326 on the stub reads as 03/2026.
      </p>
    </section>
  );
};

export default DetailLinesTable;
