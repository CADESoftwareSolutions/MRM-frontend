import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useContactOptions } from "@/hooks/useContactOptions";
import { cn } from "@/lib/utils";
import { BOXES_1099, TYPES_1099, VendorDefaults, formatIsoDate } from "@/types/apInvoices";
import { formatAccountLabel } from "@/types/chartOfAccounts";
import { ContactPicker } from "../../../FormComponents/ContactPicker";
import { AccountPicker } from "../../AccountPicker";
import { ERROR_RING, EntryField, entryErrorId, readOnlyBoxClass } from "./EntryField";
import { EntrySelect } from "./EntrySelect";
import {
  AutoField,
  HeaderErrors,
  InvoiceDraft,
  formatAmountInput,
  formatGlMonth,
  glMonthOptions,
} from "./invoiceDraft";
import { VendorChoice, contactVendorChoice, isContactVendorId, isMockVendorId } from "./vendors";

const INPUT_CLASS = "h-9 bg-white/5 border-purple-300/30 text-white";
const TYPE_OPTIONS = TYPES_1099.map((type) => ({ value: type, label: type }));
const BOX_OPTIONS = BOXES_1099.map((box) => ({ value: box, label: box }));

export interface DuplicateFieldHints {
  /** e.g. "Matches JE-26-04412"; null when no match on invoice #. */
  invoiceNumber: string | null;
  /** e.g. "Same amount as #88213"; null when no match on amount. */
  invoiceAmount: string | null;
}

interface InvoiceHeaderFieldsProps {
  draft: InvoiceDraft;
  journalId: string | null;
  readOnly: boolean;
  defaults: VendorDefaults;
  autoFields: ReadonlySet<AutoField>;
  errors: HeaderErrors;
  duplicateHints: DuplicateFieldHints;
  /** Vendor name the reader found that matches no vendor, so the user knows to pick one. */
  unmatchedVendorName: string | null;
  remitTo: ReactNode;
  onChange: (patch: Partial<InvoiceDraft>, edited?: AutoField) => void;
  onVendorChange: (vendor: VendorChoice) => void;
  onUseVendorTerms: () => void;
}

