import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { cn } from "@/lib/utils";
import {
  AccountCategory,
  formatAccountLabel,
  formatAccountNumber,
} from "@/types/chartOfAccounts";
import {
  MAX_DEDUCTS,
  MAX_TAXES,
  RevenueCheckStatus,
  RevenueTaxDeduct,
  TaxDeductKind,
  formatMoney,
  normalizeLabel,
  taxDeductAccountId,
} from "@/types/revenue";
import { AccountPicker } from "../../AccountPicker";
import {
  EDITOR_PANEL_CLASS,
  EDITOR_PANEL_TITLE_CLASS,
  INPUT_CLASS,
  NUM_CLASS,
  useEntryTheme,
} from "./entryTheme";
import { NumberInput } from "./NumberInput";
import { SuggestInput, type SuggestOption } from "./SuggestInput";

interface TaxDeductListProps {
  kind: TaxDeductKind;
  entries: RevenueTaxDeduct[];
  onChange: (entries: RevenueTaxDeduct[]) => void;
  /** Recorded on labels this check adds, as the operator that prints them. */
  operatorName: string;
  lineNumber: number;
  readOnly: boolean;
  /** Posted and void checks show the account each amount posted to. */
  status: RevenueCheckStatus;
}

const COPY: Record<
  TaxDeductKind,
  {
    title: string;
    column: string;
    noun: string;
    plural: string;
    max: number;
    category: AccountCategory;
  }
> = {
  tax: {
    title: "Taxes",
    column: "Tax type (as on stub)",
    noun: "tax",
    plural: "taxes",
    max: MAX_TAXES,
    category: "TAXES",
  },
  deduct: {
    title: "Deducts",
    column: "Deduct type (as on stub)",
    noun: "deduct",
    plural: "deducts",
    max: MAX_DEDUCTS,
    category: "DEDUCTIONS",
  },
};

/** A line's taxes or deducts as printed on the stub, each with the account its label posts to.
 * Choosing an account for an unmapped label saves that mapping for every future check. */
