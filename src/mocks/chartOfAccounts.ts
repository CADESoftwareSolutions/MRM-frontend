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

export const MOCK_CHART_OF_ACCOUNTS: ChartAccount[] = [
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
