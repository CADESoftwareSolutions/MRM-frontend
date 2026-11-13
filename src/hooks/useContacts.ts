import { useState, useMemo, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FieldConfig, ModuleConfig } from "../config/contactsConfig";
import {
  FETCH_PARTIES,
  CREATE_PARTY_MUTATION,
  UPDATE_PARTY_MUTATION,
  DELETE_PARTY_MUTATION,
  CREATE_ADDRESS_MUTATION,
  UPDATE_ADDRESS_MUTATION,
  CREATE_PARTY_ADDRESS_MUTATION,
  DELETE_PARTY_ADDRESS_MUTATION,
  CREATE_PARTY_RELATIONSHIP_MUTATION,
  UPDATE_PARTY_RELATIONSHIP_MUTATION,
  DELETE_PARTY_RELATIONSHIP_MUTATION,
  CREATE_PHONE_MUTATION,
  UPDATE_PHONE_MUTATION,
  CREATE_PARTY_PHONE_MUTATION,
  DELETE_PARTY_PHONE_MUTATION,
} from "../graphql/Contacts";
import { AddressEntry } from "../../components/FormComponents/MultiAddressField";
import { PhoneEntry } from "../../components/FormComponents/MultiPhoneField";
import { Contact } from "../../components/FormComponents/ContactsTab";
import { ContactAddressLine, formatAddressLine, pickMailingAddress, toAddressLine } from "../lib/contactAddress";

import { executeGraphQL } from "../lib/api";
import { mockNameId } from "../lib/nameId";

/** An internal contact plus whether its relationship is flagged primary. */
export type ContactPerson = Contact & { _isPrimary?: boolean };

interface UseContactsDataProps {
  config: ModuleConfig;
  accountId: number;
}

const getGraphQLValue = (obj: any, path: string): any =>
  path.split(".").reduce((acc: any, k) => acc?.[k], obj);

const readConfigFields = (party: any, config: ModuleConfig): Record<string, any> => {
  const result: Record<string, any> = {};
  config.fields.forEach((f) => {
    if (!f.graphqlKey) return;
    const raw = getGraphQLValue(party, f.graphqlKey);
    result[f.id] = f.fromGraphQL ? f.fromGraphQL(raw) : (raw ?? "");
  });
  return result;
};

/** Same dependsOn rule the Form uses to show a field. */
const isFieldShown = (f: FieldConfig, formData: Record<string, any>): boolean => {
  if (!f.dependsOn) return true;
  const val = formData[f.dependsOn];
  const targets = Array.isArray(f.dependsOnValue) ? f.dependsOnValue : [f.dependsOnValue];
  return Array.isArray(val) ? val.some((v) => targets.includes(v)) : targets.includes(val);
};

const assignGraphQLValue = (target: any, key: string, value: any) => {
  const [head, ...rest] = key.split(".");
  if (!head) return;
  if (rest.length === 0) {
    target[head] = value;
    return;
  }

  target[head] = target[head] || {};
  assignGraphQLValue(target[head], rest.join("."), value);
};

const transformRelatedContacts = (relationships: any[] = []): ContactPerson[] =>
  relationships.map((relationship: any) => {
    const relatedParty = relationship.relatedParty || {};
    const primaryPhone =
      relatedParty.phones?.find((p: any) => p.isPrimary)?.phone?.number ||
      relatedParty.phones?.[0]?.phone?.number ||
      "";
    const primaryAddress = relatedParty.addresses?.[0];

    return {
      id: parseInt(relationship.id, 10),
      _relatedPartyId: relatedParty.id
        ? parseInt(relatedParty.id, 10)
        : undefined,
      _phoneId: relatedParty.phones?.[0]?.phone?.id
        ? parseInt(relatedParty.phones[0].phone.id, 10)
        : undefined,
      _addressId: primaryAddress?.address?.id
        ? parseInt(primaryAddress.address.id, 10)
        : undefined,
      _isPrimary: Boolean(relationship.isPrimary),
      nameFirst: relatedParty.nameFirst || relatedParty.nameFull || "",
      nameMiddle: relatedParty.nameMiddle || "",
      nameLast: relatedParty.nameLast || "",
      role: relationship.notes || "",
      phone: primaryPhone,
      email: relatedParty.email || "",
      addressType: primaryAddress?.addressType
        ? [primaryAddress.addressType]
        : [],
      address: primaryAddress?.address?.line1 || "",
      addressLine2: primaryAddress?.address?.line2 || "",
      city: primaryAddress?.address?.city || "",
      state: primaryAddress?.address?.stateCode || "",
      zip: primaryAddress?.address?.postalCode || "",
    };
  });

