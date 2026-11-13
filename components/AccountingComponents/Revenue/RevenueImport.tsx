import { useEffect, useMemo, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { AlertCircle, Info, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";
import { showToastAtom } from "@/atoms/toastAtom";
import { useImportMatches } from "@/hooks/useImportMatches";
import { useRevenueChecks } from "@/hooks/useRevenueChecks";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { SeenTaxDeductLabel, useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { CheckDetailCheck, CheckDetailParseResult, parseCheckDetailCsv } from "@/lib/checkDetailCsv";
import { fileProblem, readCsvText } from "@/lib/csv";
import { normalizeLabel } from "@/types/revenue";
import { ImportStep, ImportStepper } from "./import/ImportStepper";
import { MatchStep } from "./import/MatchStep";
import { ReviewStep } from "./import/ReviewStep";
import { UploadStep } from "./import/UploadStep";
import { DiscardMatchesModal } from "./import/DiscardMatchesModal";
import { EMPTY_CHOICES, ImportChoices, WellChoice, plural, projectTypes } from "./import/importModel";
import { PRIMARY_BUTTON_CLASS, useImportTheme } from "./import/importTheme";
import { buildReviewRows } from "./import/reviewModel";
import { useImportResolution } from "./import/useImportResolution";

export interface RevenueImportProps {
  onCancel: () => void;
  /** Called after saving. Pass the id of the (first) draft check created to open it, or nothing to return to the list. */
  onDone: (checkId?: string) => void;
}

const NO_CHECKS: CheckDetailCheck[] = [];

const STEP_HEADINGS: Record<ImportStep, string> = {
  1: "Step 1 of 4: Upload",
  2: "Step 2 of 4: Match",
  3: "Step 3 of 4: Review",
  4: "Step 4 of 4: Save",
};

const setKey = <K extends keyof ImportChoices>(
  choices: ImportChoices,
  group: K,
  key: string,
  value: ImportChoices[K][string] | null,
): ImportChoices => {
  const next = { ...choices[group] } as Record<string, ImportChoices[K][string]>;
  if (value === null) delete next[key];
  else next[key] = value;
  return { ...choices, [group]: next };
};

const operatorList = (names: string[]) =>
  names.length === 0
    ? "this operator"
    : names.length <= 2
      ? names.join(" and ")
      : `these ${names.length} operators`;

export const RevenueImport = ({ onCancel, onDone }: RevenueImportProps) => {
  const theme = useImportTheme();
  const setPageHeader = useSetAtom(pageHeaderAtom);
  const showToast = useSetAtom(showToastAtom);
  const { checks: existingChecks, importChecks } = useRevenueChecks();
  const { accounts, loading: accountsLoading } = useChartOfAccounts();
  const { types, ensureTypes, setAccount } = useTaxDeductTypes();
  const { saveMatches } = useImportMatches();

  const [step, setStep] = useState<ImportStep>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<CheckDetailParseResult | null>(null);
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [choices, setChoices] = useState<ImportChoices>(EMPTY_CHOICES);
  const [remember, setRemember] = useState(true);
  const [includeOverrides, setIncludeOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const readToken = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    setPageHeader({ title: "Revenue Check Input", subtitle: "Import check detail" });
    return () => setPageHeader({});
  }, [setPageHeader]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (firstStep.current) firstStep.current = false;
    else headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const checks = result && !result.fatal ? result.checks : NO_CHECKS;
  const { resolution, contactsLoading, wells, wellsLoading } = useImportResolution(checks, choices);

  const projectedTypes = useMemo(() => projectTypes(types, resolution.labels), [types, resolution.labels]);
  const reviewRows = useMemo(
    () =>
      buildReviewRows(
        checks,
        resolution,
        projectedTypes,
        existingChecks,
        includeOverrides,
        accountsLoading ? undefined : accounts,
      ),
    [checks, resolution, projectedTypes, existingChecks, includeOverrides, accounts, accountsLoading],
  );
  const selectedRows = reviewRows.filter((row) => row.included);

  const madeMatches = Object.values(choices).some((group) => Object.keys(group).length > 0);
  const leave = () => (madeMatches ? setConfirmingLeave(true) : onCancel());

  const rememberNames = resolution.operators.map((o) => o.contactName || o.name);

  const handleFile = async (file: File) => {
    const token = ++readToken.current;
    const problem = fileProblem(file);
    setFileName(file.name);
    setResult(null);
    setChoices(EMPTY_CHOICES);
    setIncludeOverrides({});
    setFileError(problem);
    if (problem) return;
    setReading(true);
    try {
      const text = await readCsvText(file);
      if (token !== readToken.current) return;
      setResult(parseCheckDetailCsv(text));
    } catch {
      if (token === readToken.current) setFileError(`Couldn't read ${file.name}. Save it again as CSV and retry.`);
    } finally {
      if (token === readToken.current) setReading(false);
    }
  };

  const save = async () => {
    if (saving || !selectedRows.length || resolution.needsMatch > 0) return;
    setStep(4);
    setSaving(true);
    setSaveError(null);
    try {
      const drafts = selectedRows.map((row) => row.draft);
      const seen: SeenTaxDeductLabel[] = drafts.flatMap((draft) =>
        draft.lines.flatMap((line) => [
          ...line.taxes.map((entry) => ({ label: entry.label, kind: "tax" as const, operator: draft.operatorName, checkDate: draft.checkDate })),
          ...line.deducts.map((entry) => ({
            label: entry.label,
            kind: "deduct" as const,
            operator: draft.operatorName,
            checkDate: draft.checkDate,
          })),
        ]),
      );
      const ids = await importChecks(drafts);

      // The checks are in; a failure writing labels or remembered matches mustn't read as a failed
      // import, which would invite importing the same checks twice.
      let notes: string | null = null;
      try {
        const added = await ensureTypes(seen);
        for (const label of resolution.labels) {
          if (label.source !== "chosen" || !label.accountId) continue;
          const wanted = normalizeLabel(label.label);
          const id = label.type?.id ?? added.find((t) => t.kind === label.kind && t.label === wanted)?.id;
          if (id) await setAccount(id, label.accountId);
        }

        if (remember) {
          await saveMatches(
            resolution.operators
              .filter((operator) => operator.contactId)
              .map((operator) => ({
                operatorId: operator.contactId!,
                printedName: operator.name,
                owners: Object.fromEntries(
                  resolution.owners
                    .filter((owner) => owner.operatorKey === operator.key && owner.number && owner.contactId)
                    .map((owner) => [owner.number, owner.contactId!]),
                ),
                wells: Object.fromEntries(
                  resolution.properties
                    .filter((property) => property.operatorKey === operator.key && property.operatorCc && property.well)
                    .map((property) => [property.operatorCc, property.well!]),
                ),
              })),
          );
        }
      } catch {
        notes = " (the new tax and deduct labels or remembered matches couldn't be saved)";
      }

      showToast(`Imported ${plural(ids.length, "check")} as ${ids.length === 1 ? "a draft" : "drafts"}${notes ?? ""}`);
      onDone(ids[0]);
    } catch (err) {
      setSaveError((err as Error).message || "The checks couldn't be saved.");
      setSaving(false);
    }
  };

  const chooseWell = (key: string, choice: WellChoice | null) => setChoices((c) => setKey(c, "wells", key, choice));

  const ready = checks.length > 0;
  const stepNotes: [string, string, string, string] = [
    fileName && result && !result.fatal ? `${fileName} · ${plural(result.rowCount, "row")}` : "Operator's check detail (.csv)",
    step < 2
      ? "Names, wells and labels"
      : resolution.needsMatch
        ? `${plural(resolution.needsMatch, "item")} ${resolution.needsMatch === 1 ? "needs" : "need"} a match`
        : "Everything is matched",
    step < 3 ? "Totals and balance" : `${plural(selectedRows.length, "check")} selected`,
    "As a draft check, never auto-posted",
  ];

  const banner =
    step === 1
      ? "Use the standard check detail layout: one detail line per row, from Operator Name to Detail Line Notation. Rows are grouped into checks by operator, check number and check date."
      : step === 2
        ? `This file uses the standard check detail layout (Operator Name … Detail Line Notation), so every column was read automatically. Only names and codes CADE hasn't seen before need a match.${
            result?.missingColumns.length ? ` Left blank because they aren't in the file: ${result.missingColumns.join(", ")}.` : ""
          }`
        : "Imported checks are saved as drafts. Nothing is posted until someone opens the check, reviews it and posts it.";

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-300/30 gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Upload className="size-5" aria-hidden />
          Import Check Detail
        </h2>
        <Button
          variant="ghost"
          onClick={leave}
          disabled={saving}
          className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
        >
          Back to Revenue Checks
        </Button>
      </div>

      <ImportStepper current={step} notes={stepNotes} onSelect={saving ? undefined : setStep} />

      <div className="flex items-start gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden />
        <p className="text-sm text-blue-200">{banner}</p>
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
        {STEP_HEADINGS[step]}
      </h3>

      {step === 1 && (
        <UploadStep fileName={fileName} result={result} reading={reading} fileError={fileError} onFile={handleFile} />
      )}

      {step === 2 && (
        <MatchStep
          checks={checks}
          resolution={resolution}
          contactsLoading={contactsLoading}
          wells={wells}
          wellsLoading={wellsLoading}
          onChooseOperator={(key, id) => setChoices((c) => setKey(c, "operators", key, id))}
          onChooseOwner={(key, id) => setChoices((c) => setKey(c, "owners", key, id))}
          onChooseWell={chooseWell}
          onChooseAccount={(key, id) => setChoices((c) => setKey(c, "accounts", key, id))}
          remember={remember}
          onRememberChange={setRemember}
          rememberFor={operatorList(rememberNames)}
        />
      )}

      {step === 3 && (
        <ReviewStep
          rows={reviewRows}
          skippedRows={result?.skippedRows ?? []}
          onToggle={(key, included) => setIncludeOverrides((o) => ({ ...o, [key]: included }))}
        />
      )}

      {step === 4 &&
        (saveError ? (
          <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${theme.errorBox}`}>
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>The checks weren&apos;t imported: {saveError}</span>
          </div>
        ) : (
          <div role="status" className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-purple-300" aria-hidden />
            <span className="text-sm text-white/70">
              Saving {plural(selectedRows.length, "check")} as {selectedRows.length === 1 ? "a draft" : "drafts"}…
            </span>
          </div>
        ))}

      <div className="flex flex-wrap justify-between gap-3 border-t border-purple-300/30 pt-3">
        {step === 1 ? (
          <Button variant="outline" onClick={leave} className={`cursor-pointer ${theme.outlineButton}`}>
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => setStep((s) => (s === 4 ? 3 : ((s - 1) as ImportStep)))}
            className={`cursor-pointer ${theme.outlineButton}`}
          >
            {step === 4 ? "Back to Review" : "Back"}
          </Button>
        )}

        {step === 1 && (
          <Button disabled={!ready || reading} onClick={() => setStep(2)} className={PRIMARY_BUTTON_CLASS}>
            Continue to Match
          </Button>
        )}
        {step === 2 && (
          <Button disabled={resolution.needsMatch > 0} onClick={() => setStep(3)} className={PRIMARY_BUTTON_CLASS}>
            Continue to Review
          </Button>
        )}
        {step === 3 && (
          <Button disabled={!selectedRows.length || resolution.needsMatch > 0} onClick={() => void save()} className={PRIMARY_BUTTON_CLASS}>
            Save {plural(selectedRows.length, "check")} as {selectedRows.length === 1 ? "a draft" : "drafts"}
          </Button>
        )}
        {step === 4 && saveError && (
          <Button onClick={() => void save()} className={PRIMARY_BUTTON_CLASS}>
            Try again
          </Button>
        )}
      </div>

      {confirmingLeave && (
        <DiscardMatchesModal
          onKeepMatching={() => setConfirmingLeave(false)}
          onDiscard={() => {
            setConfirmingLeave(false);
            onCancel();
          }}
        />
      )}
    </Card>
  );
};

export default RevenueImport;
