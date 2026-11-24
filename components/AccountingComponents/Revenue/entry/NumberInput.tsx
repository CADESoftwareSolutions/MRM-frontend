import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReportUnreadable } from "./unreadableFields";

/** Reads "1,234.56", "$12", "12%", "(132.11)" and "132.11-" (stub-style negatives); null when
 * the text isn't a number. */
export const parseNumberText = (text: string): number | null => {
  let core = text.trim().replace(/[$,%\s]/g, "");
  let negative = false;
  const parens = /^\((.*)\)$/.exec(core);
  if (parens) {
    core = parens[1];
    negative = true;
  } else if (/^[^-]+-$/.test(core)) {
    core = core.slice(0, -1);
    negative = true;
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(core)) return null;
  const value = Number(core);
  return negative ? -value : value;
};

export const formatDecimal = (
  value: number,
  minDigits: number,
  maxDigits: number,
) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

interface NumberInputProps extends Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "prefix"
> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** How the value shows while the field isn't being edited. */
  format?: (value: number) => string;
  /** Empty text commits null instead of 0. */
  nullable?: boolean;
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
  /** Names the field in the message that blocks Save while its text can't be read. */
  fieldLabel?: string;
}

/** A right-aligned number field that shows the formatted value until it's focused, then the raw
 * number. Every keystroke that reads as a number commits, so totals update as the user types. */
export const NumberInput = ({
  value,
  onValueChange,
  format = (v) => formatDecimal(v, 0, 6),
  nullable = false,
  prefix,
  suffix,
  invalid,
  fieldLabel,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) => {
  const [text, setText] = useState<string | null>(null);
  const badText =
    text !== null &&
    !/^[-+($]*\.?$/.test(text.trim()) &&
    parseNumberText(text) === null;
  const shown = text ?? (value == null ? "" : format(value));
  const messageId = useId();
  useReportUnreadable(badText, fieldLabel ?? props["aria-label"] ?? props.id);

  return (
    <div className="w-full">
      <div className="relative w-full">
        {prefix && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-white/60">
            {prefix}
          </span>
        )}
        <Input
          {...props}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          aria-invalid={invalid || badText || undefined}
          aria-describedby={badText ? messageId : props["aria-describedby"]}
          onFocus={(event) => {
            if (text === null)
              setText(
                value == null || (!nullable && value === 0)
                  ? ""
                  : String(value),
              );
            event.target.select();
            onFocus?.(event);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (!next.trim()) {
              onValueChange(nullable ? null : 0);
              return;
            }
            const parsed = parseNumberText(next);
            if (parsed !== null) onValueChange(parsed);
          }}
          onBlur={(event) => {
            if (!badText) setText(null);
            onBlur?.(event);
          }}
          className={cn(
            "text-right tabular-nums",
            className,
            prefix && "pl-6",
            suffix && "pr-6",
            (invalid || badText) && "ring-1 ring-red-500",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/60">
            {suffix}
          </span>
        )}
      </div>
      {badText && (
        <p id={messageId} className="mt-1 text-right text-xs text-red-400">
          Not a number
        </p>
      )}
    </div>
  );
};

export default NumberInput;
