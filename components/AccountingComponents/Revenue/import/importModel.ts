import type { ContactOption } from "@/hooks/useContactOptions";
import type { WellOption } from "@/hooks/useWellOptions";
import type { RememberedWell } from "@/hooks/useImportMatches";
import type { CheckDetailCheck } from "@/lib/checkDetailCsv";
import {
  RevenueCheckInput,
  RevenueLineInput,
  TaxDeductKind,
  OTHER_INCOME_ACCOUNT_NUMBER,
  TaxDeductType,
  incomeAccountNumberForProduct,
  normalizeLabel,
  propertyKey,
} from "@/types/revenue";

// ── What's on the file ───────────────────────────────────────────────────────

export interface FileOperator {
  key: string;
  /** As printed. */
  name: string;
}

export interface FileOwner {
  key: string;
  operatorKey: string;
  name: string;
  number: string;
}

export interface FileProperty {
  key: string;
  operatorKey: string;
  operatorCc: string;
  description: string;
}

export interface FileLabel {
  key: string;
  kind: TaxDeductKind;
  /** As printed (first spelling seen). */
  label: string;
}

export interface ImportItems {
  operators: FileOperator[];
  owners: FileOwner[];
  properties: FileProperty[];
  /** Product codes, uppercase. */
  products: string[];
  labels: FileLabel[];
}

export const operatorKeyOf = (operatorName: string) => normalizeLabel(operatorName);

export const ownerKeyOf = (check: Pick<CheckDetailCheck, "operatorName" | "ownerNumber" | "ownerName">) =>
  [operatorKeyOf(check.operatorName), check.ownerNumber.trim(), normalizeLabel(check.ownerName)].join("|");

/** A property without an Operator CC is keyed by its description, so blank-CC properties from one
 * operator each get their own well. */
export const propertyKeyOf = (
  operatorName: string,
  line: Pick<RevenueLineInput, "operatorCc" | "propertyDescription">,
) => `${operatorKeyOf(operatorName)}|${propertyKey(line)}`;

export const labelKeyOf = (kind: TaxDeductKind, label: string) => `${kind}:${normalizeLabel(label)}`;

const addOnce = <T extends { key: string }>(map: Map<string, T>, item: T) => {
  if (!map.has(item.key)) map.set(item.key, item);
};

export const collectImportItems = (checks: CheckDetailCheck[]): ImportItems => {
  const operators = new Map<string, FileOperator>();
  const owners = new Map<string, FileOwner>();
  const properties = new Map<string, FileProperty>();
  const products = new Set<string>();
  const labels = new Map<string, FileLabel>();

  for (const check of checks) {
    const operatorKey = operatorKeyOf(check.operatorName);
    addOnce(operators, { key: operatorKey, name: check.operatorName });
    addOnce(owners, { key: ownerKeyOf(check), operatorKey, name: check.ownerName, number: check.ownerNumber.trim() });
    for (const line of check.lines) {
      const key = propertyKeyOf(check.operatorName, line);
      const existing = properties.get(key);
      if (!existing) {
        properties.set(key, {
          key,
          operatorKey,
          operatorCc: line.operatorCc.trim(),
          description: line.propertyDescription.trim(),
        });
      } else if (!existing.description && line.propertyDescription.trim()) {
        existing.description = line.propertyDescription.trim();
      }
      if (line.productCode.trim()) products.add(line.productCode.trim().toUpperCase());
      for (const entry of line.taxes) addOnce(labels, { key: labelKeyOf("tax", entry.label), kind: "tax", label: entry.label });
      for (const entry of line.deducts) {
        addOnce(labels, { key: labelKeyOf("deduct", entry.label), kind: "deduct", label: entry.label });
      }
    }
  }

  return {
    operators: Array.from(operators.values()),
    owners: Array.from(owners.values()),
    properties: Array.from(properties.values()),
    products: Array.from(products).sort(),
    labels: Array.from(labels.values()).sort(
      (a, b) => Number(a.kind === "deduct") - Number(b.kind === "deduct") || a.label.localeCompare(b.label),
    ),
  };
};

// ── Contacts by name ─────────────────────────────────────────────────────────

const ENTITY_SUFFIXES = new Set([
  "CO",
  "COMPANY",
  "INC",
  "INCORPORATED",
  "LLC",
  "LLP",
  "LP",
  "LTD",
  "CORP",
  "CORPORATION",
  "PLLC",
]);

