import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { moduleViewAtom } from "../atoms/NavigationAtom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_PARTIES,
  CREATE_PARTY_MUTATION,
  UPDATE_PARTY_MUTATION,
  DELETE_PARTY_MUTATION,
  CREATE_ADDRESS_MUTATION,
  UPDATE_ADDRESS_MUTATION,
  CREATE_PARTY_ADDRESS_MUTATION,
  DELETE_PARTY_ADDRESS_MUTATION,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
  CREATE_PHONE_MUTATION,
  UPDATE_PHONE_MUTATION,
  CREATE_PARTY_PHONE_MUTATION,
  DELETE_PARTY_PHONE_MUTATION,
} from "../graphql/Directory";
import { AddressEntry } from "../../components/FormComponents/MultiAddressField";
import { PhoneEntry } from "../../components/FormComponents/MultiPhoneField";
import { Contact } from "../../components/FormComponents/ContactsTab";

import { API_URL } from "../lib/api";

const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

interface UseDirectoryDataProps {
  config: ModuleConfig;
  accountId: number;
}

const executeGraphQL = async (query: string, variables: any = {}) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
};

const transformParties = (parties: any[]) =>
  parties.map((party: any) => {
    const primaryPhone =
      party.phones?.find((p: any) => p.isPrimary)?.phone?.number ||
      party.phones?.[0]?.phone?.number ||
      null;
    return {
      id: party.id,
      name: party.nameFull,
      nameLine1: party.nameFirst || "",
      nameLine2: party.nameMiddle || "",
      classifications: party.partyType ? String(party.partyType).split(",").filter(Boolean) : [],
      email: party.email,
      phone: primaryPhone,
      phoneNumber: primaryPhone,
      city: party.addresses?.[0]?.address?.city || "",
      state: party.addresses?.[0]?.address?.stateCode || "",
      status: party.isActive ? "Active" : "Inactive",
      address: party.addresses?.[0]?.address?.line1 || "",
      addressLine2: party.addresses?.[0]?.address?.line2 || "",
      zip: party.addresses?.[0]?.address?.postalCode || "",
      addressTypes: party.addresses?.[0]?.addressType
        ? [party.addresses[0].addressType]
        : [],
      _rawData: party,
    };
  });

