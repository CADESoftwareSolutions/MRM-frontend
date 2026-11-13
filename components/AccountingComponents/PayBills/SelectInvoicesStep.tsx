import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AlertTriangle, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useApInvoices } from "@/hooks/useApInvoices";
import { invoicesHeldByRuns, planChecks, useCheckRuns } from "@/hooks/useCheckRuns";
import { useAllVendorDefaults } from "@/hooks/useVendorDefaults";
import {
  AP_STATUS_LABELS,
  ApInvoice,
  addDaysIso,
  formatIsoDate,
  formatMoney,
  formatUsd,
  roundCents,
  todayIso,
} from "@/types/apInvoices";
import {
  CHECK_STOCK_LABEL,
  CheckRun,
  CheckRunInput,
  CheckRunItem,
  formatBankAccountLabel,
  formatCheckRange,
} from "@/types/checkRuns";
import { CheckPreviewModal } from "./CheckPreviewModal";
import { ConfirmRunModal } from "./ConfirmRunModal";
import { FieldSelect } from "./FieldSelect";
import { PayableGroup, PayableInvoiceTable } from "./PayableInvoiceTable";
import {
  CARD_CLASS,
  ErrorBanner,
  FIELD_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECTION_TITLE_CLASS,
  SUB_CARD_CLASS,
  SummaryRow,
  errorMessage,
  formatStamp,
  ghostButtonClass,
  outlineButtonClass,
  pluralize,
} from "./ui";

interface SelectInvoicesStepProps {
  /** The draft being edited; null starts a new run. */
  draft: CheckRun | null;
  onSubmitted: (run: CheckRun) => void;
  onSaved: (run: CheckRun) => void;
  onDiscarded: () => void;
  /** Reports whether the selections differ from what's saved, so the screen can ask before dropping them. */
  onDirtyChange?: (dirty: boolean) => void;
}

const START_NUMBER_WARN_GAP = 50;

/** NaN unless it's a plain amount with at most two decimals; "$" and thousands commas are fine. */
const parseAmount = (text: string): number => {
  const clean = text.replace(/[$,\s]/g, "");
  return /^(\d+\.?\d{0,2}|\.\d{1,2})$/.test(clean) ? Number(clean) : NaN;
};

const amountError = (text: string, balance: number): string | undefined => {
  const value = parseAmount(text);
  if (Number.isNaN(value)) return "Enter an amount like 1,234.56";
  if (!(value > 0)) return "Enter more than 0, or untick it";
  if (roundCents(value) > roundCents(balance)) return `More than the ${formatMoney(balance)} due`;
  return undefined;
};

const endOfMonthIso = (iso: string) => {
  const [year, month] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
};

const parseStartNumber = (text: string): number | null => {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 1 ? Number(trimmed) : null;
};

