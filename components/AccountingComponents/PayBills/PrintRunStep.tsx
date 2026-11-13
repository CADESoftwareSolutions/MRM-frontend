import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Ban, CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useApInvoices } from "@/hooks/useApInvoices";
import { useAllVendorDefaults } from "@/hooks/useVendorDefaults";
import { checkRunProblems, useCheckRuns } from "@/hooks/useCheckRuns";
import { formatIsoDate, formatUsd } from "@/types/apInvoices";
import { CHECK_STOCK_LABEL, CheckRun, formatCheckRange } from "@/types/checkRuns";
import { CheckPreview } from "./CheckPreview";
import { CheckPrintPortal } from "./CheckPrintPortal";
import { useCheckPreviews } from "./checkPreviewData";
import { ConfirmRunModal } from "./ConfirmRunModal";
import { RunOverview } from "./RunOverview";
import {
  CARD_CLASS,
  PRIMARY_BUTTON_CLASS,
  ProblemsAlert,
  dangerButtonClass,
  formatStamp,
  outlineButtonClass,
  pluralize,
} from "./ui";

interface PrintRunStepProps {
  run: CheckRun;
  onPosted: () => void;
  onVoided: () => void;
}

export const PrintRunStep = ({ run, onPosted, onVoided }: PrintRunStepProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const showToast = useSetAtom(showToastAtom);
  const { invoices, loading: invoicesLoading } = useApInvoices();
  const { defaultsFor, loading: defaultsLoading } = useAllVendorDefaults();
  const { markRunPrinted, postRun, voidRun, getBankAccount } = useCheckRuns();

  const [confirmingPost, setConfirmingPost] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [askingPrinted, setAskingPrinted] = useState(false);

  const bank = getBankAccount(run.bankAccountId);
  const previews = useCheckPreviews(run.checks, run.checkDate, bank);
  const invoicesById = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices]);
  const problems = useMemo(() => {
    if (invoicesLoading || defaultsLoading) return [];
    const found = checkRunProblems(run, invoicesById, (vendorId) => defaultsFor(vendorId).pay);
    for (const check of run.checks) {
      if (!(check.amount > 0)) found.push(`Check #${check.checkNumber} is for $0.00`);
    }
    return found;
  }, [invoicesLoading, defaultsLoading, defaultsFor, run, invoicesById]);
  const blocked = invoicesLoading || defaultsLoading || problems.length > 0;
  const printed = !!run.printedAt;
  const range = formatCheckRange(run.checks);

  useEffect(() => {
    if (!printing) return;
    const done = () => {
      setPrinting(false);
      setAskingPrinted(true);
    };
    window.addEventListener("afterprint", done, { once: true });
    return () => window.removeEventListener("afterprint", done);
  }, [printing]);

  const startPrint = () => {
    setPrinting(true);
  };

  const openPrintDialog = useCallback(() => window.print(), []);

  const confirmPrinted = async () => {
    await markRunPrinted(run.id);
    setAskingPrinted(false);
  };

  const post = async () => {
    const { run: posted } = await postRun(run.id);
    showToast(
      `Posted ${pluralize(posted.checks.length, "check")} · ${range} · ${formatUsd(posted.total)}. The invoices are marked paid.`,
    );
    setConfirmingPost(false);
    onPosted();
  };

  const voidIt = async () => {
    await voidRun(run.id);
    showToast(`Voided the ${formatIsoDate(run.checkDate)} check run. Its invoices are back to Approved.`);
    setVoiding(false);
    onVoided();
  };

  const strong = `font-medium ${isLight ? "text-gray-900" : "text-white"}`;

  return (
    <div className="flex flex-col gap-4">
      <section className={`${CARD_CLASS} flex flex-col gap-4 p-5`}>
        <RunOverview
          run={run}
          bank={bank}
          title={`Print checks · ${formatIsoDate(run.checkDate)}`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setVoiding(true)}
                disabled={printing}
                className={dangerButtonClass(isLight)}
              >
                <Ban className="w-4 h-4" />
                Void run
              </Button>
              <Button
                variant={printed ? "outline" : "default"}
                onClick={startPrint}
                disabled={blocked || printing}
                className={printed ? outlineButtonClass(isLight) : PRIMARY_BUTTON_CLASS}
              >
                <Printer className="w-4 h-4" />
                {printed ? "Print again" : "Print checks"}
              </Button>
              <Button
                variant={printed ? "default" : "outline"}
                onClick={() => setConfirmingPost(true)}
                disabled={printing || blocked || !printed}
                title={printed ? undefined : "Print the checks first"}
                className={printed ? PRIMARY_BUTTON_CLASS : outlineButtonClass(isLight)}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm printed &amp; post
              </Button>
            </>
          }
        />
        {problems.length > 0 && <ProblemsAlert problems={problems} hint="Void the run and start a new one." />}
        <p className="text-xs text-white/50">
          {printed
            ? `Printed by ${run.printedBy} · ${formatStamp(run.printedAt)}. Check every printed check; if one misprinted, print again before you confirm. Nothing is paid or posted until you confirm.`
            : `Load ${CHECK_STOCK_LABEL} check stock. In the print dialog set Margins to None, Scale to 100% and turn off headers and footers. The dashed envelope guides below don't print.`}
        </p>
      </section>

      <div className="overflow-x-auto pb-2 print:hidden">
        <div className="mx-auto flex w-max flex-col gap-6">
          {previews.map((check) => (
            <CheckPreview key={check.checkNumber} check={check} showGuides />
          ))}
        </div>
      </div>

      {printing && !blocked && <CheckPrintPortal checks={previews} onReady={openPrintDialog} />}

      {askingPrinted && (
        <ConfirmRunModal
          title="Did all checks print correctly?"
          icon={<Printer className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
          confirmLabel="Yes, all printed"
          cancelLabel="No, not all printed"
          onConfirm={confirmPrinted}
          onCancel={() => setAskingPrinted(false)}
        >
          <p>
            Check <span className={strong}>{pluralize(run.checks.length, "check")}</span> ({range}) on the paper.
          </p>
          <p>
            Yes records the checks as printed so you can post them. No leaves the run unprinted so you can print it
            again; the same check numbers are used, so destroy any misprinted checks.
          </p>
        </ConfirmRunModal>
      )}

      {confirmingPost && (
        <ConfirmRunModal
          title="Confirm printed & post"
          icon={<CheckCircle2 className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
          confirmLabel="Post checks"
          onConfirm={post}
          onCancel={() => setConfirmingPost(false)}
        >
          <p>
            Did all <span className={strong}>{pluralize(run.checks.length, "check")}</span> ({range}) print correctly?
          </p>
          <p>
            Posting records {pluralize(run.checks.length, "payment")} totaling{" "}
            <span className={`${strong} tabular-nums`}>{formatUsd(run.total)}</span> dated{" "}
            {formatIsoDate(run.checkDate)}, marks the invoices paid and posts to the G/L. It can&apos;t be undone from
            this screen.
          </p>
          <p>If a check misprinted, cancel and print again first.</p>
        </ConfirmRunModal>
      )}

      {voiding && (
        <ConfirmRunModal
          title="Void check run"
          icon={<Ban className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
          confirmLabel="Void run"
          danger
          onConfirm={voidIt}
          onCancel={() => setVoiding(false)}
        >
          <p>
            Nothing is paid or posted. The run&apos;s {pluralize(run.items.length, "invoice")}{" "}
            {run.items.length === 1 ? "goes" : "go"} back to Approved so {run.items.length === 1 ? "it" : "they"} can be
            paid in another run.
          </p>
          {printed && (
            <p className={`font-medium ${isLight ? "text-red-700" : "text-red-300"}`}>
              These checks were already printed: destroy checks {range}. Their numbers won&apos;t be used again.
            </p>
          )}
        </ConfirmRunModal>
      )}
    </div>
  );
};

export default PrintRunStep;
