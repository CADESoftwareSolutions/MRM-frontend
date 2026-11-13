import { useCallback, useEffect, useMemo, useState } from "react";
import { useSetAtom } from "jotai";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  FileText,
  Info,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useContactOptions } from "@/hooks/useContactOptions";
import { PostBlockedError, useRevenueChecks } from "@/hooks/useRevenueChecks";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { cn } from "@/lib/utils";
import type { ExtractedCheckStubFields } from "@/types/documentReader";
import {
  RevenueCheck,
  RevenueLine,
  blankRevenueLine,
  checkDisplayStatus,
  computeCheckTotals,
  findDuplicateChecks,
  findTaxDeductType,
  formatCheckDate,
  formatCheckTimestamp,
  formatMoney,
  glPeriodForDate,
  postBlockers,
  propertyKey,
} from "@/types/revenue";
import { DeleteConfirmModal } from "../../modals/DeleteConfirmModal";
import { RevenueStatusBadge } from "./list/RevenueStatusBadge";
import { BalanceBar } from "./entry/BalanceBar";
import { CheckHeaderFields } from "./entry/CheckHeaderFields";
import { CheckStubPanel } from "./entry/CheckStubPanel";
import {
  CheckDraft,
  HEADER_FIELD_LABELS,
  HeaderField,
  OPERATOR_CLASSIFICATIONS,
  applyLinePatch,
  cleanLines,
  draftCopyOf,
  draftFromCheck,
  draftToInput,
  headerErrors,
  labelsOnLines,
  matchContactByName,
  newCheckDraft,
  rememberedOwnerNumber,
} from "./entry/checkDraft";
import { DetailLinesTable } from "./entry/DetailLinesTable";
import { EntryActions, type EntryBusy } from "./entry/EntryActions";
import { useEntryTheme } from "./entry/entryTheme";
import { UnreadableFieldsContext } from "./entry/unreadableFields";
import { UnsavedChangesModal } from "./entry/UnsavedChangesModal";
import { VoidCheckModal } from "./entry/VoidCheckModal";
import type { LinkedWell } from "./entry/WellLinkPicker";

export interface RevenueCheckEntryProps {
  /** null = entering a new check. */
  checkId: string | null;
  onBack: () => void;
  /** Switches to the Import Check Detail screen. */
  onImport: () => void;
  /** Opens another check, for the duplicate warning and a re-entry draft. */
  onOpenCheck?: (id: string) => void;
}

const CARD_CLASS =
  "bg-white/10 backdrop-blur-md border-purple-300/30 gap-4 py-4";
const BACK_BUTTON_CLASS =
  "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer";
const HEADER_FIELD_ORDER = Object.keys(HEADER_FIELD_LABELS) as HeaderField[];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const usePageHeader = (subtitle: string) => {
  const setPageHeader = useSetAtom(pageHeaderAtom);
  useEffect(() => {
    setPageHeader({ title: "Revenue Checks", subtitle });
  }, [setPageHeader, subtitle]);
  useEffect(() => () => setPageHeader({}), [setPageHeader]);
};

const errorBox = (message: string, onDismiss?: () => void) => (
  <div
    role="alert"
    className="flex items-start justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3"
  >
    <p className="flex items-start gap-2 text-sm text-red-300">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
    {onDismiss && (
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 cursor-pointer text-red-400 hover:text-red-100"
      >
        <X className="size-4" />
      </button>
    )}
  </div>
);

