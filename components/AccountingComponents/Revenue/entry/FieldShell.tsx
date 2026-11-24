import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AutoFilledBadge } from "../../AutoFilledBadge";

interface FieldShellProps {
  htmlFor?: string;
  label: string;
  required?: boolean;
  /** Shows the AUTO badge: the value was read from the check stub. */
  autoFilled?: boolean;
  help?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

export const FieldShell = ({
  htmlFor,
  label,
  required,
  autoFilled,
  help,
  error,
  className,
  children,
}: FieldShellProps) => {
  const baseId = useId();
  const errorId = error ? `${baseId}-error` : undefined;
  const helpId = help ? `${baseId}-help` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const field =
    isValidElement(children) && (describedBy || required)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          ...(describedBy && { "aria-describedby": describedBy }),
          ...(required && { "aria-required": true }),
        })
      : children;

  return (
    <div className={cn("min-w-0", className)}>
      <Label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-1 text-sm font-semibold text-white"
      >
        {label}
        {required && <span className="text-sm font-bold text-red-500">*</span>}
        {autoFilled && <AutoFilledBadge className="ml-1" />}
      </Label>
      {field}
      {help && (
        <div id={helpId} className="form-help-text mt-1 text-xs">
          {help}
        </div>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default FieldShell;
