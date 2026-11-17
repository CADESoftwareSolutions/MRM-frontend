import type { AccountCategory, ChartAccount } from "@/types/chartOfAccounts";

const SYSTEM_CREATED_AT = "2026-01-01T12:00:00.000Z";

const defaultAccount = (
  account: number,
  description: string,
  category: AccountCategory,
  transactionCount: number,
): ChartAccount => ({
  id: `coa-${account}`,
  account,
  sub: null,
  description,
  category,
  isDefault: true,
  isActive: true,
  transactionCount,
  createdBy: "system",
  createdAt: SYSTEM_CREATED_AT,
  updatedBy: "system",
  updatedAt: SYSTEM_CREATED_AT,
});

const customAccount = (
  account: number,
  sub: number | null,
  description: string,
  category: AccountCategory,
  transactionCount: number,
  created: [by: string, at: string],
  updated: [by: string, at: string] = created,
): ChartAccount => ({
  id: sub == null ? `coa-${account}` : `coa-${account}-${sub}`,
  account,
  sub,
  description,
  category,
  isDefault: false,
  isActive: true,
  transactionCount,
  createdBy: created[0],
  createdAt: created[1],
  updatedBy: updated[0],
  updatedAt: updated[1],
});

export const DEFAULT_CHART_ACCOUNTS: ChartAccount[] = [
  defaultAccount(1000, "CASH", "CASH", 1204),
  defaultAccount(1450, "DRILLING", "CAPITAL", 86),
  defaultAccount(1470, "COMPLETION", "CAPITAL", 41),
  defaultAccount(1480, "FACILITIES", "CAPITAL", 19),
  defaultAccount(2000, "PAYABLE", "LIABILITY", 512),
  defaultAccount(4000, "OIL INCOME", "INCOME", 2318),
  defaultAccount(4010, "GAS INCOME", "INCOME", 2296),
  defaultAccount(4020, "NGL INCOME", "INCOME", 1104),
  defaultAccount(4100, "OTHER INCOME", "INCOME", 37),
  defaultAccount(5000, "PRODUCTION TAX", "TAXES", 2290),
  defaultAccount(5010, "AD VALOREM TAX", "TAXES", 48),
  defaultAccount(5020, "OTHER TAXES", "TAXES", 6),
  defaultAccount(5100, "GATHERING", "DEDUCTIONS", 1877),
  defaultAccount(5120, "TRANSPORTATION", "DEDUCTIONS", 1650),
  defaultAccount(5130, "PROCESSING", "DEDUCTIONS", 1102),
  defaultAccount(5140, "OTHER REVENUE DEDUCTS", "DEDUCTIONS", 214),
  defaultAccount(6000, "LEASE OPERATING EXPENSE", "EXPENSES", 431),
];

export const MOCK_CHART_OF_ACCOUNTS: ChartAccount[] = [
  ...DEFAULT_CHART_ACCOUNTS,
  customAccount(900, 137, "DAVID TAX", "TAXES", 4, ["jmelnick", "2026-03-02T15:20:00.000Z"]),
  customAccount(1470, 120, "COMPLETION WATER HANDLING", "CAPITAL", 12, ["aclark", "2026-05-14T16:05:00.000Z"]),
  customAccount(2300, null, "AMANDA PROCESSING", "DEDUCTIONS", 0, ["aclark", "2026-11-02T18:40:00.000Z"]),
  customAccount(
    5250,
    210,
    "ALLISON DRILLING",
    "CAPITAL",
    14,
    ["jmelnick", "2026-04-09T14:10:00.000Z"],
    ["aclark", "2026-09-30T19:25:00.000Z"],
  ),
  customAccount(6000, 110, "WATER DISPOSAL", "EXPENSES", 38, ["aclark", "2026-01-12T17:45:00.000Z"]),
];
