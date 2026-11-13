import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SSN_TAX_TYPES } from "@/config/contactsConfig";

export type TaxIdFormat = "ssn" | "ein" | null;

export const taxIdFormatFor = (taxType?: string | null): TaxIdFormat =>
  !taxType ? null : SSN_TAX_TYPES.includes(taxType) ? "ssn" : "ein";

export const taxIdDigits = (value?: string | null) => String(value ?? "").replace(/\D/g, "");

/** SSN ###-##-####, EIN ##-#######, or bare digits before a Tax Type is picked. */
export const formatTaxId = (value: string, format: TaxIdFormat): string => {
  const d = taxIdDigits(value).slice(0, 9);
  if (format === "ssn") return [d.slice(0, 3), d.slice(3, 5), d.slice(5)].filter(Boolean).join("-");
  if (format === "ein") return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
  return d;
};

export const maskTaxId = (value: string, format: TaxIdFormat): string => {
  const last4 = taxIdDigits(value).slice(-4);
  if (format === "ssn") return `•••-••-${last4}`;
  if (format === "ein") return `••-•••${last4}`;
  return `•••••${last4}`;
};

const HELP: Record<"ssn" | "ein" | "none", string> = {
  ssn: "SSN format (###-##-####) for this Tax Type. Entity types switch to EIN (##-#######).",
  ein: "EIN format (##-#######) for this Tax Type. Individual/Sole Proprietor uses SSN (###-##-####).",
  none: "Pick a Tax Type to format this as an SSN or EIN.",
};

const PLACEHOLDER: Record<"ssn" | "ein" | "none", string> = {
  ssn: "###-##-####",
  ein: "##-#######",
  none: "9 digits",
};

interface TaxIdInputProps {
  value: any;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
  taxType?: string | null;
  /** Without Tax access the saved ID stays masked; a new one can still be entered. */
  canReveal: boolean;
  /** Called each time the saved Tax ID is shown in full, so the view can be logged. */
  onReveal?: () => void;
}

export const TaxIdInput = ({ value, onChange, onBlur, invalid, taxType, canReveal, onReveal }: TaxIdInputProps) => {
  const format = taxIdFormatFor(taxType);
  const formatKey = format ?? "none";
  const text = value == null ? "" : String(value);
  const [revealed, setRevealed] = React.useState(false);
  // Typing a new ID into an empty field keeps it visible until the field loses focus.
  const [entering, setEntering] = React.useState(false);
  const plain = !text || entering || (revealed && canReveal);

  const prevFormat = React.useRef(format);
  React.useEffect(() => {
    if (prevFormat.current === format) return;
    prevFormat.current = format;
    if (!text) return;
    const next = formatTaxId(text, format);
    if (next !== text) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const toggle = () => {
    if (plain) {
      setRevealed(false);
      setEntering(false);
      return;
    }
    setRevealed(true);
    onReveal?.();
  };

  const inputClass = `bg-white/5 border-purple-300/30 text-white h-9 tabular-nums tracking-wide ${invalid ? "ring-1 ring-red-500" : ""}`;

  return (
    <div>
      <div className="flex gap-1.5">
        {plain ? (
          <Input
            value={text}
            onChange={(e) => onChange(formatTaxId(e.target.value, format))}
            onFocus={() => {
              if (!text) setEntering(true);
            }}
            onBlur={() => {
              setEntering(false);
              onBlur();
            }}
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            placeholder={PLACEHOLDER[formatKey]}
            aria-label="Tax ID"
            className={inputClass}
          />
        ) : (
          <Input
            readOnly
            value={maskTaxId(text, format)}
            aria-label="Tax ID (hidden)"
            title={canReveal ? "Show the full Tax ID to edit it" : "Only users with Tax access can see the full Tax ID"}
            className={`${inputClass} cursor-default`}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!text || (!plain && !canReveal)}
          // Keeps focus in the input so a click while entering hides it instead of blurring first.
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          aria-label={plain ? "Hide Tax ID" : "Show full Tax ID"}
          aria-pressed={plain && Boolean(text)}
          className="h-9 w-9 shrink-0 border border-purple-300/30 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
        >
          {plain && text ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
      <p className="form-help-text text-xs mt-1">{HELP[formatKey]}</p>
    </div>
  );
};

export default TaxIdInput;
