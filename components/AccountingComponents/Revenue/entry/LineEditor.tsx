import { memo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { cn } from "@/lib/utils";
import { formatAccountLabel } from "@/types/chartOfAccounts";
import {
  RevenueCheckStatus,
  RevenueLine,
  TaxDeductKind,
  formatMoney,
  formatProdDate,
  lineIncomeAccountId,
  parseProdDate,
} from "@/types/revenue";
import { AmountMismatch, netMismatch, rowsMismatch } from "./checkDraft";
import { CommitInput } from "./CommitInput";
import { INPUT_SM_CLASS, READ_ONLY_CLASS, useEntryTheme } from "./entryTheme";
import { FieldShell } from "./FieldShell";
import { NumberInput, formatDecimal } from "./NumberInput";
import { SuggestInput, type SuggestOption } from "./SuggestInput";
import { TaxDeductList } from "./TaxDeductList";

export interface LineEditorProps {
  line: RevenueLine;
  lineNumber: number;
  readOnly: boolean;
  operatorName: string;
  productOptions: SuggestOption[];
  interestOptions: SuggestOption[];
  status: RevenueCheckStatus;
  onChange: (id: string, patch: Partial<RevenueLine>) => void;
}

type NumberField = {
  [K in keyof RevenueLine]: RevenueLine[K] extends number ? K : never;
}[keyof RevenueLine];

const FIELD = cn(INPUT_SM_CLASS, READ_ONLY_CLASS);
const formatQuantity = (value: number) => formatDecimal(value, 2, 4);
const formatPercent = (value: number) => value.toFixed(6);
const normalizeProduct = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();
const normalizeInterest = (value: string) => value.trim().replace(/\s+/g, " ");

/** Everything on one detail line, opened under its row in the grid. */
export const LineEditor = memo(function LineEditor({
  line,
  lineNumber,
  readOnly,
  operatorName,
  productOptions,
  interestOptions,
  status,
  onChange,
}: LineEditorProps) {
  const theme = useEntryTheme();
  const { accounts, getAccount } = useChartOfAccounts();
  const set = (patch: Partial<RevenueLine>) => onChange(line.id, patch);
  const fieldId = (name: string) => `rl-${line.id}-${name}`;

  const numberInput = (field: NumberField, label: string, format: (value: number) => string = formatMoney) => (
    <NumberInput
      aria-label={`${label}, line ${lineNumber}`}
      value={line[field]}
      onValueChange={(value) => set({ [field]: value ?? 0 } as Partial<RevenueLine>)}
      format={format}
      disabled={readOnly}
      className={FIELD}
    />
  );

  const mismatchNote = (mismatch: AmountMismatch | null, onUse: () => void) =>
    mismatch && (
      <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs", theme.warnText)}>
        <AlertTriangle className="size-3.5 shrink-0" />
        <span>{mismatch.message}</span>
        {!readOnly && (
          <button type="button" onClick={onUse} className="cursor-pointer font-medium underline underline-offset-2">
            Use {formatMoney(mismatch.expected)}
          </button>
        )}
      </p>
    );

  const grossNet = netMismatch(line, "gross");
  const ownerNet = netMismatch(line, "owner");
  const incomeAccountId = lineIncomeAccountId(line, status, accounts);
  const incomeAccount = getAccount(incomeAccountId);

  const amountLabel = (text: string) => (
    <span className={cn("px-1 text-[10px] font-semibold uppercase tracking-wider", theme.headerText)}>{text}</span>
  );

  const amountsRow = (title: string, cells: ReactNode[], tinted = false) => (
    <div className="contents">
      <span className={cn("flex items-center rounded-md px-2 text-xs font-semibold text-white/90", tinted && theme.ownerTint)}>
        {title}
      </span>
      {cells.map((cell, index) => (
        <div key={index} className={cn("rounded-md", tinted && cell !== null && theme.ownerTint)}>
          {cell}
        </div>
      ))}
    </div>
  );

  const listWithCheck = (kind: TaxDeductKind) => {
    const entries = kind === "tax" ? line.taxes : line.deducts;
    const mismatch = rowsMismatch(line, kind);
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <TaxDeductList
          kind={kind}
          entries={entries}
          onChange={(next) => set(kind === "tax" ? { taxes: next } : { deducts: next })}
          operatorName={operatorName}
          lineNumber={lineNumber}
          readOnly={readOnly}
          status={status}
        />
        {mismatchNote(mismatch, () =>
          set(kind === "tax" ? { ownerTaxes: mismatch?.expected ?? 0 } : { ownerDeducts: mismatch?.expected ?? 0 }),
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3" aria-label={`Line ${lineNumber} details`} role="group">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4 xl:grid-cols-8">
        <FieldShell compact htmlFor={fieldId("cc")} label="Operator CC">
          <CommitInput
            id={fieldId("cc")}
            value={line.operatorCc}
            onCommit={(operatorCc) => set({ operatorCc })}
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("property")} label="Property" className="col-span-2">
          <Input
            id={fieldId("property")}
            value={line.propertyDescription}
            onChange={(event) => set({ propertyDescription: event.target.value })}
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("product")} label="Product">
          <SuggestInput
            id={fieldId("product")}
            value={line.productCode}
            onCommit={(productCode) => set({ productCode })}
            options={productOptions}
            normalize={normalizeProduct}
            placeholder="OIL, GAS…"
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("interest")} label="Interest Type">
          <SuggestInput
            id={fieldId("interest")}
            value={line.interestType}
            onCommit={(interestType) => set({ interestType })}
            options={interestOptions}
            normalize={normalizeInterest}
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("prod")} label="Prod Date">
          <CommitInput
            id={fieldId("prod")}
            value={line.prodDate}
            onCommit={(prodDate) => set({ prodDate })}
            parse={(text) => (text.trim() ? parseProdDate(text) : "")}
            format={(value) => (value ? formatProdDate(value) : "")}
            placeholder="MMYY"
            unreadableMessage="Use MMYY (0326) or MM/YYYY."
            fieldLabel={`Prod Date, line ${lineNumber}`}
            disabled={readOnly}
            className={cn(FIELD, "tabular-nums")}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("owner-pct")} label="Owner %">
          <NumberInput
            id={fieldId("owner-pct")}
            fieldLabel={`Owner %, line ${lineNumber}`}
            value={line.ownerPercent}
            onValueChange={(ownerPercent) => set({ ownerPercent: ownerPercent ?? 0 })}
            format={formatPercent}
            suffix="%"
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
        <FieldShell compact htmlFor={fieldId("dist-pct")} label="Distribution %">
          <NumberInput
            id={fieldId("dist-pct")}
            fieldLabel={`Distribution %, line ${lineNumber}`}
            value={line.distributionPercent}
            onValueChange={(distributionPercent) => set({ distributionPercent: distributionPercent ?? 0 })}
            format={formatPercent}
            suffix="%"
            disabled={readOnly}
            className={FIELD}
          />
        </FieldShell>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[120px_repeat(6,minmax(0,1fr))] gap-x-2 gap-y-1.5" role="group" aria-label="Amounts">
          <span />
          {["Price", "Volume", "Value", "Taxes", "Deducts", "Net"].map((label) => (
            <span key={label} className="text-right">
              {amountLabel(label)}
            </span>
          ))}
          {amountsRow("Gross (100%)", [
            numberInput("price", "Price", formatQuantity),
            numberInput("grossVolume", "Gross volume", formatQuantity),
            numberInput("grossValue", "Gross value"),
            numberInput("grossTaxes", "Gross taxes"),
            numberInput("grossDeducts", "Gross deducts"),
            numberInput("netValue", "Gross net"),
          ])}
          {amountsRow(
            "Owner share",
            [
              null,
              numberInput("ownerVolume", "Owner volume", formatQuantity),
              numberInput("ownerValue", "Owner value"),
              numberInput("ownerTaxes", "Owner taxes"),
              numberInput("ownerDeducts", "Owner deducts"),
              numberInput("ownerNetValue", "Owner net"),
            ],
            true,
          )}
        </div>
      </div>
      {(grossNet || ownerNet) && (
        <div className="flex flex-col gap-1">
          {mismatchNote(grossNet, () => set({ netValue: grossNet?.expected ?? 0 }))}
          {mismatchNote(ownerNet, () => set({ ownerNetValue: ownerNet?.expected ?? 0 }))}
        </div>
      )}

      {/* Sized by the detail table's scroll box (the nearest @container), not the viewport. Taxes
          and deducts stack so long stub labels have room; Line Details moves beside them when it fits. */}
      <div className="grid gap-3 @min-[1200px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-3">
          {listWithCheck("tax")}
          {listWithCheck("deduct")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 self-start rounded-lg border border-purple-300/20 bg-white/5 px-3 py-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90">Line Details</h4>
          <div className={cn("flex justify-between gap-3 border-b py-1 text-xs", theme.rowBorder)}>
            <span className="text-white/60">Income account</span>
            <span className="truncate text-right text-white" title="Set by the product">
              {status !== "draft" || line.productCode.trim()
                ? incomeAccount
                  ? formatAccountLabel(incomeAccount)
                  : incomeAccountId
                : "Set by the product"}
            </span>
          </div>
          <div className={cn("flex items-center justify-between gap-3 border-b py-1 text-xs", theme.rowBorder)}>
            <label htmlFor={fieldId("btu")} className="shrink-0 text-white/60">
              BTU factor
            </label>
            <div className="w-28">
              <NumberInput
                id={fieldId("btu")}
                fieldLabel={`BTU factor, line ${lineNumber}`}
                value={line.btuFactor}
                onValueChange={(btuFactor) => set({ btuFactor })}
                nullable
                format={(value) => formatDecimal(value, 0, 6)}
                placeholder="—"
                disabled={readOnly}
                className={FIELD}
              />
            </div>
          </div>
          <label htmlFor={fieldId("notation")} className="mt-0.5 text-xs text-white/60">
            Detail line notation
          </label>
          <Input
            id={fieldId("notation")}
            value={line.notation}
            onChange={(event) => set({ notation: event.target.value })}
            placeholder="Optional note from the stub"
            disabled={readOnly}
            className={FIELD}
          />
        </div>
      </div>
    </div>
  );
});

export default LineEditor;
