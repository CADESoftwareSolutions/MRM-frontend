import { Check } from "lucide-react";
import { useImportTheme } from "./importTheme";

export type ImportStep = 1 | 2 | 3 | 4;

export interface ImportStepperProps {
  current: ImportStep;
  /** One line under each step's name, in step order. */
  notes: [string, string, string, string];
  /** Called when a finished step is clicked; leave it out to make finished steps plain. */
  onSelect?: (step: ImportStep) => void;
}

const STEP_NAMES = ["Upload", "Match", "Review", "Save"] as const;

export const ImportStepper = ({ current, notes, onSelect }: ImportStepperProps) => {
  const theme = useImportTheme();
  return (
    <ol
      aria-label="Import steps"
      className="flex flex-wrap gap-3 rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3"
    >
      {STEP_NAMES.map((name, index) => {
        const step = (index + 1) as ImportStep;
        const done = step < current;
        const active = step === current;
        const body = (
          <>
            <span
              className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                done ? theme.okDot : active ? "bg-purple-600 text-white" : "bg-white/10 text-purple-200"
              }`}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : step}
            </span>
            <span className="min-w-0 text-left">
              <span className={`block text-sm font-semibold ${done || active ? "text-white" : "text-white/70"}`}>
                {name}
                {done && <span className="sr-only"> (done)</span>}
              </span>
              <span className="block break-words text-xs text-white/60">{notes[index]}</span>
            </span>
          </>
        );
        return (
          <li key={name} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-[1_1_160px]">
            {done && onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(step)}
                className="flex min-w-0 items-center gap-2.5 rounded-lg cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400/40"
              >
                {body}
              </button>
            ) : (
              <span className="flex min-w-0 items-center gap-2.5">{body}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default ImportStepper;
