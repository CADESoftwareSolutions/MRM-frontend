import { useEffect, useMemo, useRef } from "react";
import { useAtomValue } from "jotai";
import { AlertTriangle, Check, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useAcquisitionOptions } from "@/hooks/useAcquisitionOptions";
import { useAfeOptions } from "@/hooks/useAfeOptions";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useDeckOptions } from "@/hooks/useDeckOptions";
import { WellOption, useWellOptions } from "@/hooks/useWellOptions";
import { cn } from "@/lib/utils";
import { formatIsoDate, formatMoney, formatUsd, roundCents } from "@/types/apInvoices";
import { formatAccountNumber } from "@/types/chartOfAccounts";
import { AccountPicker } from "../../AccountPicker";
import { ERROR_RING } from "./EntryField";
import { GridPicker, GridPickerOption } from "./GridPicker";
import {
  LineDraft,
  copyFirstLineDown,
  copyLineBelow,
  distributedTotal,
  emptyLine,
  formatAmountInput,
  isUnparseableAmount,
  splitWellLabel,
} from "./invoiceDraft";

interface CodingGridProps {
  lines: LineDraft[];
  /** The header's Invoice Amount, parsed. */
  invoiceAmount: number;
  readOnly: boolean;
  /** Keys of lines flagged on the last submit attempt (an amount with no account). */
  lineErrors: ReadonlySet<string>;
  /** Account a new line starts with: the vendor's default expense account, or "". */
  defaultAccountId: string;
  onChange: (lines: LineDraft[]) => void;
}

const COLUMN_WIDTHS: (number | undefined)[] = [36, 168, 150, 118, 118, 118, 138, undefined, 118, 68];

const CELL_INPUT = "h-8 px-2 text-[13px] md:text-[13px] bg-white/5 border-purple-300/30 text-white";

/** Code in the cell, name under it: a real well shows its API # over its name; a stored
 * "W-0142 Whitfield 1H" label splits the same way. */
const wellDisplay = (line: LineDraft, well: WellOption | undefined): { code: string; name: string } => {
  if (well) return well.apiNumber ? { code: well.apiNumber, name: well.label } : { code: well.label, name: "" };
  return splitWellLabel(line.wellLabel);
};

