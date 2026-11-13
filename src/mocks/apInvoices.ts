import { addDaysIso, todayIso } from "@/types/apInvoices";
import type {
  ApInvoice,
  ApInvoiceLine,
  ApInvoiceStatus,
  ApPayment,
  ApVendor,
  VendorDefaults,
} from "@/types/apInvoices";

// The seed was drawn on 2026-11-11; every date is stored as an offset from that day so the aging
// tiles and due flags read the same whenever the app runs.
const daysAgo = (n: number) => addDaysIso(todayIso(), -n);

const stamp = (n: number, time: string) => `${daysAgo(n)}T${time}:00.000Z`;

const monthsAgo = (n: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const MOCK_AP_VENDORS: ApVendor[] = [
  {
    id: "mock-vendor-pbws",
    name: "Permian Basin Water Services LLC",
    nameId: "V-PBWS",
    remitTo: ["PO Box 2290", "Pecos, TX 79772"],
  },
  {
    id: "mock-vendor-lsw",
    name: "Lone Star Wireline Inc.",
    nameId: "V-LSW",
    remitTo: ["PO Box 61840", "Midland, TX 79711"],
  },
  {
    id: "mock-vendor-cfs",
    name: "Comanche Field Services",
    nameId: "V-CFS",
    remitTo: ["1418 N County Rd W", "Odessa, TX 79763"],
  },
  {
    id: "mock-vendor-pvec",
    name: "Pecos Valley Electric Co-op",
    nameId: "V-PVEC",
    remitTo: ["PO Box 1328", "Fort Stockton, TX 79735"],
  },
  {
    id: "mock-vendor-rrr",
    name: "Red Rock Roustabout LLC",
    nameId: "V-RRR",
    remitTo: ["PO Box 908", "Monahans, TX 79756"],
  },
];

const vendor = (id: string): ApVendor => MOCK_AP_VENDORS.find((v) => v.id === id)!;

const WHITFIELD = "W-0142 Whitfield 1H";
const HAYES = "W-0157 Hayes Unit 2H";

const line = (
  id: string,
  accountId: string,
  wellLabel: string,
  description: string,
  amount: number,
  extra: Partial<ApInvoiceLine> = {},
): ApInvoiceLine => ({
  id,
  accountId,
  wellId: null,
  wellLabel,
  afe: null,
  stage: null,
  deck: wellLabel === WHITFIELD ? "JIB 0142-A" : wellLabel === HAYES ? "JIB 0157-A" : null,
  projectId: null,
  projectLabel: "",
  description,
  amount,
  ...extra,
});

const REEVES = { projectLabel: "ACQ-Reeves-25" };
const HAYES_COMPLETION = { afe: "AFE-26-014", stage: "Completion", ...REEVES };

interface MockInvoiceSeed {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  dueDate: string;
  glPeriod: string;
  status: ApInvoiceStatus;
  lines: ApInvoiceLine[];
  journalId?: string | null;
  serviceDate?: string | null;
  stubDescription?: string;
  documentName?: string | null;
  attachmentNames?: string[];
  balance?: number;
  scheduledRunId?: string | null;
  scheduledPayDate?: string | null;
  paidCheckNumber?: string | null;
  duplicateReview?: ApInvoice["duplicateReview"];
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

const VENDOR_1099: Record<string, { type1099: string | null; box1099: string | null }> = {
  "mock-vendor-pbws": { type1099: "1099-NEC", box1099: "Nonemployee Comp." },
  "mock-vendor-cfs": { type1099: "1099-NEC", box1099: "Nonemployee Comp." },
  "mock-vendor-rrr": { type1099: "1099-NEC", box1099: "Nonemployee Comp." },
};

const invoice = (seed: MockInvoiceSeed): ApInvoice => {
  const v = vendor(seed.vendorId);
  const paid = seed.status === "paid";
  const voided = seed.status === "void";
  return {
    id: seed.id,
    journalId: seed.journalId ?? null,
    vendorId: v.id,
    vendorName: v.name,
    vendorNameId: v.nameId,
    remitTo: v.remitTo,
    apAccountId: "coa-2000",
    invoiceNumber: seed.invoiceNumber,
    invoiceAmount: seed.invoiceAmount,
    invoiceDate: seed.invoiceDate,
    dueDate: seed.dueDate,
    glPeriod: seed.glPeriod,
    serviceDate: seed.serviceDate ?? null,
    type1099: VENDOR_1099[v.id]?.type1099 ?? null,
    box1099: VENDOR_1099[v.id]?.box1099 ?? null,
    stubDescription: seed.stubDescription ?? "",
    lines: seed.lines,
    status: seed.status,
    balance: seed.balance ?? (paid || voided ? 0 : seed.invoiceAmount),
    documentName: seed.documentName ?? null,
    attachmentNames: seed.attachmentNames ?? [],
    scheduledRunId: seed.scheduledRunId ?? null,
    scheduledPayDate: seed.scheduledPayDate ?? null,
    paidCheckNumber: seed.paidCheckNumber ?? null,
    duplicateReview: seed.duplicateReview ?? null,
    approvedBy: seed.approvedBy ?? null,
    approvedAt: seed.approvedAt ?? null,
    rejectedReason: seed.rejectedReason ?? null,
    createdBy: seed.createdBy ?? "aclark",
    createdAt: seed.createdAt,
    updatedBy: seed.createdBy ?? "aclark",
    updatedAt: seed.updatedAt ?? seed.createdAt,
  };
};

const PBWS_OCT_LINES = (prefix: string): ApInvoiceLine[] => [
  line(`${prefix}-1`, "coa-6000-110", WHITFIELD, "Oct SWD 1,840 bbl @ $4.00", 7360, REEVES),
  line(`${prefix}-2`, "coa-1470-120", HAYES, "Flowback disposal 1,280 bbl @ $4.00", 5120, HAYES_COMPLETION),
];

const RUN_1114 = { scheduledRunId: "run-2026-11-14", scheduledPayDate: daysAgo(-3) };

export const MOCK_AP_INVOICES: ApInvoice[] = [
  invoice({
    id: "ap-inv-0001",
    vendorId: "mock-vendor-pbws",
    invoiceNumber: "87702",
    invoiceAmount: 11240,
    invoiceDate: daysAgo(75),
    dueDate: daysAgo(45),
    glPeriod: monthsAgo(3),
    serviceDate: daysAgo(72),
    status: "paid",
    journalId: "JE-26-04201",
    paidCheckNumber: "10418",
    stubDescription: "Aug SWD: Whitfield 1H",
    lines: [line("ap-line-0001-1", "coa-6000-110", WHITFIELD, "Aug SWD 2,810 bbl @ $4.00", 11240, REEVES)],
    documentName: "PBWS_87702.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(70, "15:20"),
    createdAt: stamp(71, "16:05"),
  }),
  invoice({
    id: "ap-inv-0002",
    vendorId: "mock-vendor-pbws",
    invoiceNumber: "87940",
    invoiceAmount: 9880,
    invoiceDate: daysAgo(46),
    dueDate: daysAgo(16),
    glPeriod: monthsAgo(2),
    serviceDate: daysAgo(42),
    status: "paid",
    journalId: "JE-26-04288",
    paidCheckNumber: "10441",
    stubDescription: "Sep SWD: Whitfield 1H and Hayes Unit 2H",
    lines: [
      line("ap-line-0002-1", "coa-6000-110", WHITFIELD, "Sep SWD 1,620 bbl @ $4.00", 6480, REEVES),
      line("ap-line-0002-2", "coa-6000-110", HAYES, "Sep SWD 850 bbl @ $4.00", 3400, REEVES),
    ],
    documentName: "PBWS_87940.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(41, "14:10"),
    createdAt: stamp(42, "17:45"),
  }),
  invoice({
    id: "ap-inv-0003",
    vendorId: "mock-vendor-pbws",
    invoiceNumber: "88177",
    invoiceAmount: 6160,
    invoiceDate: daysAgo(28),
    dueDate: daysAgo(-2),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(28),
    status: "scheduled",
    journalId: "JE-26-04398",
    ...RUN_1114,
    stubDescription: "Oct 1–14 SWD: Whitfield 1H",
    lines: [line("ap-line-0003-1", "coa-6000-110", WHITFIELD, "Oct 1–14 SWD 1,540 bbl @ $4.00", 6160, REEVES)],
    documentName: "PBWS_88177.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(26, "15:00"),
    createdAt: stamp(27, "13:30"),
  }),
  invoice({
    id: "ap-inv-0004",
    vendorId: "mock-vendor-pbws",
    invoiceNumber: "88213",
    invoiceAmount: 12480,
    invoiceDate: daysAgo(14),
    dueDate: daysAgo(-16),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(11),
    status: "scheduled",
    journalId: "JE-26-04412",
    ...RUN_1114,
    stubDescription: "Oct SWD: Whitfield 1H and Hayes Unit 2H",
    lines: PBWS_OCT_LINES("ap-line-0004"),
    documentName: "PBWS_88213_inv.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(12, "16:40"),
    createdAt: stamp(13, "14:15"),
  }),
  invoice({
    id: "ap-inv-0005",
    vendorId: "mock-vendor-pbws",
    invoiceNumber: "88213",
    invoiceAmount: 12480,
    invoiceDate: daysAgo(7),
    dueDate: daysAgo(-23),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(11),
    status: "needs_review",
    stubDescription: "Oct SWD: Whitfield 1H and Hayes Unit 2H",
    lines: PBWS_OCT_LINES("ap-line-0005"),
    documentName: "PBWS_88213.pdf",
    createdAt: stamp(0, "15:05"),
  }),
  invoice({
    id: "ap-inv-0006",
    vendorId: "mock-vendor-lsw",
    invoiceNumber: "LSW-5498",
    invoiceAmount: 4210,
    invoiceDate: daysAgo(22),
    dueDate: daysAgo(-8),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(25),
    status: "scheduled",
    journalId: "JE-26-04405",
    ...RUN_1114,
    stubDescription: "Hayes Unit 2H: cement bond log",
    lines: [
      line("ap-line-0006-1", "coa-1470", HAYES, "Cased-hole wireline: cement bond log", 4210, HAYES_COMPLETION),
    ],
    documentName: "LSW-5498.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(20, "18:05"),
    createdAt: stamp(21, "14:50"),
  }),
  invoice({
    id: "ap-inv-0007",
    vendorId: "mock-vendor-lsw",
    invoiceNumber: "LSW-5498",
    invoiceAmount: 4210,
    invoiceDate: daysAgo(22),
    dueDate: daysAgo(-8),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(25),
    status: "void",
    stubDescription: "Hayes Unit 2H: cement bond log",
    lines: [
      line("ap-line-0007-1", "coa-1470", HAYES, "Cased-hole wireline: cement bond log", 4210, HAYES_COMPLETION),
    ],
    documentName: "LSW-5498 (1).pdf",
    duplicateReview: {
      decision: "discarded",
      reason: "Vendor emailed the same invoice twice",
      clearedMatchIds: [],
      by: "aclark",
      at: stamp(21, "15:12"),
    },
    createdAt: stamp(21, "15:08"),
    updatedAt: stamp(21, "15:12"),
  }),
  invoice({
    id: "ap-inv-0008",
    vendorId: "mock-vendor-lsw",
    invoiceNumber: "LSW-5521",
    invoiceAmount: 8915.25,
    invoiceDate: daysAgo(8),
    dueDate: daysAgo(-22),
    glPeriod: monthsAgo(0),
    serviceDate: daysAgo(10),
    status: "awaiting_approval",
    stubDescription: "Hayes Unit 2H: plug & perf, stages 15–18",
    lines: [
      line("ap-line-0008-1", "coa-1470", HAYES, "Plug & perf, stages 15–18", 7640.25, HAYES_COMPLETION),
      line("ap-line-0008-2", "coa-1470", HAYES, "Wireline truck & crew standby, 9 hrs", 1275, HAYES_COMPLETION),
    ],
    createdAt: stamp(6, "19:25"),
  }),
  invoice({
    id: "ap-inv-0009",
    vendorId: "mock-vendor-cfs",
    invoiceNumber: "CFS-1141",
    invoiceAmount: 1982.5,
    invoiceDate: daysAgo(103),
    dueDate: daysAgo(73),
    glPeriod: monthsAgo(4),
    serviceDate: daysAgo(103),
    status: "approved",
    journalId: "JE-26-04122",
    stubDescription: "Jul pumper services",
    lines: [line("ap-line-0009-1", "coa-6000", WHITFIELD, "Jul pumper services", 1982.5)],
    documentName: "CFS-1141.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(98, "15:00"),
    createdAt: stamp(99, "15:30"),
  }),
  invoice({
    id: "ap-inv-0010",
    vendorId: "mock-vendor-cfs",
    invoiceNumber: "CFS-1172",
    invoiceAmount: 2300,
    invoiceDate: daysAgo(42),
    dueDate: daysAgo(12),
    glPeriod: monthsAgo(2),
    serviceDate: daysAgo(42),
    status: "approved",
    journalId: "JE-26-04371",
    stubDescription: "Sep pumper services",
    lines: [line("ap-line-0010-1", "coa-6000", WHITFIELD, "Sep pumper services", 2300)],
    documentName: "CFS-1172.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(35, "16:20"),
    createdAt: stamp(36, "14:00"),
  }),
  invoice({
    id: "ap-inv-0011",
    vendorId: "mock-vendor-cfs",
    invoiceNumber: "CFS-1180",
    invoiceAmount: 1145.5,
    invoiceDate: daysAgo(24),
    dueDate: daysAgo(-6),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(26),
    status: "approved",
    journalId: "JE-26-04402",
    stubDescription: "Hayes Unit 2H: hot-oil treatment",
    lines: [line("ap-line-0011-1", "coa-6000", HAYES, "Wellsite hot-oil treatment", 1145.5)],
    documentName: "CFS-1180.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(21, "13:45"),
    createdAt: stamp(22, "15:10"),
  }),
  invoice({
    id: "ap-inv-0012",
    vendorId: "mock-vendor-cfs",
    invoiceNumber: "CFS-1194",
    invoiceAmount: 1860,
    invoiceDate: daysAgo(2),
    dueDate: daysAgo(-28),
    glPeriod: monthsAgo(0),
    serviceDate: daysAgo(5),
    status: "draft",
    stubDescription: "Whitfield 1H: transfer pump repair",
    lines: [line("ap-line-0012-1", "coa-6000", WHITFIELD, "Saltwater transfer pump repair", 1860)],
    documentName: "CFS-1194.pdf",
    createdAt: stamp(1, "21:35"),
  }),
  invoice({
    id: "ap-inv-0013",
    vendorId: "mock-vendor-pvec",
    invoiceNumber: "2026-10-4471",
    invoiceAmount: 1982.4,
    invoiceDate: daysAgo(37),
    dueDate: daysAgo(17),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(42),
    status: "paid",
    journalId: "JE-26-04355",
    paidCheckNumber: "10437",
    stubDescription: "Sep electric, meter 44-1182",
    lines: [line("ap-line-0013-1", "coa-6000", WHITFIELD, "Sep electric, meter 44-1182", 1982.4)],
    documentName: "PVEC_2026-10-4471.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(34, "14:30"),
    createdAt: stamp(35, "16:00"),
  }),
  invoice({
    id: "ap-inv-0014",
    vendorId: "mock-vendor-pvec",
    invoiceNumber: "2026-11-4502",
    invoiceAmount: 2014.8,
    invoiceDate: daysAgo(6),
    dueDate: daysAgo(-14),
    glPeriod: monthsAgo(0),
    serviceDate: daysAgo(11),
    status: "approved",
    journalId: "JE-26-04431",
    stubDescription: "Oct electric, meter 44-1182",
    lines: [line("ap-line-0014-1", "coa-6000", WHITFIELD, "Oct electric, meter 44-1182", 2014.8)],
    documentName: "PVEC_2026-11-4502.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(2, "15:15"),
    createdAt: stamp(5, "18:20"),
  }),
  invoice({
    id: "ap-inv-0015",
    vendorId: "mock-vendor-rrr",
    invoiceNumber: "RR-0912",
    invoiceAmount: 3640,
    invoiceDate: daysAgo(60),
    dueDate: daysAgo(30),
    glPeriod: monthsAgo(2),
    serviceDate: daysAgo(62),
    status: "paid",
    journalId: "JE-26-04340",
    paidCheckNumber: "10429",
    stubDescription: "Hayes Unit 2H: flowline repair",
    lines: [line("ap-line-0015-1", "coa-6000", HAYES, "Roustabout crew, flowline repair, 28 hrs", 3640)],
    approvedBy: "mrivera",
    approvedAt: stamp(56, "14:00"),
    createdAt: stamp(57, "15:40"),
  }),
  invoice({
    id: "ap-inv-0016",
    vendorId: "mock-vendor-rrr",
    invoiceNumber: "RR-0968",
    invoiceAmount: 5452.75,
    invoiceDate: daysAgo(83),
    dueDate: daysAgo(53),
    glPeriod: monthsAgo(3),
    serviceDate: daysAgo(85),
    status: "approved",
    journalId: "JE-26-04176",
    stubDescription: "Whitfield 1H: wellhead and fence repair",
    lines: [line("ap-line-0016-1", "coa-6000", WHITFIELD, "Roustabout crew, wellhead and fence repair", 5452.75)],
    documentName: "RR-0968.pdf",
    approvedBy: "mrivera",
    approvedAt: stamp(77, "15:30"),
    createdAt: stamp(78, "16:00"),
  }),
  invoice({
    id: "ap-inv-0017",
    vendorId: "mock-vendor-rrr",
    invoiceNumber: "RR-1031",
    invoiceAmount: 2780,
    invoiceDate: daysAgo(11),
    dueDate: daysAgo(-19),
    glPeriod: monthsAgo(1),
    serviceDate: daysAgo(13),
    status: "approved",
    journalId: "JE-26-04418",
    stubDescription: "Whitfield 1H: tank battery cleanup",
    lines: [line("ap-line-0017-1", "coa-6000", WHITFIELD, "Roustabout crew, tank battery cleanup", 2780)],
    documentName: "RR-1031.pdf",
    attachmentNames: ["RR-1031_tickets.pdf"],
    approvedBy: "mrivera",
    approvedAt: stamp(7, "17:00"),
    createdAt: stamp(8, "16:25"),
  }),
];

export const MOCK_AP_PAYMENTS: ApPayment[] = [
  {
    id: "ap-pay-0001",
    vendorId: "mock-vendor-pbws",
    checkNumber: "10418",
    checkDate: daysAgo(62),
    bankAccountId: "bank-operating",
    amount: 11240,
    journalId: "JE-26-04187",
    status: "cleared",
    invoiceIds: ["ap-inv-0001"],
    applications: [{ invoiceId: "ap-inv-0001", amount: 11240 }],
  },
  {
    id: "ap-pay-0002",
    vendorId: "mock-vendor-rrr",
    checkNumber: "10429",
    checkDate: daysAgo(33),
    bankAccountId: "bank-operating",
    amount: 3640,
    journalId: "JE-26-04352",
    status: "cleared",
    invoiceIds: ["ap-inv-0015"],
    applications: [{ invoiceId: "ap-inv-0015", amount: 3640 }],
  },
  {
    id: "ap-pay-0003",
    vendorId: "mock-vendor-pvec",
    checkNumber: "10437",
    checkDate: daysAgo(20),
    bankAccountId: "bank-operating",
    amount: 1982.4,
    journalId: "JE-26-04366",
    status: "outstanding",
    invoiceIds: ["ap-inv-0013"],
    applications: [{ invoiceId: "ap-inv-0013", amount: 1982.4 }],
  },
  {
    id: "ap-pay-0004",
    vendorId: "mock-vendor-pbws",
    checkNumber: "10441",
    checkDate: daysAgo(14),
    bankAccountId: "bank-operating",
    amount: 9880,
    journalId: "JE-26-04410",
    status: "cleared",
    invoiceIds: ["ap-inv-0002"],
    applications: [{ invoiceId: "ap-inv-0002", amount: 9880 }],
  },
];

const defaults = (vendorId: string, values: Partial<VendorDefaults>): VendorDefaults => ({
  vendorId,
  pay: "Yes",
  duplicateValidation: "Invoice #",
  sameAmountWindowDays: 60,
  apAccountId: "coa-2000",
  defaultExpenseAccountId: null,
  paymentTerms: "Net 30",
  type1099: null,
  box1099: null,
  remitToAddressType: "Payment",
  ...values,
});

export const MOCK_VENDOR_DEFAULTS: Record<string, VendorDefaults> = {
  "mock-vendor-pbws": defaults("mock-vendor-pbws", {
    pay: "Check per entry",
    defaultExpenseAccountId: "coa-6000-110",
    type1099: "1099-NEC",
    box1099: "Nonemployee Comp.",
  }),
  "mock-vendor-lsw": defaults("mock-vendor-lsw", {
    pay: "Yes",
    defaultExpenseAccountId: "coa-1470",
  }),
  "mock-vendor-cfs": defaults("mock-vendor-cfs", {
    pay: "Monthly",
    defaultExpenseAccountId: "coa-6000",
    type1099: "1099-NEC",
    box1099: "Nonemployee Comp.",
  }),
  "mock-vendor-pvec": defaults("mock-vendor-pvec", {
    pay: "Yes",
    paymentTerms: "Net 15",
    defaultExpenseAccountId: "coa-6000",
  }),
  "mock-vendor-rrr": defaults("mock-vendor-rrr", {
    pay: "No",
    duplicateValidation: "Invoice Amount",
    sameAmountWindowDays: 90,
    defaultExpenseAccountId: "coa-6000",
    type1099: "1099-NEC",
    box1099: "Nonemployee Comp.",
  }),
};
