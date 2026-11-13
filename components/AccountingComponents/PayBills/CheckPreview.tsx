import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import { amountInWords } from "@/lib/amountInWords";
import { cn } from "@/lib/utils";

export interface CheckStubLine {
  invoiceNumber: string;
  invoiceDate: string;
  description: string;
  invoiceAmount: number;
  discount: number;
  paid: number;
  journalId?: string;
}

export interface CheckDistributionLine {
  accountLabel: string;
  subAccountLabel?: string;
  afe?: string;
  deck?: string;
  amount: number;
}

export interface CheckPreviewData {
  /** Empty before the run is submitted: shown as "Assigned at submit". */
  checkNumber: string;
  /** Falls back to the signed-in account's name. */
  companyName?: string;
  companyAddressLines?: string[];
  checkDate: string;
  amount: number;
  payee: { name: string; addressLines: string[] };
  memo?: string;
  bankAccountLabel: string;
  lines: CheckStubLine[];
  distribution: CheckDistributionLine[];
}

export interface CheckPreviewProps {
  check: CheckPreviewData;
  /** Shows the window-envelope guide on screen; never printed. */
  showGuides?: boolean;
  /** Marks the check "PREVIEW — NOT NEGOTIABLE" so an unapproved check can't pass for a real one. */
  watermark?: boolean;
}

const PAYEE_NAME_MAX = 35;
const MICR_ON_US = "⑈";
const MICR_TRANSIT = "⑆";
const MICR_ROUTING_PLACEHOLDER = "000000000";
const MICR_ACCOUNT_PLACEHOLDER = "0000000000";
const NUMBER_PENDING_LABEL = "Assigned at submit";
const COMPANY_NAME_MISSING = "Company name not set";
const ASTERISK_FILL = "*".repeat(160);

// Browsers' default print margins would spill each 11in sheet onto a second page.
const PAGE_RULE = "@page { size: 8.5in 11in; margin: 0; }";

// Row capacity of a 352px stub at normal / compact row height; overflow collapses into a "+N more" row.
const VENDOR_ROWS = { normal: 6, compact: 8 };
const FILE_ROWS = { normal: 5, compact: 7 };

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value: string) => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return iso ? `${iso[2]}/${iso[3]}/${iso[1]}` : value;
};

const tryAmountInWords = (amount: number) => {
  try {
    return amountInWords(amount);
  } catch {
    return null;
  }
};

const splitRowBudget = (first: number, second: number, budget: number): [number, number] => {
  if (first + second <= budget) return [first, second];
  const firstCap = Math.min(first, Math.max(Math.floor(budget / 2), budget - second));
  return [firstCap, budget - firstCap];
};

interface StubColumn<T> {
  header: string;
  width?: string;
  numeric?: boolean;
  cell: (row: T) => ReactNode;
  total?: (row: T) => number;
}

interface StubTableProps<T> {
  columns: StubColumn<T>[];
  rows: T[];
  maxRows: number;
  compact: boolean;
  moreLabel: string;
}

const StubTable = <T,>({ columns, rows, maxRows, compact, moreLabel }: StubTableProps<T>) => {
  const overflow = rows.length > maxRows;
  const shown = overflow ? rows.slice(0, Math.max(maxRows - 1, 0)) : rows;
  const hidden = overflow ? rows.slice(shown.length) : [];
  const firstTotal = columns.findIndex((column) => column.total);
  const labelSpan = firstTotal === -1 ? columns.length : firstTotal;
  const cellClass = cn("border-b border-gray-100 px-2 align-top text-gray-900", compact ? "py-1" : "py-[7px]");

  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.header}
              className={cn(
                "truncate border-b border-gray-300 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-600",
                column.width,
                column.numeric ? "text-right" : "text-left",
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td
                key={column.header}
                className={cn(cellClass, column.numeric ? "whitespace-nowrap text-right tabular-nums" : "truncate")}
              >
                {column.cell(row)}
              </td>
            ))}
          </tr>
        ))}
        {overflow && (
          <tr>
            {labelSpan > 0 && (
              <td colSpan={labelSpan} className={cn(cellClass, "italic text-gray-600")}>
                + {hidden.length} more {moreLabel}
              </td>
            )}
            {columns.slice(labelSpan).map((column) => {
              const total = column.total;
              return (
                <td key={column.header} className={cn(cellClass, "whitespace-nowrap text-right tabular-nums text-gray-600")}>
                  {total ? formatMoney(hidden.reduce((sum, row) => sum + total(row), 0)) : null}
                </td>
              );
            })}
          </tr>
        )}
      </tbody>
    </table>
  );
};

const orDash = (value?: string) => value || "—";