export const CodingGrid = ({
  lines,
  invoiceAmount,
  readOnly,
  lineErrors,
  defaultAccountId,
  onChange,
}: CodingGridProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const { getAccount } = useChartOfAccounts();
  const { wells, loading: wellsLoading } = useWellOptions();
  const { afes, loading: afesLoading, getAfe } = useAfeOptions();
  const { decks, loading: decksLoading } = useDeckOptions();
  const { acquisitions, loading: acquisitionsLoading } = useAcquisitionOptions();

  const tableRef = useRef<HTMLTableElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const focusRowAfterDelete = useRef<number | null>(null);

  useEffect(() => {
    const index = focusRowAfterDelete.current;
    if (index === null) return;
    focusRowAfterDelete.current = null;
    const row = tableRef.current?.querySelector(`tr[data-line-row="${index}"]`);
    const field = row?.querySelector<HTMLElement>("input:not([disabled])");
    (field ?? sectionRef.current?.querySelector<HTMLElement>("[data-add-line]"))?.focus();
  }, [lines]);

  const wellsById = useMemo(() => new Map(wells.map((well) => [well.id, well])), [wells]);

  const wellOptions = useMemo<GridPickerOption[]>(
    () =>
      wells.map((well) => ({
        value: well.id,
        label: well.label,
        detail: [
          well.apiNumber && `API ${well.apiNumber}`,
          well.leaseName && well.leaseName !== well.label ? well.leaseName : "",
          [well.countyName, well.stateCode].filter(Boolean).join(", "),
        ]
          .filter(Boolean)
          .join(" · "),
        keywords: `${well.operatorName} ${well.wellNumber}`,
      })),
    [wells],
  );

  const afeOptions = useMemo<GridPickerOption[]>(
    () => afes.map((afe) => ({ value: afe.number, label: afe.number, detail: afe.description })),
    [afes],
  );

  const deckOptions = useMemo<GridPickerOption[]>(
    () =>
      decks.map((deck) => ({
        value: deck.name,
        label: deck.name,
        detail: [deck.type, splitWellLabel(deck.wellLabel).name || deck.wellLabel].filter(Boolean).join(" · "),
      })),
    [decks],
  );

  const projectOptions = useMemo<GridPickerOption[]>(
    () =>
      acquisitions.map((acquisition) => ({
        value: acquisition.id,
        label: acquisition.name,
        detail: acquisition.acquisitionDate ? `Acquired ${formatIsoDate(acquisition.acquisitionDate)}` : undefined,
      })),
    [acquisitions],
  );

  const distributed = distributedTotal(lines);
  const remaining = roundCents(invoiceAmount - distributed);
  const verified = invoiceAmount > 0 && remaining === 0;

  const update = (index: number, patch: Partial<LineDraft>) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const removeLine = (index: number) => {
    const next = lines.filter((_, i) => i !== index);
    focusRowAfterDelete.current = index;
    onChange(next.length ? next : [emptyLine(defaultAccountId)]);
  };

  const muted = isLight ? "text-gray-500" : "text-white/60";
  const rowBorder = isLight ? "border-purple-100" : "border-purple-300/10";
  const outlineButton = cn(
    "h-8 bg-transparent shadow-none cursor-pointer",
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white",
  );
  const iconButton = (tone: "purple" | "red") =>
    cn(
      "inline-flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer",
      tone === "red"
        ? isLight
          ? "text-red-600 hover:bg-red-50 hover:text-red-800"
          : "text-red-400 hover:bg-red-500/20 hover:text-red-200"
        : isLight
          ? "text-purple-600 hover:bg-purple-100 hover:text-purple-800"
          : "text-purple-300 hover:bg-purple-500/20 hover:text-purple-100",
    );
  const statusBadge = verified
    ? isLight
      ? "bg-green-100 text-green-700 border-green-300"
      : "bg-green-500/15 text-green-300 border-green-400/30"
    : isLight
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-amber-500/15 text-amber-300 border-amber-400/30";
  const remainingTone = verified
    ? isLight
      ? "text-green-700"
      : "text-green-300"
    : isLight
      ? "text-amber-700"
      : "text-amber-300";
  const statusLabel = verified
    ? "Amount confirmed and verified"
    : !(invoiceAmount > 0)
      ? "Enter the Invoice Amount"
      : remaining > 0
        ? `${formatUsd(remaining)} left to distribute`
        : `Over the invoice by ${formatUsd(-remaining)}`;

  const subText = (text: string) =>
    text ? (
      <span className={cn("mt-1 block truncate text-xs", muted)} title={text}>
        {text}
      </span>
    ) : null;

  const warningText = (text: string) => (
    <span
      className={cn(
        "mt-1 flex items-start gap-1 text-xs leading-tight",
        isLight ? "text-yellow-700" : "text-yellow-300",
      )}
    >
      <AlertTriangle className="mt-px size-3 shrink-0" strokeWidth={2.5} />
      {text}
    </span>
  );

  const readOnlyCell = (text: string) => (
    <span className="block truncate pt-1.5 text-[13px] text-white" title={text || undefined}>
      {text || <span className={muted}>—</span>}
    </span>
  );

  const renderLine = (line: LineDraft, index: number) => {
    const n = index + 1;
    const account = getAccount(line.accountId);
    const well = line.wellId ? wellsById.get(line.wellId) : undefined;
    const wellText = wellDisplay(line, well);
    const stages = getAfe(line.afe)?.stages ?? [];
    const staleStage = !!line.stage && !afesLoading && !stages.includes(line.stage);
    const accountMissing = lineErrors.has(line.key);
    const amountInvalid = isUnparseableAmount(line.amount);
    const accountErrorId = `ap-line-${line.key}-account-error`;
    const amountErrorId = `ap-line-${line.key}-amount-error`;

    if (readOnly) {
      return (
        <tr key={line.key} className={cn("border-b", rowBorder)}>
          <td className={cn("px-2 py-2 pl-3.5 align-top text-[13px]", muted)}>
            <span className="block pt-1.5">{n}</span>
          </td>
          <td className="px-2 py-2 align-top">
            {readOnlyCell(account ? formatAccountNumber(account) : line.accountId)}
            {subText(account?.description ?? "")}
          </td>
          <td className="px-2 py-2 align-top">
            {readOnlyCell(wellText.code)}
            {subText(wellText.name)}
          </td>
          <td className="px-2 py-2 align-top">{readOnlyCell(line.afe)}</td>
          <td className="px-2 py-2 align-top">{readOnlyCell(line.stage)}</td>
          <td className="px-2 py-2 align-top">{readOnlyCell(line.deck)}</td>
          <td className="px-2 py-2 align-top">{readOnlyCell(line.projectLabel)}</td>
          <td className="px-2 py-2 align-top">{readOnlyCell(line.description)}</td>
          <td className="px-2 py-2 align-top text-right tabular-nums">
            <span className="block pt-1.5 text-[13px] text-white">{line.amount || "0.00"}</span>
          </td>
          <td />
        </tr>
      );
    }

    return (
      <tr key={line.key} data-line-row={index} className={cn("border-b", rowBorder)}>
        <td className={cn("px-2 py-2 pl-3.5 align-top text-[13px]", muted)}>
          <span className="block pt-1.5">{n}</span>
        </td>
        <td className="px-2 py-2 align-top">
          <AccountPicker
            size="sm"
            aria-label={`Account, line ${n}`}
            value={line.accountId || null}
            onChange={(id) => update(index, { accountId: id })}
            onClear={() => update(index, { accountId: "" })}
            invalid={accountMissing}
            aria-describedby={accountMissing ? accountErrorId : undefined}
            className={accountMissing ? ERROR_RING : undefined}
          />
          {accountMissing ? (
            <span id={accountErrorId} className="mt-1 block text-xs text-red-400">
              Pick an account
            </span>
          ) : (
            subText(account?.description ?? "")
          )}
        </td>
        <td className="px-2 py-2 align-top">
          <GridPicker
            aria-label={`Sub-account, line ${n}`}
            display={wellText.code}
            value={line.wellId}
            options={wellOptions}
            loading={wellsLoading}
            emptyMessage="No matching wells"
            placeholder="Well / lease"
            onPick={(option) => update(index, { wellId: option.value, wellLabel: option.label })}
            onClear={() => update(index, { wellId: null, wellLabel: "" })}
          />
          {subText(wellText.name)}
        </td>
        <td className="px-2 py-2 align-top">
          <GridPicker
            aria-label={`AFE, line ${n}`}
            display={line.afe}
            value={line.afe || null}
            options={afeOptions}
            loading={afesLoading}
            emptyMessage="No matching AFEs"
            placeholder="None"
            onPick={(option) => {
              const nextStages = getAfe(option.value)?.stages ?? [];
              update(index, { afe: option.value, stage: nextStages.includes(line.stage) ? line.stage : "" });
            }}
            onClear={() => update(index, { afe: "", stage: "" })}
          />
        </td>
        <td className="px-2 py-2 align-top">
          <GridPicker
            aria-label={`Stage, line ${n}`}
            display={line.stage}
            value={line.stage || null}
            options={stages.map((stage) => ({ value: stage, label: stage }))}
            loading={afesLoading}
            disabled={!line.afe}
            emptyMessage={stages.length ? "No matching stages" : "No stages on this AFE"}
            placeholder={line.afe ? "—" : "Pick an AFE first"}
            onPick={(option) => update(index, { stage: option.value })}
            onClear={() => update(index, { stage: "" })}
            className={staleStage ? "border-dashed italic" : undefined}
          />
          {staleStage && warningText(line.afe ? "Not a stage of this AFE" : "No AFE on this line")}
        </td>
        <td className="px-2 py-2 align-top">
          <GridPicker
            aria-label={`Deck, line ${n}`}
            display={line.deck}
            value={line.deck || null}
            options={deckOptions}
            loading={decksLoading}
            emptyMessage="No matching decks"
            placeholder="None"
            onPick={(option) => update(index, { deck: option.value })}
            onClear={() => update(index, { deck: "" })}
          />
        </td>
        <td className="px-2 py-2 align-top">
          <GridPicker
            aria-label={`Project or acquisition, line ${n}`}
            display={line.projectLabel}
            value={line.projectId}
            options={projectOptions}
            loading={acquisitionsLoading}
            emptyMessage="No matching acquisitions"
            placeholder="None"
            onPick={(option) => update(index, { projectId: option.value, projectLabel: option.label })}
            onClear={() => update(index, { projectId: null, projectLabel: "" })}
          />
        </td>
        <td className="px-2 py-2 align-top">
          <Input
            aria-label={`Description, line ${n}`}
            value={line.description}
            onChange={(e) => update(index, { description: e.target.value })}
            className={CELL_INPUT}
          />
        </td>
        <td className="px-2 py-2 align-top">
          <Input
            aria-label={`Amount, line ${n}`}
            inputMode="decimal"
            placeholder="0.00"
            value={line.amount}
            onChange={(e) => update(index, { amount: e.target.value })}
            onBlur={() => update(index, { amount: formatAmountInput(line.amount) })}
            aria-invalid={amountInvalid || undefined}
            aria-describedby={amountInvalid ? amountErrorId : undefined}
            className={cn(CELL_INPUT, "text-right tabular-nums", amountInvalid && ERROR_RING)}
          />
          {amountInvalid && (
            <span id={amountErrorId} className="mt-1 block text-right text-xs text-red-400">
              Not a valid amount (max 2 decimals)
            </span>
          )}
        </td>
        <td className="px-1 py-2 align-top whitespace-nowrap">
          <div className="flex items-center gap-0.5 pt-0.5">
            <button
              type="button"
              aria-label={`Copy line ${n} to a new line`}
              title="Copy to a new line"
              onClick={() => onChange(copyLineBelow(lines, index))}
              className={iconButton("purple")}
            >
              <Copy className="size-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label={`Delete line ${n}`}
              title="Delete line"
              onClick={() => removeLine(index)}
              className={iconButton("red")}
            >
              <Trash2 className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section ref={sectionRef} className="flex flex-col gap-2.5 border-t border-purple-300/30 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Coding</h3>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={lines.length < 2}
              onClick={() => onChange(copyFirstLineDown(lines))}
              title="Fills the other lines' empty fields from line 1 (never the amount)"
              className={outlineButton}
            >
              <Copy className="size-3.5" />
              Copy line 1 down
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-add-line
              onClick={() => onChange([...lines, emptyLine(defaultAccountId)])}
              className={cn(outlineButton, "border-dashed")}
            >
              <Plus className="size-3.5" />
              Add Line
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-purple-300/20 bg-white/5">
        <table ref={tableRef} className="w-full min-w-[1180px] table-fixed text-[13px]">
          <caption className="sr-only">Invoice coding lines</caption>
          <colgroup>
            {COLUMN_WIDTHS.map((width, i) => (
              <col key={i} style={width ? { width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr
              className={cn(
                "border-b text-left text-[11px] font-semibold uppercase tracking-wider",
                rowBorder,
                isLight ? "text-gray-500" : "text-purple-200/80",
              )}
            >
              <th className="px-2 py-2.5 pl-3.5">#</th>
              <th className="px-2 py-2.5">Account #</th>
              <th className="px-2 py-2.5 whitespace-nowrap">
                Sub-Acct # <span className="normal-case tracking-normal font-medium">(well / lease)</span>
              </th>
              <th className="px-2 py-2.5">AFE #</th>
              <th className="px-2 py-2.5">Stage</th>
              <th className="px-2 py-2.5">Deck</th>
              <th className="px-2 py-2.5">Project / Acq.</th>
              <th className="px-2 py-2.5">Description</th>
              <th className="px-2 py-2.5 text-right">Amount</th>
              <th className="px-2 py-2.5">
                <span className="sr-only">Line actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map(renderLine)}
            <tr className={isLight ? "bg-purple-50/60" : "bg-white/[0.03]"}>
              <td colSpan={7} className="px-3.5 py-3 align-middle">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-[22px] items-center gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
                      statusBadge,
                    )}
                  >
                    {verified ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <AlertTriangle className="size-3" strokeWidth={2.5} />
                    )}
                    {statusLabel}
                  </span>
                  {!readOnly && (
                    <span className={cn("text-xs", muted)}>
                      Lines must add up to the Invoice Amount before the invoice can be submitted.
                    </span>
                  )}
                </span>
              </td>
              <td className="px-2 py-3 text-right align-middle text-xs leading-5">
                <div className={muted}>Distributed</div>
                <div className={muted}>Invoice amount</div>
                <div className="font-semibold text-white">Remaining</div>
              </td>
              <td className="px-2 py-3 text-right align-middle text-xs leading-5 tabular-nums">
                <div className="text-white">{formatMoney(distributed)}</div>
                <div className="text-white">{formatMoney(invoiceAmount)}</div>
                <div className={cn("font-semibold", remainingTone)}>{formatMoney(remaining)}</div>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CodingGrid;
