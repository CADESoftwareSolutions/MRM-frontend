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
import {
  EDITOR_PANEL_CLASS,
  EDITOR_PANEL_TITLE_CLASS,
  INPUT_CLASS,
  READ_ONLY_CLASS,
  useEntryTheme,
} from "./entryTheme";
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

const FIELD = cn(INPUT_CLASS, READ_ONLY_CLASS);
const formatQuantity = (value: number) => formatDecimal(value, 2, 4);
const formatPercent = (value: number) => value.toFixed(6);
const normalizeProduct = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();
const normalizeInterest = (value: string) => value.trim().replace(/\s+/g, " ");

const EditorSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className={cn("flex min-w-0 flex-col gap-3", EDITOR_PANEL_CLASS)}>
    <h4 className={EDITOR_PANEL_TITLE_CLASS}>{title}</h4>
    {children}
  </div>
);

/** Everything on one detail line, opened under its row in the table. */
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
      <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm", theme.warnText)}>
        <AlertTriangle className="size-4 shrink-0" />
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
    <span className={cn("px-1 text-sm font-bold uppercase tracking-wider", theme.headerText)}>{text}</span>
  );

  const amountsRow = (title: string, cells: ReactNode[], tinted = false) => (
    <div className="contents">
      <span className={cn("flex min-h-9 items-center rounded-md px-2 text-sm font-bold text-white", tinted && theme.ownerTint)}>
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

  const incomeAccountText =
    status !== "draft" || line.productCode.trim()
      ? incomeAccount
        ? formatAccountLabel(incomeAccount)
        : incomeAccountId
      : "Set by the product";

  // A size container: the sections lay out by the editor's own width, and its content can't
  // widen the table it sits in.
  return (
    <div className="@container flex flex-col gap-3" aria-label={`Line ${lineNumber} details`} role="group">
      <EditorSection title="Property & product">
        <div className="grid grid-cols-2 gap-3 @min-[640px]:grid-cols-4 @min-[1240px]:grid-cols-8">
          <FieldShell htmlFor={fieldId("cc")} label="Operator CC">
            <CommitInput
              id={fieldId("cc")}
              value={line.operatorCc}
              onCommit={(operatorCc) => set({ operatorCc })}
              disabled={readOnly}
              className={FIELD}
            />
          </FieldShell>
          <FieldShell htmlFor={fieldId("property")} label="Property" className="col-span-2">
            <CommitInput
              id={fieldId("property")}
              value={line.propertyDescription}
              onCommit={(propertyDescription) => set({ propertyDescription })}
              disabled={readOnly}
              className={FIELD}
            />
          </FieldShell>
          <FieldShell htmlFor={fieldId("product")} label="Product">
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
          <FieldShell htmlFor={fieldId("interest")} label="Interest Type">
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
          <FieldShell htmlFor={fieldId("prod")} label="Prod Date">
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
          <FieldShell htmlFor={fieldId("owner-pct")} label="Owner %">
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
          <FieldShell htmlFor={fieldId("dist-pct")} label="Distribution %">
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
      </EditorSection>

      <EditorSection title="Amounts">
        {/* Narrow editors turn the grid on its side (Price…Net down the left, gross and owner as
            columns); the cells stay in the same order, placed down columns instead of across rows. */}
        <div
          className="grid grid-flow-col grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] grid-rows-[repeat(7,auto)] gap-x-3 gap-y-2 @min-[820px]:grid-flow-row @min-[820px]:grid-cols-[8.5rem_repeat(6,minmax(0,1fr))] @min-[820px]:grid-rows-none"
          role="group"
          aria-label="Amounts"
        >
          <span />
          {["Price", "Volume", "Value", "Taxes", "Deducts", "Net"].map((label) => (
            <span key={label} className="flex items-center @min-[820px]:justify-end">
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
        {(grossNet || ownerNet) && (
          <div className="flex flex-col gap-1">
            {mismatchNote(grossNet, () => set({ netValue: grossNet?.expected ?? 0 }))}
            {mismatchNote(ownerNet, () => set({ ownerNetValue: ownerNet?.expected ?? 0 }))}
          </div>
        )}
      </EditorSection>

      <div className="grid gap-3 @min-[1300px]:grid-cols-2">
        {listWithCheck("tax")}
        {listWithCheck("deduct")}
      </div>

      <EditorSection title="Line details">
        <div className="grid gap-3 @min-[640px]:grid-cols-4">
          <FieldShell label="Income account">
            <p
              className="h-9 truncate rounded-md border border-purple-300/20 px-3 text-sm leading-[2.125rem] text-white"
              title="Set by the product"
            >
              {incomeAccountText}
            </p>
          </FieldShell>
          <FieldShell htmlFor={fieldId("btu")} label="BTU factor">
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
          </FieldShell>
          <FieldShell htmlFor={fieldId("notation")} label="Detail line notation" className="@min-[640px]:col-span-2">
            <Input
              id={fieldId("notation")}
              value={line.notation}
              onChange={(event) => set({ notation: event.target.value })}
              placeholder="Optional note from the stub"
              disabled={readOnly}
              className={FIELD}
            />
          </FieldShell>
        </div>
      </EditorSection>
    </div>
  );
});

export default LineEditor;
