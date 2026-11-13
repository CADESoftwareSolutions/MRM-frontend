import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apInvoicesQuery } from "@/hooks/useApInvoices";
import { ContactListParty, useContactListExtras } from "@/hooks/useContactDetails";
import type { ContactAddressLine, ContactPhoneLine } from "@/hooks/useContacts";
import { contactsConfig } from "@/config/contactsConfig";
import type { ApInvoice } from "@/types/apInvoices";
import type { ListFilter } from "../List";
import {
  CONTACT_ALERT_KINDS,
  ContactAlert,
  countVendorInvoices,
  deriveContactAlerts,
} from "./contactAlerts";

/** A useContacts row plus what the Brief / Detailed columns and the report need. */
export interface ContactListRow {
  id: string;
  nameId: string;
  name: string;
  displayName: string;
  nameLine2: string;
  classifications: string[];
  status: string;
  cityState: string;
  mailingAddress: string;
  addressList: ContactAddressLine[];
  phone: string | null;
  phoneList: ContactPhoneLine[];
  email: string;
  taxClassification: string;
  taxId: string;
  w9OnFile: string;
  send1099: string;
  /** "1099-MISC" etc. when Send 1099 is Yes ("Yes" if no type is set), else "". */
  form1099: string;
  /** "Yes" / "No", or "" until the mocked value loads. */
  netting: string;
  updatedBy: string | null;
  updatedAt: string | null;
  alerts: ContactAlert[];
  [key: string]: any;
}

export const HAS_ALERTS = "Has alerts";
const NO_INVOICES: ApInvoice[] = [];
const STATUS_OPTIONS = ["Active", "Inactive"];
const BUILT_IN_CLASSIFICATIONS = (contactsConfig.fields.find((f) => f.id === "classifications")?.options ??
  []) as string[];

const ALERT_KIND_BY_LABEL = new Map(CONTACT_ALERT_KINDS.map((k) => [k.filterLabel, k.kind]));

interface UseContactListRowsOptions {
  /** useContacts' search results. */
  rows: Record<string, any>[];
  /** Every contact, for the Classification filter's choices. */
  allRows: Record<string, any>[];
}

export const useContactListRows = ({ rows, allRows }: UseContactListRowsOptions) => {
  const [classification, setClassification] = useState("");
  const [status, setStatus] = useState("");
  const [alert, setAlert] = useState("");

  const parties = useMemo<ContactListParty[]>(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        isRevenueOwner: ((row.classifications as string[] | undefined) ?? []).includes("REV"),
      })),
    [rows],
  );
  const extrasById = useContactListExtras(parties);
  const { data: invoices = NO_INVOICES } = useQuery(apInvoicesQuery);
  const invoiceCounts = useMemo(() => countVendorInvoices(invoices), [invoices]);

  const enriched = useMemo<ContactListRow[]>(
    () =>
      rows.map((row) => {
        const id = String(row.id);
        const extras = extrasById.get(id);
        return {
          ...row,
          id,
          classifications: (row.classifications as string[] | undefined) ?? [],
          nameLine2: row.nameLine2 ?? "",
          email: row.email ?? "",
          form1099: row.send1099 === "Yes" ? extras?.form1099Type || "Yes" : "",
          netting: extras ? (extras.ownerNettingApplies ? "Yes" : "No") : "",
          updatedBy: extras?.updatedBy ?? null,
          updatedAt: row._rawData?.updatedAt ?? null,
          alerts: deriveContactAlerts(row, extras, invoiceCounts.get(id)),
        } as ContactListRow;
      }),
    [rows, extrasById, invoiceCounts],
  );

  const filtered = useMemo(() => {
    const alertKind = ALERT_KIND_BY_LABEL.get(alert);
    return enriched.filter(
      (row) =>
        (!classification || row.classifications.includes(classification)) &&
        (!status || row.status === status) &&
        (!alert ||
          (alert === HAS_ALERTS ? row.alerts.length > 0 : row.alerts.some((a) => a.kind === alertKind))),
    );
  }, [enriched, classification, status, alert]);

  const classificationOptions = useMemo(() => {
    const inUse = new Set(allRows.flatMap((row) => (row.classifications as string[] | undefined) ?? []));
    const custom = Array.from(inUse)
      .filter((c) => !BUILT_IN_CLASSIFICATIONS.includes(c))
      .sort();
    return [...BUILT_IN_CLASSIFICATIONS, ...custom];
  }, [allRows]);

  const filters: ListFilter[] = [
    {
      id: "classification",
      label: "Classification",
      allLabel: "All",
      value: classification,
      onChange: setClassification,
      options: classificationOptions,
      widthClass: "w-48",
    },
    {
      id: "status",
      label: "Status",
      allLabel: "All",
      value: status,
      onChange: setStatus,
      options: STATUS_OPTIONS,
      widthClass: "w-36",
    },
    {
      id: "alerts",
      label: "Alerts",
      allLabel: "Any",
      value: alert,
      onChange: setAlert,
      options: [HAS_ALERTS, ...CONTACT_ALERT_KINDS.map((k) => k.filterLabel)],
      widthClass: "w-48",
    },
  ];

  return { rows: filtered, filters };
};
