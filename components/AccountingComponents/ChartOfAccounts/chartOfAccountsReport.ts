import { format } from "date-fns";
import { ChartAccount, auditUserName } from "@/types/chartOfAccounts";

export const formatAuditDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

const FORMULA_START = /^[=+\-@\t\r]/;

// A leading = + - @ makes Excel read the cell as a formula; numbers are left as they are.
const csvCell = (value: string | number) => {
  const raw = String(value);
  const text = typeof value === "string" && FORMULA_START.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const HEADERS = [
  "Account",
  "Sub",
  "Description",
  "Category",
  "Status",
  "Default",
  "Transactions",
  "Created By",
  "Created",
  "Updated By",
  "Updated",
];

export const downloadChartOfAccountsCsv = (
  accounts: ChartAccount[],
  currentUser: Parameters<typeof auditUserName>[1],
) => {
  const rows = accounts.map((a) => [
    a.account,
    a.sub ?? "",
    a.description,
    a.category,
    a.isActive ? "Active" : "Inactive",
    a.isDefault ? "Yes" : "No",
    a.transactionCount,
    auditUserName(a.createdById, currentUser),
    formatAuditDate(a.createdAt),
    auditUserName(a.updatedById, currentUser),
    formatAuditDate(a.updatedAt),
  ]);
  const csv = [HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `chart-of-accounts-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