/** "SMITH OPERATING CO", "Smith Operating Company" and "Smith Operating, Co." read the same, and
 * so do "DOE JOHN" and "John Doe" (tokens are sorted). */
export const contactNameKey = (name: string): string => {
  const tokens = name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length > 1 && ENTITY_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  if (tokens.length > 1 && tokens[0] === "THE") tokens.shift();
  return tokens.sort().join(" ");
};

export interface NameMatch {
  contact: ContactOption | null;
  /** How many contacts share the name; more than one active means it's left for the user. */
  candidates: number;
  /** The only contact with this name is inactive, so it isn't matched automatically. */
  inactiveOnly: boolean;
}

export const matchContactByName = (options: ContactOption[], name: string): NameMatch => {
  const key = contactNameKey(name);
  if (!key) return { contact: null, candidates: 0, inactiveOnly: false };
  const same = options.filter((option) => contactNameKey(option.name) === key);
  const active = same.filter((option) => option.isActive);
  return {
    contact: active.length === 1 ? active[0] : null,
    candidates: same.length,
    inactiveOnly: active.length === 0 && same.length === 1,
  };
};

// ── Wells by name ────────────────────────────────────────────────────────────

const wordTokens = (text: string) =>
  text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const hasDigit = (token: string) => /\d/.test(token);

/** 0–1. Tokens with a digit ("1H", "14") must agree exactly, so Smith Unit 1H never suggests 2H. */
const nameSimilarity = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0;
  const numbersA = a.filter(hasDigit).sort().join(" ");
  const numbersB = b.filter(hasDigit).sort().join(" ");
  if (numbersA !== numbersB) return 0;
  const setB = new Set(b);
  const shared = new Set(a.filter((token) => setB.has(token))).size;
  return (2 * shared) / (new Set(a).size + setB.size);
};

const SUGGESTION_THRESHOLD = 0.6;

export const suggestWell = (wells: WellOption[], description: string): WellOption | null => {
  const wanted = wordTokens(description);
  if (!wanted.length) return null;
  let best: WellOption | null = null;
  let bestScore = 0;
  let tied = false;
  for (const well of wells) {
    const names = [well.label, well.name, `${well.leaseName} ${well.wellNumber}`].filter((n) => n.trim());
    const score = Math.max(0, ...names.map((name) => nameSimilarity(wanted, wordTokens(name))));
    if (score < SUGGESTION_THRESHOLD) continue;
    if (score > bestScore + 1e-9) {
      best = well;
      bestScore = score;
      tied = false;
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      tied = true;
    }
  }
  return tied ? null : best;
};

// ── Accounts ─────────────────────────────────────────────────────────────────

const LABEL_ACCOUNT_RULES: [words: string[], accountNumber: number][] = [
  [["SEVER", "PRODUCTION"], 5000],
  [["REGULATORY", "ENVIRONMENTAL", "FUEL USE"], 5020],
  [["GATHER", "COMPRESS", "METER"], 5100],
  [["TRANSP"], 5120],
  [["PROCESS", "TREAT", "FRACTION", "FUEL"], 5130],
  [["REIMBURSE", "INTEREST"], 4100],
];

const FALLBACK_LABEL_ACCOUNT: Record<TaxDeductKind, number> = { tax: 5020, deduct: 5140 };

/** The account number to suggest for a label. First rule whose word appears in the label wins, so
 * FUEL USE is checked before FUEL. A label with none of the words falls back to OTHER TAXES or the
 * other-deductions account. */
export const suggestAccountNumberForLabel = (label: string, kind: TaxDeductKind): number => {
  const text = normalizeLabel(label);
  return LABEL_ACCOUNT_RULES.find(([words]) => words.some((word) => text.includes(word)))?.[1] ?? FALLBACK_LABEL_ACCOUNT[kind];
};

export const isStandardProduct = (code: string) => incomeAccountNumberForProduct(code) !== OTHER_INCOME_ACCOUNT_NUMBER;

// ── Choices and what they resolve to ─────────────────────────────────────────

/** A well, "later" to import the property unlinked, or "none" to clear a remembered well. */
export type WellChoice = RememberedWell | "later" | "none";

export interface ImportChoices {
  /** Operator key → contact id. */
  operators: Record<string, string>;
  /** Owner key → contact id. */
  owners: Record<string, string>;
  /** Property key → the choice made for it. */
  wells: Record<string, WellChoice>;
  /** Label key → account id. */
  accounts: Record<string, string>;
}

