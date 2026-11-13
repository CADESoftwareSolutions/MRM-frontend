import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Eye, Pencil, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageHeaderAtom, themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useRevenueChecks } from "@/hooks/useRevenueChecks";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import {
  RevenueCheck,
  RevenueDisplayStatus,
  checkDisplayStatus,
  computeCheckTotals,
  formatCheckDate,
  formatGlPeriod,
  formatMoney,
  glPeriodForDate,
  postBlockers,
} from "@/types/revenue";
import { RevenueStatusBadge } from "./list/RevenueStatusBadge";

export interface RevenueCheckListProps {
  onOpenCheck: (id: string) => void;
  onNewCheck: () => void;
  onImport: () => void;
}

type StatusFilter = "all" | RevenueDisplayStatus;

interface CheckRow {
  check: RevenueCheck;
  status: RevenueDisplayStatus;
  statusLabel: string;
  blockers: string[];
  detailTotal: number;
  difference: number;
  prodMonths: string;
  month: string;
  searchText: string;
}

const PAGE_SIZE = 25;

// Radix Select reserves "" for clearing back to the placeholder, so "all" needs a real value.
const ALL = "__all__";

const STATUS_CHIPS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Draft", label: "Draft" },
  { id: "Out of balance", label: "Out of Balance" },
  { id: "Ready to post", label: "Ready to Post" },
  { id: "Posted", label: "Posted" },
  { id: "Void", label: "Void" },
];

const isClosed = (status: RevenueDisplayStatus) => status === "Posted" || status === "Void";

/** "2026-03" → "03/26" */
const shortProdMonth = (prodDate: string) => `${prodDate.slice(5, 7)}/${prodDate.slice(2, 4)}`;

const prodMonthRange = (check: RevenueCheck) => {
  const months = check.lines.map((line) => line.prodDate).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort();
  if (!months.length) return "";
  const first = shortProdMonth(months[0]);
  const last = shortProdMonth(months[months.length - 1]);
  return first === last ? first : `${first} – ${last}`;
};

const statusLabel = (status: RevenueDisplayStatus, check: RevenueCheck, blockers: string[]) => {
  if (status !== "Draft") return status;
  if (!check.lines.length) return "Draft · no detail yet";
  return blockers.length ? `Draft · ${blockers.length} to fix` : "Draft";
};