export const TaxDeductList = ({
  kind,
  entries,
  onChange,
  operatorName,
  lineNumber,
  readOnly,
  status,
}: TaxDeductListProps) => {
  const theme = useEntryTheme();
  const { types, findByLabel, ensureTypes, setAccount } = useTaxDeductTypes();
  const { getAccount } = useChartOfAccounts();
  const [allCategories, setAllCategories] = useState(false);
  const [mappingLabel, setMappingLabel] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [focusNewRow, setFocusNewRow] = useState<number | null>(null);
  const [focusAfterRemove, setFocusAfterRemove] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const copy = COPY[kind];
  const operator = operatorName.trim();

  const labelOptions = useMemo<SuggestOption[]>(
    () =>
      types
        .filter((type) => type.kind === kind)
        .sort(
          (a, b) =>
            Number(b.operators.includes(operator)) -
              Number(a.operators.includes(operator)) ||
            a.label.localeCompare(b.label),
        )
        .map((type) => {
          const account = getAccount(type.accountId);
          return {
            value: type.label,
            hint: account ? formatAccountNumber(account) : "no account",
          };
        }),
    [types, kind, operator, getAccount],
  );

  useEffect(() => {
    if (focusAfterRemove === null) return;
    const root = rootRef.current;
    const nextRow = root?.querySelector<HTMLElement>(
      `[data-row="${focusAfterRemove}"] input`,
    );
    (nextRow ?? root?.querySelector<HTMLElement>("[data-add]"))?.focus();
    setFocusAfterRemove(null);
  }, [focusAfterRemove, entries.length]);

  const update = (index: number, patch: Partial<RevenueTaxDeduct>) =>
    onChange(
      entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );

  const mapLabel = async (label: string, accountId: string) => {
    setMappingLabel(label);
    setMapError(null);
    try {
      const added = await ensureTypes([
        { label, kind, operator: operator || undefined },
      ]);
      const type = added[0] ?? findByLabel(label, kind);
      if (!type) throw new Error(`Couldn't save the account for ${label}.`);
      await setAccount(type.id, accountId);
    } catch (err) {
      setMapError((err as Error).message);
    } finally {
      setMappingLabel(null);
    }
  };

  const renderAccount = (entry: RevenueTaxDeduct) => {
    const label = normalizeLabel(entry.label);
    if (!label)
      return (
        <span className="text-sm text-white/60">Enter the label first</span>
      );
    const type = findByLabel(label, kind);
    const accountId = taxDeductAccountId(entry, kind, status, types);
    const account = getAccount(accountId);
    if (accountId) {
      const accountLabel = account ? formatAccountLabel(account) : accountId;
      return (
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Badge
            variant="outline"
            title={accountLabel}
            className={cn(
              "min-w-0 max-w-full shrink rounded-md text-sm font-medium",
              theme.accountBadge,
            )}
          >
            <span className="truncate">{accountLabel}</span>
          </Badge>
          <span className="shrink-0 text-sm text-white/60">
            {status === "draft" ? "saved match" : "posted to"}
          </span>
        </span>
      );
    }
    const badge = (
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 rounded-md text-sm font-medium",
          theme.warnBadge,
        )}
      >
        {type && !type.isNew ? "No account" : "New label"}
      </Badge>
    );
    if (readOnly) return badge;
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="min-w-40 flex-1">
          <AccountPicker
            aria-label={`Account for ${label}, line ${lineNumber}`}
            value={null}
            onChange={(accountId) => mapLabel(label, accountId)}
            categories={allCategories ? undefined : [copy.category]}
            placeholder="Choose account"
            disabled={mappingLabel === label}
          />
        </span>
        {mappingLabel === label ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-purple-300" />
        ) : (
          badge
        )}
      </span>
    );
  };

  const th = cn(
    "px-2 py-1.5 text-sm font-bold uppercase tracking-wider whitespace-nowrap",
    theme.headerText,
  );
  const hasUnmapped = entries.some((entry) => {
    const label = normalizeLabel(entry.label);
    return label && !findByLabel(label, kind)?.accountId;
  });

  return (
    <div
      ref={rootRef}
      className={cn("flex min-w-0 flex-col gap-2", EDITOR_PANEL_CLASS)}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className={EDITOR_PANEL_TITLE_CLASS}>
          {copy.title}
          <span className="ml-1.5 font-normal normal-case tracking-normal text-white/60">
            · up to {copy.max}
          </span>
        </h4>
        {!readOnly && hasUnmapped && (
          <button
            type="button"
            onClick={() => setAllCategories((all) => !all)}
            className={cn(
              "cursor-pointer text-sm underline underline-offset-2",
              theme.ghostButton,
            )}
          >
            {allCategories
              ? `${copy.category} accounts only`
              : "Show all account categories"}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-1 text-sm text-white/60">
          No {copy.plural} on this line.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[600px] text-sm"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col />
              <col style={{ width: 104 }} />
              <col style={{ width: 104 }} />
              <col style={{ width: "33%" }} />
              {!readOnly && <col style={{ width: 36 }} />}
            </colgroup>
            <thead>
              <tr className={cn("border-b text-left", theme.rowBorder)}>
                <th className={cn(th, "whitespace-normal")}>{copy.column}</th>
                <th className={cn(th, "text-right")}>Gross</th>
                <th className={cn(th, "text-right")}>Owner</th>
                <th className={th}>Account</th>
                {!readOnly && (
                  <th>
                    <span className="sr-only">Remove</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={index}
                  data-row={index}
                  className={cn("border-b last:border-0", theme.rowBorder)}
                >
                  <td className="px-2 py-1.5">
                    {readOnly ? (
                      <span
                        className="block truncate text-white"
                        title={entry.label}
                      >
                        {entry.label || "—"}
                      </span>
                    ) : (
                      <SuggestInput
                        aria-label={`${copy.title} label ${index + 1}, line ${lineNumber}`}
                        value={entry.label}
                        onCommit={(label) => update(index, { label })}
                        options={labelOptions}
                        normalize={normalizeLabel}
                        newValueNote="new label"
                        placeholder="As printed"
                        autoFocus={index === focusNewRow}
                        className={INPUT_CLASS}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {readOnly ? (
                      <span className={cn("block text-white", NUM_CLASS)}>
                        {formatMoney(entry.gross)}
                      </span>
                    ) : (
                      <NumberInput
                        aria-label={`${copy.title} ${index + 1} gross, line ${lineNumber}`}
                        value={entry.gross}
                        onValueChange={(gross) =>
                          update(index, { gross: gross ?? 0 })
                        }
                        format={formatMoney}
                        className={INPUT_CLASS}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {readOnly ? (
                      <span className={cn("block text-white", NUM_CLASS)}>
                        {formatMoney(entry.net)}
                      </span>
                    ) : (
                      <NumberInput
                        aria-label={`${copy.title} ${index + 1} owner, line ${lineNumber}`}
                        value={entry.net}
                        onValueChange={(net) =>
                          update(index, { net: net ?? 0 })
                        }
                        format={formatMoney}
                        className={INPUT_CLASS}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">{renderAccount(entry)}</td>
                  {!readOnly && (
                    <td className="px-0.5 py-1.5 text-center">
                      <button
                        type="button"
                        aria-label={`Remove ${copy.noun} ${entry.label || index + 1}, line ${lineNumber}`}
                        title={`Remove ${copy.noun}`}
                        onClick={() => {
                          onChange(entries.filter((_, i) => i !== index));
                          setFocusAfterRemove(index);
                        }}
                        className={cn(
                          "rounded-md p-1.5 cursor-pointer",
                          theme.dangerIconButton,
                        )}
                      >
                        <X className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mapError && <p className="text-sm text-red-400">{mapError}</p>}

      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          data-add
          disabled={entries.length >= copy.max}
          onClick={() => {
            setFocusNewRow(entries.length);
            onChange([...entries, { label: "", gross: 0, net: 0 }]);
          }}
          className={cn(
            "h-8 w-fit px-2 cursor-pointer",
            theme.ghostButton,
          )}
        >
          <Plus className="size-4" />
          Add {copy.noun}
        </Button>
      )}
    </div>
  );
};

export default TaxDeductList;
