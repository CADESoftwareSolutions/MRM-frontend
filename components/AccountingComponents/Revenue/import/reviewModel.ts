import type { CheckDetailCheck } from "@/lib/checkDetailCsv";
import {
  RevenueCheck,
  RevenueCheckInput,
  RevenueCheckTotals,
  RevenueDisplayStatus,
  RevenueLine,
  TaxDeductType,
  checkDisplayStatus,
  computeCheckTotals,
  findDuplicateChecks,
  groupLinesByProperty,
  postBlockers,
} from "@/types/revenue";
import { lineIssues } from "../entry/checkDraft";
import { ImportResolution, buildDraft } from "./importModel";

export interface ReviewRow {
  key: string;
  check: CheckDetailCheck;
  draft: RevenueCheckInput;
  totals: RevenueCheckTotals;
  status: RevenueDisplayStatus;
  statusLabel: string;
  blockers: string[];
  /** Lines whose amounts don't add up, as "654655 · SMITH UNIT 2H: Owner value + taxes …". */
  lineProblems: string[];
  /** "654655 · SMITH UNIT 2H" for each property imported without a well. */
  unlinked: string[];
  /** A check already in Revenue Checks with the same operator, number and date. Void checks don't
   * count: a voided check is meant to be entered again. */
  duplicateOf: RevenueCheck | undefined;
  included: boolean;
}

const MAX_LINE_PROBLEMS = 5;

const lineProblemsOf = (draft: RevenueCheckInput, types: TaxDeductType[]): string[] => {
  const problems = draft.lines.flatMap((line) => {
    const name = [line.operatorCc.trim(), line.propertyDescription.trim()].filter(Boolean).join(" · ") || "A property";
    const full: RevenueLine = { ...line, id: "", incomeAccountId: null };
    return lineIssues(full, types).map((issue) => `${name}: ${issue}`);
  });
  const unique = Array.from(new Set(problems));
  return unique.length > MAX_LINE_PROBLEMS
    ? [...unique.slice(0, MAX_LINE_PROBLEMS), `and ${unique.length - MAX_LINE_PROBLEMS} more line problems.`]
    : unique;
};

export const buildReviewRows = (
  checks: CheckDetailCheck[],
  resolution: ImportResolution,
  projectedTypes: TaxDeductType[],
  existingChecks: RevenueCheck[],
  includeOverrides: Record<string, boolean>,
  accounts?: { id: string; isActive: boolean }[],
): ReviewRow[] =>
  checks.map((check) => {
    const draft = buildDraft(check, resolution);
    const postable = { ...draft, status: "draft" as const };
    const status = checkDisplayStatus(postable, projectedTypes, accounts);
    const blockers = postBlockers(postable, projectedTypes, accounts);
    const identity = { checkNumber: draft.checkNumber, checkDate: draft.checkDate };
    const duplicateOf =
      findDuplicateChecks(existingChecks, { ...identity, operatorId: draft.operatorId, operatorName: draft.operatorName })[0] ??
      findDuplicateChecks(existingChecks, { ...identity, operatorName: check.operatorName })[0];
    return {
      key: check.key,
      check,
      draft,
      totals: computeCheckTotals(draft),
      status,
      statusLabel: status === "Draft" && blockers.length ? `Draft · ${blockers.length} to fix` : status,
      blockers,
      lineProblems: lineProblemsOf(draft, projectedTypes),
      unlinked: groupLinesByProperty(draft.lines)
        .filter((group) => !group.linked)
        .map((group) => [group.operatorCc, group.propertyDescription].filter(Boolean).join(" · ") || "A property"),
      duplicateOf,
      // Re-importing a check that's already entered would double its revenue, so those start unticked.
      included: includeOverrides[check.key] ?? !duplicateOf,
    };
  });
