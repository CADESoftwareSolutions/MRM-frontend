import React from "react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "./utils";

interface MinimumPaymentFieldProps {
  value: any;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
  /** null while the company settings load. */
  companyDefault: number | null;
  /** The amount the record was loaded with. Once one is saved the override can't be removed. */
  savedValue?: any;
}

const isBlank = (v: any) => v === "" || v === undefined || v === null;

/** Shows the company default until "Override for this owner" is checked. Unchecking clears an
 * unsaved amount; a saved one stays, since the BE can't clear a number yet. */
export const MinimumPaymentField = ({
  value,
  onChange,
  onBlur,
  invalid,
  companyDefault,
  savedValue,
}: MinimumPaymentFieldProps) => {
  const locked = !isBlank(savedValue);
  const [override, setOverride] = React.useState(!isBlank(value));
  const [focusOnShow, setFocusOnShow] = React.useState(false);
  const checkboxId = React.useId();
  const overriding = locked || override || !isBlank(value);

  return (
    <div>
      {overriding ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/70">$</span>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            autoFocus={focusOnShow}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              if (locked && isBlank(value)) onChange(String(savedValue));
              onBlur();
            }}
            placeholder={companyDefault != null ? companyDefault.toFixed(2) : "0.00"}
            aria-label="Minimum payment amount for this owner"
            className={`bg-white/5 border-purple-300/30 text-white h-9 pl-7 tabular-nums ${invalid ? "ring-1 ring-red-500" : ""}`}
          />
        </div>
      ) : (
        <div className="relative">
          <p className="h-9 flex items-center pl-3 pr-36 rounded-md bg-white/5 border border-dashed border-purple-300/30 text-white/70 text-sm tabular-nums">
            {companyDefault != null ? formatMoney(companyDefault) : "—"}
          </p>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap bg-white/10 text-purple-200">
            Company default
          </span>
        </div>
      )}
      <label
        htmlFor={checkboxId}
        className={`mt-2 flex w-fit items-center gap-2 text-[13px] text-white ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={overriding}
          disabled={locked}
          onChange={(e) => {
            const next = e.target.checked;
            setOverride(next);
            setFocusOnShow(next);
            if (!next) onChange("");
          }}
          className={`h-4 w-4 accent-purple-600 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
        />
        Override for this owner
      </label>
      {locked && (
        <p className="form-help-text text-xs mt-1">
          Returning to the company default needs backend support — change the amount instead.
        </p>
      )}
    </div>
  );
};

export default MinimumPaymentField;
