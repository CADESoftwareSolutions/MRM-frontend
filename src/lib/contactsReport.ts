import { format } from "date-fns";
import { parseTimestamp } from "../../components/FormComponents/ContactRecord/utils";

export interface ContactReportAddress {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface ContactReportPhone {
  type: string;
  number: string;
}

/** One contact as the Contacts list has it (the Detailed columns plus every address and phone). */
export interface ContactReportRow {
  nameId: string;
  displayName: string;
  name: string;
  nameLine2: string;
  classifications: string[];
  status: string;
  mailingAddress: string;
  phone: string | null;
  email: string;
  taxClassification: string;
  w9OnFile: string;
  form1099: string;
  netting: string;
  alerts: { text: string }[];
  updatedBy: string | null;
  updatedAt: string | null;
  addressList: ContactReportAddress[];
  phoneList: ContactReportPhone[];
}

// The order the contact record offers them in; any other type follows alphabetically.
const ADDRESS_TYPE_ORDER = ["Physical", "Mailing", "1099", "JIB", "Revenue", "Payment", "Correspondence"];
const PHONE_TYPE_ORDER = ["Home", "Business", "Cell", "Work", "Fax", "Other"];

const ADDRESS_PARTS: { header: string; value: (a: ContactReportAddress) => string }[] = [
  { header: "Address 1", value: (a) => a.line1 },
  { header: "Address 2", value: (a) => a.line2 },
  { header: "City", value: (a) => a.city },
  { header: "State", value: (a) => a.state },
  { header: "ZIP", value: (a) => a.zip },
];

const typesInUse = (types: string[], order: string[]) => {
  const used = new Set(types);
  return [
    ...order.filter((t) => used.has(t)),
    ...Array.from(used)
      .filter((t) => !order.includes(t))
      .sort(),
  ];
};

const typeOf = (type: string) => type || "Other";

const FORMULA_START = /^[=+\-@\t\r]/;
const PHONE_SHAPE = /^\+?[\d\s().-]+$/;
const AMOUNT_SHAPE = /^-?\d+(,\d{3})*(\.\d+)?$/;
const isPlainNumber = (value: string) =>
  AMOUNT_SHAPE.test(value) || (PHONE_SHAPE.test(value) && value.replace(/\D/g, "").length >= 7);

// A leading = + - @ makes Excel read the cell as a formula; phone numbers and amounts are left as
// they are.
const csvCell = (value: string) => {
  const text = FORMULA_START.test(value) && !isPlainNumber(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const reportDate = (value: string | null) => {
  const date = parseTimestamp(value);
  return date ? format(date, "MM/dd/yyyy") : "";
};

/** The Name & Address report: every Detailed column, then each address type split into mailing
 * lines and each phone type, for only the types these contacts use. */
export const buildContactsReportCsv = (rows: ContactReportRow[]): string => {
  const addressTypes = typesInUse(rows.flatMap((r) => r.addressList.map((a) => typeOf(a.type))), ADDRESS_TYPE_ORDER);
  const phoneTypes = typesInUse(rows.flatMap((r) => r.phoneList.map((p) => typeOf(p.type))), PHONE_TYPE_ORDER);

  const headers = [
    "Name ID",
    "Name",
    "Name Line 2",
    "Classification",
    "Status",
    "Mailing Address",
    "Phone",
    "Email",
    "Tax Type",
    "W-9",
    "1099",
    "Netting",
    "Alerts",
    "Updated By",
    "Updated",
    ...addressTypes.flatMap((type) => ADDRESS_PARTS.map((part) => `${type} ${part.header}`)),
    ...phoneTypes.map((type) => `${type} Phone`),
  ];

  const lines = rows.map((r) => {
    const addressByType = new Map(r.addressList.map((a) => [typeOf(a.type), a]));
    const phonesByType = new Map<string, string[]>();
    for (const p of r.phoneList) {
      const type = typeOf(p.type);
      phonesByType.set(type, [...(phonesByType.get(type) ?? []), p.number]);
    }
    return [
      r.nameId,
      r.displayName || r.name,
      r.nameLine2,
      r.classifications.join(", "),
      r.status,
      r.mailingAddress,
      r.phone ?? "",
      r.email,
      r.taxClassification,
      r.w9OnFile === "Yes" ? "On file" : "Missing",
      r.form1099,
      r.netting,
      r.alerts.map((a) => a.text).join("; "),
      r.updatedBy ?? "",
      reportDate(r.updatedAt),
      ...addressTypes.flatMap((type) => {
        const address = addressByType.get(type);
        return ADDRESS_PARTS.map((part) => (address ? part.value(address) : ""));
      }),
      ...phoneTypes.map((type) => (phonesByType.get(type) ?? []).join("; ")),
    ];
  });

  return [headers, ...lines].map((row) => row.map((value) => csvCell(String(value ?? ""))).join(",")).join("\r\n");
};

/** Downloads the report as a CSV. The BOM lets Excel read accented names as UTF-8. */
export const downloadContactsReport = (rows: ContactReportRow[]) => {
  const csv = `﻿${buildContactsReportCsv(rows)}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `name-address-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
