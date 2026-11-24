import { type AccountNumberParts, findAccountByNumber } from "./chartOfAccounts";

export const MAX_TAXES = 10;
export const MAX_DEDUCTS = 10;
/** Checks deposit to 1000 CASH unless the user picks another account. */
export const DEFAULT_DEPOSIT_ACCOUNT_NUMBER = 1000;

export type RevenueCheckStatus = "draft" | "posted" | "void";
export type RevenueDisplayStatus = "Draft" | "Out of balance" | "Ready to post" | "Posted" | "Void";
export type TaxDeductKind = "tax" | "deduct";

export interface RevenueTaxDeduct {
  /** As printed on the stub. */
  label: string;
  /** Negative on the stub, 100% of the property. */
  gross: number;
  /** Negative on the stub, the owner's share. */
  net: number;
  /** Stamped when the check posts, so a later remap of the label doesn't move the posted amount. */
  accountId?: string | null;
}

export interface RevenueLine {
  id: string;
  operatorCc: string;
  propertyDescription: string;
  wellId: string | null;
  wellLabel: string | null;
  productCode: string;
  interestType: string;
  /** As printed: 0.134003 means 0.134003% (0.00134003 as a decimal). */
  ownerPercent: number;
  /** As printed, same convention as ownerPercent. */
  distributionPercent: number;
  /** "2026-03" (the stub prints 0326). */
  prodDate: string;
  price: number;
  btuFactor: number | null;
  grossVolume: number;
  grossValue: number;
  grossTaxes: number;
  grossDeducts: number;
  netValue: number;
  ownerVolume: number;
  ownerValue: number;
  ownerTaxes: number;
  ownerDeducts: number;
  ownerNetValue: number;
  /** Up to MAX_TAXES. */
  taxes: RevenueTaxDeduct[];
  /** Up to MAX_DEDUCTS. */
  deducts: RevenueTaxDeduct[];
  notation: string;
  /** Stamped when the check posts, from the product code at that time. */
  incomeAccountId: string | null;
}

export interface RevenueCheck {
  id: string;
  operatorId: string | null;
  operatorName: string;
  ownerId: string | null;
  ownerName: string;
  ownerNumber: string;
  checkNumber: string;
  /** "2026-10-27" */
  checkDate: string;
  checkAmount: number;
  depositAccountId: string;
  /** "2026-10-30" */
  depositDate: string | null;
  /** "2026-10" */
  glPeriod: string;
  status: RevenueCheckStatus;
  stubFileName: string | null;
  lines: RevenueLine[];
  postedBy: string | null;
  /** ISO timestamp. */
  postedAt: string | null;
  voidedBy: string | null;
  /** ISO timestamp. */
  voidedAt: string | null;
  voidReason: string | null;
  /** Set on a re-entry draft: the void check it was copied from. */
  reenteredFromId?: string | null;
  /** Set on a void check once its re-entry draft is saved, so it isn't re-entered twice. */
  reenteredAsId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TaxDeductType {
  id: string;
  /** As printed on stubs, uppercase. Unique per kind. */
  label: string;
  kind: TaxDeductKind;
  accountId: string | null;
  lineCount: number;
  /** "2026-10-27" */
  lastSeen: string | null;
  operators: string[];
  /** Added by an import or by saving a check with a label not seen before, and not mapped yet. */
  isNew: boolean;
}

export type RevenueLineInput = Omit<RevenueLine, "id" | "incomeAccountId"> & {
  id?: string | null;
  incomeAccountId?: string | null;
};

/** What saveDraft / importChecks take. Optional fields keep their stored value on update and get
 * a default on create (deposit to the 1000 account, G/L period from the check date). */
export type RevenueCheckInput = Pick<
  RevenueCheck,
  "operatorName" | "ownerName" | "ownerNumber" | "checkNumber" | "checkDate" | "checkAmount"
> &
  Partial<
    Pick<
      RevenueCheck,
      | "operatorId"
      | "ownerId"
      | "depositAccountId"
      | "depositDate"
      | "glPeriod"
      | "stubFileName"
      | "reenteredFromId"
    >
  > & {
    id?: string | null;
    lines: RevenueLineInput[];
  };

export interface RevenueCheckTotals {
  ownerValue: number;
  ownerTaxes: number;
  ownerDeducts: number;
  ownerNet: number;
  /** checkAmount − ownerNet. */
  difference: number;
  balanced: boolean;
}

type OwnerAmounts = Pick<RevenueLine, "ownerValue" | "ownerTaxes" | "ownerDeducts" | "ownerNetValue">;
type PropertyLine = OwnerAmounts &
  Pick<RevenueLine, "operatorCc" | "propertyDescription" | "wellId" | "wellLabel">;

export interface RevenuePropertyGroup<L extends PropertyLine = RevenueLine> {
  /** propertyKey of the lines: the trimmed Operator CC, or "desc:" + the description when the CC is blank. */
  key: string;
  operatorCc: string;
  propertyDescription: string;
  wellId: string | null;
  wellLabel: string | null;
  /** Every line in the group is linked to a well. */
  linked: boolean;
  lines: L[];
  ownerValue: number;
  ownerTaxes: number;
  ownerDeducts: number;
  ownerNet: number;
}

export const roundCents = (x: number): number => {
  const r = Math.round(Number(`${Math.abs(x).toFixed(8)}e2`));
  return (Math.sign(x) * r) / 100 || 0;
};

export const sumCents = (values: number[]): number =>
  roundCents(values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0));

