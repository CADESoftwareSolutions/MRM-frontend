import { AccountCategory } from "@/types/chartOfAccounts";
import { TaxDeductKind, TaxDeductType, isTypeMapped } from "@/types/revenue";

type AccountStatus = { id: string; isActive: boolean };

export type TypeFilter = "ALL" | "UNMAPPED" | "TAX" | "DEDUCT";

export const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "UNMAPPED", label: "Needs an account" },
  { id: "TAX", label: "Taxes" },
  { id: "DEDUCT", label: "Deducts" },
];

export const KIND_LABEL: Record<TaxDeductKind, string> = { tax: "Tax", deduct: "Deduct" };

export const SUGGESTED_CATEGORY: Record<TaxDeductKind, AccountCategory> = {
  tax: "TAXES",
  deduct: "DEDUCTIONS",
};

/** The picker suggests the kind's own category, but opens up to every category when asked to or
 * when the label already points outside it (e.g. a reimbursement mapped to OTHER INCOME). */
export const pickerCategories = (
  kind: TaxDeductKind,
  showAll: boolean,
  currentCategory?: AccountCategory,
): AccountCategory[] | undefined => {
  const suggested = SUGGESTED_CATEGORY[kind];
  if (showAll || (currentCategory && currentCategory !== suggested)) return undefined;
  return [suggested];
};

export const matchesFilter = (type: TaxDeductType, filter: TypeFilter, accounts?: AccountStatus[]): boolean =>
  filter === "ALL" ||
  (filter === "UNMAPPED" && !isTypeMapped(type, accounts)) ||
  (filter === "TAX" && type.kind === "tax") ||
  (filter === "DEDUCT" && type.kind === "deduct");

const KIND_ORDER: Record<TaxDeductKind, number> = { tax: 0, deduct: 1 };

/** Unmapped first, then taxes before deducts, then label. */
export const compareTypes = (a: TaxDeductType, b: TaxDeductType, accounts?: AccountStatus[]): number =>
  Number(isTypeMapped(a, accounts)) - Number(isTypeMapped(b, accounts)) ||
  KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
  a.label.localeCompare(b.label);

/** "Smith Operating Co +2" */
export const seenFromLabel = (operators: string[]): string =>
  operators.length > 1 ? `${operators[0]} +${operators.length - 1}` : (operators[0] ?? "");

export const labelCount = (n: number): string => `${n} ${n === 1 ? "label" : "labels"}`;
