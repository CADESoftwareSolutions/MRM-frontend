import { format } from "date-fns";
import type { ContactOption } from "@/hooks/useContactOptions";
import type { SeenTaxDeductLabel } from "@/hooks/useTaxDeductTypes";
import {
  RevenueCheck,
  RevenueCheckInput,
  RevenueLine,
  RevenueTaxDeduct,
  TaxDeductKind,
  TaxDeductType,
  blankRevenueLine,
  findTaxDeductType,
  formatMoney,
  glPeriodForDate,
  isLineLinked,
  newRevenueId,
  normalizeLabel,
  propertyKey,
  roundCents,
  sumCents,
} from "@/types/revenue";

/** The editable part of a check; everything else comes from the stored record. */
export interface CheckDraft {
  operatorId: string | null;
  operatorName: string;
  ownerId: string | null;
  ownerName: string;
  ownerNumber: string;
  checkNumber: string;
  checkDate: string;
  checkAmount: number;
  depositAccountId: string;
  depositDate: string | null;
  glPeriod: string;
  stubFileName: string | null;
  lines: RevenueLine[];
}

export type HeaderField =
  | "operator"
  | "owner"
  | "ownerNumber"
  | "checkNumber"
  | "checkDate"
  | "checkAmount"
  | "glPeriod";

export type HeaderErrors = Partial<Record<HeaderField, string>>;

export const HEADER_FIELD_LABELS: Record<HeaderField, string> = {
  operator: "Operator",
  owner: "Owner",
  ownerNumber: "Owner Number",
  checkNumber: "Check Number",
  checkDate: "Check Date",
  checkAmount: "Check Amount",
  glPeriod: "G/L Period",
};

export const OPERATOR_CLASSIFICATIONS = ["OPERATOR", "PURCHASER"];

export const todayIso = () => format(new Date(), "yyyy-MM-dd");

/** depositAccountId is the default deposit account's id ("" if the company's chart has none). */
export const newCheckDraft = (depositAccountId: string): CheckDraft => {
  const checkDate = todayIso();
  return {
    operatorId: null,
    operatorName: "",
    ownerId: null,
    ownerName: "",
    ownerNumber: "",
    checkNumber: "",
    checkDate,
    checkAmount: 0,
    depositAccountId,
    depositDate: null,
    glPeriod: glPeriodForDate(checkDate),
    stubFileName: null,
    lines: [blankRevenueLine()],
  };
};

export const draftFromCheck = (check: RevenueCheck): CheckDraft => ({
  operatorId: check.operatorId,
  operatorName: check.operatorName,
  ownerId: check.ownerId,
  ownerName: check.ownerName,
  ownerNumber: check.ownerNumber,
  checkNumber: check.checkNumber,
  checkDate: check.checkDate,
  checkAmount: check.checkAmount,
  depositAccountId: check.depositAccountId,
  depositDate: check.depositDate,
  glPeriod: check.glPeriod,
  stubFileName: check.stubFileName,
  lines: check.lines,
});

/** A new, unsaved draft with the check's header and lines (dates kept as they were), for
 * re-entering a voided check. Lines get new ids so the two checks never share one. */
export const draftCopyOf = (check: RevenueCheck): CheckDraft => ({
  ...draftFromCheck(check),
  stubFileName: null,
  lines: check.lines.map((line) => ({ ...line, id: newRevenueId("rl") })),
});

export const headerErrors = (draft: CheckDraft): HeaderErrors => {
  const errors: HeaderErrors = {};
  if (!draft.operatorName.trim()) errors.operator = "Operator is required";
  if (!draft.ownerName.trim()) errors.owner = "Owner is required";
  if (!draft.checkNumber.trim()) errors.checkNumber = "Check Number is required";
  if (!draft.checkDate) errors.checkDate = "Check Date is required";
  if (!draft.checkAmount) errors.checkAmount = "Check Amount is required";
  if (!draft.glPeriod) errors.glPeriod = "G/L Period is required";
  return errors;
};

const NUMBER_FIELDS = [
  "ownerPercent",
  "distributionPercent",
  "price",
  "grossVolume",
  "grossValue",
  "grossTaxes",
  "grossDeducts",
  "netValue",
  "ownerVolume",
  "ownerValue",
  "ownerTaxes",
  "ownerDeducts",
  "ownerNetValue",
] as const;

