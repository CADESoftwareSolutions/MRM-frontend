import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { CONTACT_LIST_VIEWS, ContactListView, contactsConfig } from "@/config/contactsConfig";
import { List, ListFilter } from "../List";
import { renderContactListCell } from "./contactListCells";
import type { ContactListRow } from "./useContactListRows";

const LAYOUT: Record<ContactListView, { columnWidths: Record<string, number>; minTableWidth: number }> = {
  brief: {
    columnWidths: { nameId: 112, classifications: 170, cityState: 170, phone: 150, status: 104 },
    minTableWidth: 1060,
  },
  detailed: {
    columnWidths: {
      nameId: 112,
      name: 240,
      classifications: 160,
      phone: 150,
      email: 210,
      taxClassification: 160,
      w9OnFile: 104,
      form1099: 104,
      netting: 96,
      status: 104,
      updated: 160,
    },
    minTableWidth: 1990,
  },
};

interface ContactListProps {
  view: ContactListView;
  rows: ContactListRow[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ListFilter[];
  onEdit: (row: ContactListRow) => void;
  onDelete: (row: ContactListRow) => void;
}

/** The shared List with the Brief or Detailed column set. Each view saves its own Columns choices
 * and widths. */
export const ContactList = ({ view, rows, loading, searchTerm, setSearchTerm, filters, onEdit, onDelete }: ContactListProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const config = useMemo(() => ({ ...contactsConfig, listFields: CONTACT_LIST_VIEWS[view].fields }), [view]);

  return (
    <List
      // List reads its saved columns once when it mounts, so a view change needs a fresh one.
      key={view}
      config={config}
      storageKey={`${contactsConfig.name}-${view}`}
      data={rows}
      loading={loading}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchPlaceholder="Search by name, Name ID, Tax ID (last 4), city, state, phone or email…"
      filters={filters}
      onEdit={onEdit}
      onDelete={onDelete}
      renderCell={(column, item) => renderContactListCell(column, item as ContactListRow, isLight)}
      columnWidths={LAYOUT[view].columnWidths}
      minTableWidth={LAYOUT[view].minTableWidth}
    />
  );
};

export default ContactList;
