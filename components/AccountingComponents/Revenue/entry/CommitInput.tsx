import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReportUnreadable } from "./unreadableFields";

interface CommitInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string;
  /** Called on blur or Enter, only when the text changed and parses. */
  onCommit: (value: string) => void;
  /** Turns typed text into the stored value; null marks it unreadable, which keeps the text up
   * (in red) without committing. Defaults to trimming. */
  parse?: (text: string) => string | null;
  /** How the stored value shows while the field isn't being edited. */
  format?: (value: string) => string;
  invalid?: boolean;
  /** Shown under the field while the typed text can't be read. */
  unreadableMessage?: string;
  /** Names the field in the message that blocks Save while its text can't be read. */
  fieldLabel?: string;
}

/** A text field that commits when the user leaves it rather than on every keystroke, for values
 * that move things around (a line's Operator CC regroups it) or need parsing (Prod Date). */
export const CommitInput = ({
  value,
  onCommit,
  parse = (text) => text.trim(),
  format = (v) => v,
  invalid,
  unreadableMessage,
  fieldLabel,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: CommitInputProps) => {
  const [text, setText] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const messageId = useId();
  useReportUnreadable(unreadable, fieldLabel ?? props["aria-label"] ?? props.id);

  const commit = () => {
    if (text === null) return;
    const parsed = parse(text);
    if (parsed === null) {
      setUnreadable(true);
      return;
    }
    setUnreadable(false);
    setText(null);
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <div className="w-full">
      <Input
        {...props}
        type="text"
        autoComplete="off"
        value={text ?? format(value)}
        aria-invalid={invalid || unreadable || undefined}
        aria-describedby={unreadable && unreadableMessage ? messageId : props["aria-describedby"]}
        onFocus={(event) => {
          if (text === null) setText(format(value));
          onFocus?.(event);
        }}
        onChange={(event) => {
          setText(event.target.value);
          setUnreadable(false);
        }}
        onBlur={(event) => {
          commit();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            setText(null);
            setUnreadable(false);
          }
          onKeyDown?.(event);
        }}
        className={cn(className, (invalid || unreadable) && "ring-1 ring-red-500")}
      />
      {unreadable && unreadableMessage && <p id={messageId} className="mt-1 text-xs text-red-400">
          {unreadableMessage}
        </p>}
    </div>
  );
};

export default CommitInput;