const isBlankEntry = (entry: RevenueTaxDeduct) => !entry.label.trim() && !entry.gross && !entry.net;

const isBlankLine = (line: RevenueLine) =>
  !line.operatorCc.trim() &&
  !line.propertyDescription.trim() &&
  !line.productCode.trim() &&
  !line.interestType.trim() &&
  !line.prodDate &&
  !line.notation.trim() &&
  line.btuFactor == null &&
  line.taxes.every(isBlankEntry) &&
  line.deducts.every(isBlankEntry) &&
  NUMBER_FIELDS.every((field) => !line[field]);

/** What gets saved, totalled and checked for posting: untouched blank lines and blank tax /
 * deduct rows are left out, so an empty "Add Line" never blocks a post. */
export const cleanLines = (lines: RevenueLine[]): RevenueLine[] =>
  lines
    .filter((line) => !isBlankLine(line))
    .map((line) => {
      const taxes = line.taxes.filter((entry) => !isBlankEntry(entry));
      const deducts = line.deducts.filter((entry) => !isBlankEntry(entry));
      return taxes.length === line.taxes.length && deducts.length === line.deducts.length
        ? line
        : { ...line, taxes, deducts };
    });

export const draftToInput = (
  draft: CheckDraft,
  id: string | null,
  lines: RevenueLine[],
): RevenueCheckInput => ({
  id,
  operatorId: draft.operatorId,
  operatorName: draft.operatorName.trim(),
  ownerId: draft.ownerId,
  ownerName: draft.ownerName.trim(),
  ownerNumber: draft.ownerNumber.trim(),
  checkNumber: draft.checkNumber.trim(),
  checkDate: draft.checkDate,
  checkAmount: roundCents(draft.checkAmount),
  depositAccountId: draft.depositAccountId,
  depositDate: draft.depositDate || null,
  glPeriod: draft.glPeriod,
  stubFileName: draft.stubFileName,
  lines,
});

/** One entry per occurrence, so ensureTypes can count lines for labels it adds. */
export const labelsOnLines = (lines: RevenueLine[], operator: string): SeenTaxDeductLabel[] =>
  lines.flatMap((line) => [
    ...line.taxes.map((entry) => ({ label: entry.label, kind: "tax" as const, operator })),
    ...line.deducts.map((entry) => ({ label: entry.label, kind: "deduct" as const, operator })),
  ]).filter((seen) => normalizeLabel(seen.label));

/** A line edit; moving a line to another Operator CC takes on that property's description and
 * well link when it has one, since lines are grouped and linked by Operator CC. A line leaving
 * its property for a new or blank CC drops the old well link, unless it was the property's last
 * line (the whole property was renamed). */
export const applyLinePatch = (lines: RevenueLine[], line: RevenueLine, patch: Partial<RevenueLine>): RevenueLine => {
  const next = { ...line, ...patch };
  if (patch.operatorCc === undefined || patch.operatorCc.trim() === line.operatorCc.trim()) return next;
  const cc = next.operatorCc.trim();
  const siblings = cc ? lines.filter((other) => other.id !== line.id && other.operatorCc.trim() === cc) : [];
  if (!siblings.length) {
    const oldKey = propertyKey(line);
    const oldGroupHasOthers = lines.some((other) => other.id !== line.id && propertyKey(other) === oldKey);
    return !cc || oldGroupHasOthers ? { ...next, wellId: null, wellLabel: null } : next;
  }
  const linked = siblings.find(isLineLinked);
  return {
    ...next,
    wellId: linked?.wellId ?? null,
    wellLabel: linked?.wellLabel ?? null,
    propertyDescription:
      next.propertyDescription.trim() ||
      siblings.find((other) => other.propertyDescription.trim())?.propertyDescription ||
      "",
  };
};

const normalizeName = (name: string) =>
  name.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();

/** The one contact whose name matches a printed name (ignoring case and punctuation), preferring
 * contacts with one of `preferred` classifications; undefined when there's none or it's ambiguous. */
export const matchContactByName = (
  options: ContactOption[],
  printedName: string,
  preferred?: string[],
): ContactOption | undefined => {
  const wanted = normalizeName(printedName);
  if (!wanted) return undefined;
  const matches = options.filter(
    (option) =>
      normalizeName(option.name) === wanted ||
      (option.nameLine2 && normalizeName(`${option.name} ${option.nameLine2}`) === wanted),
  );
  if (preferred?.length) {
    const preferredMatches = matches.filter((option) =>
      option.classifications.some((c) => preferred.includes(c.toUpperCase())),
    );
    if (preferredMatches.length) return preferredMatches.length === 1 ? preferredMatches[0] : undefined;
  }
  return matches.length === 1 ? matches[0] : undefined;
};

