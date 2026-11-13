import type { ContactOption } from "@/hooks/useContactOptions";
import { MOCK_AP_VENDORS } from "@/mocks/apInvoices";

/** A vendor the entry screen can switch to: a real contact, or a mock vendor that isn't one. */
export interface VendorChoice {
  id: string;
  name: string;
  nameId: string;
  /** Mock vendors carry their own remit-to; a contact's comes from its addresses. */
  remitTo: string[] | null;
}

export const isMockVendorId = (id: string): boolean => MOCK_AP_VENDORS.some((vendor) => vendor.id === id);

export const isContactVendorId = (id: string): boolean => /^\d+$/.test(id);

const normalizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const contactVendorChoice = (option: ContactOption): VendorChoice => ({
  id: option.id,
  name: option.name,
  nameId: option.nameId,
  remitTo: null,
});

/** Matches a vendor name read off a document to a VENDOR contact first, then a mock vendor,
 * ignoring case, periods, commas and extra spaces. */
export const findVendorByName = (name: string, contacts: ContactOption[]): VendorChoice | null => {
  const wanted = normalizeName(name);
  if (!wanted) return null;
  const contact = contacts.find(
    (option) =>
      option.classifications.some((c) => c.toUpperCase() === "VENDOR") && normalizeName(option.name) === wanted,
  );
  if (contact) return contactVendorChoice(contact);
  const mock = MOCK_AP_VENDORS.find((vendor) => normalizeName(vendor.name) === wanted);
  return mock ? { id: mock.id, name: mock.name, nameId: mock.nameId, remitTo: mock.remitTo } : null;
};
