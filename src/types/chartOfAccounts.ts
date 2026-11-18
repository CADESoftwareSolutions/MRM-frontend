export const ACCOUNT_CATEGORIES = [
  "CASH",
  "CAPITAL",
  "LIABILITY",
  "INCOME",
  "TAXES",
  "DEDUCTIONS",
  "EXPENSES",
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  CASH: "Cash",
  CAPITAL: "Capital",
  LIABILITY: "Liability",
  INCOME: "Income",
  TAXES: "Taxes",
  DEDUCTIONS: "Deductions",
  EXPENSES: "Expenses",
};

export interface ChartAccount {
  id: string;
  account: number;
  sub: number | null;
  description: string;
  category: AccountCategory;
  isDefault: boolean;
  isActive: boolean;
  transactionCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ChartAccountInput {
  account: number;
  sub: number | null;
  description: string;
  category: AccountCategory;
}

export type ChartAccountPatch = Partial<ChartAccountInput>;

type AccountNumberParts = Pick<ChartAccount, "account" | "sub">;

/** "6000-110", or "6000" when there's no sub. */
export const formatAccountNumber = (a: AccountNumberParts): string =>
  a.sub == null ? String(a.account) : `${a.account}-${a.sub}`;

/** "6000-110 · WATER DISPOSAL" */
export const formatAccountLabel = (a: AccountNumberParts & Pick<ChartAccount, "description">): string =>
  `${formatAccountNumber(a)} · ${a.description}`;

export const compareAccounts = (a: AccountNumberParts, b: AccountNumberParts): number =>
  a.account - b.account || (a.sub ?? 0) - (b.sub ?? 0);

export const isSameAccountNumber = (a: AccountNumberParts, b: AccountNumberParts): boolean =>
  a.account === b.account && (a.sub ?? null) === (b.sub ?? null);