/** Enter (or review) one revenue check: header, check stub, detail lines and posting. */
export const RevenueCheckEntry = ({
  checkId,
  onBack,
  onImport,
  onOpenCheck,
}: RevenueCheckEntryProps) => {
  const { loading, getCheck } = useRevenueChecks();
  const check = getCheck(checkId);
  // Latched once found, so a check deleted from this screen doesn't flip it to "not found"
  // before onBack lands.
  const [initialCheck, setInitialCheck] = useState<
    RevenueCheck | null | undefined
  >(() => (checkId ? check : null));

  const [copiedFrom, setCopiedFrom] = useState<RevenueCheck | null>(null);

  useEffect(() => {
    if (initialCheck === undefined && check) setInitialCheck(check);
  }, [initialCheck, check]);

  const reenter = useCallback((voided: RevenueCheck) => {
    setCopiedFrom(voided);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (initialCheck === undefined) {
    return <EntryPlaceholder loading={loading} onBack={onBack} />;
  }
  return (
    <CheckEntryForm
      key={copiedFrom ? `copy-${copiedFrom.id}` : "check"}
      initialCheck={copiedFrom ? null : initialCheck}
      copiedFrom={copiedFrom}
      onBack={onBack}
      onImport={onImport}
      onOpenCheck={onOpenCheck}
      onReenter={reenter}
    />
  );
};

const EntryPlaceholder = ({
  loading,
  onBack,
}: {
  loading: boolean;
  onBack: () => void;
}) => {
  usePageHeader(loading ? "Loading check…" : "Check not found");
  return (
    <Card className={CARD_CLASS}>
      <CardContent className="flex flex-col items-center gap-3 py-12">
        {loading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-300/20 border-t-purple-400" />
            <span className="text-sm text-white/60">Loading...</span>
          </>
        ) : (
          <>
            <p className="text-white/70">
              This check couldn&apos;t be found. It may have been deleted.
            </p>
            <Button
              variant="ghost"
              onClick={onBack}
              className={BACK_BUTTON_CLASS}
            >
              Back to Revenue Checks
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface CheckEntryFormProps {
  initialCheck: RevenueCheck | null;
  /** A void check being re-entered: the form starts as a new, unsaved draft with its header and lines. */
  copiedFrom: RevenueCheck | null;
  onBack: () => void;
  onImport: () => void;
  onOpenCheck?: (id: string) => void;
  onReenter: (voided: RevenueCheck) => void;
}

const CheckEntryForm = ({
  initialCheck,
  copiedFrom,
  onBack,
  onImport,
  onOpenCheck,
  onReenter,
}: CheckEntryFormProps) => {
  const showToast = useSetAtom(showToastAtom);
  const theme = useEntryTheme();
  const { checks, getCheck, saveDraft, postCheck, deleteCheck, voidCheck } =
    useRevenueChecks();
  const { types, ensureTypes } = useTaxDeductTypes();
  const { options: contactOptions } = useContactOptions();
  const { accounts } = useChartOfAccounts();

  const source = initialCheck ?? copiedFrom;
  const [savedId, setSavedId] = useState<string | null>(
    initialCheck?.id ?? null,
  );
  const [draft, setDraft] = useState<CheckDraft>(() =>
    initialCheck
      ? draftFromCheck(initialCheck)
      : copiedFrom
        ? draftCopyOf(copiedFrom)
        : newCheckDraft(),
  );
  const [initialExpanded] = useState<string[]>(() =>
    source ? [] : draft.lines.map((line) => line.id),
  );
  // The G/L period follows the check date until the user picks a different month.
  const [glPeriodAuto, setGlPeriodAuto] = useState(
    () => !source || source.glPeriod === glPeriodForDate(source.checkDate),
  );
  const [autoFilled, setAutoFilled] = useState<ReadonlySet<HeaderField>>(
    () => new Set(),
  );
  const [stubFile, setStubFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<EntryBusy>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [ownerNumberFromMemory, setOwnerNumberFromMemory] = useState(false);
  const [unreadable, setUnreadable] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));

  const reportUnreadable = useCallback((key: string, label: string | null) => {
    setUnreadable((prev) => {
      if (label === null ? !prev.has(key) : prev.get(key) === label)
        return prev;
      const next = new Map(prev);
      if (label === null) next.delete(key);
      else next.set(key, label);
      return next;
    });
  }, []);

  const savedCheck = getCheck(savedId);
  const savedStatus = savedCheck?.status ?? "draft";
  const readOnly = savedStatus !== "draft";
  const lines = useMemo(() => cleanLines(draft.lines), [draft.lines]);
  const totals = useMemo(
    () => computeCheckTotals({ checkAmount: draft.checkAmount, lines }),
    [draft.checkAmount, lines],
  );
  const blockers = useMemo(
    () =>
      readOnly
        ? []
        : postBlockers(
            { checkAmount: draft.checkAmount, lines },
            types,
            accounts,
          ),
    [readOnly, draft.checkAmount, lines, types, accounts],
  );
  const status = checkDisplayStatus(
    { status: savedStatus, checkAmount: draft.checkAmount, lines },
    types,
    accounts,
  );
  const errors = submitted ? headerErrors(draft) : {};
  const missing = HEADER_FIELD_ORDER.filter((field) => errors[field]);
  const readyToPost =
    !readOnly &&
    blockers.length === 0 &&
    Object.keys(headerErrors(draft)).length === 0 &&
    !(draft.checkAmount === 0 && totals.ownerNet === 0);
  const dirty =
    !readOnly &&
    (JSON.stringify(draft) !== baseline || (!!copiedFrom && !savedId));
  const duplicates = useMemo(
    () =>
      readOnly ||
      !draft.operatorName.trim() ||
      !draft.checkNumber.trim() ||
      !draft.checkDate
        ? []
        : findDuplicateChecks(
            checks,
            {
              operatorId: draft.operatorId,
              operatorName: draft.operatorName,
              checkNumber: draft.checkNumber,
              checkDate: draft.checkDate,
            },
            savedId,
          ),
    [
      readOnly,
      checks,
      draft.operatorId,
      draft.operatorName,
      draft.checkNumber,
      draft.checkDate,
      savedId,
    ],
  );
  const duplicate = duplicates[0];
  const reenteredCheck =
    savedCheck?.status === "void"
      ? getCheck(savedCheck.reenteredAsId)
      : undefined;

  usePageHeader(
    [
      draft.operatorName.trim() || "New check",
      draft.checkNumber.trim() && `Check #${draft.checkNumber.trim()}`,
      status,
    ]
      .filter(Boolean)
      .join(" · "),
  );

  const clearAutoFilled = (field: HeaderField) =>
    setAutoFilled((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });

  const changeHeader = (patch: Partial<CheckDraft>, field?: HeaderField) => {
    if (field) clearAutoFilled(field);
    if (field === "ownerNumber") setOwnerNumberFromMemory(false);
    const followCheckDate = glPeriodAuto && !!patch.checkDate;
    let remembered: string | undefined;
    if (
      (field === "operator" || field === "owner") &&
      (ownerNumberFromMemory || !draft.ownerNumber.trim())
    ) {
      remembered = rememberedOwnerNumber(
        checks,
        { ...draft, ...patch },
        savedId,
      );
      setOwnerNumberFromMemory(remembered !== "");
    }
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (followCheckDate && patch.checkDate)
        next.glPeriod = glPeriodForDate(patch.checkDate);
      if (remembered !== undefined) next.ownerNumber = remembered;
      return next;
    });
    if (patch.glPeriod !== undefined)
      setGlPeriodAuto(patch.glPeriod === glPeriodForDate(draft.checkDate));
  };

  const changeLine = useCallback((id: string, patch: Partial<RevenueLine>) => {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id ? applyLinePatch(prev.lines, line, patch) : line,
      ),
    }));
  }, []);

  const removeLine = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== id),
    }));
  }, []);

  const addLine = useCallback(() => {
    const line = blankRevenueLine();
    setDraft((prev) => ({ ...prev, lines: [...prev.lines, line] }));
    return line.id;
  }, []);

  const linkWell = useCallback((groupKey: string, well: LinkedWell | null) => {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        propertyKey(line) === groupKey
          ? {
              ...line,
              wellId: well?.id ?? null,
              wellLabel: well?.label ?? null,
            }
          : line,
      ),
    }));
  }, []);

  const changeStubFile = (file: File | null) => {
    setStubFile(file);
    setAutoFilled(new Set());
    setDraft((prev) => ({ ...prev, stubFileName: file?.name ?? null }));
  };

  const applyStub = (fields: ExtractedCheckStubFields) => {
    const filled = new Set<HeaderField>();
    const patch: Partial<CheckDraft> = {};
    const operatorName = fields.operatorName?.trim();
    if (operatorName) {
      const match = matchContactByName(
        contactOptions,
        operatorName,
        OPERATOR_CLASSIFICATIONS,
      );
      patch.operatorId = match?.id ?? null;
      patch.operatorName = match?.name ?? operatorName;
      filled.add("operator");
    }
    const ownerName = fields.ownerName?.trim();
    if (ownerName) {
      const match = matchContactByName(contactOptions, ownerName);
      patch.ownerId = match?.id ?? null;
      patch.ownerName = match?.name ?? ownerName;
      filled.add("owner");
    }
    if (fields.ownerNumber?.trim()) {
      patch.ownerNumber = fields.ownerNumber.trim();
      filled.add("ownerNumber");
    }
    if (fields.checkNumber?.trim()) {
      patch.checkNumber = fields.checkNumber.trim();
      filled.add("checkNumber");
    }
    if (fields.checkDate && ISO_DATE.test(fields.checkDate)) {
      patch.checkDate = fields.checkDate;
      filled.add("checkDate");
    }
    if (
      typeof fields.checkAmount === "number" &&
      Number.isFinite(fields.checkAmount)
    ) {
      patch.checkAmount = fields.checkAmount;
      filled.add("checkAmount");
    }
    let ownerNumber = patch.ownerNumber;
    if (
      ownerNumber === undefined &&
      (ownerNumberFromMemory || !draft.ownerNumber.trim())
    ) {
      ownerNumber = rememberedOwnerNumber(
        checks,
        { ...draft, ...patch },
        savedId,
      );
      setOwnerNumberFromMemory(ownerNumber !== "");
    } else if (ownerNumber !== undefined) {
      setOwnerNumberFromMemory(false);
    }
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (glPeriodAuto && patch.checkDate)
        next.glPeriod = glPeriodForDate(patch.checkDate);
      if (ownerNumber !== undefined) next.ownerNumber = ownerNumber;
      return next;
    });
    setAutoFilled(filled);
  };

  const validate = () => {
    setSubmitted(true);
    if (unreadable.size) {
      setActionError(
        `Fix or clear the text that can't be read before saving: ${Array.from(new Set(unreadable.values())).join("; ")}.`,
      );
      return false;
    }
    return Object.keys(headerErrors(draft)).length === 0;
  };

  const persist = async () => {
    const snapshot = JSON.stringify(draft);
    const saved = await saveDraft({
      ...draftToInput(draft, savedId, lines),
      ...(copiedFrom && { reenteredFromId: copiedFrom.id }),
    });
    setSavedId(saved.id);
    setBaseline(snapshot);
    const unknown = labelsOnLines(lines, draft.operatorName.trim())
      .filter((seen) => !findTaxDeductType(types, seen.label, seen.kind))
      .map((seen) => ({ ...seen, checkDate: draft.checkDate }));
    if (unknown.length) await ensureTypes(unknown).catch(() => undefined);
    return saved;
  };

  const handleSave = async () => {
    setActionError(null);
    if (!validate()) return;
    setBusy("save");
    try {
      const saved = await persist();
      showToast(`Check #${saved.checkNumber} saved as a draft`);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handlePost = async () => {
    setActionError(null);
    if (!validate()) return;
    setBusy("post");
    try {
      const saved = await persist();
      const posted = await postCheck(saved.id);
      showToast(`Check #${posted.checkNumber} posted`);
      onBack();
    } catch (err) {
      setActionError(
        err instanceof PostBlockedError
          ? `Saved as a draft, but it can't be posted yet: ${err.blockers.join(" ")}`
          : (err as Error).message,
      );
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setConfirmingDelete(false);
    if (!savedId) return;
    const checkNumber = savedCheck?.checkNumber ?? draft.checkNumber.trim();
    setActionError(null);
    setBusy("delete");
    try {
      await deleteCheck(savedId);
      showToast(`Check #${checkNumber} deleted`);
      onBack();
    } catch (err) {
      setActionError((err as Error).message);
      setBusy(null);
    }
  };

  const leaveSafely = (leave: () => void) => {
    if (dirty) setPendingLeave(() => leave);
    else leave();
  };

  const saveAndLeave = async () => {
    const leave = pendingLeave;
    setPendingLeave(null);
    setActionError(null);
    if (!leave || !validate()) return;
    setBusy("save");
    try {
      await persist();
      leave();
    } catch (err) {
      setActionError((err as Error).message);
      setBusy(null);
    }
  };

  // Errors are left to the modal, which shows them next to the reason.
  const handleVoid = async (reason: string) => {
    if (!savedId) return;
    const voided = await voidCheck(savedId, reason);
    setConfirmingVoid(false);
    setActionError(null);
    showToast(`Check #${voided.checkNumber} voided`);
  };

  const autoFilledLabels = HEADER_FIELD_ORDER.filter((field) =>
    autoFilled.has(field),
  ).map((field) => HEADER_FIELD_LABELS[field]);
  const deleteName = `check #${savedCheck?.checkNumber ?? draft.checkNumber}${
    draft.operatorName.trim() ? ` from ${draft.operatorName.trim()}` : ""
  }`;

  return (
    <UnreadableFieldsContext.Provider value={reportUnreadable}>
      <Card className={CARD_CLASS}>
        <CardHeader className="px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg text-white">
              <FileText className="size-6" />
              {readOnly ? "Revenue Check" : "Enter Revenue Check"}
              <RevenueStatusBadge status={status} blockers={blockers} />
            </CardTitle>
            <Button
              variant="ghost"
              onClick={onBack}
              className={BACK_BUTTON_CLASS}
            >
              Back to Revenue Checks
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-5">
          {savedCheck?.status === "posted" && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 p-3">
              <Lock className="size-4 shrink-0 text-blue-300" />
              <p className="text-sm text-blue-200">
                Posted by {savedCheck.postedBy ?? "someone"} ·{" "}
                {formatCheckTimestamp(savedCheck.postedAt)}. Posted checks are
                read-only.
              </p>
            </div>
          )}
          {savedCheck?.status === "void" && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3",
                theme.voidBox,
              )}
            >
              <Ban className="mt-0.5 size-4 shrink-0" />
              <div className="text-sm">
                <p>
                  Voided by {savedCheck.voidedBy ?? "someone"} ·{" "}
                  {formatCheckTimestamp(savedCheck.voidedAt)}
                  {savedCheck.voidReason ? `: ${savedCheck.voidReason}` : ""}
                </p>
                <p className={cn("mt-0.5 text-xs", theme.voidMuted)}>
                  {savedCheck.postedBy &&
                    `Originally posted by ${savedCheck.postedBy} · ${formatCheckTimestamp(savedCheck.postedAt)}. `}
                  Void checks are read-only.{" "}
                  {savedCheck.reenteredAsId
                    ? `It was already re-entered${reenteredCheck ? ` as check #${reenteredCheck.checkNumber}` : ""}.`
                    : "Re-enter it as a new draft to enter a corrected check."}
                </p>
              </div>
            </div>
          )}
          {copiedFrom && !savedId && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 p-3">
              <Info className="size-4 shrink-0 text-blue-300" />
              <p className="text-sm text-blue-200">
                New draft copied from void check #{copiedFrom.checkNumber}.
                Correct it, then save or post it. Nothing is saved until you do.
              </p>
            </div>
          )}

          {duplicate && (
            <div
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                theme.warnBox,
              )}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                Check #{duplicate.checkNumber} from {duplicate.operatorName}{" "}
                dated {formatCheckDate(duplicate.checkDate)} already exists (
                {duplicate.status}). You can still save this one.
                {onOpenCheck && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => leaveSafely(() => onOpenCheck(duplicate.id))}
                      className="cursor-pointer font-medium underline underline-offset-2"
                    >
                      Open it
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-5">
            <div className="min-w-0 grow-[999] basis-[600px]">
              <CheckHeaderFields
                draft={draft}
                errors={errors}
                autoFilled={autoFilled}
                readOnly={readOnly}
                onChange={changeHeader}
              />
            </div>
            <aside
              className="max-w-full grow basis-[300px]"
              aria-label="Check stub"
            >
              <CheckStubPanel
                readOnly={readOnly}
                file={stubFile}
                fileName={draft.stubFileName}
                onFileChange={changeStubFile}
                onExtracted={applyStub}
                autoFilledLabels={autoFilledLabels}
                onImport={() => leaveSafely(onImport)}
              />
            </aside>
          </div>

          <BalanceBar
            checkAmount={draft.checkAmount}
            totals={totals}
            readyToPost={readyToPost}
          />

          <DetailLinesTable
            lines={draft.lines}
            totals={totals}
            readOnly={readOnly}
            status={savedStatus}
            operatorName={draft.operatorName}
            initialExpanded={initialExpanded}
            onAddLine={addLine}
            onChangeLine={changeLine}
            onRemoveLine={removeLine}
            onLinkWell={linkWell}
          />

          {missing.length > 0 &&
            errorBox(
              `Fill in the required fields: ${missing.map((field) => HEADER_FIELD_LABELS[field]).join(", ")}.`,
            )}
          {actionError && errorBox(actionError, () => setActionError(null))}

          <EntryActions
            readOnly={readOnly}
            canDelete={!!savedId && !readOnly}
            busy={busy}
            blockers={blockers}
            onCancel={onBack}
            onSave={handleSave}
            onPost={handlePost}
            onDelete={() => setConfirmingDelete(true)}
            onVoid={
              savedCheck?.status === "posted"
                ? () => setConfirmingVoid(true)
                : undefined
            }
            onReenter={
              savedCheck?.status === "void" && !savedCheck.reenteredAsId
                ? () => onReenter(savedCheck)
                : undefined
            }
            onOpenReentry={
              savedCheck?.reenteredAsId && reenteredCheck && onOpenCheck
                ? () => onOpenCheck(reenteredCheck.id)
                : undefined
            }
          />
        </CardContent>
      </Card>

      <DeleteConfirmModal
        isOpen={confirmingDelete}
        itemName={deleteName}
        itemType="Revenue Check"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
      {pendingLeave && (
        <UnsavedChangesModal
          onSave={saveAndLeave}
          onDiscard={() => {
            setPendingLeave(null);
            pendingLeave();
          }}
          onCancel={() => setPendingLeave(null)}
        />
      )}
      {confirmingVoid && savedCheck && (
        <VoidCheckModal
          checkLabel={`${savedCheck.operatorName} · Check #${savedCheck.checkNumber} · $${formatMoney(savedCheck.checkAmount)}`}
          onConfirm={handleVoid}
          onCancel={() => setConfirmingVoid(false)}
        />
      )}
    </UnreadableFieldsContext.Provider>
  );
};

export default RevenueCheckEntry;