export const formatMoney = (value: number): string =>
  roundCents(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatOwnerPercent = (percent: number): string => `${percent.toFixed(6)}%`;

export const newRevenueId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;

const INCOME_ACCOUNT_NUMBER_BY_PRODUCT: Record<string, number> = {
  OIL: 4000,
  GAS: 4010,
  NGL: 4020,
};

/** Any product other than oil, gas and NGL goes to 4100 OTHER INCOME. */
export const OTHER_INCOME_ACCOUNT_NUMBER = 4100;

export const incomeAccountNumberForProduct = (code: string): number =>
  INCOME_ACCOUNT_NUMBER_BY_PRODUCT[code.trim().toUpperCase()] ?? OTHER_INCOME_ACCOUNT_NUMBER;

/** The product's income account id, or null while the chart of accounts is loading or if the
 * company's chart has no account with that number. */
export const incomeAccountForProduct = (code: string, accounts: NumberedAccount[] | undefined): string | null =>
  findAccountByNumber(accounts, incomeAccountNumberForProduct(code))?.id ?? null;

export const normalizeLabel = (label: string): string =>
  label.trim().replace(/\s+/g, " ").toUpperCase();

export const findTaxDeductType = (
  types: TaxDeductType[],
  label: string,
  kind: TaxDeductKind
): TaxDeductType | undefined => {
  const wanted = normalizeLabel(label);
  return types.find((type) => type.kind === kind && type.label === wanted);
};

export const isLineLinked = (line: Pick<RevenueLine, "wellId" | "wellLabel">): boolean =>
  Boolean(line.wellId || line.wellLabel);

export const computeCheckTotals = (
  check: Pick<RevenueCheck, "checkAmount"> & { lines: OwnerAmounts[] }
): RevenueCheckTotals => {
  const ownerNet = sumCents(check.lines.map((line) => line.ownerNetValue));
  const difference = roundCents(check.checkAmount - ownerNet);
  return {
    ownerValue: sumCents(check.lines.map((line) => line.ownerValue)),
    ownerTaxes: sumCents(check.lines.map((line) => line.ownerTaxes)),
    ownerDeducts: sumCents(check.lines.map((line) => line.ownerDeducts)),
    ownerNet,
    difference,
    balanced: Math.abs(difference) < 0.005,
  };
};

export const propertyKey = (line: Pick<RevenueLine, "operatorCc" | "propertyDescription">): string => {
  const cc = line.operatorCc.trim();
  return cc || `desc:${normalizeLabel(line.propertyDescription)}`;
};

export const groupLinesByProperty = <L extends PropertyLine>(lines: L[]): RevenuePropertyGroup<L>[] => {
  const groups = new Map<string, L[]>();
  for (const line of lines) {
    const key = propertyKey(line);
    const group = groups.get(key);
    if (group) group.push(line);
    else groups.set(key, [line]);
  }
  return Array.from(groups, ([key, groupLines]) => {
    const linkedLine = groupLines.find(isLineLinked);
    return {
      key,
      operatorCc: groupLines[0].operatorCc.trim(),
      propertyDescription: groupLines.find((line) => line.propertyDescription.trim())?.propertyDescription.trim() ?? "",
      wellId: linkedLine?.wellId ?? null,
      wellLabel: linkedLine?.wellLabel ?? null,
      linked: groupLines.every(isLineLinked),
      lines: groupLines,
      ownerValue: sumCents(groupLines.map((line) => line.ownerValue)),
      ownerTaxes: sumCents(groupLines.map((line) => line.ownerTaxes)),
      ownerDeducts: sumCents(groupLines.map((line) => line.ownerDeducts)),
      ownerNet: sumCents(groupLines.map((line) => line.ownerNetValue)),
    };
  });
};

const KIND_NAME: Record<TaxDeductKind, string> = { tax: "Tax", deduct: "Deduct" };

type PostableCheck = Pick<RevenueCheck, "checkAmount"> & {
  lines: (PropertyLine &
    Pick<RevenueLine, "taxes" | "deducts"> &
    Partial<Pick<RevenueLine, "productCode" | "prodDate">>)[];
};

type AccountStatus = { id: string; isActive: boolean };
type NumberedAccount = { id: string } & AccountNumberParts;

/** True when the account exists and is active; without an account list, any id counts. */
export const isUsableAccount = (accountId: string | null | undefined, accounts?: AccountStatus[]): boolean => {
  if (!accountId) return false;
  if (!accounts) return true;
  return accounts.some((account) => account.id === accountId && account.isActive);
};

export const isTypeMapped = (type: Pick<TaxDeductType, "accountId">, accounts?: AccountStatus[]): boolean =>
  isUsableAccount(type.accountId, accounts);

const hasAmounts = (line: OwnerAmounts) =>
  [line.ownerValue, line.ownerTaxes, line.ownerDeducts, line.ownerNetValue].some((n) => Number.isFinite(n) && n !== 0);

const propertyName = (line: Pick<RevenueLine, "operatorCc" | "propertyDescription">) =>
  [line.operatorCc.trim(), line.propertyDescription.trim()].filter(Boolean).join(" · ") || "A property";

/** Why a check can't be posted yet; empty when it can. Pass the chart of accounts so a mapping to a
 * missing or inactive account counts as unmapped. */
export const postBlockers = (check: PostableCheck, types: TaxDeductType[], accounts?: AccountStatus[]): string[] => {
  if (!check.lines.length) return ["The check has no detail lines yet."];

  const blockers: string[] = [];
  const totals = computeCheckTotals(check);
  if (!totals.balanced) {
    blockers.push(
      `Detail lines total ${formatMoney(totals.ownerNet)} but the check is ${formatMoney(check.checkAmount)} (difference ${formatMoney(totals.difference)}).`
    );
  }

  for (const group of groupLinesByProperty(check.lines)) {
    if (group.linked) continue;
    blockers.push(`${propertyName(group)} isn't linked to a well.`);
  }

  const lineProblems = new Set<string>();
  for (const line of check.lines) {
    const name = propertyName(line);
    if (hasAmounts(line) && !line.operatorCc.trim() && !line.propertyDescription.trim()) {
      lineProblems.add("A line with amounts has no Operator CC or Property Description.");
    }
    if (!line.productCode?.trim()) lineProblems.add(`${name} has a line with no Product.`);
    if (!line.prodDate?.trim()) lineProblems.add(`${name} has a line with no Prod Date.`);
  }
  blockers.push(...lineProblems);

  const seen = new Set<string>();
  for (const line of check.lines) {
    const entries = [
      ...line.taxes.map((entry) => ({ entry, kind: "tax" as const })),
      ...line.deducts.map((entry) => ({ entry, kind: "deduct" as const })),
    ];
    for (const { entry, kind } of entries) {
      const label = normalizeLabel(entry.label);
      const key = `${kind}:${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!label) blockers.push(`A ${kind} amount has no label.`);
      else {
        const type = findTaxDeductType(types, label, kind);
        if (!type?.accountId) blockers.push(`${KIND_NAME[kind]} label ${label} has no account.`);
        else if (!isTypeMapped(type, accounts)) {
          blockers.push(`${KIND_NAME[kind]} label ${label} maps to an account that is missing or inactive.`);
        }
      }
    }
  }

  return blockers;
};

export const checkDisplayStatus = (
  check: PostableCheck & Pick<RevenueCheck, "status">,
  types: TaxDeductType[],
  accounts?: AccountStatus[]
): RevenueDisplayStatus => {
  if (check.status === "void") return "Void";
  if (check.status === "posted") return "Posted";
  if (!check.lines.length) return "Draft";
  if (!computeCheckTotals(check).balanced) return "Out of balance";
  return postBlockers(check, types, accounts).length ? "Draft" : "Ready to post";
};

const isMonth = (month: number) => month >= 1 && month <= 12;
const toProdDate = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

const MONTH_ABBREVIATIONS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const monthFromName = (name: string): number => {
  const index = MONTH_ABBREVIATIONS.indexOf(name.slice(0, 3).toLowerCase());
  return index === -1 ? NaN : index + 1;
};

const buildProdDate = (month: number, yearText: string): string | null => {
  if (!isMonth(month) || !yearText) return null;
  const short = +yearText;
  const year = yearText.length === 2 ? (short <= 29 ? 2000 + short : 1900 + short) : short;
  return year >= 1950 && year <= 2100 ? toProdDate(year, month) : null;
};

/** Reads a stub's production date ("0326", 326, "032026", "03/26", "03/2026", "2026-03", "Mar-26",
 * "Mar 2026" or a full date like "03/01/2026" or "2026-03-01") as "2026-03"; null when it can't
 * be read. Two-digit years follow Excel's pivot (00-29 is 2000s, 30-99 is 1900s) and years outside
 * 1950-2100 are rejected, which also catches an Excel serial number like "46082". */
export const parseProdDate = (raw: string | number | null | undefined): string | null => {
  if (raw == null) return null;
  const text = String(raw).trim();

  const iso = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(text);
  if (iso) return buildProdDate(+iso[2], iso[1]);

  const fullDate = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  if (fullDate) return buildProdDate(+fullDate[1], fullDate[3]);

  const slashed = /^(\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  if (slashed) return buildProdDate(+slashed[1], slashed[2]);

  const named = /^([A-Za-z]{3,9})[-\s/.]*(\d{2}|\d{4})$/.exec(text);
  if (named) return buildProdDate(monthFromName(named[1]), named[2]);

  if (/^\d{3,6}$/.test(text)) {
    const digits = text.padStart(text.length <= 4 ? 4 : 6, "0");
    return buildProdDate(+digits.slice(0, 2), digits.slice(2));
  }
  return null;
};

/** "2026-03" → "03/2026". */
export const formatProdDate = (prodDate: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(prodDate);
  return match ? `${match[2]}/${match[1]}` : prodDate;
};

/** "2026-10-27" → "10/27/2026". Slices the text, so it's for date-only values, not timestamps. */
export const formatCheckDate = (isoDate: string | null): string => {
  if (!isoDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : isoDate;
};

/** A local "2026-10-27" for a Date (not the UTC day that toISOString gives). */
export const localIsoDate = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** An ISO timestamp ("2026-10-28T02:30:00Z") as the viewer's local "10/27/2026". */
export const formatCheckTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : formatCheckDate(localIsoDate(date));
};

/** "2026-10-27" → "2026-10". */
export const glPeriodForDate = (isoDate: string): string => isoDate.slice(0, 7);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10" → "October 2026". */
export const formatGlPeriod = (period: string): string => {
  const match = /^(\d{4})-(\d{2})/.exec(period);
  const month = match ? MONTH_NAMES[+match[2] - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : period;
};

export const blankRevenueLine = (overrides: Partial<RevenueLine> = {}): RevenueLine => ({
  id: newRevenueId("rl"),
  operatorCc: "",
  propertyDescription: "",
  wellId: null,
  wellLabel: null,
  productCode: "",
  interestType: "",
  ownerPercent: 0,
  distributionPercent: 0,
  prodDate: "",
  price: 0,
  btuFactor: null,
  grossVolume: 0,
  grossValue: 0,
  grossTaxes: 0,
  grossDeducts: 0,
  netValue: 0,
  ownerVolume: 0,
  ownerValue: 0,
  ownerTaxes: 0,
  ownerDeducts: 0,
  ownerNetValue: 0,
  taxes: [],
  deducts: [],
  notation: "",
  incomeAccountId: null,
  ...overrides,
});

const stripLeadingZeros = (checkNumber: string) => checkNumber.trim().replace(/^0+(?=.)/, "");

export interface CheckIdentity {
  operatorId?: string | null;
  /** Used when either side has no operatorId. */
  operatorName?: string;
  checkNumber: string;
  checkDate: string;
}

/** Existing non-void checks from the same operator with the same check number (leading zeros
 * ignored) and check date. Pass excludeId to leave out the check being edited. */
export const findDuplicateChecks = (
  checks: RevenueCheck[],
  wanted: CheckIdentity,
  excludeId?: string | null
): RevenueCheck[] => {
  const number = stripLeadingZeros(wanted.checkNumber);
  const name = wanted.operatorName ? normalizeLabel(wanted.operatorName) : "";
  return checks.filter((check) => {
    if (check.status === "void" || check.id === excludeId) return false;
    if (check.checkDate !== wanted.checkDate || stripLeadingZeros(check.checkNumber) !== number) return false;
    if (wanted.operatorId && check.operatorId) return wanted.operatorId === check.operatorId;
    if (name) return normalizeLabel(check.operatorName) === name;
    return !wanted.operatorId && !check.operatorId;
  });
};

/** The account a tax or deduct amount counts toward: what it posted to once the check is posted or
 * void, the label's current mapping while it's still a draft. */
export const taxDeductAccountId = (
  entry: RevenueTaxDeduct,
  kind: TaxDeductKind,
  status: RevenueCheckStatus,
  types: TaxDeductType[]
): string | null => {
  const live = findTaxDeductType(types, entry.label, kind)?.accountId ?? null;
  return status === "draft" ? live : (entry.accountId ?? live);
};

/** The income account a line counts toward: stamped at post time for posted and void checks. */
export const lineIncomeAccountId = (
  line: Pick<RevenueLine, "productCode" | "incomeAccountId">,
  status: RevenueCheckStatus,
  accounts: NumberedAccount[] | undefined
): string | null =>
  status === "draft"
    ? incomeAccountForProduct(line.productCode, accounts)
    : (line.incomeAccountId ?? incomeAccountForProduct(line.productCode, accounts));

/** The check with every line and tax/deduct entry stamped with the account it counts toward now. */
export const stampCheckAccounts = <C extends Pick<RevenueCheck, "lines">>(
  check: C,
  types: TaxDeductType[],
  accounts: NumberedAccount[] | undefined
): C => ({
  ...check,
  lines: check.lines.map((line) => ({
    ...line,
    incomeAccountId: incomeAccountForProduct(line.productCode, accounts),
    taxes: line.taxes.map((entry) => ({
      ...entry,
      accountId: findTaxDeductType(types, entry.label, "tax")?.accountId ?? null,
    })),
    deducts: line.deducts.map((entry) => ({
      ...entry,
      accountId: findTaxDeductType(types, entry.label, "deduct")?.accountId ?? null,
    })),
  })),
});
