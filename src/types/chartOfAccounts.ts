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
  /** The backend's chart_of_account id, as a string. */
  id: string;
  account: number;
  sub: number | null;
  description: string;
  category: AccountCategory;
  isDefault: boolean;
  isActive: boolean;
  transactionCount: number;
  /** null for the accounts the backend seeds for every company. */
  createdById: number | null;
  createdAt: string;
  updatedById: number | null;
  updatedAt: string;
}

/** The accounts the backend seeds for every company (its accounting foundation migration). It has
 * no default flag yet, so these numbers stand in for one. */
export const DEFAULT_ACCOUNT_NUMBERS: ReadonlySet<number> = new Set([
  1000, 1450, 1470, 1480, 2000, 4000, 4010, 4020, 4100, 5000, 5010, 5020, 5100, 5120, 5130, 5140, 6000,
]);

export interface ChartAccountInput {
  account: number;
  sub: number | null;
  description: string;
  category: AccountCategory;
}

export type ChartAccountPatch = Partial<ChartAccountInput>;

export type AccountNumberParts = Pick<ChartAccount, "account" | "sub">;

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

/** Account ids differ per company, so fixed rules (oil income is 4000) find the account by number. */
export const findAccountByNumber = <A extends AccountNumberParts>(
  accounts: readonly A[] | undefined,
  account: number,
  sub: number | null = null,
): A | undefined => accounts?.find((a) => isSameAccountNumber(a, { account, sub }));

/** Who created or last changed an account. The backend returns user ids only, so other users show
 * by id until it can return names. */
export const auditUserName = (
  userId: number | null,
  currentUser: { id: number | string; username: string } | null | undefined,
): string => {
  if (userId == null) return "System";
  if (currentUser && String(currentUser.id) === String(userId)) return currentUser.username;
  return `User #${userId}`;
};
