import { useState, useEffect, useMemo } from "react";
import { ModuleConfig } from "../config/directoryConfig";
import {
  FETCH_PARTIES,
  CREATE_PARTY_MUTATION,
  UPDATE_PARTY_MUTATION,
  DELETE_PARTY_MUTATION,
  CREATE_ADDRESS_MUTATION,
  UPDATE_ADDRESS_MUTATION,
  CREATE_PARTY_ADDRESS_MUTATION,
} from "../graphql/Directory";

import { API_URL } from "../lib/api";

const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

interface UseDirectoryDataProps {
  config: ModuleConfig;
  accountId: number;
}

export const useDirectory = ({ config, accountId }: UseDirectoryDataProps) => {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Record<string, any> | null>(null);

  const executeGraphQL = async (query: string, variables: any = {}) => {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error("GraphQL Error:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await executeGraphQL(FETCH_PARTIES, { accountId });

      // Transform GraphQL data to match frontend format
      const transformedData = result.parties.map((party: any) => ({
        id: party.id,
        nameIdType: "auto", // TODO: read from backend when custom name ID is supported
        nameId: `PARTY-${party.id}`,
        name: party.nameFull,
        classifications: [party.partyType], // Convert single type to array for consistency
        email: party.email,
        phone: party.phone,       // for list display
        phoneNumber: party.phone, // for form field
        city: party.addresses?.[0]?.address?.city || "",
        state: party.addresses?.[0]?.address?.stateCode || "",
        status: party.isActive ? "Active" : "Inactive",
        // Address fields for form pre-fill on edit
        address: party.addresses?.[0]?.address?.line1 || "",
        addressLine2: party.addresses?.[0]?.address?.line2 || "",
        zip: party.addresses?.[0]?.address?.postalCode || "",
        addressTypes: party.addresses?.[0]?.addressType
          ? [party.addresses[0].addressType]
          : [],
        // Include full data for editing
        _rawData: party,
      }));

      setData(transformedData);
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build GraphQL variables from form data using field config mappings
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

  const handleSave = async (formData: any) => {
    try {
      const variables = transformFormDataToGraphQL(formData);

      const { line1, line2, city, stateCode, postalCode, addressType, ...partyVariables } = variables;
      const hasAddress = line1 || city || stateCode;

      if (view === "add") {
        const partyResult = await executeGraphQL(CREATE_PARTY_MUTATION, partyVariables);
        const partyId = parseInt(partyResult.createParty.party.id, 10);

        if (hasAddress) {
          const addressResult = await executeGraphQL(CREATE_ADDRESS_MUTATION, {
            line1, line2, city, stateCode, postalCode,
          });
          const addressId = parseInt(addressResult.createAddress.address.id, 10);

          await executeGraphQL(CREATE_PARTY_ADDRESS_MUTATION, {
            accountId,
            partyId,
            addressId,
            addressType: addressType || "Physical",
            isPrimary: true,
          });
        }
      } else {
        await executeGraphQL(UPDATE_PARTY_MUTATION, {
          id: parseInt(selectedItem?.id, 10),
          ...partyVariables,
        });
      }

      await fetchData();
      setView("list");
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to save party:", error);
      setSaveError((error as Error).message);
    }
  };

  const handleDelete = (item: any) => {
    setPendingDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await executeGraphQL(DELETE_PARTY_MUTATION, { id: parseInt(pendingDeleteItem.id, 10) });
      await fetchData();
    } catch (error) {
      console.error("Failed to delete party:", error);
      setSaveError((error as Error).message);
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const cancelDelete = () => setPendingDeleteItem(null);

  const SEARCH_FIELDS = ["name", "nameId", "address", "city", "state", "zip"];

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const searchLower = searchTerm.toLowerCase();

    return data.filter((item) => {
      return SEARCH_FIELDS.some((fieldId) => {
        const value = item[fieldId];

        if (Array.isArray(value)) {
          return value.some((v) =>
            v?.toString().toLowerCase().includes(searchLower),
          );
        }

        return value?.toString().toLowerCase().includes(searchLower);
      });
    });
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
      setView("edit");
    },
    handleSave,
    handleDelete,
    handleCancel: () => {
      setView("list");
      setSelectedItem(null);
    },
  };
};
