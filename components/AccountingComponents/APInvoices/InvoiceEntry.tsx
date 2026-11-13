import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AlertCircle, Check, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHeaderAtom, themeAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useApInvoices } from "@/hooks/useApInvoices";
import { useContactOptions } from "@/hooks/useContactOptions";
import { duplicateRulesFor, useAllVendorDefaults, useVendorDefaults } from "@/hooks/useVendorDefaults";
import { cn } from "@/lib/utils";
import {
  AP_EDITABLE_STATUSES,
  AP_STATUS_LABELS,
  ApDuplicateDecision,
  ApInvoice,
  dueDateFromTerms,
  formatMoney,
  hasUnreviewedDuplicates,
  formatUsd,
} from "@/types/apInvoices";
import type { DocumentReadResultFor } from "@/types/documentReader";
import { ApStatusBadge } from "./StatusBadge";
import { RejectInvoiceModal } from "./list/RejectInvoiceModal";
import { CodingGrid } from "./entry/CodingGrid";
import { DiscardChangesModal } from "./entry/DiscardChangesModal";
import { DuplicateBanner } from "./entry/DuplicateBanner";
import { DuplicatesTab } from "./entry/DuplicatesTab";
import { InvoiceDocument } from "./entry/InvoiceDocument";
import { DuplicateFieldHints, InvoiceHeaderFields } from "./entry/InvoiceHeaderFields";
import { RemitToBox } from "./entry/RemitToBox";
import { StatusNote } from "./entry/StatusNote";
import { useVendorRemitTo } from "./entry/useVendorRemitTo";
import { VendorHistoryTab } from "./entry/VendorHistoryTab";
import { VoidInvoiceModal } from "./entry/VoidInvoiceModal";
import {
  AUTO_FIELD_LABELS,
  AutoField,
  HeaderErrors,
  InvoiceDraft,
  LineDraft,
  amountOf,
  defaultGlPeriod,
  draftFromInvoice,
  isBlankLine,
  isUnparseableAmount,
  newInvoiceDraft,
  toDraftInput,
  withVendor,
} from "./entry/invoiceDraft";
import { VendorChoice, findVendorByName, isContactVendorId } from "./entry/vendors";

export interface InvoiceEntryProps {
  /** null = entering a new invoice. */
  invoiceId: string | null;
  onBack: () => void;
  /** Opens another invoice (e.g. the existing one a duplicate points at). */
  onOpenInvoice: (id: string) => void;
  /** Starts a fresh blank invoice (Save & New). */
  onNewInvoice: () => void;
}

type EntryTab = "coding" | "duplicates" | "history";
type Busy = "save" | "saveNew" | "submit" | "approve" | null;

const AUTO_FIELD_ORDER: AutoField[] = [
  "vendor",
  "invoiceNumber",
  "invoiceAmount",
  "invoiceDate",
  "dueDate",
  "serviceDate",
];

const TAB_TRIGGER =
  "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-purple-100 hover:text-white hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none";

const errorMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

/** Everything Save Draft would keep, picked files included, as a string for dirty checks. */
const snapshotOf = (draft: InvoiceDraft, file: File | null, attachments: File[]) =>
  JSON.stringify([draft, file ? fileKey(file) : null, attachments.map(fileKey)]);

const DUPLICATE_CHECK_DELAY_MS = 400;

const useDebounced = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

