import { useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Check, Eye, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useApInvoices } from "@/hooks/useApInvoices";
import { useAllVendorDefaults } from "@/hooks/useVendorDefaults";
import { checkRunProblems, useCheckRuns } from "@/hooks/useCheckRuns";
import { formatIsoDate, formatUsd } from "@/types/apInvoices";
import { CheckRun, formatCheckRange } from "@/types/checkRuns";
import { CheckPreviewModal } from "./CheckPreviewModal";
import { ConfirmRunModal } from "./ConfirmRunModal";
import { RunChecksTable } from "./RunChecksTable";
import { RunOverview } from "./RunOverview";
import {
  CARD_CLASS,
  ErrorBanner,
  PRIMARY_BUTTON_CLASS,
  ProblemsAlert,
  dangerButtonClass,
  errorMessage,
  outlineButtonClass,
  pluralize,
} from "./ui";

interface ApproveRunStepProps {
  run: CheckRun;
  onApproved: (run: CheckRun) => void;
  onRejected: (run: CheckRun) => void;
}

export const ApproveRunStep = ({ run, onApproved, onRejected }: ApproveRunStepProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const showToast = useSetAtom(showToastAtom);
  const { invoices, loading: invoicesLoading } = useApInvoices();
  const { defaultsFor, loading: defaultsLoading } = useAllVendorDefaults();
  const { approveRun, rejectRun, getBankAccount } = useCheckRuns();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const bank = getBankAccount(run.bankAccountId);
  const invoicesById = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices]);
  const problems = useMemo(
    () =>
      invoicesLoading || defaultsLoading
        ? []
        : checkRunProblems(run, invoicesById, (vendorId) => defaultsFor(vendorId).pay),
    [invoicesLoading, defaultsLoading, defaultsFor, run, invoicesById],
  );

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      const approved = await approveRun(run.id);
      showToast(`Approved the ${formatIsoDate(approved.checkDate)} check run · ready to print`);
      onApproved(approved);
    } catch (e) {
      setError(errorMessage(e, "Couldn't approve this check run."));
    } finally {
      setBusy(false);
    }
  };

  const reject = async (reason: string) => {
    const rejected = await rejectRun(run.id, reason);
    showToast(`Sent the ${formatIsoDate(rejected.checkDate)} check run back to Draft`);
    setRejecting(false);
    onRejected(rejected);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className={`${CARD_CLASS} flex flex-col gap-4 p-5`}>
        <RunOverview
          run={run}
          bank={bank}
          title={`Check run · ${formatIsoDate(run.checkDate)}`}
          actions={
            <>
              <Button variant="outline" onClick={() => setPreviewing(true)} className={outlineButtonClass(isLight)}>
                <Eye className="w-4 h-4" />
                Preview Checks
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejecting(true)}
                disabled={busy}
                className={dangerButtonClass(isLight)}
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
              <Button onClick={approve} disabled={busy || problems.length > 0} className={PRIMARY_BUTTON_CLASS}>
                <Check className="w-4 h-4" />
                Approve
              </Button>
            </>
          }
        />
        {problems.length > 0 && <ProblemsAlert problems={problems} hint="Reject the run to fix it." />}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        <p className="text-xs text-white/50">
          Approving lets these checks print. Nothing is paid or posted to the G/L until someone confirms the checks
          printed correctly. Anyone can approve a run for now.
        </p>
      </section>

      <RunChecksTable run={run} invoicesById={invoicesById} />

      {previewing && (
        <CheckPreviewModal
          checks={run.checks}
          checkDate={run.checkDate}
          bank={bank}
          onClose={() => setPreviewing(false)}
        />
      )}

      {rejecting && (
        <ConfirmRunModal
          title="Reject check run"
          icon={<XCircle className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
          confirmLabel="Reject run"
          danger
          reason={{
            label: "Reason",
            placeholder: "e.g. Hold the Comanche check until the October tickets are signed",
            missing: "Enter a reason so whoever built the run knows what to fix.",
          }}
          onConfirm={reject}
          onCancel={() => setRejecting(false)}
        >
          <p>
            <span className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
              {pluralize(run.checks.length, "check")} · {formatCheckRange(run.checks)} · {formatUsd(run.total)}
            </span>{" "}
            goes back to Draft with your reason. Its invoices come out of the run until it&apos;s submitted again.
          </p>
        </ConfirmRunModal>
      )}
    </div>
  );
};

export default ApproveRunStep;