const countLabel = (n: number) => `${n} ${n === 1 ? "check" : "checks"}`;

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const RevenueCheckList = ({ onOpenCheck, onNewCheck, onImport }: RevenueCheckListProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const { checks, loading: checksLoading } = useRevenueChecks();
  const { accounts, loading: accountsLoading } = useChartOfAccounts();
  const accountList = accountsLoading ? undefined : accounts;
  const { types, unmappedCount, loading: typesLoading } = useTaxDeductTypes(accountList);
  const loading = checksLoading || typesLoading || accountsLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPageHeader({ title: "Revenue Checks", subtitle: "Checks received from operators and purchasers" });
    return () => setPageHeader({});
  }, [setPageHeader]);

  const rows = useMemo<CheckRow[]>(
    () =>
      checks
        .map((check) => {
          const totals = computeCheckTotals(check);
          const status = checkDisplayStatus(check, types, accountList);
          const blockers = isClosed(status) ? [] : postBlockers(check, types, accountList);
          return {
            check,
            status,
            statusLabel: statusLabel(status, check, blockers),
            blockers,
            detailTotal: totals.ownerNet,
            difference: totals.difference,
            prodMonths: prodMonthRange(check),
            month: glPeriodForDate(check.checkDate),
            searchText: [
              check.operatorName,
              check.ownerName,
              check.checkNumber,
              ...check.lines.flatMap((line) => [line.operatorCc, line.propertyDescription]),
            ]
              .join(" ")
              .toLowerCase(),
          };
        })
        .sort(
          (a, b) =>
            b.check.checkDate.localeCompare(a.check.checkDate) ||
            b.check.checkNumber.localeCompare(a.check.checkNumber),
        ),
    [checks, types, accountList],
  );

  const operatorOptions = useMemo(() => uniqueSorted(checks.map((c) => c.operatorName)), [checks]);
  const ownerOptions = useMemo(() => uniqueSorted(checks.map((c) => c.ownerName)), [checks]);
  const monthOptions = useMemo(() => uniqueSorted(rows.map((r) => r.month)).reverse(), [rows]);

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (!needle || row.searchText.includes(needle)) &&
        (!operatorFilter || row.check.operatorName === operatorFilter) &&
        (!ownerFilter || row.check.ownerName === ownerFilter) &&
        (!monthFilter || row.month === monthFilter),
    );
  }, [rows, searchTerm, operatorFilter, ownerFilter, monthFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: filteredRows.length,
      Draft: 0,
      "Out of balance": 0,
      "Ready to post": 0,
      Posted: 0,
      Void: 0,
    };
    for (const row of filteredRows) counts[row.status] += 1;
    return counts;
  }, [filteredRows]);

  const visibleRows = useMemo(
    () => (statusFilter === "all" ? filteredRows : filteredRows.filter((row) => row.status === statusFilter)),
    [filteredRows, statusFilter],
  );

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = visibleRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const tiles = useMemo(() => {
    const receivedMonth = monthFilter || monthOptions[0] || new Date().toISOString().slice(0, 7);
    const received = rows.filter((row) => row.month === receivedMonth && row.status !== "Void");
    const unposted = rows.filter((row) => !isClosed(row.status));
    return [
      {
        label: `Received in ${formatGlPeriod(receivedMonth)}`,
        value: `$${formatMoney(received.reduce((sum, row) => sum + row.check.checkAmount, 0))}`,
        note: countLabel(received.length),
        highlight: true,
      },
      {
        label: "Not posted yet",
        value: `$${formatMoney(unposted.reduce((sum, row) => sum + row.check.checkAmount, 0))}`,
        note: countLabel(unposted.length),
      },
      {
        label: "Out of balance",
        value: String(rows.filter((row) => row.status === "Out of balance").length),
        note: "Detail doesn't match the check",
      },
      {
        label: "Labels to map",
        value: String(unmappedCount),
        note: "Tax / deduct labels with no account",
      },
    ];
  }, [rows, monthFilter, monthOptions, unmappedCount]);

  const resetPage = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(0);
  };

  const filters = [
    { id: "operator", value: operatorFilter, onChange: resetPage(setOperatorFilter), allLabel: "All operators", options: operatorOptions.map((o) => ({ value: o, label: o })) },
    { id: "owner", value: ownerFilter, onChange: resetPage(setOwnerFilter), allLabel: "All owners", options: ownerOptions.map((o) => ({ value: o, label: o })) },
    { id: "month", value: monthFilter, onChange: resetPage(setMonthFilter), allLabel: "All check months", options: monthOptions.map((m) => ({ value: m, label: formatGlPeriod(m) })) },
  ];

  const borderColor = isLight ? "rgb(167 139 250 / 0.25)" : "rgb(167 139 250 / 0.2)";
  const dividerColor = isLight ? "rgb(167 139 250 / 0.2)" : "rgb(167 139 250 / 0.15)";
  const containerBg = isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.06)";
  const headerText = isLight ? "text-gray-500" : "text-purple-200/80";
  const outlineButton = isLight
    ? "bg-white border-purple-300/30 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
    : "bg-transparent border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white";

  const th = `px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${headerText}`;
  const td = "px-4 py-2 h-[52px] whitespace-nowrap";
  const firstShown = visibleRows.length ? currentPage * PAGE_SIZE + 1 : 0;
  const lastShown = currentPage * PAGE_SIZE + pageRows.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-xl border px-4 py-3.5 backdrop-blur-md ${
              tile.highlight ? "bg-purple-600/30 border-purple-300/30" : "bg-white/10 border-purple-300/30"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${headerText}`}>{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
            <p className="mt-0.5 text-xs text-white/60">{tile.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
        >
          {STATUS_CHIPS.map((chip) => {
            const active = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => resetPage(setStatusFilter)(chip.id)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white"
                    : isLight
                      ? "text-purple-700 hover:bg-purple-200/60"
                      : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
                }`}
              >
                {chip.label}
                {chip.id !== "all" && (
                  <span
                    className={`rounded-[5px] px-1.5 text-[11px] font-semibold tabular-nums ${
                      active ? "bg-black/20" : "bg-white/10"
                    }`}
                  >
                    <span className="sr-only">, </span>
                    {statusCounts[chip.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onImport} className={`cursor-pointer ${outlineButton}`}>
            <Upload className="w-4 h-4" />
            Import Check Detail
          </Button>
          <Button onClick={onNewCheck} className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
            <Plus className="w-4 h-4" />
            Enter Check
          </Button>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor, background: containerBg }}>
        <div
          className="flex flex-wrap items-center gap-3 px-5 py-4 border-b rounded-t-xl"
          style={{ borderColor: dividerColor }}
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isLight ? "text-gray-400" : "text-purple-300/60"
              }`}
            />
            <Input
              aria-label="Search revenue checks"
              placeholder="Search operator, owner, check # or property…"
              value={searchTerm}
              onChange={(e) => resetPage(setSearchTerm)(e.target.value)}
              className={`pl-9 h-9 border ${
                isLight
                  ? "bg-white border-purple-200 text-gray-800 placeholder:text-gray-400"
                  : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40"
              }`}
            />
          </div>

          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={filter.value || ALL}
              onValueChange={(next) => filter.onChange(next === ALL ? "" : next)}
            >
              <SelectTrigger
                aria-label={filter.allLabel.replace(/^All /, "Filter by ")}
                className={`w-44 shrink-0 cursor-pointer ${
                  isLight ? "bg-white border-purple-200 text-gray-800" : "bg-white/5 border-purple-300/30 text-white"
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                // Portals to <body>, so it needs its own layer to stay above the fixed app bar.
                style={{ zIndex: Z_INDEX.modalDropdown }}
                className={`max-h-[300px] overflow-y-auto ${
                  isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
                }`}
                position="popper"
                sideOffset={4}
              >
                {[{ value: ALL, label: filter.allLabel }, ...filter.options].map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={`cursor-pointer ${
                      isLight
                        ? "text-gray-800"
                        : "text-white hover:bg-purple-400/30 focus:bg-purple-400/30 data-[highlighted]:bg-purple-400/30"
                    }`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: dividerColor }}>
                <th className={`${th} text-left`}>Check Date</th>
                <th className={`${th} text-left`}>Operator</th>
                <th className={`${th} text-left`}>Check #</th>
                <th className={`${th} text-left`}>Owner</th>
                <th className={`${th} text-right`}>Check Amount</th>
                <th className={`${th} text-right`}>Detail Total</th>
                <th className={`${th} text-right`}>Difference</th>
                <th className={`${th} text-right`}>Lines</th>
                <th className={`${th} text-left`}>Prod Months</th>
                <th className={`${th} text-left`}>Status</th>
                <th className="px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
                      <span className={`text-sm ${isLight ? "text-gray-500" : "text-purple-200/70"}`}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <p className={isLight ? "text-gray-500" : "text-purple-200/70"}>
                      {checks.length
                        ? "No checks match these filters"
                        : "No revenue checks yet. Enter a check or import an operator's check detail."}
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const { check } = row;
                  const viewOnly = isClosed(row.status);
                  return (
                    <tr
                      key={check.id}
                      onClick={() => onOpenCheck(check.id)}
                      className={`border-b last:border-0 transition-colors cursor-pointer ${
                        isLight
                          ? "border-purple-100 hover:bg-purple-300/50"
                          : "border-purple-300/10 hover:bg-purple-500/[0.18]"
                      }`}
                    >
                      <td className={`${td} tabular-nums text-white`}>{formatCheckDate(check.checkDate)}</td>
                      <td className={`${td} font-semibold text-white`}>{check.operatorName}</td>
                      <td className={`${td} tabular-nums text-white`}>{check.checkNumber}</td>
                      <td className={`${td} text-white`}>{check.ownerName}</td>
                      <td className={`${td} text-right tabular-nums text-white`}>{formatMoney(check.checkAmount)}</td>
                      <td
                        className={`${td} text-right tabular-nums ${
                          check.lines.length ? "text-white" : "text-white/60"
                        }`}
                      >
                        {formatMoney(row.detailTotal)}
                      </td>
                      <td
                        className={`${td} text-right tabular-nums ${
                          row.difference === 0 || !check.lines.length ? "text-white/60" : "font-semibold text-red-400"
                        }`}
                      >
                        {formatMoney(row.difference)}
                      </td>
                      <td className={`${td} text-right tabular-nums text-white`}>{check.lines.length}</td>
                      <td className={`${td} tabular-nums ${row.prodMonths ? "text-white" : "text-white/60"}`}>
                        {row.prodMonths || "—"}
                      </td>
                      <td className={td}>
                        <RevenueStatusBadge status={row.status} label={row.statusLabel} blockers={row.blockers} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCheck(check.id);
                          }}
                          aria-label={`${viewOnly ? "View" : "Open"} check ${check.checkNumber}`}
                          title={viewOnly ? "View" : "Open"}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
                          }`}
                        >
                          {viewOnly ? (
                            <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />
                          ) : (
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t"
          style={{ borderColor: dividerColor }}
        >
          <span className="text-xs text-white/60">
            {visibleRows.length
              ? `Showing ${firstShown}–${lastShown} of ${countLabel(visibleRows.length)}${
                  monthFilter ? ` received in ${formatGlPeriod(monthFilter)}` : ""
                }`
              : "No checks to show"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className={`cursor-pointer ${outlineButton}`}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
              className={`cursor-pointer ${outlineButton}`}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueCheckList;
