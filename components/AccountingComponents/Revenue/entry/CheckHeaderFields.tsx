import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import type { ContactOption } from "@/hooks/useContactOptions";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/types/revenue";
import { ContactPicker } from "../../../FormComponents/ContactPicker";
import { AccountPicker } from "../../AccountPicker";
import { CheckDraft, HeaderErrors, HeaderField, OPERATOR_CLASSIFICATIONS } from "./checkDraft";
import { INPUT_CLASS, READ_ONLY_CLASS, useEntryTheme } from "./entryTheme";
import { FieldShell } from "./FieldShell";
import { MonthPicker } from "./MonthPicker";
import { NumberInput } from "./NumberInput";

export interface CheckHeaderFieldsProps {
  draft: CheckDraft;
  errors: HeaderErrors;
  autoFilled: ReadonlySet<HeaderField>;
  readOnly: boolean;
  /** `field` names the header field being edited, so its AUTO badge can clear. */
  onChange: (patch: Partial<CheckDraft>, field?: HeaderField) => void;
}

const FIELD_CLASS = cn(INPUT_CLASS, READ_ONLY_CLASS);

/** The check's header: who paid whom, the check itself and where it was deposited. */
export const CheckHeaderFields = ({ draft, errors, autoFilled, readOnly, onChange }: CheckHeaderFieldsProps) => {
  const theme = useEntryTheme();

  const unmatchedNote = (name: string) =>
    !readOnly && name.trim() ? (
      <p className={cn("mt-1 text-xs", theme.warnText)}>
        Printed as &ldquo;{name}&rdquo;. Pick the matching contact.
      </p>
    ) : null;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      <FieldShell
        htmlFor="rc-operator"
        label="Operator"
        required
        autoFilled={autoFilled.has("operator")}
        help="Contacts with the OPERATOR or PURCHASER classification."
        error={errors.operator}
        className="sm:col-span-2"
      >
        <ContactPicker
          id="rc-operator"
          aria-label="Operator"
          value={draft.operatorId}
          onChange={(id, option: ContactOption) => onChange({ operatorId: id, operatorName: option.name }, "operator")}
          classifications={OPERATOR_CLASSIFICATIONS}
          placeholder={draft.operatorName || "Select operator"}
          invalid={Boolean(errors.operator)}
          disabled={readOnly}
          className={READ_ONLY_CLASS}
        />
        {!draft.operatorId && unmatchedNote(draft.operatorName)}
      </FieldShell>

      <FieldShell
        htmlFor="rc-owner"
        label="Owner"
        required
        autoFilled={autoFilled.has("owner")}
        error={errors.owner}
        className="sm:col-span-2"
      >
        <ContactPicker
          id="rc-owner"
          aria-label="Owner"
          value={draft.ownerId}
          onChange={(id, option: ContactOption) => onChange({ ownerId: id, ownerName: option.name }, "owner")}
          placeholder={draft.ownerName || "Select owner"}
          invalid={Boolean(errors.owner)}
          disabled={readOnly}
          className={READ_ONLY_CLASS}
        />
        {!draft.ownerId && unmatchedNote(draft.ownerName)}
      </FieldShell>

      <FieldShell
        htmlFor="rc-owner-number"
        label="Owner Number"
        autoFilled={autoFilled.has("ownerNumber")}
        help="The operator's number for this owner. Remembered per operator."
      >
        <Input
          id="rc-owner-number"
          value={draft.ownerNumber}
          onChange={(event) => onChange({ ownerNumber: event.target.value }, "ownerNumber")}
          disabled={readOnly}
          className={FIELD_CLASS}
        />
      </FieldShell>

      <FieldShell
        htmlFor="rc-check-number"
        label="Check Number"
        required
        autoFilled={autoFilled.has("checkNumber")}
        error={errors.checkNumber}
      >
        <Input
          id="rc-check-number"
          value={draft.checkNumber}
          onChange={(event) => onChange({ checkNumber: event.target.value }, "checkNumber")}
          disabled={readOnly}
          aria-invalid={Boolean(errors.checkNumber) || undefined}
          className={cn(FIELD_CLASS, errors.checkNumber && "ring-1 ring-red-500")}
        />
      </FieldShell>

      <FieldShell
        htmlFor="rc-check-date"
        label="Check Date"
        required
        autoFilled={autoFilled.has("checkDate")}
        error={errors.checkDate}
      >
        <DatePicker
          id="rc-check-date"
          value={draft.checkDate}
          onChange={(date) => onChange({ checkDate: date }, "checkDate")}
          disabled={readOnly}
          invalid={Boolean(errors.checkDate)}
          className={FIELD_CLASS}
        />
      </FieldShell>

      <FieldShell
        htmlFor="rc-check-amount"
        label="Check Amount"
        required
        autoFilled={autoFilled.has("checkAmount")}
        error={errors.checkAmount}
      >
        <NumberInput
          id="rc-check-amount"
          value={draft.checkAmount}
          onValueChange={(amount) => onChange({ checkAmount: amount ?? 0 }, "checkAmount")}
          format={formatMoney}
          prefix="$"
          fieldLabel="Check Amount"
          disabled={readOnly}
          invalid={Boolean(errors.checkAmount)}
          className={FIELD_CLASS}
        />
      </FieldShell>

      <FieldShell htmlFor="rc-deposit-to" label="Deposit To">
        <AccountPicker
          id="rc-deposit-to"
          aria-label="Deposit account"
          value={draft.depositAccountId}
          onChange={(id) => onChange({ depositAccountId: id })}
          categories={["CASH"]}
          disabled={readOnly}
          className={READ_ONLY_CLASS}
        />
      </FieldShell>

      <FieldShell htmlFor="rc-deposit-date" label="Deposit Date">
        <DatePicker
          id="rc-deposit-date"
          value={draft.depositDate ?? ""}
          onChange={(date) => onChange({ depositDate: date || null })}
          disabled={readOnly}
          className={FIELD_CLASS}
        />
      </FieldShell>

      <FieldShell htmlFor="rc-gl-period" label="G/L Period" required error={errors.glPeriod}>
        <MonthPicker
          id="rc-gl-period"
          aria-label="G/L period"
          value={draft.glPeriod}
          onChange={(period) => onChange({ glPeriod: period }, "glPeriod")}
          disabled={readOnly}
          invalid={Boolean(errors.glPeriod)}
        />
      </FieldShell>
    </div>
  );
};

export default CheckHeaderFields;
