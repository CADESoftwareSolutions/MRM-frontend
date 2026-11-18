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

export const newRevenueId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;

const INCOME_ACCOUNT_BY_PRODUCT: Record<string, string> = {
  OIL: "coa-4000",
  GAS: "coa-4010",
  NGL: "coa-4020",
};

export const incomeAccountForProduct = (code: string): string =>
  INCOME_ACCOUNT_BY_PRODUCT[code.trim().toUpperCase()] ?? "coa-4100";

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

/** "2026-10-27" → "10/27/2026". Slices the text, so it's for date-only values, not timestamps. */
export const formatCheckDate = (isoDate: string | null): string => {
  if (!isoDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : isoDate;
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

/** The check with every line and tax/deduct entry stamped with the account it counts toward now. */
export const stampCheckAccounts = <C extends Pick<RevenueCheck, "lines">>(check: C, types: TaxDeductType[]): C => ({
  ...check,
  lines: check.lines.map((line) => ({
    ...line,
    incomeAccountId: incomeAccountForProduct(line.productCode),
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