export const EMPTY_CHOICES: ImportChoices = { operators: {}, owners: {}, wells: {}, accounts: {} };

export type ContactMatchSource = "remembered" | "ownerNumber" | "name" | "chosen";

export interface ResolvedOperator extends FileOperator {
  contactId: string | null;
  contactName: string | null;
  source: ContactMatchSource | null;
  candidates: number;
  inactiveOnly: boolean;
}

export interface ResolvedOwner extends FileOwner {
  operatorName: string;
  contactId: string | null;
  contactName: string | null;
  source: ContactMatchSource | null;
  candidates: number;
  inactiveOnly: boolean;
}

export interface ResolvedProperty extends FileProperty {
  operatorName: string;
  well: RememberedWell | null;
  later: boolean;
  source: "remembered" | "chosen" | null;
  suggestion: WellOption | null;
}

export interface ResolvedProduct {
  code: string;
  /** null if the company's chart of accounts has no account for this product. */
  accountId: string | null;
  standard: boolean;
}

export interface ResolvedLabel extends FileLabel {
  type: TaxDeductType | undefined;
  accountId: string | null;
  source: "saved" | "chosen" | null;
  /** null if the company's chart of accounts has no account with the suggested number. */
  suggestionId: string | null;
}

export interface ImportResolution {
  operators: ResolvedOperator[];
  owners: ResolvedOwner[];
  properties: ResolvedProperty[];
  products: ResolvedProduct[];
  labels: ResolvedLabel[];
  /** Operators, owners and labels without a match, plus properties with neither a well nor "link later". */
  needsMatch: number;
}

export const countNeedsMatch = (r: Omit<ImportResolution, "needsMatch">) =>
  r.operators.filter((o) => !o.contactId).length +
  r.owners.filter((o) => !o.contactId).length +
  r.properties.filter((p) => !p.well && !p.later).length +
  r.labels.filter((l) => !l.accountId).length;

/** The types list as it will be once the import saves: chosen accounts filled in, new labels added. */
export const projectTypes = (types: TaxDeductType[], labels: ResolvedLabel[]): TaxDeductType[] => {
  const chosen = new Map(labels.filter((l) => l.type && l.accountId).map((l) => [l.type!.id, l.accountId!]));
  return [
    ...types.map((t) => (!t.accountId && chosen.has(t.id) ? { ...t, accountId: chosen.get(t.id)! } : t)),
    ...labels
      .filter((l) => !l.type)
      .map((l) => ({
        id: `pending-${l.key}`,
        label: normalizeLabel(l.label),
        kind: l.kind,
        accountId: l.accountId,
        lineCount: 0,
        lastSeen: null,
        operators: [],
        isNew: true,
      })),
  ];
};

// ── Drafts ───────────────────────────────────────────────────────────────────

export const buildDraft = (
  check: CheckDetailCheck,
  resolution: Pick<ImportResolution, "operators" | "owners" | "properties">,
): RevenueCheckInput => {
  const operatorKey = operatorKeyOf(check.operatorName);
  const operator = resolution.operators.find((o) => o.key === operatorKey);
  const owner = resolution.owners.find((o) => o.key === ownerKeyOf(check));
  const wells = new Map(resolution.properties.map((p) => [p.key, p.well]));
  return {
    // The contact's own name, so checks from one operator or owner read the same in the list
    // whichever way their stubs spell it.
    operatorName: operator?.contactName || check.operatorName,
    operatorId: operator?.contactId ?? null,
    ownerName: owner?.contactName || check.ownerName,
    ownerId: owner?.contactId ?? null,
    ownerNumber: check.ownerNumber,
    checkNumber: check.checkNumber,
    checkDate: check.checkDate,
    checkAmount: check.checkAmount,
    stubFileName: null,
    lines: check.lines.map((line) => {
      const well = wells.get(propertyKeyOf(check.operatorName, line)) ?? null;
      return { ...line, wellId: well?.wellId ?? null, wellLabel: well?.wellLabel ?? null };
    }),
  };
};

// ── Display ──────────────────────────────────────────────────────────────────

/** [9, 10, 11, 14] → "9–11, 14" */
export const formatRowRanges = (rows: number[]): string => {
  const sorted = Array.from(new Set(rows)).sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (sorted[i + 1] === sorted[i] + 1) i++;
    parts.push(start === sorted[i] ? String(start) : `${start}–${sorted[i]}`);
  }
  return parts.join(", ");
};

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
