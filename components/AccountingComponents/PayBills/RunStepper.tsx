import { Check } from "lucide-react";

export type RunStep = 1 | 2 | 3;

const STEPS: { step: RunStep; title: string; detail: string }[] = [
  { step: 1, title: "Select invoices", detail: "What to pay and how much" },
  { step: 2, title: "Approve", detail: "An approver signs off on the run" },
  { step: 3, title: "Print & post", detail: "Confirm printed, then post to G/L" },
];

export const RunStepper = ({ current }: { current: RunStep }) => (
  <ol
    aria-label="Check run steps"
    className="flex flex-wrap gap-3 rounded-xl border border-purple-300/20 bg-white/5 px-4 py-3"
  >
    {STEPS.map(({ step, title, detail }) => {
      const done = step < current;
      const active = step === current;
      return (
        <li
          key={step}
          aria-current={active ? "step" : undefined}
          className="flex flex-[1_1_160px] items-center gap-2.5"
        >
          <span
            className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
              active || done ? "bg-purple-600 text-white" : "bg-white/10 text-purple-200"
            }`}
          >
            {done ? <Check className="size-4" strokeWidth={3} aria-label="Done" /> : step}
          </span>
          <span className="min-w-0">
            <strong className={`block text-sm ${active ? "text-white" : "text-white/70"}`}>{title}</strong>
            <span className="block text-xs text-white/50">{detail}</span>
          </span>
        </li>
      );
    })}
  </ol>
);

export default RunStepper;
