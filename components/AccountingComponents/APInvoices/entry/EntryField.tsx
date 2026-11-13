import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { Label } from "@/components/ui/label";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";
import { AutoFilledBadge } from "../../AutoFilledBadge";

interface EntryFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  /** Shows the AUTO badge: the value was read from the invoice document. */
  auto?: boolean;
  help?: ReactNode;
  /** Yellow help, e.g. "Matches JE-26-04412". */
  warning?: ReactNode;
  error?: string;
  /** Read-only invoices show this text in a static box instead of the input. */
  readOnly?: boolean;
  readOnlyValue?: ReactNode;
  className?: string;
  children?: ReactNode;
}

// index.css sets every input's border outside Tailwind's layers, so a border-* utility can't
// flag a field; a ring can.
export const ERROR_RING = "ring-1 ring-red-500";

/** Id of the error text under a field, for the control's aria-describedby. */
export const entryErrorId = (htmlFor: string) => `${htmlFor}-error`;

export const readOnlyBoxClass =
  "min-h-9 flex items-center px-3 py-1.5 rounded-md bg-white/5 border border-dashed border-purple-300/20 text-white/70 text-sm";

export const EntryField = ({
  label,
  htmlFor,
  required,
  auto,
  help,
  warning,
  error,
  readOnly,
  readOnlyValue,
  className,
  children,
}: EntryFieldProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={readOnly ? undefined : htmlFor} className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
        {label}
        {required && !readOnly && <span className="text-red-500 text-sm font-bold">*</span>}
        {auto && !readOnly && <AutoFilledBadge className="ml-1" />}
      </Label>
      {readOnly ? (
        <div className={readOnlyBoxClass}>
          <span className="truncate">{readOnlyValue || "—"}</span>
        </div>
      ) : (
        children
      )}
      {error && !readOnly && (
        <p id={htmlFor ? entryErrorId(htmlFor) : undefined} className="text-red-400 text-xs mt-1">
          {error}
        </p>
      )}
      {!error && warning && !readOnly && (
        <p className={cn("text-xs mt-1", isLight ? "text-yellow-700" : "text-yellow-300")}>{warning}</p>
      )}
      {!error && !warning && help && !readOnly && <p className="form-help-text text-xs mt-1">{help}</p>}
    </div>
  );
};

export default EntryField;
