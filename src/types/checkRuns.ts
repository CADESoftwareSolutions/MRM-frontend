import type { VendorPay } from "./apInvoices";

export type CheckRunStatus = "draft" | "awaiting_approval" | "approved" | "posted" | "void";

export const CHECK_RUN_STATUS_LABELS: Record<CheckRunStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  posted: "Posted",
  void: "Void",
};

/** Started but not yet posted: the runs a user can come back to. */
export const PENDING_CHECK_RUN_STATUSES: CheckRunStatus[] = ["draft", "awaiting_approval", "approved"];

export const CHECK_STOCK_LABEL = "8½ × 11, check on top";

export interface BankAccount {
  id: string;
  /** "Operating" */
  name: string;
  last4: string;
  /** The cash account in the chart of accounts these checks post against. */
  glAccountId: string;
  bankName: string;
  bankCityState: string;
  /** Highest check number used on this account before any check run here; seeds the next number. */
  lastCheckNumber: number;
}

/** "Operating · ••4471" */
export const formatBankAccountLabel = (bank: Pick<BankAccount, "name" | "last4">): string =>
  `${bank.name} · ••${bank.last4}`;

export interface CheckRunItem {
  invoiceId: string;
  amount: number;
}

export interface CheckRunCheck {
  /** Empty on a draft: numbers are assigned when the run is submitted. */
  checkNumber: string;
  vendorId: string;
  vendorName: string;
  /** The vendor's Pay setting when the run was planned. */
  pay: VendorPay;
  items: CheckRunItem[];
  amount: number;
}

export interface CheckRunInput {
  bankAccountId: string;
  checkDate: string;
  startingCheckNumber: number;
  /** Invoices in check order: by vendor, then the order they were listed in. */
  items: CheckRunItem[];
}

export interface CheckRun extends CheckRunInput {
  id: string;
  status: CheckRunStatus;
  /** Planned when the run is saved or submitted, so approvers sign off on exactly what prints. */
  checks: CheckRunCheck[];
  total: number;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  printedBy: string | null;
  printedAt: string | null;
  printCount: number;
  postedBy: string | null;
  postedAt: string | null;
  paymentIds: string[];
  voidedBy: string | null;
  voidedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** "#10452–10455", "#10452", or "" with no checks or no numbers assigned yet (drafts). */
export const formatCheckRange = (checks: Pick<CheckRunCheck, "checkNumber">[]): string => {
  if (!checks.length || !checks[0].checkNumber) return "";
  const first = checks[0].checkNumber;
  const last = checks[checks.length - 1].checkNumber;
  return first === last ? `#${first}` : `#${first}–${last}`;
};