const VENDOR_COLUMNS: StubColumn<CheckStubLine>[] = [
  { header: "Invoice #", width: "w-[104px]", cell: (line) => line.invoiceNumber },
  { header: "Invoice Date", width: "w-[104px]", cell: (line) => formatDate(line.invoiceDate) },
  { header: "Description", cell: (line) => line.description },
  {
    header: "Invoice Amt",
    width: "w-[100px]",
    numeric: true,
    cell: (line) => formatMoney(line.invoiceAmount),
    total: (line) => line.invoiceAmount,
  },
  {
    header: "Discount",
    width: "w-[80px]",
    numeric: true,
    cell: (line) => formatMoney(line.discount),
    total: (line) => line.discount,
  },
  { header: "Paid", width: "w-[100px]", numeric: true, cell: (line) => formatMoney(line.paid), total: (line) => line.paid },
];

const FILE_INVOICE_COLUMNS: StubColumn<CheckStubLine>[] = [
  { header: "Invoice #", width: "w-[104px]", cell: (line) => line.invoiceNumber },
  { header: "Journal ID", width: "w-[120px]", cell: (line) => orDash(line.journalId) },
  { header: "Description", cell: (line) => line.description },
  { header: "Paid", width: "w-[100px]", numeric: true, cell: (line) => formatMoney(line.paid), total: (line) => line.paid },
];

const DISTRIBUTION_COLUMNS: StubColumn<CheckDistributionLine>[] = [
  { header: "Account", cell: (line) => line.accountLabel },
  { header: "Sub-Acct", width: "w-[168px]", cell: (line) => orDash(line.subAccountLabel) },
  { header: "AFE", width: "w-[96px]", cell: (line) => orDash(line.afe) },
  { header: "Deck", width: "w-[96px]", cell: (line) => orDash(line.deck) },
  {
    header: "Amount",
    width: "w-[100px]",
    numeric: true,
    cell: (line) => formatMoney(line.amount),
    total: (line) => line.amount,
  },
];

const StubHeader = ({ check, copy }: { check: CheckPreviewData; copy: string }) => (
  <div className="flex items-baseline justify-between gap-3 text-xs">
    <strong className="min-w-0 truncate text-[13px]">{check.payee.name}</strong>
    <span className="shrink-0 text-gray-600">
      Check{" "}
      <strong className="text-gray-900 tabular-nums">{check.checkNumber || NUMBER_PENDING_LABEL}</strong> ·{" "}
      <span className="tabular-nums">{formatDate(check.checkDate)}</span> · {copy}
    </span>
  </div>
);

const CheckTotal = ({ amount }: { amount: number }) => (
  <div className="mt-auto flex justify-end gap-4 border-t border-gray-300 pt-2">
    <span className="text-gray-600">Check total</span>
    <strong className="tabular-nums">${formatMoney(amount)}</strong>
  </div>
);

