import type { ApInvoice } from "@/types/apInvoices";
import type { ContactListExtras } from "@/hooks/useContactDetails";
import { Tone, formatMoney } from "../ContactRecord/utils";

export type ContactAlertKind =
  | "possibleDuplicate"
  | "w9Missing"
  | "noTaxId"
  | "suspense"
  | "outstandingCheck"
  | "awaitingApproval"
  | "draftInvoice";

export interface ContactAlert {
  kind: ContactAlertKind;
  text: string;
  tone: Tone;
}

/** Most urgent first; the list shows the first one and counts the rest. `filterLabel` is the
 * kind's name in the Alerts filter. */
export const CONTACT_ALERT_KINDS: { kind: ContactAlertKind; filterLabel: string; tone: Tone }[] = [
  { kind: "possibleDuplicate", filterLabel: "Possible duplicate invoice", tone: "danger" },
  { kind: "w9Missing", filterLabel: "W-9 missing", tone: "warning" },
  { kind: "noTaxId", filterLabel: "No Tax ID", tone: "warning" },
  { kind: "suspense", filterLabel: "Money in suspense", tone: "warning" },
  { kind: "outstandingCheck", filterLabel: "Outstanding checks", tone: "warning" },
  { kind: "awaitingApproval", filterLabel: "Invoices awaiting approval", tone: "info" },
  { kind: "draftInvoice", filterLabel: "Draft invoices", tone: "info" },
];

const TONE_BY_KIND = Object.fromEntries(CONTACT_ALERT_KINDS.map((k) => [k.kind, k.tone])) as Record<
  ContactAlertKind,
  Tone
>;

/** Classifications that are paid or reported on, so they need a W-9 and a Tax ID. */
export const TAX_DOC_CLASSIFICATIONS = ["REV", "VENDOR"];

export const needsTaxDocs = (classifications: string[] | undefined) =>
  (classifications ?? []).some((c) => TAX_DOC_CLASSIFICATIONS.includes(c));

export interface VendorInvoiceCounts {
  needsReview: number;
  awaitingApproval: number;
  draft: number;
}

/** Open A/P work per vendor id (a contact's vendor id is its party id). */
export const countVendorInvoices = (invoices: ApInvoice[]): Map<string, VendorInvoiceCounts> => {
  const byVendor = new Map<string, VendorInvoiceCounts>();
  for (const invoice of invoices) {
    const key =
      invoice.status === "needs_review"
        ? "needsReview"
        : invoice.status === "awaiting_approval"
          ? "awaitingApproval"
          : invoice.status === "draft"
            ? "draft"
            : null;
    if (!key) continue;
    const counts = byVendor.get(invoice.vendorId) ?? { needsReview: 0, awaitingApproval: 0, draft: 0 };
    counts[key] += 1;
    byVendor.set(invoice.vendorId, counts);
  }
  return byVendor;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

interface AlertSource {
  classifications?: string[];
  w9OnFile?: string;
  taxId?: string;
  status?: string;
}

export const deriveContactAlerts = (
  row: AlertSource,
  extras: ContactListExtras | undefined,
  invoices: VendorInvoiceCounts | undefined,
): ContactAlert[] => {
  const alerts: { kind: ContactAlertKind; text: string }[] = [];
  const taxDocs = needsTaxDocs(row.classifications) && row.status !== "Inactive";

  if (invoices?.needsReview) alerts.push({ kind: "possibleDuplicate", text: "Possible duplicate invoice" });
  if (taxDocs && row.w9OnFile !== "Yes") alerts.push({ kind: "w9Missing", text: "W-9 missing" });
  if (taxDocs && !String(row.taxId ?? "").trim()) alerts.push({ kind: "noTaxId", text: "No Tax ID" });
  if (extras && extras.suspenseAmount > 0) {
    alerts.push({ kind: "suspense", text: `${formatMoney(extras.suspenseAmount)} in suspense` });
  }
  if (extras && extras.outstandingCheckCount > 0) {
    const days = extras.oldestOutstandingCheckDays;
    alerts.push({
      kind: "outstandingCheck",
      text:
        extras.outstandingCheckCount === 1
          ? `Check outstanding ${days} days`
          : `${extras.outstandingCheckCount} checks outstanding, oldest ${days} days`,
    });
  }
  if (invoices?.awaitingApproval) {
    alerts.push({
      kind: "awaitingApproval",
      text: `${plural(invoices.awaitingApproval, "invoice", "invoices")} awaiting approval`,
    });
  }
  if (invoices?.draft) {
    alerts.push({ kind: "draftInvoice", text: plural(invoices.draft, "draft invoice", "draft invoices") });
  }

  return alerts.map((a) => ({ ...a, tone: TONE_BY_KIND[a.kind] }));
};