export const InvoiceHeaderFields = ({
  draft,
  journalId,
  readOnly,
  defaults,
  autoFields,
  errors,
  duplicateHints,
  unmatchedVendorName,
  remitTo,
  onChange,
  onVendorChange,
  onUseVendorTerms,
}: InvoiceHeaderFieldsProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const { getAccount } = useChartOfAccounts();
  const { options: contacts, loading: contactsLoading } = useContactOptions();

  const isContact = isContactVendorId(draft.vendorId);
  const knownContact = isContact && (contactsLoading || contacts.some((option) => option.id === draft.vendorId));
  const storedVendorLabel = draft.vendorId
    ? [draft.vendorNameId, draft.vendorName].filter(Boolean).join(" · ")
    : "";

  const vendorHelp = isMockVendorId(draft.vendorId)
    ? "Sample vendor that isn't a contact yet. Pick a contact to replace it."
    : undefined;
  const vendorWarning = unmatchedVendorName
    ? `Read “${unmatchedVendorName}” from the document, but no vendor matches it. Pick one.`
    : undefined;

  const apAccount = getAccount(draft.apAccountId);
  const terms = defaults.paymentTerms;
  const dueHelp = draft.dueDateManual ? (
    <>
      Set by hand.{" "}
      <button
        type="button"
        onClick={onUseVendorTerms}
        className="cursor-pointer underline underline-offset-2 hover:text-purple-100"
      >
        Use {terms}
      </button>
    </>
  ) : (
    `${terms} from the vendor's terms.`
  );

  const warnRing = isLight ? "ring-1 ring-yellow-500" : "ring-1 ring-yellow-400";

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
      <EntryField
        label="Vendor"
        required
        auto={autoFields.has("vendor")}
        help={vendorHelp}
        warning={vendorWarning}
        error={errors.vendor}
        readOnly={readOnly}
        readOnlyValue={storedVendorLabel}
        className="sm:col-span-2"
      >
        <ContactPicker
          aria-label="Vendor"
          value={knownContact ? draft.vendorId : null}
          onChange={(_, option) => onVendorChange(contactVendorChoice(option))}
          classifications={["VENDOR"]}
          placeholder={storedVendorLabel || "Select vendor"}
          invalid={!!errors.vendor}
          className={errors.vendor ? ERROR_RING : undefined}
        />
      </EntryField>

      <div className="min-w-0">
        <span className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">Journal ID #</span>
        <div className={readOnlyBoxClass}>{journalId ?? "Assigned on approval"}</div>
      </div>

      <div className="sm:col-span-2">{remitTo}</div>

      <EntryField
        label="A/P Account #"
        help={draft.apAccountId === defaults.apAccountId ? "From the vendor's defaults." : undefined}
        readOnly={readOnly}
        readOnlyValue={apAccount ? formatAccountLabel(apAccount) : draft.apAccountId}
      >
        <AccountPicker
          aria-label="A/P account"
          value={draft.apAccountId || null}
          onChange={(id) => onChange({ apAccountId: id })}
          categories={["LIABILITY"]}
        />
      </EntryField>

      <EntryField
        label="Ref / Invoice #"
        htmlFor="ap-invoice-number"
        required
        auto={autoFields.has("invoiceNumber")}
        warning={duplicateHints.invoiceNumber}
        error={errors.invoiceNumber}
        readOnly={readOnly}
        readOnlyValue={draft.invoiceNumber}
      >
        <Input
          id="ap-invoice-number"
          value={draft.invoiceNumber}
          onChange={(e) => onChange({ invoiceNumber: e.target.value }, "invoiceNumber")}
          aria-invalid={!!errors.invoiceNumber || undefined}
          aria-describedby={errors.invoiceNumber ? entryErrorId("ap-invoice-number") : undefined}
          className={cn(
            INPUT_CLASS,
            errors.invoiceNumber ? ERROR_RING : duplicateHints.invoiceNumber && warnRing,
          )}
        />
      </EntryField>

      <EntryField
        label="Invoice Amount"
        htmlFor="ap-invoice-amount"
        required
        auto={autoFields.has("invoiceAmount")}
        warning={duplicateHints.invoiceAmount}
        error={errors.invoiceAmount}
        readOnly={readOnly}
        readOnlyValue={draft.invoiceAmount ? `$${draft.invoiceAmount}` : ""}
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/60">$</span>
          <Input
            id="ap-invoice-amount"
            inputMode="decimal"
            value={draft.invoiceAmount}
            onChange={(e) => onChange({ invoiceAmount: e.target.value }, "invoiceAmount")}
            onBlur={() => onChange({ invoiceAmount: formatAmountInput(draft.invoiceAmount) })}
            placeholder="0.00"
            aria-invalid={!!errors.invoiceAmount || undefined}
            aria-describedby={errors.invoiceAmount ? entryErrorId("ap-invoice-amount") : undefined}
            className={cn(
              INPUT_CLASS,
              "pl-6 text-right tabular-nums",
              errors.invoiceAmount ? ERROR_RING : duplicateHints.invoiceAmount && warnRing,
            )}
          />
        </div>
      </EntryField>

      <EntryField
        label="Invoice Date"
        htmlFor="ap-invoice-date"
        required
        auto={autoFields.has("invoiceDate")}
        error={errors.invoiceDate}
        readOnly={readOnly}
        readOnlyValue={formatIsoDate(draft.invoiceDate)}
      >
        <DatePicker
          id="ap-invoice-date"
          value={draft.invoiceDate}
          onChange={(value) => onChange({ invoiceDate: value }, "invoiceDate")}
          className={cn(INPUT_CLASS, errors.invoiceDate && ERROR_RING)}
          invalid={!!errors.invoiceDate}
        />
      </EntryField>

      <EntryField
        label="Due Date"
        htmlFor="ap-due-date"
        required
        auto={autoFields.has("dueDate")}
        help={dueHelp}
        error={errors.dueDate}
        readOnly={readOnly}
        readOnlyValue={formatIsoDate(draft.dueDate)}
      >
        <DatePicker
          id="ap-due-date"
          value={draft.dueDate}
          onChange={(value) => {
            if (value !== draft.dueDate) onChange({ dueDate: value, dueDateManual: true }, "dueDate");
          }}
          className={cn(INPUT_CLASS, errors.dueDate && ERROR_RING)}
          invalid={!!errors.dueDate}
        />
      </EntryField>

      <EntryField
        label="G/L Effective Date"
        htmlFor="ap-gl-period"
        required
        help="The month this expense is booked."
        error={errors.glPeriod}
        readOnly={readOnly}
        readOnlyValue={formatGlMonth(draft.glPeriod)}
      >
        <EntrySelect
          id="ap-gl-period"
          value={draft.glPeriod}
          onChange={(value) => onChange({ glPeriod: value })}
          options={glMonthOptions(draft.glPeriod).map((month) => ({ value: month, label: formatGlMonth(month) }))}
          placeholder="Select month"
          invalid={!!errors.glPeriod}
          aria-describedby={errors.glPeriod ? entryErrorId("ap-gl-period") : undefined}
        />
      </EntryField>

      <EntryField
        label="Service Date"
        htmlFor="ap-service-date"
        auto={autoFields.has("serviceDate")}
        readOnly={readOnly}
        readOnlyValue={formatIsoDate(draft.serviceDate)}
      >
        <DatePicker
          id="ap-service-date"
          value={draft.serviceDate}
          onChange={(value) => onChange({ serviceDate: value }, "serviceDate")}
          className={INPUT_CLASS}
        />
      </EntryField>

      <EntryField label="1099 Type" htmlFor="ap-1099-type" readOnly={readOnly} readOnlyValue={draft.type1099 || "None"}>
        <EntrySelect
          id="ap-1099-type"
          value={draft.type1099}
          onChange={(value) => onChange({ type1099: value })}
          options={TYPE_OPTIONS}
          noneLabel="None"
        />
      </EntryField>

      <EntryField label="1099 Box" htmlFor="ap-1099-box" readOnly={readOnly} readOnlyValue={draft.box1099 || "None"}>
        <EntrySelect
          id="ap-1099-box"
          value={draft.box1099}
          onChange={(value) => onChange({ box1099: value })}
          options={BOX_OPTIONS}
          noneLabel="None"
        />
      </EntryField>

      <div className="hidden sm:block" />

      <EntryField
        label="Additional Check Stub Description"
        htmlFor="ap-stub"
        help="Prints on the check stub."
        readOnly={readOnly}
        readOnlyValue={draft.stubDescription}
        className="sm:col-span-3"
      >
        <Input
          id="ap-stub"
          value={draft.stubDescription}
          onChange={(e) => onChange({ stubDescription: e.target.value })}
          className={INPUT_CLASS}
        />
      </EntryField>
    </div>
  );
};

export default InvoiceHeaderFields;