export type { ContactAddressLine };
export { formatAddressLine };

export interface ContactPhoneLine {
  type: string;
  number: string;
}

const digitsOf = (value: unknown) => String(value ?? "").replace(/\D/g, "");

/** List and search extras derived from the party's real addresses, phones and Tax ID. */
const listExtras = (party: any) => {
  const rawAddresses: any[] = party.addresses ?? [];
  const addressList = rawAddresses.map(toAddressLine);
  const phoneList: ContactPhoneLine[] = (party.phones ?? [])
    .map((pp: any) => ({ type: pp.phoneType || "", number: pp.phone?.number || "" }))
    .filter((p: ContactPhoneLine) => p.number);
  const mailing = pickMailingAddress(addressList, rawAddresses);
  const taxDigits = digitsOf(party.taxInfo?.taxId);
  const displayName =
    [party.nameFirst, party.nameLast].filter(Boolean).join(" ") || party.nameFull || "";
  return {
    // nameFull also holds Name Line 2 (Contacts saves Line 2 as nameMiddle), so the list draws
    // Line 1 and Line 2 separately from these.
    displayName,
    cityState: mailing ? [mailing.city, mailing.state].filter(Boolean).join(", ") : "",
    mailingAddress: formatAddressLine(mailing),
    addressList,
    phoneList,
    taxIdLast4: taxDigits.length >= 4 ? taxDigits.slice(-4) : "",
    _searchText: [
      displayName,
      party.nameFull,
      party.nameMiddle,
      mockNameId(party.id),
      party.email,
      ...addressList.flatMap((a) => [a.line1, a.line2, a.city, a.state, a.zip]),
      ...phoneList.map((p) => p.number),
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase(),
    _searchPhoneDigits: phoneList.map((p) => digitsOf(p.number)).join(" "),
  };
};

/** Name, Name ID, Name Line 2, address parts, email and phone as typed; phone by digits alone
 * ("432555" finds "(432) 555-0148"); and an exact Tax ID last 4. */
const matchesSearch = (item: Record<string, any>, term: string): boolean => {
  const lower = term.trim().toLowerCase();
  if (!lower) return true;
  if (String(item._searchText ?? "").includes(lower)) return true;
  if (/[a-z]/.test(lower)) return false;
  const digits = digitsOf(lower);
  if (digits.length === 4 && item.taxIdLast4 === digits) return true;
  return digits.length >= 3 && String(item._searchPhoneDigits ?? "").includes(digits);
};

const transformParties = (parties: any[], config: ModuleConfig) =>
  parties.map((party: any) => {
    const primaryPhone =
      party.phones?.find((p: any) => p.isPrimary)?.phone?.number ||
      party.phones?.[0]?.phone?.number ||
      null;
    return {
      id: party.id,
      nameId: mockNameId(party.id),
      name: party.nameFull,
      phone: primaryPhone,
      phoneNumber: primaryPhone,
      city: party.addresses?.[0]?.address?.city || "",
      state: party.addresses?.[0]?.address?.stateCode || "",
      address: party.addresses?.[0]?.address?.line1 || "",
      addressLine2: party.addresses?.[0]?.address?.line2 || "",
      zip: party.addresses?.[0]?.address?.postalCode || "",
      addressTypes: party.addresses?.[0]?.addressType
        ? [party.addresses[0].addressType]
        : [],
      contacts: transformRelatedContacts(party.relatedContacts),
      _rawData: party,
      ...listExtras(party),
      ...readConfigFields(party, config),
    };
  });

export const useContacts = ({ config, accountId }: UseContactsDataProps) => {
  const queryClient = useQueryClient();
  const queryKey = ["parties", accountId];

  const [view, setView] = useAtom(moduleViewAtom);

  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<
    string,
    any
  > | null>(null);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  const { data = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });
      const relatedPartyIds = new Set(
        result.parties.flatMap((p: any) =>
          (p.relatedContacts || []).map((rc: any) => rc.relatedParty?.id).filter(Boolean),
        ),
      );
      const topLevelParties = result.parties.filter(
        (p: any) => !relatedPartyIds.has(p.id),
      );
      return transformParties(topLevelParties, config);
    },
    enabled: !!accountId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // Ids created during a failed add, so a retry updates them instead of creating duplicates.
  const createdPartyIdRef = useRef<number | null>(null);
  const createdAddressIdsRef = useRef<Record<number, number>>({});
  const createdPhoneIdsRef = useRef<Record<number, number>>({});
  const resetCreatedRefs = () => {
    createdPartyIdRef.current = null;
    createdAddressIdsRef.current = {};
    createdPhoneIdsRef.current = {};
  };

  const transformFormDataToGraphQL = (formData: any) => {
    const result: any = { accountId };
    config.fields.forEach((f) => {
      // The vendor tab's fields always hold starting values (so adding VENDOR shows defaults),
      // so a hidden one would otherwise write vendorInfo for every non-vendor contact.
      if (!f.graphqlKey || !isFieldShown(f, formData)) return;
      const raw = formData[f.id];
      const val = f.toGraphQL ? f.toGraphQL(raw) : raw;
      if (val !== undefined && val !== null && val !== "") {
        assignGraphQLValue(result, f.graphqlKey, val);
      } else if (f.clearable && view === "edit" && String(raw ?? "").trim() === "") {
        // The BE only skips null, so "" is the only way to empty a column that held a value.
        const loaded = selectedItem?.[f.id];
        if (loaded !== undefined && loaded !== null && String(loaded) !== "") {
          assignGraphQLValue(result, f.graphqlKey, "");
        }
      }
    });
    return result;
  };

  const saveAddresses = async (
    partyId: number,
    addresses: AddressEntry[],
    isNew: boolean,
  ) => {
    if (!isNew) {
      const currentPartyAddressIds = new Set(
        addresses.map((a) => a._partyAddressId).filter(Boolean),
      );
      const initialRaw: any[] =
        (selectedItem as any)?._rawData?.addresses || [];
      for (const rawAddr of initialRaw) {
        const paId = rawAddr.id ? parseInt(rawAddr.id, 10) : null;
        if (paId && !currentPartyAddressIds.has(paId)) {
          await executeGraphQL(DELETE_PARTY_ADDRESS_MUTATION, { id: paId });
        }
      }
    }

    for (const [index, addr] of addresses.entries()) {
      if (!addr.address && !addr.city) continue;
      const createdAddressId = isNew ? createdAddressIdsRef.current[index] : undefined;
      if (createdAddressId) {
        await executeGraphQL(UPDATE_ADDRESS_MUTATION, {
          id: createdAddressId,
          line1: addr.address || undefined,
          line2: addr.addressLine2 || undefined,
          city: addr.city || undefined,
          stateCode: addr.state || undefined,
          postalCode: addr.zip || undefined,
        });
      } else if (!isNew && addr._addressId) {
        await executeGraphQL(UPDATE_ADDRESS_MUTATION, {
          id: addr._addressId,
          line1: addr.address || undefined,
          line2: addr.addressLine2 || undefined,
          city: addr.city || undefined,
          stateCode: addr.state || undefined,
          postalCode: addr.zip || undefined,
        });
      } else {
        const addressResult = await executeGraphQL(CREATE_ADDRESS_MUTATION, {
          line1: addr.address,
          line2: addr.addressLine2 || undefined,
          city: addr.city,
          stateCode: addr.state || undefined,
          postalCode: addr.zip || undefined,
        });
        const addressId = parseInt(addressResult.createAddress.address.id, 10);
        await executeGraphQL(CREATE_PARTY_ADDRESS_MUTATION, {
          accountId,
          partyId,
          addressId,
          addressType: addr.type,
          isPrimary: addr.type === "Physical",
        });
        if (isNew) createdAddressIdsRef.current[index] = addressId;
      }
    }
  };

  const savePhones = async (
    partyId: number,
    phones: PhoneEntry[],
    isNew: boolean,
  ) => {
    if (!isNew) {
      const currentPartyPhoneIds = new Set(
        phones.map((p) => p._partyPhoneId).filter(Boolean),
      );
      const initialRaw: any[] = (selectedItem as any)?._rawData?.phones || [];
      for (const rawPhone of initialRaw) {
        const ppId = rawPhone.id ? parseInt(rawPhone.id, 10) : null;
        if (ppId && !currentPartyPhoneIds.has(ppId)) {
          await executeGraphQL(DELETE_PARTY_PHONE_MUTATION, { id: ppId });
        }
      }
    }

    for (const [index, phone] of phones.entries()) {
      if (!phone.number) continue;
      const createdPhoneId = isNew ? createdPhoneIdsRef.current[index] : undefined;
      if (createdPhoneId) {
        await executeGraphQL(UPDATE_PHONE_MUTATION, { id: createdPhoneId, number: phone.number });
      } else if (!isNew && phone._phoneId) {
        const original = ((selectedItem as any)?._rawData?.phones || []).find(
          (p: any) => parseInt(p.id, 10) === phone._partyPhoneId,
        );
        if (original && original.phone?.number !== phone.number) {
          await executeGraphQL(UPDATE_PHONE_MUTATION, {
            id: phone._phoneId,
            number: phone.number,
          });
        }
      } else {
        const phoneResult = await executeGraphQL(CREATE_PHONE_MUTATION, {
          number: phone.number,
        });
        const phoneId = parseInt(phoneResult.createPhone.phone.id, 10);
        await executeGraphQL(CREATE_PARTY_PHONE_MUTATION, {
          accountId,
          partyId,
          phoneId,
          phoneType: phone.type,
          isPrimary: false,
        });
        if (isNew) createdPhoneIdsRef.current[index] = phoneId;
      }
    }
  };

  /** Resolves to the saved party's id, or null when the save failed (saveError is set). */
  const handleSave = async (
    formData: any,
    addresses: AddressEntry[],
    phones: PhoneEntry[],
  ): Promise<number | null> => {
    try {
      const variables = transformFormDataToGraphQL(formData);
      const {
        line1,
        line2,
        city,
        stateCode,
        postalCode,
        addressType,
        ...partyVariables
      } = variables;

      // The form has no last-name field, so imported parties keep the one they were loaded with.
      const nameLast = partyVariables.nameLast || selectedItem?._rawData?.nameLast;
      const nameFull = [partyVariables.nameFirst, partyVariables.nameMiddle, nameLast]
        .filter(Boolean)
        .join(" ");

      const isNew = view === "add";
      let savedPartyId: number;
      if (isNew && createdPartyIdRef.current == null) {
        const partyResult = await executeGraphQL(CREATE_PARTY_MUTATION, {
          ...partyVariables,
          partyTypes: partyVariables.partyTypes ?? [],
          nameFull,
        });
        savedPartyId = parseInt(partyResult.createParty.party.id, 10);
        createdPartyIdRef.current = savedPartyId;
      } else {
        savedPartyId = isNew ? createdPartyIdRef.current! : parseInt(selectedItem?.id, 10);
        // notes isn't sent: updateParty only writes the arguments it's given, so the BE notes
        // (shown as the oldest entry in the comment log) are left as they are.
        await executeGraphQL(UPDATE_PARTY_MUTATION, {
          id: savedPartyId,
          ...partyVariables,
          nameFull,
        });
      }
      await saveAddresses(savedPartyId, addresses, isNew);
      await savePhones(savedPartyId, phones, isNew);

      resetCreatedRefs();
      await invalidate();
      setView("list");
      setSelectedItem(null);
      return savedPartyId;
    } catch (error) {
      console.error("Failed to save party:", error);
      setSaveError((error as Error).message);
      return null;
    }
  };

  const handleDelete = (item: any) => setPendingDeleteItem(item);

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      for (const contact of pendingDeleteItem.contacts ?? []) {
        if (contact._relatedPartyId) {
          await executeGraphQL(DELETE_PARTY_MUTATION, {
            id: contact._relatedPartyId,
          });
        }
      }
      await executeGraphQL(DELETE_PARTY_MUTATION, {
        id: parseInt(pendingDeleteItem.id, 10),
      });
      await invalidate();
    } catch (error) {
      console.error("Failed to delete party:", error);
      setSaveError((error as Error).message);
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const cancelDelete = () => setPendingDeleteItem(null);

  /** The new text, "" when it was emptied from a loaded value (the BE ignores null), else undefined. */
  const clearableText = (next: string | undefined, loaded: string | undefined) =>
    next ? next : loaded ? "" : undefined;

  const buildContactName =(c: Omit<Contact, "id">) =>
    [c.nameFirst, c.nameMiddle, c.nameLast].filter(Boolean).join(" ");

  const saveContactAddress = async (partyId: number, contact: Omit<Contact, "id">) => {
    if (!contact.address || !contact.city || !contact.state) return;

    const addressResult = await executeGraphQL(CREATE_ADDRESS_MUTATION, {
      line1: contact.address,
      line2: contact.addressLine2 || undefined,
      city: contact.city,
      stateCode: contact.state,
      postalCode: contact.zip || undefined,
    });
    await executeGraphQL(CREATE_PARTY_ADDRESS_MUTATION, {
      accountId,
      partyId,
      addressId: parseInt(addressResult.createAddress.address.id, 10),
      addressType: contact.addressType?.[0] || "Mailing",
      isPrimary: true,
    });
  };

  const saveContactPhone = async (partyId: number, contact: Omit<Contact, "id">) => {
    if (!contact.phone) return;

    const phoneResult = await executeGraphQL(CREATE_PHONE_MUTATION, {
      number: contact.phone,
    });
    await executeGraphQL(CREATE_PARTY_PHONE_MUTATION, {
      accountId,
      partyId,
      phoneId: parseInt(phoneResult.createPhone.phone.id, 10),
      phoneType: "Work",
      isPrimary: true,
    });
  };

  const updateContactPhone = async (
    partyId: number,
    contact: Omit<Contact, "id">,
    existing?: Contact,
  ) => {
    if (existing?._phoneId) {
      if (contact.phone === (existing.phone ?? "")) return;
      await executeGraphQL(UPDATE_PHONE_MUTATION, {
        id: existing._phoneId,
        number: contact.phone,
      });
      return;
    }
    await saveContactPhone(partyId, contact);
  };

  const updateContactAddress = async (
    partyId: number,
    contact: Omit<Contact, "id">,
    existing?: Contact,
  ) => {
    if (!contact.address || !contact.city || !contact.state) return;
    if (existing?._addressId) {
      await executeGraphQL(UPDATE_ADDRESS_MUTATION, {
        id: existing._addressId,
        line1: contact.address,
        line2: contact.addressLine2 || undefined,
        city: contact.city,
        stateCode: contact.state,
        postalCode: contact.zip || undefined,
      });
      return;
    }
    await saveContactAddress(partyId, contact);
  };

  const handleAddContact = async (contact: Omit<Contact, "id">) => {
    if (!selectedItem?.id) return;
    try {
      const partyResult = await executeGraphQL(CREATE_PARTY_MUTATION, {
        accountId,
        partyTypes: ["EMPLOYEE"],
        nameFull: buildContactName(contact),
        nameFirst: contact.nameFirst,
        nameMiddle: contact.nameMiddle || undefined,
        nameLast: contact.nameLast,
        email: contact.email || undefined,
      });
      const relatedPartyId = parseInt(partyResult.createParty.party.id, 10);
      await saveContactPhone(relatedPartyId, contact);
      await saveContactAddress(relatedPartyId, contact);

      const relationshipResult = await executeGraphQL(
        CREATE_PARTY_RELATIONSHIP_MUTATION,
        {
          accountId,
          partyId: parseInt(selectedItem.id, 10),
          relatedPartyId,
          relationshipType: "internal_contact",
          notes: contact.role || undefined,
          isPrimary: false,
        },
      );
      const newId = parseInt(
        relationshipResult.createPartyRelationship.partyRelationship.id,
        10,
      );
      setContacts((prev: Contact[]) => [
        ...prev,
        { id: newId, _relatedPartyId: relatedPartyId, ...contact },
      ]);
      await invalidate();
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const handleUpdateContact = async (
    id: number,
    contact: Omit<Contact, "id">,
  ) => {
    try {
      const existing = contacts.find((c: Contact) => c.id === id);
      if (existing?._relatedPartyId) {
        await executeGraphQL(UPDATE_PARTY_MUTATION, {
          id: existing._relatedPartyId,
          nameFull: buildContactName(contact),
          nameFirst: contact.nameFirst,
          nameMiddle: clearableText(contact.nameMiddle, existing.nameMiddle),
          nameLast: contact.nameLast,
          email: clearableText(contact.email, existing.email),
        });
        await updateContactPhone(existing._relatedPartyId, contact, existing);
        await updateContactAddress(existing._relatedPartyId, contact, existing);
      }
      await executeGraphQL(UPDATE_PARTY_RELATIONSHIP_MUTATION, {
        id,
        relationshipType: "internal_contact",
        notes: clearableText(contact.role, existing?.role),
      });
      setContacts((prev: Contact[]) =>
        prev.map((c: Contact) =>
          c.id === id
            ? {
                id,
                _relatedPartyId: c._relatedPartyId,
                _phoneId: c._phoneId,
                _addressId: c._addressId,
                ...contact,
              }
            : c,
        ),
      );
      await invalidate();
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await executeGraphQL(DELETE_PARTY_RELATIONSHIP_MUTATION, { id });
      setContacts((prev: Contact[]) =>
        prev.filter((c: Contact) => c.id !== id),
      );
      await invalidate();
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((item: Record<string, any>) => matchesSearch(item, searchTerm));
  }, [data, searchTerm]);

  return {
    data,
    loading,
    view,
    searchTerm,
    selectedItem,
    saveError,
    clearSaveError: () => setSaveError(null),
    pendingDeleteItem,
    confirmDelete,
    cancelDelete,
    filteredData,
    setSearchTerm,
    handleAdd: () => {
      resetCreatedRefs();
      setSelectedItem(null);
      setView("add");
    },
    handleEdit: (item: Record<string, any>) => {
      resetCreatedRefs();
      setSelectedItem(item);
      setContacts((item.contacts as ContactPerson[]) || []);
      setSaveError(null);
      setView("edit");
    },
    contacts,
    handleAddContact,
    handleUpdateContact,
    handleDeleteContact,
    handleSave,
    handleDelete,
    handleCancel: () => {
      resetCreatedRefs();
      setView("list");
      setSelectedItem(null);
      setSaveError(null);
    },
  };
};