export const InvoiceEntry = ({ invoiceId, onBack, onOpenInvoice, onNewInvoice }: InvoiceEntryProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const showToast = useSetAtom(showToastAtom);
  const {
    loading,
    getInvoice,
    saveDraft,
    submitForApproval,
    approveInvoice,
    rejectInvoice,
    voidInvoice,
    resolveDuplicate,
    findDuplicates,
  } = useApInvoices();
  const { options: contacts } = useContactOptions();
  const { defaultsFor, loading: defaultsLoading } = useAllVendorDefaults();

  // A new invoice keeps editing in place after its first save rather than remounting, so the
  // picked document File and backup stay in hand.
  const [savedId, setSavedId] = useState<string | null>(invoiceId);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [activeTab, setActiveTab] = useState<EntryTab>("coding");
  const [file, setFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [autoFields, setAutoFields] = useState<Set<AutoField>>(() => new Set());
  const [unmatchedVendorName, setUnmatchedVendorName] = useState<string | null>(null);
  const [errors, setErrors] = useState<HeaderErrors>({});
  const [lineErrors, setLineErrors] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [rejecting, setRejecting] = useState(false);
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [amountsFlagged, setAmountsFlagged] = useState(false);
  const [summaryFocusTick, setSummaryFocusTick] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  // Saved invoices keep their stored G/L month; a new one follows its dates until one is picked.
  const glManual = useRef(!!invoiceId);

  const invoice: ApInvoice | null = savedId ? (getInvoice(savedId) ?? null) : null;
  const notFound = !!invoiceId && !loading && !getInvoice(invoiceId);
  const status = invoice?.status ?? "draft";
  const canEdit = AP_EDITABLE_STATUSES.includes(status) && status !== "awaiting_approval";
  const readOnly = !canEdit;

  const { defaults } = useVendorDefaults(draft?.vendorId || null);
  const rules = useMemo(() => duplicateRulesFor(defaults), [defaults]);

  useEffect(() => {
    if (draft || loading || defaultsLoading) return;
    if (!invoiceId) {
      const fresh = newInvoiceDraft();
      setDraft(fresh);
      setBaseline(snapshotOf(fresh, null, []));
      return;
    }
    const found = getInvoice(invoiceId);
    if (found) {
      const loaded = draftFromInvoice(found, defaultsFor(found.vendorId).paymentTerms);
      setDraft(loaded);
      setBaseline(snapshotOf(loaded, null, []));
    }
  }, [draft, loading, defaultsLoading, invoiceId, getInvoice, defaultsFor]);

  const dirty = useMemo(
    () => !!draft && baseline !== null && canEdit && snapshotOf(draft, file, attachments) !== baseline,
    [draft, baseline, canEdit, file, attachments],
  );

  const leaveUnlessDirty = (action: () => void) => {
    if (dirty) setPendingLeave(() => action);
    else action();
  };

  useEffect(() => {
    if (summaryFocusTick) summaryRef.current?.focus();
  }, [summaryFocusTick]);

  const vendorId = draft?.vendorId ?? "";
  const invoiceNumber = draft?.invoiceNumber ?? "";
  const invoiceDate = draft?.invoiceDate ?? "";
  const invoiceAmount = amountOf(draft?.invoiceAmount ?? "");

  // Posted invoices keep the remit-to they were saved with; only editable ones follow the contact.
  const liveRemit = isContactVendorId(vendorId) && canEdit;
  const remit = useVendorRemitTo(liveRemit ? vendorId : "", defaults.remitToAddressType);
  const remitLines = (liveRemit ? remit.lines : null) ?? draft?.remitTo ?? [];
  const remitBlock = !liveRemit
    ? null
    : remit.loading
      ? "The vendor's remit-to address is still loading. Try again in a moment."
      : remit.isError
        ? "Couldn't load the vendor's remit-to address, so this can't be submitted. Check your connection and try again."
        : !remit.lines
          ? "This vendor has no remit-to address on file. Add one with “Edit vendor”, come back to this tab, then submit again."
          : null;

  const defaultAccountId = vendorId ? (defaults.defaultExpenseAccountId ?? "") : "";

  const duplicateInput = useMemo(
    () => ({ vendorId, invoiceNumber, invoiceAmount, invoiceDate }),
    [vendorId, invoiceNumber, invoiceAmount, invoiceDate],
  );
  const checkedInput = useDebounced(duplicateInput, DUPLICATE_CHECK_DELAY_MS);

  const matches = useMemo(
    () => (checkedInput.vendorId ? findDuplicates({ id: savedId ?? undefined, ...checkedInput }, rules) : []),
    [findDuplicates, savedId, checkedInput, rules],
  );
  const unreviewed = hasUnreviewedDuplicates(invoice?.duplicateReview, matches);
  const showBanner = unreviewed && AP_EDITABLE_STATUSES.includes(status);

  const duplicateHints = useMemo<DuplicateFieldHints>(() => {
    if (!showBanner || readOnly) return { invoiceNumber: null, invoiceAmount: null };
    const byNumber = matches.find((match) => match.matchedBy.includes("Invoice #"));
    const byAmount = matches.find((match) => match.matchedBy.includes("Invoice Amount"));
    return {
      invoiceNumber: byNumber
        ? `Matches ${byNumber.journalId ?? `a ${AP_STATUS_LABELS[byNumber.status].toLowerCase()} invoice`}`
        : null,
      invoiceAmount: byAmount ? `Same amount as #${byAmount.invoiceNumber}` : null,
    };
  }, [showBanner, readOnly, matches]);

  const vendorLabel = draft?.vendorName ?? "";
  const numberLabel = invoiceNumber.trim() ? `#${invoiceNumber.trim()}` : "";

  useEffect(() => {
    const subtitle = [vendorLabel || (savedId ? "" : "New invoice"), numberLabel, AP_STATUS_LABELS[status]]
      .filter(Boolean)
      .join(" · ");
    setPageHeader({ title: "Enter Invoice", subtitle });
  }, [vendorLabel, numberLabel, status, savedId, setPageHeader]);

  useEffect(() => () => setPageHeader({}), [setPageHeader]);

  const invoiceLabel = [vendorLabel, numberLabel].filter(Boolean).join(" ") || "this invoice";

  const clearAuto = (field: AutoField) =>
    setAutoFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });

  const clearErrors = (fields: string[]) =>
    setErrors((prev) => {
      if (!fields.some((field) => field in prev)) return prev;
      const next = { ...prev };
      fields.forEach((field) => delete next[field as keyof HeaderErrors]);
      return next;
    });

  const change = (patch: Partial<InvoiceDraft>, edited?: AutoField) => {
    if (!draft) return;
    const changed = (Object.keys(patch) as (keyof InvoiceDraft)[]).filter((key) => patch[key] !== draft[key]);
    if (!changed.length) return;
    const next = { ...draft, ...patch };
    if (changed.includes("invoiceDate") && !next.dueDateManual) {
      next.dueDate = dueDateFromTerms(next.invoiceDate, defaults.paymentTerms);
    }
    if (changed.includes("glPeriod")) {
      glManual.current = true;
    } else if (!glManual.current && (changed.includes("invoiceDate") || changed.includes("serviceDate"))) {
      next.glPeriod = defaultGlPeriod(next) || next.glPeriod;
    }
    setDraft(next);
    if (edited) clearAuto(edited);
    clearErrors(next.glPeriod !== draft.glPeriod ? [...changed, "glPeriod"] : changed);
  };

  const changeLines = (lines: LineDraft[]) => {
    setDraft((prev) => (prev ? { ...prev, lines } : prev));
    if (lineErrors.size) {
      setLineErrors(
        new Set(lines.filter((line) => lineErrors.has(line.key) && !line.accountId).map((line) => line.key)),
      );
    }
  };

  const changeVendor = (vendor: VendorChoice) => {
    setDraft((prev) => (prev ? withVendor(prev, vendor, defaultsFor(vendor.id)) : prev));
    setUnmatchedVendorName(null);
    clearAuto("vendor");
    clearErrors(["vendor"]);
  };

  const resetDueDateToTerms = () => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            dueDateManual: false,
            dueDate: dueDateFromTerms(prev.invoiceDate, defaults.paymentTerms),
          }
        : prev,
    );
    clearAuto("dueDate");
  };

  // Runs after the reader's await, so it updates from the latest draft rather than the one on
  // screen when Read Invoice was clicked.
  const applyExtracted = ({ fields }: DocumentReadResultFor<"invoice">) => {
    const vendor = fields.vendorName ? findVendorByName(fields.vendorName, contacts) : null;
    const filled = new Set<AutoField>();
    if (vendor) filled.add("vendor");
    if (fields.invoiceNumber) filled.add("invoiceNumber");
    if (fields.invoiceAmount != null) filled.add("invoiceAmount");
    if (fields.invoiceDate) filled.add("invoiceDate");
    if (fields.serviceDate) filled.add("serviceDate");
    if (fields.dueDate) filled.add("dueDate");

    setDraft((prev) => {
      if (!prev) return prev;
      let next = vendor && vendor.id !== prev.vendorId ? withVendor(prev, vendor, defaultsFor(vendor.id)) : prev;
      if (fields.invoiceNumber) next = { ...next, invoiceNumber: fields.invoiceNumber };
      if (fields.invoiceAmount != null) next = { ...next, invoiceAmount: formatMoney(fields.invoiceAmount) };
      if (fields.invoiceDate) next = { ...next, invoiceDate: fields.invoiceDate };
      if (fields.serviceDate) next = { ...next, serviceDate: fields.serviceDate };
      if (fields.dueDate) {
        next = { ...next, dueDate: fields.dueDate, dueDateManual: true };
      } else if (!next.dueDateManual) {
        next = {
          ...next,
          dueDate: dueDateFromTerms(next.invoiceDate, defaultsFor(next.vendorId).paymentTerms),
        };
      }
      if (!glManual.current) next = { ...next, glPeriod: defaultGlPeriod(next) || next.glPeriod };
      return next;
    });
    setUnmatchedVendorName(fields.vendorName && !vendor ? fields.vendorName : null);
    setAutoFields(filled);
    clearErrors(Array.from(filled));
  };

  const changeFile = (next: File | null) => {
    setFile(next);
    setAutoFields(new Set());
    if (!next) change({ documentName: null });
  };

  /** Saves what's on screen as a draft (the hook flags it needs_review on a duplicate) and
   * writes the saved line ids back so the next save updates the same lines. */
  const persist = async (): Promise<ApInvoice> => {
    if (!draft) throw new Error("Nothing to save yet");
    const { input, lineKeys } = toDraftInput(draft, {
      id: savedId ?? undefined,
      remitTo: remitLines,
      documentName: file?.name ?? draft.documentName,
      attachmentNames: [...draft.attachmentNames, ...attachments.map((f) => f.name)],
      defaultAccountId,
    });
    const saved = await saveDraft(input, rules);
    const idByKey = new Map(lineKeys.map((key, i) => [key, saved.lines[i]?.id]));
    const withSavedIds = (current: InvoiceDraft): InvoiceDraft => ({
      ...current,
      remitTo: saved.remitTo,
      lines: current.lines.map((line) => {
        const id = idByKey.get(line.key);
        return id ? { ...line, id } : line;
      }),
    });
    glManual.current = true;
    setSavedId(saved.id);
    setDraft((prev) => (prev ? withSavedIds(prev) : prev));
    setBaseline(snapshotOf(withSavedIds(draft), file, attachments));
    return saved;
  };

  const requireVendor = () => {
    if (draft?.vendorId) return true;
    setErrors((prev) => ({ ...prev, vendor: "Choose a vendor" }));
    setActiveTab("coding");
    return false;
  };

  const validateForSubmit = () => {
    if (!draft) return false;
    const next: HeaderErrors = {};
    if (!draft.vendorId) next.vendor = "Choose a vendor";
    if (!draft.invoiceNumber.trim()) next.invoiceNumber = "Enter the invoice #";
    if (isUnparseableAmount(draft.invoiceAmount)) next.invoiceAmount = "Enter a valid amount";
    else if (!(invoiceAmount > 0)) next.invoiceAmount = "Enter an amount over zero";
    if (!draft.invoiceDate) next.invoiceDate = "Enter the invoice date";
    if (!draft.dueDate) next.dueDate = "Enter the due date";
    if (!draft.glPeriod) next.glPeriod = "Choose the G/L month";
    const missing = new Set(
      draft.lines.filter((line) => !isBlankLine(line, defaultAccountId) && !line.accountId).map((line) => line.key),
    );
    const badAmounts = draft.lines.some((line) => isUnparseableAmount(line.amount));
    setErrors(next);
    setLineErrors(missing);
    setAmountsFlagged(badAmounts);
    return Object.keys(next).length === 0 && missing.size === 0 && !badAmounts;
  };

  const save = async (then: "stay" | "new") => {
    setActionError(null);
    if (!requireVendor()) return;
    if (
      draft &&
      (isUnparseableAmount(draft.invoiceAmount) || draft.lines.some((line) => isUnparseableAmount(line.amount)))
    ) {
      if (isUnparseableAmount(draft.invoiceAmount))
        setErrors((prev) => ({
          ...prev,
          invoiceAmount: "Enter a valid amount",
        }));
      setAmountsFlagged(true);
      setActionError("Fix the amounts that aren't valid numbers before saving.");
      return;
    }
    setBusy(then === "new" ? "saveNew" : "save");
    try {
      const saved = await persist();
      showToast(
        saved.status === "needs_review"
          ? `Saved ${invoiceLabel} as Needs Review: it looks like a duplicate.`
          : `Saved ${invoiceLabel} as a draft`,
      );
      if (then === "new") onNewInvoice();
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't save this invoice."));
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    setActionError(null);
    const valid = validateForSubmit();
    if (!valid || remitBlock) {
      if (remitBlock) setActionError(remitBlock);
      if (!valid) setSummaryFocusTick((tick) => tick + 1);
      return;
    }
    setBusy("submit");
    try {
      const saved = await persist();
      await submitForApproval(saved.id);
      showToast(`Submitted ${invoiceLabel} for approval`);
      onBack();
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't submit this invoice."));
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    if (!savedId) return;
    setActionError(null);
    setBusy("approve");
    try {
      const approved = await approveInvoice(savedId);
      showToast(`Approved ${invoiceLabel} · ${approved.journalId}`);
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't approve this invoice."));
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = async (reason: string) => {
    if (!savedId) return;
    await rejectInvoice(savedId, reason);
    showToast(`Sent ${invoiceLabel} back to Draft`);
    setRejecting(false);
  };

  const confirmVoid = async () => {
    if (!savedId) return;
    await voidInvoice(savedId);
    setConfirmingVoid(false);
    showToast(`Voided ${invoiceLabel}`);
    onBack();
  };

  const resolve = async (decision: ApDuplicateDecision, reason: string) => {
    if (readOnly) throw new Error("This invoice can't be changed anymore");
    if (!draft?.vendorId) throw new Error("Choose a vendor first");
    const saved = await persist();
    if (saved.status === "needs_review") await resolveDuplicate(saved.id, decision, reason, rules);
    else if (decision === "discarded") await voidInvoice(saved.id);
    if (decision === "discarded") {
      showToast(`Discarded ${invoiceLabel} as a duplicate`);
      onBack();
    } else {
      showToast(`Marked ${invoiceLabel} as not a duplicate`);
      setActiveTab("coding");
    }
  };

  const outlineButton = cn(
    "bg-transparent shadow-none cursor-pointer",
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white",
  );
  const dangerButton = cn(
    "bg-transparent shadow-none cursor-pointer",
    isLight
      ? "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
      : "border-red-400/40 text-red-300 hover:bg-red-500/20 hover:text-red-200",
  );
  const backButton = (
    <Button
      variant="ghost"
      onClick={() => leaveUnlessDirty(onBack)}
      className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
    >
      Back to Invoices
    </Button>
  );

  if (notFound || !draft) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-purple-300/30 gap-3 py-4">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {invoiceId ? "Invoice" : "New Invoice"}
            </CardTitle>
            {backButton}
          </div>
        </CardHeader>
        <CardContent>
          {notFound ? (
            <p className="py-12 text-center text-white/70">
              This invoice couldn&apos;t be found. It may have been removed.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-8 h-8 rounded-full border-4 border-purple-300/20 border-t-purple-400 animate-spin" />
              <span className="text-sm text-white/60">Loading...</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const draftInput = toDraftInput(draft, {
    id: savedId ?? undefined,
    remitTo: remitLines,
    documentName: file?.name ?? draft.documentName,
    attachmentNames: [...draft.attachmentNames, ...attachments.map((f) => f.name)],
    defaultAccountId,
  }).input;

  const remitWarning =
    liveRemit && remit.lines && !remit.matchedType
      ? `No ${defaults.remitToAddressType} address on file, so this uses the ${remit.addressType || "first"} address.`
      : null;

  const errorList = [
    ...(Object.values(errors).filter(Boolean) as string[]),
    ...(lineErrors.size ? ["Pick an account on every coding line"] : []),
    ...(amountsFlagged && draft.lines.some((line) => isUnparseableAmount(line.amount))
      ? ["Fix the line amounts marked in the coding grid"]
      : []),
  ];

  const title = savedId && invoice ? `Invoice #${invoice.invoiceNumber || "—"}` : "New Invoice";
  const dupBadge = matches.length
    ? !unreviewed
      ? "bg-white/10"
      : isLight
        ? "bg-red-100 text-red-700"
        : "bg-red-500/25 text-red-200"
    : "";

  return (
    <>
      <Card className="bg-white/10 backdrop-blur-md border-purple-300/30 gap-3 py-4">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-white flex flex-wrap items-center gap-2">
              <FileText className="w-6 h-6" />
              {title}
              <ApStatusBadge
                status={status}
                scheduledPayDate={invoice?.scheduledPayDate}
                paidCheckNumber={invoice?.paidCheckNumber}
              />
            </CardTitle>
            {backButton}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntryTab)} className="w-full">
            <TabsList className="flex w-full flex-wrap bg-white/5 border border-purple-300/20 rounded-xl gap-1 h-auto p-1">
              <TabsTrigger value="coding" className={TAB_TRIGGER}>
                GL Coding
              </TabsTrigger>
              <TabsTrigger value="duplicates" className={TAB_TRIGGER}>
                <span className="inline-flex items-center gap-1.5">
                  Duplicates
                  {matches.length > 0 && (
                    <span className={cn("rounded-md px-1.5 text-[11px] leading-[18px] tabular-nums", dupBadge)}>
                      {matches.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="history" className={TAB_TRIGGER}>
                Vendor History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coding" forceMount hidden={activeTab !== "coding"} className="mt-2">
              <fieldset disabled={!!busy} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <StatusNote invoice={invoice} />
                {showBanner && <DuplicateBanner matches={matches} onReview={() => setActiveTab("duplicates")} />}

                <div className="flex flex-wrap items-start gap-5">
                  <div className="min-w-0 grow-[999] basis-[560px]">
                    <InvoiceHeaderFields
                      draft={draft}
                      journalId={invoice?.journalId ?? null}
                      readOnly={readOnly}
                      defaults={defaults}
                      autoFields={autoFields}
                      errors={errors}
                      duplicateHints={duplicateHints}
                      unmatchedVendorName={unmatchedVendorName}
                      onChange={change}
                      onVendorChange={changeVendor}
                      onUseVendorTerms={resetDueDateToTerms}
                      remitTo={
                        <RemitToBox
                          vendorName={draft.vendorName}
                          hasVendor={!!draft.vendorId}
                          lines={remitLines}
                          addressType={(liveRemit && remit.addressType) || defaults.remitToAddressType}
                          warning={remitWarning}
                          loading={liveRemit && remit.loading}
                          error={liveRemit && remit.isError}
                          readOnly={readOnly}
                        />
                      }
                    />
                  </div>
                  <aside className="max-w-full grow basis-80" aria-label="Invoice document">
                    <InvoiceDocument
                      readOnly={readOnly}
                      file={file}
                      onFileChange={changeFile}
                      documentName={draft.documentName}
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                      savedAttachmentNames={draft.attachmentNames}
                      onSavedAttachmentNamesChange={(names) => change({ attachmentNames: names })}
                      onExtracted={applyExtracted}
                      autoFilledLabels={AUTO_FIELD_ORDER.filter((field) => autoFields.has(field)).map(
                        (field) => AUTO_FIELD_LABELS[field],
                      )}
                    />
                  </aside>
                </div>

                <CodingGrid
                  lines={draft.lines}
                  invoiceAmount={invoiceAmount}
                  readOnly={readOnly}
                  lineErrors={lineErrors}
                  defaultAccountId={defaultAccountId}
                  onChange={changeLines}
                />

                {errorList.length > 0 && (
                  <div
                    ref={summaryRef}
                    role="alert"
                    tabIndex={-1}
                    className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-start gap-2 outline-none"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-red-300 font-medium">Please fill in the required fields:</p>
                      <ul className="mt-1 space-y-0.5">
                        {errorList.map((message) => (
                          <li key={message} className="text-xs text-red-400">
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center justify-between gap-3"
                  >
                    <p className="text-sm text-red-300">{actionError}</p>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => setActionError(null)}
                      className="text-red-400 hover:text-red-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-300/30 pt-3">
                  <span className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => leaveUnlessDirty(onBack)}
                      className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
                    >
                      {canEdit ? "Cancel" : "Back to Invoices"}
                    </Button>
                    {canEdit && (
                      <span className="text-xs text-white/60">
                        An approver must approve this invoice before it posts to the G/L or can be paid.
                      </span>
                    )}
                    {status === "awaiting_approval" && (
                      <span className="text-xs text-white/60">
                        Approving posts it to the G/L and assigns its Journal ID.
                      </span>
                    )}
                  </span>

                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      {savedId && (
                        <Button
                          variant="outline"
                          disabled={!!busy}
                          onClick={() => setConfirmingVoid(true)}
                          className={dangerButton}
                        >
                          Void
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => save("stay")}
                        className={outlineButton}
                      >
                        {busy === "save" ? "Saving…" : "Save Draft"}
                      </Button>
                      <Button variant="outline" disabled={!!busy} onClick={() => save("new")} className={outlineButton}>
                        {busy === "saveNew" ? "Saving…" : "Save & New"}
                      </Button>
                      <Button
                        disabled={!!busy}
                        onClick={submit}
                        className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                      >
                        {busy === "submit" ? "Submitting…" : "Submit for Approval"}
                      </Button>
                    </div>
                  )}

                  {status === "awaiting_approval" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => setRejecting(true)}
                        className={dangerButton}
                      >
                        <X className="w-4 h-4" strokeWidth={2.5} />
                        Reject
                      </Button>
                      <Button
                        disabled={!!busy}
                        onClick={approve}
                        className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                      >
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        {busy === "approve" ? "Approving…" : "Approve"}
                      </Button>
                    </div>
                  )}
                </div>
              </fieldset>
            </TabsContent>

            <TabsContent value="duplicates" className="mt-2">
              <DuplicatesTab
                draft={draftInput}
                invoice={invoice}
                matches={matches}
                rules={rules}
                cleared={!unreviewed}
                readOnly={readOnly}
                onOpenInvoice={(id) => leaveUnlessDirty(() => onOpenInvoice(id))}
                onResolve={resolve}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-2">
              <VendorHistoryTab
                vendorId={draft.vendorId || null}
                vendorName={draft.vendorName}
                draft={draftInput}
                invoiceId={savedId}
                highlightInvoiceNumber={draft.invoiceNumber.trim()}
                highlightAmount={invoiceAmount}
                onOpenInvoice={(id) => leaveUnlessDirty(() => onOpenInvoice(id))}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {rejecting && invoice && (
        <RejectInvoiceModal invoice={invoice} onConfirm={confirmReject} onCancel={() => setRejecting(false)} />
      )}
      {confirmingVoid && (
        <VoidInvoiceModal
          invoiceLabel={`${invoiceLabel} · ${formatUsd(invoiceAmount)}`}
          onConfirm={confirmVoid}
          onCancel={() => setConfirmingVoid(false)}
        />
      )}
      {pendingLeave && (
        <DiscardChangesModal
          onKeepEditing={() => setPendingLeave(null)}
          onDiscard={() => {
            const action = pendingLeave;
            setPendingLeave(null);
            action();
          }}
        />
      )}
    </>
  );
};

export default InvoiceEntry;