export const SelectInvoicesStep = ({
  draft,
  onSubmitted,
  onSaved,
  onDiscarded,
  onDirtyChange,
}: SelectInvoicesStepProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const showToast = useSetAtom(showToastAtom);
  const { invoices, loading: invoicesLoading } = useApInvoices();
  const { defaultsFor, loading: defaultsLoading } = useAllVendorDefaults();
  const {
    runs,
    bankAccounts,
    loading: runsLoading,
    nextCheckNumber,
    saveDraftRun,
    createRun,
    submitRun,
    voidRun,
  } = useCheckRuns();

  const today = useMemo(() => todayIso(), []);
  const draftId = draft?.id ?? null;

  const [bankChoice, setBankChoice] = useState(draft?.bankAccountId ?? "");
  const [checkDate, setCheckDate] = useState(draft?.checkDate ?? today);
  // A saved run opens with every due date showing so none of its invoices start out hidden.
  const [dueBy, setDueBy] = useState(draft ? "" : endOfMonthIso(addDaysIso(today, 14)));
  const [vendorFilter, setVendorFilter] = useState("");
  const [startText, setStartText] = useState<string | null>(draft ? String(draft.startingCheckNumber) : null);
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries((draft?.items ?? []).map((item) => [item.invoiceId, formatMoney(item.amount)])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const bankId = bankChoice || bankAccounts[0]?.id || "";
  const bank = bankAccounts.find((b) => b.id === bankId);
  const defaultStart = nextCheckNumber(bankId, draftId);
  const startValue = startText ?? String(defaultStart);
  const startNumber = parseStartNumber(startValue);
  const payFor = (vendorId: string) => defaultsFor(vendorId).pay;

  const held = useMemo(() => invoicesHeldByRuns(runs, draftId), [runs, draftId]);

  const payable = useMemo(
    () => invoices.filter((invoice) => invoice.status === "approved" && invoice.balance > 0 && !held.has(invoice.id)),
    [invoices, held],
  );
  const payableById = useMemo(() => new Map(payable.map((invoice) => [invoice.id, invoice])), [payable]);

  const vendorOptions = useMemo(() => {
    const names = new Map(payable.map((invoice) => [invoice.vendorId, invoice.vendorName]));
    return Array.from(names, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [payable]);

  const groups = useMemo(() => {
    const byVendor = new Map<string, PayableGroup>();
    for (const invoice of payable) {
      if (dueBy && invoice.dueDate > dueBy) continue;
      if (vendorFilter && invoice.vendorId !== vendorFilter) continue;
      const group = byVendor.get(invoice.vendorId) ?? {
        vendorId: invoice.vendorId,
        vendorName: invoice.vendorName,
        pay: defaultsFor(invoice.vendorId).pay,
        invoices: [],
      };
      group.invoices.push(invoice);
      byVendor.set(invoice.vendorId, group);
    }
    const list = Array.from(byVendor.values());
    list.forEach((group) =>
      group.invoices.sort(
        (a, b) => a.dueDate.localeCompare(b.dueDate) || a.invoiceNumber.localeCompare(b.invoiceNumber),
      ),
    );
    return list.sort(
      (a, b) => Number(a.pay === "No") - Number(b.pay === "No") || a.vendorName.localeCompare(b.vendorName),
    );
  }, [payable, dueBy, vendorFilter, defaultsFor]);

  const selectableRows = useMemo(() => groups.filter((g) => g.pay !== "No").flatMap((g) => g.invoices), [groups]);
  const selectedRows = useMemo(
    () => selectableRows.filter((invoice) => invoice.id in amounts),
    [selectableRows, amounts],
  );

  const amountErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const invoice of selectedRows) {
      const message = amountError(amounts[invoice.id], invoice.balance);
      if (message) errors[invoice.id] = message;
    }
    return errors;
  }, [selectedRows, amounts]);
  const errorCount = Object.keys(amountErrors).length;

  const items: CheckRunItem[] = useMemo(
    () =>
      selectedRows
        .filter((invoice) => !amountErrors[invoice.id])
        .map((invoice) => ({ invoiceId: invoice.id, amount: roundCents(parseAmount(amounts[invoice.id])) })),
    [selectedRows, amountErrors, amounts],
  );

  const checks = useMemo(
    () => planChecks(items, payableById, (vendorId) => defaultsFor(vendorId).pay, startNumber ?? defaultStart),
    [items, payableById, defaultsFor, startNumber, defaultStart],
  );
  const total = roundCents(checks.reduce((sum, check) => sum + check.amount, 0));

  const dirty = useMemo(() => {
    const saved = new Map((draft?.items ?? []).map((item) => [item.invoiceId, item.amount]));
    const ids = Object.keys(amounts);
    return (
      ids.length !== saved.size ||
      ids.some((id) => !saved.has(id) || roundCents(parseAmount(amounts[id])) !== saved.get(id))
    );
  }, [amounts, draft]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const checksByVendor = useMemo(() => {
    const byVendor = new Map<string, { count: number; total: number }>();
    for (const check of checks) {
      const entry = byVendor.get(check.vendorId) ?? { count: 0, total: 0 };
      byVendor.set(check.vendorId, { count: entry.count + 1, total: roundCents(entry.total + check.amount) });
    }
    return byVendor;
  }, [checks]);

  const selectableIds = new Set(selectableRows.map((invoice) => invoice.id));
  const hiddenCount = Object.keys(amounts).filter(
    (id) => payableById.has(id) && !selectableIds.has(id) && payFor(payableById.get(id)!.vendorId) !== "No",
  ).length;

  const leftOut = Object.keys(amounts).flatMap((id) => {
    const payableInvoice = payableById.get(id);
    if (payableInvoice) {
      return payFor(payableInvoice.vendorId) === "No"
        ? [`${payableInvoice.vendorName} #${payableInvoice.invoiceNumber} (vendor on hold)`]
        : [];
    }
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return invoicesLoading ? [] : ["An invoice that no longer exists"];
    const reason = held.has(id)
      ? "in another check run"
      : invoice.status !== "approved"
        ? AP_STATUS_LABELS[invoice.status].toLowerCase()
        : "nothing left to pay";
    return [`${invoice.vendorName} #${invoice.invoiceNumber} (${reason})`];
  });

  const selectAll = !selectableRows.length
    ? "none"
    : selectedRows.length === selectableRows.length
      ? "all"
      : selectedRows.length
        ? "some"
        : "none";

  const setAmount = (id: string, text: string | null) =>
    setAmounts((current) => {
      const next = { ...current };
      if (text === null) delete next[id];
      else next[id] = text;
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setAmounts((current) => {
      const next = { ...current };
      for (const invoice of selectableRows) {
        if (!checked) delete next[invoice.id];
        else if (!(invoice.id in next)) next[invoice.id] = formatMoney(invoice.balance);
      }
      return next;
    });

  const reformatAmount = (invoice: ApInvoice) => {
    const text = amounts[invoice.id];
    if (text === undefined) return;
    const value = parseAmount(text);
    if (!Number.isNaN(value)) setAmount(invoice.id, formatMoney(value));
  };

  const fail = (message: string) => {
    setError(message);
    return null;
  };

  const buildInput = (): CheckRunInput | null => {
    if (!bankId) return fail("Choose a bank account");
    if (!checkDate) return fail("Enter the check date");
    if (startNumber === null) return fail("Starting check # must be a whole number");
    if (startTooLow) return fail(startTooLowMessage);
    if (errorCount) return fail(`Fix ${pluralize(errorCount, "pay amount")} first`);
    if (!items.length) return fail("Select at least one invoice to pay");
    return { bankAccountId: bankId, checkDate, startingCheckNumber: startNumber, items };
  };

  const perform = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const input = buildInput();
    if (!input) return;
    void perform(async () => {
      const run = draft ? await submitRun(draft.id, input) : await createRun(input);
      showToast(
        `Sent the ${formatIsoDate(run.checkDate)} check run for approval · ${pluralize(run.checks.length, "check")} · ${formatUsd(
          run.total,
        )}`,
      );
      onSubmitted(run);
    }, "Couldn't submit this check run.");
  };

  const save = () => {
    const input = buildInput();
    if (!input) return;
    void perform(async () => {
      const run = await saveDraftRun(input, draftId);
      showToast(draft ? "Saved changes to the draft check run" : "Saved the check run as a draft");
      onSaved(run);
    }, "Couldn't save this check run.");
  };

  const draftPreviewChecks = useMemo(() => checks.map((check) => ({ ...check, checkNumber: "" })), [checks]);

  const preview = () => {
    if (buildInput()) {
      setError(null);
      setPreviewing(true);
    }
  };

  const discard = async () => {
    if (!draft) return;
    await voidRun(draft.id);
    showToast("Discarded the draft check run");
    setDiscarding(false);
    onDiscarded();
  };

  const startTooLow = startNumber !== null && !!bank && startNumber <= bank.lastCheckNumber;
  const startTooLowMessage = bank
    ? `Starting check # must be higher than #${bank.lastCheckNumber}, the last number used on this account`
    : "";
  const startFarAhead = startNumber !== null && !startTooLow && startNumber > defaultStart + START_NUMBER_WARN_GAP;
  const startError = startNumber === null || startTooLow;
  const muted = isLight ? "text-gray-500" : "text-white/50";

  return (
    <div className="flex flex-col gap-4">
      {draft?.rejectedReason && (
        <div role="status" className="flex gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-red-300" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">
              Rejected by {draft.rejectedBy} · {formatStamp(draft.rejectedAt)}:
            </span>{" "}
            {draft.rejectedReason}. Fix the run and submit it again.
          </p>
        </div>
      )}

      {leftOut.length > 0 && (
        <div role="status" className="flex gap-3 rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-3">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-400">
            Can&apos;t be paid now, so they&apos;re left out of this run: {leftOut.join("; ")}.
          </p>
        </div>
      )}

      <section aria-label="Check run settings" className={`${CARD_CLASS} px-5 py-4`}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="pay-bank" className={LABEL_CLASS}>
              Bank Account
            </Label>
            <FieldSelect
              id="pay-bank"
              value={bankId}
              onChange={(value) => {
                setBankChoice(value);
                setStartText(null);
              }}
              options={bankAccounts.map((b) => ({ value: b.id, label: formatBankAccountLabel(b) }))}
            />
          </div>
          <div>
            <Label htmlFor="pay-check-date" className={LABEL_CLASS}>
              Check Date
            </Label>
            <DatePicker id="pay-check-date" value={checkDate} onChange={setCheckDate} className={FIELD_CLASS} />
          </div>
          <div>
            <Label htmlFor="pay-due-by" className={LABEL_CLASS}>
              Show invoices due by
            </Label>
            <DatePicker
              id="pay-due-by"
              value={dueBy}
              onChange={setDueBy}
              placeholder="Any due date"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <Label htmlFor="pay-vendor" className={LABEL_CLASS}>
              Vendor
            </Label>
            <FieldSelect
              id="pay-vendor"
              value={vendorFilter}
              onChange={setVendorFilter}
              allLabel="All vendors"
              options={vendorOptions}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_620px]">
          <PayableInvoiceTable
            groups={groups}
            loading={invoicesLoading || defaultsLoading || runsLoading}
            today={today}
            amounts={amounts}
            amountErrors={amountErrors}
            checksByVendor={checksByVendor}
            selectAll={selectAll}
            onSelectAll={toggleAll}
            onToggle={(invoice, checked) => setAmount(invoice.id, checked ? formatMoney(invoice.balance) : null)}
            onAmountChange={(invoice, text) => setAmount(invoice.id, text)}
            onAmountBlur={reformatAmount}
          />
          {hiddenCount > 0 && (
            <p className={`mt-2 text-xs ${muted}`}>
              {pluralize(hiddenCount, "selected invoice")} {hiddenCount === 1 ? "is" : "are"} hidden by the filters and
              won&apos;t be paid in this run.{" "}
              <button
                type="button"
                onClick={() => {
                  setDueBy("");
                  setVendorFilter("");
                }}
                className="font-medium text-purple-300 underline-offset-2 hover:underline cursor-pointer"
              >
                Show all
              </button>
            </p>
          )}
        </div>

        <aside aria-label="Check run summary" className="max-w-full flex-[1_1_300px]">
          <section className={`${SUB_CARD_CLASS} flex flex-col gap-1.5 px-4 py-3.5`}>
            <h3 className={`${SECTION_TITLE_CLASS} mb-1`}>Check Run Summary</h3>
            <SummaryRow label="Bank account">{bank ? formatBankAccountLabel(bank) : "—"}</SummaryRow>
            <SummaryRow label="Check date">{formatIsoDate(checkDate) || "—"}</SummaryRow>
            <SummaryRow label={<label htmlFor="pay-start-number">Starting check #</label>}>
              <Input
                id="pay-start-number"
                inputMode="numeric"
                value={startValue}
                onChange={(e) => setStartText(e.target.value)}
                aria-invalid={startError}
                aria-describedby={startError ? "pay-start-error" : undefined}
                className={`h-8 w-24 px-2 text-right tabular-nums bg-white/5 border-purple-300/30 text-white ${
                  startError ? "ring-2 ring-red-500/70" : ""
                }`}
              />
            </SummaryRow>
            {startError && (
              <p id="pay-start-error" className="-mt-1 text-right text-xs text-red-300">
                {startTooLow ? startTooLowMessage : `Enter a whole number, e.g. ${defaultStart}`}
              </p>
            )}
            {startFarAhead && (
              <p className="-mt-1 text-right text-xs text-yellow-400">
                That skips {startNumber - defaultStart} numbers after the next one, #{defaultStart}. Check it matches
                your check stock.
              </p>
            )}
            <SummaryRow label="Invoices selected">{selectedRows.length}</SummaryRow>
            <SummaryRow label="Checks to print">
              {checks.length ? `${checks.length} · ${formatCheckRange(checks)}` : "—"}
            </SummaryRow>
            <SummaryRow label="Check stock">{CHECK_STOCK_LABEL}</SummaryRow>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <strong className="text-white">Total</strong>
              <strong className="text-xl text-white tabular-nums">{formatUsd(total)}</strong>
            </div>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <Button
              onClick={submit}
              disabled={busy || !selectedRows.length}
              className={`${PRIMARY_BUTTON_CLASS} mt-1 w-full`}
            >
              Submit for Approval
            </Button>
            <Button
              variant="outline"
              onClick={preview}
              disabled={busy || !selectedRows.length}
              className={`${outlineButtonClass(isLight)} w-full`}
            >
              <Eye className="w-4 h-4" />
              Preview Checks
            </Button>
            <Button variant="ghost" onClick={save} disabled={busy} className={`${ghostButtonClass(isLight)} w-full`}>
              {draft ? "Save changes" : "Save run for later"}
            </Button>
            {draft && (
              <Button
                variant="ghost"
                onClick={() => setDiscarding(true)}
                disabled={busy}
                className={`w-full bg-transparent shadow-none cursor-pointer ${
                  isLight
                    ? "text-red-700 hover:bg-red-50 hover:text-red-800"
                    : "text-red-300 hover:bg-red-500/20 hover:text-red-200"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Discard draft
              </Button>
            )}
            <p className={`mt-1.5 text-xs ${muted}`}>
              Checks print only after an approver approves the run. Nothing posts to the G/L until you confirm the
              checks printed correctly.
            </p>
          </section>
        </aside>
      </div>

      {previewing && (
        <CheckPreviewModal checks={draftPreviewChecks} checkDate={checkDate} bank={bank} onClose={() => setPreviewing(false)} />
      )}

      {discarding && draft && (
        <ConfirmRunModal
          title="Discard draft run"
          icon={<Trash2 className={`w-5 h-5 ${isLight ? "text-red-600" : "text-red-300"}`} />}
          confirmLabel="Discard draft"
          danger
          onConfirm={discard}
          onCancel={() => setDiscarding(false)}
        >
          <p>
            The {formatIsoDate(draft.checkDate)} draft ({pluralize(draft.checks.length, "check")},{" "}
            {formatUsd(draft.total)}) is voided and its invoices can go in another run.
          </p>
        </ConfirmRunModal>
      )}
    </div>
  );
};

export default SelectInvoicesStep;
