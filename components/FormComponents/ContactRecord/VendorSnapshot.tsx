import React from "react";
import Link from "next/link";
import { NO_1099 } from "@/config/contactsConfig";
import { useApInvoices } from "@/hooks/useApInvoices";
import { ApVendorSummary, formatUsd } from "@/types/apInvoices";
import { PANEL, SECTION_HEADER, Tone, toneClass } from "./utils";

interface VendorSnapshotProps {
  /** The contact's party id (its A/P vendor id); null before it's saved. */
  vendorId: string | null;
  /** Live form values, so the badges agree with the Tax and vendor tabs before saving. */
  w9OnFile?: string;
  send1099?: string;
  type1099?: string;
  isLight: boolean;
}

const EMPTY_SUMMARY: ApVendorSummary = {
  invoicesThisYear: 0,
  paidThisYear: 0,
  openCount: 0,
  openBalance: 0,
  nextDue: null,
  lastPayment: null,
  avgDaysToPay: null,
};

const NONE_YET = "None yet";

/** "2026-11-27" → "Nov 27, 2026". With `dropThisYear`, this year's dates read "Nov 27". */
const formatDay = (iso: string, dropThisYear = false): string => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  const showYear = !dropThisYear || year !== new Date().getFullYear();
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: showYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
};

const form1099Badge = (send1099?: string, type1099?: string): { tone: Tone; text: string } => {
  if (send1099 === "No" || type1099 === NO_1099) return { tone: "neutral", text: "No 1099" };
  if (type1099) return { tone: "info", text: type1099.replace(/^1099-/, "") };
  return { tone: "neutral", text: "1099 not set" };
};

/** A/P at a glance for a vendor contact, from the A/P invoices and payments. */
export const VendorSnapshot = ({ vendorId, w9OnFile, send1099, type1099, isLight }: VendorSnapshotProps) => {
  const { vendorSummary } = useApInvoices();
  const summary = vendorId ? vendorSummary(vendorId) : EMPTY_SUMMARY;
  const { nextDue, lastPayment } = summary;

  const badge = (tone: Tone, text: string) => (
    <span
      className={`inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium whitespace-nowrap ${toneClass(tone, isLight)}`}
    >
      {text}
    </span>
  );
  const strong = (text: string) => <strong className="font-semibold">{text}</strong>;
  const form1099 = form1099Badge(send1099, type1099);

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Open invoices",
      value: strong(summary.openCount > 0 ? `${summary.openCount} · ${formatUsd(summary.openBalance)}` : "0"),
    },
    {
      label: "Next due",
      value: nextDue ? `${formatDay(nextDue.dueDate)} · ${formatUsd(nextDue.amount)}` : NONE_YET,
    },
    { label: "Paid this year", value: strong(formatUsd(summary.paidThisYear)) },
    {
      label: "Last payment",
      value: lastPayment ? `${formatDay(lastPayment.checkDate, true)} · Ck #${lastPayment.checkNumber}` : NONE_YET,
    },
    {
      label: "W-9 / 1099",
      value: (
        <span className="flex flex-wrap justify-end gap-1.5">
          {w9OnFile === "Yes" ? badge("success", "W-9 on file") : badge("danger", "W-9 missing")}
          {badge(form1099.tone, form1099.text)}
        </span>
      ),
    },
    { label: "Avg. days to pay", value: summary.avgDaysToPay ?? NONE_YET },
  ];

  return (
    <section className={PANEL} aria-label="Vendor snapshot">
      <h3 className={`${SECTION_HEADER} mb-0.5`}>Vendor Snapshot</h3>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-3 py-2.5 text-sm text-white ${
            i < rows.length - 1 ? "border-b border-purple-300/10" : ""
          }`}
        >
          <span>{row.label}</span>
          <span className="text-right tabular-nums">{row.value}</span>
        </div>
      ))}
      <Link
        href="/Dashboard/ap-invoices"
        className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border border-purple-300/30 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-purple-100"
      >
        View A/P history
      </Link>
    </section>
  );
};

export default VendorSnapshot;
