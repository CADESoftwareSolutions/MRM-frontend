// Stand-in data for the contact record pieces the BE doesn't store yet. Real party ids are
// unknown here, so every party that's opened gets the same generic seed (ids prefixed with its
// party id). Read through src/hooks/useContactDetails.ts, never directly.

export type ContactCommentCategory = "general" | "tax" | "vendor";

export interface ContactComment {
  id: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
  author: string;
  text: string;
  /** System-written entry (address change, transfer, import…), shown with an AUTO tag. */
  auto?: boolean;
  /** Which part of the record it's about, so a tab can filter the shared log (e.g. Tax). */
  category: ContactCommentCategory;
}

export type LinkedRecordKind = "tract" | "lease" | "check" | "deck";

export interface LinkedRecord {
  id: string;
  kind: LinkedRecordKind;
  label: string;
  detail: string;
  status?: string;
  href: string;
}

export const RECAP_ITEM_IDS = ["suspense", "outstandingChecks", "w9", "form1099", "netting"] as const;
export type RecapItemId = (typeof RECAP_ITEM_IDS)[number];
export type RecapPrefs = Record<RecapItemId, boolean>;

export interface ContactRecapData {
  suspenseAmount: number;
  suspenseReason: string;
  outstandingCheckCount: number;
  outstandingCheckAmount: number;
  oldestOutstandingCheck: { number: string; days: number } | null;
  w9RequestedOn: string | null;
  form1099Type: string;
  form1099Reason: string;
  nettingCount: number;
}

// No "removed": the BE skips null/blank tax fields on update, so a cleared Tax ID isn't cleared.
export type TaxIdAccessAction = "viewed" | "entered" | "changed";

export interface TaxIdAccessEntry {
  id: string;
  /** ISO timestamp (UTC). */
  at: string;
  user: string;
  action: TaxIdAccessAction;
}

/** Per-party extras. Later tabs (tax, vendor) add their own keys here and to the builders below. */
export interface ContactRecordExtras {
  createdBy: string | null;
  updatedBy: string | null;
  recap: ContactRecapData;
  comments: ContactComment[];
  linkedRecords: LinkedRecord[];
  /** Tax tab "Type of 1099" — party_tax_info has no column for it yet. "" when not set. */
  form1099Type: string;
  /** Newest first. */
  taxIdAccessLog: TaxIdAccessEntry[];
}

/** Account-wide contact settings: each company picks its recap items and adds its own
 * classification types. */
export interface ContactAccountSettings {
  recapPrefs: RecapPrefs;
  customClassifications: string[];
}

export const MOCK_CONTACT_ACCOUNT_SETTINGS: ContactAccountSettings = {
  recapPrefs: {
    suspense: true,
    outstandingChecks: true,
    w9: true,
    form1099: true,
    netting: true,
  },
  customClassifications: [],
};

const SEED_RECAP: ContactRecapData = {
  suspenseAmount: 1240.18,
  suspenseReason: "Held until a W-9 is received",
  outstandingCheckCount: 1,
  outstandingCheckAmount: 382.4,
  oldestOutstandingCheck: { number: "10388", days: 94 },
  w9RequestedOn: "2026-10-02T20:40:00Z",
  form1099Type: "1099-MISC",
  form1099Reason: "royalties",
  nettingCount: 2,
};

const EMPTY_RECAP: ContactRecapData = {
  suspenseAmount: 0,
  suspenseReason: "",
  outstandingCheckCount: 0,
  outstandingCheckAmount: 0,
  oldestOutstandingCheck: null,
  w9RequestedOn: null,
  form1099Type: "",
  form1099Reason: "",
  nettingCount: 0,
};

const SEED_COMMENTS: Omit<ContactComment, "id">[] = [
  {
    createdAt: "2026-11-09T16:02:00Z",
    author: "aclark",
    auto: true,
    category: "general",
    text: "Mailing address changed from PO Box 1187, Midland, TX 79702 to 2209 W Wall St, Midland, TX 79701-4412.",
  },
  {
    createdAt: "2026-10-02T20:42:00Z",
    author: "jmelnick",
    category: "tax",
    text: "W-9 requested by mail to the 2209 W Wall St address.",
  },
  {
    createdAt: "2026-10-02T20:40:00Z",
    author: "jmelnick",
    category: "general",
    text: "Owner called about September revenue. Explained the W-9 hold and mailed a blank W-9.",
  },
  {
    createdAt: "2026-08-15T14:12:00Z",
    author: "system",
    auto: true,
    category: "general",
    text: "Transfer recorded: 0.00125000 NRI received from Estate of Raymond T. Sandoval, Tract 14, Reeves Co., TX.",
  },
  {
    createdAt: "2026-06-03T16:05:00Z",
    author: "aclark",
    category: "general",
    text: "Prefers paper checks. Do not set up ACH.",
  },
  {
    createdAt: "2026-04-18T14:30:00Z",
    author: "aclark",
    category: "general",
    text: "Confirmed the mailing address by phone. Checks go to the PO Box until further notice.",
  },
  {
    createdAt: "2026-03-04T20:14:00Z",
    author: "jmelnick",
    auto: true,
    category: "tax",
    text: "Tax Type set to Individual/Sole Proprietor. Send 1099 set to Yes.",
  },
  {
    createdAt: "2026-03-04T20:14:00Z",
    author: "jmelnick",
    auto: true,
    category: "general",
    text: "Record created from import owners_2026_03.xlsx.",
  },
];