export const useDirectory = ({ config, accountId }: UseDirectoryDataProps) => {
  const queryClient = useQueryClient();
  const queryKey = ["parties", accountId];

  const [view, setView] = useAtom(moduleViewAtom);

  useEffect(() => () => setView("list"), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const { data = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });
      return transformParties(result.parties);
    },
    enabled: !!accountId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const transformFormDataToGraphQL = (formData: any) => {
    const result: any = { accountId };
    config.fields.forEach((f) => {
      if (!f.graphqlKey) return;
      const raw = formData[f.id];
      const val = f.toGraphQL ? f.toGraphQL(raw) : raw;
      if (val !== undefined && val !== null && val !== "") {
        result[f.graphqlKey] = val;
      }
    });
    return result;
  };

  const saveAddresses = async (partyId: number, addresses: AddressEntry[], isNew: boolean) => {
    if (!isNew) {
      const currentPartyAddressIds = new Set(
        addresses.map((a) => a._partyAddressId).filter(Boolean)
      );
      const initialRaw: any[] = (selectedItem as any)?._rawData?.addresses || [];
      for (const rawAddr of initialRaw) {
        const paId = rawAddr.id ? parseInt(rawAddr.id, 10) : null;
        if (paId && !currentPartyAddressIds.has(paId)) {
          await executeGraphQL(DELETE_PARTY_ADDRESS_MUTATION, { id: paId });
        }
      }
    }

    for (const addr of addresses) {
      if (!addr.address && !addr.city) continue;
      if (!isNew && addr._addressId) {
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
          stateCode: addr.state,
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
      }
    }
  };

  const savePhones = async (partyId: number, phones: PhoneEntry[], isNew: boolean) => {
    if (!isNew) {
      const currentPartyPhoneIds = new Set(phones.map((p) => p._partyPhoneId).filter(Boolean));
      const initialRaw: any[] = (selectedItem as any)?._rawData?.phones || [];
      for (const rawPhone of initialRaw) {
        const ppId = rawPhone.id ? parseInt(rawPhone.id, 10) : null;
        if (ppId && !currentPartyPhoneIds.has(ppId)) {
          await executeGraphQL(DELETE_PARTY_PHONE_MUTATION, { id: ppId });
        }
      }
    }

    for (const phone of phones) {
      if (!phone.number) continue;
      if (!isNew && phone._phoneId) {
        const original = ((selectedItem as any)?._rawData?.phones || []).find(
          (p: any) => parseInt(p.id, 10) === phone._partyPhoneId
        );
        if (original && original.phone?.number !== phone.number) {
          await executeGraphQL(UPDATE_PHONE_MUTATION, { id: phone._phoneId, number: phone.number });
        }
      } else {
        const phoneResult = await executeGraphQL(CREATE_PHONE_MUTATION, { number: phone.number });
        const phoneId = parseInt(phoneResult.createPhone.phone.id, 10);
        await executeGraphQL(CREATE_PARTY_PHONE_MUTATION, {
          accountId,
          partyId,
          phoneId,
          phoneType: phone.type,
          isPrimary: false,
        });
      }
    }
  };

  const handleSave = async (
    formData: any,
    addresses: AddressEntry[],
    phones: PhoneEntry[]
  ) => {
    try {
      const variables = transformFormDataToGraphQL(formData);
      const { line1, line2, city, stateCode, postalCode, addressType, ...partyVariables } = variables;

      const nameFull = [partyVariables.nameFirst, partyVariables.nameMiddle, partyVariables.nameLast]
        .filter(Boolean)
        .join(" ");

      if (view === "add") {
        const partyResult = await executeGraphQL(CREATE_PARTY_MUTATION, {
          ...partyVariables,
          nameFull,
        });
        const partyId = parseInt(partyResult.createParty.party.id, 10);
        await saveAddresses(partyId, addresses, true);
        await savePhones(partyId, phones, true);
      } else {
        const partyId = parseInt(selectedItem?.id, 10);
        await executeGraphQL(UPDATE_PARTY_MUTATION, {
          id: partyId,
          ...partyVariables,
          nameFull,
        });
        await saveAddresses(partyId, addresses, false);
        await savePhones(partyId, phones, false);
      }

      await invalidate();
      setView("list");
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to save party:", error);
      setSaveError((error as Error).message);
    }
  };

  const handleDelete = (item: any) => setPendingDeleteItem(item);

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await executeGraphQL(DELETE_PARTY_MUTATION, { id: parseInt(pendingDeleteItem.id, 10) });
      await invalidate();
    } catch (error) {
      console.error("Failed to delete party:", error);
      setSaveError((error as Error).message);
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const cancelDelete = () => setPendingDeleteItem(null);

  const buildContactName = (c: Omit<Contact, "id">) =>
    [c.nameFirst, c.nameMiddle, c.nameLast].filter(Boolean).join(" ");

  const handleAddContact = async (contact: Omit<Contact, "id">) => {
    if (!selectedItem?.id) return;
    const { nameFirst, nameMiddle, nameLast, ...rest } = contact;
    try {
      const result = await executeGraphQL(CREATE_CONTACT_MUTATION, {
        partyId: parseInt(selectedItem.id, 10),
        name: buildContactName(contact),
        ...rest,
      });
      const newId = parseInt(result.createContact.contact.id, 10);
      setContacts((prev) => [...prev, { id: newId, ...contact }]);
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const handleUpdateContact = async (id: number, contact: Omit<Contact, "id">) => {
    const { nameFirst, nameMiddle, nameLast, ...rest } = contact;
    try {
      await executeGraphQL(UPDATE_CONTACT_MUTATION, {
        id,
        name: buildContactName(contact),
        ...rest,
      });
      setContacts((prev) => prev.map((c) => (c.id === id ? { id, ...contact } : c)));
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await executeGraphQL(DELETE_CONTACT_MUTATION, { id });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const SEARCH_FIELDS = ["name", "nameId", "address", "city", "state", "zip"];

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const searchLower = searchTerm.toLowerCase();
    return data.filter((item) =>
      SEARCH_FIELDS.some((fieldId) => {
        const value = (item as Record<string, any>)[fieldId];
        if (Array.isArray(value)) {
          return value.some((v) => v?.toString().toLowerCase().includes(searchLower));
        }
        return value?.toString().toLowerCase().includes(searchLower);
      })
    );
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
      setSelectedItem(null);
      setView("add");
    },
    handleEdit: (item: Record<string, any>) => {
      setSelectedItem(item);
      setContacts((item.contacts as Contact[]) || []);
      setView("edit");
    },
    contacts,
    handleAddContact,
    handleUpdateContact,
    handleDeleteContact,
    handleSave,
    handleDelete,
    handleCancel: () => {
      setView("list");
      setSelectedItem(null);
    },
  };
};