const sameParty = (aId: string | null, aName: string, bId: string | null, bName: string) =>
  aId && bId ? aId === bId : !!normalizeName(aName) && normalizeName(aName) === normalizeName(bName);

/** The owner number this operator used for this owner on their latest other check. */
export const rememberedOwnerNumber = (
  checks: RevenueCheck[],
  draft: Pick<CheckDraft, "operatorId" | "operatorName" | "ownerId" | "ownerName">,
  excludeId: string | null,
): string => {
  if (!draft.operatorName.trim() || !draft.ownerName.trim()) return "";
  const latest = checks
    .filter(
      (check) =>
        check.id !== excludeId &&
        check.ownerNumber.trim() &&
        sameParty(check.operatorId, check.operatorName, draft.operatorId, draft.operatorName) &&
        sameParty(check.ownerId, check.ownerName, draft.ownerId, draft.ownerName),
    )
    .sort((a, b) => b.checkDate.localeCompare(a.checkDate))[0];
  return latest?.ownerNumber ?? "";
};

export interface AmountMismatch {
  /** What the rows or parts add up to. */
  expected: number;
  actual: number;
  message: string;
}

const KIND_PLURAL: Record<TaxDeductKind, string> = { tax: "taxes", deduct: "deducts" };

/** The line's owner taxes (or deducts) against its tax (deduct) rows. */
export const rowsMismatch = (line: RevenueLine, kind: TaxDeductKind): AmountMismatch | null => {
  const entries = kind === "tax" ? line.taxes : line.deducts;
  const actual = kind === "tax" ? line.ownerTaxes : line.ownerDeducts;
  if (!entries.length) return null;
  const expected = sumCents(entries.map((entry) => entry.net));
  if (Math.abs(expected - roundCents(actual)) < 0.005) return null;
  return {
    expected,
    actual,
    message: `${kind === "tax" ? "Tax" : "Deduct"} rows add up to ${formatMoney(expected)}, but the line's owner ${
      KIND_PLURAL[kind]
    } are ${formatMoney(actual)}.`,
  };
};

/** Value + taxes + deducts against the printed net, for the gross or the owner share. */
export const netMismatch = (line: RevenueLine, share: "gross" | "owner"): AmountMismatch | null => {
  const [value, taxes, deducts, net] =
    share === "gross"
      ? [line.grossValue, line.grossTaxes, line.grossDeducts, line.netValue]
      : [line.ownerValue, line.ownerTaxes, line.ownerDeducts, line.ownerNetValue];
  if (!value && !taxes && !deducts && !net) return null;
  const expected = sumCents([value, taxes, deducts]);
  if (Math.abs(expected - roundCents(net)) < 0.005) return null;
  return {
    expected,
    actual: net,
    message: `${share === "gross" ? "Gross" : "Owner"} value + taxes + deducts = ${formatMoney(expected)}, but the ${
      share === "gross" ? "gross" : "owner"
    } net is ${formatMoney(net)}.`,
  };
};

/** Short reasons a line needs a look, for the row's warning marker. */
export const lineIssues = (line: RevenueLine, types: TaxDeductType[]): string[] => {
  const issues: string[] = [];
  const entries = [
    ...line.taxes.map((entry) => ({ entry, kind: "tax" as const })),
    ...line.deducts.map((entry) => ({ entry, kind: "deduct" as const })),
  ];
  for (const { entry, kind } of entries) {
    const label = normalizeLabel(entry.label);
    if (!label) {
      if (entry.gross || entry.net) issues.push(`A ${kind} amount has no label.`);
    } else if (!findTaxDeductType(types, label, kind)?.accountId) {
      issues.push(`${label} has no account.`);
    }
  }
  for (const mismatch of [
    rowsMismatch(line, "tax"),
    rowsMismatch(line, "deduct"),
    netMismatch(line, "gross"),
    netMismatch(line, "owner"),
  ]) {
    if (mismatch) issues.push(mismatch.message);
  }
  return Array.from(new Set(issues));
};