const SEED_LINKED_RECORDS: Omit<LinkedRecord, "id">[] = [
  {
    kind: "tract",
    label: "Tract 14",
    detail: "Reeves Co., TX · Sec. 12, Blk 57, PSL Survey · 0.00125000 NRI",
    href: "/Dashboard/tracts",
  },
  {
    kind: "tract",
    label: "Tract 22",
    detail: "Reeves Co., TX · Sec. 13, Blk 57, PSL Survey · 0.00250000 NRI",
    href: "/Dashboard/tracts",
  },
  {
    kind: "lease",
    label: "Lease 2041",
    detail: "Whitfield to Permian Basin Resources · Book 412, Page 88",
    status: "HBP",
    href: "/Dashboard/leases",
  },
  {
    kind: "check",
    label: "Ck #10388",
    detail: "September 2026 revenue · $382.40",
    status: "Outstanding · 94 days",
    href: "/Dashboard/revenue-checks",
  },
  {
    kind: "check",
    label: "Ck #10141",
    detail: "June 2026 revenue · $296.15",
    status: "Cashed",
    href: "/Dashboard/revenue-checks",
  },
  {
    kind: "deck",
    label: "Sandoval 14 #1H",
    detail: "Revenue deck · Royalty · 0.00125000",
    status: "Active",
    href: "/Dashboard/wells",
  },
];

const SEED_TAX_ID_ACCESS: Omit<TaxIdAccessEntry, "id">[] = [
  { at: "2026-11-09T16:00:00Z", user: "aclark", action: "viewed" },
  { at: "2026-03-04T20:14:00Z", user: "jmelnick", action: "entered" },
];

export const buildMockContactExtras = (partyId: string): ContactRecordExtras => ({
  createdBy: "jmelnick",
  updatedBy: "aclark",
  recap: { ...SEED_RECAP },
  comments: SEED_COMMENTS.map((comment, i) => ({ ...comment, id: `${partyId}-seed-${i + 1}` })),
  linkedRecords: SEED_LINKED_RECORDS.map((record, i) => ({ ...record, id: `${partyId}-link-${i + 1}` })),
  form1099Type: "1099-MISC",
  taxIdAccessLog: SEED_TAX_ID_ACCESS.map((entry, i) => ({ ...entry, id: `${partyId}-taxid-${i + 1}` })),
});

/** Per-contact money and netting facts the Contacts list shows (Alerts, Netting) that have no BE
 * source yet. */
export interface ContactListMoneyFacts {
  suspenseAmount: number;
  outstandingCheckCount: number;
  outstandingCheckAmount: number;
  oldestOutstandingCheckNumber: string | null;
  oldestOutstandingCheckDays: number | null;
  ownerNettingApplies: boolean;
}

const SUSPENSE_AMOUNTS = [1240.18, 86.52, 412.07, 2310.4, 57.9];
const OUTSTANDING_CHECKS = [
  { count: 1, days: 94, amount: 382.4, number: "10388" },
  { count: 2, days: 121, amount: 1104.77, number: "10214" },
  { count: 1, days: 63, amount: 96.15, number: "10402" },
];

const hashPartyId = (partyId: string) =>
  Array.from(partyId).reduce((hash, ch) => (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0, 7);

/** Only a few revenue owners get suspense money, an outstanding check or netting, picked from
 * the party id so every render and reload agrees. */
export const buildMockContactListMoneyFacts = (
  partyId: string,
  isRevenueOwner: boolean,
): ContactListMoneyFacts => {
  const hash = hashPartyId(partyId);
  const check = isRevenueOwner && hash % 9 === 4 ? OUTSTANDING_CHECKS[(hash >>> 4) % OUTSTANDING_CHECKS.length] : null;
  return {
    suspenseAmount:
      isRevenueOwner && hash % 7 === 3 ? SUSPENSE_AMOUNTS[(hash >>> 3) % SUSPENSE_AMOUNTS.length] : 0,
    outstandingCheckCount: check?.count ?? 0,
    outstandingCheckAmount: check?.amount ?? 0,
    oldestOutstandingCheckNumber: check?.number ?? null,
    oldestOutstandingCheckDays: check?.days ?? null,
    ownerNettingApplies: isRevenueOwner && hash % 5 === 2,
  };
};

/** A contact saved in this session: no seeded history, just who created it. */
export const emptyContactExtras = (createdBy: string | null = null): ContactRecordExtras => ({
  createdBy,
  updatedBy: createdBy,
  recap: { ...EMPTY_RECAP },
  comments: [],
  linkedRecords: [],
  form1099Type: "",
  taxIdAccessLog: [],
});
