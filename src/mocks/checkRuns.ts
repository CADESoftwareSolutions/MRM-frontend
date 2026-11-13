import { addDaysIso, todayIso } from "@/types/apInvoices";
import type { BankAccount, CheckRun } from "@/types/checkRuns";

const today = todayIso();
const stamp = (days: number, time: string) => `${addDaysIso(today, days)}T${time}:00.000Z`;

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "bank-operating",
    name: "Operating",
    last4: "4471",
    glAccountId: "coa-1000",
    bankName: "First Basin Bank",
    bankCityState: "Midland, TX",
    lastCheckNumber: 10451,
  },
  {
    id: "bank-disbursement",
    name: "Disbursement",
    last4: "8820",
    glAccountId: "coa-1000",
    bankName: "First Basin Bank",
    bankCityState: "Midland, TX",
    lastCheckNumber: 5120,
  },
];

/** Matches the three invoices the A/P mocks already show as scheduled in run-2026-11-14. */
export const MOCK_CHECK_RUNS: CheckRun[] = [
  {
    id: "run-2026-11-14",
    status: "awaiting_approval",
    bankAccountId: "bank-operating",
    checkDate: addDaysIso(today, 3),
    startingCheckNumber: 10452,
    items: [
      { invoiceId: "ap-inv-0004", amount: 12480 },
      { invoiceId: "ap-inv-0003", amount: 6160 },
      { invoiceId: "ap-inv-0006", amount: 4210 },
    ],
    checks: [
      {
        checkNumber: "10452",
        vendorId: "mock-vendor-pbws",
        vendorName: "Permian Basin Water Services LLC",
        pay: "Check per entry",
        items: [{ invoiceId: "ap-inv-0004", amount: 12480 }],
        amount: 12480,
      },
      {
        checkNumber: "10453",
        vendorId: "mock-vendor-pbws",
        vendorName: "Permian Basin Water Services LLC",
        pay: "Check per entry",
        items: [{ invoiceId: "ap-inv-0003", amount: 6160 }],
        amount: 6160,
      },
      {
        checkNumber: "10454",
        vendorId: "mock-vendor-lsw",
        vendorName: "Lone Star Wireline Inc.",
        pay: "Yes",
        items: [{ invoiceId: "ap-inv-0006", amount: 4210 }],
        amount: 4210,
      },
    ],
    total: 22850,
    submittedBy: "aclark",
    submittedAt: stamp(-1, "15:05"),
    approvedBy: null,
    approvedAt: null,
    rejectedReason: null,
    rejectedBy: null,
    rejectedAt: null,
    printedBy: null,
    printedAt: null,
    printCount: 0,
    postedBy: null,
    postedAt: null,
    paymentIds: [],
    voidedBy: null,
    voidedAt: null,
    createdBy: "aclark",
    createdAt: stamp(-1, "14:58"),
    updatedBy: "aclark",
    updatedAt: stamp(-1, "15:05"),
  },
];