export const CheckPreview = ({ check, showGuides = false, watermark = false }: CheckPreviewProps) => {
  const userProfile = useAtomValue(userProfileAtom);
  const companyName = check.companyName || userProfile?.account?.name || "";
  const companyAddressLines = check.companyAddressLines;
  const numberPending = !check.checkNumber;
  const words = tryAmountInWords(check.amount);
  const checkDate = formatDate(check.checkDate);
  const micrCheckNumber = check.checkNumber.replace(/\D/g, "").padStart(6, "0");
  const payeeNameLength = check.payee.name.length;
  const wordsClass = words && words.length > 80 ? "text-[10px] leading-[1.1]" : words && words.length > 56 ? "text-xs leading-[1.2]" : "";

  const vendorCompact = check.lines.length > VENDOR_ROWS.normal;
  const fileCompact = check.lines.length + check.distribution.length > FILE_ROWS.normal;
  const [fileInvoiceRows, fileDistributionRows] = splitRowBudget(
    check.lines.length,
    check.distribution.length,
    fileCompact ? FILE_ROWS.compact : FILE_ROWS.normal,
  );

  return (
    <article
      aria-label={`Check ${check.checkNumber} to ${check.payee.name}`}
      className="relative flex h-[1056px] w-[816px] shrink-0 flex-col overflow-hidden bg-white font-sans text-[13px] leading-[1.35] text-gray-900 shadow-lg print:h-[10.98in] print:w-[8.5in] print:break-inside-avoid print:break-after-page print:shadow-none print:last:break-after-auto"
    >
      <style>{PAGE_RULE}</style>
      {watermark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="-rotate-[24deg] whitespace-nowrap rounded-lg border-4 border-red-600/40 px-6 py-2 text-[44px] font-extrabold tracking-[0.08em] text-red-600/40">
            PREVIEW — NOT NEGOTIABLE
          </span>
        </div>
      )}

      <section className="flex h-[352px] shrink-0 flex-col border-b-[1.5px] border-dashed border-gray-400 bg-purple-50 px-9 pb-5 pt-7 print:bg-white">
        <div className="grid h-[75px] shrink-0 grid-cols-3 items-start gap-4">
          <div className="text-xs leading-[1.4]">
            <div className={cn("text-sm font-bold", !companyName && "text-red-700")}>
              {companyName || COMPANY_NAME_MISSING}
            </div>
            {companyAddressLines?.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          <div className="text-center text-[11px] leading-[1.4] text-gray-600">{check.bankAccountLabel}</div>
          <div className="text-right">
            <div className={cn("font-bold tabular-nums", numberPending ? "text-sm text-gray-600" : "text-xl")}>
              {numberPending ? NUMBER_PENDING_LABEL : check.checkNumber}
            </div>
            <div className="mt-1.5 text-xs">
              Date <strong className="tabular-nums">{checkDate}</strong>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-8 shrink-0 items-end gap-3">
          <span className="text-[11px] font-bold tracking-[0.06em] text-gray-600">PAY</span>
          <span className="flex min-w-0 flex-1 items-end gap-1 border-b border-gray-500 pb-0.5">
            <span className={cn("min-w-0 break-words", wordsClass)}>{words ?? "VOID"}</span>
            <span aria-hidden="true" className="min-w-6 flex-1 overflow-hidden whitespace-nowrap">
              {ASTERISK_FILL}
            </span>
            <span className="shrink-0">DOLLARS</span>
          </span>
          <span className="shrink-0 rounded border-[1.5px] border-gray-700 px-2.5 py-1 text-[15px] font-bold tabular-nums">
            $**{formatMoney(check.amount)}
          </span>
          {words === null && (
            <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-[11px] font-medium text-red-700 print:hidden">
              Amount must be $0.00 to $999,999,999.99
            </p>
          )}
        </div>

        <div className="mt-5 flex shrink-0 items-start gap-[18px]">
          <span className="pt-1.5 text-[10px] font-bold leading-[1.3] tracking-[0.06em] text-gray-600">
            TO THE
            <br />
            ORDER OF
          </span>
          <div
            className={cn(
              "relative w-[340px] rounded-md border-[1.5px] border-dashed px-3 py-2 print:border-transparent",
              showGuides ? "border-purple-600" : "border-transparent",
            )}
          >
            {showGuides && (
              <span className="absolute -top-[9px] left-2.5 whitespace-nowrap bg-purple-50 px-1 text-[10px] font-bold leading-[1.35] tracking-[0.04em] text-purple-700 print:hidden">
                WINDOW ENVELOPE AREA · NAME MAX {PAYEE_NAME_MAX} CHARACTERS
              </span>
            )}
            <div className="break-words text-sm font-semibold">{check.payee.name}</div>
            {check.payee.addressLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
            {payeeNameLength > PAYEE_NAME_MAX && (
              <p className="absolute left-0 top-full mt-1 whitespace-nowrap text-[11px] font-medium text-amber-700 print:hidden">
                Payee name is {payeeNameLength} characters; the envelope window fits {PAYEE_NAME_MAX}.
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-6">
          <div className="flex flex-1 items-end gap-2 text-xs">
            <span className="text-gray-600">Memo</span>
            <span className="max-w-[260px] flex-1 truncate border-b border-gray-500 pb-0.5">
              {check.memo || " "}
            </span>
          </div>
          <div className="w-[260px] border-t border-gray-700 pt-1 text-center text-[10px] text-gray-600">
            AUTHORIZED SIGNATURE
          </div>
        </div>
        <div className="mt-3.5 font-mono text-[15px] tracking-[0.12em]">
          {MICR_ON_US}
          {micrCheckNumber}
          {MICR_ON_US} {MICR_TRANSIT}
          {MICR_ROUTING_PLACEHOLDER}
          {MICR_TRANSIT} {MICR_ACCOUNT_PLACEHOLDER}
          {MICR_ON_US}
        </div>
      </section>

      <section className="flex h-[352px] shrink-0 flex-col gap-2.5 overflow-hidden border-b-[1.5px] border-dashed border-gray-400 px-9 py-[22px]">
        <StubHeader check={check} copy="Vendor copy" />
        <StubTable
          columns={VENDOR_COLUMNS}
          rows={check.lines}
          maxRows={vendorCompact ? VENDOR_ROWS.compact : VENDOR_ROWS.normal}
          compact={vendorCompact}
          moreLabel="invoices"
        />
        <CheckTotal amount={check.amount} />
      </section>

      <section className="flex h-[352px] shrink-0 flex-col gap-2.5 overflow-hidden px-9 py-[22px]">
        <StubHeader check={check} copy="File copy" />
        <StubTable
          columns={FILE_INVOICE_COLUMNS}
          rows={check.lines}
          maxRows={fileInvoiceRows}
          compact={fileCompact}
          moreLabel="invoices"
        />
        <StubTable
          columns={DISTRIBUTION_COLUMNS}
          rows={check.distribution}
          maxRows={fileDistributionRows}
          compact={fileCompact}
          moreLabel="distribution lines"
        />
        <CheckTotal amount={check.amount} />
      </section>
    </article>
  );
};

export default CheckPreview;
