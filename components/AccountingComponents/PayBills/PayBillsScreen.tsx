import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useSetAtom } from "jotai";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { isPendingRun, useCheckRuns } from "@/hooks/useCheckRuns";
import { CheckRun } from "@/types/checkRuns";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { ApproveRunStep } from "./ApproveRunStep";
import { ConfirmRunModal } from "./ConfirmRunModal";
import { PendingRunsCard } from "./PendingRunsCard";
import { PrintRunStep } from "./PrintRunStep";
import { RunStep, RunStepper } from "./RunStepper";
import { SelectInvoicesStep } from "./SelectInvoicesStep";

const stepFor = (run: CheckRun | undefined): RunStep =>
  run?.status === "awaiting_approval" ? 2 : run?.status === "approved" ? 3 : 1;

/** The check run: pick invoices (or reopen a started run), get it approved, then print and post. */
export const PayBillsScreen = () => {
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const { pendingRuns, getRun, getBankAccount } = useCheckRuns();

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  // A run a step just returned, until the check-runs query re-renders with it.
  const [justSaved, setJustSaved] = useState<CheckRun | null>(null);
  // Remounts step 1 only when the user switches runs, not when a new run is saved as a draft.
  const [editorKey, setEditorKey] = useState("new-0");
  const newRunCount = useRef(0);
  const [dirty, setDirty] = useState(false);
  const [switchTo, setSwitchTo] = useState<{ type: "open"; id: string } | { type: "new" } | null>(null);
  const isLight = useAtomValue(themeAtom) === "light";

  useEffect(() => {
    setPageHeader({ title: "Pay Bills", subtitle: "Choose the invoices to pay, get approval, then print checks" });
    return () => setPageHeader({});
  }, [setPageHeader]);

  const cached = getRun(activeRunId);
  const fresh = justSaved?.id === activeRunId ? justSaved : undefined;
  const found = cached && fresh ? (fresh.updatedAt > cached.updatedAt ? fresh : cached) : (cached ?? fresh);
  const activeRun = found && isPendingRun(found) ? found : undefined;
  const step = stepFor(activeRun);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeRunId, step]);

  const showRun = (run: CheckRun) => {
    setJustSaved(run);
    setActiveRunId(run.id);
  };

  const doOpenRun = (id: string) => {
    setJustSaved(null);
    setActiveRunId(id);
    setEditorKey(id);
  };

  const doStartNewRun = () => {
    setJustSaved(null);
    setActiveRunId(null);
    newRunCount.current += 1;
    setEditorKey(`new-${newRunCount.current}`);
  };

  const openRun = (id: string) => (step === 1 && dirty ? setSwitchTo({ type: "open", id }) : doOpenRun(id));

  const startNewRun = () => (step === 1 && dirty ? setSwitchTo({ type: "new" }) : doStartNewRun());

  const confirmSwitch = async () => {
    if (switchTo?.type === "open") doOpenRun(switchTo.id);
    else doStartNewRun();
    setSwitchTo(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {pendingRuns.length > 0 && (
        <PendingRunsCard
          runs={pendingRuns}
          activeRunId={activeRun?.id ?? null}
          getBankAccount={getBankAccount}
          onOpen={openRun}
          onNewRun={startNewRun}
        />
      )}

      <RunStepper current={step} />

      {step === 1 && (
        <SelectInvoicesStep
          key={editorKey}
          draft={activeRun ?? null}
          onSubmitted={showRun}
          onSaved={showRun}
          onDiscarded={doStartNewRun}
          onDirtyChange={setDirty}
        />
      )}
      {step === 2 && activeRun && (
        <ApproveRunStep key={activeRun.id} run={activeRun} onApproved={showRun} onRejected={showRun} />
      )}
      {step === 3 && activeRun && (
        <PrintRunStep key={activeRun.id} run={activeRun} onPosted={doStartNewRun} onVoided={doStartNewRun} />
      )}

      {switchTo && (
        <ConfirmRunModal
          title="Discard unsaved changes?"
          icon={<AlertTriangle className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          danger
          onConfirm={confirmSwitch}
          onCancel={() => setSwitchTo(null)}
        >
          <p>The invoices you selected for this check run haven&apos;t been saved. Switching runs drops them.</p>
        </ConfirmRunModal>
      )}
    </div>
  );
};

export default PayBillsScreen;
